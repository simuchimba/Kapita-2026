// Code-128B patterns (width notation) — matches backend encoder
const CODE128_WIDTH = [
  '212222','222122','222221','121223','121322','131222','122213','122312','132212','221213',
  '221312','231212','112232','122132','122231','113222','123122','123221','223211','221132',
  '221231','213212','223112','312131','311222','321122','321221','312212','322112','322211',
  '212123','212321','232121','111323','131123','131321','112313','132113','132311','211313',
  '231113','231311','112133','112331','132131','113123','113321','133121','313121','211331',
  '231131','213113','213311','213131','311123','311321','331121','312113','312311','332111',
  '314111','221411','431111','111224','111422','121124','121421','131122','131221','112214',
  '112412','122114','122411','142112','142211','241211','221114','413111','241112','134111',
  '111242','121142','121241','114212','124112','124211','411212','421112','421211','212141',
  '214121','412121','111143','111341','131141','114113','114311','411113','411311','113141',
]
const START_B = '211214'
const STOP = '233111'

export function generateBarcodeDataUrl(text) {
  const cleaned = String(text).replace(/[^ -~]/g, '')
  if (!cleaned) return null

  const patterns = [START_B]
  for (const ch of cleaned) {
    const idx = ch.charCodeAt(0) - 32
    patterns.push(idx >= 0 && idx < 100 ? CODE128_WIDTH[idx] : CODE128_WIDTH[0])
  }
  patterns.push(STOP)

  const moduleW = 2
  const height = 120
  let totalModules = 0
  for (const p of patterns) {
    for (const ch of p) totalModules += parseInt(ch)
  }
  const imgW = moduleW * totalModules + 40

  const canvas = document.createElement('canvas')
  canvas.width = imgW
  canvas.height = height
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, imgW, height)

  let x = 20
  ctx.fillStyle = '#000000'
  for (const p of patterns) {
    for (let i = 0; i < p.length; i++) {
      const w = parseInt(p[i]) * moduleW
      if (i % 2 === 0) ctx.fillRect(x, 10, w, height - 35)
      x += w
    }
  }

  ctx.fillStyle = '#000000'
  ctx.font = '18px monospace'
  ctx.textAlign = 'center'
  ctx.fillText(cleaned, imgW / 2, height - 8)

  return canvas.toDataURL('image/png')
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
    <html><head><title>Print Barcode</title>
    <style>
      body { text-align: center; padding-top: 40px; margin: 0; }
      img { max-width: 95vw; height: auto; }
      @media print { body { padding-top: 0; } img { max-width: 100%; } }
    </style></head>
    <body><img src="${dataUrl}" onload="setTimeout(function(){window.print();window.close()},300)" /></body>
  </html>`)
  win.document.close()
}
