/**
 * IndexedDB 本地存储
 * 用于持久化保存排盘记录，支持历史查询、快速加载、删除
 */

import type { PersonInfo, AnalysisResult } from '../types'

const DB_NAME = 'yubi-panguan'
const DB_VERSION = 3
const STORE_NAME = 'records'
const DIVINATION_STORE = 'divination_records'
const COMPAT_STORE = 'compat_records'

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
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' })
        store.createIndex('lastUsed', 'lastUsed', { unique: false })
        store.createIndex('label', 'label', { unique: false })
      }
      if (!db.objectStoreNames.contains(DIVINATION_STORE)) {
        const divStore = db.createObjectStore(DIVINATION_STORE, { keyPath: 'id' })
        divStore.createIndex('type', 'type', { unique: false })
        divStore.createIndex('createdAt', 'createdAt', { unique: false })
      }
      if (!db.objectStoreNames.contains(COMPAT_STORE)) {
        const compatStore = db.createObjectStore(COMPAT_STORE, { keyPath: 'id' })
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
  const db = await openDB()
  const tx = db.transaction(STORE_NAME, 'readonly')
  const store = tx.objectStore(STORE_NAME)
  const index = store.index('lastUsed')
  const records: SavedRecord[] = []

  return new Promise((resolve, reject) => {
    const req = index.openCursor(null, 'prev')
    req.onsuccess = () => {
      const cursor = req.result
      if (cursor) {
        records.push(cursor.value)
        cursor.continue()
      } else {
        db.close()
        resolve(records)
      }
    }
    req.onerror = () => {
      db.close()
      reject(req.error)
    }
  })
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
  const db = await openDB()
  const tx = db.transaction(DIVINATION_STORE, 'readonly')
  const store = tx.objectStore(DIVINATION_STORE)
  const index = store.index('createdAt')
  const records: DivinationRecord[] = []

  return new Promise((resolve, reject) => {
    const req = index.openCursor(null, 'prev')
    req.onsuccess = () => {
      const cursor = req.result
      if (cursor) {
        records.push(cursor.value)
        cursor.continue()
      } else {
        db.close()
        resolve(records)
      }
    }
    req.onerror = () => { db.close(); reject(req.error) }
  })
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
  const db = await openDB()
  const tx = db.transaction(COMPAT_STORE, 'readonly')
  const store = tx.objectStore(COMPAT_STORE)
  const index = store.index('createdAt')
  const records: CompatRecord[] = []

  return new Promise((resolve, reject) => {
    const req = index.openCursor(null, 'prev')
    req.onsuccess = () => {
      const cursor = req.result
      if (cursor) {
        records.push(cursor.value)
        cursor.continue()
      } else {
        db.close()
        resolve(records)
      }
    }
    req.onerror = () => { db.close(); reject(req.error) }
  })
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
