import { DEFAULT_BG_COLOR } from '../config'

const IMAGE_BACKGROUND_STYLE = {
  backgroundSize: 'cover',
  backgroundRepeat: 'no-repeat',
}

const STATIC_BACKGROUND_STYLE = {
  backgroundSize: 'auto',
  backgroundRepeat: 'repeat',
}

export function getBackgroundImageSource(config = {}) {
  return (config.backgroundImage && config.backgroundImageSelection) || config.backgroundImage || null
}

export function getStaticBackgroundStyle(config = {}) {
  const style = {
    ...STATIC_BACKGROUND_STYLE,
    background: config.backgroundGradient || config.backgroundColor || DEFAULT_BG_COLOR,
  }

  if (config.backgroundGradient && config.backgroundGradientBlendMode) {
    style.backgroundBlendMode = config.backgroundGradientBlendMode
  }

  return style
}

export function getCanvasBackgroundStyle(config = {}) {
  if (config.backgroundMode === 'image') {
    const backgroundImage = getBackgroundImageSource(config)

    return {
      ...IMAGE_BACKGROUND_STYLE,
      backgroundImage: backgroundImage ? `url(${backgroundImage})` : 'none',
    }
  }

  return getStaticBackgroundStyle(config)
}

export function getBackgroundPreviewStyle(config = {}) {
  const backgroundImage = getBackgroundImageSource(config)

  if (config.backgroundMode === 'image' && backgroundImage) {
    return {
      ...IMAGE_BACKGROUND_STYLE,
      backgroundImage: `url(${backgroundImage})`,
    }
  }

  return getStaticBackgroundStyle(config)
}

export function getSquareExportBackgroundStyle(config = {}) {
  if (config.backgroundMode === 'image') {
    return getStaticBackgroundStyle({ backgroundColor: config.backgroundColor })
  }

  return getStaticBackgroundStyle(config)
}

export function isStaticGradientActive(config = {}) {
  return config.backgroundMode !== 'image' && Boolean(config.backgroundGradient)
}

export function applyBackgroundStyle(target, style = {}) {
  target.style.background = style.background || ''
  target.style.backgroundImage = style.backgroundImage || ''
  target.style.backgroundSize = style.backgroundSize || ''
  target.style.backgroundRepeat = style.backgroundRepeat || ''
  target.style.backgroundBlendMode = style.backgroundBlendMode || ''
}
