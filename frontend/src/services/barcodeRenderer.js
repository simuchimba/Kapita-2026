import QRCode from 'qrcode'

export async function generateBarcodeDataUrl(text) {
  if (!text) return null
  try {
    return await QRCode.toDataURL(String(text), {
      width: 300,
      margin: 2,
      color: { dark: '#000000', light: '#ffffff' },
    })
  } catch {
    return null
  }
}

export function downloadBarcode(dataUrl, filename) {
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

export function printBarcode(dataUrl) {
  const win = window.open('', '_blank')
  win.document.write(`
    <html><head><title>Print QR Code</title>
    <style>
      body { text-align: center; padding-top: 40px; margin: 0; }
      img { max-width: 95vw; height: auto; }
      @media print { body { padding-top: 0; } img { max-width: 100%; } }
    </style></head>
    <body><img src="${dataUrl}" onload="setTimeout(function(){window.print();window.close()},300)" /></body>
  </html>`)
  win.document.close()
}
