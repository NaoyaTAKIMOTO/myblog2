---
title: "BookingButler：Googleカレンダー連携で出張管理を自動化するWebアプリ"
date: 2025-07-11T07:06:30+09:00
draft: false
tags: ["Go", "React", "Google Calendar API", "出張管理", "API統合"]
summary: "出張の移動時間計算とスケジュール調整を自動化するBookingButlerの開発記録。Googleカレンダーと連携し、予定間の最適な移動ルートを算出する技術実装を紹介。"
---

# BookingButler：出張管理を自動化するWebアプリケーション

## 開発の背景

出張が多いビジネスパーソンにとって、移動時間の計算やスケジュール調整は時間のかかる作業です。特に：

- 複数の予定間の移動時間を個別に調べる手間
- 乗り換え情報や最適ルートの検索
- 移動時間不足による予定の重複リスク

これらの課題を解決するため、**BookingButler**を開発しました。

## アプリケーションの機能

### 核となる機能

**1. 自動カレンダー取得**
- Googleカレンダーから指定期間の予定を一括取得
- 場所情報を含む予定の自動抽出

**2. インテリジェントな移動時間計算**
- 連続する予定間の移動時間を自動算出
- Google Maps APIとNAVITIME APIを組み合わせた最適ルート提案
- 公共交通機関を考慮した実用的な移動時間

**3. スケジュール分析**
- 移動時間不足の予定を自動検出
- 時間調整が必要な箇所の警告表示
- 効率的な出張スケジュールの提案

### 実装された技術スタック

**フロントエンド**
```javascript
// React + TypeScript
- React 18.3.1
- TypeScript
- Vite 6.0.5（高速な開発環境）
- @react-oauth/google（Google認証）
```

**バックエンド**
```go
// Go言語によるAPI実装
- Gorilla Mux（HTTPルーティング）
- Google Calendar API v3
- Google Maps API（ジオコーディング）
- NAVITIME API（乗換案内）
```

## 技術的な実装詳細

### API統合アーキテクチャ

```go
// 主要なデータ構造
type EventInfo struct {
    Summary          string    `json:"summary"`
    Location         string    `json:"location"`
    StartTime        time.Time `json:"start_time"`
    EndTime          time.Time `json:"end_time"`
    PreviousLocation string    `json:"previous_location"`
    TransitTime      int       `json:"transit_time"`
    TravelWarning    bool      `json:"travel_warning"`
}
```

### 処理フロー

1. **認証・カレンダー取得**
   ```go
   // Google Calendar APIからイベント取得
   events := calendar.GetEvents(startDate, endDate)
   ```

2. **位置情報の処理**
   ```go
   // 住所のジオコーディング
   coordinates := maps.Geocode(location)
   ```

3. **移動時間計算**
   ```go
   // NAVITIME APIで乗換案内取得
   transitInfo := navitime.GetTransitTime(fromLocation, toLocation)
   ```

### 開発環境の構成

```bash
# フロントエンド起動
cd vite-project
npm run dev    # localhost:5173

# バックエンド起動  
cd backend
make run       # localhost:8080
```

プロキシ設定により、開発中はシームレスにフロントエンド・バックエンド間の通信が可能です。

## 実用的な価値

### 使用シーン例

**従来の手作業**：
1. カレンダーで予定確認（5分）
2. 各移動区間をGoogle Mapsで検索（15分×3回＝45分）
3. 乗換案内で詳細確認（10分×3回＝30分）
4. Excelで時間調整（15分）
**合計：約1時間35分**

**BookingButler使用時**：
1. 日付範囲を入力（1分）
2. 自動計算完了まで待機（2分）
3. 結果確認と調整（7分）
**合計：約10分**

### 出力例

```json
{
  "events": [
    {
      "summary": "A社打ち合わせ",
      "location": "東京駅",
      "start_time": "2024-03-15T10:00:00Z",
      "transit_time": 0,
      "travel_warning": false
    },
    {
      "summary": "B社会議",
      "location": "新宿駅",
      "start_time": "2024-03-15T14:00:00Z",
      "previous_location": "東京駅",
      "transit_time": 45,
      "travel_warning": false
    }
  ]
}
```

## 現在の開発状況

### 実装済み機能
- ✅ Google Calendar API統合
- ✅ 複数外部API連携（Maps, NAVITIME）
- ✅ React+TypeScriptによるモダンUI
- ✅ リアルタイム移動時間計算
- ✅ 開発環境の完全構築

### 技術的課題
- 🔧 OAuth認証フローの調整が必要
  - フロントエンドとバックエンドの認証方式統一
  - Google Console設定の最適化
- 🔧 本番環境デプロイメント準備
- 🔧 エラーハンドリングの強化

## 今後の展開

### 機能拡張計画
- **多カレンダー対応**：Outlook、iCloudとの連携
- **AIルート最適化**：機械学習による最適経路提案
- **経費管理統合**：出張費用の自動計算
- **チーム機能**：複数人での出張計画共有

### 技術改善
- コンテナ化による簡単デプロイ
- 自動テスト・CI/CD環境構築
- パフォーマンス最適化

## まとめ

BookingButlerは、出張管理の効率化という実用的な課題に対し、複数のAPIを統合したWebアプリケーションとして開発しました。Google Calendar APIを軸とした外部サービス連携により、手作業では困難な複雑な移動時間計算を自動化できます。

現在は認証部分の調整を進めており、この課題を解決することで完全に実用可能なアプリケーションとなる予定です。Go言語とReactによるモダンな技術スタックで構築されており、今後の機能拡張にも柔軟に対応できる設計となっています。

---

**プロジェクト開発やAPI統合でお困りのことはありませんか？**

技術相談や開発サポートを承っています。お気軽にご相談ください。

[ココナラで開発相談を依頼する](https://coconala.com/users/1993863)

