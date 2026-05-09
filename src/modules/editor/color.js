const HEX_SHORT_PATTERN = /^#[0-9a-f]{3}$/i
const HEX_LONG_PATTERN = /^#[0-9a-f]{6}$/i
const RGB_PATTERN = /^rgba?\(\s*([^,]+)\s*,\s*([^,]+)\s*,\s*([^,)]+)(?:\s*,\s*[^)]+)?\)$/i

export function expandHexColor(value) {
  const hexValue = String(value || '').trim()

  if (HEX_SHORT_PATTERN.test(hexValue)) {
    return `#${hexValue
      .slice(1)
      .split('')
      .map(character => character + character)
      .join('')}`
  }

  if (HEX_LONG_PATTERN.test(hexValue)) {
    return hexValue
  }

  return null
}

export function rgbChannelToHex(value) {
  const numericValue = Number.parseFloat(value)

  if (!Number.isFinite(numericValue)) {
    return null
  }

  const normalizedValue = value.includes('%')
    ? Math.round((Math.min(Math.max(numericValue, 0), 100) / 100) * 255)
    : Math.round(Math.min(Math.max(numericValue, 0), 255))

  return normalizedValue.toString(16).padStart(2, '0')
}

export function normalizeColorToHex(value, fallback) {
  const hexValue = expandHexColor(value)

  if (hexValue) {
    return hexValue
  }

  const rgbMatch = String(value || '')
    .trim()
    .match(RGB_PATTERN)

  if (!rgbMatch) {
    return fallback
  }

  const channels = rgbMatch.slice(1, 4).map(rgbChannelToHex)

  if (channels.some(channel => !channel)) {
    return fallback
  }

  return `#${channels.join('')}`
}
