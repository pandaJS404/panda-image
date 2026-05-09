import React from 'react'
import omitBy from 'lodash.omitby'
import { SettingOutlined } from '@ant-design/icons'
import { Modal, Tabs } from 'antd'

import { KeyboardShortcut } from './settings/SettingsShared'
import WindowSettings from './settings/WindowSettings'
import NeumorphismSettings from './settings/NeumorphismSettings'
import EditorSettings from './settings/EditorSettings'
import WatermarkSettings from './settings/WatermarkSettings'
import MiscSettings from './settings/MiscSettings'

import ToolbarIconButton from './buttons/ToolbarIconButton'
import Presets from './Presets'
import { DEFAULT_PRESETS, DEFAULT_SETTINGS } from '../src/modules/editor/config'
import { getPresets, savePresets, generateId } from '../src/shared/utils'

const SETTINGS_MENU_LABELS = {
  Templates: '模板',
  Window: '窗口',
  Editor: '编辑器',
  Watermark: '水印',
  Misc: '其他',
}

const invalidSetting = (value, key) =>
  !(Object.prototype.hasOwnProperty.call(DEFAULT_SETTINGS, key) || key === 'highlights')

function Settings(props) {
  const [presets, setPresets] = React.useState(DEFAULT_PRESETS)
  const [selectedMenu, setSelectedMenu] = React.useState('Templates')
  const [previousSettings, setPreviousSettings] = React.useState(null)
  const [open, setOpen] = React.useState(false)

  React.useEffect(() => {
    void getPresets()
      .then(storedPresets => {
        if (storedPresets?.length) {
          setPresets(currentPresets => [...storedPresets, ...currentPresets])
        }
      })
      .catch(error => {
        console.warn('[Settings] Failed to load presets:', error)
      })
  }, [])

  const handleResetAll = React.useCallback(() => {
    props.resetDefaultSettings()
    setPreviousSettings(null)
  }, [props])

  const handleResetShortcut = React.useCallback(
    event => {
      if (event.__pandaSettingsResetHandled) {
        return
      }

      const matchesResetShortcut =
        event.shiftKey &&
        (event.metaKey || event.ctrlKey) &&
        (event.key === '\\' || event.key === '|' || event.code === 'Backslash')

      if (!matchesResetShortcut) {
        return
      }

      event.__pandaSettingsResetHandled = true
      event.preventDefault()
      handleResetAll()
    },
    [handleResetAll],
  )

  React.useEffect(() => {
    const targets = [window, document, document.body].filter(Boolean)
    targets.forEach(target => target.addEventListener('keydown', handleResetShortcut, true))

    return () => {
      targets.forEach(target => target.removeEventListener('keydown', handleResetShortcut, true))
    }
  }, [handleResetShortcut])

  React.useEffect(() => {
    if (typeof document === 'undefined') {
      return
    }

    const lockClassName = 'panda-settings-scroll-lock'
    const targets = [document.documentElement, document.body].filter(Boolean)

    targets.forEach(target => target.classList.toggle(lockClassName, open))

    return () => {
      targets.forEach(target => target.classList.remove(lockClassName))
    }
  }, [open])

  const toggleOpen = React.useCallback(() => {
    setOpen(current => !current)
  }, [])

  const closeModal = React.useCallback(() => {
    setOpen(false)
  }, [])

  const handleChange = React.useCallback(
    (key, value) => {
      props.onChange(key, value)
      setPreviousSettings(null)
    },
    [props],
  )

  const handleFontUpload = React.useCallback(
    (id, url) => {
      props.onChange('fontFamily', id)
      props.onChange('fontUrl', url)
      setPreviousSettings(null)
      setOpen(false)
    },
    [props],
  )

  const handleWatermarkFontChange = React.useCallback(
    fontFamily => {
      props.onWatermarkFontChange(fontFamily)
      setPreviousSettings(null)
    },
    [props],
  )

  const handleWatermarkFontUpload = React.useCallback(
    (id, url) => {
      props.onWatermarkFontUpload(id, url)
      setPreviousSettings(null)
      setOpen(false)
    },
    [props],
  )

  const getSettingsFromProps = React.useCallback(() => omitBy(props, invalidSetting), [props])

  const applyPreset = React.useCallback(
    nextPreset => {
      const nextPreviousSettings = getSettingsFromProps()
      props.applyPreset(nextPreset)
      setPreviousSettings(nextPreviousSettings)
    },
    [getSettingsFromProps, props],
  )

  const undoPreset = React.useCallback(() => {
    if (!previousSettings) {
      return
    }

    props.applyPreset({ ...previousSettings, id: null })
    setPreviousSettings(null)
  }, [previousSettings, props])

  const removePreset = React.useCallback(
    id => {
      if (props.preset === id) {
        props.onChange('preset', null)
        setPreviousSettings(null)
      }

      setPresets(currentPresets => {
        const nextPresets = currentPresets.filter(currentPreset => currentPreset.id !== id)
        void savePresets(nextPresets.filter(currentPreset => currentPreset.custom))
        return nextPresets
      })
    },
    [props],
  )

  const createPreset = React.useCallback(async () => {
    const newPreset = getSettingsFromProps()

    newPreset.id = `preset:${generateId()}`
    newPreset.custom = true
    newPreset.icon = await props.getPandaImage({
      format: 'png',
      squared: true,
      exportSize: 1,
    })

    props.onChange('preset', newPreset.id)

    setPresets(currentPresets => {
      const nextPresets = [newPreset, ...currentPresets]
      void savePresets(nextPresets.filter(currentPreset => currentPreset.custom))
      return nextPresets
    })
    setPreviousSettings(null)
  }, [getSettingsFromProps, props])

  const tabItems = [
    {
      key: 'Templates',
      label: SETTINGS_MENU_LABELS.Templates,
      children: (
        <Presets
          presets={presets}
          selected={props.preset}
          apply={applyPreset}
          undo={undoPreset}
          remove={removePreset}
          create={createPreset}
          applied={Boolean(previousSettings)}
        />
      ),
    },
    {
      key: 'Window',
      label: SETTINGS_MENU_LABELS.Window,
      children: (
        <WindowSettings
          onChange={handleChange}
          neumorphismEnabled={props.neumorphismEnabled}
          codeMirrorBorder={props.codeMirrorBorder}
          codeMirrorBorderColor={props.codeMirrorBorderColor}
          codeMirrorBorderRadius={props.codeMirrorBorderRadius}
          windowTheme={props.windowTheme}
          paddingHorizontal={props.paddingHorizontal}
          paddingVertical={props.paddingVertical}
          glassEffect={props.glassEffect}
          glassBlurRadius={props.glassBlurRadius}
          dropShadow={props.dropShadow}
          dropShadowBlurRadius={props.dropShadowBlurRadius}
          dropShadowOffsetY={props.dropShadowOffsetY}
          windowControls={props.windowControls}
          widthAdjustment={props.widthAdjustment}
          width={props.width}
        />
      ),
    },
    {
      key: 'Editor',
      label: SETTINGS_MENU_LABELS.Editor,
      children: (
        <EditorSettings
          onChange={handleChange}
          onUpload={handleFontUpload}
          font={props.fontFamily}
          size={props.fontSize}
          lineHeight={props.lineHeight}
          lineNumbers={props.lineNumbers}
          firstLineNumber={props.firstLineNumber}
          hiddenCharacters={props.hiddenCharacters}
        />
      ),
    },
    {
      key: 'Neumorphism',
      label: '拟态',
      children: (
        <NeumorphismSettings
          onChange={handleChange}
          backgroundMode={props.backgroundMode}
          backgroundColor={props.backgroundColor}
          backgroundGradient={props.backgroundGradient}
          neumorphismEnabled={props.neumorphismEnabled}
          neumorphismColor={props.neumorphismColor}
          neumorphismColorMode={props.neumorphismColorMode}
          neumorphismGradientStart={props.neumorphismGradientStart}
          neumorphismGradientEnd={props.neumorphismGradientEnd}
          neumorphismGradientAngle={props.neumorphismGradientAngle}
          neumorphismShape={props.neumorphismShape}
          neumorphismLightSource={props.neumorphismLightSource}
          neumorphismDistance={props.neumorphismDistance}
          neumorphismBlur={props.neumorphismBlur}
          neumorphismIntensity={props.neumorphismIntensity}
          neumorphismRadius={props.neumorphismRadius}
        />
      ),
    },
    {
      key: 'Watermark',
      label: SETTINGS_MENU_LABELS.Watermark,
      children: (
        <WatermarkSettings
          onChange={handleChange}
          onWatermarkFontChange={handleWatermarkFontChange}
          onWatermarkFontUpload={handleWatermarkFontUpload}
          watermark={props.watermark}
          watermarkMode={props.watermarkMode}
          watermarkOpacity={props.watermarkOpacity}
          watermarkScale={props.watermarkScale}
          watermarkOffsetX={props.watermarkOffsetX}
          watermarkOffsetY={props.watermarkOffsetY}
          watermarkText={props.watermarkText}
          watermarkFontFamily={props.watermarkFontFamily}
          watermarkTextSize={props.watermarkTextSize}
          watermarkTextKerning={props.watermarkTextKerning}
          watermarkStrokeColor={props.watermarkStrokeColor}
          watermarkStrokeWidth={props.watermarkStrokeWidth}
          watermarkFillEnabled={props.watermarkFillEnabled}
          watermarkFillColor={props.watermarkFillColor}
        />
      ),
    },
    {
      key: 'Misc',
      label: SETTINGS_MENU_LABELS.Misc,
      children: (
        <MiscSettings
          format={props.format}
          reset={handleResetAll}
          applyPreset={props.applyPreset}
          settings={getSettingsFromProps()}
        />
      ),
    },
  ]

  return (
    <div className="settings-container tools-item">
      <KeyboardShortcut trigger="cmd-/" handle={toggleOpen} />
      <ToolbarIconButton
        aria-tooltip="设置菜单"
        active={open}
        className="settings-trigger-button"
        data-cy="settings-button"
        onClick={toggleOpen}
      >
        <SettingOutlined />
      </ToolbarIconButton>
      <Modal
        open={open}
        title="设置"
        footer={null}
        centered
        destroyOnHidden
        maskTransitionName=""
        transitionName=""
        width="calc(100vw - 24px)"
        rootClassName="settings-modal"
        onCancel={closeModal}
        styles={{ body: { padding: 0 } }}
      >
        {open ? (
          <div className="settings-panel">
            <Tabs
              activeKey={selectedMenu}
              className="settings-tabs"
              destroyOnHidden={false}
              items={tabItems}
              onChange={setSelectedMenu}
              tabPlacement="left"
            />
          </div>
        ) : null}
      </Modal>
    </div>
  )
}

export default React.memo(Settings)
