const EAN13_L = {
  '3211': '0', '2221': '1', '2122': '2', '1411': '3', '1132': '4',
  '1231': '5', '1114': '6', '1312': '7', '1213': '8', '3112': '9',
}

const EAN13_R = {
  '1123': '0', '1222': '1', '2212': '2', '1141': '3', '2311': '4',
  '1321': '5', '4111': '6', '2131': '7', '3121': '8', '2113': '9',
}

const EAN13_G = {
  '1321': '0', '1231': '1', '1141': '2', '1132': '3', '1213': '4',
  '1222': '5', '1123': '6', '1411': '7', '1312': '8', '2221': '9',
}

const EAN13_PARITY = {
  'LLLLLL': '0', 'LLGLGG': '1', 'LLGGLG': '2', 'LLGGGL': '3',
  'LGLLGG': '4', 'LGGLLG': '5', 'LGGGLL': '6', 'GLLLGG': '7',
  'GLLGLG': '8', 'GLLGGL': '9',
}

const CODE128_PATTERNS = [
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

function measureBars(row, start, width) {
  const bars = []
  let current = row[start] < 128 ? 0 : 1
  let count = 1
  for (let x = start + 1; x < start + width && x < row.length; x++) {
    const bit = row[x] < 128 ? 0 : 1
    if (bit === current) {
      count++
    } else {
      bars.push(count)
      current = bit
      count = 1
    }
  }
  if (count > 0) bars.push(count)
  return bars
}

function normalizeBars(bars, numModules) {
  if (bars.length === 0) return null
  const totalModules = bars.reduce((a, b) => a + b, 0)
  if (totalModules === 0) return null
  const moduleWidth = totalModules / numModules
  return bars.map(b => Math.round(b / moduleWidth))
}

function decodeEAN13(bars) {
  if (bars.length < 59) return null
  const n = normalizeBars(bars, 95)
  if (!n) return null
  if (n.length < 59) return null

  const start = n.slice(0, 3)
  if (start[0] !== 1 || start[1] !== 1 || start[2] !== 1) return null

  const center = n.slice(45, 50)
  if (center[0] !== 1 || center[1] !== 0 || center[2] !== 1 || center[3] !== 0 || center[4] !== 1) {
    const c2 = n.slice(45, 48)
    if (c2[0] !== 1 || c2[1] !== 0 || c2[2] !== 1) return null
  }

  const end = n.slice(-3)
  if (end[0] !== 1 || end[1] !== 1 || end[2] !== 1) return null

  const leftPattern = []
  for (let i = 0; i < 6; i++) {
    const idx = 3 + i * 7
    if (idx + 7 > n.length) return null
    const digitBars = n.slice(idx, idx + 7)
    const key = digitBars.join('')
    leftPattern.push(key)
  }

  const rightPattern = []
  for (let i = 0; i < 6; i++) {
    const idx = 50 + i * 7
    if (idx + 7 > n.length) return null
    const digitBars = n.slice(idx, idx + 7)
    const key = digitBars.join('')
    rightPattern.push(key)
  }

  const codeTypes = []
  const leftDigits = []
  for (const key of leftPattern) {
    if (EAN13_L[key] !== undefined) {
      codeTypes.push('L')
      leftDigits.push(EAN13_L[key])
    } else if (EAN13_G[key] !== undefined) {
      codeTypes.push('G')
      leftDigits.push(EAN13_G[key])
    } else {
      return null
    }
  }

  const parityKey = codeTypes.join('')
  const firstDigit = EAN13_PARITY[parityKey]
  if (firstDigit === undefined) return null

  const rightDigits = []
  for (const key of rightPattern) {
    if (EAN13_R[key] !== undefined) {
      rightDigits.push(EAN13_R[key])
    } else {
      return null
    }
  }

  const digits = [firstDigit, ...leftDigits, ...rightDigits]
  if (digits.length !== 13) return null

  let sum = 0
  for (let i = 0; i < 12; i++) {
    sum += parseInt(digits[i]) * (i % 2 === 0 ? 1 : 3)
  }
  const check = (10 - (sum % 10)) % 10
  if (parseInt(digits[12]) !== check) return null

  return digits.join('')
}

function decodeUPC_A(bars) {
  const result = decodeEAN13(bars)
  if (result && result.startsWith('0')) {
    return result.slice(1)
  }
  return null
}

function decodeEAN8(bars) {
  if (bars.length < 39) return null
  const n = normalizeBars(bars, 67)
  if (!n) return null
  if (n.length < 39) return null

  const start = n.slice(0, 3)
  if (start[0] !== 1 || start[1] !== 1 || start[2] !== 1) return null

  const end = n.slice(-3)
  if (end[0] !== 1 || end[1] !== 1 || end[2] !== 1) return null

  const leftDigits = []
  for (let i = 0; i < 4; i++) {
    const idx = 3 + i * 7
    if (idx + 7 > n.length) return null
    const key = n.slice(idx, idx + 7).join('')
    if (EAN13_L[key] === undefined) return null
    leftDigits.push(EAN13_L[key])
  }

  const rightDigits = []
  for (let i = 0; i < 4; i++) {
    const idx = 32 + i * 7
    if (idx + 7 > n.length) return null
    const key = n.slice(idx, idx + 7).join('')
    if (EAN13_R[key] === undefined) return null
    rightDigits.push(EAN13_R[key])
  }

  const digits = [...leftDigits, ...rightDigits]
  if (digits.length !== 8) return null

  let sum = 0
  for (let i = 0; i < 7; i++) {
    sum += parseInt(digits[i]) * (i % 2 === 0 ? 3 : 1)
  }
  const check = (10 - (sum % 10)) % 10
  if (parseInt(digits[7]) !== check) return null

  return digits.join('')
}

function matchCode128Pattern(normalized) {
  const pat = normalized.join('')
  const exact = CODE128_PATTERNS.indexOf(pat)
  if (exact !== -1) return exact

  let best = -1
  let bestDist = 2
  for (let i = 0; i < CODE128_PATTERNS.length; i++) {
    const p = CODE128_PATTERNS[i]
    let dist = 0
    for (let j = 0; j < 6; j++) {
      dist += Math.abs(normalized[j] - parseInt(p[j]))
      if (dist > bestDist) break
    }
    if (dist < bestDist) { bestDist = dist; best = i }
  }
  return best
}

function isStartB(normalized) {
  const target = [2, 1, 1, 2, 1, 4]
  let total = 0
  for (let j = 0; j < 6; j++) {
    const diff = Math.abs(normalized[j] - target[j])
    if (diff > 1) return false
    total += diff
  }
  return total <= 1
}

function isStopPattern(norm, len) {
  const target = [2, 3, 3, 1, 1, 1]
  if (len < 5 || len > 6) return false
  let total = 0
  for (let j = 0; j < len; j++) {
    const diff = Math.abs(norm[j] - target[j])
    if (diff > 1) return false
    total += diff
  }
  return total <= 1
}

function decodeCode128(bars) {
  if (bars.length < 30) return null

  // Find Start Code B within first 12 bars (handles noise at edge)
  let startOffset = -1
  for (let o = 0; o <= 6 && o < bars.length - 24; o++) {
    const g = bars.slice(o, o + 6)
    const t = g.reduce((a, b) => a + b, 0)
    if (t === 0) continue
    if (isStartB(g.map(b => Math.round(b * 11 / t)))) { startOffset = o; break }
  }
  if (startOffset < 0) return null

  let result = ''
  let i = startOffset + 6

  while (i < bars.length) {
    // Accept 5 or 6 bars for last group (stop may be truncated)
    const remaining = bars.length - i
    if (remaining < 5) break
    const groupLen = Math.min(remaining, 6)

    const group = bars.slice(i, i + groupLen)
    const total = group.reduce((a, b) => a + b, 0)
    if (total === 0) return null

    const normalized = group.map(b => Math.round(b * 11 / total))

    // Check stop pattern (accepts 5 or 6 bars)
    if (isStopPattern(normalized, groupLen)) {
      return result.length >= 4 ? result : null
    }

    // Must be exactly 6 bars for data characters
    if (groupLen < 6) return null

    const idx = matchCode128Pattern(normalized)
    if (idx < 0) return null
    if (result.length > 20) return null

    result += String.fromCharCode(idx + 32)
    i += 6
  }

  return null
}

export function scanImageData(imageData) {
  const { data, width, height } = imageData

  function getAveragedRow(y, numRows) {
    const half = Math.floor(numRows / 2)
    const row = new Array(width).fill(0)
    let count = 0
    for (let dy = -half; dy <= half; dy++) {
      const yy = y + dy
      if (yy < 0 || yy >= height) continue
      const offset = yy * width * 4
      for (let x = 0; x < width; x++) {
        const idx = offset + x * 4
        row[x] += 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2]
      }
      count++
    }
    if (count > 1) {
      const inv = 1 / count
      for (let x = 0; x < width; x++) row[x] = Math.round(row[x] * inv)
    }
    return row
  }

  function findBarcodeRegion(row) {
    const min = Math.min(...row)
    const max = Math.max(...row)
    const range = max - min
    if (range < 10) return null

    const thresholds = [0.35, 0.30, 0.40, 0.25, 0.45, 0.50]
    for (const t of thresholds) {
      const thr = min + range * t

      // Try normal polarity (dark bars on light background)
      for (const invert of [false, true]) {
        const binary = invert
          ? row.map(v => v > thr ? 1 : 0)
          : row.map(v => v < thr ? 1 : 0)

        let trans = 0
        for (let i = 1; i < binary.length; i++) {
          if (binary[i] !== binary[i - 1]) trans++
        }
        if (trans < 10 || trans > 200) continue

        let start = 0
        while (start < binary.length && binary[start] !== 1) start++
        let end = binary.length - 1
        while (end > start && binary[end] !== 1) end--
        if (end - start < 20) continue

        return binary.slice(start, end + 1)
      }
    }
    return null
  }

  function barsFromBinary(binary) {
    const bars = []
    let count = 1
    for (let i = 1; i < binary.length; i++) {
      if (binary[i] === binary[i - 1]) {
        count++
      } else {
        bars.push(count)
        count = 1
      }
    }
    bars.push(count)
    return bars
  }

  let bestResult = null

  for (let y = 0; y < height; y += 2) {
    const row = getAveragedRow(y, 5)
    const binary = findBarcodeRegion(row)
    if (!binary) continue

    const bars = barsFromBinary(binary)
    if (bars.length < 20 || bars.length > 150) continue

    const totalPixels = bars.reduce((a, b) => a + b, 0)
    if (totalPixels < 20) continue

    const tryDecode = (format, code) => {
      if (code && (!bestResult || code.length > bestResult.code.length)) {
        bestResult = { format, code }
      }
    }

    tryDecode('Code-128', decodeCode128(bars))
    if (bestResult && bestResult.code.length >= 5) break
    tryDecode('EAN-13', decodeEAN13(bars))
    if (bestResult && bestResult.code.length >= 8) break
    tryDecode('EAN-8', decodeEAN8(bars))
    if (bestResult && bestResult.code.length >= 8) break
    tryDecode('UPC-A', decodeUPC_A(bars))
  }

  return bestResult
}

async function nativeScan(video) {
  if (!('BarcodeDetector' in window)) return null
  try {
    const supported = await BarcodeDetector.getSupportedFormats()
    const desired = ['code_128', 'ean_13', 'ean_8', 'upc_a']
    const formats = desired.filter(f => supported.includes(f))
    if (formats.length === 0) return null
    const detector = new BarcodeDetector({ formats })
    const barcodes = await detector.detect(video)
    if (barcodes.length > 0) {
      const b = barcodes[0]
      const formatMap = {
        code_128: 'Code-128', ean_13: 'EAN-13', ean_8: 'EAN-8',
        upc_a: 'UPC-A',
      }
      return { format: formatMap[b.format] || b.format, code: b.rawValue }
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

export async function scanVideoFrame(video) {
  if (!video || video.readyState < 2) return null

  // 1. Native BarcodeDetector API
  const native = await nativeScan(video)
  if (native) return native

  // 2. Pure-JS on full frame
  const imageData = frameToImageData(video)
  if (!imageData) return null

  const fullResult = scanImageData(imageData)
  if (fullResult) return fullResult

  // 3. Pure-JS on center 50% crop (try zoom for small barcodes)
  const { width, height } = imageData
  const cropW = Math.round(width * 0.5)
  const cropH = Math.round(height * 0.5)
  const cropX = Math.round((width - cropW) / 2)
  const cropY = Math.round((height - cropH) / 2)

  const canvas = document.createElement('canvas')
  const outW = Math.max(cropW, 480)
  const outH = Math.round(outW * (cropH / cropW))
  canvas.width = outW
  canvas.height = outH
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  ctx.imageSmoothingEnabled = false
  ctx.drawImage(video, cropX, cropY, cropW, cropH, 0, 0, outW, outH)
  const croppedData = ctx.getImageData(0, 0, outW, outH)
  return scanImageData(croppedData)
}
