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

function patternDist(a, b) {
  let d = 0
  for (let j = 0; j < 6; j++) d += Math.abs(a[j] - b[j])
  return d
}

function matchCode128Pattern(normalized) {
  const pat = normalized.join('')
  const exact = CODE128_PATTERNS.indexOf(pat)
  if (exact !== -1) return exact

  // Stop pattern (233111) — check BEFORE fuzzy to avoid false data match
  const stopPat = [2, 3, 3, 1, 1, 1]
  if (patternDist(normalized, stopPat) <= 2) return -2

  // Fuzzy: find data pattern with smallest total digit difference
  let best = -1
  let bestDist = 3
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
  return patternDist(normalized, [2, 1, 1, 2, 1, 4]) <= 2
}

function decodeCode128(bars) {
  if (bars.length < 18) return null

  let result = ''
  let i = 0

  while (i < bars.length - 5) {
    const group = bars.slice(i, i + 6)
    const total = group.reduce((a, b) => a + b, 0)
    if (total === 0) { i++; continue }

    const normalized = group.map(b => Math.round(b * 11 / total))

    if (isStartB(normalized)) { i += 6; continue }

    const idx = matchCode128Pattern(normalized)
    if (idx === -2) break
    if (idx === -1) {
      if (result.length > 3) break
      i++
      continue
    }

    result += String.fromCharCode(idx + 32)
    i += 6
  }

  return result.length > 0 ? result : null
}

export function scanImageData(imageData) {
  const { data, width, height } = imageData

  function getScanLine(y) {
    const row = []
    const offset = y * width * 4
    for (let x = 0; x < width; x++) {
      const idx = offset + x * 4
      const gray = Math.round(0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2])
      row.push(gray)
    }
    return row
  }

  function findBarcodeRegion(row) {
    const min = Math.min(...row)
    const max = Math.max(...row)
    const range = max - min
    if (range < 20) return null

    // Adaptive threshold: 35% between min and max
    const threshold = min + range * 0.35
    const binary = row.map(v => v < threshold ? 1 : 0)

    let transitionCount = 0
    for (let i = 1; i < binary.length; i++) {
      if (binary[i] !== binary[i - 1]) transitionCount++
    }

    if (transitionCount < 20 || transitionCount > 150) return null

    let start = 0
    while (start < binary.length && binary[start] !== 1) start++
    let end = binary.length - 1
    while (end > start && binary[end] !== 1) end--

    if (end - start < 40) return null
    return binary.slice(start, end + 1)
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

  const scanLines = []
  for (let y = 0; y < height; y += 3) {
    scanLines.push(y)
  }

  let bestResult = null

  for (const y of scanLines) {
    const row = getScanLine(y)
    const binary = findBarcodeRegion(row)
    if (!binary) continue

    const bars = barsFromBinary(binary)
    if (bars.length < 30 || bars.length > 120) continue

    const totalPixels = bars.reduce((a, b) => a + b, 0)
    if (totalPixels < 30) continue

    const tryDecode = (format, code) => {
      if (code && (!bestResult || code.length > bestResult.code.length)) {
        bestResult = { format, code }
      }
    }

    tryDecode('EAN-13', decodeEAN13(bars))
    if (bestResult && bestResult.code.length >= 8) break
    tryDecode('EAN-8', decodeEAN8(bars))
    if (bestResult && bestResult.code.length >= 8) break
    tryDecode('Code-128', decodeCode128(bars))
    if (bestResult && bestResult.code.length >= 5) break
    tryDecode('UPC-A', decodeUPC_A(bars))
    if (bestResult && bestResult.code.length >= 8) break
  }

  return bestResult
}

export async function scanVideoFrame(video) {
  if (!video || video.readyState < 2) return null

  const canvas = document.createElement('canvas')
  canvas.width = video.videoWidth
  canvas.height = video.videoHeight
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  ctx.drawImage(video, 0, 0)
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  return scanImageData(imageData)
}
