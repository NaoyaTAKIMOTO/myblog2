---
title: "Mac mini M4でローカルLLMを動かすDiscord Bot—関西弁AIとニュース自動投稿の実装"
date: 2026-04-20T11:00:00+09:00
draft: false
tags: ["Discord.js", "Ollama", "Node.js", "TypeScript", "LLM", "ローカルLLM", "RSS"]
summary: "Mac mini M4上のOllama（qwen2.5:14b）を使って、関西弁で雑談するDiscord Bot「ロブスター」を開発しました。クラウドAPIなしで動作し、はてなブックマーク・Zenn・Qiitaからのテックニュース自動投稿機能も実装しています。"
---

## はじめに

「Discordサーバーに、メンバーと気軽に雑談できるAI友達を置きたい」

こんなモチベーションで Discord Bot「**ロブスター**」を開発しました。OpenAI の API を使う方法が一般的ですが、月額費用と会話内容の外部送信が気になっていました。

そこで、**ローカルで動く Ollama（qwen2.5:14b）を使い、完全にオンプレミスで動作する Discord Bot** を作りました。おまけにテックニュースを毎日2回自動投稿する機能も付けています。

## ロブスターの機能

### チャット応答

メンションすると、**関西弁の友達キャラ**として返答します。

```
@ロブスター 最近どう？

ロブスター: おう！最近はな、新しいコード書いてたわ〜。
            Claude Code っていうやつがメチャ便利でな、
            一気にコーディングが捗っとるんやけど、
            お前も試してみたらどうや？
```

### ニュースレコメンド

- **定期投稿**: 9:00 と 18:00 JST にテックニュースを自動投稿
- **オンデマンド**: 「ニュースある？」と聞くと最新記事を3件返答
- **情報ソース**: はてなブックマーク、Zenn、Qiita、Yahoo!ニュース
- **重複排除**: 投稿済みURLを `posted-urls.json` に永続化し、同じ記事を2度投稿しない

## システム構成

```
ユーザー（メンション）
    ↓
Discord API
    ↓
discord-bot（Node.js + TypeScript）
    ↓
Ollama（localhost:11434）
    ↓
qwen2.5:14b（Mac mini M4 Pro 上でローカル実行）
```

クラウドへの通信は Discord API のみで、LLM推論はすべてローカルです。

## 技術的な実装

### Ollama クライアント

Ollama の REST API（`/api/chat`）を TypeScript でラップしています。会話履歴を配列として保持し、会話の文脈を維持します。

```typescript
// src/ollama/client.ts
export async function chat(
    messages: Message[],
    model: string = config.ollamaModel
): Promise<string> {
    const response = await fetch(`${config.ollamaBaseUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            model,
            messages,
            stream: false,
        }),
    });

    const data = await response.json();
    return data.message.content;
}
```

### キャラクター設定

Ollama の Modelfile でキャラクターの口調をシステムプロンプトとして設定します。

```
# config/Modelfile.lobster
FROM qwen2.5:14b

SYSTEM """
あなたは「ロブスター」という名前の関西弁を話す20代の友人です。
フレンドリーで気さくな性格で、IT・テクノロジーが大好きです。
必ず関西弁で話してください。
- 「〜やで」「〜やん」「〜やんか」などの語尾を使う
- 丁寧語は使わない
- 絵文字は使わない
"""
```

さらに `config/persona.json` で例文集を管理し、一貫したキャラクター性を保ちます。

### ニュース収集の実装

ニュース機能は責任分離を意識してモジュールに分割しています。

```
src/news/
├── feeds.ts      # フィードソースのURL定義
├── parser.ts     # XML → NewsArticle 型への変換
├── fetcher.ts    # フィード並列取得
├── dedup.ts      # URL 重複排除・JSON永続化
├── selector.ts   # スコア順・多様化アルゴリズムで記事選択
├── detector.ts   # メッセージが「ニュース要求か」の判定
├── formatter.ts  # 関西弁メッセージ生成
└── scheduler.ts  # cron による定期実行
```

#### RSS フィード並列取得

複数のRSSフィードを `Promise.allSettled` で並列取得し、一部失敗しても処理を継続します。

```typescript
// src/news/fetcher.ts
export async function fetchAllFeeds(): Promise<NewsArticle[]> {
    const results = await Promise.allSettled(
        FEED_SOURCES.map(source => fetchFeed(source))
    );

    return results
        .filter((r): r is PromiseFulfilledResult<NewsArticle[]> =>
            r.status === "fulfilled"
        )
        .flatMap(r => r.value);
}
```

#### 重複排除

`posted-urls.json` に投稿済みURLのセットを永続化します。サーバー再起動後も重複投稿を防ぎます。

```typescript
// src/news/dedup.ts
export function filterNewArticles(
    articles: NewsArticle[],
    postedUrls: Set<string>
): NewsArticle[] {
    return articles.filter(a => !postedUrls.has(a.url));
}

export async function markAsPosted(
    urls: string[],
    postedUrls: Set<string>
): Promise<void> {
    urls.forEach(url => postedUrls.add(url));
    await fs.writeFile(
        POSTED_URLS_PATH,
        JSON.stringify([...postedUrls], null, 2)
    );
}
```

#### ニュース要求の検知

「ニュースある？」「何か記事ない？」などの自然な表現を正規表現でマッチします。

```typescript
// src/news/detector.ts
const NEWS_PATTERNS = [
    /ニュース/,
    /記事/,
    /最新情報/,
    /何かあった/,
    /今日のトピック/,
];

export function isNewsRequest(message: string): boolean {
    return NEWS_PATTERNS.some(pattern => pattern.test(message));
}
```

### cron による定期投稿

`node-cron` で 9:00 と 18:00 JST に自動投稿します。

```typescript
// src/news/scheduler.ts
import cron from "node-cron";

export function startNewsScheduler(channel: TextChannel): void {
    // 9:00 JST (UTC 00:00)
    cron.schedule("0 0 * * *", () => postNews(channel));
    
    // 18:00 JST (UTC 09:00)
    cron.schedule("0 9 * * *", () => postNews(channel));
}
```

## Ollama モデルの選び方

| モデル | メモリ | 日本語品質 | 推奨用途 |
|-------|-------|-----------|---------|
| qwen2.5:7b | ~8GB | ○ | テスト・低スペック環境 |
| **qwen2.5:14b** | ~17GB | **◎** | **本番推奨** |

Mac mini M4 Pro（24GB 以上）であれば 14b モデルが快適に動作します。日本語の語彙や文法的な自然さは 7b と 14b で顕著な差があるため、本番では 14b を使うことをおすすめします。

## セットアップ

```bash
# 1. Ollama のインストール
brew install ollama
ollama serve &
ollama pull qwen2.5:14b

# 2. 環境変数の設定
cp .env.example .env
# .env に Discord Bot Token と Channel ID を設定

# 3. 起動
pnpm install
pnpm dev
```

Discord Developer Portal で Bot を作成する際、**Message Content Intent** を有効にすることが必須です（忘れがちなので注意）。

## ローカルLLMのメリット・デメリット

### メリット
- **コスト**: API 使用料なし、電気代のみ
- **プライバシー**: 会話内容が外部に出ない
- **レイテンシ**: インターネット経由なし（ただしモデルの推論時間はある）

### デメリット
- **ハードウェアが必要**: 14b モデルには 16GB 以上の統合メモリ推奨
- **応答速度**: GPT-4 と比較すると遅い（14b で 2〜5秒）
- **モデル品質の限界**: 最新の GPT-4o や Claude Sonnet には及ばない

雑談ボットとして日常的に使う分には、ローカル 14b モデルで十分な品質が得られます。

## まとめ

- **Ollama + qwen2.5:14b** でクラウドAPIなしの Discord Bot が実現可能
- ニュース収集はモジュール分割して責任を明確化
- 重複排除のJSON永続化で再起動後も安定動作
- Mac mini M4 があれば月0円で24時間稼働できる

Discord サーバーに常駐するキャラクター性のあるBotは、コミュニティの雰囲気を盛り上げるのに意外と効果的です。ローカルLLMの実験場としても活用できるので、Ollamaが使える環境があればぜひ試してみてください。

---

**Discord Bot やローカルLLM導入でお困りのことはありませんか？**

技術相談や開発サポートを承っています。お気軽にご相談ください。

[ココナラで開発相談を依頼する](https://coconala.com/users/1993863)
