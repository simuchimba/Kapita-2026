import jsQR from 'jsqr'

async function nativeScan(video) {
  if (!('BarcodeDetector' in window)) return null
  try {
    const supported = await BarcodeDetector.getSupportedFormats()
    if (!supported.includes('qr_code')) return null
    const detector = new BarcodeDetector({ formats: ['qr_code'] })
    const codes = await detector.detect(video)
    if (codes.length > 0) {
      return { format: 'QR Code', code: codes[0].rawValue }
    }
  } catch {}
  return null
}

function frameToImageData(video) {
  const vw = video.videoWidth
  const vh = video.videoHeight
  if (!vw || !vh) return null
  const canvas = document.createElement('canvas')
  canvas.width = vw
  canvas.height = vh
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  ctx.drawImage(video, 0, 0)
  return ctx.getImageData(0, 0, vw, vh)
}

function decodeQR(imageData) {
  try {
    const result = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'dontInvert',
    })
    if (result) return { format: 'QR Code', code: result.data }
  } catch {}
  return null
}

function decodeQRWithInvert(imageData) {
  try {
    const result = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'attemptBoth',
    })
    if (result) return { format: 'QR Code', code: result.data }
  } catch {}
  return null
}

export async function scanVideoFrame(video) {
  if (!video || video.readyState < 2) return null

  // 1. Native BarcodeDetector API (fast on Chrome/Edge)
  const native = await nativeScan(video)
  if (native) return native

  // 2. jsQR — pure-JS QR decoder, works everywhere
  const imageData = frameToImageData(video)
  if (!imageData) return null

  const qr = decodeQR(imageData)
  if (qr) return qr

  const qrInv = decodeQRWithInvert(imageData)
  return qrInv || null
}

export function scanImageData(imageData) {
  return decodeQRWithInvert(imageData)
}
