---
title: "ジムから住む場所を決める！Go + Reactで作る「筋肉不動産」アプリの設計"
date: 2026-04-20T17:00:00+09:00
draft: false
tags: ["Go", "React", "Gin", "TypeScript", "Clean Architecture", "styled-components", "API設計"]
summary: "「まずジムを選んでから家を探す」という筋トレ愛好家向けの住まい探しWebアプリ「筋肉不動産」を開発しました。Go + Gin のClean Architectureバックエンドと、React + TypeScriptフロントエンドの実装を解説します。"
---

## はじめに

引越しを考えるとき、多くの人は「職場への通勤時間」を軸に物件を探します。しかし、毎日ジムに通うトレーニーにとっては、**「ジムまでの距離」も同じくらい重要**なはずです。

「筋肉不動産」は、この逆転の発想から生まれたWebアプリです。先にお気に入りのジムを選び、そのジムへの通勤時間が許容範囲に収まる物件を探すという、新しい住まい探しの体験を提供します。

## アプリのコンセプト

### 従来の住まい探し
職場 → 許容通勤時間でエリアを絞る → 物件を探す

### 筋肉不動産
**ジム** → 行きやすいエリアを絞る → 職場への通勤も考慮 → 物件を探す

これにより、「ジムに毎日通える距離の物件だけ」を最初からフィルタリングできます。

## 技術スタック

| レイヤー | 技術 |
|---------|------|
| フロントエンド | React + TypeScript + Vite + styled-components |
| バックエンド | Go + Gin + Clean Architecture |
| 地図・通勤 | Google Maps API（Distance Matrix, Geocoding）|
| DB（予定） | PostgreSQL + PostGIS |

## バックエンドの設計（Clean Architecture）

### ディレクトリ構成

```
server/
├── cmd/main.go              # エントリーポイント・ルーティング設定
├── internal/
│   ├── handler/             # HTTPハンドラー（Gin）
│   │   ├── gym_handler.go
│   │   ├── commute_handler.go
│   │   └── property_handler.go
│   ├── service/             # ビジネスロジック
│   │   ├── gym_service.go
│   │   └── commute_service.go
│   ├── repository/          # データアクセス
│   ├── model/               # データモデル・APIレスポンス型
│   ├── middleware/           # CORSなどのミドルウェア
│   └── database/            # DB初期化
└── data/                    # モックデータ（JSON）
```

依存の向きは外側（handler）から内側（service → model）で、各層が独立してテスト可能です。

### APIエンドポイント

**ジム検索**

```
GET /api/gyms/search?q=渋谷&prefecture=東京都&city=渋谷区&facilities=プール,サウナ
GET /api/gyms/:id
```

**通勤時間計算**

```
GET  /api/commute/areas?origin=新宿駅&max_time=30&mode=transit
POST /api/commute/calculate
  {
    "origin": "新宿駅",
    "destinations": ["渋谷駅", "池袋駅"],
    "mode": "transit"
  }
```

**物件検索**

```
GET /api/properties/search?lat=35.6586&lng=139.7008&radius=1000&maxRent=150000
```

### ジム検索ハンドラの実装

```go
// internal/handler/gym_handler.go
func (h *GymHandler) SearchGyms(c *gin.Context) {
    query := c.Query("q")
    prefecture := c.Query("prefecture")
    city := c.Query("city")
    facilitiesStr := c.Query("facilities")

    var facilities []string
    if facilitiesStr != "" {
        facilities = strings.Split(facilitiesStr, ",")
    }

    criteria := model.SearchCriteria{
        Query:      query,
        Prefecture: prefecture,
        City:       city,
        Facilities: facilities,
    }

    gyms, err := h.gymService.SearchGyms(criteria)
    if err != nil {
        c.JSON(http.StatusInternalServerError, model.APIResponse{
            Success: false,
            Error:   err.Error(),
        })
        return
    }

    c.JSON(http.StatusOK, model.APIResponse{
        Success: true,
        Data:    gyms,
    })
}
```

### 統一レスポンス型

```go
// internal/model/response.go
type APIResponse struct {
    Success bool        `json:"success"`
    Data    interface{} `json:"data,omitempty"`
    Error   string      `json:"error,omitempty"`
    Meta    *Meta       `json:"meta,omitempty"`
}

type Meta struct {
    Total int `json:"total"`
    Page  int `json:"page"`
    Limit int `json:"limit"`
}
```

## フロントエンドの設計

### ジム検索フィルター（施設チップ）

9種の施設（プール・サウナ・フリーウェイト・マシン・スタジオ・シャワー・駐車場・24時間・女性専用）をチップ形式でフィルタリングします。

```typescript
// src/components/FacilityFilter.tsx
const FACILITIES = [
    "プール", "サウナ", "フリーウェイト", "マシン",
    "スタジオ", "シャワー", "駐車場", "24時間", "女性専用"
] as const;

export const FacilityFilter = ({ selected, onChange }) => (
    <FilterContainer>
        {FACILITIES.map(facility => (
            <Chip
                key={facility}
                $active={selected.includes(facility)}
                onClick={() => onChange(
                    selected.includes(facility)
                        ? selected.filter(f => f !== facility)
                        : [...selected, facility]
                )}
            >
                {facility}
            </Chip>
        ))}
    </FilterContainer>
);

const Chip = styled.button<{ $active: boolean }>`
    padding: 6px 14px;
    border-radius: 20px;
    border: 2px solid ${({ $active }) => $active ? "#e74c3c" : "#ddd"};
    background: ${({ $active }) => $active ? "#e74c3c" : "white"};
    color: ${({ $active }) => $active ? "white" : "#333"};
    cursor: pointer;
    transition: all 0.2s;
`;
```

### 検索結果のサービスレイヤー

フロントエンドの API 呼び出しはサービスレイヤーに集約して、コンポーネントから分離しています。

```typescript
// src/services/gymService.ts
export interface GymSearchParams {
    q?: string;
    prefecture?: string;
    city?: string;
    facilities?: string[];
}

export const searchGyms = async (params: GymSearchParams): Promise<Gym[]> => {
    const searchParams = new URLSearchParams();
    if (params.q) searchParams.set("q", params.q);
    if (params.prefecture) searchParams.set("prefecture", params.prefecture);
    if (params.city) searchParams.set("city", params.city);
    if (params.facilities?.length) {
        searchParams.set("facilities", params.facilities.join(","));
    }

    const res = await fetch(`/api/gyms/search?${searchParams}`);
    if (!res.ok) throw new Error("ジム検索に失敗しました");

    const data = await res.json();
    return data.data;
};
```

## モックデータでの動作確認

現時点では全国16ジム（東京・大阪・名古屋・福岡・札幌）のモックデータで動作しています。実データ化は PostgreSQL + PostGIS への移行と、大手チェーン（エニタイムフィットネス・ゴールドジム・コナミスポーツ等）のデータ収集が必要です。

```go
// server/data/gyms.json（抜粋）
[
    {
        "id": "gym-001",
        "name": "エニタイムフィットネス 渋谷店",
        "prefecture": "東京都",
        "city": "渋谷区",
        "address": "東京都渋谷区道玄坂1-2-3",
        "lat": 35.6580,
        "lng": 139.7000,
        "facilities": ["24時間", "フリーウェイト", "マシン", "シャワー"],
        "monthly_fee": 7000
    }
]
```

## 今後の実装予定

- **Google Maps Distance Matrix API** による実際の通勤時間計算
- **PostGIS** を使った空間クエリ（指定エリア内のジム検索）
- **LIFULL HOME'S API** との物件データ統合
- **地図上での可視化**（Google Maps JavaScript API）
- 大手チェーンのジムデータ自動収集

## まとめ

「何を軸に住む場所を決めるか」という視点を変えることで、新しいサービスアイデアが生まれます。筋肉不動産は現時点ではモックデータで動く MVP ですが、Clean Architecture で設計しているため、実データへの移行が容易な構造になっています。

技術的には：
- **Go + Gin の Clean Architecture** でスケーラブルな API 設計
- **styled-components のチップ UI** で直感的な施設フィルター
- **統一 APIResponse 型** でフロントエンドとの連携を型安全に実現

「ジムに毎日通える家に住みたい」というリアルな課題から作ったアプリなので、ぜひ同じ悩みを持つ方に使ってもらいたいと思っています。

---

**Webアプリの設計・開発でお困りのことはありませんか？**

技術相談や開発サポートを承っています。お気軽にご相談ください。

[ココナラで開発相談を依頼する](https://coconala.com/users/1993863)
