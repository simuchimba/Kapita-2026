import { useState, useEffect } from 'react'
import { Wifi, WifiOff, RefreshCw, CloudOff } from 'lucide-react'
import { onSyncStatusChange, getQueueCount } from '../services/sync'

export default function OfflineIndicator() {
  const [offline, setOffline] = useState(!navigator.onLine)
  const [syncing, setSyncing] = useState(false)
  const [pending, setPending] = useState(0)

  useEffect(() => {
    const updatePending = async () => {
      setPending(await getQueueCount())
    }

    const unsub = onSyncStatusChange((state) => {
      if (state.type === 'offline') setOffline(true)
      if (state.type === 'online') setOffline(false)
      if (state.type === 'sync-start') setSyncing(true)
      if (state.type === 'sync-complete') {
        setSyncing(false)
        updatePending()
      }
    })

    const handleOnline = () => { setOffline(false); updatePending() }
    const handleOffline = () => { setOffline(true) }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    updatePending()

    return () => {
      unsub()
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (!offline && !syncing && pending === 0) return null

  return (
    <div className={`fixed bottom-4 right-4 z-50 flex items-center gap-2 px-3 py-2 rounded-lg shadow-lg text-sm font-medium transition-all ${
      offline ? 'bg-red-500 text-white' : syncing ? 'bg-blue-500 text-white' : 'bg-amber-500 text-white'
    }`}>
      {offline ? (
        <><WifiOff size={16} /><span>Offline — changes queued</span></>
      ) : syncing ? (
        <><RefreshCw size={16} className="animate-spin" /><span>Syncing...</span></>
      ) : (
        <><CloudOff size={16} /><span>{pending} pending sync</span></>
      )}
    </div>
  )
}
