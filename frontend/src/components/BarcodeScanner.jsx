import { useState, useRef, useEffect } from 'react'
import { barcodeAPI } from '../services/api'
import { productsAPI } from '../services/api'
import { scanVideoFrame } from '../services/barcodeDecoder'
import { playBeep } from '../services/beep'
import { Search, Camera, X, Loader, AlertCircle, ScanLine } from 'lucide-react'

export default function BarcodeScanner({ onProductFound, onClose, continuous = false }) {
  const [manualCode, setManualCode] = useState('')
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState('')
  const [searching, setSearching] = useState(false)
  const [detectedCode, setDetectedCode] = useState('')
  const [scanActive, setScanActive] = useState(false)
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const lastCodeRef = useRef({ code: '', time: 0 })
  const intervalRef = useRef(null)
  const detectTimeoutRef = useRef(null)
  const COOLDOWN_MS = 1500

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop())
      if (detectTimeoutRef.current) clearTimeout(detectTimeoutRef.current)
    }
  }, [])

  const stopCamera = () => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    intervalRef.current = null
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null }
    setScanActive(false)
    setScanning(false)
  }

  const lookupProduct = async (code) => {
    setError('')
    setSearching(true)
    try {
      const res = await barcodeAPI.lookup(code)
      if (onProductFound) onProductFound(res.data)
    } catch {
      try {
        const res = await productsAPI.getAll({ search: code })
        const items = res.data.results || res.data
        if (items?.length > 0) {
          if (onProductFound) onProductFound(items[0])
        } else {
          setError(`No product found for code: ${code}`)
        }
      } catch {
        setError(`No product found for code: ${code}`)
      }
    }
    setSearching(false)
  }

  const doScan = async () => {
    const video = videoRef.current
    if (!video || !streamRef.current) return
    const result = await scanVideoFrame(video)
    if (result && result.code) {
      const now = Date.now()
      if (result.code === lastCodeRef.current.code && now - lastCodeRef.current.time < COOLDOWN_MS) return
      lastCodeRef.current = { code: result.code, time: now }
      playBeep()
      setDetectedCode(result.code)
      if (detectTimeoutRef.current) clearTimeout(detectTimeoutRef.current)
      detectTimeoutRef.current = setTimeout(() => setDetectedCode(''), 1500)
      if (!continuous) stopCamera()
      lookupProduct(result.code)
    } else {
      lastCodeRef.current.time = 0
    }
  }

  const startCamera = async () => {
    setError('')
    lastCodeRef.current = { code: '', time: 0 }
    setDetectedCode('')
    setScanning(true)
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } }
      })
      streamRef.current = s
      const video = videoRef.current
      if (video) {
        video.srcObject = s
        video.play().then(() => {
          setScanActive(true)
          intervalRef.current = setInterval(doScan, 250)
        }).catch(() => {
          setError('Failed to start video playback')
          stopCamera()
        })
      }
    } catch (err) {
      setScanning(false)
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Camera permission denied. Allow camera access or enter code manually.')
      } else if (err.name === 'NotFoundError') {
        setError('No camera found. Enter code manually below.')
      } else {
        setError('Camera unavailable. Enter code manually below.')
      }
    }
  }

  const handleManualSearch = async () => {
    const code = manualCode.trim()
    if (!code) return
    lastCodeRef.current = { code, time: Date.now() }
    setDetectedCode(code)
    if (detectTimeoutRef.current) clearTimeout(detectTimeoutRef.current)
    detectTimeoutRef.current = setTimeout(() => setDetectedCode(''), 1500)
    await lookupProduct(code)
    setManualCode('')
  }

  return (
    <div className="space-y-3">
      <div className="text-sm font-medium text-gray-700 flex items-center gap-2">
        <Camera size={16} className="text-emerald-600" />
        QR Code Scanner
        {onClose && (
          <button onClick={onClose} className="ml-auto text-gray-400 hover:text-gray-600"><X size={16} /></button>
        )}
      </div>

      {!scanning && (
        <div className="space-y-3">
          <button onClick={startCamera}
            className="btn btn-primary w-full inline-flex items-center justify-center gap-2 py-2.5">
            <Camera size={20} /> Scan QR Code
          </button>

          <div className="flex gap-2">
            <input type="text" value={manualCode}
              onChange={e => setManualCode(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleManualSearch() }}
              placeholder="Type product code and press Enter..."
              className="input flex-1 font-mono"
              autoFocus
            />
            <button onClick={handleManualSearch} disabled={searching} className="btn btn-secondary">
              {searching ? <Loader size={18} className="animate-spin" /> : <Search size={18} />}
            </button>
          </div>
        </div>
      )}

      {scanning && (
        <div className="relative rounded-lg overflow-hidden bg-black">
          <style>{`@keyframes sl{0%,to{transform:translateY(0)}50%{transform:translateY(calc(100% - 4px))}}.sl{animation:sl 2s ease-in-out infinite;will-change:transform}`}</style>
          <video ref={videoRef} className="w-full h-full min-h-[200px]" playsInline muted />
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 sl">
              <div className="absolute left-0 right-0 top-0 h-0.5 bg-red-500/70 shadow-[0_0_10px_rgba(239,68,68,0.7)]" />
            </div>
          </div>
          {scanActive && (
            <>
              <div className="absolute top-2 right-2 flex gap-1">
                <span className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${
                  detectedCode ? 'bg-emerald-500 text-white' : 'bg-green-500/80 text-white'
                }`}>
                  {detectedCode ? <ScanLine size={12} /> : <Loader size={12} className="animate-spin" />}
                  {detectedCode ? 'Detected!' : 'Scanning'}
                </span>
                <button onClick={stopCamera} className="bg-red-500/80 text-white p-1.5 rounded-full hover:bg-red-600">
                  <X size={16} />
                </button>
              </div>
              {detectedCode && (
                <div className="absolute top-2 left-2 bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                  {detectedCode}
                </div>
              )}
              <p className="absolute bottom-2 left-2 right-2 text-center text-white text-xs bg-black/50 px-2 py-1 rounded mx-2">
                Hold QR code steady in the frame
              </p>
            </>
          )}
          {!scanActive && (
            <div className="absolute inset-0 flex items-center justify-center text-white text-sm">
              Starting camera...
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="text-sm text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-100 flex items-start gap-2">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}
