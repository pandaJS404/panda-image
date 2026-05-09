import React from 'react'
import { Radio } from 'antd'

import FontSelect from '../FontSelect'
import Input from '../Input'
import Toggle from '../Toggle'
import { SettingsSlider, SettingsColorField, SettingsSection, serializeNumericValue } from './SettingsShared'
import {
  DEFAULT_WATERMARK_FILL_COLOR,
  DEFAULT_WATERMARK_STROKE_COLOR,
} from '../../src/modules/editor/config'

const WATERMARK_MODE_OPTIONS = [
  { id: 'logo', name: 'Panda' },
  { id: 'text-svg', name: '自定义' },
]

export default function WatermarkSettings({
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
