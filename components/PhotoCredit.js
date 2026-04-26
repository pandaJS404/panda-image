import React from 'react'

function getCreditHref(photographer) {
  const rawHref = photographer.profile_url || photographer.url

  if (!rawHref) {
    return null
  }

  if (!/unsplash\.com/iu.test(rawHref)) {
    return rawHref
  }

  try {
    const href = new URL(rawHref)
    href.searchParams.set('utm_source', 'panda')
    href.searchParams.set('utm_medium', 'referral')
    return href.toString()
  } catch {
    return `${rawHref}${rawHref.includes('?') ? '&' : '?'}utm_source=panda&utm_medium=referral`
  }
}

export default function PhotoCredit({ photographer }) {
  const href = getCreditHref(photographer)
  const sourceName = photographer.sourceName || 'Unsplash'

  return (
    <div className="photo-credit">
      {'图片作者：'}
      {' '}
      {href ? <a href={href}>{photographer.name}</a> : <span>{photographer.name}</span>}
      {' · '}
      {sourceName}
    </div>
  )
}
