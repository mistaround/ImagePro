import { ipcMain } from 'electron'
import Database from 'better-sqlite3'
import { join } from 'path'
import { homedir } from 'os'
import { existsSync, mkdirSync } from 'fs'

const DB_DIR = join(homedir(), '.imagepro')
const DB_PATH = join(DB_DIR, 'tags.db')

function getDb(): Database.Database {
  if (!existsSync(DB_DIR)) {
    mkdirSync(DB_DIR, { recursive: true })
  }
  const db = new Database(DB_PATH)
  db.pragma('journal_mode = WAL')
  db.exec(`
    CREATE TABLE IF NOT EXISTS tags (
      file_path TEXT PRIMARY KEY,
      tag       TEXT,
      tagged_at INTEGER
    );
    CREATE TABLE IF NOT EXISTS sessions (
      id         TEXT PRIMARY KEY,
      name       TEXT,
      data       TEXT,
      created_at INTEGER
    );
  `)
  return db
}

let db: Database.Database | null = null

function ensureDb(): Database.Database {
  if (!db) db = getDb()
  return db
}

export function registerTagsIPC(): void {
  ipcMain.handle('tags:get', (_, filePath: string) => {
    const row = ensureDb().prepare('SELECT tag FROM tags WHERE file_path = ?').get(filePath) as
      | { tag: string }
      | undefined
    return row?.tag ?? null
  })

  ipcMain.handle('tags:set', (_, filePath: string, tag: string | null) => {
    if (tag) {
      ensureDb()
        .prepare('INSERT OR REPLACE INTO tags (file_path, tag, tagged_at) VALUES (?, ?, ?)')
        .run(filePath, tag, Date.now())
    } else {
      ensureDb().prepare('DELETE FROM tags WHERE file_path = ?').run(filePath)
    }
  })

  ipcMain.handle('tags:batchGet', (_, filePaths: string[]) => {
    const d = ensureDb()
    const stmt = d.prepare('SELECT file_path, tag FROM tags WHERE file_path = ?')
    const result: Record<string, string> = {}
    for (const fp of filePaths) {
      const row = stmt.get(fp) as { file_path: string; tag: string } | undefined
      if (row) result[row.file_path] = row.tag
    }
    return result
  })

  ipcMain.handle('tags:getAll', () => {
    const rows = ensureDb().prepare('SELECT file_path, tag FROM tags').all() as {
      file_path: string
      tag: string
    }[]
    const result: Record<string, string> = {}
    for (const r of rows) result[r.file_path] = r.tag
    return result
  })

  ipcMain.handle('tags:undo', () => {
    // Undo is handled in the renderer tagStore; this is a no-op on main side.
    // The renderer tracks history and calls tags:set to revert.
  })

  // Session handlers
  ipcMain.handle('session:save', (_, session: { id: string; name: string; data: string }) => {
    ensureDb()
      .prepare('INSERT OR REPLACE INTO sessions (id, name, data, created_at) VALUES (?, ?, ?, ?)')
      .run(session.id, session.name, session.data, Date.now())
  })

  ipcMain.handle('session:load', (_, id: string) => {
    const row = ensureDb()
      .prepare('SELECT * FROM sessions WHERE id = ?')
      .get(id) as { id: string; name: string; data: string; created_at: number } | undefined
    return row ?? null
  })

  ipcMain.handle('session:list', () => {
    return ensureDb()
      .prepare('SELECT id, name, created_at FROM sessions ORDER BY created_at DESC')
      .all()
  })

  ipcMain.handle('session:delete', (_, id: string) => {
    ensureDb().prepare('DELETE FROM sessions WHERE id = ?').run(id)
  })
}
