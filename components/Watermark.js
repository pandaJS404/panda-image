import React from 'react'

import SvgAsset from './svg/SvgAsset'
import { getWatermarkSvgDefinition } from '../src/modules/editor/watermark/textSvg'

const WatermarkAsset = React.lazy(() => import('./svg/assets/watermark.svg?react'))

function toNumber(value, fallback) {
  const numericValue = Number.parseFloat(value)
  return Number.isFinite(numericValue) ? numericValue : fallback
}

function getAutoColors(light) {
  return {
    shadow: light ? '#9E9E9E' : '#616161',
    foreground: light ? '#080808' : '#F7F7F7',
    text: light ? '#000000' : '#FFFFFF',
  }
}

function useWatermarkDefinition(config) {
  const watermarkDefinitionInput = React.useMemo(
    () => ({
      watermarkMode: config.watermarkMode,
      watermarkText: config.watermarkText,
      watermarkFontFamily: config.watermarkFontFamily,
      watermarkFontUrl: config.watermarkFontUrl,
      watermarkTextSize: config.watermarkTextSize,
      watermarkTextKerning: config.watermarkTextKerning,
    }),
    [
      config.watermarkFontFamily,
      config.watermarkFontUrl,
      config.watermarkMode,
      config.watermarkText,
      config.watermarkTextKerning,
      config.watermarkTextSize,
    ],
  )
  const deferredConfig = React.useDeferredValue(watermarkDefinitionInput)
  const deferredConfigKey = React.useMemo(() => JSON.stringify(deferredConfig), [deferredConfig])
  const [definition, setDefinition] = React.useState(null)

  React.useEffect(() => {
    let cancelled = false

    if (deferredConfig.watermarkMode !== 'text-svg') {
      React.startTransition(() => setDefinition(null))
      return () => {
        cancelled = true
      }
    }

    void getWatermarkSvgDefinition(deferredConfig)
      .then(nextDefinition => {
        if (cancelled) {
          return
        }

        React.startTransition(() => {
          setDefinition(nextDefinition)
        })
      })
      .catch(() => {
        if (cancelled) {
          return
        }

        React.startTransition(() => {
          setDefinition(null)
        })
      })

    return () => {
      cancelled = true
    }
  }, [deferredConfig, deferredConfigKey])

  return definition
}

function TextSvgWatermark({ config, light, style }) {
  const definition = useWatermarkDefinition(config)
  const autoColors = React.useMemo(() => getAutoColors(light), [light])
  const fillColor =
    config.watermarkFillEnabled === false
      ? 'none'
      : config.watermarkFillColor || autoColors.foreground
  const strokeWidth = toNumber(config.watermarkStrokeWidth, 0)
  const strokeColor = config.watermarkStrokeColor || autoColors.shadow

  if (!definition?.pathData) {
    return null
  }

  return (
    <div
      className="watermark watermark--text-svg"
      style={{
        ...style,
        lineHeight: 0,
        '--watermark-fill-color': fillColor,
        '--watermark-stroke-color': strokeWidth > 0 ? strokeColor : 'none',
        '--watermark-stroke-width': `${strokeWidth}px`,
      }}
    >
      <svg
        aria-hidden="true"
        focusable="false"
        viewBox={`0 0 ${definition.width} ${definition.height}`}
        width={definition.width}
        height={definition.height}
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d={definition.pathData}
          transform={`translate(${definition.translateX} ${definition.translateY})`}
          fill="var(--watermark-fill-color)"
          stroke="var(--watermark-stroke-color)"
          strokeWidth="var(--watermark-stroke-width)"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
    </div>
  )
}

function LogoWatermark({ style, colors }) {
  return (
    <React.Suspense fallback={null}>
      <SvgAsset
        component={WatermarkAsset}
        className="watermark"
        style={{
          ...style,
          '--watermark-shadow-color': colors.shadow,
          '--watermark-foreground-color': colors.foreground,
          '--watermark-text-color': colors.text,
        }}
      />
    </React.Suspense>
  )
}

function Watermark({ config, light }) {
  const colors = React.useMemo(() => getAutoColors(light), [light])
  const sharedStyle = React.useMemo(
    () => ({
      opacity: config.watermarkOpacity || '0.75',
      transform: `translate(${config.watermarkOffsetX || '0px'}, ${config.watermarkOffsetY || '0px'}) scale(${config.watermarkScale || '1'})`,
      transformOrigin: 'bottom right',
    }),
    [
      config.watermarkOffsetX,
      config.watermarkOffsetY,
      config.watermarkOpacity,
      config.watermarkScale,
    ],
  )

  if (config.watermarkMode === 'text-svg') {
    return <TextSvgWatermark config={config} light={light} style={sharedStyle} />
  }

  return <LogoWatermark style={sharedStyle} colors={colors} />
}

export default React.memo(Watermark)
