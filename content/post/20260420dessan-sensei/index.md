---
title: "ローカルLLMでデッサン添削アプリを作った！Ollama + Qwen3.5 + Go + Reactの構成"
date: 2026-04-20T10:00:00+09:00
draft: false
tags: ["Ollama", "VLM", "Go", "React", "SQLite", "AI", "ローカルLLM", "TypeScript"]
summary: "Ollama上で動くVLM（Qwen3.5）を使ってデッサン添削Webアプリを開発しました。iPadから写真を撮ってアップロードするだけで、AIが6つの評価項目ごとに10点満点でスコアとアドバイスを返します。クラウドAPIを使わないため、絵の内容が外部に送信されることもありません。"
---

## はじめに

デッサンの練習をしていると、「自分の絵のどこが悪いのか客観的に知りたい」という場面があります。絵の先生に見てもらえれば一番ですが、毎日見てもらうわけにもいきません。

そこで、**ローカルで動く Vision Language Model（VLM）を使ってデッサン添削 Web アプリを作りました**。アプリ名は「デッサン先生」です。

クラウドAPIを使わず、自分のMac上だけで完結するため、描いた絵が外部に送信されることはありません。

## アプリの機能

### 添削機能

iPad のカメラで撮影した画像をアップロードするだけで、AI が以下の6項目を評価します。

| 評価項目 | 内容 |
|---------|------|
| プロポーション | 対象の形状・比率の正確さ |
| 陰影・トーン | 光源を意識した明暗表現 |
| 構図 | 画面内の配置とバランス |
| 線の質 | 線の強弱・流れ・迷い線の有無 |
| 立体感 | 面の意識、立体としての説得力 |
| 全体の完成度 | 作品としてのまとまり |

各項目は10点満点でスコアリングされ、具体的なアドバイスが添えられます。

### その他の機能

- **添削履歴**: 過去の添削結果を一覧・詳細表示・削除
- **指導項目カスタマイズ**: Web UI から評価軸を自由に追加・編集・削除
- **iPad カメラ直接対応**: `input[type="file"] accept="image/*" capture="environment"` でカメラ起動

## 技術スタック

| レイヤー | 技術 |
|---------|------|
| バックエンド | Go 1.22+（net/http） |
| フロントエンド | React + Vite + TypeScript |
| データベース | SQLite（WAL モード） |
| VLM | Ollama + Qwen3.5 |

ローカル完結を重視してシンプルな構成にしました。PostgreSQL は不要で、SQLite 単体で十分です。

## なぜ Qwen3.5 を選んだか

画像を入力として受け付ける VLM（Visual Language Model）の選択肢はいくつかあります。Ollama で動作する主なモデルの比較：

| モデル | パラメータ数 | 日本語対応 | 画像認識精度 |
|-------|-----------|-----------|------------|
| LLaVA | 7〜13B | 弱い | 普通 |
| moondream | 1.8B | 弱い | 軽量向け |
| **Qwen3.5** | 7〜30B | **強い** | **高い** |

Qwen3.5 は中国のAlibaba製のモデルですが、日本語への対応が良好で、細かいニュアンスのフィードバックも日本語で返してくれます。Mac M4 48GB であれば 30B モデルでも快適に動作します。

## バックエンドの設計

Go の `net/http` を使ったシンプルなHTTPサーバーです。フレームワークを使わない選択は、依存関係を減らしてバイナリサイズを小さく保つためです。

### ディレクトリ構成

```
dessan-sensei/
├── cmd/server/          # エントリポイント
├── internal/
│   ├── domain/          # ドメインモデル・インターフェース
│   ├── store/           # SQLite ストア
│   ├── ollama/          # Ollama クライアント
│   └── handler/         # HTTP ハンドラ・ルーター
└── web/                 # React SPA
```

### Ollama クライアントの実装

画像をBase64エンコードして Ollama の `/api/chat` エンドポイントに送ります。

```go
type OllamaRequest struct {
    Model    string    `json:"model"`
    Messages []Message `json:"messages"`
    Stream   bool      `json:"stream"`
}

type Message struct {
    Role    string   `json:"role"`
    Content string   `json:"content"`
    Images  []string `json:"images"` // Base64エンコードした画像
}

func (c *Client) Critique(ctx context.Context, imageBase64 string, criteria []string) (*CritiqueResult, error) {
    prompt := buildPrompt(criteria)
    
    req := OllamaRequest{
        Model: c.model,
        Messages: []Message{
            {
                Role:    "user",
                Content: prompt,
                Images:  []string{imageBase64},
            },
        },
        Stream: false,
    }
    // ...
}
```

### プロンプト設計

評価項目ごとにスコアとアドバイスをJSON形式で返すよう指示します。

```go
func buildPrompt(criteria []string) string {
    return fmt.Sprintf(`あなたはデッサン指導の専門家です。
提出された画像を以下の評価項目ごとに採点してください。

評価項目: %s

以下のJSON形式で回答してください:
{
  "scores": [
    {"criterion": "項目名", "score": 8, "advice": "具体的なアドバイス"}
  ],
  "overall_comment": "全体コメント"
}`, strings.Join(criteria, ", "))
}
```

### SQLite の WAL モード

SQLite を本番環境でも問題なく使えるよう、WAL（Write-Ahead Logging）モードを有効にしています。WALモードにすると、読み取りと書き込みが同時に行えるため、スループットが向上します。

```go
db, err := sql.Open("sqlite3", "./data/dessan.db?_journal_mode=WAL")
```

## フロントエンドの設計

React + Vite + TypeScript のシンプルなSPAです。iPad からのアクセスを前提に、タッチ操作しやすいUIデザインにしています。

### iPad カメラ直接起動

```tsx
<input
    type="file"
    accept="image/*"
    capture="environment"  // 背面カメラを起動
    onChange={handleImageSelect}
/>
```

### 評価結果の表示

各評価項目をカード形式で表示し、スコアをプログレスバーで視覚化します。

```tsx
const ScoreCard = ({ criterion, score, advice }) => (
    <div className="score-card">
        <h3>{criterion}</h3>
        <div className="score-bar">
            <div style={{ width: `${score * 10}%` }} />
            <span>{score}/10</span>
        </div>
        <p>{advice}</p>
    </div>
);
```

## 動作確認

Mac と iPad を同じ Wi-Fi に接続した状態で：

```bash
# Ollama 起動
ollama serve

# アプリ起動
make dev
```

iPad の Safari から `http://<MacのIPアドレス>:5173` にアクセスするだけです。

## 実際に使ってみた感想

Qwen3.5 の添削クオリティは想像以上でした。「線が震えており自信のなさが見える」「影の境界線が唐突で光源の方向を意識した方が良い」といった具体的なアドバイスが返ってきます。

レスポンス速度は Mac M4 48GB で一枚あたり **10〜15秒程度**。待ち時間はやや長いですが、練習の合間に使う分には許容範囲です。

## まとめ

- **Ollama + Qwen3.5** でローカル VLM による画像解析が手軽に実現できる
- **Go の net/http** でシンプルなAPIサーバーを構築
- **SQLite WAL モード**でローカルアプリに十分なパフォーマンス
- クラウドAPIなしで**プライバシーを守りながらAI添削**が可能

ローカルLLMは毎月 API 費用を心配する必要がなく、インターネット接続がない環境でも動くのが大きなメリットです。デッサン以外でも、画像に対してAIのフィードバックが欲しいシーンに幅広く応用できます。

---

**AI アプリ開発でお困りのことはありませんか？**

技術相談や開発サポートを承っています。お気軽にご相談ください。

[ココナラで開発相談を依頼する](https://coconala.com/users/1993863)
