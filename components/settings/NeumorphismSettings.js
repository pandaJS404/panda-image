import React from 'react'
import { Radio } from 'antd'

import SvgAsset from '../svg/SvgAsset'
import NeumorphismFlatAsset from '../svg/assets/mimicry/plane.svg?react'
import NeumorphismPressedAsset from '../svg/assets/mimicry/invagination.svg?react'
import NeumorphismConcaveAsset from '../svg/assets/mimicry/indent.svg?react'
import NeumorphismConvexAsset from '../svg/assets/mimicry/convex.svg?react'
import Toggle from '../Toggle'
import { SettingsSlider, SettingsColorField, serializeNumericValue } from './SettingsShared'
import { DEFAULT_SETTINGS } from '../../src/modules/editor/config'
import { resolveNeumorphismGradientDefaults } from '../../src/modules/editor/gradient'

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

export default function NeumorphismSettings({
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
          <SettingsColorField
            label="起始色"
            value={neumorphismGradientStart}
            fallbackColor={neumorphismGradientStart || DEFAULT_SETTINGS.neumorphismGradientStart}
            disabled={isImageBackground}
            disableAlpha
            onChange={onChange.bind(null, 'neumorphismGradientStart')}
            onClear={onChange.bind(null, 'neumorphismGradientStart', gradientDefaults.start)}
          />
          <SettingsColorField
            label="结束色"
            value={neumorphismGradientEnd}
            fallbackColor={neumorphismGradientEnd || DEFAULT_SETTINGS.neumorphismGradientEnd}
            disabled={isImageBackground}
            disableAlpha
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
        <SettingsColorField
          label="单色基色"
          value={neumorphismColor}
          fallbackColor={solidBackgroundColor}
          disabled={isImageBackground}
          disableAlpha
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
