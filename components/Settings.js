import React from 'react'
import omitBy from 'lodash.omitby'
import { SettingOutlined } from '@ant-design/icons'
import { Modal, Tabs } from 'antd'
import { useKeyboardListener } from '../src/shared/react/hooks'

import ThemeSelect from './ThemeSelect'
import FontSelect from './FontSelect'
import Slider from './Slider'
import Input from './Input'
import Toggle from './Toggle'
import ButtonPrimitive from './buttons/ButtonPrimitive'
import ToolbarIconButton from './buttons/ToolbarIconButton'
import Presets from './Presets'
import { DEFAULT_PRESETS, DEFAULT_SETTINGS, DEFAULT_WIDTHS } from '../src/modules/editor/config'
import { getPresets, savePresets, generateId, fileToJSON } from '../src/shared/utils'

function getViewportWidthMax() {
  if (typeof window === 'undefined') {
    return DEFAULT_WIDTHS.maxWidth
  }

  return Math.max(DEFAULT_WIDTHS.minWidth, Math.floor(window.innerWidth * 0.9))
}

const SETTINGS_MENU_LABELS = {
  Window: '窗口',
  Editor: '编辑器',
  Misc: '其他',
}

function KeyboardShortcut({ trigger, handle }) {
  useKeyboardListener(trigger, handle)
  return null
}

function WindowSettings({
  onChange,
  windowTheme,
  paddingHorizontal,
  paddingVertical,
  dropShadow,
  dropShadowBlurRadius,
  dropShadowOffsetY,
  windowControls,
  widthAdjustment,
  width,
  watermark,
}) {
  const widthMax = getViewportWidthMax()

  return (
    <div className="settings-content">
      <ThemeSelect
        selected={windowTheme || 'none'}
        windowControls={windowControls}
        onChange={onChange}
      />
      <div className="settings-split-row">
        <Slider
          label="垂直边距"
          value={paddingVertical}
          maxValue={200}
          onChange={onChange.bind(null, 'paddingVertical')}
        />
        <Slider
          label="水平边距"
          value={paddingHorizontal}
          onChange={onChange.bind(null, 'paddingHorizontal')}
        />
      </div>
      <Toggle label="投影" enabled={dropShadow} onChange={onChange.bind(null, 'dropShadow')} />
      {dropShadow ? (
        <div className="settings-split-row drop-shadow-options">
          <Slider
            label="Y 轴偏移"
            value={dropShadowOffsetY}
            onChange={onChange.bind(null, 'dropShadowOffsetY')}
          />
          <Slider
            label="模糊半径"
            value={dropShadowBlurRadius}
            onChange={onChange.bind(null, 'dropShadowBlurRadius')}
          />
        </div>
      ) : null}
      <Toggle
        label="自动适配宽度"
        enabled={widthAdjustment}
        onChange={onChange.bind(null, 'widthAdjustment')}
      />
      {!widthAdjustment ? (
        <div className="settings-row width-row">
          <Input
            label="宽度"
            type="number"
            value={width}
            min={DEFAULT_WIDTHS.minWidth}
            max={widthMax}
            onChange={event => onChange('width', event.target.value)}
            width="50%"
            fieldClassName="settings-inline-field"
          />
        </div>
      ) : null}
      <Toggle label="水印" enabled={watermark} onChange={onChange.bind(null, 'watermark')} />
    </div>
  )
}

function EditorSettings({
  onChange,
  onUpload,
  font,
  size,
  lineHeight,
  lineNumbers,
  firstLineNumber,
  hiddenCharacters,
}) {
  return (
    <div className="settings-content">
      <FontSelect
        selected={font}
        onUpload={onUpload}
        onChange={onChange.bind(null, 'fontFamily')}
      />
      <Slider
        label="字号"
        value={size}
        minValue={10}
        maxValue={18}
        step={0.5}
        onChange={onChange.bind(null, 'fontSize')}
      />
      <Slider
        label="行高"
        value={lineHeight}
        minValue={90}
        maxValue={250}
        unit="%"
        onChange={onChange.bind(null, 'lineHeight')}
      />
      <Toggle label="行号" enabled={lineNumbers} onChange={onChange.bind(null, 'lineNumbers')} />
      {lineNumbers ? (
        <div className="settings-row first-line-number-row">
          <Input
            label="起始行号"
            type="number"
            value={firstLineNumber}
            min={0}
            onChange={event => onChange('firstLineNumber', Number(event.target.value))}
            width="50%"
            fieldClassName="settings-inline-field"
          />
        </div>
      ) : null}
      <Toggle
        label="显示隐藏字符"
        enabled={hiddenCharacters}
        onChange={onChange.bind(null, 'hiddenCharacters')}
      />
    </div>
  )
}

function MiscSettings({ format, reset, applyPreset, settings }) {
  const inputRef = React.useRef(null)
  let download

  try {
    download = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(settings))}`
  } catch (error) {
    download = undefined
  }

  return (
    <div className="settings-content settings-content--misc">
      <div className="settings-misc-actions settings-misc-row">
        <input
          hidden
          ref={inputRef}
          type="file"
          accept=".json"
          onChange={async event => {
            const json = await fileToJSON(event.target.files[0])
            if (json) {
              applyPreset(json)
            }
          }}
        />
        <ButtonPrimitive
          fullWidth
          className="settings-misc-button"
          data-layout="split"
          onClick={() => inputRef.current?.click()}
        >
          导入配置
        </ButtonPrimitive>
        <ButtonPrimitive
          fullWidth
          href={download}
          download="panda-config.json"
          className="settings-link-button settings-misc-button"
          data-layout="split"
        >
          导出配置
        </ButtonPrimitive>
      </div>
      <ButtonPrimitive
        fullWidth
        onClick={format}
        className="settings-misc-button"
        data-layout="divider"
        data-cy="format-code-button"
      >
        美化代码
      </ButtonPrimitive>
      <ButtonPrimitive
        fullWidth
        onClick={reset}
        className="settings-misc-button"
        data-layout="divider"
        style={{ color: 'var(--status-danger)' }}
      >
        重置设置
      </ButtonPrimitive>
    </div>
  )
}

const invalidSetting = (value, key) =>
  !(Object.prototype.hasOwnProperty.call(DEFAULT_SETTINGS, key) || key === 'highlights')

function Settings(props) {
  const [presets, setPresets] = React.useState(DEFAULT_PRESETS)
  const [selectedMenu, setSelectedMenu] = React.useState('Window')
  const [showPresets, setShowPresets] = React.useState(true)
  const [previousSettings, setPreviousSettings] = React.useState(null)
  const [open, setOpen] = React.useState(false)

  React.useEffect(() => {
    const storedPresets = getPresets(localStorage) || []
    setPresets(currentPresets => [...storedPresets, ...currentPresets])
  }, [])

  const handleResetShortcut = React.useCallback(
    event => {
      if (event.__pandaSettingsResetHandled) {
        return
      }

      const matchesResetShortcut =
        event.shiftKey &&
        (event.metaKey || event.ctrlKey) &&
        (event.key === '\\' || event.key === '|' || event.code === 'Backslash')

      if (matchesResetShortcut) {
        event.__pandaSettingsResetHandled = true
        event.preventDefault()
        props.resetDefaultSettings()
        setPreviousSettings(null)
      }
    },
    [props],
  )

  React.useEffect(() => {
    const targets = [window, document, document.body].filter(Boolean)
    targets.forEach(target => target.addEventListener('keydown', handleResetShortcut, true))

    return () => {
      targets.forEach(target => target.removeEventListener('keydown', handleResetShortcut, true))
    }
  }, [handleResetShortcut])

  const togglePresets = () => setShowPresets(current => !current)

  const handleChange = (key, value) => {
    props.onChange(key, value)
    setPreviousSettings(null)
  }

  const handleFontUpload = (id, url) => {
    props.onChange('fontFamily', id)
    props.onChange('fontUrl', url)
    setOpen(false)
  }

  const getSettingsFromProps = () => omitBy(props, invalidSetting)

  const applyPreset = preset => {
    const nextPreviousSettings = getSettingsFromProps()
    props.applyPreset(preset)
    setPreviousSettings(nextPreviousSettings)
  }

  const undoPreset = () => {
    props.applyPreset({ ...previousSettings, id: null })
    setPreviousSettings(null)
  }

  const removePreset = id => {
    if (props.preset === id) {
      props.onChange('preset', null)
      setPreviousSettings(null)
    }

    setPresets(currentPresets => {
      const nextPresets = currentPresets.filter(preset => preset.id !== id)
      savePresets(nextPresets.filter(preset => preset.custom))
      return nextPresets
    })
  }

  const createPreset = async () => {
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
      savePresets(nextPresets.filter(preset => preset.custom))
      return nextPresets
    })
    setPreviousSettings(null)
  }

  const tabItems = [
    {
      key: 'Window',
      label: SETTINGS_MENU_LABELS.Window,
      children: (
        <WindowSettings
          onChange={handleChange}
          windowTheme={props.windowTheme}
          paddingHorizontal={props.paddingHorizontal}
          paddingVertical={props.paddingVertical}
          dropShadow={props.dropShadow}
          dropShadowBlurRadius={props.dropShadowBlurRadius}
          dropShadowOffsetY={props.dropShadowOffsetY}
          windowControls={props.windowControls}
          widthAdjustment={props.widthAdjustment}
          width={props.width}
          watermark={props.watermark}
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
      key: 'Misc',
      label: SETTINGS_MENU_LABELS.Misc,
      children: (
        <MiscSettings
          format={props.format}
          reset={() => {
            props.resetDefaultSettings()
            setPreviousSettings(null)
          }}
          applyPreset={props.applyPreset}
          settings={getSettingsFromProps()}
        />
      ),
    },
  ]

  return (
    <div className="settings-container tools-item">
      <KeyboardShortcut trigger="cmd-/" handle={() => setOpen(current => !current)} />
      <ToolbarIconButton
        aria-tooltip="设置菜单"
        active={open}
        className="settings-trigger-button"
        data-cy="settings-button"
        onClick={() => setOpen(current => !current)}
      >
        <SettingOutlined />
      </ToolbarIconButton>
      <Modal
        open={open}
        title="设置"
        footer={null}
        centered
        destroyOnHidden
        width="calc(100vw - 24px)"
        rootClassName="settings-modal"
        onCancel={() => setOpen(false)}
        styles={{ body: { padding: 0 } }}
      >
        {open ? (
          <div className="settings-panel">
            <Presets
              show={showPresets}
              presets={presets}
              selected={props.preset}
              toggle={togglePresets}
              apply={applyPreset}
              undo={undoPreset}
              remove={removePreset}
              create={createPreset}
              applied={Boolean(previousSettings)}
            />
            <Tabs
              activeKey={selectedMenu}
              className="settings-tabs"
              items={tabItems}
              onChange={setSelectedMenu}
              tabPosition="left"
            />
          </div>
        ) : null}
      </Modal>
    </div>
  )
}

export default React.memo(Settings)
