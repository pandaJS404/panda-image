import React from 'react'

const numericPattern = /^-?\d+(?:\.\d+)?$/u

function isNumericSize(value) {
  return typeof value === 'number' || (typeof value === 'string' && numericPattern.test(value))
}

function resolveWidthFromSize(size, component) {
  if (!isNumericSize(size)) {
    return undefined
  }

  const intrinsicWidth = component?.intrinsicWidth
  const intrinsicHeight = component?.intrinsicHeight

  if (!intrinsicWidth || !intrinsicHeight) {
    return undefined
  }

  return (Number(size) * intrinsicWidth) / intrinsicHeight
}

function SvgAsset(
  { component: AssetComponent, size, width, height, color, className, style, ...rest },
  ref,
) {
  if (!AssetComponent) {
    return null
  }

  let resolvedWidth = width
  let resolvedHeight = height

  if (size != null) {
    if (resolvedHeight == null) {
      resolvedHeight = size
    }

    if (resolvedWidth == null) {
      resolvedWidth = resolveWidthFromSize(size, AssetComponent)
    }
  }

  const mergedStyle = color == null ? style : { ...style, color }
  const sizeProps = {}

  if (resolvedWidth != null) {
    sizeProps.width = resolvedWidth
  }

  if (resolvedHeight != null) {
    sizeProps.height = resolvedHeight
  }

  return (
    <AssetComponent {...rest} ref={ref} {...sizeProps} className={className} style={mergedStyle} />
  )
}

export default React.memo(React.forwardRef(SvgAsset))
