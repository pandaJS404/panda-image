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

export const NEUMORPHISM_COLOR_MODES = {
  solid: 'solid',
  gradient: 'gradient',
}

export const DEFAULT_NEUMORPHISM_SETTINGS = {
  neumorphismEnabled: false,
  neumorphismColor: '#55b9f3',
  neumorphismColorMode: NEUMORPHISM_COLOR_MODES.solid,
  neumorphismGradientStart: '#55b9f3',
  neumorphismGradientEnd: '#7fd8ff',
  neumorphismGradientAngle: 145,
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
    neumorphismColorMode,
    neumorphismGradientStart,
    neumorphismGradientEnd,
    neumorphismGradientAngle,
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
  const colorMode = Object.values(NEUMORPHISM_COLOR_MODES).includes(neumorphismColorMode)
    ? neumorphismColorMode
    : DEFAULT_NEUMORPHISM_SETTINGS.neumorphismColorMode
  const gradientStart = normalizeHexColor(
    neumorphismGradientStart,
    DEFAULT_NEUMORPHISM_SETTINGS.neumorphismGradientStart,
  )
  const gradientEnd = normalizeHexColor(
    neumorphismGradientEnd,
    DEFAULT_NEUMORPHISM_SETTINGS.neumorphismGradientEnd,
  )
  const gradientAngle = normalizeNumber(
    neumorphismGradientAngle,
    DEFAULT_NEUMORPHISM_SETTINGS.neumorphismGradientAngle,
    { min: 0, max: 360 },
  )
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
  const isGradientMode = colorMode === NEUMORPHISM_COLOR_MODES.gradient
  const shadowDarkBase = isGradientMode ? gradientStart : color
  const shadowLightBase = isGradientMode ? gradientEnd : color
  const darkColor = colorLuminance(shadowDarkBase, intensity * -1)
  const lightColor = colorLuminance(shadowLightBase, intensity)
  const usesGradient = shape === NEUMORPHISM_SHAPES.concave || shape === NEUMORPHISM_SHAPES.convex
  const firstGradientColor =
    usesGradient && shape !== NEUMORPHISM_SHAPES.pressed
      ? colorLuminance(color, shape === NEUMORPHISM_SHAPES.convex ? 0.07 : -0.1)
      : color
  const secondGradientColor =
    usesGradient && shape !== NEUMORPHISM_SHAPES.pressed
      ? colorLuminance(color, shape === NEUMORPHISM_SHAPES.concave ? 0.07 : -0.1)
      : color
  const gradientModeFirstColor = usesGradient
    ? colorLuminance(gradientStart, shape === NEUMORPHISM_SHAPES.convex ? 0.07 : -0.1)
    : gradientStart
  const gradientModeSecondColor = usesGradient
    ? colorLuminance(gradientEnd, shape === NEUMORPHISM_SHAPES.concave ? 0.07 : -0.1)
    : gradientEnd
  const inset = shape === NEUMORPHISM_SHAPES.pressed ? 'inset ' : ''
  const background = isGradientMode
    ? `linear-gradient(${gradientAngle}deg, ${gradientModeFirstColor}, ${gradientModeSecondColor})`
    : usesGradient
      ? `linear-gradient(${angle}deg, ${firstGradientColor}, ${secondGradientColor})`
      : color

  return {
    background,
    borderRadius: `${radius}px`,
    boxShadow: `${inset}${x}px ${y}px ${blur}px ${darkColor}, ${inset}${x * -1}px ${
      y * -1
    }px ${blur}px ${lightColor}`,
  }
}
