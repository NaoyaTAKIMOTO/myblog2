---
title: "Xのタイムラインを自動要約！FastAPI + LLMで作るトピックダイジェストシステムの設計"
date: 2026-04-20T18:00:00+09:00
draft: false
tags: ["FastAPI", "React", "PostgreSQL", "LLM", "X API", "Python", "Docker", "Pydantic"]
summary: "関心のあるトピック（キーワード）を登録すると、X（Twitter）の関連ツイートを収集しLLMで要約するWebアプリ「TopicDigestX」の設計を紹介します。FastAPI + SQLAlchemy + React + Viteの構成で、Docker Composeで手軽に起動できます。"
---

## はじめに

X（Twitter）のタイムラインには有益な情報が流れていますが、フォロー数が増えると重要な投稿を見逃しやすくなります。特定のトピックについて「今日どんな議論があったか」を素早く把握したいという課題があります。

**TopicDigestX** は、関心のあるキーワードを登録しておくと、関連ツイートを自動収集して LLM で要約・整理し、ダイジェストとして閲覧できるシステムです。

> **現在の状況**: バックエンドの基本構造が完成した MVP 段階です。X API 連携と LLM 統合は実装予定です。

## システム設計

### アーキテクチャ概要

```
ユーザー（ブラウザ）
    ↓
React + Vite（フロントエンド: port 3000）
    ↓ REST API
FastAPI（バックエンド: port 8000）
    ↓
PostgreSQL（データベース: port 5432）

[非同期タスク - 実装予定]
FastAPI BackgroundTasks / Celery
    ├── X API v2 クライアント（ツイート収集）
    └── OpenAI API クライアント（LLM 要約）
```

### 技術スタック

| レイヤー | 技術 |
|---------|------|
| バックエンド | Python 3.12+ / FastAPI / SQLAlchemy |
| フロントエンド | React + Vite + TypeScript |
| データベース | PostgreSQL 15 |
| コンテナ | Docker Compose |
| 設定管理 | Pydantic Settings（.env ファイル対応）|
| LLM（予定） | OpenAI API（GPT-3.5-turbo）|
| ツイート収集（予定） | X API v2 |

## バックエンドの実装

### Pydantic Settings による設定管理

FastAPI アプリの設定は Pydantic Settings で一元管理します。`.env` ファイルと環境変数の両方に対応しており、本番環境への移行が容易です。

```python
# backend/main.py
from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache

class Settings(BaseSettings):
    x_bearer_token: str = ""
    openai_api_key: str = ""
    database_url: str = "sqlite:///./test.db"
    secret_key: str = ""
    llm_model_name: str = "gpt-3.5-turbo"

    model_config = SettingsConfigDict(
        env_file="../.env",
        env_file_encoding="utf-8",
        extra="ignore",  # .env に未定義のキーがあっても無視
    )

@lru_cache()
def get_settings() -> Settings:
    return Settings()
```

`@lru_cache` で初回だけ `.env` を読み込みキャッシュします。FastAPI の依存性注入（`Depends(get_settings)`）で各エンドポイントに注入できます。

### データモデル（SQLAlchemy）

トピックの登録・管理を行う `Topic` テーブルを定義しています。

```python
# backend/model.py
from sqlalchemy import Column, Integer, String, Text, DateTime, func
from database import Base

class Topic(Base):
    __tablename__ = "topics"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)       # トピック名（例：「LLM」）
    keywords = Column(Text, nullable=True)                   # 検索キーワード（カンマ区切り）
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
```

今後 `Digest`（要約結果）と `Tweet`（収集ツイート）テーブルを追加する予定です。

### FastAPI アプリケーション構造

```python
# backend/main.py
from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session

app = FastAPI(title="TopicDigestX API")

@app.get("/health")
async def health_check():
    return {"status": "ok"}

@app.get("/topics")
async def list_topics(
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
):
    topics = db.query(Topic).all()
    return {"topics": topics}

@app.post("/topics")
async def create_topic(
    topic_data: TopicCreate,
    db: Session = Depends(get_db),
):
    topic = Topic(**topic_data.dict())
    db.add(topic)
    db.commit()
    db.refresh(topic)
    return topic
```

## Docker Compose 構成

3つのサービスを Docker Compose で管理します。

```yaml
# docker-compose.yml
services:
  backend:
    build: ./backend
    ports: ["8000:8000"]
    volumes: ["./backend:/app"]
    env_file: [.env]
    depends_on: [db]
    command: uvicorn main:app --host 0.0.0.0 --port 8000 --reload

  db:
    image: postgres:15-alpine
    volumes: ["postgres_data:/var/lib/postgresql/data"]
    env_file: [.env]
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER}"]
      interval: 5s

  frontend:
    build: ./frontend
    ports: ["3000:5173"]  # Vite の dev server
    volumes:
      - ./frontend:/app
      - /app/node_modules  # コンテナ内の node_modules を優先
    environment:
      - CHOKIDAR_USEPOLLING=true  # ホットリロード対応

volumes:
  postgres_data:
```

### ヘルスチェックの重要性

`healthcheck` を設定しておくと、PostgreSQL が起動完了する前にバックエンドが接続しようとして失敗するのを防げます。`depends_on: db` だけでは「コンテナが起動した」ことしか保証されません。

## 今後の実装計画

### X API v2 クライアント（実装予定）

X API v2 の Bearer Token 認証でツイートを収集します。

```python
# backend/clients/x_client.py（実装予定）
import httpx

class XClient:
    BASE_URL = "https://api.twitter.com/2"

    def __init__(self, bearer_token: str):
        self.headers = {"Authorization": f"Bearer {bearer_token}"}

    async def search_recent(self, query: str, max_results: int = 10) -> list[dict]:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.BASE_URL}/tweets/search/recent",
                headers=self.headers,
                params={
                    "query": f"{query} lang:ja",
                    "max_results": max_results,
                    "tweet.fields": "created_at,author_id,public_metrics",
                },
            )
            response.raise_for_status()
            return response.json()["data"]
```

### LLM 要約クライアント（実装予定）

収集したツイートをまとめて LLM に投げて要約します。

```python
# backend/clients/llm_client.py（実装予定）
from openai import AsyncOpenAI

async def summarize_tweets(tweets: list[str], topic: str) -> str:
    client = AsyncOpenAI()
    
    tweets_text = "\n".join(f"- {t}" for t in tweets)
    
    response = await client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[
            {
                "role": "system",
                "content": "あなたはSNSの投稿を分析してダイジェストを作成するアシスタントです。"
            },
            {
                "role": "user",
                "content": f"以下は「{topic}」に関するXの投稿です。\n\n{tweets_text}\n\n"
                           "主要な論点・トレンド・重要な情報を箇条書きで要約してください。"
            },
        ],
    )
    return response.choices[0].message.content
```

### 非同期タスク処理

定期収集はFastAPIの `BackgroundTasks` または Celery で実装予定です。

```python
# FastAPI BackgroundTasks を使う例
from fastapi import BackgroundTasks

@app.post("/topics/{topic_id}/collect")
async def trigger_collection(
    topic_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    topic = db.query(Topic).filter(Topic.id == topic_id).first()
    background_tasks.add_task(collect_and_summarize, topic)
    return {"message": "収集を開始しました"}
```

## まとめ

TopicDigestX の設計で意識したポイント：

1. **Pydantic Settings** で環境変数を型安全に管理し、本番移行が容易な構成にする
2. **SQLAlchemy のモデル定義** をシンプルに保ち、Alembic によるマイグレーション追加を見越す
3. **Docker Compose のヘルスチェック** で依存サービスの起動順を正しく制御する
4. **非同期処理の設計** を考慮したエンドポイント設計（BackgroundTasks / Celery）

MVP として基本構造を作ってから段階的に機能追加するアプローチにより、設計の見通しが立てやすくなっています。X API 制限の変更など外部要因に左右される部分はインターフェースで抽象化しておくことが重要です。

---

**FastAPI・LLMを使ったシステム開発でお困りのことはありませんか？**

技術相談や開発サポートを承っています。お気軽にご相談ください。

[ココナラで開発相談を依頼する](https://coconala.com/users/1993863)
