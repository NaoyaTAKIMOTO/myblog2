---
title: "Xのいいねを資産化！Chrome拡張 + pgvector + DINOv2で作る画像レコメンドシステム"
date: 2026-04-20T13:00:00+09:00
draft: false
tags: ["Next.js", "pgvector", "DINOv2", "Chrome拡張", "PostgreSQL", "TypeScript", "Docker", "AI"]
summary: "X（Twitter）でいいねした画像・動画を自動収集し、DINOv2の埋め込みベクトルとpgvectorで類似コンテンツをレコメンドするWebアプリを開発しました。Chrome拡張でいいねを収集し、VPSのDocker環境でセルフホストします。"
---

## はじめに

X（旧 Twitter）でいいねした画像を後から見返したいと思ったことはありませんか？

X の公式タイムラインは時系列で流れていくため、過去にいいねした画像を探し出すのは大変です。検索もできますが、画像の内容（構図・色・スタイル）での検索は不可能です。

そこで開発したのが **X Favorites Gallery** です。いいねした画像を自動収集し、AIで「この画像に似たコンテンツ」をレコメンドするシステムです。

## システムの全体像

```
Chrome拡張（X.comでいいね収集）
    ↓ API
Docker Compose（VPS）
├── Next.js（フロントエンド + APIルート）
├── PostgreSQL + pgvector（ベクトル検索DB）
└── Caddy（HTTPS + 静的ファイル配信）
    ↓
Workers（ローカル or VPS）
├── image-worker（画像ダウンロード・サムネイル生成）
├── clip-worker（DINOv2埋め込みベクトル生成）
└── color-worker（色特徴ヒストグラム生成）
```

## 技術スタック

| レイヤー | 技術 |
|---------|------|
| フロントエンド | Next.js 16 / React 19 / Tailwind CSS 3 |
| バックエンド | Next.js API Routes（App Router）|
| DB | PostgreSQL 16 + pgvector / Drizzle ORM |
| 認証 | Firebase Google OAuth + jose JWT（httpOnly cookie）|
| Chrome 拡張 | TypeScript + Vite（Manifest V3）|
| Workers | tsx スクリプト群 |
| インフラ | Docker Compose / Caddy |

## Chrome 拡張によるいいね収集

### Manifest V3 での実装

Chrome 拡張は Manifest V3 で実装しています。X.com のページ上で動作する Content Script が、いいねした投稿のデータ（画像URL・テキスト・ツイートID）を抽出してAPIに送信します。

```typescript
// content-script.ts
function extractTweetData(tweetElement: Element): TweetData | null {
    const imageUrls = [...tweetElement.querySelectorAll("img")]
        .map(img => img.src)
        .filter(src => src.includes("pbs.twimg.com/media"));

    const text = tweetElement.querySelector("[data-testid='tweetText']")
        ?.textContent ?? "";

    if (imageUrls.length === 0 && !text) return null;

    return {
        tweetId: extractTweetId(tweetElement),
        imageUrls,
        text,
        mediaType: imageUrls.length > 0 ? "image" : "text",
    };
}
```

### X-API-Key 認証

拡張機能から独自APIに投稿する際は、`X-API-Key` ヘッダーで認証します。ユーザーの Google OAuth セッションとは別に管理します。

## pgvector によるベクトル検索

pgvector は PostgreSQL の拡張機能で、ベクトル型カラムと近似最近傍探索（ANN）をサポートします。画像の意味的な類似度を高速に検索できます。

### スキーマ定義

```sql
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE images (
    id          BIGSERIAL PRIMARY KEY,
    tweet_id    TEXT UNIQUE NOT NULL,
    url         TEXT NOT NULL,
    file_path   TEXT,          -- ローカルに保存したファイルパス
    embedding   VECTOR(768),   -- DINOv2 の埋め込みベクトル
    color_hist  FLOAT[],       -- 色ヒストグラム特徴量
    created_at  TIMESTAMP DEFAULT NOW()
);

-- コサイン類似度インデックス
CREATE INDEX ON images USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);
```

## DINOv2 による画像埋め込み

DINOv2 は Meta が開発した自己教師あり学習の Vision Transformer です。画像から 768 次元の特徴ベクトルを生成でき、意味的に類似した画像（同じ構図・スタイル・被写体）を高精度で見つけられます。

```typescript
// workers/clip-worker.ts
import * as ort from "onnxruntime-node";

export async function generateEmbedding(imagePath: string): Promise<number[]> {
    const session = await ort.InferenceSession.create("dinov2_vitb14.onnx");
    const imageData = await preprocessImage(imagePath);  // 224×224 に正規化

    const feeds = { pixel_values: new ort.Tensor("float32", imageData, [1, 3, 224, 224]) };
    const results = await session.run(feeds);

    // CLS トークンの埋め込みを取得（768次元）
    return Array.from(results.last_hidden_state.data as Float32Array).slice(0, 768);
}
```

### 類似画像検索

pgvector のコサイン類似度演算子（`<=>`）で最近傍を取得します。

```typescript
// 類似画像 TOP10 を取得
const similar = await db.execute(sql`
    SELECT id, url, 1 - (embedding <=> ${queryEmbedding}::vector) AS similarity
    FROM images
    WHERE id != ${targetId}
    ORDER BY embedding <=> ${queryEmbedding}::vector
    LIMIT 10
`);
```

## 動画への対応

動画ツイートはサムネイル（poster）画像を生成し、画像と同じパイプラインでベクトル化します。

```typescript
// workers/image-worker.ts（動画サムネイル生成）
import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

async function generateVideoThumbnail(videoPath: string, outputPath: string): Promise<void> {
    await execFileAsync("ffmpeg", [
        "-i", videoPath,
        "-ss", "00:00:01",   // 1秒目のフレームを取得
        "-vframes", "1",
        "-q:v", "2",
        outputPath,
    ]);
}
```

## Drizzle ORM でのスキーマ管理

Drizzle ORM を使ってタイプセーフにDBを操作します。TypeScript の型推論が効くため、SQLクエリのミスを事前に防げます。

```typescript
// db/schema.ts
import { pgTable, bigserial, text, vector, timestamp } from "drizzle-orm/pg-core";

export const images = pgTable("images", {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    tweetId: text("tweet_id").unique().notNull(),
    url: text("url").notNull(),
    filePath: text("file_path"),
    embedding: vector("embedding", { dimensions: 768 }),
    createdAt: timestamp("created_at").defaultNow(),
});
```

## Firebase + jose JWT 認証

ユーザー認証は Firebase Google OAuth を使い、取得した ID トークンをバックエンドで jose を使って検証します。JWT を httpOnly cookie に保存することで、XSS 攻撃からトークンを守ります。

```typescript
// app/api/auth/route.ts
import { SignJWT, jwtVerify } from "jose";

export async function POST(request: Request) {
    const { idToken } = await request.json();

    // Firebase ID トークンを検証
    const decodedToken = await admin.auth().verifyIdToken(idToken);

    // 独自 JWT を発行して httpOnly cookie にセット
    const jwt = await new SignJWT({ uid: decodedToken.uid })
        .setProtectedHeader({ alg: "HS256" })
        .setExpirationTime("7d")
        .sign(new TextEncoder().encode(process.env.AUTH_SECRET));

    const response = NextResponse.json({ success: true });
    response.cookies.set("auth-token", jwt, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        maxAge: 60 * 60 * 24 * 7,
    });
    return response;
}
```

## インフラ構成（Docker Compose + Caddy）

VPS 上で Docker Compose を使ってセルフホストしています。Caddy が HTTPS 証明書の自動取得と静的ファイル配信を担います。

```yaml
# docker-compose.yml（抜粋）
services:
  app:
    build: .
    environment:
      - DATABASE_URL=postgresql://postgres:${POSTGRES_PASSWORD}@db:5432/xfav

  db:
    image: pgvector/pgvector:pg16
    volumes:
      - postgres_data:/var/lib/postgresql/data

  caddy:
    image: caddy:2-alpine
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - image_data:/srv/images  # 画像ファイルを静的配信
```

## まとめ

X Favorites Gallery の実装で学んだポイント：

1. **pgvector** を使えば PostgreSQL だけで高度なベクトル検索が実現できる
2. **DINOv2** は事前学習済みONNXモデルを使えば Python 不要で埋め込み生成が可能
3. **Chrome 拡張（MV3）** でWebサービスのデータを安全に収集できる
4. **httpOnly cookie + jose** でXSS に強いJWT認証を実装できる
5. **Caddy** は証明書管理を自動化してくれるため、セルフホストが格段に楽になる

「見た画像を忘れない」「似た画像をすぐ見つける」という目的のために、AI（DINOv2）とベクトルDB（pgvector）を組み合わせることで実用的なレコメンドシステムが作れました。

---

**ベクトル検索・AIアプリ開発でお困りのことはありませんか？**

技術相談や開発サポートを承っています。お気軽にご相談ください。

[ココナラで開発相談を依頼する](https://coconala.com/users/1993863)
