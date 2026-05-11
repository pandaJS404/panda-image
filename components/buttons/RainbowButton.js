import React from 'react'

import ButtonPrimitive from './ButtonPrimitive'

const RainbowButton = React.forwardRef(
  (
    {
      className = '',
      labelClassName = '',
      icon = null,
      children,
      fullWidth = false,
      ...props
    },
    ref,
  ) => (
    <ButtonPrimitive
      ref={ref}
      fullWidth={fullWidth}
      className={`rainbow-button${className ? ` ${className}` : ''}`}
      {...props}
    >
      <span className={`rainbow-button__label${labelClassName ? ` ${labelClassName}` : ''}`}>{children}</span>
      {icon ? <span className="rainbow-button__icon">{icon}</span> : null}
    </ButtonPrimitive>
  ),
)

export default RainbowButton
