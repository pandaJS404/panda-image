import React from 'react'
import { Modal, Tabs } from 'antd'

import ImagePicker from './ImagePicker'
import ColorPicker from './ColorPicker'
import ButtonPrimitive from './buttons/ButtonPrimitive'
import { DEFAULT_BG_COLOR } from '../src/modules/editor/config'
import { getBackgroundPreviewStyle } from '../src/modules/editor/background'
import { getAssetUrl } from '../src/shared/assets'
import { stringifyColor } from '../src/shared/utils'

const GRADIENT_BLOCK_PATTERN = /\/\*(\d+)\s+([^*]+)\*\/\s*\.([A-Za-z0-9_-]+)\s*\{([\s\S]*?)\}/gu
const CSS_DECLARATION_PATTERN = /([a-z-]+)\s*:\s*([^;]+);/gu

let gradientCatalogPromise

function validateColor(str) {
  if (/#\d{3,6}|rgba{0,1}\(.*?\)/gi.test(str) || /\w+/gi.test(str)) {
    return str
  }

  return null
}

function parseGradientCatalog(source) {
  return Array.from(source.matchAll(GRADIENT_BLOCK_PATTERN), match => {
    const [, index, name, className, block] = match
    const declarations = {}

    for (const declarationMatch of block.matchAll(CSS_DECLARATION_PATTERN)) {
      declarations[declarationMatch[1]] = declarationMatch[2].trim().replace(/\s+/gu, ' ')
    }

    const background = declarations['background-image'] || declarations.background

    if (!background) {
      return null
    }

    return {
      id: `gradient-${index}`,
      index: Number(index),
      name: name.trim(),
      className,
      background,
      backgroundBlendMode: declarations['background-blend-mode'] || null,
    }
  }).filter(Boolean)
}

function loadGradientCatalog() {
  if (!gradientCatalogPromise) {
    gradientCatalogPromise = fetch(getAssetUrl('static/webgradients.css'))
      .then(response => {
        if (!response.ok) {
          throw new Error(`Unable to load gradients: ${response.status}`)
        }

        return response.text()
      })
      .then(parseGradientCatalog)
      .catch(error => {
        gradientCatalogPromise = null
        throw error
      })
  }

  return gradientCatalogPromise
}

function getDefaultTab(mode, gradient) {
  if (mode === 'image') {
    return 'image'
  }

  if (gradient) {
    return 'gradient'
  }

  return 'color'
}

function BackgroundGradientList({
  gradients,
  gradient,
  gradientBlendMode,
  loaded,
  loading,
  onSelect,
}) {
  if (loading || !loaded) {
    return (
      <div className="bg-gradient-status" role="status">
        Loading gradients...
      </div>
    )
  }

  if (!gradients.length) {
    return <div className="bg-gradient-status">Unable to load gradients.</div>
  }

  return (
    <div className="bg-gradient-grid">
      {gradients.map(item => {
        const isSelected =
          gradient === item.background && (gradientBlendMode || null) === item.backgroundBlendMode

        return (
          <button
            key={item.id}
            type="button"
            className="bg-gradient-item"
            data-cy="background-gradient-item"
            data-gradient-name={item.name}
            data-gradient-class={item.className}
            data-selected={isSelected || undefined}
            onClick={() => onSelect(item)}
          >
            <span
              className="bg-gradient-swatch"
              style={{
                background: item.background,
                backgroundBlendMode: item.backgroundBlendMode || undefined,
              }}
            />
            <span className="bg-gradient-name">{item.name}</span>
          </button>
        )
      })}
    </div>
  )
}

function BackgroundSelect({
  color,
  gradient,
  gradientBlendMode,
  mode,
  image,
  imageSource,
  imageSelection,
  onChange,
  pandaRef,
  updateHighlights,
}) {
  const [open, setOpen] = React.useState(false)
  const [activeTab, setActiveTab] = React.useState(() => getDefaultTab(mode, gradient))
  const [gradientState, setGradientState] = React.useState({
    items: [],
    loading: false,
    loaded: false,
  })
  const isMountedRef = React.useRef(true)

  const background = validateColor(color) ? color : DEFAULT_BG_COLOR
  const aspectRatio = pandaRef ? pandaRef.clientWidth / pandaRef.clientHeight : 1
  const previewStyle = getBackgroundPreviewStyle({
    backgroundColor: background,
    backgroundGradient: gradient,
    backgroundGradientBlendMode: gradientBlendMode,
    backgroundImage: image,
    backgroundImageSelection: imageSelection,
    backgroundMode: mode,
  })

  React.useEffect(() => {
    if (open) {
      setActiveTab(getDefaultTab(mode, gradient))
    }
  }, [gradient, mode, open])

  React.useEffect(() => {
    return () => {
      isMountedRef.current = false
    }
  }, [])

  React.useEffect(() => {
    if (!open || activeTab !== 'gradient' || gradientState.loaded || gradientState.loading) {
      return undefined
    }

    setGradientState(currentState => ({
      ...currentState,
      loading: true,
    }))

    loadGradientCatalog()
      .then(items => {
        if (isMountedRef.current) {
          setGradientState({
            items,
            loading: false,
            loaded: true,
          })
        }
      })
      .catch(() => {
        if (isMountedRef.current) {
          setGradientState({
            items: [],
            loading: false,
            loaded: true,
          })
        }
      })
  }, [activeTab, gradientState.loaded, gradientState.loading, open])

  const selectTab = nextTab => {
    setActiveTab(nextTab)

    if (nextTab === 'image' && mode !== 'image') {
      onChange({ backgroundMode: 'image' })
    }
  }

  const handlePickColor = nextColor => {
    onChange({
      backgroundMode: 'color',
      backgroundColor: stringifyColor(nextColor),
      backgroundGradient: null,
      backgroundGradientBlendMode: null,
      backgroundImage: null,
      backgroundImageSource: null,
      backgroundImageSelection: null,
    })
  }

  const handleSelectGradient = nextGradient => {
    onChange({
      backgroundMode: 'color',
      backgroundGradient: nextGradient.background,
      backgroundGradientBlendMode: nextGradient.backgroundBlendMode,
      backgroundImage: null,
      backgroundImageSource: null,
      backgroundImageSelection: null,
    })
  }

  return (
    <div className="bg-select-container tools-item">
      <ButtonPrimitive
        aria-tooltip="背景菜单"
        fullWidth
        active={open}
        className="bg-color-container bg-select-display"
        data-cy="display"
        onClick={() => setOpen(true)}
      >
        <div className="bg-color-alpha" />
        <div className="bg-color" style={previewStyle} />
      </ButtonPrimitive>
      <Modal
        open={open}
        title="背景"
        footer={null}
        centered
        destroyOnHidden
        maskTransitionName=""
        transitionName=""
        width="calc(100vw - 24px)"
        rootClassName="bg-select-modal"
        onCancel={() => setOpen(false)}
        styles={{ body: { padding: 0 } }}
      >
        {open ? (
          <div id="bg-select-pickers" className="bg-select-panel">
            <Tabs
              activeKey={activeTab}
              className="bg-select-tabs"
              items={[
                {
                  key: 'color',
                  label: '颜色',
                  children: (
                    <div className="picker-tabs-contents">
                      <ColorPicker color={background} onChange={handlePickColor} />
                    </div>
                  ),
                },
                {
                  key: 'gradient',
                  label: '渐变',
                  children: (
                    <div className="picker-tabs-contents picker-tabs-contents--gradient">
                      <BackgroundGradientList
                        gradients={gradientState.items}
                        gradient={gradient}
                        gradientBlendMode={gradientBlendMode}
                        loaded={gradientState.loaded}
                        loading={gradientState.loading}
                        onSelect={handleSelectGradient}
                      />
                    </div>
                  ),
                },
                {
                  key: 'image',
                  label: '图片',
                  children: (
                    <div className="picker-tabs-contents">
                      <ImagePicker
                        onChange={onChange}
                        image={image}
                        imageSource={imageSource}
                        imageSelection={imageSelection}
                        aspectRatio={aspectRatio}
                        updateHighlights={updateHighlights}
                      />
                    </div>
                  ),
                },
              ]}
              onChange={selectTab}
            />
          </div>
        ) : null}
      </Modal>
    </div>
  )
}

export default React.memo(BackgroundSelect)
