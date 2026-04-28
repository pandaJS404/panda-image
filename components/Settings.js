import React from 'react'
import omitBy from 'lodash.omitby'
import { SettingOutlined } from '@ant-design/icons'
import { Modal, Popover, Slider as AntSlider, Tabs } from 'antd'
import { useKeyboardListener } from '../src/shared/react/hooks'

import ThemeSelect from './ThemeSelect'
import FontSelect from './FontSelect'
import ColorPicker from './ColorPicker'
import Input from './Input'
import Toggle from './Toggle'
import ButtonPrimitive from './buttons/ButtonPrimitive'
import ToolbarIconButton from './buttons/ToolbarIconButton'
import Presets from './Presets'
import { DEFAULT_PRESETS, DEFAULT_SETTINGS, DEFAULT_WIDTHS } from '../src/modules/editor/config'
import { getPresets, savePresets, generateId, fileToJSON, stringifyColor } from '../src/shared/utils'

function getViewportWidthMax() {
  if (typeof window === 'undefined') {
    return DEFAULT_WIDTHS.maxWidth
  }

  return Math.max(DEFAULT_WIDTHS.minWidth, Math.floor(window.innerWidth * 0.9))
}

const SETTINGS_MENU_LABELS = {
  Window: '窗口',
  Editor: '编辑器',
  Watermark: '水印',
  Misc: '其他',
}

function formatSliderDisplay(value, unit) {
  if (!Number.isFinite(value)) {
    return ''
  }

  const normalizedValue = Number.isInteger(value) ? value : Number.parseFloat(value.toFixed(1))

  return `${normalizedValue}${unit}`
}

function getSliderMarks(minValue, maxValue, unit) {
  const midpoint = Number.parseFloat(((minValue + maxValue) / 2).toFixed(1))

  return {
    [minValue]: formatSliderDisplay(minValue, unit),
    [midpoint]: formatSliderDisplay(midpoint, unit),
    [maxValue]: formatSliderDisplay(maxValue, unit),
  }
}

function KeyboardShortcut({ trigger, handle }) {
  useKeyboardListener(trigger, handle)
  return null
}

function SettingsSlider({
  className = '',
  label,
  value,
  onChange,
  minValue = 0,
  maxValue = 100,
  step = 1,
  unit = 'px',
  serializeValue = nextValue => `${nextValue}${unit}`,
}) {
  const numericValue = Number.parseFloat(value)
  const sliderValue = Number.isFinite(numericValue) ? numericValue : minValue
  const marks = React.useMemo(
    () => getSliderMarks(minValue, maxValue, unit),
    [maxValue, minValue, unit],
  )

  const handleChange = React.useCallback(
    nextValue => {
      if (Array.isArray(nextValue)) {
        return
      }

      onChange(serializeValue(nextValue))
    },
    [onChange, serializeValue],
  )

  return (
    <div className={`settings-row settings-slider-row${className ? ` ${className}` : ''}`}>
      <span className="settings-slider-label">{label}</span>
      <AntSlider
        aria-label={label}
        value={sliderValue}
        className="settings-slider-control"
        onChange={handleChange}
        min={minValue}
        max={maxValue}
        step={step}
        marks={marks}
        tooltip={{ formatter: tooltipValue => formatSliderDisplay(tooltipValue, unit) }}
      />
    </div>
  )
}

function SettingsColorField({ className = '', label, value, onChange }) {
  const [open, setOpen] = React.useState(false)
  const displayColor = value || DEFAULT_SETTINGS.codeMirrorBorderColor

  const handleChange = React.useCallback(
    nextColor => {
      if (typeof nextColor === 'string') {
        onChange(nextColor)
        return
      }

      if (nextColor?.rgb) {
        onChange(stringifyColor(nextColor))
      }
    },
    [onChange],
  )

  return (
    <div className={`settings-row settings-color-row${className ? ` ${className}` : ''}`}>
      <span className="settings-slider-label">{label}</span>
      <Popover
        trigger="click"
        placement="bottomRight"
        open={open}
        onOpenChange={setOpen}
        classNames={{ root: 'settings-color-popover' }}
        styles={{ body: { padding: 0 } }}
        getPopupContainer={triggerNode => triggerNode.parentElement || document.body}
        content={
          <div className="settings-color-popover__content">
            <ColorPicker color={displayColor} onChange={handleChange} />
          </div>
        }
      >
        <ButtonPrimitive
          active={open}
          className="settings-color-trigger"
          aria-label={label}
          aria-tooltip={label}
        >
          <span className="settings-color-trigger__alpha" aria-hidden="true" />
          <span
            className="settings-color-trigger__swatch"
            aria-hidden="true"
            style={{ background: displayColor }}
          />
        </ButtonPrimitive>
      </Popover>
    </div>
  )
}

function WindowSettings({
  onChange,
  codeMirrorBorder,
  codeMirrorBorderColor,
  codeMirrorBorderRadius,
  windowTheme,
  paddingHorizontal,
  paddingVertical,
  glassEffect,
  glassBlurRadius,
  dropShadow,
  dropShadowBlurRadius,
  dropShadowOffsetY,
  windowControls,
  widthAdjustment,
  width,
}) {
  const widthMax = getViewportWidthMax()

  return (
    <div className="settings-content">
      <Toggle
        label="编辑器边框"
        enabled={codeMirrorBorder}
        onChange={onChange.bind(null, 'codeMirrorBorder')}
      />
      {codeMirrorBorder ? (
        <SettingsColorField
          label="编辑器边框颜色"
          value={codeMirrorBorderColor}
          onChange={onChange.bind(null, 'codeMirrorBorderColor')}
        />
      ) : null}
      <ThemeSelect
        selected={windowTheme || 'none'}
        windowControls={windowControls}
        onChange={onChange}
      />
      {windowTheme === '__never__' ? (
      <SettingsColorField
        label="编辑器边框颜色"
        value={codeMirrorBorderColor}
        onChange={onChange.bind(null, 'codeMirrorBorderColor')}
      />
      ) : null}
      <div className="settings-split-row">
        <SettingsSlider
          label="圆角"
          value={codeMirrorBorderRadius}
          maxValue={24}
          onChange={onChange.bind(null, 'codeMirrorBorderRadius')}
        />
      </div>
      <div className="settings-split-row">
        <SettingsSlider
          label="垂直边距"
          value={paddingVertical}
          maxValue={200}
          onChange={onChange.bind(null, 'paddingVertical')}
        />
      </div>
      <div className="settings-split-row">
        <SettingsSlider
          label="水平边距"
          value={paddingHorizontal}
          onChange={onChange.bind(null, 'paddingHorizontal')}
        />
      </div>
      <Toggle label="投影" enabled={dropShadow} onChange={onChange.bind(null, 'dropShadow')} />
      {dropShadow ? (
        <div className="settings-split-row drop-shadow-options">
          <SettingsSlider
            label="Y 轴偏移"
            value={dropShadowOffsetY}
            onChange={onChange.bind(null, 'dropShadowOffsetY')}
          />
          <SettingsSlider
            label="模糊半径"
            value={dropShadowBlurRadius}
            onChange={onChange.bind(null, 'dropShadowBlurRadius')}
          />
        </div>
      ) : null}
      <Toggle label="毛玻璃" enabled={glassEffect} onChange={onChange.bind(null, 'glassEffect')} />
      {glassEffect ? (
        <SettingsSlider
          label="模糊强度"
          value={glassBlurRadius}
          minValue={4}
          maxValue={40}
          step={1}
          unit="px"
          onChange={onChange.bind(null, 'glassBlurRadius')}
        />
      ) : null}
      <Toggle
        label="自动适配宽度"
        enabled={widthAdjustment}
        onChange={onChange.bind(null, 'widthAdjustment')}
      />
      {!widthAdjustment ? (
        <SettingsSlider
          className="width-row"
          label="宽度"
          value={width}
          minValue={DEFAULT_WIDTHS.minWidth}
          maxValue={widthMax}
          unit="px"
          serializeValue={nextValue => nextValue}
          onChange={onChange.bind(null, 'width')}
        />
      ) : null}
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
      <SettingsSlider
        label="字号"
        value={size}
        minValue={10}
        maxValue={18}
        step={0.5}
        onChange={onChange.bind(null, 'fontSize')}
      />
      <SettingsSlider
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

function WatermarkSettings({ onChange, watermark }) {
  return (
    <div className="settings-content">
      <Toggle label="水印" enabled={watermark} onChange={onChange.bind(null, 'watermark')} />
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
    if (typeof localStorage === 'undefined') {
      return
    }

    const storedPresets = getPresets(localStorage) || []
    setPresets(currentPresets => [...storedPresets, ...currentPresets])
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

  const togglePresets = React.useCallback(() => {
    setShowPresets(current => !current)
  }, [])

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
        savePresets(nextPresets.filter(currentPreset => currentPreset.custom))
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
      savePresets(nextPresets.filter(currentPreset => currentPreset.custom))
      return nextPresets
    })
    setPreviousSettings(null)
  }, [getSettingsFromProps, props])

  const tabItems = [
    {
      key: 'Window',
      label: SETTINGS_MENU_LABELS.Window,
      children: (
        <WindowSettings
          onChange={handleChange}
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
      key: 'Watermark',
      label: SETTINGS_MENU_LABELS.Watermark,
      children: <WatermarkSettings onChange={handleChange} watermark={props.watermark} />,
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
        width="calc(100vw - 24px)"
        rootClassName="settings-modal"
        onCancel={closeModal}
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
              tabPlacement="left"
            />
          </div>
        ) : null}
      </Modal>
    </div>
  )
}

export default React.memo(Settings)
