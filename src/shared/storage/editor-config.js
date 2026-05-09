/**
 * @typedef {'template'|'window'|'editor'|'watermark'|'theme'|'code'|'assets'} StorageSectionName
 */

/**
 * @typedef {Object} SectionedStorage
 * @property {Object} template - { preset, presets }
 * @property {Object} window - padding, background, shadow, neumorphism settings
 * @property {Object} editor - language, font, line settings
 * @property {Object} watermark - watermark configuration
 * @property {Object} theme - theme and highlights
 * @property {Object} code - code content, name, export settings
 * @property {Object} assets - fontUrl, backgroundImage, backgroundImageSource, backgroundImageSelection, watermarkFontUrl
 */

/** @type {StorageSectionName[]} */
export const STORAGE_SECTION_LIST = [
  'template',
  'window',
  'editor',
  'watermark',
  'theme',
  'code',
  'assets',
]

export const STORAGE_SECTIONS = STORAGE_SECTION_LIST.reduce((sections, key) => {
  sections[key] = key
  return sections
}, {})

export const SETTINGS_SECTION_KEYS = {
  template: ['preset'],
  window: [
    'paddingVertical',
    'paddingHorizontal',
    'backgroundMode',
    'backgroundColor',
    'backgroundGradient',
    'backgroundGradientBlendMode',
    'glassEffect',
    'glassBlurRadius',
    'dropShadow',
    'dropShadowOffsetY',
    'dropShadowBlurRadius',
    'neumorphismEnabled',
    'neumorphismColor',
    'neumorphismColorMode',
    'neumorphismGradientStart',
    'neumorphismGradientEnd',
    'neumorphismGradientAngle',
    'neumorphismShape',
    'neumorphismLightSource',
    'neumorphismDistance',
    'neumorphismBlur',
    'neumorphismIntensity',
    'neumorphismRadius',
    'windowTheme',
    'codeMirrorBorder',
    'codeMirrorBorderColor',
    'codeMirrorBorderRadius',
    'windowControls',
    'widthAdjustment',
    'width',
  ],
  editor: [
    'language',
    'fontFamily',
    'fontSize',
    'lineHeight',
    'lineNumbers',
    'firstLineNumber',
    'selectedLines',
    'hiddenCharacters',
    'copy',
    'readonly',
    'titleBar',
  ],
  watermark: [
    'watermark',
    'watermarkMode',
    'watermarkOpacity',
    'watermarkScale',
    'watermarkOffsetX',
    'watermarkOffsetY',
    'watermarkText',
    'watermarkFontFamily',
    'watermarkTextSize',
    'watermarkTextKerning',
    'watermarkStrokeColor',
    'watermarkStrokeWidth',
    'watermarkFillEnabled',
    'watermarkFillColor',
  ],
  theme: ['theme', 'highlights'],
  code: ['code', 'name', 'exportSize', 'squaredImage'],
}

export const ASSET_KEYS = [
  'fontUrl',
  'backgroundImage',
  'backgroundImageSource',
  'backgroundImageSelection',
]

export const WATERMARK_ASSET_KEYS = ['watermarkFontUrl']

function normalizeObject(value) {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value
  }

  return {}
}

function pickKeys(source, keys) {
  return keys.reduce((picked, key) => {
    if (source[key] !== undefined) {
      picked[key] = source[key]
    }

    return picked
  }, {})
}

function normalizeStorageSectionValue(section, key, value) {
  if (section === STORAGE_SECTIONS.code && key === 'code' && typeof value !== 'string') {
    return undefined
  }

  if (section === STORAGE_SECTIONS.theme && key === 'theme' && typeof value !== 'string') {
    return undefined
  }

  return value
}

function pickSectionKeys(section, source, keys) {
  return keys.reduce((picked, key) => {
    const nextValue = normalizeStorageSectionValue(section, key, source[key])

    if (nextValue !== undefined) {
      picked[key] = nextValue
    }

    return picked
  }, {})
}

/** @returns {import('./editor-config').SectionedStorage} */
export function createEmptyStorage() {
  return STORAGE_SECTION_LIST.reduce((storage, key) => {
    storage[key] = {}
    return storage
  }, {})
}

function mergeFlatFieldsIntoSections(storage, source) {
  Object.entries(SETTINGS_SECTION_KEYS).forEach(([section, keys]) => {
    const flatValues = pickSectionKeys(section, source, keys)

    if (Object.keys(flatValues).length) {
      storage[section] = {
        ...flatValues,
        ...storage[section],
      }
    }
  })

  const assetValues = {
    ...pickKeys(source, ASSET_KEYS),
    ...pickKeys(source, WATERMARK_ASSET_KEYS),
  }

  if (Object.keys(assetValues).length) {
    storage.assets = {
      ...assetValues,
      ...storage.assets,
    }
  }

  return storage
}

/**
 * @param {Object} value
 * @returns {import('./editor-config').SectionedStorage}
 */
export function normalizeStorageShape(value) {
  const storage = createEmptyStorage()
  const source = normalizeObject(value)

  STORAGE_SECTION_LIST.forEach(section => {
    storage[section] = normalizeObject(source[section])
  })

  return mergeFlatFieldsIntoSections(storage, source)
}

export function isSectionedStorage(value) {
  const source = normalizeObject(value)

  return STORAGE_SECTION_LIST.some(
    section => source[section] && typeof source[section] === 'object',
  )
}

/**
 * Flatten sectioned storage into a flat EditorSettings object.
 * @param {Object} value
 * @returns {import('../../modules/editor/config').EditorSettings}
 */
export function flattenStorageSections(value = {}) {
  const storage = normalizeStorageShape(value)

  return {
    ...pickSectionKeys(STORAGE_SECTIONS.template, storage.template, SETTINGS_SECTION_KEYS.template),
    ...pickSectionKeys(STORAGE_SECTIONS.window, storage.window, SETTINGS_SECTION_KEYS.window),
    ...pickSectionKeys(STORAGE_SECTIONS.editor, storage.editor, SETTINGS_SECTION_KEYS.editor),
    ...pickSectionKeys(
      STORAGE_SECTIONS.watermark,
      storage.watermark,
      SETTINGS_SECTION_KEYS.watermark,
    ),
    ...pickSectionKeys(STORAGE_SECTIONS.theme, storage.theme, SETTINGS_SECTION_KEYS.theme),
    ...pickSectionKeys(STORAGE_SECTIONS.code, storage.code, SETTINGS_SECTION_KEYS.code),
    ...pickKeys(storage.assets, ASSET_KEYS),
    ...pickKeys(storage.assets, WATERMARK_ASSET_KEYS),
  }
}

/**
 * Merge flat editor state into sectioned storage.
 * @param {import('../../modules/editor/config').EditorSettings} value
 * @param {import('./editor-config').SectionedStorage} [baseStorage]
 * @returns {import('./editor-config').SectionedStorage}
 */
export function createSectionedStorageFromState(value = {}, baseStorage = createEmptyStorage()) {
  const storage = normalizeStorageShape(baseStorage)
  const state = isSectionedStorage(value) ? flattenStorageSections(value) : normalizeObject(value)

  Object.entries(SETTINGS_SECTION_KEYS).forEach(([section, keys]) => {
    const nextValues = pickSectionKeys(section, state, keys)

    if (Object.keys(nextValues).length) {
      storage[section] = {
        ...storage[section],
        ...nextValues,
      }
    }
  })

  const assetValues = {
    ...pickKeys(state, ASSET_KEYS),
    ...pickKeys(state, WATERMARK_ASSET_KEYS),
  }

  if (Object.keys(assetValues).length) {
    storage.assets = {
      ...storage.assets,
      ...assetValues,
    }
  }

  return storage
}

export function normalizeImportedConfig(value = {}) {
  if (isSectionedStorage(value)) {
    return normalizeStorageShape(value)
  }

  return createSectionedStorageFromState(value)
}
