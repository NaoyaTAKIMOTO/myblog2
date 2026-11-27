---
title: "画像1枚から動く3Dキャラクターを作る — 生成の試行錯誤を、記録できる制作工程に変える"
date: 2026-11-15T13:50:00+09:00
draft: false
tags: [VRM, VRoid, 3D, MCP, reproducibility, 課題解決]
summary: "画像1枚から動く3Dキャラクターを作るとき、全形状生成は毎回結果が変わり、手作業は手順が残りません。VRoid Studio の操作を MCP でコマンド化し、変更・書き出し・比較・採否を1サイクルとして回す仕組みと、その限界をまとめました。"
---

## 「もう1回いい感じに」ができない

参照画像を1枚入れて3Dキャラクターを作り、そのまま会話させたい。生成AIに画像を渡せば、形だけは出てきます。しかし出てきたGLBは表情の部品を持たず、目と口はアプリ側でテクスチャを重ねて補うことになります。気に入らない箇所が出たら、種を変えてもう一度生成する。すると今度は顔も髪も別物になり、前の結果との比較ができません。

手作業でモデリングすれば、少しずつ直せます。ただし1体を作るのに時間がかかるうえ、次に別のキャラクターを作るとき、前回の判断がどこにも残っていません。

このプロジェクトで欲しかったのは、**1体の出来**より **同じ手順で何度でも寄せられること** でした。ここでは、そのために制作工程をどう組み直したかを書きます。アプリ側の構成は[技術記事](/post/202611153d-chatting-tech/)に分けました。

## 既存手段の限界

| 手段 | できること | 限界 |
|---|---|---|
| 全形状生成（Meshy / Tripo / StdGEN など） | 画像からメッシュを作る | 表情の部品がなく、生成のたびに形が変わる。StdGEN は全段を約7時間から1時間52分まで詰めたが、同じポーズでの比較は輪郭 IoU 0.61・顔の色差 34.0 で、会話に使う品質ではなかった |
| VRoid Studio を手で操作 | 表情・骨・揺れを持つ VRM を作れる | 操作が画面に閉じており、同じ手順を再実行できない。記録が残らない |
| 既製の VRoid 連携 MCP | 内部 API で多数のツールを提供 | Windows と VRoid 2.14.0 固定で、この Mac では動かない |

VRoid Studio が作る VRM は、Humanoid の骨、5母音の口、瞬き、SpringBone を最初から持っています。土台としてはこれが一番近い。問題は、その操作をどう記録し、どう再実行するかでした。

## 解決の設計

工程を「部品を作る」「選んで組み立てる」「仕上げる」に分け、操作はコマンドとして残す形にしました。

<div class="diagram">
<div class="diagram-row">
  <div class="diagram-col diagram-col--before">
    <strong>Before: 生成と手作業</strong>
    <div class="diagram-box">画像を入れて生成する（結果は毎回変わる）</div>
    <div class="diagram-box">目と口をアプリ側で重ねて補う</div>
    <div class="diagram-box">気になる所を画面で手直しする</div>
    <div class="diagram-box">何をどう変えたか残らず、翌日には再現できない</div>
  </div>
  <div class="diagram-arrow">→</div>
  <div class="diagram-col diagram-col--after">
    <strong>After: 記録できる工程</strong>
    <div class="diagram-box">変更を「ラベル=値」のコマンドで書く</div>
    <div class="diagram-box">1コマンドで VRM 書き出しまで走る</div>
    <div class="diagram-box">実取込の静止画と前版の比較が自動で出る</div>
    <div class="diagram-box">save か undo で採否だけを人が決める</div>
  </div>
</div>
<p class="diagram-caption">図1: 作り込み1サイクルの前後比較</p>
</div>

設計の要点は4つです。

- **内部 API を使わない**: VRoid Studio を画面越しに操作する。注入が要らず、公式 API がなくても今日動く
- **操作を「ラベル=値」で書く**: `目尻の高さ=0.15` のように、変更を文字列で残す
- **1サイクルを固定する**: 変更 → VRM 書き出し → 実取込で描画 → 比較 → 採否
- **採否は人に残す**: 数値では「似ているか」を決められない。自動で決めない

トレードオフは、画面に依存するぶん VRoid の版が変わると座標と語彙の調整が要る点です。それでも、内部 API に依存して版が上がるたびに壊れるよりは、壊れ方が読めると判断しました。

## 実装の要点

### 1. 1サイクルを1コマンドにする

`tools/vroid-macos-mcp/scripts/refine_cycle.py` が、変更から比較画像までを1回で回します。

```sh
cd tools/vroid-macos-mcp

UV_CACHE_DIR=/tmp/uv-cache uv run python scripts/refine_cycle.py \
    --label eye-corner --section 顔 --set '目尻の高さ=0.15'
```

スクリプトは、ウィンドウを広げ、指定のパラメータを当て、VRM を書き出し、`frontend/e2e/verify-vrm.mjs`（1440×860、11項目の動作検証）を実行し、顔をクロップして前版と並べた比較画像を作ります。**保存はしません。** 比較画像を見てから `vroid-macos-mcp save` か `undo` を人が実行します。

### 2. 版番号はファイル名から採る

版が増えても比較画像と VRM が対応するよう、番号は既存ファイルから決めます。

```python
# tools/vroid-macos-mcp/scripts/refine_cycle.py
def next_version(stem: str) -> tuple[int, Path]:
    versions = [
        int(match.group(1))
        for item in DATA.glob(f"{stem}-v*.vrm")
        if (match := re.search(r"-v(\d+)\.vrm$", item.name))
    ]
    number = max(versions) + 1 if versions else 1
    return number, DATA / f"{stem}-v{number:03d}.vrm"
```

`nikke-refinement-d-vNNN.vrm` と `compare-vNNN.png` が同じ番号で並ぶので、台帳には「版・変更前後・観察・採否」を1行書くだけで済みます。原本の `.vroid` は上書きしません。

### 3. 画面の揺れを1箇所に閉じ込める

画面操作は、行が画面外にある・値が入らないといった失敗がつきものです。`apply_settings` は、失敗したらパネルをスクロールして1度だけやり直します。

```python
# tools/vroid-macos-mcp/scripts/refine_cycle.py (apply_settings)
try:
    result = macos.set_color(label, value) if is_color else macos.set_param(label, value)
except macos.VroidError:
    # The row may be below the fold: scroll the panel to it, then retry once.
    if not macos.scroll_to(label).get("visible"):
        raise
    result = macos.set_color(label, value) if is_color else macos.set_param(label, value)
```

UI の状態に依存する処理をここに寄せたので、呼ぶ側は「ラベルと値」だけを気にすればよくなりました。

## 結果

VRoid を操作する MCP は、試作の20ツールから33ツールになりました。状態確認 → プロジェクトを開く → セクションとカテゴリ → プリセット → 数値・色・スライダー → 確認 → 保存 / 別名保存 → VRM 書き出し、までが MCP だけで閉じます。

作業としては、次の3つが残ります。

- 変更を1行のコマンドで書く
- 出てきた比較画像を見る
- `save` か `undo` を選ぶ

色は16進で指定でき、数値欄が読み取り専用の行はスライダーをドラッグして作ります。保存は ☰ → 保存 をクリックし、タイトルの `*` が消えたことを確認します（`cmd+s` は効かないことがあるため）。

ただし、**類似度はまだ合格していません**。25項目の評価表のうち16項目を部分評価した段階で、必須11項目のうち採点した7項目のうち6項目が3未満です。動作の合格（VRM 取り込み、口、瞬き、揺れ、モーション構築）と、参照画像への類似の合格は別物として記録しています。

## 向かないケース・残課題

- **プリセットにない形**: 帽子や腰ベルトは VRoid のテンプレートにない。帽子は5種を試したがいずれも舟形でなく、位置合わせも MCP では不安定だった。Blender 補正へ送る
- **テクスチャ編集**: ネクタイの縞や裾の色分けは2Dエディタの操作で、いまの MCP の守備範囲外
- **プリセット選択**: 髪型や衣装のカードは名前を読めないため、サムネイルを見て選ぶしかない。グリッドの校正が必要
- **版への追従**: 内部 API ではないので、VRoid の版や UI 言語が変わると座標と語彙を直す
- **全自動は未実装**: アプリに画像を入れるだけで全工程が走る機能はない。Blender での補正も未着手

## まとめ

- 「生成して当たりを引く」から「変更を記録して寄せる」に変えると、同じ結果を再実行できる
- 操作をコマンドにすると、人の仕事は採否の判断だけになる
- 動くことと似ていることは別に測る。片方が合格しても、もう片方の代わりにはならない

画面しか持たないアプリを相手にするとき、この形はそのまま使えます。

## 関連記事

- [FastAPI + TypeScript + VRM で組む3D会話アプリ — パスキー認証と VRoid MCP の分け方](/post/202611153d-chatting-tech/)

---

**VRM キャラクターの制作や、外部ツールを繋ぐ自動化でお困りのことはありませんか？**

技術相談や開発サポートを承っています。お気軽にご相談ください。

[ココナラで開発相談を依頼する](https://coconala.com/users/1117897)
