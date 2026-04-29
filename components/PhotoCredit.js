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

export default function PhotoCredit({ photographer }) {
  const href = getCreditHref(photographer)
  const sourceName = photographer.sourceName || '图片来源'

  return (
    <div className="photo-credit">
      {'图片来源：'}{' '}
      {href ? <a href={href}>{photographer.name}</a> : <span>{photographer.name}</span>}
      {' · '}
      {sourceName}
    </div>
  )
}
