import morph from 'morphmorph'
import omitBy from 'lodash.omitby'
import { htmlUnescape } from 'escape-goat'

const SETTINGS_KEY = 'PANDA_STATE'
const PRESETS_KEY = 'PANDA_PRESETS'
const THEMES_KEY = 'PANDA_THEMES'
const WATERMARK_FONT_ASSET_KEY = 'PANDA_WATERMARK_FONT_ASSET'
const BACKGROUND_IMAGE_ASSET_KEY = 'PANDA_BACKGROUND_IMAGE_ASSET'
const STORAGE_QUOTA_ERROR_PATTERN = /quota/iu

const createAssigner = key => {
  const assign = morph.assign(key)

  return v => assign(localStorage, JSON.stringify(v))
}

const map = fn => obj => obj.map(fn)
export const omit = keys => object => omitBy(object, (_, k) => keys.indexOf(k) > -1)

export const saveSettings = morph.compose(
  createAssigner(SETTINGS_KEY),
  omit([
    'code',
    'backgroundImage',
    'backgroundImageSelection',
    'themes',
    'highlights',
    'fontUrl',
    'watermarkFontUrl',
    'selectedLines',
    'name',
  ])
)
export const savePresets = morph.compose(
  createAssigner(PRESETS_KEY),
  map(omit(['backgroundImageSelection']))
)
export const saveThemes = createAssigner(THEMES_KEY)

const parse = v => {
  try {
    return JSON.parse(v)
  } catch (e) {
    // pass
  }
}

function isQuotaExceededError(error) {
  return Boolean(
    error &&
      (error.name === 'QuotaExceededError' ||
        error.code === 22 ||
        error.code === 1014 ||
        STORAGE_QUOTA_ERROR_PATTERN.test(error.message || ''))
  )
}

export const toggle = stateField => state => ({ [stateField]: !state[stateField] })

// https://gist.github.com/alexgibson/1704515
export const escapeHtml = s => {
  if (typeof s === 'string') {
    return s.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\//g, '&#x2F;')
  }
}

export const unescapeHtml = s => {
  if (typeof s === 'string') {
    return htmlUnescape(s).replace(/&#x2F;/g, '/')
  }
}

export const getSettings = morph.compose(parse, escapeHtml, morph.get(SETTINGS_KEY))

export const getPresets = morph.compose(parse, morph.get(PRESETS_KEY))

export const getThemes = morph.compose(parse, morph.get(THEMES_KEY))
export const getWatermarkFontAsset = morph.compose(parse, morph.get(WATERMARK_FONT_ASSET_KEY))
export const getBackgroundImageAsset = morph.compose(parse, morph.get(BACKGROUND_IMAGE_ASSET_KEY))

export const clearSettings = () => localStorage.removeItem(SETTINGS_KEY)
export const clearWatermarkFontAsset = () => localStorage.removeItem(WATERMARK_FONT_ASSET_KEY)
export const clearBackgroundImageAsset = () => localStorage.removeItem(BACKGROUND_IMAGE_ASSET_KEY)
export const saveWatermarkFontAsset = value => {
  if (value == null) {
    clearWatermarkFontAsset()
    return
  }

  return createAssigner(WATERMARK_FONT_ASSET_KEY)(value)
}

export const saveBackgroundImageAsset = value => {
  if (value == null) {
    clearBackgroundImageAsset()
    return true
  }

  try {
    createAssigner(BACKGROUND_IMAGE_ASSET_KEY)(value)
    return true
  } catch (error) {
    if (isQuotaExceededError(error)) {
      return false
    }

    throw error
  }
}

export const fileToDataURL = blob =>
  new Promise(res => {
    const reader = new FileReader()
    reader.onload = e => res(e.target.result)
    reader.readAsDataURL(blob)
  })

export const fileToJSON = blob =>
  new Promise(res => {
    const reader = new FileReader()
    reader.onload = e => res(parse(e.target.result))
    reader.readAsText(blob)
  })

const PRETTIER_PLUGIN_IMPORTERS = {
  babel: () => import('prettier/plugins/babel'),
  estree: () => import('prettier/plugins/estree'),
  graphql: () => import('prettier/plugins/graphql'),
  html: () => import('prettier/plugins/html'),
  markdown: () => import('prettier/plugins/markdown'),
  postcss: () => import('prettier/plugins/postcss'),
  typescript: () => import('prettier/plugins/typescript'),
  yaml: () => import('prettier/plugins/yaml'),
}

const PRETTIER_PARSER_CANDIDATES = {
  'application/json': ['json'],
  'application/typescript': ['typescript'],
  'text/typescript-jsx': ['typescript'],
  css: ['css'],
  graphql: ['graphql'],
  gql: ['graphql'],
  html: ['html'],
  htmlmixed: ['html'],
  javascript: ['babel'],
  js: ['babel'],
  json: ['json'],
  jsx: ['babel'],
  less: ['less'],
  markdown: ['markdown'],
  md: ['markdown'],
  sass: ['scss'],
  scss: ['scss'],
  ts: ['typescript'],
  tsx: ['typescript'],
  typescript: ['typescript'],
  vue: ['vue'],
  xml: ['html'],
  yaml: ['yaml'],
  yml: ['yaml'],
}

const PRETTIER_PARSER_PLUGINS = {
  babel: ['babel', 'estree'],
  css: ['postcss'],
  graphql: ['graphql'],
  html: ['html'],
  json: ['babel', 'estree'],
  less: ['postcss'],
  markdown: ['markdown'],
  scss: ['postcss'],
  typescript: ['typescript', 'estree'],
  vue: ['html'],
  yaml: ['yaml'],
}

let prettierRuntimePromise
const EXPORT_DEFAULT_OBJECT_PATTERN = /^(\s*export\s+default)([\t \r\n]+)([\s\S]+)$/

const resolveModule = module => module.default || module

function normalizeExportDefaultObject(code) {
  const match = code.match(EXPORT_DEFAULT_OBJECT_PATTERN)

  if (!match) {
    return code
  }

  const [, prefix, separator, body] = match
  const firstMeaningfulLine = body
    .split(/\r?\n/)
    .map(line => line.trim())
    .find(Boolean)

  if (!firstMeaningfulLine || firstMeaningfulLine.startsWith('{')) {
    return code
  }

  const looksLikeObjectMember =
    /^[A-Za-z_$][\w$-]*\s*:/.test(firstMeaningfulLine) ||
    /^['"][^'"]+['"]\s*:/.test(firstMeaningfulLine) ||
    /^\.\.\./.test(firstMeaningfulLine)

  if (!looksLikeObjectMember) {
    return code
  }

  return `${prefix} {${separator}${body.trimEnd()}\n}`
}

async function loadPrettierRuntime() {
  if (!prettierRuntimePromise) {
    prettierRuntimePromise = Promise.all([
      import('prettier/standalone'),
      ...Object.values(PRETTIER_PLUGIN_IMPORTERS).map(loadPlugin => loadPlugin()),
    ]).then(([prettierModule, ...pluginModules]) => {
      const pluginKeys = Object.keys(PRETTIER_PLUGIN_IMPORTERS)
      const plugins = pluginKeys.reduce((allPlugins, key, index) => {
        allPlugins[key] = resolveModule(pluginModules[index])
        return allPlugins
      }, {})

      return {
        prettier: resolveModule(prettierModule),
        plugins,
      }
    })
  }

  return prettierRuntimePromise
}

function getParserCandidates(language) {
  if (!language) {
    return ['babel']
  }

  return PRETTIER_PARSER_CANDIDATES[language] || ['babel']
}

export const formatCode = async (code, language) => {
  const { prettier, plugins } = await loadPrettierRuntime()
  const parserCandidates = getParserCandidates(language)
  const normalizedCode = normalizeExportDefaultObject(code)
  const codeCandidates = normalizedCode === code ? [code] : [code, normalizedCode]
  let lastError

  for (const currentCode of codeCandidates) {
    for (const parser of parserCandidates) {
      try {
        return await prettier.format(currentCode, {
          parser,
          plugins: (PRETTIER_PARSER_PLUGINS[parser] || []).map(pluginName => plugins[pluginName]),
          semi: false,
          singleQuote: true,
        })
      } catch (error) {
        lastError = error
      }
    }
  }

  throw lastError || new Error('Unable to format the current code block.')
}

export const stringifyColor = obj => `rgba(${obj.rgb.r},${obj.rgb.g},${obj.rgb.b},${obj.rgb.a})`

export const generateId = () => Math.random().toString(36).slice(2)
