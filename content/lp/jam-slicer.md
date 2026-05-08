---
title: "JamSlicer"
subtitle: "配信録画を無音検知で自動分割。編集時間を10分の1に"
comments: false
---

## 長時間録画の切り出し作業、まだ手動でやっていますか？

配信録画から「いいシーン」だけを切り出す作業は、再生しながら手動でタイムスタンプを記録する地道な作業です。

**JamSlicer** は、FFmpegのsilencedetectフィルターを使って動画の無音区間を検出し、曲・シーン・セッションごとに自動で分割するWebアプリです。バンドのライブ録画、配信アーカイブ、練習録音の切り出しに最適です。

---

## できること

### 無音区間を検出して自動分割
FFmpegが無音区間を検出し、区切れ目ごとにファイルを分割します。閾値と最小無音時間はUIから調整可能です。

### 従来比10〜20倍の処理速度
librosa/moviepy実装と比べてFFmpegネイティブ処理により高速化。メモリ使用量も1/100以下に抑えています。

### ブラウザで完結するWebUI
ファイルをドラッグ＆ドロップしてパラメータを設定するだけ。コマンドライン不要で誰でも使えます。

### 分割後ファイルを一括ダウンロード
分割結果をZIPで一括ダウンロードできます。命名規則も自動で整理されます。

---

## こんな人に向いています

- バンドのライブ・練習録画を曲ごとに切り出したい人
- ゲーム配信・雑談配信のアーカイブを章ごとに分けたい人
- 音声収録データを発話ごとに自動分割したいエンジニア

---

## 利用意向の確認

有料プランの利用を検討している方はこちらからご回答ください。

<div style="background: #f9f9f9; padding: 1.5rem; border-radius: 8px; margin: 1rem 0;">
<form name="inquiry-jam-slicer" method="POST" data-netlify="true">
  <input type="hidden" name="form-name" value="inquiry-jam-slicer" />
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

**動画処理・自動化ツールの開発でお困りのことはありませんか？**

技術相談や開発サポートを承っています。お気軽にご相談ください。

[ココナラで開発相談を依頼する](https://coconala.com/users/1993863)
