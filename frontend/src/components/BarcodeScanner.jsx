import { useState, useRef, useEffect } from 'react'
import { barcodeAPI } from '../services/api'
import { productsAPI } from '../services/api'
import { Search, Camera, X, Package } from 'lucide-react'

export default function BarcodeScanner({ onProductFound, onClose }) {
  const [manualCode, setManualCode] = useState('')
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState('')
  const [product, setProduct] = useState(null)
  const videoRef = useRef(null)
  const streamRef = useRef(null)

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop())
      }
    }
  }, [])

  const startCamera = async () => {
    setError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }
      setScanning(true)
      detectBarcode()
    } catch (err) {
      setError('Camera access denied. Use manual entry instead.')
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    setScanning(false)
  }

  const detectBarcode = () => {
    if (!('BarcodeDetector' in window)) {
      setTimeout(() => stopCamera(), 100)
      setError('Barcode scanner not supported in this browser. Use manual entry.')
      return
    }

    const detector = new BarcodeDetector({ formats: ['ean_13', 'ean_8', 'code_128', 'code_39', 'upc_a', 'upc_e', 'qr_code'] })
    const interval = setInterval(async () => {
      if (!videoRef.current || !scanning) {
        clearInterval(interval)
        return
      }
      try {
        const barcodes = await detector.detect(videoRef.current)
        if (barcodes.length > 0) {
          clearInterval(interval)
          stopCamera()
          lookupProduct(barcodes[0].rawValue)
        }
      } catch { }
    }, 500)

    return () => clearInterval(interval)
  }

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
    if (!manualCode.trim()) return
    lookupProduct(manualCode.trim())
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-800">Barcode Scanner</h3>
        {onClose && (
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        )}
      </div>

      {!scanning && !product && (
        <div className="space-y-3">
          <button onClick={startCamera} className="btn btn-primary w-full inline-flex items-center justify-center gap-2 py-3">
            <Camera size={20} /> Scan with Camera
          </button>
          <div className="flex gap-2">
            <input
              type="text" value={manualCode} onChange={e => setManualCode(e.target.value)}
              placeholder="Enter barcode manually..."
              className="input flex-1" onKeyDown={e => e.key === 'Enter' && handleManualSearch()}
            />
            <button onClick={handleManualSearch} className="btn btn-secondary"><Search size={18} /></button>
          </div>
        </div>
      )}

      {scanning && (
        <div className="relative">
          <video ref={videoRef} className="w-full rounded-lg border bg-black" style={{ maxHeight: 250 }} />
          <button onClick={stopCamera} className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full">
            <X size={16} />
          </button>
          <p className="text-center text-sm text-gray-500 mt-1">Point camera at barcode...</p>
        </div>
      )}

      {product && (
        <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
          <div className="flex items-start gap-3">
            <Package size={24} className="text-emerald-600 mt-1" />
            <div className="flex-1">
              <p className="font-semibold text-gray-900">{product.name}</p>
              <p className="text-sm text-gray-500">SKU: {product.sku} | Barcode: {product.barcode || product.sku}</p>
              {product.selling_price && (
                <p className="text-sm font-medium text-emerald-700">
                  Price: {product.currency || 'ZMW'} {parseFloat(product.selling_price).toFixed(2)}
                </p>
              )}
            </div>
            <button onClick={() => setProduct(null)} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
          </div>
        </div>
      )}

      {error && <div className="text-sm text-red-500 bg-red-50 p-2 rounded">{error}</div>}
    </div>
  )
}
