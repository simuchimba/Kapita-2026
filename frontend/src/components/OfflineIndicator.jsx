import { useState, useEffect, useCallback } from 'react'
import { Wifi, WifiOff, RefreshCw, CloudOff, CheckCircle2 } from 'lucide-react'
import { onSyncStatusChange, getQueueCount } from '../services/sync'

function SyncToast({ message, visible }) {
  return (
    <div
      className={`fixed bottom-20 right-4 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-xl text-sm font-medium text-white bg-gradient-to-r from-green-500 to-emerald-600 transition-all duration-500 ${
        visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95 pointer-events-none'
      }`}
    >
      <div className="shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-white/20">
        <CheckCircle2 size={16} />
      </div>
      <span>{message}</span>
    </div>
  )
}

export default function OfflineIndicator() {
  const [offline, setOffline] = useState(!navigator.onLine)
  const [syncing, setSyncing] = useState(false)
  const [pending, setPending] = useState(0)
  const [toast, setToast] = useState({ visible: false, message: '' })

  const showToast = useCallback((message) => {
    setToast({ visible: true, message })
    setTimeout(() => setToast({ visible: false, message: '' }), 3000)
  }, [])

  useEffect(() => {
    const updatePending = async () => {
      const count = await getQueueCount()
      setPending(count)
    }

    const unsub = onSyncStatusChange((state) => {
      if (state.type === 'offline') setOffline(true)
      if (state.type === 'online') setOffline(false)
      if (state.type === 'sync-start') {
        setSyncing(true)
        setToast({ visible: false, message: '' })
      }
      if (state.type === 'sync-complete') {
        setSyncing(false)
        updatePending()
        if (state.synced > 0) {
          showToast(`Synced ${state.synced} change${state.synced > 1 ? 's' : ''} successfully`)
        }
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
  }, [showToast])

  return (
    <>
      <SyncToast message={toast.message} visible={toast.visible} />
      {(!offline && !syncing && pending === 0) ? null : (
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
      )}
    </>
  )
}
