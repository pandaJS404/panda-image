import React from 'react'

import Editor from './Editor'

import { THEMES } from '../src/modules/editor/config'
import { updateRouteState } from '../src/modules/editor/state/routing'
import {
  clearBackgroundImageAsset,
  clearSettings,
  clearWatermarkFontAsset,
  getBackgroundImageAsset,
  getThemes,
  saveBackgroundImageAsset,
  saveSettings,
  saveThemes,
  saveWatermarkFontAsset,
} from '../src/shared/utils'

function isSameBackgroundAsset(left, right) {
  if (left === right) {
    return true
  }

  if (!left || !right) {
    return false
  }

  return (
    left.source === right.source && left.image === right.image && left.selection === right.selection
  )
}

function getPersistedBackgroundImageAsset(state) {
  const hasBackgroundImage =
    state.backgroundMode === 'image' &&
    (state.backgroundImage || state.backgroundImageSelection || state.backgroundImageSource)

  if (!hasBackgroundImage) {
    return null
  }

  const source = state.backgroundImageSource || null
  const selection = state.backgroundImageSelection || null
  const image = selection || source ? null : state.backgroundImage || null

  return {
    source,
    image,
    selection,
  }
}

function EditorContainer(props) {
  const [themes, updateThemes] = React.useState(THEMES)
  const backgroundAssetRef = React.useRef(null)

  React.useEffect(() => {
    const storedThemes = getThemes(localStorage) || []
    backgroundAssetRef.current = getBackgroundImageAsset(localStorage) || null

    if (storedThemes.length) {
      updateThemes(currentThemes => [...storedThemes, ...currentThemes])
    }
  }, [])

  React.useEffect(() => {
    saveThemes(themes.filter(({ custom }) => custom))
  }, [themes])

  function onReset() {
    clearSettings()
    clearBackgroundImageAsset()
    backgroundAssetRef.current = null

    if (window.location.search) {
      window.history.replaceState(null, '', window.location.pathname)
    }
  }

  function onEditorUpdate(state) {
    updateRouteState(props.router, state)
    saveSettings(state)

    const nextBackgroundAsset = getPersistedBackgroundImageAsset(state)

    if (!isSameBackgroundAsset(backgroundAssetRef.current, nextBackgroundAsset)) {
      if (nextBackgroundAsset) {
        const didPersistBackgroundAsset = saveBackgroundImageAsset(nextBackgroundAsset)

        if (!didPersistBackgroundAsset) {
          clearBackgroundImageAsset()
          backgroundAssetRef.current = nextBackgroundAsset
          return
        }
      } else {
        clearBackgroundImageAsset()
      }

      backgroundAssetRef.current = nextBackgroundAsset
    }
  }

  function onWatermarkFontAssetChange(nextValue) {
    if (nextValue == null) {
      clearWatermarkFontAsset()
      return
    }

    saveWatermarkFontAsset(nextValue)
  }

  return (
    <Editor
      {...props}
      themes={themes}
      updateThemes={updateThemes}
      onUpdate={onEditorUpdate}
      onWatermarkFontAssetChange={onWatermarkFontAssetChange}
      onReset={onReset}
    />
  )
}

export default EditorContainer
