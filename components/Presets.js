import React from 'react'
import { DeleteOutlined, DownOutlined, UpOutlined } from '@ant-design/icons'

import ButtonPrimitive from './buttons/ButtonPrimitive'
import { DEFAULT_PRESETS } from '../src/modules/editor/config'

const Preset = React.memo(({ remove, apply, selected, preset }) => {
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
        aria-tooltip={preset.name ? `应用预设 ${preset.name}` : '应用预设'}
        style={{
          backgroundImage: `url('${preset.icon}')`,
          backgroundColor: preset.backgroundColor,
        }}
      />
      {preset.custom ? (
        <ButtonPrimitive
          iconOnly
          onClick={() => remove(preset.id)}
          className="preset-remove-button"
          aria-tooltip="移除预设"
        >
          <DeleteOutlined />
        </ButtonPrimitive>
      ) : null}
    </div>
  )
})

const Presets = React.memo(
  ({ show, create, toggle, undo, presets, selected, remove, apply, applied, contentRef }) => {
    const customPresetsLength = presets.length - DEFAULT_PRESETS.length

    return (
      <div className="settings-presets">
        <div className="settings-presets-header">
          <span>预设</span>
          {show ? (
            <ButtonPrimitive onClick={create} className="settings-presets-create-button">
              新建 +
            </ButtonPrimitive>
          ) : null}
          <ButtonPrimitive
            iconOnly
            onClick={toggle}
            className="settings-presets-toggle"
            aria-tooltip="切换预设列表"
          >
            {show ? <UpOutlined /> : <DownOutlined />}
          </ButtonPrimitive>
        </div>
        {show ? (
          <div className="settings-presets-content" ref={contentRef} role="radiogroup">
            {presets
              .filter(preset => preset.custom)
              .map(preset => (
                <Preset
                  key={preset.id}
                  remove={remove}
                  apply={apply}
                  preset={preset}
                  selected={selected}
                />
              ))}
            {customPresetsLength > 0 ? <div className="settings-presets-divider" /> : null}
            {presets
              .filter(preset => !preset.custom)
              .map(preset => (
                <Preset key={preset.id} apply={apply} preset={preset} selected={selected} />
              ))}
          </div>
        ) : null}
        {show && applied ? (
          <div className="settings-presets-applied">
            <span>已应用预设</span>
            <ButtonPrimitive onClick={undo} className="settings-presets-undo">
              撤销 <span>&#x21A9;</span>
            </ButtonPrimitive>
          </div>
        ) : null}
      </div>
    )
  }
)

export default Presets
