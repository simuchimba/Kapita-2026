import api from './api'
import { queueMutation, getPendingMutations, removeMutation, clearMutations, logSyncResult } from './db'

const listeners = new Set()

export function onSyncStatusChange(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

function notify(state) {
  listeners.forEach(fn => fn(state))
}

let syncing = false

export function isSyncing() {
  return syncing
}

export async function processQueue() {
  if (syncing) return
  syncing = true
  notify({ type: 'sync-start' })

  const mutations = await getPendingMutations()
  if (mutations.length === 0) {
    syncing = false
    notify({ type: 'sync-complete', synced: 0, failed: 0 })
    return
  }

  let synced = 0
  let failed = 0

  for (const mutation of mutations) {
    try {
      const config = {
        method: mutation.method.toLowerCase(),
        url: mutation.url,
        data: mutation.data || undefined,
        headers: { 'Content-Type': 'application/json' },
      }

      const token = localStorage.getItem('access_token')
      if (token) config.headers.Authorization = `Bearer ${token}`

      await api(config)
      await removeMutation(mutation.id)
      await logSyncResult(mutation.method + ' ' + mutation.url, 'synced')
      synced++
    } catch (error) {
      failed++
      await logSyncResult(mutation.method + ' ' + mutation.url, 'failed', error.message)
      mutation.retries = (mutation.retries || 0) + 1
      if (mutation.retries >= 5) {
        await removeMutation(mutation.id)
      }
    }
  }

  syncing = false
  notify({ type: 'sync-complete', synced, failed })
}

export async function getQueueCount() {
  const mutations = await getPendingMutations()
  return mutations.length
}

export function startAutoSync() {
  const handleOnline = () => {
    notify({ type: 'online' })
    processQueue()
  }

  const handleOffline = () => {
    notify({ type: 'offline' })
  }

  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)

  processQueue()

  setInterval(() => {
    processQueue()
  }, 60000)

  return () => {
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
  }
}
