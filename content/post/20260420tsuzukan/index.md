---
title: "漫画の続刊を買い忘れない！Go + Reactで作った続刊管理Webアプリ「tsuzukan」"
date: 2026-04-20T12:00:00+09:00
draft: false
tags: ["Go", "React", "PostgreSQL", "Firebase", "楽天API", "openBD", "TypeScript", "Gin"]
summary: "手持ちの漫画・小説の続刊をピックアップし、Amazon/楽天のカート追加URLを自動生成するWebアプリ「tsuzukan（続刊）」を開発しました。Amazon・楽天の購入履歴CSVをインポートしてシリーズ管理し、新刊が出たら即カートに追加できます。"
---

## はじめに

「あの漫画、続きが出てたのに気づかなかった……」

本好きの方なら一度は経験があるのではないでしょうか。Kindle や楽天で気になった巻だけ買うと、続刊の通知が来ないことがよくあります。

この問題を解決するために開発したのが **tsuzukan（続刊）** です。手持ちの漫画・小説を管理し、続刊が出ていれば Amazon/楽天のカートURLを自動生成して素早く購入できるようにします。

## アプリの機能

### 書籍の登録方法

3つの方法で書籍を登録できます。

**1. Amazon 購入履歴 CSV インポート**
Amazonの注文履歴CSVをアップロードするだけで、過去に購入した本を一括登録。ISBNを自動抽出してシリーズを特定します。

**2. 楽天ブックス 購入履歴 CSV インポート**
「楽天履歴管理」Chrome拡張機能でエクスポートしたCSVをインポートできます。

**3. QRコードスキャン**
本の裏にあるバーコードをスマホカメラでスキャン（html5-qrcode）して登録できます。

### シリーズ管理

登録した本は自動的にシリーズ（例：「進撃の巨人」）にグループ化されます。

- **openBD API** でISBNから書影・書誌情報を取得
- **楽天ブックスAPI** で続刊情報を検索
- 「次の巻が出ているか」を自動チェック
- 続刊があれば Amazon/楽天のカートURLを生成

### カート追加URL生成

続刊が見つかると、ワンクリックで購入ページへジャンプできるURLを自動生成します。

```
楽天ブックス: https://books.rakuten.co.jp/rb/XXXXXXXXX/
Amazon: https://www.amazon.co.jp/dp/XXXXXXXXXX
```

## 技術スタック

| レイヤー | 技術 |
|---------|------|
| バックエンド | Go 1.21+ / Gin |
| フロントエンド | React 19 + TypeScript + Vite |
| データベース | PostgreSQL（Docker） |
| 認証 | Firebase Auth（JWT ミドルウェア） |
| 状態管理 | TanStack Query |
| スタイル | Tailwind CSS v4 |
| テスト | Vitest / Go testing |
| マイグレーション | golang-migrate |

## アーキテクチャ

```
cmd/server/main.go        # エントリポイント・DI
internal/
├── handler/              # HTTPハンドラ（Ginルート）
├── service/              # ビジネスロジック
├── repository/           # DBアクセス（PostgreSQL）
├── model/                # データモデル
├── client/               # 外部APIクライアント
│   ├── openbd.go         # openBD API（書誌情報取得）
│   └── rakuten.go        # 楽天ブックスAPI（続刊検索）
├── ratelimit/            # 外部APIレート制限
└── middleware/           # Firebase JWT 認証
frontend/src/
├── pages/                # ルートコンポーネント
├── components/           # 再利用コンポーネント
├── hooks/                # React Query hooks
└── api/client.ts         # Axios APIクライアント
```

### 外部APIクライアントの設計

openBD と楽天ブックスの API クライアントは、テスト容易性のためにインターフェースで抽象化しています。

```go
// internal/client/rakuten.go
type RakutenBooksClient interface {
    SearchByISBN(ctx context.Context, isbn string) (*BookInfo, error)
    SearchByTitle(ctx context.Context, title string) ([]BookInfo, error)
}

// テスト時はモックサーバーに差し替え可能
type rakutenBooksClient struct {
    baseURL    string
    appID      string
    httpClient *http.Client
}

func WithBaseURL(url string) Option {
    return func(c *rakutenBooksClient) {
        c.baseURL = url
    }
}
```

### TanStack Query でのデータ取得

フロントエンドでは TanStack Query でサーバー状態を管理。キャッシュと楽観的更新でUXを向上させています。

```typescript
// 続刊チェック
export function useSeriesWithUpdates(seriesId: string) {
    return useQuery({
        queryKey: ["series", seriesId, "updates"],
        queryFn: () => api.getSeriesUpdates(seriesId),
        staleTime: 1000 * 60 * 30, // 30分キャッシュ
    });
}
```

### ISBNの正規化処理

AmazonのCSVではISBNの表記ゆれ（スペース・ハイフン混在）が多いため、専用のクリーニング処理を実装しています。

```go
// 正規化: "978-4-08-884590-2" → "9784088845902"
func normalizeISBN(isbn string) string {
    re := regexp.MustCompile(`[^0-9X]`)
    return re.ReplaceAllString(strings.ToUpper(isbn), "")
}
```

### QRコードスキャン

iPad やスマホのカメラでバーコードを読み取って書籍登録できます。`html5-qrcode` ライブラリを使い、読み取った ISBN でそのまま書籍情報を検索します。

```typescript
import { Html5QrcodeScanner } from "html5-qrcode";

const scanner = new Html5QrcodeScanner("reader", {
    fps: 10,
    qrbox: { width: 250, height: 250 },
});

scanner.render((isbn) => {
    searchBookByISBN(isbn);
});
```

## テスト戦略

バックエンドのテストは3層に分けています。

```bash
# ユニットテスト（service層）
go test ./internal/service/...

# インテグレーションテスト（repository層・実DB使用）
make test-integration-auto  # テストDB自動セットアップ

# カバレッジ確認
make test-coverage
```

インテグレーションテストでは実際のPostgreSQLコンテナを使います。モックDBと本番DBで挙動が変わるバグを防ぐためです。

## 運用状況

本番環境は Docker Compose + nginx でセルフホストしています。Firebase Auth によるGoogle認証で、招待したメンバーだけが使えるプライベートアプリとして運用しています。

バックアップスクリプトで定期的に PostgreSQL のダンプを保存し、データ消失リスクを軽減しています。

```bash
# scripts/shell/backup.sh
pg_dump -h localhost tsuzukan > backup_$(date +%Y%m%d_%H%M%S).sql
```

## 実際に使ってみた

手持ちの漫画約200冊のAmazon購入履歴をインポートしたところ、**続きが出ているのに気づいていなかった巻が6冊**見つかりました。即座に楽天カートに追加できて、読書体験が改善されました。

## まとめ

tsuzukan は「続刊の買い忘れ」というシンプルな課題を解決するためのWebアプリです。技術面では：

- **Go + Gin** で型安全なAPIを構築
- **openBD / 楽天ブックスAPI** で書誌・続刊情報を自動取得
- **Firebase Auth** でセキュアなプライベートアプリを実現
- **golang-migrate** でDB変更を安全に管理

小さな問題でも、自分で解決するツールを作ることで毎日の生活が少し快適になります。本好きの方はぜひ参考にしてみてください。

---

**Webアプリ開発でお困りのことはありませんか？**

技術相談や開発サポートを承っています。お気軽にご相談ください。

[ココナラで開発相談を依頼する](https://coconala.com/users/1993863)
