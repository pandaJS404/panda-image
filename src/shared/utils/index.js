import omitBy from 'lodash.omitby'
import { htmlUnescape } from 'escape-goat'

import {
  clearStorage,
  getSection,
  getStorage,
  migrateLegacyStorage,
  patchSection,
  removeSectionKeysByName,
  setSection,
  setStorage,
} from '../storage/editor-db'
import {
  ASSET_KEYS,
  createSectionedStorageFromState,
  flattenStorageSections,
  normalizeImportedConfig,
  normalizeStorageShape,
  SETTINGS_SECTION_KEYS,
  STORAGE_SECTIONS,
  WATERMARK_ASSET_KEYS,
} from '../storage/editor-config'

export const unescapeHtml = htmlUnescape

export const omit = keys => object => omitBy(object, (_, k) => keys.indexOf(k) > -1)

function parse(value) {
  if (typeof value !== 'string') {
    return value
  }

  try {
    return JSON.parse(value)
  } catch {
    return undefined
  }
}

export const saveSettings = async settings => {
  const storage = await getStorage()
  const nextStorage = createSectionedStorageFromState(settings, storage)
  await setStorage(nextStorage)
}

export const savePresets = async presets =>
  setSection(
    STORAGE_SECTIONS.template,
    {
      ...(await getSection(STORAGE_SECTIONS.template)),
      presets: Array.isArray(presets) ? presets : [],
    },
  )

export const saveThemes = async themes =>
  setSection(
    STORAGE_SECTIONS.theme,
    {
      ...(await getSection(STORAGE_SECTIONS.theme)),
      themes: Array.isArray(themes) ? themes : [],
    },
  )

export const getSettings = async () => {
  const storage = await getStorage()
  const mergedSettings = flattenStorageSections(storage)

  if (typeof mergedSettings.language === 'string') {
    mergedSettings.language = htmlUnescape(mergedSettings.language)
  }

  return mergedSettings
}

export const getPresets = async () => {
  const section = await getSection(STORAGE_SECTIONS.template)
  return Array.isArray(section.presets) ? section.presets : []
}

export const getThemes = async () => {
  const section = await getSection(STORAGE_SECTIONS.theme)
  return Array.isArray(section.themes) ? section.themes : []
}

export const getWatermarkFontAsset = async () => {
  const section = await getSection(STORAGE_SECTIONS.assets)
  return section.watermarkFontUrl || null
}

export const getFontAsset = async () => {
  const section = await getSection(STORAGE_SECTIONS.assets)
  return section.fontUrl || null
}

export const getBackgroundImageAsset = async () => {
  const section = await getSection(STORAGE_SECTIONS.assets)
  const backgroundImage = section.backgroundImage ?? null
  const backgroundImageSource = section.backgroundImageSource ?? null
  const backgroundImageSelection = section.backgroundImageSelection ?? null

  if (
    backgroundImage == null &&
    backgroundImageSource == null &&
    backgroundImageSelection == null
  ) {
    return null
  }

  return {
    image: backgroundImage,
    source: backgroundImageSource,
    selection: backgroundImageSelection,
  }
}

export const clearSettings = () =>
  setStorage(normalizeStorageShape()).then(() => undefined)

export const clearWatermarkFontAsset = () =>
  removeSectionKeysByName(STORAGE_SECTIONS.assets, ['watermarkFontUrl']).then(() => undefined)

export const clearFontAsset = () =>
  removeSectionKeysByName(STORAGE_SECTIONS.assets, ['fontUrl']).then(() => undefined)

export const clearBackgroundImageAsset = () =>
  removeSectionKeysByName(STORAGE_SECTIONS.assets, [
    'backgroundImage',
    'backgroundImageSource',
    'backgroundImageSelection',
  ]).then(() => undefined)

export const saveWatermarkFontAsset = value => {
  if (value == null) {
    return clearWatermarkFontAsset().then(() => true)
  }

  return patchSection(STORAGE_SECTIONS.assets, { watermarkFontUrl: value }).then(() => true)
}

export const saveFontAsset = value => {
  if (value == null) {
    return clearFontAsset().then(() => true)
  }

  return patchSection(STORAGE_SECTIONS.assets, { fontUrl: value }).then(() => true)
}

export const saveBackgroundImageAsset = value => {
  if (value == null) {
    return clearBackgroundImageAsset().then(() => true)
  }

  return patchSection(STORAGE_SECTIONS.assets, {
    backgroundImage: value.image ?? null,
    backgroundImageSource: value.source ?? null,
    backgroundImageSelection: value.selection ?? null,
  }).then(() => true)
}

export const syncLegacyStorage = migrateLegacyStorage
export const clearEditorStorage = clearStorage
export const toSectionedStorage = normalizeImportedConfig
export const toFlatSettings = flattenStorageSections

export const fileToDataURL = blob =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = e => resolve(e.target.result)
    reader.onerror = () => reject(new Error('FileReader failed: unable to read file as DataURL'))
    reader.readAsDataURL(blob)
  })

export const fileToJSON = blob =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = e => resolve(parse(e.target.result))
    reader.onerror = () => reject(new Error('FileReader failed: unable to read file as JSON'))
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

  const [, prefix, , body] = match
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
    firstMeaningfulLine.startsWith('...')

  if (!looksLikeObjectMember) {
    return code
  }

  const normalizedBody = body.trim().replace(/\n\s*\n+/gu, '\n')

  return `${prefix} {\n${normalizedBody}\n}`
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
  const codeCandidates = normalizedCode === code ? [code] : [normalizedCode, code]
  let lastError

  for (const currentCode of codeCandidates) {
    for (const parser of parserCandidates) {
      try {
        const formattedCode = await prettier.format(currentCode, {
          parser,
          plugins: (PRETTIER_PARSER_PLUGINS[parser] || []).map(pluginName => plugins[pluginName]),
          semi: false,
          singleQuote: true,
        })

        return formattedCode.trimEnd()
      } catch (error) {
        lastError = error
      }
    }
  }

  throw lastError || new Error('Unable to format the current code block.')
}

export const stringifyColor = obj => `rgba(${obj.rgb.r},${obj.rgb.g},${obj.rgb.b},${obj.rgb.a})`

export const generateId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2)
