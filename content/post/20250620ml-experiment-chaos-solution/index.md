---
title: "機械学習実験の混乱を解決する：再現できない結果との戦い"
subtitle: "パラメータ管理とMLflowによる実験追跡の実践的解決法"
date: 2025-06-20
bigimg: [{src: "/img/novice-4479081_1920.jpg", desc: "ML Experiments"}]
tags: ["machine-learning", "mlflow", "experiment-tracking", "reproducibility", "problem-solving"]
---

## 問題：なぜ機械学習の実験結果が再現できないのか

「先週良い結果が出たモデルがあったんだけど、どのパラメータを使ったか覚えてる？」

機械学習プロジェクトでこんな会話を聞いたことはありませんか？多くのチームが直面する典型的な問題です。

### 実際に起こる問題シナリオ

**ケース1：パラメータの迷子**
```python
# experiment_v1.py
model = RandomForestClassifier(n_estimators=100, max_depth=10)
# Accuracy: 0.87

# experiment_v2.py  
model = RandomForestClassifier(n_estimators=200, max_depth=15)
# Accuracy: 0.91

# experiment_final.py
model = RandomForestClassifier(n_estimators=???, max_depth=???)
# どのパラメータが0.91を出したかわからない...
```

**ケース2：データ版数の混乱**
- `data_v1.csv`でモデル訓練 → Accuracy 0.85
- `data_v2_cleaned.csv`でモデル訓練 → Accuracy 0.89  
- `data_final.csv`でモデル訓練 → Accuracy 0.82
- どのデータセット版がベスト結果だったか不明

**ケース3：環境の違いによる結果の不一致**
- ローカル環境：Accuracy 0.88
- 本番環境：Accuracy 0.76
- パッケージ版数やシード値の違いが原因

## 根本原因：実験管理の欠如

### なぜこの問題が発生するのか

1. **アドホックな実験管理**
   - ファイル名でバージョン管理（`model_v1.py`, `model_final_final.py`）
   - 結果をExcelやテキストファイルに手動記録
   - パラメータ設定のハードコーディング

2. **再現性への意識不足**
   - ランダムシードの未設定
   - 環境構築手順の文書化不足
   - データ前処理ステップの記録漏れ

3. **チーム間での情報共有不足**
   - 個人のローカル環境での実験
   - 結果の標準化された共有方法がない

## 解決策：MLflowによる体系的実験管理

### 1. 問題解決のアプローチ

**従来の方法：**
```
実験 → 結果をメモ → ファイル保存 → 忘れる
```

**改善された方法：**
```
実験 → MLflowで自動追跡 → 結果比較 → 最適化継続
```

### 2. 実装：段階的導入戦略

#### Phase 1: 基本的な実験追跡

```python
import mlflow
import mlflow.sklearn
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score
import pandas as pd

# MLflow実験の設定
mlflow.set_experiment("customer_churn_prediction")

def train_and_track_model(n_estimators, max_depth, random_state=42):
    with mlflow.start_run():
        # パラメータをログ
        mlflow.log_param("n_estimators", n_estimators)
        mlflow.log_param("max_depth", max_depth)
        mlflow.log_param("random_state", random_state)
        
        # データ情報もログ
        mlflow.log_param("train_data_size", len(X_train))
        mlflow.log_param("feature_count", X_train.shape[1])
        
        # モデル訓練
        model = RandomForestClassifier(
            n_estimators=n_estimators,
            max_depth=max_depth,
            random_state=random_state
        )
        model.fit(X_train, y_train)
        
        # 予測と評価
        train_pred = model.predict(X_train)
        test_pred = model.predict(X_test)
        
        train_accuracy = accuracy_score(y_train, train_pred)
        test_accuracy = accuracy_score(y_test, test_pred)
        
        # メトリクスをログ
        mlflow.log_metric("train_accuracy", train_accuracy)
        mlflow.log_metric("test_accuracy", test_accuracy)
        mlflow.log_metric("overfitting_gap", train_accuracy - test_accuracy)
        
        # モデル保存
        mlflow.sklearn.log_model(model, "model")
        
        return model, test_accuracy

# 複数の実験を実行
experiments = [
    {"n_estimators": 100, "max_depth": 10},
    {"n_estimators": 200, "max_depth": 15},
    {"n_estimators": 300, "max_depth": 20},
]

for exp in experiments:
    train_and_track_model(**exp)
```

#### Phase 2: 高度な追跡とデータ版数管理

```python
import hashlib
import pickle

def advanced_experiment_tracking(model_params, data_version):
    with mlflow.start_run():
        # データ版数の追跡
        data_hash = hashlib.md5(pd.util.hash_pandas_object(X_train).values).hexdigest()
        mlflow.log_param("data_hash", data_hash)
        mlflow.log_param("data_version", data_version)
        
        # 前処理ステップの記録
        preprocessing_steps = [
            "StandardScaler applied",
            "Missing values filled with median", 
            "Categorical encoding: one-hot"
        ]
        mlflow.log_param("preprocessing", ", ".join(preprocessing_steps))
        
        # 環境情報の記録
        import sys
        import sklearn
        mlflow.log_param("python_version", sys.version)
        mlflow.log_param("sklearn_version", sklearn.__version__)
        
        # モデル訓練（前のコードと同様）
        # ...
        
        # 追加のメトリクス
        from sklearn.metrics import precision_score, recall_score, f1_score
        
        precision = precision_score(y_test, test_pred, average='weighted')
        recall = recall_score(y_test, test_pred, average='weighted')
        f1 = f1_score(y_test, test_pred, average='weighted')
        
        mlflow.log_metric("precision", precision)
        mlflow.log_metric("recall", recall)
        mlflow.log_metric("f1_score", f1)
        
        # 特徴量重要度のログ
        feature_importance = model.feature_importances_
        importance_dict = dict(zip(feature_names, feature_importance))
        
        # 重要度をアーティファクトとして保存
        with open("feature_importance.pkl", "wb") as f:
            pickle.dump(importance_dict, f)
        mlflow.log_artifact("feature_importance.pkl")
```

### 3. 実験結果の比較と分析

#### MLflow UIでの結果確認

```bash
# MLflow UIを起動
mlflow ui --host 0.0.0.0 --port 5000
```

#### プログラム的な結果分析

```python
# 最適な実験の特定
client = mlflow.tracking.MlflowClient()
experiment = client.get_experiment_by_name("customer_churn_prediction")

runs = client.search_runs(
    experiment_ids=[experiment.experiment_id],
    order_by=["metrics.test_accuracy DESC"],
    max_results=5
)

print("Top 5 experiments:")
for run in runs:
    accuracy = run.data.metrics.get("test_accuracy", 0)
    n_estimators = run.data.params.get("n_estimators", "N/A")
    max_depth = run.data.params.get("max_depth", "N/A")
    
    print(f"Accuracy: {accuracy:.4f}, n_estimators: {n_estimators}, max_depth: {max_depth}")
```

## 実用的な導入ガイド

### チーム導入のベストプラクティス

#### 1. 標準テンプレートの作成

```python
# experiment_template.py
import mlflow
from datetime import datetime

class ExperimentTracker:
    def __init__(self, experiment_name, researcher_name):
        self.experiment_name = experiment_name
        self.researcher_name = researcher_name
        mlflow.set_experiment(experiment_name)
    
    def start_run(self, run_name=None):
        if run_name is None:
            run_name = f"{self.researcher_name}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        return mlflow.start_run(run_name=run_name)
    
    def log_experiment_info(self, model_type, objective, notes=""):
        mlflow.log_param("researcher", self.researcher_name)
        mlflow.log_param("model_type", model_type)
        mlflow.log_param("objective", objective)
        mlflow.log_param("notes", notes)
        mlflow.log_param("timestamp", datetime.now().isoformat())

# 使用例
tracker = ExperimentTracker("sales_prediction", "tanaka")
with tracker.start_run("xgboost_baseline"):
    tracker.log_experiment_info(
        model_type="XGBoost",
        objective="Improve sales prediction accuracy",
        notes="First attempt with default parameters"
    )
    # モデル訓練コード
```

#### 2. 実験計画の標準化

```python
# experiment_plan.py
def create_experiment_plan():
    return {
        "hypothesis": "アンサンブル手法で精度向上",
        "expected_improvement": "5%の精度向上",
        "success_criteria": "test_accuracy > 0.90",
        "risk_factors": ["オーバーフィッティング", "計算時間増加"],
        "rollback_plan": "単一モデルに戻す"
    }

def log_experiment_plan(plan):
    for key, value in plan.items():
        mlflow.log_param(f"plan_{key}", str(value))
```

### 導入時のよくある問題と対策

**問題1：MLflowサーバーの管理が大変**
```bash
# Docker Composeでの簡単セットアップ
# docker-compose.yml
version: '3'
services:
  mlflow:
    image: python:3.8
    ports:
      - "5000:5000"
    volumes:
      - ./mlruns:/app/mlruns
    command: >
      bash -c "pip install mlflow && 
               mlflow server --host 0.0.0.0 --port 5000 --default-artifact-root /app/mlruns"
```

**問題2：既存コードの移行が大変**
- 段階的移行：まず新しい実験のみMLflowを使用
- ラッパー関数の作成：既存コードを最小限の変更で対応

**問題3：チームメンバーの習得コスト**
- 実験テンプレートの提供
- 定期的な実験レビュー会の開催

## 導入効果：ビフォー・アフター

### ビフォー（導入前）
- **実験時間：** 1日3実験（結果整理に時間がかかる）
- **再現率：** 30%（パラメータ忘れが多発）
- **ベストモデル特定：** 2-3日（過去結果の調査が必要）

### アフター（導入後）  
- **実験時間：** 1日8実験（自動記録で効率化）
- **再現率：** 95%（全パラメータ自動記録）
- **ベストモデル特定：** 10分（UIで即座に比較可能）

## まとめ：なぜMLflowが機械学習実験を変革するのか

MLflowによる実験管理は単なるツールの導入ではなく、機械学習開発プロセスの根本的改善です：

1. **再現性の確保**：すべての実験条件を自動記録
2. **効率性の向上**：結果比較と分析の自動化  
3. **知識の蓄積**：チーム全体での実験知見の共有
4. **品質の向上**：体系的な実験により偶然性を排除

「あの良い結果、どうやって出したんだっけ？」という問題は、適切な実験管理システムで完全に解決できます。まずは小さなプロジェクトから始めて、チーム全体での標準化を目指しましょう。