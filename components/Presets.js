import React from 'react'
import { DeleteOutlined } from '@ant-design/icons'

import ButtonPrimitive from './buttons/ButtonPrimitive'

const WINDOW_THEME_LABELS = {
  none: '无窗口',
  bw: '黑白窗口',
  boxy: '方形窗口',
  sharp: '无窗口',
}

function getTemplateTitle(preset, index) {
  if (preset.name) {
    return preset.name
  }

  return preset.custom ? `我的模板 ${index + 1}` : `模板 ${index + 1}`
}

function getTemplateDescription(preset) {
  const details = []
  const theme = preset.theme || '默认主题'
  const windowTheme = WINDOW_THEME_LABELS[preset.windowTheme || 'none'] || '窗口样式'

  details.push(theme)
  details.push(windowTheme)

  if (preset.backgroundMode === 'image') {
    details.push('图片背景')
  } else if (preset.backgroundGradient) {
    details.push('渐变背景')
  } else if (preset.backgroundColor) {
    details.push('纯色背景')
  }

  if (preset.dropShadow) {
    details.push('投影')
  }

  if (preset.glassEffect) {
    details.push('毛玻璃')
  }

  return details.filter(Boolean).slice(0, 4).join(' · ') || '快速套用当前视觉风格'
}

const Preset = React.memo(({ remove, apply, selected, preset, title, description }) => {
  const isSelected = preset.id === selected

  const handleApply = () => {
    if (!isSelected) {
      apply(preset)
    }
  }

  return (
    <div className="preset-container">
      <ButtonPrimitive
        fullWidth
        active={isSelected}
        className="preset-preview-button"
        onClick={handleApply}
        aria-tooltip={`应用模板 ${title}`}
      >
        <span
          className="preset-preview-image"
          style={{
            backgroundImage: `url('${preset.icon}')`,
            backgroundColor: preset.backgroundColor,
          }}
        />
        <span className="preset-card-body">
          <span className="preset-card-title">{title}</span>
          <span className="preset-card-description">{description}</span>
        </span>
      </ButtonPrimitive>
      {preset.custom ? (
        <ButtonPrimitive
          iconOnly
          onClick={() => remove(preset.id)}
          className="preset-remove-button"
          aria-tooltip="移除模板"
        >
          <DeleteOutlined />
        </ButtonPrimitive>
      ) : null}
    </div>
  )
})

const Presets = React.memo(
  ({ create, creating, undo, presets, selected, remove, apply, applied, contentRef }) => {
    const customPresets = presets.filter(preset => preset.custom)
    const defaultPresets = presets.filter(preset => !preset.custom)
    const renderPreset = (preset, index) => (
      <Preset
        key={preset.id}
        remove={remove}
        apply={apply}
        preset={preset}
        selected={selected}
        title={getTemplateTitle(preset, index)}
        description={getTemplateDescription(preset)}
      />
    )

    return (
      <div className="settings-presets">
        <div className="settings-presets-header">
          <ButtonPrimitive
            fullWidth
            onClick={create}
            loading={creating}
            className="settings-presets-create-button"
          >
            {creating ? '保存中…' : '存为模板'}
          </ButtonPrimitive>
        </div>
        <div className="settings-presets-content" ref={contentRef} role="radiogroup">
          <div className="settings-presets-group-title">个人模板</div>
          {customPresets.length === 0 ? (
            <div className="settings-presets-empty">保存当前样式后会出现在这里</div>
          ) : null}
          {customPresets.map(renderPreset)}
          <div className="settings-presets-group-title">系统模板</div>
          {defaultPresets.map(renderPreset)}
        </div>
        {applied ? (
          <div className="settings-presets-applied">
            <span>已应用模板</span>

            <button type="button" onClick={undo} className="settings-presets-undo">
              撤销 <span>&#x21A9;</span>
            </button>
          </div>
        ) : null}
      </div>
    )
  },
)

export default Presets
