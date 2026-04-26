import React from 'react'
import debounce from 'lodash.debounce'
import { snapdom } from '@zumer/snapdom'
import hljs from 'highlight.js/lib/common'
import { App as AntdApp } from 'antd'

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
import SvgAsset from './svg/SvgAsset'
import LanguageIconAsset from './svg/assets/language.svg?react'
import {
  DEFAULT_CODE,
  DEFAULT_EXPORT_SIZE,
  DEFAULT_LANGUAGE,
  DEFAULT_SETTINGS,
  DEFAULT_THEME,
  EXPORT_SIZES_HASH,
  FONTS,
  LANGUAGES,
  LANGUAGE_MIME_HASH,
  LANGUAGE_MODE_HASH,
  LANGUAGE_NAME_HASH,
} from '../src/modules/editor/config'
import { getRouteState } from '../src/modules/editor/state/routing'
import { fileToDataURL, formatCode, getSettings, omit, unescapeHtml } from '../src/shared/utils'

const languageIcon = <SvgAsset component={LanguageIconAsset} />
const getConfig = omit(['code', 'titleBar'])
const backgroundPhotographerCredit = /\n\n\/\/ (?:Photo by.+?on .+|图片来源：.+?· .+)/
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

function searchLanguage(language) {
  return LANGUAGE_NAME_HASH[language] || LANGUAGE_MIME_HASH[language] || LANGUAGE_MODE_HASH[language]
}

function resolveFormatLanguage(code, language) {
  if (language === 'auto') {
    const detectedLanguage = hljs.highlightAuto(code || '').language
    const matchedLanguage = searchLanguage(detectedLanguage)

    if (matchedLanguage) {
      return matchedLanguage.mime || matchedLanguage.mode
    }

    if (detectedLanguage) {
      return detectedLanguage
    }
  }

  const matchedLanguage = searchLanguage(language)

  if (matchedLanguage) {
    return matchedLanguage.mime || matchedLanguage.mode
  }

  return language
}

class Editor extends React.Component {
  state = {
    ...DEFAULT_SETTINGS,
    loading: true,
  }

  pandaNode = React.createRef()

  async componentDidMount() {
    const { queryState } = getRouteState(this.props.router)

    const newState = {
      ...getSettings(localStorage),
      ...queryState,
      loading: false,
    }

    if (newState.language) {
      newState.language = unescapeHtml(newState.language)
    }

    if (newState.fontFamily && !FONTS.find(({ id }) => id === newState.fontFamily)) {
      newState.fontFamily = DEFAULT_SETTINGS.fontFamily
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
    if (format === 'jpg' || format === 'jpeg') {
      return squared ? this.state.backgroundColor : '#ffffff'
    }

    if (format === 'webp') {
      return squared ? this.state.backgroundColor : null
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

  createExportTarget = ({ squared }) => {
    const sourceNode = this.pandaNode.current
    const clone = sourceNode.cloneNode(true)
    const stage = document.createElement('div')

    Object.assign(stage.style, EXPORT_STAGE_STYLES)

    clone.removeAttribute('id')
    clone.querySelectorAll('[id]').forEach(element => element.removeAttribute('id'))
    clone.style.width = `${sourceNode.offsetWidth}px`
    clone.style.height = `${squared ? sourceNode.offsetWidth : sourceNode.offsetHeight}px`
    clone.style.background = squared ? this.state.backgroundColor : 'none'
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
    } = { format: 'png' }
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
      quality:
        snapdomType === 'jpeg' || snapdomType === 'webp' ? EXPORT_QUALITY : undefined,
      backgroundColor,
    }

    if (format === 'svg') {
      return capture.toBlob(exportOptions)
    }

    if (format === 'blob') {
      return capture.toBlob(exportOptions)
    }

    if (format === 'jpg' || format === 'jpeg' || format === 'webp') {
      return capture.toBlob(exportOptions)
    }

    return capture.toBlob(exportOptions).then(fileToDataURL)
  }

  exportImage = (format = 'blob', options = {}) => {
    const link = document.createElement('a')
    const prefix = options.filename || this.state.name || 'panda'

    return this.getPandaImage({ format })
      .then(blob => window.URL.createObjectURL(blob))
      .then(url => {
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
        window.setTimeout(() => window.URL.revokeObjectURL(url), 30000)
      })
  }

  copyImage = () =>
    this.getPandaImage({ format: 'blob' }).then(blob =>
      navigator.clipboard.write([
        new window.ClipboardItem({
          [blob.type]: blob,
        }),
      ])
    )

  updateSetting = (key, value) => {
    this.updateState({ [key]: value })

    if (Object.prototype.hasOwnProperty.call(DEFAULT_SETTINGS, key)) {
      this.updateState({ preset: null })
    }
  }

  resetDefaultSettings = () => {
    this.updateState(DEFAULT_SETTINGS)
    this.props.onReset()
  }

  onDrop = ([file]) => {
    if (file.type.split('/')[0] === 'image') {
      this.updateState({
        backgroundImage: file.content,
        backgroundImageSelection: null,
        backgroundMode: 'image',
        preset: null,
      })
      return
    }

    this.updateState({ code: file.content, language: 'auto' })
  }

  updateLanguage = language => {
    if (language) {
      this.updateSetting('language', language.mime || language.mode)
    }
  }

  updateBackground = ({ photographer, ...changes } = {}) => {
    if (photographer) {
      const sourceName = photographer.sourceName || 'Unsplash'

      this.updateState(({ code = DEFAULT_CODE }) => ({
        ...changes,
        code:
          code.replace(backgroundPhotographerCredit, '') +
          `\n\n// 图片来源：${photographer.name} · ${sourceName}`,
        preset: null,
      }))
      return
    }

    this.updateState({ ...changes, preset: null })
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

  applyPreset = ({ id: preset, ...settings }) => this.updateState({ preset, ...settings })

  format = async () => {
    const resolvedLanguage = resolveFormatLanguage(
      this.state.code,
      this.state.language && this.state.language.toLowerCase()
    )

    try {
      const formattedCode = await formatCode(this.state.code, resolvedLanguage)
      this.updateCode(formattedCode)
    } catch (error) {
      this.props.messageApi?.warning('当前语言或代码内容暂时无法美化')
    }
  }

  render() {
    const {
      backgroundColor,
      backgroundImage,
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
                title="语言"
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
                image={backgroundImage}
                pandaRef={this.pandaNode.current}
              />
              <Settings
                {...config}
                onChange={this.updateSetting}
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
  onReset: () => {},
}

function EditorWithApp(props) {
  const { message } = AntdApp.useApp()

  return <Editor {...props} messageApi={message} />
}

export default EditorWithApp
