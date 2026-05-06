import React from 'react'

import EditorContainer from '../components/EditorContainer'
import Page from '../components/Page'
import { MetaLinks } from '../components/Meta'

async function clearLegacyServiceWorkerState() {
  const cleanupTasks = []

  if (window.navigator && navigator.serviceWorker) {
    cleanupTasks.push(
      navigator.serviceWorker
        .getRegistrations()
        .then(registrations =>
          Promise.all(registrations.map(registration => registration.unregister())),
        ),
    )
  }

  if (window.caches) {
    cleanupTasks.push(
      window.caches.keys().then(keys => Promise.all(keys.map(key => window.caches.delete(key)))),
    )
  }

  await Promise.all(cleanupTasks)
}

export default function App() {
  React.useEffect(() => {
    void clearLegacyServiceWorkerState().catch(() => {})
  }, [])

  return (
    <Page enableHeroText={true} flex={true}>
      <MetaLinks />
      <EditorContainer />
    </Page>
  )
}
