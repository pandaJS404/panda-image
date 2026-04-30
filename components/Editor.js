import React from 'react'
import debounce from 'lodash.debounce'
import { snapdom } from '@zumer/snapdom'
import { App as AntdApp } from 'antd'
import { AimOutlined } from '@ant-design/icons'

import Dropdown from './Dropdown'
import Settings from './Settings'
import Toolbar from './Toolbar'
import Overlay from './Overlay'
import BackgroundSelect from './BackgroundSelect'
import Panda from './Panda'
import FileDropzone from './FileDropzone'
import ExportMenu from './ExportMenu'
import CopyMenu from './CopyMenu'
import Themes from './Themes'
import FontFace from './FontFace'
import { resolveBuiltInBackgroundImageSource } from '../src/bg-image'
import {
  DEFAULT_CODE,
  DEFAULT_EXPORT_SIZE,
  DEFAULT_FONT_FAMILY,
  DEFAULT_LANGUAGE,
  DEFAULT_SETTINGS,
  DEFAULT_THEME,
  EXPORT_SIZES_HASH,
  FONTS,
  FONTS_HASH,
  LANGUAGES,
  LANGUAGE_MIME_HASH,
  LANGUAGE_MODE_HASH,
  LANGUAGE_NAME_HASH,
} from '../src/modules/editor/config'
import {
  applyBackgroundStyle,
  getBackgroundImageSource,
  getSquareExportBackgroundStyle,
  isStaticGradientActive,
} from '../src/modules/editor/background'
import { getDroppedFileLanguage, resolveLanguageMode } from '../src/modules/editor/language'
import { getRouteState } from '../src/modules/editor/state/routing'
import {
  fileToDataURL,
  getBackgroundImageAsset,
  formatCode,
  getSettings,
  getWatermarkFontAsset,
  omit,
  unescapeHtml,
} from '../src/shared/utils'

const languageIcon = <AimOutlined />
const getConfig = omit(['code', 'titleBar'])
const backgroundPhotographerCredit = /\n\n\/\/ (?:Photo by.+?on .+|图片来源：.+)/
const EXPORT_EXTENSIONS = {
  blob: 'png',
  jpg: 'jpg',
  jpeg: 'jpg',
  png: 'png',
  svg: 'svg',
  webp: 'webp',
}
const EXPORT_QUALITY = 0.92
const EXPORT_STAGE_STYLES = {
  position: 'fixed',
  left: '-10000px',
  top: '0',
  opacity: '0',
  pointerEvents: 'none',
  zIndex: '-1',
  contain: 'layout style paint',
}

function formatBackgroundPhotographerCredit(photographer) {
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

function hasConfiguredBackgroundImage(config = {}) {
  return Boolean(
    config.backgroundImageSelection || config.backgroundImage || config.backgroundImageSource,
  )
}

function clearImageBackgroundFields(config) {
  return {
    ...config,
    backgroundImage: null,
    backgroundImageSource: null,
    backgroundImageSelection: null,
  }
}

function clearGradientBackgroundFields(config) {
  return {
    ...config,
    backgroundGradient: null,
    backgroundGradientBlendMode: null,
  }
}

function normalizeRestoredBackgroundState(config = {}) {
  if (!config.backgroundGradient) {
    config = { ...config, backgroundGradientBlendMode: null }
  }

  if (config.backgroundMode === 'image') {
    if (hasConfiguredBackgroundImage(config)) {
      return clearGradientBackgroundFields(config)
    }

    config = clearImageBackgroundFields(config)
    return { ...config, backgroundMode: 'color' }
  }

  return clearImageBackgroundFields(config)
}

function resolveBackgroundImageValue(source) {
  return resolveBuiltInBackgroundImageSource(source) || source || null
}

function getStoredBackgroundImageValue(source, image) {
  const resolvedBuiltInBackgroundImage = resolveBuiltInBackgroundImageSource(source)

  if (resolvedBuiltInBackgroundImage) {
    return resolvedBuiltInBackgroundImage
  }

  return image || source || null
}

function resolveFormatLanguage(code, language) {
  return resolveLanguageMode(code, language).mode
}

function waitForAnimationFrame() {
  return new Promise(resolve => {
    if (typeof window === 'undefined' || typeof window.requestAnimationFrame !== 'function') {
      resolve()
      return
    }

    window.requestAnimationFrame(() => resolve())
  })
}

function waitForImageReady(image) {
  if (!image) {
    return Promise.resolve()
  }

  const finalize = () => waitForAnimationFrame()

  if (image.complete && image.naturalWidth > 0) {
    if (typeof image.decode === 'function') {
      return image
        .decode()
        .catch(() => {})
        .then(finalize)
    }

    return finalize()
  }

  return new Promise(resolve => {
    const handleDone = () => {
      image.onload = null
      image.onerror = null
      void finalize().then(resolve)
    }

    image.onload = handleDone
    image.onerror = handleDone
  })
}

class Editor extends React.Component {
  state = {
    ...DEFAULT_SETTINGS,
    loading: true,
  }

  pandaNode = React.createRef()

  componentWillUnmount() {
    this.onUpdate.cancel()
  }

  componentDidMount() {
    this._initializeState().catch(error => {
      console.error('[Editor] componentDidMount error:', error)
      this.setState({ loading: false })
    })
  }

  async _initializeState() {
    const { queryState } = getRouteState(this.props.router)
    const storedSettings = getSettings(localStorage) || {}
    const storedBackgroundImageAsset = getBackgroundImageAsset(localStorage)
    const storedWatermarkFontUrl = getWatermarkFontAsset(localStorage)

    const newState = {
      ...storedSettings,
      ...queryState,
      loading: false,
    }
    const hasQueryBackgroundImageSource = queryState.backgroundImageSource != null
    const hasRequestedBackgroundImageSource = newState.backgroundImageSource != null
    const canRestoreMatchingBackgroundAsset =
      storedBackgroundImageAsset &&
      (hasQueryBackgroundImageSource || newState.backgroundMode === 'image') &&
      hasRequestedBackgroundImageSource &&
      storedBackgroundImageAsset.source === newState.backgroundImageSource
    const canRestoreStoredBackgroundAsset =
      storedBackgroundImageAsset &&
      !hasQueryBackgroundImageSource &&
      newState.backgroundMode === 'image' &&
      (newState.backgroundImageSource == null ||
        storedBackgroundImageAsset.source === newState.backgroundImageSource)

    if (canRestoreMatchingBackgroundAsset) {
      newState.backgroundMode = 'image'
      newState.backgroundImage = getStoredBackgroundImageValue(
        storedBackgroundImageAsset.source,
        storedBackgroundImageAsset.image,
      )
      newState.backgroundImageSelection = storedBackgroundImageAsset.selection || null
    } else if (canRestoreStoredBackgroundAsset) {
      newState.backgroundMode = 'image'
      newState.backgroundImageSource = storedBackgroundImageAsset.source || null
      newState.backgroundImage = getStoredBackgroundImageValue(
        storedBackgroundImageAsset.source,
        storedBackgroundImageAsset.image,
      )
      newState.backgroundImageSelection = storedBackgroundImageAsset.selection || null
    } else if (
      newState.backgroundImageSource &&
      (hasQueryBackgroundImageSource || newState.backgroundMode === 'image')
    ) {
      newState.backgroundMode = 'image'
      newState.backgroundImage = resolveBackgroundImageValue(newState.backgroundImageSource)
      newState.backgroundImageSelection = null
    }

    normalizeRestoredBackgroundState(newState)

    if (newState.language) {
      newState.language = unescapeHtml(newState.language)
    }

    if (newState.fontFamily && !FONTS.find(({ id }) => id === newState.fontFamily)) {
      newState.fontFamily = DEFAULT_SETTINGS.fontFamily
    }

    const isBuiltInWatermarkFont = Boolean(FONTS_HASH[newState.watermarkFontFamily])
    const shouldRestoreStoredWatermarkFont =
      storedWatermarkFontUrl &&
      !isBuiltInWatermarkFont &&
      newState.watermarkFontFamily &&
      newState.watermarkFontFamily === storedSettings.watermarkFontFamily

    if (shouldRestoreStoredWatermarkFont) {
      newState.watermarkFontUrl = storedWatermarkFontUrl
    }

    if (newState.watermarkFontFamily && !FONTS_HASH[newState.watermarkFontFamily]) {
      if (!newState.watermarkFontUrl) {
        newState.watermarkFontFamily = DEFAULT_SETTINGS.watermarkFontFamily
      }
    }

    if (newState.watermarkFontUrl && !newState.watermarkFontFamily) {
      newState.watermarkFontFamily = DEFAULT_FONT_FAMILY
    }

    this.setState(newState)
  }

  getTheme = () => this.props.themes.find(theme => theme.id === this.state.theme) || DEFAULT_THEME

  onUpdate = debounce(updates => this.props.onUpdate(updates), 750, {
    trailing: true,
    leading: true,
  })

  sync = () => this.onUpdate(this.state)

  updateState = updates => this.setState(updates, this.sync)

  updateCode = code => this.updateState({ code })
  updateTitleBar = titleBar => this.updateState({ titleBar })
  updateWidth = width => this.setState({ widthAdjustment: false, width })

  updateWidthConfirm = width => {
    if (typeof width === 'number') {
      this.setState({ widthAdjustment: false, width }, this.sync)
      return
    }

    this.sync()
  }

  getExportExtension = format => EXPORT_EXTENSIONS[format] || 'png'

  getSnapdomType = format => {
    if (format === 'blob') {
      return 'png'
    }

    if (format === 'jpg') {
      return 'jpeg'
    }

    return format
  }

  getExportBackgroundColor = ({ format, squared }) => {
    const hasStaticGradient = squared && isStaticGradientActive(this.state)

    if (format === 'jpg' || format === 'jpeg') {
      return hasStaticGradient ? null : squared ? this.state.backgroundColor : '#ffffff'
    }

    if (format === 'webp') {
      return hasStaticGradient ? null : squared ? this.state.backgroundColor : null
    }

    return null
  }

  getLocalFonts = () => {
    if (!this.state.fontUrl || !this.state.fontFamily) {
      return []
    }

    return [
      {
        family: this.state.fontFamily,
        src: this.state.fontUrl,
      },
    ]
  }

  shouldIncludeInExport = element => {
    if (!element || !element.className) {
      return true
    }

    const className = String(element.className)

    return !className.includes('eliminateOnRender') && !className.includes('CodeMirror-cursors')
  }

  prepareExportBackgroundImage = async clone => {
    const backgroundImage = getBackgroundImageSource(this.state)

    if (!backgroundImage) {
      return
    }

    const backgroundLayer = clone.querySelector('.panda-container-bg-layer')

    if (!backgroundLayer) {
      return
    }

    const image = document.createElement('img')

    backgroundLayer.style.background = 'transparent'
    backgroundLayer.style.backgroundImage = 'none'
    backgroundLayer.style.backgroundSize = ''
    backgroundLayer.style.backgroundRepeat = ''
    backgroundLayer.style.backgroundBlendMode = ''

    image.alt = ''
    image.decoding = 'sync'
    image.loading = 'eager'
    image.setAttribute('aria-hidden', 'true')
    image.src = backgroundImage
    Object.assign(image.style, {
      position: 'absolute',
      inset: '0',
      width: '100%',
      height: '100%',
      display: 'block',
      objectFit: 'cover',
      objectPosition: 'left top',
      pointerEvents: 'none',
      userSelect: 'none',
    })

    backgroundLayer.replaceChildren(image)
    await waitForImageReady(image)
  }

  createExportTarget = ({ squared }) => {
    const sourceNode = this.pandaNode.current
    const clone = sourceNode.cloneNode(true)
    const stage = document.createElement('div')

    Object.assign(stage.style, EXPORT_STAGE_STYLES)

    clone.removeAttribute('id')
    clone.querySelectorAll('[id]').forEach(element => element.removeAttribute('id'))
    clone.style.width = `${sourceNode.offsetWidth}px`
    clone.style.height = `${squared ? sourceNode.offsetWidth : sourceNode.offsetHeight}px`
    if (squared) {
      applyBackgroundStyle(clone, getSquareExportBackgroundStyle(this.state))
    } else {
      clone.style.background = 'none'
      clone.style.backgroundImage = ''
      clone.style.backgroundSize = ''
      clone.style.backgroundRepeat = ''
      clone.style.backgroundBlendMode = ''
    }
    clone.style.alignItems = 'start'
    clone.style.justifyContent = 'start'

    stage.appendChild(clone)
    document.body.appendChild(stage)

    return {
      node: clone,
      cleanup: () => stage.remove(),
    }
  }

  capturePandaImage = async ({
    format,
    squared,
    exportSize = (EXPORT_SIZES_HASH[this.state.exportSize] || DEFAULT_EXPORT_SIZE).value,
  }) => {
    const exportTarget = this.createExportTarget({ squared })
    const backgroundColor = this.getExportBackgroundColor({ format, squared })

    try {
      if (this.state.backgroundMode === 'image') {
        await this.prepareExportBackgroundImage(exportTarget.node)
      }

      return await snapdom(exportTarget.node, {
        scale: exportSize,
        dpr: 1,
        fast: true,
        cache: 'soft',
        type: this.getSnapdomType(format),
        quality:
          format === 'jpg' || format === 'jpeg' || format === 'webp' ? EXPORT_QUALITY : undefined,
        backgroundColor,
        embedFonts: true,
        localFonts: this.getLocalFonts(),
        filter: this.shouldIncludeInExport,
        filterMode: 'remove',
      })
    } finally {
      exportTarget.cleanup()
    }
  }

  getPandaImage = async (
    {
      format,
      squared = this.state.squaredImage,
      exportSize = (EXPORT_SIZES_HASH[this.state.exportSize] || DEFAULT_EXPORT_SIZE).value,
    } = { format: 'png' },
  ) => {
    const capture = await this.capturePandaImage({
      format,
      squared,
      exportSize,
    })
    const snapdomType = this.getSnapdomType(format)
    const backgroundColor = this.getExportBackgroundColor({ format, squared })
    const exportOptions = {
      type: snapdomType,
      quality: snapdomType === 'jpeg' || snapdomType === 'webp' ? EXPORT_QUALITY : undefined,
      backgroundColor,
    }

    if (format !== 'png') {
      return capture.toBlob(exportOptions)
    }

    return capture.toBlob(exportOptions).then(fileToDataURL)
  }

  getExportUrl = exportResult => {
    if (typeof exportResult === 'string') {
      return {
        url: exportResult,
        revoke: null,
      }
    }

    const url = window.URL.createObjectURL(exportResult)

    return {
      url,
      revoke: () => window.URL.revokeObjectURL(url),
    }
  }

  exportImage = (format = 'blob', options = {}) => {
    const link = document.createElement('a')
    const prefix = options.filename || this.state.name || 'panda'

    return this.getPandaImage({ format, exportSize: options.exportSize }).then(exportResult => {
      const { url, revoke } = this.getExportUrl(exportResult)

      if (!options.open) {
        link.download = `${prefix}.${this.getExportExtension(format)}`
      }

      if (
        window.navigator.userAgent.indexOf('Firefox') !== -1 &&
        window.navigator.userAgent.indexOf('Chrome') === -1
      ) {
        link.target = '_blank'
      }

      link.href = url
      document.body.appendChild(link)
      link.click()
      link.remove()
      if (revoke) {
        window.setTimeout(() => revoke(), 3000)
      }
    })
  }

  copyClipboardImage = async ({ format, exportSize = 2 }) => {
    if (!navigator.clipboard?.write || typeof window.ClipboardItem === 'undefined') {
      throw new Error('CLIPBOARD_API_NOT_SUPPORTED')
    }

    const blob = await this.getPandaImage({ format, exportSize })

    await navigator.clipboard.write([
      new window.ClipboardItem({
        [blob.type]: blob,
      }),
    ])

    return {
      exportSize,
      mimeType: blob.type,
    }
  }

  copyImage = async () => {
    const requestedMimeType = 'image/webp'
    const exportSize = 2
    const clipboardItemSupports =
      typeof window.ClipboardItem?.supports === 'function'
        ? window.ClipboardItem.supports.bind(window.ClipboardItem)
        : null

    if (clipboardItemSupports && !clipboardItemSupports(requestedMimeType)) {
      const fallbackResult = await this.copyClipboardImage({
        format: 'blob',
        exportSize,
      })

      return {
        ...fallbackResult,
        requestedMimeType,
        fallbackUsed: true,
      }
    }

    try {
      const webpResult = await this.copyClipboardImage({
        format: 'webp',
        exportSize,
      })

      return {
        ...webpResult,
        requestedMimeType,
        fallbackUsed: false,
      }
    } catch {
      const fallbackResult = await this.copyClipboardImage({
        format: 'blob',
        exportSize,
      })

      return {
        ...fallbackResult,
        requestedMimeType,
        fallbackUsed: true,
      }
    }
  }

  updateSetting = (key, value) => {
    this.updateState({ [key]: value })

    if (Object.prototype.hasOwnProperty.call(DEFAULT_SETTINGS, key)) {
      this.updateState({ preset: null })
    }
  }

  setWatermarkFontAsset = nextValue => {
    this.props.onWatermarkFontAssetChange?.(nextValue || null)
  }

  updateWatermarkFontFamily = fontFamily => {
    const isBuiltInFont = Boolean(FONTS_HASH[fontFamily])
    const nextState = {
      watermarkFontFamily: fontFamily,
      preset: null,
    }

    if (isBuiltInFont) {
      nextState.watermarkFontUrl = null
    }

    this.updateState(nextState)

    if (isBuiltInFont) {
      this.setWatermarkFontAsset(null)
    }
  }

  uploadWatermarkFont = (fontFamily, watermarkFontUrl) => {
    const normalizedFontFamily = FONTS_HASH[fontFamily] ? `${fontFamily} (Uploaded)` : fontFamily

    this.updateState({
      watermarkFontFamily: normalizedFontFamily,
      watermarkFontUrl,
      preset: null,
    })
    this.setWatermarkFontAsset(watermarkFontUrl)
  }

  resetDefaultSettings = () => {
    this.updateState(DEFAULT_SETTINGS)
    this.setWatermarkFontAsset(null)
    this.props.onReset()
  }

  onDrop = ([file]) => {
    const isImageFile =
      file.type.split('/')[0] === 'image' ||
      (typeof file.content === 'string' && file.content.startsWith('data:image/'))

    if (isImageFile) {
      this.updateState({
        backgroundImage: file.content,
        backgroundImageSource: null,
        backgroundImageSelection: null,
        backgroundGradient: null,
        backgroundGradientBlendMode: null,
        backgroundMode: 'image',
        preset: null,
      })
      return
    }

    this.updateState({
      code: file.content,
      language: getDroppedFileLanguage(file),
    })
  }

  updateLanguage = language => {
    if (language) {
      this.updateSetting('language', language.mime || language.mode)
    }
  }

  updateBackground = ({ photographer, ...changes } = {}) => {
    const nextBackgroundChanges =
      changes.backgroundMode === 'image' &&
      (changes.backgroundImage != null ||
        changes.backgroundImageSource != null ||
        changes.backgroundImageSelection != null)
        ? {
            ...changes,
            backgroundGradient: null,
            backgroundGradientBlendMode: null,
          }
        : changes

    if (photographer) {
      const backgroundCredit = formatBackgroundPhotographerCredit(photographer)

      this.updateState(({ code = DEFAULT_CODE }) => ({
        ...nextBackgroundChanges,
        code:
          code.replace(backgroundPhotographerCredit, '') + `\n\n// 图片来源：${backgroundCredit}`,
        preset: null,
      }))
      return
    }

    this.updateState({ ...nextBackgroundChanges, preset: null })
  }

  updateTheme = theme => this.updateState({ theme, highlights: null })

  updateHighlights = updates =>
    this.setState(({ highlights = {} }) => ({
      highlights: {
        ...highlights,
        ...updates,
      },
    }))

  createTheme = theme => {
    this.props.updateThemes(themes => [theme, ...themes])
    this.updateTheme(theme.id)
  }

  removeTheme = id => {
    this.props.updateThemes(themes => themes.filter(theme => theme.id !== id))

    if (this.state.theme === id) {
      this.updateTheme(DEFAULT_THEME.id)
    }
  }

  applyPreset = ({ id: preset, ...settings }) => {
    this.updateState({ preset, ...settings })
    this.setWatermarkFontAsset(settings.watermarkFontUrl || null)
  }

  format = async () => {
    const resolvedLanguage = resolveFormatLanguage(
      this.state.code,
      this.state.language && this.state.language.toLowerCase(),
    )

    try {
      const formattedCode = await formatCode(this.state.code, resolvedLanguage)
      this.updateCode(formattedCode)
    } catch {
      this.props.messageApi?.warning('当前语言或代码内容暂时无法美化')
    }
  }

  render() {
    const {
      backgroundColor,
      backgroundGradient,
      backgroundGradientBlendMode,
      backgroundImage,
      backgroundImageSource,
      backgroundImageSelection,
      backgroundMode,
      code,
      exportSize,
      highlights,
      language,
      titleBar,
    } = this.state

    const config = getConfig(this.state)
    const theme = this.getTheme()

    return (
      <div className="editor">
        <Toolbar
          leading={
            <>
              <Themes
                theme={theme}
                highlights={highlights}
                update={this.updateTheme}
                updateHighlights={this.updateHighlights}
                remove={this.removeTheme}
                create={this.createTheme}
                themes={this.props.themes}
              />
              <Dropdown
                aria-tooltip="语言"
                icon={languageIcon}
                selected={
                  LANGUAGE_NAME_HASH[language] ||
                  LANGUAGE_MIME_HASH[language] ||
                  LANGUAGE_MODE_HASH[language] ||
                  LANGUAGE_MODE_HASH[DEFAULT_LANGUAGE]
                }
                list={LANGUAGES}
                onChange={this.updateLanguage}
              />
            </>
          }
          tools={
            <>
              <BackgroundSelect
                onChange={this.updateBackground}
                updateHighlights={this.updateHighlights}
                mode={backgroundMode}
                color={backgroundColor}
                gradient={backgroundGradient}
                gradientBlendMode={backgroundGradientBlendMode}
                image={backgroundImage}
                imageSource={backgroundImageSource}
                imageSelection={backgroundImageSelection}
                pandaRef={this.pandaNode.current}
              />
              <Settings
                {...config}
                onChange={this.updateSetting}
                onWatermarkFontChange={this.updateWatermarkFontFamily}
                onWatermarkFontUpload={this.uploadWatermarkFont}
                resetDefaultSettings={this.resetDefaultSettings}
                format={this.format}
                applyPreset={this.applyPreset}
                getPandaImage={this.getPandaImage}
              />
              <CopyMenu copyImage={this.copyImage} />
            </>
          }
          portalSlot={<div id="style-editor-button" />}
          exportActions={
            <ExportMenu
              onChange={this.updateSetting}
              exportImage={this.exportImage}
              exportSize={exportSize}
            />
          }
        />

        <FileDropzone accept="image/*, text/*, application/*" onDrop={this.onDrop}>
          {({ canDrop }) => (
            <Overlay isOver={canDrop} title="拖放文件到这里即可导入">
              <Panda
                ref={this.pandaNode}
                config={this.state}
                onChange={this.updateCode}
                updateWidth={this.updateWidth}
                updateWidthConfirm={this.updateWidthConfirm}
                loading={this.state.loading}
                theme={theme}
                titleBar={titleBar}
                onTitleBarChange={this.updateTitleBar}
              >
                {code != null ? code : DEFAULT_CODE}
              </Panda>
            </Overlay>
          )}
        </FileDropzone>
        <FontFace {...config} />
      </div>
    )
  }
}

Editor.defaultProps = {
  onUpdate: () => {},
  onWatermarkFontAssetChange: () => {},
  onReset: () => {},
}

function EditorWithApp(props) {
  const { message } = AntdApp.useApp()

  return <Editor {...props} messageApi={message} />
}

export default EditorWithApp
