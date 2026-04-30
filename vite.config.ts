import fs from 'node:fs'
import { createRequire } from 'node:module'

import react from '@vitejs/plugin-react'
import { transformWithOxc } from 'vite'
import { defineConfig } from 'vite-plus'

const require = createRequire(import.meta.url)
const { randomImageApiMiddleware } = require('./bin/random-image-proxy.js') as {
  randomImageApiMiddleware: (req: unknown, res: unknown, next: () => void) => void
}

const jsxJsPattern = /(?:^|[\\/])(components|src)[\\/].+\.js$/u
const jsxSourcePattern = /(?:^|[\\/])(components|src)[\\/].+\.[jt]sx?$/u
const svgReactPattern = /\.svg\?react$/u
const basePath = process.env.VITE_BASE_PATH || '/'
const isDevToolsEnabled = process.env.VITE_DEVTOOLS === 'true'

const normalizeApiOrigin = (value: string) => value.replace(/\/api\/?$/u, '').replace(/\/$/u, '')
const apiProxyTarget = normalizeApiOrigin(
  process.env.VITE_API_PROXY_TARGET ||
    process.env.VITE_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    '',
)

const svgRootPattern = /<svg\b([^>]*)>([\s\S]*?)<\/svg>/iu
const svgAttributePattern = /([:@\w-]+)\s*=\s*"([^"]*)"/gu
const svgAttrMap = {
  class: 'className',
  viewbox: 'viewBox',
  'xmlns:xlink': 'xmlnsXlink',
}

const toSvgPropName = (name: string) =>
  svgAttrMap[name.toLowerCase() as keyof typeof svgAttrMap] || name

const parseSvgRoot = (svgMarkup: string) => {
  const match = svgMarkup.match(svgRootPattern)

  if (!match) {
    throw new Error('Invalid SVG markup.')
  }

  const [, rawAttributes, innerMarkup] = match
  const rootAttributes: Record<string, string> = {}

  for (const attributeMatch of rawAttributes.matchAll(svgAttributePattern)) {
    const [, rawName, rawValue] = attributeMatch
    rootAttributes[toSvgPropName(rawName)] = rawValue
  }

  return {
    rootAttributes,
    innerMarkup: innerMarkup.trim(),
  }
}

const serializeRootProps = (rootAttributes: Record<string, string>) =>
  Object.entries(rootAttributes)
    .filter(([key]) => key !== 'className' && key !== 'style')
    .map(([key, value]) => `${JSON.stringify(key)}: ${JSON.stringify(value)}`)
    .join(',\n    ')

const createSvgReactModule = (svgMarkup: string) => {
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
  enforce: 'pre' as const,
  load(id: string) {
    if (!svgReactPattern.test(id)) {
      return null
    }

    const filepath = id.replace(svgReactPattern, '.svg')
    const svgMarkup = fs.readFileSync(filepath, 'utf8')

    return createSvgReactModule(svgMarkup)
  },
}

const randomImageApiPlugin = {
  name: 'panda-random-image-api',
  configureServer(server: {
    middlewares: { use: (middleware: typeof randomImageApiMiddleware) => void }
  }) {
    server.middlewares.use(randomImageApiMiddleware)
  },
  configurePreviewServer(server: {
    middlewares: { use: (middleware: typeof randomImageApiMiddleware) => void }
  }) {
    server.middlewares.use(randomImageApiMiddleware)
  },
}

export default defineConfig({
  base: basePath,
  plugins: [
    svgReactAssetPlugin,
    randomImageApiPlugin,
    {
      name: 'panda-js-as-jsx',
      enforce: 'pre',
      async transform(code, id) {
        if (!jsxJsPattern.test(id)) {
          return null
        }

        return transformWithOxc(code, id, {
          lang: 'jsx',
          jsx: {
            runtime: 'automatic',
          },
        })
      },
    },
    react({
      include: jsxSourcePattern,
    }),
  ],
  envPrefix: ['VITE_', 'NEXT_PUBLIC_'],
  devtools: isDevToolsEnabled
    ? {
        enabled: true,
      }
    : undefined,
  fmt: {
    arrowParens: 'avoid',
    ignorePatterns: ['dist/**', 'docs/**', 'node_modules/**', 'public/**'],
    printWidth: 100,
    semi: false,
    singleQuote: true,
  },
  lint: {
    ignorePatterns: ['.next/**', 'dist/**', 'docs/**', 'node_modules/**', 'public/**'],
    options: {
      typeAware: true,
      typeCheck: true,
    },
    rules: {
      'no-console': ['error', { allow: ['error'] }],
    },
  },
  optimizeDeps: {
    rolldownOptions: {
      // Dependency scanning runs before our transform plugin, so teach Rolldown to parse app .js as JSX here too.
      moduleTypes: {
        '.js': 'jsx',
      },
      transform: {
        jsx: {
          runtime: 'automatic',
        },
      },
    },
  },
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
  build: {
    rolldownOptions: isDevToolsEnabled
      ? {
          devtools: {},
        }
      : undefined,
  },
  preview: {
    host: '127.0.0.1',
    port: 3000,
  },
})
