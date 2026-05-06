import React from 'react'
import SketchPicker from 'react-color/lib/Sketch'

import { stringifyColor } from '../src/shared/utils'

export default function ColorPicker(props) {
  const [color, setColor] = React.useState(props.color)
  const { onChange = () => {}, presets, disableAlpha, className = '' } = props

  React.useEffect(() => {
    setColor(currentColor => (currentColor === props.color ? currentColor : props.color))
  }, [props.color])

  return (
    <div className={`panda-color-picker${className ? ` ${className}` : ''}`}>
      <SketchPicker
        className="panda-color-picker-panel"
        onChange={setColor}
        color={typeof color === 'string' ? color : stringifyColor(color)}
        onChangeComplete={onChange}
        presetColors={presets}
        disableAlpha={disableAlpha}
      />
    </div>
  )
}
