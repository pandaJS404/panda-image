const fs = require('node:fs')
const { defineConfig, transformWithEsbuild } = require('vite')
const react = require('@vitejs/plugin-react')

const jsxDirectoriesPattern = /[\\/](components|src)[\\/].+\.js$/
const svgReactPattern = /\.svg\?react$/u
const normalizeApiOrigin = value => value.replace(/\/api\/?$/u, '').replace(/\/$/u, '')
const apiProxyTarget = normalizeApiOrigin(
  process.env.VITE_API_PROXY_TARGET || process.env.VITE_API_URL || process.env.NEXT_PUBLIC_API_URL || ''
)

const svgRootPattern = /<svg\b([^>]*)>([\s\S]*?)<\/svg>/iu
const svgAttributePattern = /([:@\w-]+)\s*=\s*"([^"]*)"/gu
const svgAttrMap = {
  class: 'className',
  viewbox: 'viewBox',
  'xmlns:xlink': 'xmlnsXlink',
}

const toSvgPropName = name => svgAttrMap[name.toLowerCase()] || name

const parseSvgRoot = svgMarkup => {
  const match = svgMarkup.match(svgRootPattern)

  if (!match) {
    throw new Error('Invalid SVG markup.')
  }

  const [, rawAttributes, innerMarkup] = match
  const rootAttributes = {}

  for (const attributeMatch of rawAttributes.matchAll(svgAttributePattern)) {
    const [, rawName, rawValue] = attributeMatch
    rootAttributes[toSvgPropName(rawName)] = rawValue
  }

  return {
    rootAttributes,
    innerMarkup: innerMarkup.trim(),
  }
}

const serializeRootProps = rootAttributes =>
  Object.entries(rootAttributes)
    .filter(([key]) => key !== 'className' && key !== 'style')
    .map(([key, value]) => `${JSON.stringify(key)}: ${JSON.stringify(value)}`)
    .join(',\n    ')

const createSvgReactModule = svgMarkup => {
  const { rootAttributes, innerMarkup } = parseSvgRoot(svgMarkup)
  const intrinsicWidth = Number.parseFloat(rootAttributes.width)
  const intrinsicHeight = Number.parseFloat(rootAttributes.height)

  return `
import * as React from 'react'

const ROOT_PROPS = {
    ${serializeRootProps(rootAttributes)}
}

const INNER_MARKUP = ${JSON.stringify(innerMarkup)}

const SvgComponent = React.forwardRef(function SvgComponent(props, ref) {
  return React.createElement('svg', {
    ...ROOT_PROPS,
    ...props,
    ref,
    dangerouslySetInnerHTML: { __html: INNER_MARKUP },
  })
})

SvgComponent.intrinsicWidth = ${Number.isFinite(intrinsicWidth) ? intrinsicWidth : 'undefined'}
SvgComponent.intrinsicHeight = ${Number.isFinite(intrinsicHeight) ? intrinsicHeight : 'undefined'}
SvgComponent.viewBox = ${JSON.stringify(rootAttributes.viewBox || '')}

export default SvgComponent
`
}

const svgReactAssetPlugin = {
  name: 'panda-svg-react-asset',
  enforce: 'pre',
  load(id) {
    if (!svgReactPattern.test(id)) {
      return null
    }

    const filepath = id.replace(svgReactPattern, '.svg')
    const svgMarkup = fs.readFileSync(filepath, 'utf8')

    return createSvgReactModule(svgMarkup)
  },
}

module.exports = defineConfig({
  plugins: [
    svgReactAssetPlugin,
    {
      name: 'panda-js-as-jsx',
      enforce: 'pre',
      async transform(code, id) {
        if (!jsxDirectoriesPattern.test(id)) {
          return null
        }

        return transformWithEsbuild(code, id, {
          loader: 'jsx',
          jsx: 'automatic',
        })
      },
    },
    react({
      include: /\.[jt]sx?$/,
    }),
  ],
  envPrefix: ['VITE_', 'NEXT_PUBLIC_'],
  server: {
    port: 3000,
    proxy: apiProxyTarget
      ? {
          '/api': {
            target: apiProxyTarget,
            changeOrigin: true,
            secure: false,
          },
        }
      : undefined,
  },
  preview: {
    host: '127.0.0.1',
    port: 3000,
  },
})
