# ImagePro — Claude Code 开发指南

## 项目概述

ImagePro 是一个跨平台桌面看图对比工具，主要用于：
- AIGC 实验结果的横向对比评估
- 数据集质量筛选与打标

**UI 设计稿文件**：`imagepro-design.html`（同目录，直接在浏览器打开查看）

---

## 技术栈

| 层级 | 技术选型 | 说明 |
|------|----------|------|
| 桌面框架 | Electron 28 | 跨平台，Node.js IPC 文件操作 |
| 前端框架 | React 18 + TypeScript | 组件化，类型安全 |
| 构建工具 | Vite + electron-vite | 快速热更新 |
| 样式 | Tailwind CSS | 与设计 token 对齐 |
| 状态管理 | Zustand | 轻量，支持持久化 |
| 图片处理 | sharp (Node.js) | 缩略图生成、格式转换 |
| 数据存储 | better-sqlite3 | 本地 tag 数据、session 存储 |
| 虚拟列表 | @tanstack/react-virtual | 大量图片时性能保障 |

---

## 设计 Token（来自设计稿）

```typescript
// src/styles/tokens.ts
export const tokens = {
  colors: {
    bg:       '#0e0e16',
    surface:  '#14141f',
    panel:    '#1a1a28',
    border:   '#252535',
    border2:  '#2e2e45',
    text:     '#e8e8f0',
    muted:    '#8888a8',
    dim:      '#444460',
    accent:   '#6c63ff',
  },
  // 实验文件夹颜色池（最多8个）
  expColors: [
    '#ff5f7e', '#ffb347', '#4ecdc4', '#6c63ff',
    '#a8ff78', '#f7971e', '#c471ed', '#12c2e9',
  ],
  // 标记颜色
  tagColors: {
    red:    '#ff4757',
    yellow: '#ffa502',
    blue:   '#1e90ff',
    green:  '#2ed573',
  },
}
```

---

## 项目结构

```
imagepro/
├── electron/
│   ├── main.ts              # Electron 主进程
│   ├── preload.ts           # 预加载脚本（IPC 桥接）
│   └── ipc/
│       ├── folder.ts        # 文件夹扫描、监听
│       ├── thumbnail.ts     # 缩略图生成（sharp）
│       ├── tags.ts          # 标记读写（SQLite）
│       └── fileops.ts       # 复制、移动、删除
├── src/
│   ├── App.tsx
│   ├── styles/
│   │   └── tokens.ts
│   ├── store/
│   │   ├── folderStore.ts   # 文件夹列表、alias、颜色
│   │   ├── imageStore.ts    # 图片列表、当前视图
│   │   ├── tagStore.ts      # 标记状态
│   │   └── sessionStore.ts  # Session 保存/恢复
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Toolbar.tsx
│   │   │   └── BottomBar.tsx
│   │   ├── sidebar/
│   │   │   ├── FolderList.tsx
│   │   │   ├── FolderItem.tsx
│   │   │   ├── FavoriteList.tsx
│   │   │   └── TagStats.tsx
│   │   ├── grid/
│   │   │   ├── ImageGrid.tsx       # 虚拟化网格
│   │   │   ├── ImageCard.tsx       # 单张图片卡片
│   │   │   └── SourceOverlay.tsx   # 实验来源标签覆盖层
│   │   ├── compare/
│   │   │   ├── CompareView.tsx     # 对比模式容器
│   │   │   ├── ComparePanel.tsx    # 单列对比面板
│   │   │   └── SyncControls.tsx    # 同步缩放/滚动控制
│   │   └── modals/
│   │       ├── FolderPicker.tsx    # 文件夹选择器（含预览）
│   │       └── FullscreenViewer.tsx
│   └── hooks/
│       ├── useKeyboard.ts   # 全局快捷键
│       ├── useThumbnail.ts  # 缩略图懒加载
│       └── useSync.ts       # 跨面板同步滚动/缩放
├── package.json
└── electron-vite.config.ts
```

---

## 开发步骤

### Step 1 — 项目初始化

```bash
npm create electron-vite@latest imagepro -- --template react-ts
cd imagepro
npm install

# 核心依赖
npm install zustand @tanstack/react-virtual better-sqlite3
npm install -D tailwindcss @types/better-sqlite3

# 图片处理（主进程）
npm install sharp
```

**配置 Tailwind**，在 `tailwind.config.js` 中注册设计 token 颜色：

```js
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0e0e16',
        surface: '#14141f',
        panel: '#1a1a28',
        border: '#252535',
        accent: '#6c63ff',
        muted: '#8888a8',
      }
    }
  }
}
```

**验收标准**：`npm run dev` 能启动 Electron 窗口，显示空白深色背景。

---

### Step 2 — 三栏布局骨架

实现 `App.tsx` 的主布局，参考设计稿 **Screen 1**：

```
[侧边栏 220px 可拖拽调整] | [主区域]
                              ├─ [工具栏 40px]
                              ├─ [内容区 flex-1]
                              └─ [底部操作栏 44px]
```

关键交互：
- 侧边栏宽度可拖拽（鼠标拖动分割线），最小 48px（图标模式），最大 320px
- `[☰]` 按钮一键收起至 0px，再次点击恢复
- 侧边栏宽度存入 localStorage 持久化

**验收标准**：三栏布局正确渲染，侧边栏可拖拽和折叠。

---

### Step 3 — IPC 文件系统层

在 `electron/ipc/folder.ts` 实现以下接口，**所有文件操作必须在主进程通过 IPC 完成**，禁止在 renderer 直接使用 `fs`：

```typescript
// 扫描文件夹，返回图片文件列表
ipcMain.handle('folder:scan', async (_, folderPath: string) => {
  // 递归扫描 .png .jpg .jpeg .webp .bmp .tiff .gif
  // 返回 { path, name, size, mtime, width?, height? }[]
})

// 监听文件夹变化（使用 chokidar）
ipcMain.handle('folder:watch', async (_, folderPath: string) => { ... })

// 生成缩略图（sharp，最大 300px，缓存到 ~/.imagepro/thumbs/）
ipcMain.handle('thumbnail:get', async (_, imagePath: string) => {
  // 返回 base64 字符串
})

// 文件操作
ipcMain.handle('file:copy', ...)
ipcMain.handle('file:move', ...)
ipcMain.handle('file:delete', ...)  // 移入系统回收站，不要直接删除
```

**验收标准**：通过 DevTools console 调用 `window.api.folderScan('/path')` 能返回图片列表。

---

### Step 4 — 侧边栏组件

参考设计稿 **Screen 1 侧边栏**，实现以下功能：

**FolderList 组件**：
- 显示已添加的文件夹，每个带颜色色块、alias 名称、路径、图片数量
- alias 点击可内联编辑（double click → input）
- 颜色从 `expColors` 池自动分配，支持点击换色
- 拖拽排序（react-beautiful-dnd 或原生 drag API）
- 最多支持 8 个文件夹，超出时禁用"添加"按钮

**FavoriteList 组件**：
- 展示收藏的文件夹路径，点击快速添加到当前实验组
- 右键菜单：取消收藏

**TagStats 组件**：
- 显示红/黄/蓝/绿各颜色的标记数量
- 点击颜色 → 主网格自动过滤为该标记的图片

**验收标准**：侧边栏可添加/删除/重命名文件夹，颜色分配正确。

---

### Step 5 — 图片网格视图

参考设计稿 **Screen 1 主网格区**，这是性能最关键的组件：

**ImageGrid 组件**：
- 使用 `@tanstack/react-virtual` 虚拟化，支持 10000+ 图片不卡顿
- 支持 2/4/6/8 列切换（工具栏下拉）
- 全局缩放滑块（改变卡片尺寸，`[` `]` 快捷键）
- 按文件名/时间/大小排序

**ImageCard 组件**：
- 懒加载缩略图（IntersectionObserver）
- 右上角显示来源 overlay（实验色块 + alias 名）
- 右上角显示 tag 颜色小方块（若有标记）
- 选中态：accent 色边框 + 右下角勾选标记
- Hover 态：显示快速打标按钮（四色）
- 底部显示文件名 + 文件大小

**验收标准**：添加一个包含 500 张图的文件夹，网格滚动流畅无掉帧。

---

### Step 6 — 打标系统

数据存储方案：SQLite（`~/.imagepro/tags.db`）

```sql
CREATE TABLE tags (
  file_path TEXT PRIMARY KEY,
  tag       TEXT,  -- 'red' | 'yellow' | 'blue' | 'green'
  tagged_at INTEGER
);

CREATE TABLE sessions (
  id         INTEGER PRIMARY KEY,
  name       TEXT,
  folders    TEXT,  -- JSON
  created_at INTEGER
);
```

**快捷键打标**（`useKeyboard.ts`）：

| 键 | 动作 |
|----|------|
| `1` | 打红标 |
| `2` | 打黄标 |
| `3` | 打蓝标 |
| `4` | 打绿标 |
| `0` | 清除标记 |
| `Space` | 选中/取消选中当前聚焦图片 |
| `←` `→` | 网格模式：移动焦点；对比模式：上/下一组 |
| `Enter` | 打开全屏预览 |
| `Tab` | 跳到下一张**未标记**图片 |
| `Cmd+Z` | 撤销上次打标操作 |

**批量操作**（底部操作栏）：
- 选中多张 → 复制到/移动到（弹出文件夹选择器）→ 确认前展示文件清单
- 删除：移入系统回收站（使用 `trash` npm 包），不直接 `fs.unlink`

**验收标准**：对 20 张图快速用键盘 1-4 打标，刷新后标记持久化；Cmd+Z 能回退。

---

### Step 7 — 对比模式

参考设计稿 **Screen 2**，当用户点击"对比模式"时切换：

**核心逻辑**：将多个文件夹中**同名文件**对齐为行，每行横向展示来自不同实验的同名图片。

```typescript
// 对齐算法
function alignByName(folders: Folder[]): AlignedRow[] {
  // 1. 收集所有文件夹的文件名集合
  // 2. 取交集（或并集，可配置）
  // 3. 每行 = { filename, images: { [folderId]: ImageFile | null }[] }
}
```

**ComparePanel 组件**（每个实验一列）：
- 顶部固定实验来源 header（色块 + alias）
- 图片区域可独立缩放（滚轮）
- 同步开关开启时：缩放和滚动联动所有面板

**同步控制**（`useSync.ts`）：
- 同步滚动：监听任一面板 scroll 事件，同步到其他面板
- 同步缩放：任一面板缩放，同步 scale 值到所有面板

**验收标准**：3 个实验文件夹各 50 张同名图，对比视图正确对齐，同步滚动正常。

---

### Step 8 — 文件夹选择器 Modal

参考设计稿 **Screen 3**：

**FolderPicker 组件**：
- 左侧：文件系统树（从用户 home 目录开始，点击展开）
- 右侧：选中文件夹的图片缩略图预览（最多显示 16 张）
- 底部：alias 输入框 + 确认/取消
- 收藏路径功能：在 modal 内右键文件夹 → 加入收藏

**验收标准**：可正常浏览文件系统并预览，添加文件夹后侧边栏正确显示。

---

### Step 9 — Session 管理

允许用户保存/恢复当前工作状态：

```typescript
interface Session {
  id: string
  name: string
  folders: {
    path: string
    alias: string
    color: string
  }[]
  viewMode: 'grid' | 'compare'
  gridColumns: number
  createdAt: number
}
```

- 顶栏"Session ▾"下拉：显示历史 session，点击恢复
- 自动保存：每次添加/删除文件夹时更新 last session
- 启动时询问：是否恢复上次 session

**验收标准**：保存 session 后关闭重开，点击恢复后文件夹和 alias 完整还原。

---

### Step 10 — 导出功能

点击顶栏"导出结果"按钮：

```typescript
// 导出格式选项
type ExportFormat = 'csv' | 'json'

// CSV 格式
// file_path,folder,alias,tag,tagged_at
// /data/exp_a/img_001.png,实验A,Baseline,red,2024-01-15

// JSON 格式
// { summary: { red: 28, yellow: 19, blue: 41, green: 13 }, files: [...] }
```

**验收标准**：导出 CSV 用 Excel 打开，路径和标记信息完整正确。

---

## 性能要求

| 场景 | 目标 |
|------|------|
| 扫描 1000 张图片 | < 2 秒 |
| 网格滚动（1000 张）| 60fps |
| 缩略图首屏加载 | < 500ms |
| 切换对比模式 | < 300ms |
| 打标响应延迟 | < 50ms |

---

## 注意事项

1. **缩略图缓存**：以文件路径 + mtime 为 key，存入 `~/.imagepro/thumbs/`，避免重复生成
2. **内存管理**：网格视图超出可视区的图片 URL 要及时 `revoke`，防止内存泄漏
3. **文件操作确认**：删除和移动操作前必须弹确认框，展示受影响文件列表
4. **错误处理**：文件夹被删除、图片损坏等情况要优雅降级，不能崩溃
5. **多系统路径**：注意 Windows/macOS/Linux 路径分隔符差异，统一用 `path.join`
