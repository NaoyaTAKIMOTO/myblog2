# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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
- [ ] 技術系の記事を何かができるという視点から課題解決という視点の書き方にリライト、もしくは単純に新しい記事を作成