import React from 'react'
import { Button as AntButton } from 'antd'
import { VisuallyHidden } from '@reach/visually-hidden'
import { syncDomAttribute } from '../../src/shared/react/hooks'

const noop = () => {}

const ButtonPrimitive = React.forwardRef(
  (
    {
      className = '',
      onClick = noop,
      disabled = false,
      active = false,
      selected = false,
      fullWidth = false,
      iconOnly = false,
      children,
      title,
      'aria-tooltip': ariaTooltip,
      loading = false,
      href,
      htmlType = 'button',
      style,
      color,
      variant,
      size = 'middle',
      classNames,
      styles,
      ...props
    },
    ref
  ) => {
    const tooltipKey = React.useId()

    React.useEffect(() => {
      if (typeof document === 'undefined') {
        return
      }

      const element = document.querySelector(`[data-aria-tooltip-key="${tooltipKey}"]`)
      syncDomAttribute(element, 'aria-tooltip', ariaTooltip)
    }, [ariaTooltip, tooltipKey])

    const handleClick = event => {
      if (disabled) {
        event.preventDefault()
        return
      }

      onClick(event)
    }

    return (
      <AntButton
        ref={ref}
        href={href}
        htmlType={href ? undefined : htmlType}
        onClick={handleClick}
        disabled={href ? undefined : disabled}
        loading={loading}
        block={fullWidth}
        color={color}
        variant={variant}
        size={size}
        data-disabled={disabled || undefined}
        data-active={active || undefined}
        data-selected={selected || undefined}
        data-full-width={fullWidth || undefined}
        data-icon-only={iconOnly || undefined}
        data-aria-tooltip-key={ariaTooltip ? tooltipKey : undefined}
        autoInsertSpace={false}
        className={`panda-button${className ? ` ${className}` : ''}`}
        classNames={{
          content: 'panda-button__content',
          icon: 'panda-button__icon',
          ...classNames,
        }}
        styles={styles}
        style={style}
        {...props}
      >
        {title ? <VisuallyHidden>{title}</VisuallyHidden> : null}
        {children}
      </AntButton>
    )
  }
)

export default ButtonPrimitive
