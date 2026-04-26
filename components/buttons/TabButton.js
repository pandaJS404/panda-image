import React from 'react'

import ButtonPrimitive from './ButtonPrimitive'

const TabButton = React.forwardRef(({ className = '', active = false, ...props }, ref) => (
  <ButtonPrimitive
    ref={ref}
    fullWidth
    active={active}
    className={`tab-button${className ? ` ${className}` : ''}`}
    {...props}
  />
))

export default TabButton
