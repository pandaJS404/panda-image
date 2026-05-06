import React from 'react'
import omitBy from 'lodash.omitby'
import { SettingOutlined } from '@ant-design/icons'
import { Modal, Popover, Radio, Slider as AntSlider, Tabs } from 'antd'
import SliderInternalContext from 'antd/es/slider/Context'
import { useKeyboardListener } from '../src/shared/react/hooks'

import ThemeSelect from './ThemeSelect'
import FontSelect from './FontSelect'
import ColorPicker from './ColorPicker'
import Input from './Input'
import Toggle from './Toggle'
import ButtonPrimitive from './buttons/ButtonPrimitive'
import ToolbarIconButton from './buttons/ToolbarIconButton'
import Presets from './Presets'
import SvgAsset from './svg/SvgAsset'
import NeumorphismFlatAsset from './svg/assets/mimicry/plane.svg?react'
import NeumorphismPressedAsset from './svg/assets/mimicry/invagination.svg?react'
import NeumorphismConcaveAsset from './svg/assets/mimicry/indent.svg?react'
import NeumorphismConvexAsset from './svg/assets/mimicry/convex.svg?react'
import {
  DEFAULT_PRESETS,
  DEFAULT_SETTINGS,
  DEFAULT_WATERMARK_FILL_COLOR,
  DEFAULT_WATERMARK_STROKE_COLOR,
  DEFAULT_WIDTHS,
} from '../src/modules/editor/config'
import {
  getPresets,
  savePresets,
  generateId,
  fileToJSON,
  prepareConfigForExport,
  prepareConfigForImport,
  stringifyColor,
} from '../src/shared/utils'

function getViewportWidthMax() {
  if (typeof window === 'undefined') {
    return DEFAULT_WIDTHS.maxWidth
  }

  return Math.max(DEFAULT_WIDTHS.minWidth, Math.floor(window.innerWidth * 0.9))
}

const SETTINGS_MENU_LABELS = {
  Templates: '模板',
  Window: '窗口',
  Editor: '编辑器',
  Watermark: '水印',
  Misc: '其他',
}

const WATERMARK_MODE_OPTIONS = [
  { id: 'logo', name: 'Panda' },
  { id: 'text-svg', name: '自定义' },
]

const SLIDER_HANDLE_RENDER = node => node
const SLIDER_INTERNAL_CONTEXT_VALUE = { handleRender: SLIDER_HANDLE_RENDER }

const NEUMORPHISM_SHAPE_OPTIONS = [
  { id: 'flat', name: '平面' },
  { id: 'concave', name: '内凹' },
  { id: 'convex', name: '外凸' },
  { id: 'pressed', name: '按下' },
]

const NEUMORPHISM_LIGHT_OPTIONS = [
  { id: 'top-left', name: '左上' },
  { id: 'top-right', name: '右上' },
  { id: 'bottom-right', name: '右下' },
  { id: 'bottom-left', name: '左下' },
]

const NEUMORPHISM_SHAPE_ASSETS = {
  flat: NeumorphismFlatAsset,
  pressed: NeumorphismPressedAsset,
  concave: NeumorphismConcaveAsset,
  convex: NeumorphismConvexAsset,
}

function NeumorphismShapeIcon({ shape, label }) {
  const asset = NEUMORPHISM_SHAPE_ASSETS[shape]

  return (
    <span className="settings-neumorphism-shape-icon" aria-hidden="true" title={label}>
      <SvgAsset component={asset} className="settings-neumorphism-shape-icon__svg" />
    </span>
  )
}

function serializeNumericValue(value, precision = 2) {
  return `${Number.parseFloat(value.toFixed(precision))}`
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

function expandHexColor(value) {
  const hexValue = String(value || '').trim()

  if (/^#[0-9a-f]{3}$/i.test(hexValue)) {
    return `#${hexValue
      .slice(1)
      .split('')
      .map(character => character + character)
      .join('')}`
  }

  if (/^#[0-9a-f]{6}$/i.test(hexValue)) {
    return hexValue
  }

  return null
}

function rgbChannelToHex(value) {
  const numericValue = Number.parseFloat(value)

  if (!Number.isFinite(numericValue)) {
    return null
  }

  const normalizedValue = value.includes('%')
    ? Math.round((Math.min(Math.max(numericValue, 0), 100) / 100) * 255)
    : Math.round(Math.min(Math.max(numericValue, 0), 255))

  return normalizedValue.toString(16).padStart(2, '0')
}

function normalizeColorToHex(value, fallback) {
  const hexValue = expandHexColor(value)

  if (hexValue) {
    return hexValue
  }

  const rgbMatch = String(value || '')
    .trim()
    .match(/^rgba?\(\s*([^,]+)\s*,\s*([^,]+)\s*,\s*([^,)]+)(?:\s*,\s*[^)]+)?\)$/i)

  if (!rgbMatch) {
    return fallback
  }

  const channels = rgbMatch.slice(1, 4).map(rgbChannelToHex)

  if (channels.some(channel => !channel)) {
    return fallback
  }

  return `#${channels.join('')}`
}

function splitGradientArguments(value) {
  const parts = []
  let current = ''
  let depth = 0

  for (const character of String(value || '')) {
    if (character === '(') {
      depth += 1
    } else if (character === ')') {
      depth = Math.max(0, depth - 1)
    }

    if (character === ',' && depth === 0) {
      if (current.trim()) {
        parts.push(current.trim())
      }
      current = ''
      continue
    }

    current += character
  }

  if (current.trim()) {
    parts.push(current.trim())
  }

  return parts
}

function resolveGradientAngle(token) {
  const normalizedToken = String(token || '')
    .trim()
    .toLowerCase()

  if (normalizedToken.endsWith('turn')) {
    const turns = Number.parseFloat(normalizedToken)
    return Number.isFinite(turns)
      ? Number.parseFloat((turns * 360).toFixed(2))
      : DEFAULT_SETTINGS.neumorphismGradientAngle
  }

  if (normalizedToken.endsWith('rad')) {
    const radians = Number.parseFloat(normalizedToken)
    return Number.isFinite(radians)
      ? Number.parseFloat(((radians * 180) / Math.PI).toFixed(2))
      : DEFAULT_SETTINGS.neumorphismGradientAngle
  }

  if (normalizedToken.endsWith('grad')) {
    const grads = Number.parseFloat(normalizedToken)
    return Number.isFinite(grads)
      ? Number.parseFloat((grads * 0.9).toFixed(2))
      : DEFAULT_SETTINGS.neumorphismGradientAngle
  }

  if (normalizedToken.endsWith('deg')) {
    const degrees = Number.parseFloat(normalizedToken)
    return Number.isFinite(degrees)
      ? Number.parseFloat(degrees.toFixed(2))
      : DEFAULT_SETTINGS.neumorphismGradientAngle
  }

  switch (normalizedToken.replace(/\s+/g, ' ')) {
    case 'to top':
      return 0
    case 'to top right':
      return 45
    case 'to right':
      return 90
    case 'to bottom right':
      return 135
    case 'to bottom':
      return 180
    case 'to bottom left':
      return 225
    case 'to left':
      return 270
    case 'to top left':
      return 315
    default:
      return DEFAULT_SETTINGS.neumorphismGradientAngle
  }
}

function extractGradientColor(token) {
  const match = String(token || '')
    .trim()
    .match(/(#[0-9a-f]{3,8}\b|rgba?\([^)]+\)|hsla?\([^)]+\))/i)

  return match ? match[1] : null
}

function resolveNeumorphismGradientDefaults(gradient) {
  const fallback = {
    start: DEFAULT_SETTINGS.neumorphismGradientStart,
    end: DEFAULT_SETTINGS.neumorphismGradientEnd,
    angle: DEFAULT_SETTINGS.neumorphismGradientAngle,
  }

  if (typeof gradient !== 'string' || !/gradient\(/i.test(gradient)) {
    return fallback
  }

  const openParenIndex = gradient.indexOf('(')
  const closeParenIndex = gradient.lastIndexOf(')')

  if (openParenIndex === -1 || closeParenIndex === -1 || closeParenIndex <= openParenIndex) {
    return fallback
  }

  const gradientParts = splitGradientArguments(gradient.slice(openParenIndex + 1, closeParenIndex))
  const firstPart = gradientParts[0] || ''
  const hasExplicitDirection =
    /^(to\s+|[-+]?\d+(?:\.\d+)?(?:deg|rad|turn|grad))$/i.test(firstPart.trim()) ||
    /^to\s+/i.test(firstPart.trim())
  const colorParts = (hasExplicitDirection ? gradientParts.slice(1) : gradientParts)
    .map(extractGradientColor)
    .filter(Boolean)

  if (colorParts.length < 2) {
    return fallback
  }

  return {
    start: normalizeColorToHex(colorParts[0], DEFAULT_SETTINGS.neumorphismGradientStart),
    end: normalizeColorToHex(
      colorParts[colorParts.length - 1],
      DEFAULT_SETTINGS.neumorphismGradientEnd,
    ),
    angle: hasExplicitDirection
      ? resolveGradientAngle(firstPart)
      : DEFAULT_SETTINGS.neumorphismGradientAngle,
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
  disabled = false,
  minValue = 0,
  maxValue = 100,
  step = 1,
  unit = 'px',
  serializeValue = nextValue => `${nextValue}${unit}`,
}) {
  const [draftValue, setDraftValue] = React.useState(null)
  const numericValue = Number.parseFloat(value)
  const committedValue = Number.isFinite(numericValue) ? numericValue : minValue
  const sliderValue = draftValue ?? committedValue
  const marks = React.useMemo(
    () => getSliderMarks(minValue, maxValue, unit),
    [maxValue, minValue, unit],
  )

  React.useEffect(() => {
    if (!disabled) {
      setDraftValue(null)
    }
  }, [committedValue, disabled])

  const commitValue = React.useCallback(nextValue => {
    if (Array.isArray(nextValue)) {
      return
    }

    setDraftValue(null)
  }, [])

  return (
    <div
      className={`settings-row settings-slider-row${className ? ` ${className}` : ''}`}
      data-disabled={disabled || undefined}
    >
      <span className="settings-slider-label">{label}</span>
      <SliderInternalContext.Provider value={SLIDER_INTERNAL_CONTEXT_VALUE}>
        <AntSlider
          aria-label={label}
          value={sliderValue}
          className="settings-slider-control"
          disabled={disabled}
          onChange={nextValue => {
            if (!Array.isArray(nextValue)) {
              setDraftValue(nextValue)
              onChange(serializeValue(nextValue))
            }
          }}
          onChangeComplete={commitValue}
          min={minValue}
          max={maxValue}
          step={step}
          marks={marks}
          tooltip={{
            formatter: nextValue => formatSliderDisplay(nextValue, unit),
          }}
        />
      </SliderInternalContext.Provider>
    </div>
  )
}

function SettingsColorField({
  className = '',
  label,
  value,
  onChange,
  fallbackColor = DEFAULT_SETTINGS.codeMirrorBorderColor,
  onClear,
  clearLabel = '重置',
  disabled = false,
}) {
  const [open, setOpen] = React.useState(false)
  const displayColor = value || fallbackColor

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
    <div
      className={`settings-row settings-color-row${className ? ` ${className}` : ''}`}
      data-disabled={disabled || undefined}
    >
      <span className="settings-slider-label">{label}</span>
      <div className="settings-color-actions">
        <Popover
          trigger="click"
          placement="bottomRight"
          open={disabled ? false : open}
          onOpenChange={nextOpen => setOpen(disabled ? false : nextOpen)}
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
            disabled={disabled}
          >
            <span className="settings-color-trigger__alpha" aria-hidden="true" />
            <span
              className="settings-color-trigger__swatch"
              aria-hidden="true"
              style={{ background: displayColor }}
            />
          </ButtonPrimitive>
        </Popover>
        {onClear ? (
          <ButtonPrimitive className="settings-color-clear" disabled={disabled} onClick={onClear}>
            {clearLabel}
          </ButtonPrimitive>
        ) : null}
      </div>
    </div>
  )
}

function HexColorField({
  className = '',
  label,
  value,
  onChange,
  fallbackColor,
  onClear,
  disabled = false,
}) {
  const [open, setOpen] = React.useState(false)
  const displayColor = value || fallbackColor

  const handleChange = React.useCallback(
    nextColor => {
      if (typeof nextColor === 'string') {
        onChange(nextColor)
        return
      }

      if (nextColor?.hex) {
        onChange(nextColor.hex)
      }
    },
    [onChange],
  )

  return (
    <div
      className={`settings-row settings-color-row${className ? ` ${className}` : ''}`}
      data-disabled={disabled || undefined}
    >
      <span className="settings-slider-label">{label}</span>
      <div className="settings-color-actions">
        <Popover
          trigger="click"
          placement="bottomRight"
          open={disabled ? false : open}
          onOpenChange={nextOpen => setOpen(disabled ? false : nextOpen)}
          classNames={{ root: 'settings-color-popover' }}
          styles={{ body: { padding: 0 } }}
          getPopupContainer={triggerNode => triggerNode.parentElement || document.body}
          content={
            <div className="settings-color-popover__content">
              <ColorPicker color={displayColor} onChange={handleChange} disableAlpha />
            </div>
          }
        >
          <ButtonPrimitive
            active={open}
            className="settings-color-trigger"
            aria-label={label}
            aria-tooltip={label}
            disabled={disabled}
          >
            <span className="settings-color-trigger__alpha" aria-hidden="true" />
            <span
              className="settings-color-trigger__swatch"
              aria-hidden="true"
              style={{ background: displayColor }}
            />
          </ButtonPrimitive>
        </Popover>
        {onClear ? (
          <ButtonPrimitive className="settings-color-clear" disabled={disabled} onClick={onClear}>
            重置
          </ButtonPrimitive>
        ) : null}
      </div>
    </div>
  )
}

function SettingsSection({ title, children }) {
  return (
    <section className="settings-section">
      <h4 className="settings-section__title">{title}</h4>
      <div className="settings-section__body">{children}</div>
    </section>
  )
}

function WindowSettings({
  onChange,
  neumorphismEnabled,
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
  const disableConflictingVisualOptions = Boolean(neumorphismEnabled)

  return (
    <div className="settings-content">
      <Toggle
        label="编辑器边框"
        enabled={codeMirrorBorder}
        disabled={disableConflictingVisualOptions}
        onChange={onChange.bind(null, 'codeMirrorBorder')}
      />
      {codeMirrorBorder ? (
        <SettingsColorField
          label="编辑器边框颜色"
          value={codeMirrorBorderColor}
          disabled={disableConflictingVisualOptions}
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
          disabled={disableConflictingVisualOptions}
          onChange={onChange.bind(null, 'codeMirrorBorderColor')}
        />
      ) : null}
      <div className="settings-split-row">
        <SettingsSlider
          label="圆角"
          value={codeMirrorBorderRadius}
          maxValue={24}
          disabled={disableConflictingVisualOptions}
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
      <Toggle
        label="投影"
        enabled={dropShadow}
        disabled={disableConflictingVisualOptions}
        onChange={onChange.bind(null, 'dropShadow')}
      />
      {dropShadow ? (
        <div className="settings-split-row drop-shadow-options">
          <SettingsSlider
            label="Y 轴偏移"
            value={dropShadowOffsetY}
            disabled={disableConflictingVisualOptions}
            onChange={onChange.bind(null, 'dropShadowOffsetY')}
          />
          <SettingsSlider
            label="模糊半径"
            value={dropShadowBlurRadius}
            disabled={disableConflictingVisualOptions}
            onChange={onChange.bind(null, 'dropShadowBlurRadius')}
          />
        </div>
      ) : null}
      <Toggle
        label="毛玻璃"
        enabled={glassEffect}
        disabled={disableConflictingVisualOptions}
        onChange={onChange.bind(null, 'glassEffect')}
      />
      {glassEffect ? (
        <SettingsSlider
          label="模糊强度"
          value={glassBlurRadius}
          disabled={disableConflictingVisualOptions}
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

function NeumorphismSettings({
  onChange,
  backgroundMode,
  backgroundColor,
  backgroundGradient,
  neumorphismEnabled,
  neumorphismColor,
  neumorphismColorMode,
  neumorphismGradientStart,
  neumorphismGradientEnd,
  neumorphismGradientAngle,
  neumorphismShape,
  neumorphismLightSource,
  neumorphismDistance,
  neumorphismBlur,
  neumorphismIntensity,
  neumorphismRadius,
}) {
  const isImageBackground = backgroundMode === 'image'
  const resolvedColorMode = backgroundGradient ? 'gradient' : neumorphismColorMode || 'solid'
  const showNeumorphismOptions = Boolean(neumorphismEnabled) && !isImageBackground
  const solidBackgroundColor = backgroundColor || DEFAULT_SETTINGS.neumorphismColor
  const gradientDefaults = React.useMemo(
    () => resolveNeumorphismGradientDefaults(backgroundGradient),
    [backgroundGradient],
  )

  return (
    <div className="settings-content">
      <Toggle
        label="启用拟态"
        enabled={neumorphismEnabled}
        disabled={isImageBackground}
        onChange={onChange.bind(null, 'neumorphismEnabled')}
      />
      {showNeumorphismOptions && resolvedColorMode === 'gradient' ? (
        <>
          <HexColorField
            label="起始色"
            value={neumorphismGradientStart}
            fallbackColor={neumorphismGradientStart || DEFAULT_SETTINGS.neumorphismGradientStart}
            disabled={isImageBackground}
            onChange={onChange.bind(null, 'neumorphismGradientStart')}
            onClear={onChange.bind(null, 'neumorphismGradientStart', gradientDefaults.start)}
          />
          <HexColorField
            label="结束色"
            value={neumorphismGradientEnd}
            fallbackColor={neumorphismGradientEnd || DEFAULT_SETTINGS.neumorphismGradientEnd}
            disabled={isImageBackground}
            onChange={onChange.bind(null, 'neumorphismGradientEnd')}
            onClear={onChange.bind(null, 'neumorphismGradientEnd', gradientDefaults.end)}
          />
          <SettingsSlider
            label="渐变角度"
            value={neumorphismGradientAngle}
            minValue={0}
            maxValue={360}
            disabled={isImageBackground}
            unit="deg"
            serializeValue={nextValue => nextValue}
            onChange={onChange.bind(null, 'neumorphismGradientAngle')}
          />
        </>
      ) : null}
      {showNeumorphismOptions && resolvedColorMode !== 'gradient' ? (
        <HexColorField
          label="单色基色"
          value={neumorphismColor}
          fallbackColor={solidBackgroundColor}
          disabled={isImageBackground}
          onChange={onChange.bind(null, 'neumorphismColor')}
          onClear={onChange.bind(null, 'neumorphismColor', solidBackgroundColor)}
        />
      ) : null}
      {showNeumorphismOptions ? (
        <>
          <div className="settings-row settings-radio-row">
            <span className="settings-slider-label">形状</span>
            <Radio.Group
              className="settings-radio-group settings-radio-group--wide settings-radio-group--iconic"
              optionType="button"
              buttonStyle="solid"
              value={neumorphismShape || DEFAULT_SETTINGS.neumorphismShape}
              onChange={event => onChange('neumorphismShape', event.target.value)}
            >
              {NEUMORPHISM_SHAPE_OPTIONS.map(({ id, name }) => (
                <Radio.Button key={id} value={id} aria-label={name}>
                  <NeumorphismShapeIcon shape={id} label={name} />
                </Radio.Button>
              ))}
            </Radio.Group>
          </div>
          <div className="settings-row settings-radio-row">
            <span className="settings-slider-label">光源</span>
            <Radio.Group
              className="settings-radio-group settings-radio-group--wide"
              optionType="button"
              buttonStyle="solid"
              value={neumorphismLightSource || DEFAULT_SETTINGS.neumorphismLightSource}
              onChange={event => onChange('neumorphismLightSource', event.target.value)}
            >
              {NEUMORPHISM_LIGHT_OPTIONS.map(({ id, name }) => (
                <Radio.Button key={id} value={id}>
                  {name}
                </Radio.Button>
              ))}
            </Radio.Group>
          </div>
          <SettingsSlider
            label="距离"
            value={neumorphismDistance}
            minValue={0}
            maxValue={80}
            unit="px"
            serializeValue={nextValue => nextValue}
            onChange={onChange.bind(null, 'neumorphismDistance')}
          />
          <SettingsSlider
            label="模糊"
            value={neumorphismBlur}
            minValue={0}
            maxValue={140}
            unit="px"
            serializeValue={nextValue => nextValue}
            onChange={onChange.bind(null, 'neumorphismBlur')}
          />
          <SettingsSlider
            label="强度"
            value={
              Number.parseFloat(neumorphismIntensity || DEFAULT_SETTINGS.neumorphismIntensity) * 100
            }
            minValue={1}
            maxValue={60}
            unit="%"
            serializeValue={nextValue => serializeNumericValue(nextValue / 100)}
            onChange={onChange.bind(null, 'neumorphismIntensity')}
          />
          <SettingsSlider
            label="圆角"
            value={neumorphismRadius}
            minValue={0}
            maxValue={120}
            unit="px"
            serializeValue={nextValue => nextValue}
            onChange={onChange.bind(null, 'neumorphismRadius')}
          />
        </>
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
        title="字体"
        uploadLabel="上传字体 +"
        selected={font}
        onUpload={onUpload}
        onChange={onChange.bind(null, 'fontFamily')}
      />
      <SettingsSlider
        label="字号"
        value={size}
        minValue={12}
        maxValue={24}
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

function WatermarkSettings({
  onChange,
  onWatermarkFontChange,
  onWatermarkFontUpload,
  watermark,
  watermarkMode,
  watermarkOpacity,
  watermarkScale,
  watermarkOffsetX,
  watermarkOffsetY,
  watermarkText,
  watermarkFontFamily,
  watermarkTextSize,
  watermarkTextKerning,
  watermarkStrokeColor,
  watermarkStrokeWidth,
  watermarkFillEnabled,
  watermarkFillColor,
}) {
  const handleTextChange = React.useCallback(
    event => {
      onChange('watermarkText', event.target.value.replace(/[\r\n]+/g, ' '))
    },
    [onChange],
  )

  return (
    <div className="settings-content">
      <Toggle label="水印" enabled={watermark} onChange={onChange.bind(null, 'watermark')} />
      {watermark ? (
        <>
          <SettingsSlider
            label="透明度"
            value={serializeNumericValue(Number.parseFloat(watermarkOpacity || '0.75') * 100, 0)}
            minValue={0}
            maxValue={100}
            step={5}
            unit="%"
            serializeValue={nextValue => serializeNumericValue(nextValue / 100)}
            onChange={onChange.bind(null, 'watermarkOpacity')}
          />
          <SettingsSlider
            label="缩放"
            value={watermarkScale}
            minValue={0.25}
            maxValue={4}
            step={0.05}
            unit="x"
            serializeValue={nextValue => serializeNumericValue(nextValue)}
            onChange={onChange.bind(null, 'watermarkScale')}
          />
          <SettingsSlider
            label="偏移 X"
            value={watermarkOffsetX}
            minValue={-240}
            maxValue={240}
            step={1}
            unit="px"
            onChange={onChange.bind(null, 'watermarkOffsetX')}
          />
          <SettingsSlider
            label="偏移 Y"
            value={watermarkOffsetY}
            minValue={-240}
            maxValue={240}
            step={1}
            unit="px"
            onChange={onChange.bind(null, 'watermarkOffsetY')}
          />
          <div className="settings-row settings-radio-row">
            <span className="settings-slider-label">模式</span>
            <Radio.Group
              className="settings-radio-group"
              optionType="button"
              buttonStyle="solid"
              value={watermarkMode || 'logo'}
              onChange={event => onChange('watermarkMode', event.target.value)}
            >
              {WATERMARK_MODE_OPTIONS.map(({ id, name }) => (
                <Radio.Button key={id} value={id}>
                  {name}
                </Radio.Button>
              ))}
            </Radio.Group>
          </div>
          {watermarkMode === 'text-svg' ? (
            <>
              <SettingsSection title="文字设置">
                <div className="settings-row first-line-number-row">
                  <Input
                    label="文字"
                    value={watermarkText}
                    onChange={handleTextChange}
                    align="left"
                    fieldClassName="settings-inline-field settings-inline-field--wide"
                  />
                </div>
                <FontSelect
                  title="字体"
                  uploadLabel="上传字体 +"
                  selected={watermarkFontFamily}
                  onChange={onWatermarkFontChange}
                  onUpload={onWatermarkFontUpload}
                />
                <SettingsSlider
                  label="文字尺寸"
                  value={watermarkTextSize}
                  minValue={24}
                  maxValue={160}
                  step={1}
                  unit="px"
                  onChange={onChange.bind(null, 'watermarkTextSize')}
                />
                <Toggle
                  label="字距 / 连字"
                  enabled={watermarkTextKerning}
                  onChange={onChange.bind(null, 'watermarkTextKerning')}
                />
              </SettingsSection>
              <SettingsSection title="描边">
                <SettingsColorField
                  label="描边颜色"
                  value={watermarkStrokeColor}
                  fallbackColor={DEFAULT_WATERMARK_STROKE_COLOR}
                  onChange={onChange.bind(null, 'watermarkStrokeColor')}
                  onClear={onChange.bind(
                    null,
                    'watermarkStrokeColor',
                    DEFAULT_WATERMARK_STROKE_COLOR,
                  )}
                />
                <SettingsSlider
                  label="描边宽度"
                  value={watermarkStrokeWidth}
                  minValue={0}
                  maxValue={12}
                  step={0.5}
                  unit="px"
                  serializeValue={nextValue => `${nextValue}px`}
                  onChange={onChange.bind(null, 'watermarkStrokeWidth')}
                />
              </SettingsSection>
              <SettingsSection title="填充">
                <Toggle
                  label="启用填充"
                  enabled={watermarkFillEnabled !== false}
                  onChange={onChange.bind(null, 'watermarkFillEnabled')}
                />
                {watermarkFillEnabled !== false ? (
                  <SettingsColorField
                    label="填充颜色"
                    value={watermarkFillColor}
                    fallbackColor={DEFAULT_WATERMARK_FILL_COLOR}
                    onChange={onChange.bind(null, 'watermarkFillColor')}
                    onClear={onChange.bind(
                      null,
                      'watermarkFillColor',
                      DEFAULT_WATERMARK_FILL_COLOR,
                    )}
                  />
                ) : null}
              </SettingsSection>
            </>
          ) : null}
        </>
      ) : null}
    </div>
  )
}

function MiscSettings({ format, reset, applyPreset, settings }) {
  const inputRef = React.useRef(null)
  let download
  const sectionedSettings = React.useMemo(() => prepareConfigForExport(settings), [settings])

  try {
    download = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(sectionedSettings))}`
  } catch {
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
              applyPreset(prepareConfigForImport(json))
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
        data-layout="stacked"
        data-tone="accent"
        data-cy="format-code-button"
      >
        美化代码
      </ButtonPrimitive>
      <ButtonPrimitive
        fullWidth
        onClick={reset}
        className="settings-misc-button"
        data-layout="stacked"
        data-tone="danger"
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
  const [selectedMenu, setSelectedMenu] = React.useState('Templates')
  const [previousSettings, setPreviousSettings] = React.useState(null)
  const [open, setOpen] = React.useState(false)

  React.useEffect(() => {
    void getPresets().then(storedPresets => {
      if (storedPresets?.length) {
        setPresets(currentPresets => [...storedPresets, ...currentPresets])
      }
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
