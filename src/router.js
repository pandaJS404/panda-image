import React from 'react'

function getAsPath() {
  return `${window.location.pathname}${window.location.search}${window.location.hash}`
}

function createRouterSnapshot() {
  return {
    pathname: window.location.pathname,
    asPath: getAsPath(),
  }
}

function buildQueryString(query = {}) {
  const params = new URLSearchParams()

  Object.entries(query).forEach(([key, value]) => {
    if (value != null && value !== '') {
      params.set(key, value)
    }
  })

  const queryString = params.toString()

  return queryString ? `?${queryString}` : ''
}

function replaceRoute(pathname, query = {}) {
  const nextPath = `${pathname}${buildQueryString(query)}`

  window.history.replaceState(null, '', nextPath)
  window.dispatchEvent(new Event('panda:router-replace'))
}

export function useRouter() {
  const [snapshot, setSnapshot] = React.useState(() =>
    typeof window === 'undefined' ? { pathname: '/', asPath: '/' } : createRouterSnapshot(),
  )

  React.useEffect(() => {
    const syncSnapshot = () => setSnapshot(createRouterSnapshot())

    window.addEventListener('popstate', syncSnapshot)
    window.addEventListener('panda:router-replace', syncSnapshot)

    return () => {
      window.removeEventListener('popstate', syncSnapshot)
      window.removeEventListener('panda:router-replace', syncSnapshot)
    }
  }, [])

  return React.useMemo(() => {
    return {
      pathname: snapshot.pathname,
      asPath: snapshot.asPath,
      replace(nextUrl, nextState) {
        replaceRoute(
          nextState?.pathname || nextUrl?.pathname || snapshot.pathname,
          nextState?.query || nextUrl?.query,
        )
      },
    }
  }, [snapshot])
}
