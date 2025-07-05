# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

以下のリストを毎回唱えて
- 実際に行動し始める前に行動方針をユーザーと相談して同意を得る。
- トラブルが発生した時には原因の追及と解決に努める。
- その際に考えうる原因をあらかじめ列挙しておく。
- hugo new post/yyyymmdd:title/index.md
- 記事の最後にココナラの依頼ページへのリンクを貼る。

## Project Overview

This is a Hugo-based static site blog built with the Beautiful Hugo theme. The site is titled "サブカル科学研究会のブログ" (Subculture Science Research Group's Blog) and focuses on mathematical optimization, natural language processing, and miscellaneous topics.

## Key Commands

### Development and Build
- `hugo serve` - Start development server with live reload
- `hugo` - Build static site for production (outputs to `public/` directory)
- `hugo gen chromastyles --style=trac > static/css/syntax.css` - Generate syntax highlighting CSS

### Deployment
- Site is configured for Netlify deployment via `netlify.toml`
- Build command: `hugo`
- Publish directory: `public`
- Hugo version: 0.142.0

## Architecture and Structure

### Content Organization
- `content/post/` - Main blog posts (current posts)
- `content/post_old/` - Archived posts
- `content/page/` - Static pages (about.md)
- `content/portfolio.md` - Portfolio page
- `static/img/` - Static images and assets
- `layouts/` - Custom layout overrides
- `data/` - Data files for site configuration

### Theme Configuration
- Uses Beautiful Hugo theme as git submodule in `themes/beautifulhugo/`
- Main configuration in `config.toml`
- Site supports both English and Japanese content (hasCJKLanguage = true)
- Configured for syntax highlighting with Chroma (pygmentsCodeFences = true)

### Key Features Enabled
- Syntax highlighting (Chroma with "trac" style)
- Reading time and word count display
- Social sharing
- Related posts
- Comments system ready
- Responsive design
- Mathematical notation support via markup configuration

### Custom Layouts
- `layouts/_default/single.html` - Custom single post layout
- `layouts/partials/footer_custom.html` - Custom footer
- `layouts/partials/head_custom.html` - Custom head section

### Configuration Details
- Base URL: https://www.subcul-science.com
- Default language: Japanese
- Author: 近藤綾乃 (Twitter: @Vx5tN)
- Menu structure: Blog, Portfolio, About us, Tags
- Table of contents: levels 2-3, ordered
- Goldmark renderer with unsafe HTML enabled

## Content Management

### Blog Posts
- Posts are organized by date in folder structure (e.g., `20250125vite/`)
- Many posts support bilingual content (index.md and index.en.md)
- Posts include technical topics on ML, NLP, Python, and web development
- Images stored in post folders or `static/img/`

### Multilingual Support
- Some posts have both Japanese (index.md) and English (index.en.md) versions
- Content structure supports multiple languages via folder organization

## Development Notes

- The `public/` directory contains generated static files and should not be edited directly
- Theme customizations should be made in the root `layouts/` directory to override theme defaults
- Static assets go in `static/` directory and are copied to `public/` during build
- The site uses git submodules for theme management - use `git submodule update --init --recursive` if theme is missing

## TODO
- [x] 技術系の記事を何かができるという視点から課題解決という視点の書き方にリライト、もしくは単純に新しい記事を作成
  - ✅ MLflow記事（機械学習実験の再現性問題を解決）
  - ✅ Fasttext記事（文書分類の三重苦を解決）
  - ✅ Sentence BERT記事（日本語文書の意味的類似度計算問題を解決）
  - ✅ T5記事（日本語テキスト生成の精度・コスト問題を解決）【人気記事1位】
  - ✅ ffmpeg音量正規化記事（音声ファイルの音量バラツキ問題を解決）【人気記事1位】

## 記事のネタ
- turtle-buttler
    - ラインで公開しているチャットボット。LLMをバックエンドにしてカメ執事とおしゃべりできる。機能追加としてMCPサーバーを追加している。楽天の検索とユーザーの情報を動的に保存、読み取りする。いまいちユーザー獲得に苦戦している。
- drive-gellary
    - サークルの過去の写真や動画を閲覧するために作った。特に機能的に尖ったところはないはず。ユーザーがアップできる仕組みにはしてる。重複排除も入れてる。理想は同じ画像で画質違いとかを統合できるといいよね。