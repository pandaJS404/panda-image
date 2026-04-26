import React from 'react'
import { Slider as AntSlider } from 'antd'

class Slider extends React.Component {
  static defaultProps = {
    onMouseDown: () => {},
    onMouseUp: () => {},
    unit: 'px',
  }

  handleChange = value => {
    this.props.onChange(`${value}${this.props.unit}`)
  }

  render() {
    const minValue = this.props.minValue || 0
    const maxValue = this.props.maxValue || 100
    const step = 'step' in this.props ? this.props.step : 1

    return (
      <div className="slider settings-row">
        <div
          className="slider-bg"
          style={{
            transform: `translate3d(${
              (((parseFloat(this.props.value) - minValue) * 1.0) / (maxValue - minValue)) * 100
            }%, 0px, 0px)`,
          }}
        />
        <label>{this.props.label}</label>
        <AntSlider
          value={parseFloat(this.props.value)}
          className="slider-control"
          onChange={this.handleChange}
          onChangeComplete={this.props.onMouseUp}
          onMouseDownCapture={this.props.onMouseDown}
          onTouchStartCapture={this.props.onMouseDown}
          min={minValue}
          max={maxValue}
          step={step}
          tooltip={{ open: false }}
          styles={{
            track: { background: 'transparent' },
            rail: { background: 'transparent' },
            handle: { opacity: 0 },
          }}
        />
      </div>
    )
  }
}

export default Slider
