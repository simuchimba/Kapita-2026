import { useState, useRef, useEffect, useCallback } from 'react'
import { barcodeAPI } from '../services/api'
import { productsAPI } from '../services/api'
import { scanVideoFrame } from '../services/barcodeDecoder'
import { Search, Camera, X, Loader, AlertCircle } from 'lucide-react'

export default function BarcodeScanner({ onProductFound, onClose }) {
  const [manualCode, setManualCode] = useState('')
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState('')
  const [searching, setSearching] = useState(false)
  const [lastCode, setLastCode] = useState('')
  const [scanningActive, setScanningActive] = useState(false)
  const [cameraReady, setCameraReady] = useState(false)
  const [stream, setStream] = useState(null)
  const videoRef = useRef(null)
  const animFrameRef = useRef(null)
  const lastScanTimeRef = useRef(0)

  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
      if (stream) stream.getTracks().forEach(t => t.stop())
    }
  }, [stream])

  useEffect(() => {
    if (!stream || !videoRef.current) return
    videoRef.current.srcObject = stream
    videoRef.current.play().then(() => {
      setCameraReady(true)
      setScanningActive(true)
    }).catch(() => {})
  }, [stream])

  const stopCamera = () => {
    if (animFrameRef.current) { cancelAnimationFrame(animFrameRef.current); animFrameRef.current = null }
    if (stream) { stream.getTracks().forEach(t => t.stop()); setStream(null) }
    setScanning(false)
    setScanningActive(false)
    setCameraReady(false)
  }

  const frameScanLoop = useCallback(() => {
    if (!videoRef.current || !scanningActive || !cameraReady) return
    const now = Date.now()
    if (now - lastScanTimeRef.current > 400) {
      scanVideoFrame(videoRef.current).then(result => {
        if (result && result.code && result.code !== lastCode) {
          setLastCode(result.code)
          stopCamera()
          lookupProduct(result.code)
        }
      }).catch(() => {})
      lastScanTimeRef.current = now
    }
    animFrameRef.current = requestAnimationFrame(frameScanLoop)
  }, [scanningActive, cameraReady, lastCode])

  const startCamera = async () => {
    setError('')
    setLastCode('')
    setCameraReady(false)
    setScanning(true)
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } }
      })
      setStream(s)
    } catch (err) {
      setScanning(false)
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Camera permission denied. Allow camera access or enter barcode manually.')
      } else if (err.name === 'NotFoundError') {
        setError('No camera found. Enter barcode manually below.')
      } else {
        setError('Camera unavailable. Enter barcode manually below.')
      }
    }
  }

  useEffect(() => {
    if (scanningActive && cameraReady) frameScanLoop()
    return () => { if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current) }
  }, [scanningActive, cameraReady, frameScanLoop])

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
          setError(`No product found with barcode: ${code}`)
        }
      } catch {
        setError(`No product found with barcode: ${code}`)
      }
    }
    setSearching(false)
  }

  const handleManualSearch = async () => {
    const code = manualCode.trim()
    if (!code) return
    setLastCode(code)
    await lookupProduct(code)
    setManualCode('')
  }

  return (
    <div className="space-y-3">
      <div className="text-sm font-medium text-gray-700 flex items-center gap-2">
        <Camera size={16} className="text-emerald-600" />
        Barcode Scanner
        {onClose && (
          <button onClick={onClose} className="ml-auto text-gray-400 hover:text-gray-600"><X size={16} /></button>
        )}
      </div>

      {!scanning && (
        <div className="space-y-3">
          <button onClick={startCamera}
            className="btn btn-primary w-full inline-flex items-center justify-center gap-2 py-2.5">
            <Camera size={20} /> Scan with Camera
          </button>

          <div className="flex gap-2">
            <input type="text" value={manualCode}
              onChange={e => setManualCode(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleManualSearch() }}
              placeholder="Type barcode number and press Enter..."
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
          <video ref={videoRef} className="w-full h-full min-h-[160px]" playsInline muted />
          {cameraReady && (
            <>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-4/5 h-0.5 bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse" />
              </div>
              <div className="absolute top-2 right-2 flex gap-1">
                <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                  <Loader size={12} className="animate-spin" /> Scanning
                </span>
                <button onClick={stopCamera} className="bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600">
                  <X size={16} />
                </button>
              </div>
              <p className="absolute bottom-2 left-2 right-2 text-center text-white text-xs bg-black/50 px-2 py-1 rounded mx-2">
                Align barcode with red line, hold steady
              </p>
            </>
          )}
          {!cameraReady && (
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
