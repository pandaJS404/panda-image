import React from 'react'
import { Input as AntInput } from 'antd'

const INPUT_TONES = {
  default: {},
  muted: {
    color: 'var(--text-secondary)',
  },
  brand: {
    color: 'var(--brand-purple)',
  },
  danger: {
    color: 'var(--status-danger)',
  },
  contrast: {
    color: 'var(--surface-1)',
  },
}

const Input = React.forwardRef(
  (
    {
      tone = 'default',
      align = 'right',
      width = '100%',
      fontSize = '12px',
      label,
      fieldClassName = '',
      className = '',
      style,
      size = 'small',
      variant = 'filled',
      status,
      styles,
      classNames,
      ...props
    },
    ref
  ) => {
    const inputId = React.useId()
    const controlId = props.id || inputId
    const toneStyles = INPUT_TONES[tone] || INPUT_TONES.default

    return (
      <div
        className={[
          'panda-input-field',
          `panda-input-field--tone-${tone}`,
          fieldClassName,
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {label && (
          <label className="panda-input-label" htmlFor={controlId}>
            {label}
          </label>
        )}
        <AntInput
          ref={ref}
          id={controlId}
          size={size}
          variant={variant}
          status={status || (tone === 'danger' ? 'error' : undefined)}
          className={`panda-input${className ? ` ${className}` : ''}`}
          classNames={{
            input: 'panda-input__input',
            ...classNames,
          }}
          styles={{
            ...styles,
            input: {
              textAlign: align,
              fontSize,
              ...(styles?.input || {}),
            },
          }}
          style={{
            width,
            ...toneStyles,
            ...style,
          }}
          {...props}
        />
      </div>
    )
  }
)

export default Input
