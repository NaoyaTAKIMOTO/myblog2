---
title: "CADチェッカー"
subtitle: "社内の設計ルール違反を、モデルを置くだけで洗い出す"
comments: false
---

<style>
.cadfig { margin: 1.8rem 0; }
.cadfig-caption { font-size: 0.85rem; color: #666; text-align: center; margin: 0.7rem 0 0; }

.cadfig-steps { display: flex; gap: 0.6rem; align-items: stretch; }
.cadfig-step { flex: 1; background: #fff; border: 1px solid #e5e5e5; border-radius: 8px; padding: 1rem 0.8rem; text-align: center; }
.cadfig-step-num { display: inline-flex; width: 2rem; height: 2rem; border-radius: 50%; background: #e83929; color: #fff; font-weight: bold; align-items: center; justify-content: center; margin-bottom: 0.5rem; }
.cadfig-step-title { font-weight: bold; font-size: 0.98rem; margin-bottom: 0.35rem; }
.cadfig-step-body { font-size: 0.84rem; color: #555; line-height: 1.55; }
.cadfig-arrow { display: flex; align-items: center; justify-content: center; color: #c8c8c8; font-size: 1.5rem; flex: none; }

.cadfig-ba { display: flex; gap: 1rem; }
.cadfig-ba-col { flex: 1; border-radius: 8px; padding: 1rem 0.9rem; }
.cadfig-ba-col.is-now { background: #f5f5f5; border: 1px solid #e5e5e5; }
.cadfig-ba-col.is-new { background: #fdf0ef; border: 1px solid #f4c7c3; }
.cadfig-ba-head { text-align: center; font-weight: bold; font-size: 0.95rem; margin-bottom: 0.8rem; color: #444; }
.cadfig-node { background: #fff; border: 1px solid #e0e0e0; border-radius: 6px; padding: 0.55rem 0.7rem; font-size: 0.86rem; text-align: center; line-height: 1.45; }
.cadfig-node.is-bad { border-color: #e83929; color: #c0392b; font-weight: bold; }
.cadfig-node.is-good { border-color: #2e9e5b; color: #1e7a44; font-weight: bold; }
.cadfig-down { text-align: center; color: #c8c8c8; font-size: 1.1rem; line-height: 1.2; margin: 0.3rem 0; }

.cadfig-window { border: 1px solid #d5d5d5; border-radius: 8px; overflow: hidden; background: #fff; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
.cadfig-titlebar { background: #f0f0f0; padding: 0.5rem 0.8rem; display: flex; align-items: center; gap: 0.35rem; border-bottom: 1px solid #e0e0e0; }
.cadfig-dot { width: 0.7rem; height: 0.7rem; border-radius: 50%; display: inline-block; }
.cadfig-wintitle { font-size: 0.85rem; color: #555; margin-left: 0.5rem; }
.cadfig-winbody { padding: 0.9rem; }
.cadfig-drop { border: 2px dashed #c8c8c8; border-radius: 8px; padding: 1.1rem 0.8rem; text-align: center; color: #888; font-size: 0.88rem; margin-bottom: 0.9rem; line-height: 1.5; }
.cadfig-summary { font-size: 0.85rem; color: #555; margin-bottom: 0.2rem; }
.cadfig-row { display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: baseline; padding: 0.55rem 0; border-top: 1px solid #f0f0f0; font-size: 0.86rem; }
.cadfig-badge { flex: none; font-size: 0.72rem; font-weight: bold; padding: 0.15rem 0.45rem; border-radius: 4px; letter-spacing: 0.03em; }
.cadfig-badge.ng { background: #fdecea; color: #c0392b; }
.cadfig-badge.warn { background: #fdf3e2; color: #b26a00; }
.cadfig-badge.ok { background: #eaf7ef; color: #1e7a44; }
.cadfig-file { font-family: Menlo, Consolas, monospace; color: #333; }
.cadfig-msg { color: #666; }

.cadfig-share { display: flex; gap: 0.8rem; align-items: center; }
.cadfig-share-file { flex: none; background: #fff; border: 1px solid #e0e0e0; border-radius: 6px; padding: 0.7rem 0.9rem; text-align: center; font-family: Menlo, Consolas, monospace; font-size: 0.85rem; color: #333; }
.cadfig-share-people { flex: 1; display: flex; gap: 0.5rem; }
.cadfig-person { flex: 1; background: #fff; border: 1px solid #e0e0e0; border-radius: 6px; padding: 0.6rem 0.4rem; text-align: center; font-size: 0.85rem; color: #555; line-height: 1.4; word-break: keep-all; }

@media (max-width: 640px) {
  .cadfig-steps, .cadfig-ba, .cadfig-share { flex-direction: column; }
  .cadfig-share { align-items: stretch; }
  .cadfig-arrow { transform: rotate(90deg); font-size: 1.3rem; }
  .cadfig-share-people { flex-direction: row; }
}
</style>

## その検図、ベテランが辞めたら回りますか？

部品番号の付け方、プロパティの記入漏れ、材質・表面処理の指定、ファイルの命名規則——3Dモデルが社内の設計標準に沿っているかどうかは、結局のところ「詳しい人が目で見る」ことで担保されているのが実情ではないでしょうか。

この方式には、3つの弱点があります。

- **属人化する**: 誰がチェックしたかで指摘の内容も粒度も変わる
- **漏れる**: 図面枚数が増える繁忙期ほど、チェックは形骸化する
- **後工程で高くつく**: 設計段階なら数分で直る不備も、手配や量産の後で見つかれば再手配・工程停止に連鎖する

**CADチェッカー** は、この「人が目で見ていた社内ルール」をルールとして書き出し、モデルを置くだけで機械的に照合するデスクトップアプリです。

<div class="cadfig">
<div class="cadfig-ba">
  <div class="cadfig-ba-col is-now">
    <div class="cadfig-ba-head">これまで</div>
    <div class="cadfig-node">3Dモデルができる</div>
    <div class="cadfig-down">▼</div>
    <div class="cadfig-node">詳しい人が目視でチェック<br />（担当者の記憶と経験）</div>
    <div class="cadfig-down">▼</div>
    <div class="cadfig-node">見る人・日によって<br />指摘がばらつく／漏れる</div>
    <div class="cadfig-down">▼</div>
    <div class="cadfig-node is-bad">後工程で発覚<br />再手配・工程停止</div>
  </div>
  <div class="cadfig-ba-col is-new">
    <div class="cadfig-ba-head">CADチェッカー導入後</div>
    <div class="cadfig-node">3Dモデルができる</div>
    <div class="cadfig-down">▼</div>
    <div class="cadfig-node">ルールセットと自動照合<br />（全員が同じ基準）</div>
    <div class="cadfig-down">▼</div>
    <div class="cadfig-node">違反箇所とその理由が<br />その場で一覧に出る</div>
    <div class="cadfig-down">▼</div>
    <div class="cadfig-node is-good">設計者が設計中に直す<br />後工程に流さない</div>
  </div>
</div>
<p class="cadfig-caption">機能や意匠の妥当性を見る検図は人が担当したまま、ルール照合の部分だけを機械に寄せます。</p>
</div>

---

## どれくらい削減できるのか（試算）

自社の数字を入れてみてください。検図のうち、ルール照合のような機械的な部分を自動化した場合の年間削減幅を試算します。

<div id="cadCalc" style="background: #f9f9f9; padding: 1.5rem; border-radius: 8px; margin: 1rem 0;">
  <div style="margin-bottom: 1rem;">
    <label for="calcModels" style="display: block; font-weight: bold; margin-bottom: 0.4rem;">月あたりのチェック対象モデル数</label>
    <input type="number" id="calcModels" value="100" min="0" step="10" style="width: 100%; padding: 0.6rem 0.8rem; border: 1px solid #ddd; border-radius: 6px; font-size: 1rem; box-sizing: border-box;" />
  </div>
  <div style="margin-bottom: 1rem;">
    <label for="calcMinutes" style="display: block; font-weight: bold; margin-bottom: 0.4rem;">1件あたりの検図時間（分）</label>
    <input type="number" id="calcMinutes" value="30" min="0" step="5" style="width: 100%; padding: 0.6rem 0.8rem; border: 1px solid #ddd; border-radius: 6px; font-size: 1rem; box-sizing: border-box;" />
  </div>
  <div style="margin-bottom: 1rem;">
    <label for="calcRate" style="display: block; font-weight: bold; margin-bottom: 0.4rem;">検図する人の時間単価（円）</label>
    <input type="number" id="calcRate" value="4000" min="0" step="500" style="width: 100%; padding: 0.6rem 0.8rem; border: 1px solid #ddd; border-radius: 6px; font-size: 1rem; box-sizing: border-box;" />
  </div>
  <div style="margin-bottom: 1.5rem;">
    <label for="calcRatio" style="display: block; font-weight: bold; margin-bottom: 0.4rem;">そのうち自動チェックで置き換えられる割合: <span id="calcRatioLabel">50</span>%</label>
    <input type="range" id="calcRatio" value="50" min="0" max="100" step="5" style="width: 100%;" />
    <p style="font-size: 0.85rem; color: #666; margin: 0.4rem 0 0;">機能や意匠の妥当性など、人が判断すべき部分は自動化できません。ルール照合が検図に占める割合を入れてください。</p>
  </div>
  <div style="background: white; border: 1px solid #e5e5e5; border-radius: 6px; padding: 1.2rem;">
    <div style="margin-bottom: 0.8rem;">
      <div style="font-size: 0.9rem; color: #666;">年間の削減時間</div>
      <div id="calcHours" style="font-size: 1.8rem; font-weight: bold; color: #333;">—</div>
    </div>
    <div>
      <div style="font-size: 0.9rem; color: #666;">年間の削減額</div>
      <div id="calcYen" style="font-size: 1.8rem; font-weight: bold; color: #e83929;">—</div>
    </div>
  </div>
  <p style="font-size: 0.85rem; color: #666; margin: 0.8rem 0 0;">※ 入力値に基づく単純な試算であり、効果を保証するものではありません。実際の削減幅は、対象モデルの複雑さやルールの作り込み具合によって変わります。</p>
</div>

なお、設計段階での1の修正コストが、試作段階では10、量産後には100以上になる——製造業でよく言われる「10倍ルール」の通り、上流で止められた不備の価値は、上の試算に出てくる工数削減だけでは測りきれません。

---

## できること

<div class="cadfig">
<div class="cadfig-steps">
  <div class="cadfig-step">
    <div class="cadfig-step-num">1</div>
    <div class="cadfig-step-title">ルールを書く</div>
    <div class="cadfig-step-body">社内設計標準を、部品番号の書式やプロパティの必須項目としてルールセットに登録します。</div>
  </div>
  <div class="cadfig-arrow">→</div>
  <div class="cadfig-step">
    <div class="cadfig-step-num">2</div>
    <div class="cadfig-step-title">モデルを投げ込む</div>
    <div class="cadfig-step-body">アプリにドラッグ&amp;ドロップするだけ。フォルダごと投げれば中身をまとめて処理します。</div>
  </div>
  <div class="cadfig-arrow">→</div>
  <div class="cadfig-step">
    <div class="cadfig-step-num">3</div>
    <div class="cadfig-step-title">違反を直す</div>
    <div class="cadfig-step-body">どのモデルのどの項目が規定外かが一覧で出ます。レポートは書き出して共有できます。</div>
  </div>
</div>
<p class="cadfig-caption">サーバーの構築も、PDMへの組み込みも要りません。</p>
</div>

### モデルを置くだけでチェックが走る
インストールしてファイルをドラッグ&ドロップするだけ。フォルダごとまとめて投げれば一括で処理します。サーバーの用意も、PDMへの組み込みも要りません。

<div class="cadfig">
<div class="cadfig-window">
  <div class="cadfig-titlebar">
    <span class="cadfig-dot" style="background:#ff5f57;"></span>
    <span class="cadfig-dot" style="background:#febc2e;"></span>
    <span class="cadfig-dot" style="background:#28c840;"></span>
    <span class="cadfig-wintitle">CADチェッカー — 社内設計標準 v3</span>
  </div>
  <div class="cadfig-winbody">
    <div class="cadfig-drop">3Dモデル / フォルダをここにドロップ<br />（92件を読み込み済み）</div>
    <div class="cadfig-summary">違反 2件 ・ 要確認 1件 ・ 問題なし 89件</div>
    <div class="cadfig-row">
      <span class="cadfig-badge ng">違反</span>
      <span class="cadfig-file">PN-0421.step</span>
      <span class="cadfig-msg">部品番号の書式が規定外（英2桁＋数字4桁）</span>
    </div>
    <div class="cadfig-row">
      <span class="cadfig-badge ng">違反</span>
      <span class="cadfig-file">bracket_v2.step</span>
      <span class="cadfig-msg">材質プロパティが空欄</span>
    </div>
    <div class="cadfig-row">
      <span class="cadfig-badge warn">要確認</span>
      <span class="cadfig-file">housing_rev.step</span>
      <span class="cadfig-msg">ファイル名と図番が一致しない</span>
    </div>
    <div class="cadfig-row">
      <span class="cadfig-badge ok">問題なし</span>
      <span class="cadfig-msg">残り89件はすべてのルールを満たしています</span>
    </div>
  </div>
</div>
<p class="cadfig-caption">※ 開発中の画面イメージです。実際のUIや対応フォーマットは変わる可能性があります。</p>
</div>

### ルールを自分たちで書ける
「部品番号は指定の書式に従っているか」「材質プロパティが空でないか」「ファイル名と部品番号が一致しているか」といった自社固有のルールを、設計者自身が追加・修正できます。ベンダーに依頼して数週間待つ必要はありません。

### ルールをチームで共有できる
作ったルールセットはファイルとして配布・バージョン管理できます。「新人にもベテランと同じ基準でチェックが回る」状態を、口頭の申し送りではなく仕組みで担保します。

<div class="cadfig">
<div class="cadfig-share">
  <div class="cadfig-share-file">社内設計標準<br />rules.yaml</div>
  <div class="cadfig-arrow">→</div>
  <div class="cadfig-share-people">
    <div class="cadfig-person">ベテラン</div>
    <div class="cadfig-person">中堅</div>
    <div class="cadfig-person">新人</div>
  </div>
</div>
<p class="cadfig-caption">ルールを更新すれば、配り直すだけで全員のチェック基準が揃います。</p>
</div>

### 図面を社外に出さない
処理はすべて手元のPCで完結します。クラウドにモデルをアップロードしないので、図面の社外持ち出しが禁止されている現場でも導入の相談がしやすい設計です。

---

## 既存の選択肢との違い

社内ルールのチェックを自動化する手段は、大きく3つに分かれます。どれも一長一短で、CADチェッカーは「中小の設計部門が、自分たちだけで始められること」に振り切っています。

<div style="overflow-x: auto; margin: 1rem 0;">
<table style="border-collapse: collapse; width: 100%; min-width: 720px; font-size: 0.92rem;">
  <thead>
    <tr style="background: #f5f5f5;">
      <th style="border: 1px solid #e5e5e5; padding: 0.7rem; text-align: left;"></th>
      <th style="border: 1px solid #e5e5e5; padding: 0.7rem; text-align: left; background: #fdf0ef;">CADチェッカー</th>
      <th style="border: 1px solid #e5e5e5; padding: 0.7rem; text-align: left;">CAD付属のチェック機能</th>
      <th style="border: 1px solid #e5e5e5; padding: 0.7rem; text-align: left;">エンタープライズPDQツール</th>
      <th style="border: 1px solid #e5e5e5; padding: 0.7rem; text-align: left;">Excelチェックシート運用</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="border: 1px solid #e5e5e5; padding: 0.7rem; font-weight: bold;">導入</td>
      <td style="border: 1px solid #e5e5e5; padding: 0.7rem; background: #fdf0ef;">インストールしてD&amp;D</td>
      <td style="border: 1px solid #e5e5e5; padding: 0.7rem;">CADの上位エディションが前提</td>
      <td style="border: 1px solid #e5e5e5; padding: 0.7rem;">導入プロジェクトが必要</td>
      <td style="border: 1px solid #e5e5e5; padding: 0.7rem;">今日から始められる</td>
    </tr>
    <tr>
      <td style="border: 1px solid #e5e5e5; padding: 0.7rem; font-weight: bold;">ルール作成</td>
      <td style="border: 1px solid #e5e5e5; padding: 0.7rem; background: #fdf0ef;">設計者自身が書ける</td>
      <td style="border: 1px solid #e5e5e5; padding: 0.7rem;">標準ファイルの作成が必要</td>
      <td style="border: 1px solid #e5e5e5; padding: 0.7rem;">専門知識・ベンダー支援が要る</td>
      <td style="border: 1px solid #e5e5e5; padding: 0.7rem;">誰でも書けるが強制力はない</td>
    </tr>
    <tr>
      <td style="border: 1px solid #e5e5e5; padding: 0.7rem; font-weight: bold;">対象CAD</td>
      <td style="border: 1px solid #e5e5e5; padding: 0.7rem; background: #fdf0ef;">中立フォーマット経由で横断</td>
      <td style="border: 1px solid #e5e5e5; padding: 0.7rem;">そのCAD専用</td>
      <td style="border: 1px solid #e5e5e5; padding: 0.7rem;">主要CADを広くカバー</td>
      <td style="border: 1px solid #e5e5e5; padding: 0.7rem;">制約なし（人が見るため）</td>
    </tr>
    <tr>
      <td style="border: 1px solid #e5e5e5; padding: 0.7rem; font-weight: bold;">コスト感</td>
      <td style="border: 1px solid #e5e5e5; padding: 0.7rem; background: #fdf0ef;">設計部門で決裁できる範囲</td>
      <td style="border: 1px solid #e5e5e5; padding: 0.7rem;">CADライセンスに依存</td>
      <td style="border: 1px solid #e5e5e5; padding: 0.7rem;">高額</td>
      <td style="border: 1px solid #e5e5e5; padding: 0.7rem;">ゼロ（ただし人件費はかかる）</td>
    </tr>
    <tr>
      <td style="border: 1px solid #e5e5e5; padding: 0.7rem; font-weight: bold;">チェックの一貫性</td>
      <td style="border: 1px solid #e5e5e5; padding: 0.7rem; background: #fdf0ef;">毎回同じ基準</td>
      <td style="border: 1px solid #e5e5e5; padding: 0.7rem;">毎回同じ基準</td>
      <td style="border: 1px solid #e5e5e5; padding: 0.7rem;">毎回同じ基準</td>
      <td style="border: 1px solid #e5e5e5; padding: 0.7rem;">人と日によってばらつく</td>
    </tr>
  </tbody>
</table>
</div>

大企業がSASIGやVDAといった業界標準に沿った本格的な品質検証をしたいなら、実績あるエンタープライズ製品を選ぶべきです。CADチェッカーが向いているのは、その手前で「まず自社ルールが守られている状態」を作りたい現場です。

---

## こんな設計部門に向いています

- 検図が特定のベテランに依存していて、その人が抜けると回らない
- 社内設計標準はあるが、守られているかどうかを誰も確認できていない
- 部品番号・プロパティ・命名規則の不備が、後工程から指摘されて戻ってくる
- 図面の社外持ち出しが禁止されていて、クラウド型のツールを検討しにくい

---

## 開発状況とご案内

CADチェッカーは現在開発中です。どのCAD・どのルールから対応するかを、実際に困っている現場の声を聞きながら決めたいと考えています。

以下からメールアドレスをご登録いただくと、**先行利用のご案内と開発状況をお送りします**。「こういうルールをチェックしたい」というご要望も歓迎です。

<div style="background: #f9f9f9; padding: 1.5rem; border-radius: 8px; margin: 1rem 0;">
<form name="inquiry-cad-checker" method="POST" data-netlify="true" netlify-honeypot="bot-field" id="cadCheckerForm">
  <input type="hidden" name="form-name" value="inquiry-cad-checker" />
  <p style="display: none;">
    <label>この欄は空のままにしてください: <input name="bot-field" /></label>
  </p>
  <div style="margin-bottom: 1rem;">
    <label style="display: block; font-weight: bold; margin-bottom: 0.4rem;">メールアドレス <span style="color: #e83929;">*</span></label>
    <input type="email" name="email" required placeholder="your@email.com" style="width: 100%; padding: 0.6rem 0.8rem; border: 1px solid #ddd; border-radius: 6px; font-size: 1rem; box-sizing: border-box;" />
  </div>
  <div style="margin-bottom: 1rem;">
    <label style="display: block; font-weight: bold; margin-bottom: 0.4rem;">お使いの3D CAD <span style="color: #e83929;">*</span></label>
    <select name="cad" required style="width: 100%; padding: 0.6rem 0.8rem; border: 1px solid #ddd; border-radius: 6px; font-size: 1rem; background: white;">
      <option value="">選択してください</option>
      <option value="solidworks">SOLIDWORKS</option>
      <option value="inventor">Autodesk Inventor</option>
      <option value="fusion360">Fusion 360</option>
      <option value="nx">NX</option>
      <option value="creo">Creo</option>
      <option value="catia">CATIA</option>
      <option value="icad">iCAD SX</option>
      <option value="solidedge">Solid Edge</option>
      <option value="other">その他・複数</option>
    </select>
  </div>
  <div style="margin-bottom: 1rem;">
    <label style="display: block; font-weight: bold; margin-bottom: 0.4rem;">月あたりのチェック対象モデル数 <span style="color: #e83929;">*</span></label>
    <select name="volume" required style="width: 100%; padding: 0.6rem 0.8rem; border: 1px solid #ddd; border-radius: 6px; font-size: 1rem; background: white;">
      <option value="">選択してください</option>
      <option value="under_50">〜50件</option>
      <option value="under_200">51〜200件</option>
      <option value="under_1000">201〜1,000件</option>
      <option value="over_1000">1,000件以上</option>
    </select>
  </div>
  <div style="margin-bottom: 1rem;">
    <label style="display: block; font-weight: bold; margin-bottom: 0.4rem;">1ライセンスあたり月額いくらまでなら検討できますか？ <span style="color: #e83929;">*</span></label>
    <select name="budget" required style="width: 100%; padding: 0.6rem 0.8rem; border: 1px solid #ddd; border-radius: 6px; font-size: 1rem; background: white;">
      <option value="">選択してください</option>
      <option value="free_only">無料でなければ使わない</option>
      <option value="under_5000">〜5,000円/月</option>
      <option value="under_20000">〜20,000円/月</option>
      <option value="under_50000">〜50,000円/月</option>
      <option value="over_50000">50,000円/月以上・相談したい</option>
    </select>
  </div>
  <div style="margin-bottom: 1rem;">
    <label style="display: block; font-weight: bold; margin-bottom: 0.4rem;">導入を検討している時期は？ <span style="color: #e83929;">*</span></label>
    <select name="timeline" required style="width: 100%; padding: 0.6rem 0.8rem; border: 1px solid #ddd; border-radius: 6px; font-size: 1rem; background: white;">
      <option value="">選択してください</option>
      <option value="immediate">すぐにでも（1ヶ月以内）</option>
      <option value="3months">3ヶ月以内</option>
      <option value="6months">半年以内</option>
      <option value="undecided">まだ未定・情報収集中</option>
    </select>
  </div>
  <div style="margin-bottom: 1.5rem;">
    <label style="display: block; font-weight: bold; margin-bottom: 0.4rem;">チェックしたいルール・現在の課題（任意）</label>
    <textarea name="message" rows="4" placeholder="例: 部品番号の採番規則、材質プロパティの記入漏れ、ファイル名と図番の不一致 など" style="width: 100%; padding: 0.6rem 0.8rem; border: 1px solid #ddd; border-radius: 6px; font-size: 1rem; box-sizing: border-box; resize: vertical;"></textarea>
  </div>
  <button type="submit" style="background-color: #e83929; color: white; padding: 14px 36px; border: none; border-radius: 8px; font-size: 1.1rem; font-weight: bold; cursor: pointer; width: 100%;">
    先行利用の案内を受け取る →
  </button>
</form>
</div>

---

**3D CADデータの自動処理・設計業務の効率化でお困りのことはありませんか？**

技術相談や開発サポートを承っています。お気軽にご相談ください。

[ココナラで開発相談を依頼する](https://coconala.com/users/1993863)

<script>
(function () {
  var models = document.getElementById('calcModels');
  var minutes = document.getElementById('calcMinutes');
  var rate = document.getElementById('calcRate');
  var ratio = document.getElementById('calcRatio');
  if (!models || !minutes || !rate || !ratio) return;

  var ratioLabel = document.getElementById('calcRatioLabel');
  var hoursOut = document.getElementById('calcHours');
  var yenOut = document.getElementById('calcYen');
  var reported = false;

  var num = function (el) {
    var v = parseFloat(el.value);
    return isFinite(v) && v > 0 ? v : 0;
  };

  var update = function () {
    var r = num(ratio) / 100;
    var hours = num(models) * 12 * (num(minutes) / 60) * r;
    var yen = hours * num(rate);
    ratioLabel.textContent = Math.round(num(ratio));
    hoursOut.textContent = Math.round(hours).toLocaleString('ja-JP') + ' 時間';
    yenOut.textContent = Math.round(yen).toLocaleString('ja-JP') + ' 円';
  };

  var track = function () {
    if (reported) return;
    reported = true;
    if (typeof gtag === 'function') {
      gtag('event', 'simulator_used', { cta_location: 'lp_cad_checker' });
    }
  };

  [models, minutes, rate, ratio].forEach(function (el) {
    el.addEventListener('input', function () {
      update();
      track();
    });
  });

  var form = document.getElementById('cadCheckerForm');
  if (form) {
    form.addEventListener('submit', function () {
      if (typeof gtag === 'function') {
        gtag('event', 'form_submit', { cta_location: 'lp_cad_checker' });
      }
    });
  }

  update();
})();
</script>
