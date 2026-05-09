import React from 'react'

import ThemeSelect from '../ThemeSelect'
import Toggle from '../Toggle'
import { SettingsSlider, SettingsColorField } from './SettingsShared'
import { DEFAULT_WIDTHS } from '../../src/modules/editor/config'

function getViewportWidthMax() {
  if (typeof window === 'undefined') {
    return DEFAULT_WIDTHS.maxWidth
  }

  return Math.max(DEFAULT_WIDTHS.minWidth, Math.floor(window.innerWidth * 0.9))
}

export default function WindowSettings({
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
