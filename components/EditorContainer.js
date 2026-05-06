import React from 'react'

import Editor from './Editor'

import { THEMES } from '../src/modules/editor/config'
import {
  clearBackgroundImageAsset,
  clearEditorStorage,
  clearFontAsset,
  clearWatermarkFontAsset,
  getBackgroundImageAsset,
  getThemes,
  saveBackgroundImageAsset,
  saveFontAsset,
  saveSettings,
  saveThemes,
  saveWatermarkFontAsset,
  syncLegacyStorage,
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

function EditorContainer() {
  const [themes, updateThemes] = React.useState(THEMES)
  const backgroundAssetRef = React.useRef(null)
  const storageQueueRef = React.useRef(Promise.resolve())

  const enqueueStorageTask = React.useCallback(task => {
    const nextTask = storageQueueRef.current
      .catch(() => {})
      .then(task)

    storageQueueRef.current = nextTask.catch(() => {})
    return nextTask
  }, [])

  React.useEffect(() => {
    void syncLegacyStorage()
      .then(() => Promise.all([getThemes(), getBackgroundImageAsset()]))
      .then(([storedThemes, storedBackgroundAsset]) => {
        backgroundAssetRef.current = storedBackgroundAsset || null

        if (storedThemes?.length) {
          updateThemes(currentThemes => [...storedThemes, ...currentThemes])
        }
      })
  }, [])

  React.useEffect(() => {
    void saveThemes(themes.filter(({ custom }) => custom))
  }, [themes])

  const persistEditorState = React.useCallback(async state => {
    await saveSettings(state)

    const nextBackgroundAsset = getPersistedBackgroundImageAsset(state)

    if (!isSameBackgroundAsset(backgroundAssetRef.current, nextBackgroundAsset)) {
      if (nextBackgroundAsset) {
        await saveBackgroundImageAsset(nextBackgroundAsset)
      } else {
        await clearBackgroundImageAsset()
      }

      backgroundAssetRef.current = nextBackgroundAsset
    }
  }, [])

  const onReset = React.useCallback(
    nextDefaultState =>
      enqueueStorageTask(async () => {
        await clearEditorStorage()
        backgroundAssetRef.current = null

        window.history.replaceState(null, '', window.location.pathname)

        if (nextDefaultState) {
          await persistEditorState(nextDefaultState)
        }
      }),
    [enqueueStorageTask, persistEditorState],
  )

  const onEditorUpdate = React.useCallback(
    state => {
      void enqueueStorageTask(() => persistEditorState(state))
    },
    [enqueueStorageTask, persistEditorState],
  )

  const onWatermarkFontAssetChange = React.useCallback(nextValue => {
    if (nextValue == null) {
      void clearWatermarkFontAsset()
      return
    }

    void saveWatermarkFontAsset(nextValue)
  }, [])

  const onFontAssetChange = React.useCallback(nextValue => {
    if (nextValue == null) {
      void clearFontAsset()
      return
    }

    void saveFontAsset(nextValue)
  }, [])

  return (
    <Editor
      themes={themes}
      updateThemes={updateThemes}
      onFontAssetChange={onFontAssetChange}
      onUpdate={onEditorUpdate}
      onWatermarkFontAssetChange={onWatermarkFontAssetChange}
      onReset={onReset}
    />
  )
}

export default EditorContainer
