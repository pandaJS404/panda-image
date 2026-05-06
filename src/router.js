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
    }
  }, [snapshot])
}
