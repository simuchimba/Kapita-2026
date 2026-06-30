import { openDB } from 'idb'

const DB_NAME = 'kapita-offline'
const DB_VERSION = 1

let dbPromise = null

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('pending_mutations')) {
          db.createObjectStore('pending_mutations', { keyPath: 'id', autoIncrement: true })
        }
        if (!db.objectStoreNames.contains('cached_data')) {
          db.createObjectStore('cached_data', { keyPath: 'key' })
        }
        if (!db.objectStoreNames.contains('sync_log')) {
          db.createObjectStore('sync_log', { keyPath: 'id', autoIncrement: true })
        }
      },
    })
  }
  return dbPromise
}

export async function queueMutation(method, url, data = null) {
  const db = await getDB()
  return db.add('pending_mutations', {
    method,
    url,
    data,
    created_at: new Date().toISOString(),
    retries: 0,
  })
}

export async function getPendingMutations() {
  const db = await getDB()
  return db.getAll('pending_mutations')
}

export async function removeMutation(id) {
  const db = await getDB()
  return db.delete('pending_mutations', id)
}

export async function clearMutations() {
  const db = await getDB()
  return db.clear('pending_mutations')
}

export async function cacheData(key, data, ttlMinutes = 60) {
  const db = await getDB()
  return db.put('cached_data', {
    key,
    data,
    expires_at: Date.now() + ttlMinutes * 60 * 1000,
    cached_at: new Date().toISOString(),
  })
}

export async function getCachedData(key) {
  const db = await getDB()
  const entry = await db.get('cached_data', key)
  if (!entry) return null
  if (Date.now() > entry.expires_at) {
    await db.delete('cached_data', key)
    return null
  }
  return entry.data
}

export async function clearCache() {
  const db = await getDB()
  return db.clear('cached_data')
}

export async function logSyncResult(action, status, details = '') {
  const db = await getDB()
  return db.add('sync_log', {
    action,
    status,
    details,
    timestamp: new Date().toISOString(),
  })
}

export async function getSyncLog(limit = 50) {
  const db = await getDB()
  const all = await db.getAll('sync_log')
  return all.reverse().slice(0, limit)
}

export default { queueMutation, getPendingMutations, removeMutation, clearMutations, cacheData, getCachedData, clearCache, logSyncResult, getSyncLog }
