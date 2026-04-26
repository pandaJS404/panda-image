import React from 'react'

import ToolbarButton from './ToolbarButton'

const ToolbarIconButton = React.forwardRef(({ className = '', ...props }, ref) => (
  <ToolbarButton
    ref={ref}
    iconOnly
    justify="center"
    className={`toolbar-icon-button${className ? ` ${className}` : ''}`}
    {...props}
  />
))

export default ToolbarIconButton
