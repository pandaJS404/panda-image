import { FONTS_HASH } from '../config'

const OPENTYPE_CDN_URL = 'https://cdn.jsdelivr.net/npm/opentype.js@1.3.4/dist/opentype.min.js'
const CJK_FALLBACK_FONT_FAMILY = 'HarmonyOS Sans'
const fontCache = new Map()
const pathCache = new Map()

let opentypePromise

function getBrowserWindow() {
  if (typeof window === 'undefined') {
    return null
  }

  return window
}

function toNumber(value, fallback) {
  const numericValue = Number.parseFloat(value)
  return Number.isFinite(numericValue) ? numericValue : fallback
}

function round(value) {
  return Number.parseFloat(value.toFixed(2))
}

function getFiniteBoxValue(value, fallback = 0) {
  return Number.isFinite(value) ? value : fallback
}

function decodeBase64TextToArrayBuffer(value) {
  const normalizedValue = value.replace(/^\)\]\}'\s*/, '').replace(/\s+/g, '')
  const binaryString = window.atob(normalizedValue)
  const length = binaryString.length
  const bytes = new Uint8Array(length)

  for (let index = 0; index < length; index += 1) {
    bytes[index] = binaryString.charCodeAt(index)
  }

  return bytes.buffer
}

function isCjkLikeCodePoint(codePoint) {
  if (!Number.isFinite(codePoint)) {
    return false
  }

  return (
    (codePoint >= 0x3000 && codePoint <= 0x303f) ||
    (codePoint >= 0x3400 && codePoint <= 0x4dbf) ||
    (codePoint >= 0x4e00 && codePoint <= 0x9fff) ||
    (codePoint >= 0xf900 && codePoint <= 0xfaff) ||
    (codePoint >= 0xff00 && codePoint <= 0xffef) ||
    (codePoint >= 0x20000 && codePoint <= 0x323af)
  )
}

function shouldUseCjkFallback(text) {
  return Array.from(text).some(char => isCjkLikeCodePoint(char.codePointAt(0)))
}

export function normalizeWatermarkText(value) {
  if (value == null) {
    return ''
  }

  return String(value).replace(/[\r\n]+/g, ' ').replace(/\s{2,}/g, ' ').trim()
}

export function resolveWatermarkFontSource({ watermarkFontFamily, watermarkFontUrl }) {
  if (watermarkFontUrl && watermarkFontFamily) {
    return {
      url: watermarkFontUrl,
      format: null,
      family: watermarkFontFamily,
    }
  }

  const builtInFont = FONTS_HASH[watermarkFontFamily]

  if (!builtInFont?.assetUrl) {
    return null
  }

  return {
    url: builtInFont.assetUrl,
    format: builtInFont.assetFormat,
    family: builtInFont.id,
    encoding: builtInFont.assetEncoding || null,
  }
}

function resolveFallbackWatermarkFontSource(primarySource, text) {
  if (!shouldUseCjkFallback(text)) {
    return null
  }

  const fallbackFont = FONTS_HASH[CJK_FALLBACK_FONT_FAMILY]

  if (!fallbackFont?.assetUrl || fallbackFont.assetUrl === primarySource?.url) {
    return null
  }

  return {
    url: fallbackFont.assetUrl,
    format: fallbackFont.assetFormat,
    family: fallbackFont.id,
    encoding: fallbackFont.assetEncoding || null,
  }
}

async function loadOpenType() {
  const browserWindow = getBrowserWindow()

  if (!browserWindow) {
    return null
  }

  if (browserWindow.opentype) {
    return browserWindow.opentype
  }

  if (!opentypePromise) {
    opentypePromise = new Promise((resolve, reject) => {
      const existingScript = document.querySelector(`script[data-opentype-loader="${OPENTYPE_CDN_URL}"]`)

      if (existingScript) {
        existingScript.addEventListener(
          'load',
          () => resolve(browserWindow.opentype),
          { once: true },
        )
        existingScript.addEventListener(
          'error',
          () => reject(new Error('Unable to load opentype.js.')),
          { once: true },
        )
        return
      }

      const script = document.createElement('script')
      script.src = OPENTYPE_CDN_URL
      script.async = true
      script.crossOrigin = 'anonymous'
      script.dataset.opentypeLoader = OPENTYPE_CDN_URL
      script.onload = () => {
        if (browserWindow.opentype) {
          resolve(browserWindow.opentype)
          return
        }

        reject(new Error('opentype.js loaded without a global export.'))
      }
      script.onerror = () => reject(new Error('Unable to load opentype.js.'))

      document.head.appendChild(script)
    }).catch(error => {
      opentypePromise = null
      throw error
    })
  }

  return opentypePromise
}

async function loadFont(source) {
  if (!source?.url) {
    return null
  }

  if (!fontCache.has(source.url)) {
    fontCache.set(
      source.url,
      (async () => {
        const opentype = await loadOpenType()

        if (!opentype?.parse) {
          throw new Error('opentype.js is unavailable.')
        }

        const response = await fetch(source.url)

        if (!response.ok) {
          throw new Error(`Unable to fetch watermark font asset: ${source.family || source.url}`)
        }

        if (source.encoding === 'base64-text') {
          return opentype.parse(decodeBase64TextToArrayBuffer(await response.text()))
        }

        return opentype.parse(await response.arrayBuffer())
      })().catch(error => {
        fontCache.delete(source.url)
        throw error
      }),
    )
  }

  return fontCache.get(source.url)
}

function buildPathCacheKey({ source, fallbackSource, text, fontSize, kerning }) {
  return JSON.stringify([source.url, fallbackSource?.url || null, text, fontSize, kerning])
}

function hasGlyph(font, char) {
  if (!font || !char) {
    return false
  }

  const glyph = font.charToGlyph(char)
  const codePoint = char.codePointAt(0)

  if (!glyph) {
    return false
  }

  if (glyph.unicode === codePoint) {
    return true
  }

  if (glyph.unicodes?.includes(codePoint)) {
    return true
  }

  return glyph.index !== 0 && glyph.name !== '.notdef'
}

function resolveFontForChar(primaryFont, fallbackFont, char) {
  if (hasGlyph(primaryFont, char)) {
    return primaryFont
  }

  if (hasGlyph(fallbackFont, char)) {
    return fallbackFont
  }

  return primaryFont || fallbackFont
}

function buildRuns(primaryFont, fallbackFont, text) {
  const runs = []

  for (const char of Array.from(text)) {
    const font = resolveFontForChar(primaryFont, fallbackFont, char)
    const previousRun = runs[runs.length - 1]

    if (previousRun?.font === font) {
      previousRun.text += char
      continue
    }

    runs.push({ font, text: char })
  }

  return runs
}

function buildWatermarkDefinition({ opentype, primaryFont, fallbackFont, text, fontSize, kerning }) {
  const options = { kerning }
  const path = new opentype.Path()
  let cursorX = 0

  buildRuns(primaryFont, fallbackFont, text).forEach(({ font, text: runText }) => {
    if (!font || !runText) {
      return
    }

    const runPath = font.getPath(runText, cursorX, fontSize, fontSize, options)
    path.commands.push(...runPath.commands)
    cursorX += font.getAdvanceWidth(runText, fontSize, options)
  })

  const box = path.getBoundingBox()
  const x1 = getFiniteBoxValue(box.x1)
  const y1 = getFiniteBoxValue(box.y1)
  const x2 = getFiniteBoxValue(box.x2)
  const y2 = getFiniteBoxValue(box.y2)
  const width = round(Math.max(1, x2 - x1))
  const height = round(Math.max(1, y2 - y1))

  return {
    width,
    height,
    translateX: round(-x1),
    translateY: round(-y1),
    pathData: path.toPathData({
      decimalPlaces: 2,
      optimize: true,
      flipY: false,
    }),
  }
}

export async function getWatermarkSvgDefinition(config) {
  const source = resolveWatermarkFontSource(config)
  const text = normalizeWatermarkText(config.watermarkText)
  const fallbackSource = resolveFallbackWatermarkFontSource(source, text)

  if (!source || !text) {
    return null
  }

  const fontSize = toNumber(config.watermarkTextSize, 96)
  const kerning = config.watermarkTextKerning !== false
  const cacheKey = buildPathCacheKey({ source, fallbackSource, text, fontSize, kerning })

  if (!pathCache.has(cacheKey)) {
    pathCache.set(
      cacheKey,
      (async () => {
        const opentype = await loadOpenType()
        const [primaryFont, fallbackFont] = await Promise.all([
          loadFont(source),
          fallbackSource ? loadFont(fallbackSource) : Promise.resolve(null),
        ])

        return buildWatermarkDefinition({
          opentype,
          primaryFont,
          fallbackFont,
          text,
          fontSize,
          kerning,
        })
      })().catch(error => {
        pathCache.delete(cacheKey)
        throw error
      }),
    )
  }

  return pathCache.get(cacheKey)
}
