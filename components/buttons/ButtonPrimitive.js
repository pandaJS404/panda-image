import React from 'react'
import { Button as AntButton, Tooltip } from 'antd'
import { VisuallyHidden } from '@reach/visually-hidden'

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
      tooltipTitle,
      tooltipPlacement = 'bottom',
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
    const handleClick = event => {
      if (disabled) {
        event.preventDefault()
        return
      }

      onClick(event)
    }

    const buttonNode = (
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

    if (!tooltipTitle) {
      return buttonNode
    }

    return (
      <Tooltip destroyOnHidden placement={tooltipPlacement} title={tooltipTitle}>
        {buttonNode}
      </Tooltip>
    )
  }
)

export default ButtonPrimitive
