import React from 'react'
import { Alert } from 'antd'

const Overlay = props => (
  <div className="dnd-container">
    {props.isOver ? (
      <div className="dnd-overlay">
        <Alert className="dnd-overlay-alert" showIcon type="info" title={props.title} />
      </div>
    ) : null}
    {props.children}
  </div>
)

export default Overlay
