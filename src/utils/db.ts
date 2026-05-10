/**
 * IndexedDB 本地存储
 * 用于持久化保存排盘记录，支持历史查询、快速加载、删除
 */

import type { PersonInfo, AnalysisResult } from '../types'

const DB_NAME = 'yubi-panguan'
const DB_VERSION = 4
const STORE_NAME = 'records'
const DIVINATION_STORE = 'divination_records'
const COMPAT_STORE = 'compat_records'
const LEGACY_DB_NAMES = [
  DB_NAME,
  'yubi-yixue',
  'yubi-yixue-db',
  'yubi_yixue',
  'yubi-panguan-db',
  'yubi-panguan-local',
  'yubi-panguan-storage',
]

export interface SavedRecord {
  id: string
  person: PersonInfo
  createdAt: number
  lastUsed: number
  label: string // 自动生成的标签，如 "张三 · 男 · 1990年"
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      const tx = req.transaction
      if (!tx) return

      const store = db.objectStoreNames.contains(STORE_NAME)
        ? tx.objectStore(STORE_NAME)
        : db.createObjectStore(STORE_NAME, { keyPath: 'id' })
      if (!store.indexNames.contains('lastUsed')) {
        store.createIndex('lastUsed', 'lastUsed', { unique: false })
      }
      if (!store.indexNames.contains('label')) {
        store.createIndex('label', 'label', { unique: false })
      }

      const divStore = db.objectStoreNames.contains(DIVINATION_STORE)
        ? tx.objectStore(DIVINATION_STORE)
        : db.createObjectStore(DIVINATION_STORE, { keyPath: 'id' })
      if (!divStore.indexNames.contains('type')) {
        divStore.createIndex('type', 'type', { unique: false })
      }
      if (!divStore.indexNames.contains('createdAt')) {
        divStore.createIndex('createdAt', 'createdAt', { unique: false })
      }

      const compatStore = db.objectStoreNames.contains(COMPAT_STORE)
        ? tx.objectStore(COMPAT_STORE)
        : db.createObjectStore(COMPAT_STORE, { keyPath: 'id' })
      if (!compatStore.indexNames.contains('createdAt')) {
        compatStore.createIndex('createdAt', 'createdAt', { unique: false })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

function makeLabel(p: PersonInfo): string {
  return `${p.name} · ${p.gender} · ${p.birthYear}年${String(p.birthMonth).padStart(2, '0')}月${String(p.birthDay).padStart(2, '0')}日`
}

function parseMaybeJson(value: unknown): any {
  if (typeof value !== 'string') return value
  try {
    return JSON.parse(value)
  } catch {
    return value
  }
}

function toTimestamp(value: unknown, fallback = Date.now()): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const numeric = Number(value)
    if (Number.isFinite(numeric) && numeric > 0) return numeric
    const parsed = Date.parse(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return fallback
}

function isPersonInfo(value: any): value is PersonInfo {
  return !!value &&
    typeof value === 'object' &&
    typeof value.name === 'string' &&
    typeof value.birthYear === 'number' &&
    typeof value.birthMonth === 'number' &&
    typeof value.birthDay === 'number'
}

interface StoreRow {
  dbName: string
  key: IDBValidKey
  value: any
}

function openNamedDB(name: string): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(name)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
    req.onblocked = () => reject(new Error(`IndexedDB blocked: ${name}`))
  })
}

async function getCandidateDBNames(): Promise<string[]> {
  const names = new Set<string>(LEGACY_DB_NAMES)
  const factory = indexedDB as IDBFactory & { databases?: () => Promise<Array<{ name?: string | null }>> }
  if (factory.databases) {
    try {
      const databases = await factory.databases()
      for (const db of databases) {
        if (db.name) names.add(db.name)
      }
    } catch {
      // Some browsers restrict database enumeration; current DB still works.
    }
  }
  return [...names]
}

function readStoreRows(dbName: string, db: IDBDatabase, storeName: string): Promise<StoreRow[]> {
  if (!db.objectStoreNames.contains(storeName)) return Promise.resolve([])
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly')
    const store = tx.objectStore(storeName)
    const rows: StoreRow[] = []
    const req = store.openCursor()
    req.onsuccess = () => {
      const cursor = req.result
      if (cursor) {
        rows.push({ dbName, key: cursor.key, value: cursor.value })
        cursor.continue()
      } else {
        resolve(rows)
      }
    }
    req.onerror = () => reject(req.error)
  })
}

async function readStoreRowsFromAllDBs(storeName: string): Promise<StoreRow[]> {
  const names = await getCandidateDBNames()
  const rows: StoreRow[] = []
  for (const name of names) {
    let db: IDBDatabase | null = null
    try {
      db = name === DB_NAME ? await openDB() : await openNamedDB(name)
      rows.push(...await readStoreRows(name, db, storeName))
    } catch {
      // Ignore broken legacy databases and keep scanning the rest.
    } finally {
      db?.close()
    }
  }
  return rows
}

function readLocalStorageRows(storeName: string): StoreRow[] {
  const rows: StoreRow[] = []
  const tokens = [storeName, 'record', 'records', 'yubi', 'bazi', 'compat', 'divination']
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (!key || !tokens.some(token => key.toLowerCase().includes(token))) continue
    const parsed = parseMaybeJson(localStorage.getItem(key))
    const nested = parseMaybeJson((parsed as any)?.[storeName] || (parsed as any)?.records || (parsed as any)?.items || (parsed as any)?.history)
    const values = Array.isArray(parsed)
      ? parsed
      : Array.isArray(nested)
        ? nested
        : [parsed]
    values.forEach((value, index) => {
      rows.push({ dbName: 'localStorage', key: `${key}:${index}`, value })
    })
  }
  return rows
}

function normalizeSavedRecord(row: StoreRow): SavedRecord | null {
  const raw = parseMaybeJson(row.value)
  const person = parseMaybeJson(raw?.person || raw?.personInfo || raw?.person_data || raw?.personData || raw)
  if (!isPersonInfo(person)) return null
  const createdAt = toTimestamp(raw?.createdAt ?? raw?.created_at ?? raw?.timestamp, Date.now())
  const lastUsed = toTimestamp(raw?.lastUsed ?? raw?.last_used ?? raw?.updatedAt ?? createdAt, createdAt)
  return {
    id: String(raw?.id || row.key || `${row.dbName}:${createdAt}`),
    person,
    createdAt,
    lastUsed,
    label: String(raw?.label || makeLabel(person)),
  }
}

function normalizeDivinationRecord(row: StoreRow): DivinationRecord | null {
  const raw = parseMaybeJson(row.value)
  const type = raw?.type
  if (type !== 'liuyao' && type !== 'meihua') return null
  const hexagramData = parseMaybeJson(raw?.hexagramData || raw?.hexagram_data || raw?.result)
  if (!hexagramData) return null
  const createdAt = toTimestamp(raw?.createdAt ?? raw?.created_at ?? raw?.timestamp, Date.now())
  return {
    id: String(raw?.id || row.key || `${row.dbName}:${createdAt}`),
    type,
    method: String(raw?.method || hexagramData.method || ''),
    question: String(raw?.question || ''),
    hexagramData,
    aiInterpretation: raw?.aiInterpretation ?? raw?.ai_interpretation ?? null,
    createdAt,
    label: String(raw?.label || hexagramData.originalName || hexagramData.originalHexagram?.name || '算卦记录'),
  }
}

function normalizeCompatRecord(row: StoreRow): CompatRecord | null {
  const raw = parseMaybeJson(row.value)
  const result = parseMaybeJson(raw?.result || raw?.resultData || raw?.result_data) || {}
  const malePerson = parseMaybeJson(raw?.malePerson || raw?.maleData || raw?.male_data || result?.male?.person)
  const femalePerson = parseMaybeJson(raw?.femalePerson || raw?.femaleData || raw?.female_data || result?.female?.person)
  if (!isPersonInfo(malePerson) || !isPersonInfo(femalePerson)) return null
  const createdAt = toTimestamp(raw?.createdAt ?? raw?.created_at ?? raw?.timestamp, Date.now())
  return {
    id: String(raw?.id || row.key || `${row.dbName}:${createdAt}`),
    malePerson,
    femalePerson,
    result,
    aiInsight: raw?.aiInsight ?? raw?.ai_insight ?? null,
    label: String(raw?.label || `${malePerson.name} & ${femalePerson.name} · 合盘`),
    createdAt,
  }
}

function uniqById<T extends { id: string }>(records: T[]): T[] {
  const map = new Map<string, T>()
  for (const record of records) map.set(record.id, record)
  return [...map.values()]
}

export interface StorageDiagnostics {
  databases: { name: string; stores: string[]; counts: Record<string, number> }[]
  localStorageKeys: string[]
}

export async function getStorageDiagnostics(): Promise<StorageDiagnostics> {
  const databases: StorageDiagnostics['databases'] = []
  const names = await getCandidateDBNames()
  for (const name of names) {
    let db: IDBDatabase | null = null
    try {
      db = name === DB_NAME ? await openDB() : await openNamedDB(name)
      const stores = Array.from(db.objectStoreNames)
      const counts: Record<string, number> = {}
      for (const storeName of stores) {
        counts[storeName] = await countStore(db, storeName)
      }
      if (stores.length > 0) databases.push({ name, stores, counts })
    } catch {
      // Keep diagnostics best-effort.
    } finally {
      db?.close()
    }
  }

  const localStorageKeys: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key) localStorageKeys.push(key)
  }
  return { databases, localStorageKeys }
}

function countStore(db: IDBDatabase, storeName: string): Promise<number> {
  return new Promise((resolve) => {
    const tx = db.transaction(storeName, 'readonly')
    const req = tx.objectStore(storeName).count()
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => resolve(0)
  })
}

/** 保存一条排盘记录 */
export async function saveRecord(person: PersonInfo): Promise<string> {
  const db = await openDB()

  // 在同一连接中先获取所有记录进行去重
  const allRecords: SavedRecord[] = await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const records: SavedRecord[] = []
    const req = store.openCursor()
    req.onsuccess = () => {
      const cursor = req.result
      if (cursor) {
        records.push(cursor.value)
        cursor.continue()
      } else {
        resolve(records)
      }
    }
    req.onerror = () => reject(req.error)
  })

  const existing = allRecords.find(r =>
    r.person.name === person.name &&
    r.person.birthYear === person.birthYear &&
    r.person.birthMonth === person.birthMonth &&
    r.person.birthDay === person.birthDay &&
    r.person.birthHour === person.birthHour &&
    r.person.birthMinute === person.birthMinute
  )

  if (existing) {
    existing.lastUsed = Date.now()
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    store.put(existing)
    await waitTx(tx)
    db.close()
    return existing.id
  }

  const record: SavedRecord = {
    id: generateId(),
    person: { ...person },
    createdAt: Date.now(),
    lastUsed: Date.now(),
    label: makeLabel(person),
  }

  const tx = db.transaction(STORE_NAME, 'readwrite')
  const store = tx.objectStore(STORE_NAME)
  store.add(record)
  await waitTx(tx)
  db.close()
  return record.id
}

/** 获取所有记录（按最近使用排序） */
export async function getAllRecords(): Promise<SavedRecord[]> {
  const rows = [...await readStoreRowsFromAllDBs(STORE_NAME), ...readLocalStorageRows(STORE_NAME)]
  return uniqById(rows.map(normalizeSavedRecord).filter((r): r is SavedRecord => !!r))
    .sort((a, b) => (b.lastUsed || b.createdAt || 0) - (a.lastUsed || a.createdAt || 0))
}

/** 根据 ID 获取单条记录 */
export async function getRecordById(id: string): Promise<SavedRecord | null> {
  const db = await openDB()
  const tx = db.transaction(STORE_NAME, 'readonly')
  const store = tx.objectStore(STORE_NAME)

  return new Promise((resolve, reject) => {
    const req = store.get(id)
    req.onsuccess = () => {
      db.close()
      resolve(req.result || null)
    }
    req.onerror = () => {
      db.close()
      reject(req.error)
    }
  })
}

/** 删除一条记录 */
export async function deleteRecord(id: string): Promise<void> {
  const db = await openDB()
  const tx = db.transaction(STORE_NAME, 'readwrite')
  const store = tx.objectStore(STORE_NAME)
  store.delete(id)
  await waitTx(tx)
  db.close()
}

/** 获取记录总数 */
export async function getRecordCount(): Promise<number> {
  const db = await openDB()
  const tx = db.transaction(STORE_NAME, 'readonly')
  const store = tx.objectStore(STORE_NAME)

  return new Promise((resolve, reject) => {
    const req = store.count()
    req.onsuccess = () => {
      db.close()
      resolve(req.result)
    }
    req.onerror = () => {
      db.close()
      reject(req.error)
    }
  })
}

// ──────────────── 算卦记录 ────────────────

export interface DivinationRecord {
  id: string
  type: 'liuyao' | 'meihua'
  method: string
  question: string
  hexagramData: any
  aiInterpretation: string | null
  createdAt: number
  label: string
}

export async function saveDivinationRecord(record: DivinationRecord): Promise<void> {
  const db = await openDB()
  const tx = db.transaction(DIVINATION_STORE, 'readwrite')
  const store = tx.objectStore(DIVINATION_STORE)
  store.put(record)
  await waitTx(tx)
  db.close()
}

export async function getAllDivinationRecords(): Promise<DivinationRecord[]> {
  const rows = [...await readStoreRowsFromAllDBs(DIVINATION_STORE), ...readLocalStorageRows(DIVINATION_STORE)]
  return uniqById(rows.map(normalizeDivinationRecord).filter((r): r is DivinationRecord => !!r))
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
}

export async function getDivinationRecordsByType(type: 'liuyao' | 'meihua'): Promise<DivinationRecord[]> {
  const all = await getAllDivinationRecords()
  return all.filter(r => r.type === type)
}

export async function deleteDivinationRecord(id: string): Promise<void> {
  const db = await openDB()
  const tx = db.transaction(DIVINATION_STORE, 'readwrite')
  const store = tx.objectStore(DIVINATION_STORE)
  store.delete(id)
  await waitTx(tx)
  db.close()
}

// ──────────────── 合盘记录 ────────────────

export interface CompatRecord {
  id: string
  malePerson: PersonInfo
  femalePerson: PersonInfo
  result: any           // CompatibilityResult
  aiInsight: string | null
  label: string
  createdAt: number
}

export async function saveCompatRecord(record: CompatRecord): Promise<void> {
  const db = await openDB()
  const tx = db.transaction(COMPAT_STORE, 'readwrite')
  const store = tx.objectStore(COMPAT_STORE)
  store.put(record)
  await waitTx(tx)
  db.close()
}

export async function getAllCompatRecords(): Promise<CompatRecord[]> {
  const rows = [...await readStoreRowsFromAllDBs(COMPAT_STORE), ...readLocalStorageRows(COMPAT_STORE)]
  return uniqById(rows.map(normalizeCompatRecord).filter((r): r is CompatRecord => !!r))
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
}

export async function deleteCompatRecord(id: string): Promise<void> {
  const db = await openDB()
  const tx = db.transaction(COMPAT_STORE, 'readwrite')
  const store = tx.objectStore(COMPAT_STORE)
  store.delete(id)
  await waitTx(tx)
  db.close()
}

function waitTx(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}
