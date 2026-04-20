---
title: "バンドのセットリストをAIで自動生成！OR-Tools TSPで転換コストを最小化する方法"
date: 2026-04-20T15:00:00+09:00
draft: false
tags: ["OR-Tools", "Python", "最適化", "Google スプレッドシート", "YouTube API", "組み合わせ最適化"]
summary: "バンド「Luke Avenue」のセットリスト作成を自動化するスクリプトを開発しました。OR-ToolsのTSP（巡回セールスマン問題）ソルバーで、メンバー交代によるパート転換コストを最小化した最適な曲順を自動生成します。YouTube APIで曲の長さも自動取得します。"
---

## はじめに

バンドのライブでは、セットリスト（演奏順）の組み方が重要です。特に複数バンドが同じメンバーで曲ごとにパートを担う場合、**誰が何の楽器を担当するか**によって転換（準備時間）が変わります。

筆者が所属するバンド「Luke Avenue」では、メンバーが曲ごとに担当パートを変えるスタイルのため、曲順が悪いとドラムセットの組み替えが頻発して転換時間が増えてしまいます。

この問題を **OR-Tools の巡回セールスマン問題（TSP）ソルバー**で解決しました。

## セットリスト最適化の考え方

### 問題の定式化

「転換コストを最小化した曲順」は、グラフ理論の**巡回セールスマン問題（TSP）**として定式化できます。

- **ノード**: 各曲
- **エッジのコスト**: 曲 A から曲 B に移るときのパート交代コスト
- **目標**: すべての曲を1回ずつ演奏し、総転換コストが最小になる順序を見つける

### パート別転換コスト

楽器の準備・撤収にかかる手間をコストとして定義します。

```python
part_costs = {
    'Dr': 5,     # ドラムセットの組み替えが最も大変
    'Gt1': 3,    # ギターの持ち替え
    'Gt2': 3,
    'Ba': 2,     # ベースの持ち替え
    'Key': 2,    # キーボードセットアップ
    'Vo': 1,     # マイク調整
    'Cho': 1,
    'Other': 1,
}
```

曲 A → 曲 B の転換コスト = **交代するパートのうち最大のコスト**

例：曲 A でドラムが田中さん、曲 B でドラムが山田さんに変わる場合 → コスト = 5（Dr）

### コスト行列の計算

```python
cost_matrix = np.zeros((num_songs, num_songs), dtype=int)

for i in range(num_songs):
    for j in range(num_songs):
        if i == j:
            continue

        members_i = parsed_members_list[i]  # 曲iの担当者
        members_j = parsed_members_list[j]  # 曲jの担当者

        # 交代するパートを列挙してコストを計算
        transition_costs = []
        for role in set(members_i.keys()) | set(members_j.keys()):
            if members_i.get(role) != members_j.get(role):
                transition_costs.append(part_costs.get(role, 0))

        cost_matrix[i, j] = max(transition_costs) if transition_costs else 0
```

## OR-Tools による TSP 解法

Google の OR-Tools ライブラリの `pywrapcp` モジュールでTSPを解きます。

```python
from ortools.constraint_solver import routing_enums_pb2
from ortools.constraint_solver import pywrapcp

def solve_tsp(cost_matrix: np.ndarray) -> tuple[list[int], int]:
    num_songs = len(cost_matrix)
    data = {
        "distance_matrix": cost_matrix.astype(int).tolist(),
        "num_vehicles": 1,
        "depot": 0,  # 1曲目から開始
    }

    manager = pywrapcp.RoutingIndexManager(num_songs, 1, 0)
    routing = pywrapcp.RoutingModel(manager)

    def distance_callback(from_index, to_index):
        from_node = manager.IndexToNode(from_index)
        to_node = manager.IndexToNode(to_index)
        return data["distance_matrix"][from_node][to_node]

    transit_callback_index = routing.RegisterTransitCallback(distance_callback)
    routing.SetArcCostEvaluatorOfAllVehicles(transit_callback_index)

    # Guided Local Search で局所最適を回避
    search_parameters = pywrapcp.DefaultRoutingSearchParameters()
    search_parameters.first_solution_strategy = (
        routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC
    )
    search_parameters.local_search_metaheuristic = (
        routing_enums_pb2.LocalSearchMetaheuristic.GUIDED_LOCAL_SEARCH
    )

    solution = routing.SolveWithParameters(search_parameters)

    if solution:
        route = []
        index = routing.Start(0)
        while not routing.IsEnd(index):
            route.append(manager.IndexToNode(index))
            index = solution.Value(routing.NextVar(index))
        return route, solution.ObjectiveValue()

    return None, None
```

## YouTube API で曲の長さを自動取得

セットリストの合計演奏時間を計算するため、各曲の長さが必要です。スプレッドシートに YouTube URL を入力しておくと、API で自動取得します。

```python
from googleapiclient.discovery import build
import isodate

def get_video_duration(video_id: str) -> float:
    youtube = build("youtube", "v3", developerKey=YOUTUBE_API_KEY)

    response = youtube.videos().list(
        part="contentDetails",
        id=video_id
    ).execute()

    if response["items"]:
        duration_iso = response["items"][0]["contentDetails"]["duration"]
        return isodate.parse_duration(duration_iso).total_seconds() / 60  # 分に変換

    return DEFAULT_DURATION_MINUTES  # 取得失敗時はデフォルト値
```

## Google スプレッドシートとの連携

データの入出力は Google スプレッドシートで行います。gspread ライブラリを使って Service Account で認証します。

```python
import gspread
from google.oauth2.service_account import Credentials

def authenticate_gspread():
    creds = Credentials.from_service_account_file(
        SERVICE_ACCOUNT_FILE,
        scopes=[
            "https://www.googleapis.com/auth/spreadsheets",
            "https://www.googleapis.com/auth/drive.file",
        ]
    )
    return gspread.authorize(creds)
```

スプレッドシートの4行目をヘッダーとし、5行目以降に曲データを入力します。`ステータス` 列が「成立」の曲のみを対象として処理します。

## 自動休憩挿入

演奏時間が設定した上限（デフォルト40分）を超えると、自動で休憩を挿入します。

```python
play_time_limit = 40  # 休憩までの演奏時間（分）
break_duration = 15   # 休憩時間（分）

current_block_time = 0
results = []

for i, song_idx in enumerate(optimal_route):
    duration = song_durations[song_idx]

    if current_block_time + duration > play_time_limit:
        # 休憩挿入
        results.append({"曲名": f"--- 休憩（{break_duration}分）---"})
        current_block_time = 0

    results.append({
        "曲名": song_list[song_idx],
        "時間(分)": round(duration, 1),
        "転換コスト": cost_matrix[prev_idx, song_idx] if i > 0 else "-",
    })
    current_block_time += duration
```

## 実際の出力例

```
--- セットリスト案（総転換コスト: 12）---
[ブロック 1]
1. Opening Song（4.5分）     転換: -
2. Fast Rock（3.8分）        転換: 1（Vo交代のみ）
3. Group Song（5.2分）       転換: 2（Ba交代）
...
--- 休憩（15分）---

[ブロック 2]
8. Ballad（5.0分）           転換: 3（Gt交代）
9. Finale（6.0分）           転換: 1

--- サマリー ---
実質総転換コスト: 12
推定合計ライブ時間: 58.5分
挿入された休憩回数: 1回
```

## 使ってみた結果

10曲のセットリスト最適化を実行したところ：

- **手動案の転換コスト**: 28
- **OR-Tools 最適化後**: 12（57%削減）

特にドラム交代（コスト5）が隣り合わせになっていた部分が解消され、同じドラム担当の曲が連続するよう並び替えられました。

## セットアップ

```bash
# 依存関係インストール
uv sync

# 環境変数の設定
export YOUTUBE_API_KEY="your-api-key"

# 実行
uv run python main.py
```

## まとめ

- **TSP（巡回セールスマン問題）** でセットリストの曲順最適化が解ける
- **OR-Tools の Guided Local Search** で局所最適を回避した高品質な解が得られる
- **Google スプレッドシート + YouTube API** との連携で実務的なワークフローを自動化できる
- パート別コスト設定をカスタマイズして、様々なバンド構成に対応可能

組み合わせ最適化は「難しい数学の話」と思われがちですが、OR-Tools を使えば比較的簡単に実用的なソルバーが作れます。バンド活動以外にも、学校の時間割作成・配送ルート最適化など様々な場面に応用できます。

---

**最適化・自動化ツールの開発でお困りのことはありませんか？**

技術相談や開発サポートを承っています。お気軽にご相談ください。

[ココナラで開発相談を依頼する](https://coconala.com/users/1993863)
