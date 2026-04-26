import React from 'react'

import Input from '../Input'
import ListSetting from '../ListSetting'
import ColorPicker from '../ColorPicker'
import ButtonPrimitive from '../buttons/ButtonPrimitive'
import { HIGHLIGHT_KEYS } from '../../src/modules/editor/config'
import { stringifyColor, generateId } from '../../src/shared/utils'

const colorPresets = []
const HIGHLIGHT_LABELS = {
  background: '背景（Background）',
  text: '文本（Text）',
  variable: '变量（Variable）',
  attribute: '属性（Attribute）',
  definition: '定义（Definition）',
  keyword: '关键字（Keyword）',
  operator: '运算符（Operator）',
  property: '属性名（Property）',
  number: '数字（Number）',
  string: '字符串（String）',
  comment: '注释（Comment）',
  meta: '元信息（Meta）',
  tag: '标签（Tag）',
}

const getHighlightLabel = key => HIGHLIGHT_LABELS[key] || key

const HighlightPicker = ({ title, onChange, color }) => (
  <div className="theme-create-highlight-picker">
    <div className="theme-create-color-picker-header">
      <span>{getHighlightLabel(title)}</span>
    </div>
    <ColorPicker key={title} color={color} onChange={onChange} presets={colorPresets} />
  </div>
)

const ThemeCreate = ({
  theme,
  themes,
  highlights,
  create,
  updateHighlights,
  name,
  onInputChange,
}) => {
  const [preset, updatePreset] = React.useState(theme.id)
  const [highlight, selectHighlight] = React.useState()

  return (
    <div className="theme-create-panel">
      <div className="theme-create-popup__body">
        <div className="theme-create-settings">
          <div className="theme-create-field theme-create-name-field">
            <span style={{ width: '50px' }}>名称</span>
            <Input
              title="名称"
              name="name"
              placeholder="自定义主题"
              value={name}
              onChange={onInputChange}
              maxLength="32"
              fieldClassName="theme-create-name-input"
            />
          </div>
          <div className="theme-create-select">
            <ListSetting
              title="基础主题"
              items={themes}
              selected={preset}
              onOpen={() => selectHighlight(null)}
              onChange={id => {
                updatePreset(id)
                updateHighlights(themes.find(currentTheme => currentTheme.id === id).highlights)
              }}
            >
              {({ name: themeName }) => <span>{themeName}</span>}
            </ListSetting>
          </div>
          <div className="theme-create-colors">
            {HIGHLIGHT_KEYS.map(key => (
              <div className="theme-create-field" key={key}>
                <ButtonPrimitive
                  fullWidth
                  active={highlight === key}
                  className="theme-create-field-button"
                  onClick={() => selectHighlight(key)}
                >
                  <div className="theme-create-button-row">
                    <span>{getHighlightLabel(key)}</span>
                    <span
                      className="theme-create-color-circle"
                      style={{
                        backgroundColor: highlights[key],
                      }}
                    />
                  </div>
                </ButtonPrimitive>
              </div>
            ))}
          </div>
          <ButtonPrimitive
            fullWidth
            disabled={!name}
            className="theme-create-submit"
            onClick={() =>
              create({
                id: `theme:${generateId()}`,
                name,
                highlights,
                custom: true,
              })
            }
          >
            创建主题 +
          </ButtonPrimitive>
        </div>
        {highlight ? (
          <HighlightPicker
            title={highlight}
            color={highlights[highlight]}
            onChange={color => updateHighlights({ [highlight]: stringifyColor(color) })}
          />
        ) : null}
      </div>
    </div>
  )
}

export default ThemeCreate
