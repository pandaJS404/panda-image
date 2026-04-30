import React from 'react'
import { Helmet } from 'react-helmet-async'

function inferFontFormat(url) {
  if (!url) {
    return null
  }

  if (url.startsWith('data:')) {
    if (url.includes('font/woff2')) return 'woff2'
    if (url.includes('font/woff')) return 'woff'
    if (url.includes('font/otf') || url.includes('application/x-font-otf')) return 'opentype'
    if (url.includes('font/ttf') || url.includes('application/x-font-ttf')) return 'truetype'
  }

  const normalizedUrl = url.toLowerCase()

  if (normalizedUrl.includes('.woff2')) return 'woff2'
  if (normalizedUrl.includes('.woff')) return 'woff'
  if (normalizedUrl.includes('.otf')) return 'opentype'
  if (normalizedUrl.includes('.ttf')) return 'truetype'

  return null
}

function buildFontFace(family, url) {
  const format = inferFontFormat(url)
  const formatSuffix = format ? ` format('${format}')` : ''

  return `@font-face { font-family: '${family}'; src: url(${url})${formatSuffix}; font-display: swap; }`
}

export default function FontFace(config) {
  const entries = [
    config.fontUrl && config.fontFamily ? [config.fontFamily, config.fontUrl] : null,
    config.watermarkFontUrl && config.watermarkFontFamily
      ? [config.watermarkFontFamily, config.watermarkFontUrl]
      : null,
  ].filter(Boolean)
  const uniqueEntries = Array.from(
    new Map(entries.map(entry => [entry.join('::'), entry])).values(),
  )

  if (!uniqueEntries.length) {
    return null
  }

  return (
    <Helmet>
      <style>{uniqueEntries.map(([family, url]) => buildFontFace(family, url)).join('\n')}</style>
    </Helmet>
  )
}
