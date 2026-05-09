import React from 'react'
import { Popover, Slider as AntSlider } from 'antd'
import SliderInternalContext from 'antd/es/slider/Context'
import { useKeyboardListener } from '../../src/shared/react/hooks'

import ColorPicker from '../ColorPicker'
import ButtonPrimitive from '../buttons/ButtonPrimitive'
import { stringifyColor } from '../../src/shared/utils'

const SLIDER_HANDLE_RENDER = node => node
const SLIDER_INTERNAL_CONTEXT_VALUE = { handleRender: SLIDER_HANDLE_RENDER }

export function serializeNumericValue(value, precision = 2) {
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

export function KeyboardShortcut({ trigger, handle }) {
  useKeyboardListener(trigger, handle)
  return null
}

export function SettingsSlider({
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

export function SettingsColorField({
  className = '',
  label,
  value,
  onChange,
  fallbackColor,
  onClear,
  clearLabel = '重置',
  disabled = false,
  disableAlpha = false,
}) {
  const [open, setOpen] = React.useState(false)
  const displayColor = value || fallbackColor

  const handleChange = React.useCallback(
    nextColor => {
      if (typeof nextColor === 'string') {
        onChange(nextColor)
        return
      }

      if (disableAlpha && nextColor?.hex) {
        onChange(nextColor.hex)
        return
      }

      if (nextColor?.rgb) {
        onChange(stringifyColor(nextColor))
      }
    },
    [onChange, disableAlpha],
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
              <ColorPicker
                color={displayColor}
                onChange={handleChange}
                disableAlpha={disableAlpha}
              />
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

export function SettingsSection({ title, children }) {
  return (
    <section className="settings-section">
      <h4 className="settings-section__title">{title}</h4>
      <div className="settings-section__body">{children}</div>
    </section>
  )
}
