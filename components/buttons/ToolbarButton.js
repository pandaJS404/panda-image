import React from 'react'

import ButtonPrimitive from './ButtonPrimitive'

const ToolbarButton = React.forwardRef(
  (
    {
      className = '',
      tone = 'default',
      segment = 'single',
      justify = 'start',
      active = false,
      iconOnly = false,
      fullWidth = false,
      ...props
    },
    ref,
  ) => (
    <ButtonPrimitive
      ref={ref}
      active={active}
      iconOnly={iconOnly}
      fullWidth={fullWidth}
      className={`toolbar-button${className ? ` ${className}` : ''}`}
      data-tone={tone}
      data-segment={segment}
      data-justify={justify}
      {...props}
    />
  ),
)

export default ToolbarButton
