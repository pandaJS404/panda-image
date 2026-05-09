import { normalizeColorToHex } from './color'

const DEFAULT_GRADIENT_ANGLE = 145
const DEFAULT_GRADIENT_START = '#55b9f3'
const DEFAULT_GRADIENT_END = '#7fd8ff'

export function splitGradientArguments(value) {
  const parts = []
  let current = ''
  let depth = 0

  for (const character of String(value || '')) {
    if (character === '(') {
      depth += 1
    } else if (character === ')') {
      depth = Math.max(0, depth - 1)
    }

    if (character === ',' && depth === 0) {
      if (current.trim()) {
        parts.push(current.trim())
      }
      current = ''
      continue
    }

    current += character
  }

  if (current.trim()) {
    parts.push(current.trim())
  }

  return parts
}

export function resolveGradientAngle(token) {
  const normalizedToken = String(token || '')
    .trim()
    .toLowerCase()

  if (!normalizedToken) {
    return DEFAULT_GRADIENT_ANGLE
  }

  if (normalizedToken.endsWith('turn')) {
    const turns = Number.parseFloat(normalizedToken)
    return Number.isFinite(turns)
      ? Number.parseFloat((turns * 360).toFixed(2))
      : DEFAULT_GRADIENT_ANGLE
  }

  if (normalizedToken.endsWith('rad')) {
    const radians = Number.parseFloat(normalizedToken)
    return Number.isFinite(radians)
      ? Number.parseFloat(((radians * 180) / Math.PI).toFixed(2))
      : DEFAULT_GRADIENT_ANGLE
  }

  if (normalizedToken.endsWith('grad')) {
    const grads = Number.parseFloat(normalizedToken)
    return Number.isFinite(grads)
      ? Number.parseFloat((grads * 0.9).toFixed(2))
      : DEFAULT_GRADIENT_ANGLE
  }

  if (normalizedToken.endsWith('deg')) {
    const degrees = Number.parseFloat(normalizedToken)
    return Number.isFinite(degrees) ? Number.parseFloat(degrees.toFixed(2)) : DEFAULT_GRADIENT_ANGLE
  }

  switch (normalizedToken.replace(/\s+/g, ' ')) {
    case 'to top':
      return 0
    case 'to top right':
      return 45
    case 'to right':
      return 90
    case 'to bottom right':
      return 135
    case 'to bottom':
      return 180
    case 'to bottom left':
      return 225
    case 'to left':
      return 270
    case 'to top left':
      return 315
    default:
      return DEFAULT_GRADIENT_ANGLE
  }
}

export function extractGradientColor(token) {
  const match = String(token || '')
    .trim()
    .match(/(#[0-9a-f]{3,8}\b|rgba?\([^)]+\)|hsla?\([^)]+\))/i)

  return match ? match[1] : null
}

export function resolveNeumorphismGradientFromBackground(gradient) {
  if (typeof gradient !== 'string' || !/gradient\(/i.test(gradient)) {
    return null
  }

  const openParenIndex = gradient.indexOf('(')
  const closeParenIndex = gradient.lastIndexOf(')')

  if (openParenIndex === -1 || closeParenIndex === -1 || closeParenIndex <= openParenIndex) {
    return null
  }

  const gradientBody = gradient.slice(openParenIndex + 1, closeParenIndex)
  const gradientParts = splitGradientArguments(gradientBody)

  if (!gradientParts.length) {
    return null
  }

  const firstPart = gradientParts[0]
  const hasExplicitDirection =
    /^(to\s+|[-+]?\d+(?:\.\d+)?(?:deg|rad|turn|grad))$/i.test(firstPart.trim()) ||
    /^to\s+/i.test(firstPart.trim())
  const colorParts = (hasExplicitDirection ? gradientParts.slice(1) : gradientParts)
    .map(extractGradientColor)
    .filter(Boolean)

  if (colorParts.length < 2) {
    return null
  }

  return {
    neumorphismColorMode: 'gradient',
    neumorphismGradientStart: normalizeColorToHex(colorParts[0], DEFAULT_GRADIENT_START),
    neumorphismGradientEnd: normalizeColorToHex(
      colorParts[colorParts.length - 1],
      DEFAULT_GRADIENT_END,
    ),
    neumorphismGradientAngle: hasExplicitDirection
      ? resolveGradientAngle(firstPart)
      : DEFAULT_GRADIENT_ANGLE,
  }
}

export function resolveNeumorphismGradientDefaults(gradient) {
  const fallback = {
    start: DEFAULT_GRADIENT_START,
    end: DEFAULT_GRADIENT_END,
    angle: DEFAULT_GRADIENT_ANGLE,
  }

  if (typeof gradient !== 'string' || !/gradient\(/i.test(gradient)) {
    return fallback
  }

  const openParenIndex = gradient.indexOf('(')
  const closeParenIndex = gradient.lastIndexOf(')')

  if (openParenIndex === -1 || closeParenIndex === -1 || closeParenIndex <= openParenIndex) {
    return fallback
  }

  const gradientParts = splitGradientArguments(gradient.slice(openParenIndex + 1, closeParenIndex))
  const firstPart = gradientParts[0] || ''
  const hasExplicitDirection =
    /^(to\s+|[-+]?\d+(?:\.\d+)?(?:deg|rad|turn|grad))$/i.test(firstPart.trim()) ||
    /^to\s+/i.test(firstPart.trim())
  const colorParts = (hasExplicitDirection ? gradientParts.slice(1) : gradientParts)
    .map(extractGradientColor)
    .filter(Boolean)

  if (colorParts.length < 2) {
    return fallback
  }

  return {
    start: normalizeColorToHex(colorParts[0], DEFAULT_GRADIENT_START),
    end: normalizeColorToHex(colorParts[colorParts.length - 1], DEFAULT_GRADIENT_END),
    angle: hasExplicitDirection ? resolveGradientAngle(firstPart) : DEFAULT_GRADIENT_ANGLE,
  }
}
