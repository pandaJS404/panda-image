export const NEUMORPHISM_SHAPES = {
  flat: 'flat',
  pressed: 'pressed',
  concave: 'concave',
  convex: 'convex',
}

export const NEUMORPHISM_LIGHT_SOURCES = {
  topLeft: 'top-left',
  topRight: 'top-right',
  bottomRight: 'bottom-right',
  bottomLeft: 'bottom-left',
}

export const DEFAULT_NEUMORPHISM_SETTINGS = {
  neumorphismEnabled: false,
  neumorphismColor: '#55b9f3',
  neumorphismShape: NEUMORPHISM_SHAPES.flat,
  neumorphismLightSource: NEUMORPHISM_LIGHT_SOURCES.topLeft,
  neumorphismDistance: 20,
  neumorphismBlur: 40,
  neumorphismIntensity: 0.15,
  neumorphismRadius: 12,
}

function normalizeHexColor(value, fallback = DEFAULT_NEUMORPHISM_SETTINGS.neumorphismColor) {
  const normalizedValue = String(value || '').trim()

  if (/^#[0-9A-F]{6}$/i.test(normalizedValue)) {
    return normalizedValue
  }

  return fallback
}

export function colorLuminance(hex, lum = 0) {
  const normalizedHex = normalizeHexColor(hex).replace(/[^0-9a-f]/gi, '')

  return [0, 1, 2].reduce((rgb, index) => {
    const channel = Number.parseInt(normalizedHex.slice(index * 2, index * 2 + 2), 16)
    const adjustedChannel = Math.round(Math.min(Math.max(0, channel + channel * lum), 255))
    return `${rgb}${adjustedChannel.toString(16).padStart(2, '0')}`
  }, '#')
}

function getLightSourcePosition(lightSource, distance) {
  switch (lightSource) {
    case NEUMORPHISM_LIGHT_SOURCES.topRight:
      return { x: -distance, y: distance, angle: 225 }
    case NEUMORPHISM_LIGHT_SOURCES.bottomRight:
      return { x: -distance, y: -distance, angle: 315 }
    case NEUMORPHISM_LIGHT_SOURCES.bottomLeft:
      return { x: distance, y: -distance, angle: 45 }
    case NEUMORPHISM_LIGHT_SOURCES.topLeft:
    default:
      return { x: distance, y: distance, angle: 145 }
  }
}

function normalizeNumber(value, fallback, { min = -Infinity, max = Infinity } = {}) {
  const numericValue = Number.parseFloat(value)

  if (!Number.isFinite(numericValue)) {
    return fallback
  }

  return Math.min(Math.max(numericValue, min), max)
}

export function getNeumorphismStyle(settings = {}) {
  const {
    neumorphismColor,
    neumorphismShape,
    neumorphismLightSource,
    neumorphismDistance,
    neumorphismBlur,
    neumorphismIntensity,
    neumorphismRadius,
  } = {
    ...DEFAULT_NEUMORPHISM_SETTINGS,
    ...settings,
  }

  const color = normalizeHexColor(neumorphismColor)
  const shape = Object.values(NEUMORPHISM_SHAPES).includes(neumorphismShape)
    ? neumorphismShape
    : DEFAULT_NEUMORPHISM_SETTINGS.neumorphismShape
  const lightSource = Object.values(NEUMORPHISM_LIGHT_SOURCES).includes(neumorphismLightSource)
    ? neumorphismLightSource
    : DEFAULT_NEUMORPHISM_SETTINGS.neumorphismLightSource
  const distance = normalizeNumber(neumorphismDistance, 20, { min: 0, max: 80 })
  const blur = normalizeNumber(neumorphismBlur, 40, { min: 0, max: 140 })
  const intensity = normalizeNumber(neumorphismIntensity, 0.15, { min: 0.01, max: 0.6 })
  const radius = normalizeNumber(neumorphismRadius, 12, { min: 0, max: 120 })
  const { x, y, angle } = getLightSourcePosition(lightSource, distance)
  const darkColor = colorLuminance(color, intensity * -1)
  const lightColor = colorLuminance(color, intensity)
  const usesGradient = shape === NEUMORPHISM_SHAPES.concave || shape === NEUMORPHISM_SHAPES.convex
  const firstGradientColor =
    usesGradient && shape !== NEUMORPHISM_SHAPES.pressed
      ? colorLuminance(color, shape === NEUMORPHISM_SHAPES.convex ? 0.07 : -0.1)
      : color
  const secondGradientColor =
    usesGradient && shape !== NEUMORPHISM_SHAPES.pressed
      ? colorLuminance(color, shape === NEUMORPHISM_SHAPES.concave ? 0.07 : -0.1)
      : color
  const inset = shape === NEUMORPHISM_SHAPES.pressed ? 'inset ' : ''

  return {
    background: usesGradient
      ? `linear-gradient(${angle}deg, ${firstGradientColor}, ${secondGradientColor})`
      : color,
    borderRadius: `${radius}px`,
    boxShadow: `${inset}${x}px ${y}px ${blur}px ${darkColor}, ${inset}${x * -1}px ${
      y * -1
    }px ${blur}px ${lightColor}`,
  }
}
