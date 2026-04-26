import React from 'react'

import EditorContainer from '../components/EditorContainer'
import Page from '../components/Page'
import { MetaLinks } from '../components/Meta'
import { useRouter } from './router'

function clearLegacyServiceWorkerState() {
  if (window.navigator && navigator.serviceWorker) {
    navigator.serviceWorker.getRegistrations().then(registrations => {
      registrations.forEach(registration => {
        registration.unregister()
      })
    })
  }

  if (window.caches) {
    window.caches.keys().then(keys => {
      keys.forEach(key => {
        window.caches.delete(key)
      })
    })
  }
}

export default function App() {
  const router = useRouter()

  React.useEffect(() => {
    clearLegacyServiceWorkerState()
  }, [])

  return (
    <Page enableHeroText={true} flex={true}>
      <MetaLinks />
      <EditorContainer router={router} />
    </Page>
  )
}
