import React from 'react'

import Editor from './Editor'

import { THEMES } from '../src/modules/editor/config'
import { updateRouteState } from '../src/modules/editor/state/routing'
import { clearSettings, getThemes, saveSettings, saveThemes } from '../src/shared/utils'

function onReset() {
  clearSettings()

  if (window.location.search) {
    window.history.replaceState(null, '', window.location.pathname)
  }
}

function EditorContainer(props) {
  const [themes, updateThemes] = React.useState(THEMES)

  React.useEffect(() => {
    const storedThemes = getThemes(localStorage) || []

    if (storedThemes.length) {
      updateThemes(currentThemes => [...storedThemes, ...currentThemes])
    }
  }, [])

  React.useEffect(() => {
    saveThemes(themes.filter(({ custom }) => custom))
  }, [themes])

  function onEditorUpdate(state) {
    updateRouteState(props.router, state)
    saveSettings(state)
  }

  return (
    <Editor
      {...props}
      themes={themes}
      updateThemes={updateThemes}
      onUpdate={onEditorUpdate}
      onReset={onReset}
    />
  )
}

export default EditorContainer
