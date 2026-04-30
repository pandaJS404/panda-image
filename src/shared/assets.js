const ABSOLUTE_ASSET_PATTERN = /^(?:[a-z]+:)?\/\//iu
const DATA_ASSET_PATTERN = /^(?:data|blob):/iu

function ensureLeadingSlash(value) {
  if (!value) {
    return '/'
  }

  return value.startsWith('/') ? value : `/${value}`
}

function ensureTrailingSlash(value) {
  return value.endsWith('/') ? value : `${value}/`
}

export function getBaseAssetPath() {
  return ensureTrailingSlash(ensureLeadingSlash(import.meta.env.BASE_URL || '/'))
}

export function getAssetUrl(path = '') {
  if (!path) {
    return getBaseAssetPath()
  }

  if (ABSOLUTE_ASSET_PATTERN.test(path) || DATA_ASSET_PATTERN.test(path)) {
    return path
  }

  const normalizedPath = path.replace(/^\/+/u, '')

  return `${getBaseAssetPath()}${normalizedPath}`
}

