import React from 'react'

const BING_ORIGIN = 'https://www.bing.com'

function getCreditHref(photographer) {
  const rawHref = photographer.profile_url || photographer.url

  if (!rawHref) {
    return null
  }

  if (/unsplash\.com/iu.test(rawHref)) {
    try {
      const href = new URL(rawHref)
      href.searchParams.set('utm_source', 'panda')
      return href.toString()
    } catch {
      return `${rawHref}${rawHref.includes('?') ? '&' : '?'}utm_source=panda`
    }
  }

  try {
    return new URL(rawHref, BING_ORIGIN).toString()
  } catch {
    return null
  }
}

function formatCreditLabel(photographer) {
  const name = photographer?.name || ''
  const sourceName = photographer?.sourceName || ''

  if (!sourceName || sourceName === name) {
    return name
  }

  if (!name) {
    return sourceName
  }

  return `${name} · ${sourceName}`
}

export default function PhotoCredit({ photographer }) {
  const href = getCreditHref(photographer)
  const creditLabel = formatCreditLabel(photographer)

  return (
    <div className="photo-credit">
      {'图片来源：'}{' '}
      {href && photographer.name ? <a href={href}>{creditLabel}</a> : <span>{creditLabel}</span>}
    </div>
  )
}
