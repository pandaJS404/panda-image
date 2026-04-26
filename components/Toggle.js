import React from 'react'
import { CheckOutlined, CloseOutlined } from '@ant-design/icons'
import { Switch } from 'antd'

function Toggle({ className = '', enabled, label, onChange, disabled = false }) {
  return (
    <div className={`toggle ${className}`.trim()} data-disabled={disabled || undefined}>
      <span className="toggle-label">{label}</span>
      <span className="toggle-switch-shell" data-checked={enabled || undefined}>
        <Switch checked={enabled} disabled={disabled} className="toggle-control" onChange={onChange} />
        <span className="toggle-state-icon">
          {enabled ? <CheckOutlined /> : <CloseOutlined />}
        </span>
      </span>
    </div>
  )
}

export default Toggle
