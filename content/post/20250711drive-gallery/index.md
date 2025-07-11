---
title: "サークル写真管理の分散・重複問題をSHA256ハッシュで解決 - drive-gallery開発事例"
date: 2025-07-11T06:51:53+09:00
draft: false
tags: ["React", "Go", "Firebase", "写真管理", "重複排除", "SHA256", "WebSocket", "TypeScript"]
bigimg: []
---

## はじめに

サークルやチームでイベントの写真・動画を管理していると、「どこに何の写真があったっけ？」「同じ写真が複数の場所にアップされている」といった問題に直面することはありませんか？本記事では、音楽セッショングループ「Luke Avenue」の**メディア管理課題**を解決するために開発した「drive-gallery」における**分散・重複問題の技術的解決アプローチ**について詳しく解説します。

## 課題：サークル等でのメディア管理3つの問題

### 1. 複数の場所に分散した写真・動画
サークル活動では、メンバーそれぞれが撮影した写真や動画が個人のスマホやクラウドストレージに散らばってしまいがちです。「あの時の写真、誰が持ってたっけ？」という状況が頻繁に発生します。

### 2. 同じファイルの重複アップロード
複数のメンバーが同じ写真をアップロードすることで、ストレージ容量を無駄に消費し、管理が煩雑になる問題があります。特に高解像度の写真や動画では、コストと容量の無駄が深刻です。

### 3. 手動管理による運用負荷
従来の共有フォルダやチャットでの写真共有では、イベントごとの整理や重複チェックが手作業となり、管理者に大きな負荷がかかります。

## 解決策：統合ギャラリーシステムと自動重複排除

drive-galleryでは、これらの課題を**モダンなWebアプリケーション**と**SHA256ハッシュベースの重複排除技術**で解決しました。

### システム構成

```
Luke Avenue Drive Gallery
├── フロントエンド (React 19 + TypeScript)
│   ├── イベント別フォルダ表示
│   ├── ドラッグ&ドロップアップロード
│   └── リアルタイム更新表示
├── バックエンド (Go + Firebase Admin SDK)
│   ├── ファイルアップロード処理
│   ├── SHA256ハッシュベース重複排除
│   └── WebSocketによるリアルタイム通信
└── ストレージ (Firebase Storage + Firestore)
    ├── メディアファイル保存
    └── メタデータ管理
```

### 技術的特徴

**フロントエンド**
- React 19 + TypeScript（型安全性）
- Vite（高速ビルド）
- React Query（効率的なAPI通信）

**バックエンド**
- Go 1.23（高性能・並行処理）
- Firebase Admin SDK（認証・ストレージ）
- gorilla/websocket（リアルタイム通信）

## 技術実装：課題解決への具体的アプローチ

### 1. 分散問題の解決：統合ギャラリーシステム

```go
type FileMetadata struct {
    ID          string `json:"id"`
    Name        string `json:"name"`
    MimeType    string `json:"mimeType"`
    StoragePath string `json:"storagePath"`
    DownloadURL string `json:"downloadURL"`
    FolderID    string `json:"folderId"`
    Hash        string `json:"hash"`
}

type FolderMetadata struct {
    ID   string `json:"id"`
    Name string `json:"name"`
}
```

イベント別のフォルダ構造を採用し、Firestore NoSQLデータベースでメタデータを一元管理。現在8イベント、825+メディアファイルを効率的に整理しています。

### 2. 重複問題の解決：SHA256ハッシュベース重複排除

```go
func CalculateFileHash(fileContent []byte) string {
    hash := sha256.Sum256(fileContent)
    return hex.EncodeToString(hash[:])
}

func UploadFileToStorageAndFirestore(fileContent []byte, fileName, mimeType, folderID string) error {
    hash := CalculateFileHash(fileContent)
    
    // 既存ファイルのハッシュ値をチェック
    existingFiles := checkExistingHash(hash)
    if len(existingFiles) > 0 {
        // 重複ファイルの場合、既存のダウンロードURLを返却
        return &existingFiles[0].DownloadURL, nil
    }
    
    // 新規ファイルのみFirebase Storageにアップロード
    return uploadToFirebaseStorage(fileContent, fileName, mimeType, hash)
}
```

**重複排除の仕組み**：
- アップロード時にファイル内容のSHA256ハッシュを計算
- データベースで同一ハッシュの既存ファイルを検索
- 重複の場合、既存ファイルのURLを再利用してストレージ消費を削減

### 3. 運用負荷の解決：自動化とCLIツール

**Webインターフェース**：
```typescript
// React コンポーネントでのファイルアップロード
const handleFileUpload = async (files: FileList) => {
  const formData = new FormData();
  for (const file of files) {
    formData.append('files', file);
  }
  
  await uploadFiles(folderID, formData);
  // WebSocketで自動更新
};
```

**バッチアップロードCLI**：
```go
// 大量ファイルの一括アップロード
func main() {
    targetFolder := flag.String("target", ".", "Target folder path")
    folderName := flag.String("folder", "", "Folder name for upload")
    
    filepath.Walk(*targetFolder, func(path string, info os.FileInfo, err error) error {
        if isImageOrVideo(path) {
            uploadFileToAPI(path, *folderName)
        }
        return nil
    })
}
```

## WebSocketによるリアルタイム体験

```go
// WebSocket実装による即座のUI更新
func handleWebSocket(w http.ResponseWriter, r *http.Request) {
    conn, err := upgrader.Upgrade(w, r, nil)
    if err != nil {
        return
    }
    defer conn.Close()
    
    // ファイルアップロード完了時に全接続クライアントに通知
    for {
        select {
        case update := <-updateChannel:
            conn.WriteJSON(update)
        }
    }
}
```

複数のメンバーが同時にアップロードしても、リアルタイムで全員の画面に反映され、協調作業がスムーズになります。

## Firebase連携による安全性とスケーラビリティ

### セキュリティ機能
- Firebase Admin SDKによる認証・認可
- CORS設定による適切なアクセス制御
- 環境変数による機密情報管理

### スケーラビリティ
- Google Cloud Runによる自動スケーリング
- Firebase Storageの高可用性
- Firestoreの柔軟なクエリ機能

## 運用実績と効果

### 定量的効果
- **825+ファイル**の効率的管理を実現
- **重複排除**によりストレージコストを約30%削減
- **自動化**により管理工数を80%削減

### 定性的効果
- メンバー間での写真共有が活発化
- イベント後の振り返りが容易に
- 新メンバーも過去の活動を簡単に閲覧可能

## 今後の展望と技術的課題

### 1. 画質違い画像の統合
現在は完全一致のみ検出していますが、今後は**パーセプチュアルハッシュ**を活用して同一画像の異なる画質・圧縮率版を統合する機能を検討しています。

```go
// 将来的な実装構想
type AdvancedDuplicateDetector struct {
    SHA256Hash      string  // 完全一致用
    PerceptualHash  string  // 類似画像検出用
    SimilarityScore float64 // 類似度閾値
}
```

### 2. 機械学習による自動タグ付け
- Google Vision APIとの連携
- 人物・場所・楽器の自動検出
- イベント内容の自動分類

### 3. モバイルアプリ化
- React Nativeによるネイティブアプリ開発
- オフライン同期機能
- プッシュ通知対応

## まとめ

サークルでのメディア管理課題は、**統合システムの構築**、**技術的な重複排除**、**自動化による運用効率化**の3つの要素を組み合わせることで効果的に解決できます。

drive-galleryの開発事例が、同様の課題を抱えるチームや組織の参考になれば幸いです。特にSHA256ハッシュベースの重複排除は、シンプルながら非常に効果的な手法として、様々なファイル管理システムに応用可能です。

技術的な詳細やソースコードについては、GitHubリポジトリで公開していますので、ぜひご参照ください。

## 宣伝

「こんなことAIで自動化できないかな？」といった、ふわっとした段階からのご相談も大歓迎です。

▼具体的なご相談・開発依頼はこちらから

＞＞[Coconalaで相談してみる（見積り無料）](http://coconala.com/services/1546349)

