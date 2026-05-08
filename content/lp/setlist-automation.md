---
title: "セットリスト自動生成"
subtitle: "バンドの曲順をAIが最適化。転換ロスを最小化したセットリストを秒で作る"
comments: false
---

## セットリスト作りに30分かけていませんか？

ライブのセットリストを作るとき、メンバー交代の多い曲順は避けたい、でも流れも大事——複数の制約を頭で考えながら組むのは想像以上に手間がかかります。

**セットリスト自動生成** は、OR-ToolsのTSPソルバーを使ってメンバー転換コストを最小化した曲順を自動計算するツールです。YouTube APIで曲の長さも自動取得し、ライブ時間に収まるセットリストを秒で生成します。

---

## できること

### 転換コストを最小化した曲順を自動計算
各曲のパート編成（ギター・ベース・ドラム・ボーカル）を入力すると、メンバー交代が最も少ない曲順をOR-Toolsが計算します。

### YouTube APIで曲の長さを自動取得
YouTubeのURLを登録するだけで曲の長さを自動取得。「ライブ時間45分以内」といった制約を満たすセットリストを生成します。

### 自動休憩挿入
セット間の休憩タイミングを自動で挿入。MCの時間も考慮したスケジュールを作成できます。

### Googleスプレッドシートと連携
生成したセットリストをスプレッドシートに書き出し。メンバーへの共有・印刷まで一気通貫で処理できます。

---

## こんな人に向いています

- メンバーチェンジが多いバンドのリーダー・セトリ担当
- 複数セットのライブや発表会を仕切る人
- 毎回セットリストを最適化したいが時間をかけたくない人

---

## 利用意向の確認

有料プランの利用を検討している方はこちらからご回答ください。

<div style="background: #f9f9f9; padding: 1.5rem; border-radius: 8px; margin: 1rem 0;">
<form name="inquiry-setlist-automation" method="POST" data-netlify="true">
  <input type="hidden" name="form-name" value="inquiry-setlist-automation" />
  <div style="margin-bottom: 1rem;">
    <label style="display: block; font-weight: bold; margin-bottom: 0.4rem;">メールアドレス <span style="color: #e83929;">*</span></label>
    <input type="email" name="email" required placeholder="your@email.com" style="width: 100%; padding: 0.6rem 0.8rem; border: 1px solid #ddd; border-radius: 6px; font-size: 1rem; box-sizing: border-box;" />
  </div>
  <div style="margin-bottom: 1rem;">
    <label style="display: block; font-weight: bold; margin-bottom: 0.4rem;">月額いくらまでなら利用を検討できますか？ <span style="color: #e83929;">*</span></label>
    <select name="budget" required style="width: 100%; padding: 0.6rem 0.8rem; border: 1px solid #ddd; border-radius: 6px; font-size: 1rem; background: white;">
      <option value="">選択してください</option>
      <option value="free_only">無料でなければ使わない</option>
      <option value="under_3000">〜3,000円/月</option>
      <option value="under_10000">〜10,000円/月</option>
      <option value="under_30000">〜30,000円/月</option>
      <option value="over_30000">30,000円/月以上・相談したい</option>
    </select>
  </div>
  <div style="margin-bottom: 1rem;">
    <label style="display: block; font-weight: bold; margin-bottom: 0.4rem;">利用開始を検討している時期は？ <span style="color: #e83929;">*</span></label>
    <select name="timeline" required style="width: 100%; padding: 0.6rem 0.8rem; border: 1px solid #ddd; border-radius: 6px; font-size: 1rem; background: white;">
      <option value="">選択してください</option>
      <option value="immediate">すぐにでも（1ヶ月以内）</option>
      <option value="3months">3ヶ月以内</option>
      <option value="6months">半年以内</option>
      <option value="undecided">まだ未定</option>
    </select>
  </div>
  <div style="margin-bottom: 1.5rem;">
    <label style="display: block; font-weight: bold; margin-bottom: 0.4rem;">ご要望・ご質問（任意）</label>
    <textarea name="message" rows="4" placeholder="使いたい機能、現在の課題など" style="width: 100%; padding: 0.6rem 0.8rem; border: 1px solid #ddd; border-radius: 6px; font-size: 1rem; box-sizing: border-box; resize: vertical;"></textarea>
  </div>
  <button type="submit" style="background-color: #e83929; color: white; padding: 14px 36px; border: none; border-radius: 8px; font-size: 1.1rem; font-weight: bold; cursor: pointer; width: 100%;">
    送信する →
  </button>
</form>
</div>

---

**最適化・自動化ツールの開発でお困りのことはありませんか？**

技術相談や開発サポートを承っています。お気軽にご相談ください。

[ココナラで開発相談を依頼する](https://coconala.com/users/1993863)
