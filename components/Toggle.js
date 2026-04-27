import React from 'react'
import { CheckOutlined, CloseOutlined } from '@ant-design/icons'
import { Switch } from 'antd'

function Toggle({ className = '', enabled, label, onChange, disabled = false }) {
  return (
    <div className={`toggle ${className}`.trim()} data-disabled={disabled || undefined}>
      <span className="toggle-label">{label}</span>
      <Switch
        checked={enabled}
        checkedChildren={<CheckOutlined />}
        unCheckedChildren={<CloseOutlined />}
        onChange={onChange}
      />
    </div>
  )
}

export default Toggle
