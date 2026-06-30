import { useState, useRef, useEffect, useCallback } from 'react'
import { barcodeAPI } from '../services/api'
import { productsAPI } from '../services/api'
import { scanVideoFrame } from '../services/barcodeDecoder'
import { Search, Camera, X, Package, Loader } from 'lucide-react'

export default function BarcodeScanner({ onProductFound, onClose }) {
  const [manualCode, setManualCode] = useState('')
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState('')
  const [product, setProduct] = useState(null)
  const [lastCode, setLastCode] = useState('')
  const [scanningActive, setScanningActive] = useState(false)
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const canvasRef = useRef(null)
  const animFrameRef = useRef(null)
  const scanLockRef = useRef(false)
  const lastScanTimeRef = useRef(0)

  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [])

  const stopCamera = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current)
      animFrameRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    setScanning(false)
    setScanningActive(false)
  }

  const frameScanLoop = useCallback(() => {
    if (!videoRef.current || !scanningActive) return

    const now = Date.now()
    if (now - lastScanTimeRef.current > 300) {
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
  }, [scanningActive, lastCode])

  const startCamera = async () => {
    setError('')
    setLastCode('')
    try {
      const constraints = {
        video: {
          facingMode: 'environment',
          width: { ideal: 640 },
          height: { ideal: 480 },
        }
      }
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setScanning(true)
      setScanningActive(true)
    } catch (err) {
      setError('Camera access denied or not available. Use manual entry below.')
      return
    }
  }

  useEffect(() => {
    if (scanningActive) {
      frameScanLoop()
    }
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current)
      }
    }
  }, [scanningActive, frameScanLoop])

  const lookupProduct = async (code) => {
    setError('')
    try {
      const res = await barcodeAPI.lookup(code)
      setProduct(res.data)
      if (onProductFound) onProductFound(res.data)
    } catch {
      try {
        const res = await productsAPI.getAll({ search: code })
        if (res.data.results?.length > 0) {
          setProduct(res.data.results[0])
          if (onProductFound) onProductFound(res.data.results[0])
        } else {
          setProduct({ barcode: code, name: `Product (${code})`, sku: code })
          if (onProductFound) onProductFound({ barcode: code, name: `Product (${code})`, sku: code })
        }
      } catch {
        setError(`No product found with barcode: ${code}`)
      }
    }
  }

  const handleManualSearch = async () => {
    const code = manualCode.trim()
    if (!code) return
    setLastCode(code)
    lookupProduct(code)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
          <Camera size={18} className="text-emerald-600" />
          Barcode Scanner
        </h3>
        {onClose && (
          <button onClick={() => { stopCamera(); onClose() }} className="text-gray-400 hover:text-gray-600 p-1">
            <X size={18} />
          </button>
        )}
      </div>

      {!scanning && !product && (
        <div className="space-y-3">
          <button
            onClick={startCamera}
            className="btn btn-primary w-full inline-flex items-center justify-center gap-2 py-3 text-base"
          >
            <Camera size={22} /> Scan with Camera
          </button>
          <div className="relative">
            <div className="flex gap-2">
              <input
                type="text"
                value={manualCode}
                onChange={e => setManualCode(e.target.value)}
                placeholder="Enter barcode number manually..."
                className="input flex-1 font-mono"
                onKeyDown={e => { if (e.key === 'Enter') handleManualSearch() }}
              />
              <button onClick={handleManualSearch} className="btn btn-secondary" title="Search">
                <Search size={18} />
              </button>
            </div>
          </div>
          <div className="text-xs text-gray-400 text-center space-y-1">
            <p>Works with EAN-13, EAN-8, UPC-A, and Code-128 barcodes</p>
            <p>Point camera at the barcode and hold steady</p>
          </div>
        </div>
      )}

      {scanning && (
        <div className="relative rounded-lg overflow-hidden bg-black">
          <video
            ref={videoRef}
            className="w-full"
            style={{ maxHeight: 280, minHeight: 180 }}
            playsInline
            muted
          />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-4/5 h-0.5 bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse" />
          </div>
          <canvas ref={canvasRef} className="hidden" />
          <div className="absolute top-2 right-2 flex gap-1">
            <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
              <Loader size={12} className="animate-spin" /> Scanning...
            </span>
            <button onClick={stopCamera} className="bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600">
              <X size={16} />
            </button>
          </div>
          <div className="absolute bottom-2 left-2 right-2 text-center">
            <p className="text-white text-xs bg-black/50 px-2 py-1 rounded inline-block">
              Align barcode with the red line and hold steady
            </p>
          </div>
        </div>
      )}

      {product && (
        <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <p className="font-semibold text-gray-900">{product.name}</p>
              <p className="text-sm text-gray-500">
                {product.sku ? `SKU: ${product.sku}` : ''}
                {product.sku && product.barcode ? ' | ' : ''}
                {product.barcode ? `Barcode: ${product.barcode}` : `Code: ${lastCode}`}
              </p>
              {product.selling_price && (
                <p className="text-sm font-medium text-emerald-700 mt-1">
                  Price: {product.currency || 'ZMW'} {parseFloat(product.selling_price).toFixed(2)}
                  {product.quantity !== undefined && ` | Stock: ${product.quantity}`}
                </p>
              )}
            </div>
            <button onClick={() => { setProduct(null); setLastCode('') }} className="text-gray-400 hover:text-gray-600 p-1">
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="text-sm text-red-500 bg-red-50 p-3 rounded-lg border border-red-100">
          {error}
        </div>
      )}
    </div>
  )
}
