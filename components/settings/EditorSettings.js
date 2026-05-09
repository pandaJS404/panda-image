import React from 'react'

import FontSelect from '../FontSelect'
import Input from '../Input'
import Toggle from '../Toggle'
import { SettingsSlider } from './SettingsShared'

export default function EditorSettings({
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
