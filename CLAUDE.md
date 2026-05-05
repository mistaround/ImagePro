# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ImagePro is a cross-platform desktop image viewer/comparison tool for AIGC experiment evaluation and dataset quality screening. Built with Electron 28 + React 18 + TypeScript + Vite (electron-vite) + Tailwind CSS + Zustand.

## Build/Run Commands

```bash
npm run dev          # Start Electron dev server with hot reload
npm run build        # Production build
npm run preview      # Preview production build
```

## Architecture

**Three-column layout**: Sidebar (220px, resizable, collapsible) | Main Area (toolbar + content + bottom bar)

**Process model**:
- `electron/` — Main process: file scanning (recursive image discovery), thumbnail generation (sharp, cached to `~/.imagepro/thumbs/` by path+mtime key), SQLite tag storage, file operations (copy/move/trash). All filesystem access is IPC-only; renderer never touches `fs` directly.
- `electron/preload.ts` — Bridges IPC handlers to `window.api` for the renderer.
- `src/` — Renderer (React): UI components, Zustand stores, keyboard shortcuts hook.

**Core features** (10-step implementation plan in `imagepro-dev-guide.md`):
1. Grid view with virtual scrolling (`@tanstack/react-virtual`), 2/4/6/8 columns, zoom slider
2. 4-color tagging system (red/yellow/blue/green) with SQLite persistence at `~/.imagepro/tags.db`
3. Compare mode: align images by filename across experiment folders, synced scroll/zoom panels
4. Folder picker modal with filesystem tree + thumbnail preview
5. Session save/restore (folder list, aliases, view state)
6. Export to CSV/JSON

**State stores** (Zustand): `folderStore` (folder list, aliases, colors), `imageStore` (image list, current view), `tagStore` (tag state), `sessionStore` (session persistence).

## Key Constraints

- Max 8 experiment folders at a time (color pool of 8 predefined colors).
- Delete always moves to system trash (use `trash` npm package), never `fs.unlink` directly.
- Thumbnail cache keyed by file path + mtime; revoke blob URLs for off-screen images to prevent memory leaks.
- Cross-platform path handling: always use `path.join`, never hardcode separators.
- Sidebar width persisted to localStorage.

## Design Tokens

Dark theme. Key colors: bg `#0e0e16`, surface `#14141f`, panel `#1a1a28`, accent `#6c63ff`, text `#e8e8f0`, muted `#8888a8`. Experiment colors (8): `#ff5f7e`, `#ffb347`, `#4ecdc4`, `#6c63ff`, `#a8ff78`, `#f7971e`, `#c471ed`, `#12c2e9`. Tag colors: red `#ff4757`, yellow `#ffa502`, blue `#1e90ff`, green `#2ed573`.

UI design mockup: `imagepro-design.html` (open in browser).
