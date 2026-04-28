import React from 'react'
import ReactDOM from 'react-dom'
import hljs from 'highlight.js/lib/common'
import { Spin } from 'antd'

import WindowControls from './WindowControls'
import WidthHandler from './WidthHandler'

import {
  COLORS,
  LANGUAGE_MODE_HASH,
  LANGUAGE_NAME_HASH,
  LANGUAGE_MIME_HASH,
  DEFAULT_SETTINGS,
  THEMES_HASH,
} from '../src/modules/editor/config'
import {
  ensureCodeMirrorMode,
  isCodeMirrorModeLoaded,
} from '../src/modules/editor/codemirror/loaders'
import SvgAsset from './svg/SvgAsset'

const SelectionEditor = React.lazy(() => import('./SelectionEditor'))
const WatermarkAsset = React.lazy(() => import('./svg/assets/watermark.svg?react'))
const LANGUAGE_MASK_DELAY = 100

function searchLanguage(l) {
  return LANGUAGE_NAME_HASH[l] || LANGUAGE_MODE_HASH[l] || LANGUAGE_MIME_HASH[l]
}

function resolveRequestedLanguageMode(code, language) {
  if (language === 'auto') {
    const detectedLanguage = hljs.highlightAuto(code || '').language
    const languageMode = searchLanguage(detectedLanguage)

    if (languageMode) {
      return languageMode.mime || languageMode.mode
    }
  }

  const languageMode = searchLanguage(language)

  if (languageMode) {
    return languageMode.mime || languageMode.mode
  }

  return language
}

function getResolvedLanguageModeFromProps(props) {
  const config = { ...DEFAULT_SETTINGS, ...props.config }
  const requestedMode = resolveRequestedLanguageMode(
    props.children,
    config.language && config.language.toLowerCase(),
  )
  const languageMode = searchLanguage(requestedMode)

  return {
    mode: languageMode ? languageMode.mime || languageMode.mode : requestedMode || 'plaintext',
    modeKey: languageMode ? languageMode.mode : requestedMode || 'text',
  }
}

function noop() {}
function getUnderline(underline) {
  switch (underline) {
    case 1:
      return 'underline'
    case 2:
      /**
       * Chrome will only round to the nearest wave, causing visual inconsistencies
       * https://stackoverflow.com/questions/57559588/how-to-make-the-wavy-underline-extend-cover-all-the-characters-in-chrome
       */
      return `${COLORS.RED} wavy underline; text-decoration-skip-ink: none`
  }
  return 'initial'
}

class Panda extends React.PureComponent {
  constructor(props) {
    super(props)

    const initialResolvedMode = getResolvedLanguageModeFromProps(props)
    const initialModeState = isCodeMirrorModeLoaded(initialResolvedMode.modeKey)
      ? initialResolvedMode
      : { mode: 'text/plain', modeKey: 'text' }

    this.state = {
      CodeMirror: null,
      editorValue: props.children,
      activeLanguageMode: initialModeState.mode,
      activeModeKey: initialModeState.modeKey,
      isLanguageLoading: false,
      showLanguageMask: false,
    }
  }

  static defaultProps = {
    onChange: noop,
    onGutterClick: noop,
  }

  async componentDidMount() {
    this.codeMirrorReady = true
    const resolvedMode = this.getResolvedLanguageMode()

    const [{ UnControlled }] = await Promise.all([
      import('react-codemirror2'),
      this.ensureCurrentModeLoaded(resolvedMode, { showMask: false }),
    ])

    if (this.codeMirrorReady) {
      this.setState({ CodeMirror: UnControlled })
    }
  }

  componentDidUpdate(prevProps, prevState) {
    const didCodeChange = prevProps.children !== this.props.children
    const didLanguageChange = prevProps.config?.language !== this.props.config?.language

    if (didCodeChange || didLanguageChange) {
      const prevResolvedMode = this.getResolvedLanguageMode(prevProps)
      const nextResolvedMode = this.getResolvedLanguageMode()

      if (
        prevResolvedMode.modeKey !== nextResolvedMode.modeKey ||
        prevResolvedMode.mode !== nextResolvedMode.mode
      ) {
        void this.ensureCurrentModeLoaded(nextResolvedMode, { showMask: didLanguageChange })
      }
    }

    if (prevState.activeLanguageMode !== this.state.activeLanguageMode) {
      const editor = this.props.editorRef?.current?.editor

      if (editor && editor.getOption('mode') !== this.state.activeLanguageMode) {
        editor.setOption('mode', this.state.activeLanguageMode)
      }
    }

    if (didCodeChange) {
      const nextValue = this.props.children ?? ''
      const editor = this.props.editorRef?.current?.editor
      const currentEditorValue = editor ? editor.getValue() : null
      const changeCameFromEditor =
        nextValue === this.lastEmittedValue && (!editor || currentEditorValue === nextValue)

      if (!changeCameFromEditor) {
        if (editor && currentEditorValue !== nextValue) {
          this.syncEditorValue(editor, nextValue)
        }

        if (nextValue !== this.state.editorValue) {
          this.setState({ editorValue: nextValue })
        }
      }
    }
  }

  componentWillUnmount() {
    this.codeMirrorReady = false
    this.clearLanguageMaskTimer()
  }

  getResolvedLanguageMode = (props = this.props) => {
    return getResolvedLanguageModeFromProps(props)
  }

  clearLanguageMaskTimer = () => {
    if (this.languageMaskTimer) {
      window.clearTimeout(this.languageMaskTimer)
      this.languageMaskTimer = null
    }
  }

  startLanguageMask = requestId => {
    this.clearLanguageMaskTimer()
    this.setState(currentState => {
      if (currentState.isLanguageLoading && !currentState.showLanguageMask) {
        return null
      }

      return {
        isLanguageLoading: true,
        showLanguageMask: false,
      }
    })

    this.languageMaskTimer = window.setTimeout(() => {
      if (!this.codeMirrorReady || requestId !== this.languageLoadRequestId) {
        return
      }

      this.setState(currentState => {
        if (!currentState.isLanguageLoading || currentState.showLanguageMask) {
          return null
        }

        return { showLanguageMask: true }
      })
    }, LANGUAGE_MASK_DELAY)
  }

  finishLanguageLoad = (requestId, nextResolvedMode, shouldApplyResolvedMode = true) => {
    if (!this.codeMirrorReady || requestId !== this.languageLoadRequestId) {
      return
    }

    this.clearLanguageMaskTimer()
    this.setState(currentState => {
      const isModeUnchanged =
        currentState.activeModeKey === nextResolvedMode.modeKey &&
        currentState.activeLanguageMode === nextResolvedMode.mode

      if (
        isModeUnchanged &&
        !currentState.isLanguageLoading &&
        !currentState.showLanguageMask &&
        shouldApplyResolvedMode
      ) {
        return null
      }

      if (
        !currentState.isLanguageLoading &&
        !currentState.showLanguageMask &&
        !shouldApplyResolvedMode
      ) {
        return null
      }

      return {
        activeLanguageMode: shouldApplyResolvedMode
          ? nextResolvedMode.mode
          : currentState.activeLanguageMode,
        activeModeKey: shouldApplyResolvedMode
          ? nextResolvedMode.modeKey
          : currentState.activeModeKey,
        isLanguageLoading: false,
        showLanguageMask: false,
      }
    })
  }

  ensureCurrentModeLoaded = async (
    nextResolvedMode = this.getResolvedLanguageMode(),
    { showMask = true } = {},
  ) => {
    const requestId = (this.languageLoadRequestId || 0) + 1
    const isNextModeUnchanged =
      nextResolvedMode.modeKey === this.state.activeModeKey &&
      nextResolvedMode.mode === this.state.activeLanguageMode
    const shouldShowMask =
      showMask && !isNextModeUnchanged && !isCodeMirrorModeLoaded(nextResolvedMode.modeKey)

    this.languageLoadRequestId = requestId

    if (shouldShowMask) {
      this.startLanguageMask(requestId)
    }

    let didResolveMode = false

    try {
      await ensureCodeMirrorMode(nextResolvedMode.modeKey)
      didResolveMode = true
    } finally {
      this.finishLanguageLoad(requestId, nextResolvedMode, didResolveMode)
    }
  }

  syncEditorValue = (editor, nextValue) => {
    const doc = editor.getDoc()
    const cursor = doc.getCursor()
    const scrollInfo = editor.getScrollInfo()

    this.isApplyingExternalValue = true

    try {
      editor.operation(() => {
        editor.setValue(nextValue)

        const lastLine = doc.lastLine()
        const safeLine = Math.min(cursor.line, lastLine)
        const safeCh = Math.min(cursor.ch, doc.getLine(safeLine).length)

        doc.setCursor({ line: safeLine, ch: safeCh }, null, { scroll: false })
        editor.scrollTo(scrollInfo.left, scrollInfo.top)
      })
    } finally {
      this.isApplyingExternalValue = false
    }
  }

  onChange = (editor, meta, code) => {
    if (!this.props.readOnly && !this.isApplyingExternalValue) {
      this.lastEmittedValue = code
      this.props.onChange(code)
    }
  }

  onSelection = (ed, data) => {
    if (this.props.readOnly) {
      return
    }

    const selection = data.ranges[0]
    if (
      selection.head.line === selection.anchor.line &&
      selection.head.ch === selection.anchor.ch
    ) {
      return (this.currentSelection = null)
    }
    if (selection.head.line + selection.head.ch > selection.anchor.line + selection.anchor.ch) {
      this.currentSelection = {
        from: selection.anchor,
        to: selection.head,
      }
    } else {
      this.currentSelection = {
        from: selection.head,
        to: selection.anchor,
      }
    }
  }

  onMouseUp = () => {
    if (this.currentSelection) {
      this.setState({ selectionAt: this.currentSelection }, () => {
        this.currentSelection = null
      })
    } else {
      this.setState({ selectionAt: null })
    }
  }

  onSelectionChange = changes => {
    if (this.state.selectionAt) {
      const css = [
        changes.bold != null && `font-weight: ${changes.bold ? 'bold' : 'initial'}`,
        changes.italics != null && `font-style: ${changes.italics ? 'italic' : 'initial'}`,
        changes.underline != null && `text-decoration: ${getUnderline(changes.underline)}`,
        changes.color != null && `color: ${changes.color} !important`,
      ]
        .filter(Boolean)
        .join('; ')

      if (css) {
        this.props.editorRef.current.editor.doc.markText(
          this.state.selectionAt.from,
          this.state.selectionAt.to,
          { css },
        )
      }
    }
  }

  render() {
    const { CodeMirror, activeLanguageMode, isLanguageLoading, showLanguageMask } = this.state
    const config = { ...DEFAULT_SETTINGS, ...this.props.config }

    const options = {
      screenReaderLabel: 'Code editor',
      lineNumbers: config.lineNumbers,
      firstLineNumber: config.firstLineNumber,
      mode: activeLanguageMode,
      theme: config.theme,
      scrollbarStyle: null,
      viewportMargin: Infinity,
      lineWrapping: true,
      smartIndent: true,
      extraKeys: {
        'Shift-Tab': 'indentLess',
      },
      readOnly: this.props.readOnly,
      showInvisibles: config.hiddenCharacters,
      autoCloseBrackets: true,
    }
    console.log('🚀 ~ Panda ~ render ~ options:', options)
    const backgroundImage =
      (this.props.config.backgroundImage && this.props.config.backgroundImageSelection) ||
      this.props.config.backgroundImage

    const themeConfig = this.props.theme || THEMES_HASH[config.theme]

    const light = themeConfig && themeConfig.light

    const selectionNode =
      !this.props.readOnly &&
      !!this.state.selectionAt &&
      typeof document !== 'undefined' &&
      document.getElementById('style-editor-button')

    const backgroundStyle =
      this.props.config.backgroundMode === 'image'
        ? {
            backgroundImage: backgroundImage ? `url(${backgroundImage})` : 'none',
            backgroundSize: 'cover',
            backgroundRepeat: 'no-repeat',
          }
        : {
            background: this.props.config.backgroundColor || config.backgroundColor,
            backgroundSize: 'auto',
            backgroundRepeat: 'repeat',
          }

    return (
      <div className="section panda-section">
        <div
          ref={this.props.innerRef}
          id="export-container"
          className="export-container panda-export-container"
          onMouseUp={this.onMouseUp}
        >
          {this.props.loading ? (
            <div className="panda-boot-loading" style={{ width: 876, height: 240 }}>
              <Spin size="large" />
            </div>
          ) : (
            <div
              className="container panda-container"
              data-language-loading={showLanguageMask || undefined}
              style={{
                '--panda-min-width': config.widthAdjustment ? '90px' : 'auto',
                '--panda-max-width': '90vw',
                '--panda-width': config.widthAdjustment ? 'auto' : `${config.width}px`,
                '--panda-padding': `${config.paddingVertical} ${config.paddingHorizontal}`,
                '--panda-watermark-bottom': `calc(${config.paddingVertical} + 16px)`,
                '--panda-watermark-right': `calc(${config.paddingHorizontal} + 16px)`,
                '--panda-drop-shadow': config.dropShadow
                  ? `0 ${config.dropShadowOffsetY} ${config.dropShadowBlurRadius} rgba(0, 0, 0, 0.55)`
                  : 'none',
                '--panda-code-padding-left': '12px',
                '--panda-font-family': `${config.fontFamily}, monospace`,
                '--panda-font-size': config.fontSize,
                '--panda-line-height': config.lineHeight,
                '--panda-cursor-visibility': this.props.readOnly ? 'hidden' : 'visible',
              }}
            >
              {config.windowControls ? (
                <WindowControls
                  titleBar={this.props.titleBar}
                  onTitleBarChange={this.props.onTitleBarChange}
                  theme={config.windowTheme}
                  code={this.props.children}
                  copyable={this.props.copyable}
                  light={light}
                />
              ) : null}
              {CodeMirror && (
                <CodeMirror
                  ref={this.props.editorRef}
                  className={`CodeMirror__container window-theme__${config.windowTheme}`}
                  value={this.state.editorValue}
                  options={options}
                  autoCursor={false}
                  onChange={this.onChange}
                  onGutterClick={this.props.onGutterClick}
                  onSelection={this.onSelection}
                />
              )}
              {config.watermark && (
                <React.Suspense fallback={null}>
                  <SvgAsset
                    component={WatermarkAsset}
                    className="watermark"
                    style={{
                      '--watermark-shadow-color': light ? '#9E9E9E' : '#616161',
                      '--watermark-foreground-color': light ? '#080808' : '#F7F7F7',
                      '--watermark-text-color': light ? '#000000' : '#FFFFFF',
                    }}
                  />
                </React.Suspense>
              )}
              <div className="panda-loading-mask eliminateOnRender">
                {showLanguageMask ? (
                  <div className="panda-loading-mask__content">
                    <Spin size="large" />
                  </div>
                ) : null}
              </div>
              <div className="container-bg panda-container-bg">
                <div className="white panda-container-white eliminateOnRender" />
                <div className="alpha panda-container-alpha eliminateOnRender" />
                <div className="bg panda-container-bg-layer" style={backgroundStyle} />
              </div>

              {/* TODO pass in this child as a prop to Panda */}
              <WidthHandler
                innerRef={this.props.innerRef}
                onChange={this.props.updateWidth}
                onChangeComplete={this.props.updateWidthConfirm}
                paddingHorizontal={config.paddingHorizontal}
                paddingVertical={config.paddingVertical}
              />
            </div>
          )}
        </div>
        {selectionNode &&
          ReactDOM.createPortal(
            <React.Suspense fallback={null}>
              <SelectionEditor onChange={this.onSelectionChange} />
            </React.Suspense>,
            // TODO: don't use portal?
            selectionNode,
          )}
      </div>
    )
  }
}

function selectedLinesReducer(
  { prevLine, selected },
  { type, lineNumber, numLines, selectedLines },
) {
  const newState = {}

  switch (type) {
    case 'GROUP': {
      if (prevLine) {
        for (let i = Math.min(prevLine, lineNumber); i < Math.max(prevLine, lineNumber) + 1; i++) {
          newState[i] = selected[prevLine]
        }
      }
      break
    }
    case 'MULTILINE': {
      for (let i = 0; i < selectedLines.length; i++) {
        newState[selectedLines[i] - 1] = true
      }
      break
    }
    default: {
      for (let i = 0; i < numLines; i++) {
        if (i != lineNumber) {
          if (prevLine == null) {
            newState[i] = false
          }
        } else {
          newState[lineNumber] = selected[lineNumber] === true ? false : true
        }
      }
    }
  }

  return {
    selected: { ...selected, ...newState },
    prevLine: lineNumber,
  }
}

function useSelectedLines(props, editorRef) {
  const [state, dispatch] = React.useReducer(selectedLinesReducer, {
    prevLine: null,
    selected: {},
  })

  React.useEffect(() => {
    if (editorRef.current && Object.keys(state.selected).length > 0) {
      editorRef.current.editor.display.view.forEach((line, i) => {
        if (line.text) {
          line.text.style.opacity = state.selected[i] === true ? 1 : 0.5
        }
        if (line.gutter) {
          line.gutter.style.opacity = state.selected[i] === true ? 1 : 0.5
        }
      })
    }
  }, [state.selected, props.children, props.config, editorRef])

  React.useEffect(() => {
    if (props.config.selectedLines) {
      dispatch({
        type: 'MULTILINE',
        selectedLines: props.config.selectedLines,
      })
    }
  }, [props.config.selectedLines])

  return React.useCallback(function onGutterClick(editor, lineNumber, gutter, e) {
    const numLines = editor.display.view.length
    const type = e.shiftKey ? 'GROUP' : 'LINE'
    dispatch({ type, lineNumber, numLines })
  }, [])
}

function PandaContainer(props, ref) {
  const editorRef = React.useRef(null)
  const onGutterClick = useSelectedLines(props, editorRef)

  return <Panda {...props} innerRef={ref} editorRef={editorRef} onGutterClick={onGutterClick} />
}

export default React.forwardRef(PandaContainer)
