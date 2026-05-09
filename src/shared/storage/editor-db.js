import { normalizeStorageShape, SETTINGS_SECTION_KEYS } from './editor-config'

const DB_NAME = 'panda-editor'
const DB_VERSION = 1
const STORE_NAME = 'kv'

const LEGACY_SETTINGS_KEY = 'PANDA_STATE'
const LEGACY_PRESETS_KEY = 'PANDA_PRESETS'
const LEGACY_THEMES_KEY = 'PANDA_THEMES'
const LEGACY_WATERMARK_FONT_ASSET_KEY = 'PANDA_WATERMARK_FONT_ASSET'
const LEGACY_BACKGROUND_IMAGE_ASSET_KEY = 'PANDA_BACKGROUND_IMAGE_ASSET'
const STORAGE_ROOT_KEY = 'PANDA_EDITOR_STORAGE'
const LEGACY_KEYS = [
  LEGACY_SETTINGS_KEY,
  LEGACY_PRESETS_KEY,
  LEGACY_THEMES_KEY,
  LEGACY_WATERMARK_FONT_ASSET_KEY,
  LEGACY_BACKGROUND_IMAGE_ASSET_KEY,
  STORAGE_ROOT_KEY,
]

let dbPromise
let legacyMigrationPromise

function hasIndexedDB() {
  return typeof window !== 'undefined' && typeof window.indexedDB !== 'undefined'
}

function cloneValue(value) {
  if (value == null) {
    return value
  }

  return JSON.parse(JSON.stringify(value))
}

function normalizeObject(value) {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value
  }

  return {}
}

function openDatabase() {
  if (!hasIndexedDB()) {
    return Promise.resolve(null)
  }

  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION)

      request.onupgradeneeded = () => {
        const db = request.result

        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME)
        }
      }

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
      request.onblocked = () => reject(new Error('IndexedDB open blocked'))
    }).catch(error => {
      dbPromise = null
      throw error
    })
  }

  return dbPromise
}

function parseLegacyValue(rawValue) {
  if (rawValue == null) {
    return undefined
  }

  if (typeof rawValue !== 'string') {
    return rawValue
  }

  try {
    return JSON.parse(rawValue)
  } catch {
    try {
      return JSON.parse(rawValue.replace(/&quot;/g, '"').replace(/&#x2F;/g, '/'))
    } catch {
      return rawValue
    }
  }
}

function readRequest(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(cloneValue(request.result))
    request.onerror = () => reject(request.error)
  })
}

function writeRequest(request, transaction) {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve(true)
    transaction.onerror = () => reject(transaction.error || request.error)
    transaction.onabort = () =>
      reject(transaction.error || request.error || new Error('IndexedDB transaction aborted'))
    request.onerror = () => reject(request.error)
  })
}

async function readFromDatabase(key) {
  const db = await openDatabase()

  if (!db) {
    return null
  }

  const transaction = db.transaction(STORE_NAME, 'readonly')
  const store = transaction.objectStore(STORE_NAME)

  return readRequest(store.get(key))
}

async function writeToDatabase(key, value) {
  const db = await openDatabase()

  if (!db) {
    return null
  }

  const transaction = db.transaction(STORE_NAME, 'readwrite')
  const store = transaction.objectStore(STORE_NAME)
  return writeRequest(store.put(cloneValue(value), key), transaction)
}

async function deleteFromDatabase(key) {
  const db = await openDatabase()

  if (!db) {
    return null
  }

  const transaction = db.transaction(STORE_NAME, 'readwrite')
  const store = transaction.objectStore(STORE_NAME)
  return writeRequest(store.delete(key), transaction)
}

async function clearDatabase() {
  const db = await openDatabase()

  if (!db) {
    return null
  }

  const transaction = db.transaction(STORE_NAME, 'readwrite')
  const store = transaction.objectStore(STORE_NAME)
  return writeRequest(store.clear(), transaction)
}

function readLegacyFallback(key) {
  if (typeof window === 'undefined') {
    return undefined
  }

  try {
    return parseLegacyValue(window.localStorage?.getItem(key))
  } catch {
    return undefined
  }
}

function removeNilEntries(object) {
  return Object.entries(normalizeObject(object)).reduce((nextObject, [key, value]) => {
    if (value !== undefined) {
      nextObject[key] = value
    }

    return nextObject
  }, {})
}

function pickSection(source, keys) {
  return keys.reduce((sectionState, key) => {
    if (source[key] !== undefined) {
      sectionState[key] = source[key]
    }

    return sectionState
  }, {})
}

function buildMigratedStorage({
  settings,
  presets,
  themes,
  backgroundImageAsset,
  watermarkFontAsset,
  existingStorage,
}) {
  const nextStorage = normalizeStorageShape(existingStorage)
  const normalizedSettings = normalizeObject(settings)

  Object.entries(SETTINGS_SECTION_KEYS).forEach(([section, keys]) => {
    nextStorage[section] = {
      ...nextStorage[section],
      ...pickSection(normalizedSettings, keys),
    }
  })

  if (presets !== undefined) {
    nextStorage.template = {
      ...nextStorage.template,
      presets: Array.isArray(presets) ? presets : [],
    }
  }

  if (themes !== undefined) {
    nextStorage.theme = {
      ...nextStorage.theme,
      themes: Array.isArray(themes) ? themes : [],
    }
  }

  const nextAssets = {
    ...nextStorage.assets,
  }

  if (normalizedSettings.fontUrl !== undefined) {
    nextAssets.fontUrl = normalizedSettings.fontUrl
  }

  if (normalizedSettings.backgroundImage !== undefined) {
    nextAssets.backgroundImage = normalizedSettings.backgroundImage
  }

  if (normalizedSettings.backgroundImageSelection !== undefined) {
    nextAssets.backgroundImageSelection = normalizedSettings.backgroundImageSelection
  }

  if (normalizedSettings.watermarkFontUrl !== undefined) {
    nextAssets.watermarkFontUrl = normalizedSettings.watermarkFontUrl
  }

  if (backgroundImageAsset !== undefined) {
    nextAssets.backgroundImage = backgroundImageAsset?.image ?? nextAssets.backgroundImage ?? null
    nextAssets.backgroundImageSource =
      backgroundImageAsset?.source ?? nextAssets.backgroundImageSource ?? null
    nextAssets.backgroundImageSelection =
      backgroundImageAsset?.selection ?? nextAssets.backgroundImageSelection ?? null
  }

  if (watermarkFontAsset !== undefined) {
    nextAssets.watermarkFontUrl = watermarkFontAsset ?? nextAssets.watermarkFontUrl ?? null
  }

  nextStorage.assets = removeNilEntries(nextAssets)

  return nextStorage
}

async function readRootStorage() {
  const rawStorage = await readValue(STORAGE_ROOT_KEY)
  const normalizedStorage = normalizeStorageShape(rawStorage)

  if (JSON.stringify(rawStorage || {}) !== JSON.stringify(normalizedStorage)) {
    await writeValue(STORAGE_ROOT_KEY, normalizedStorage, { skipMigration: true })
  }

  return normalizedStorage
}

function mergeSection(currentStorage, section, updates) {
  const nextStorage = normalizeStorageShape(currentStorage)
  const nextSection = removeNilEntries({
    ...normalizeObject(nextStorage[section]),
    ...normalizeObject(updates),
  })

  nextStorage[section] = nextSection
  return nextStorage
}

function removeSectionKeys(currentStorage, section, keys = []) {
  const nextStorage = normalizeStorageShape(currentStorage)
  const nextSection = { ...normalizeObject(nextStorage[section]) }

  keys.forEach(key => {
    delete nextSection[key]
  })

  nextStorage[section] = nextSection
  return nextStorage
}

async function ensureLegacyMigration() {
  if (legacyMigrationPromise) {
    return legacyMigrationPromise
  }

  legacyMigrationPromise = (async () => {
    if (typeof window === 'undefined') {
      return false
    }

    const existingStorage = parseLegacyValue(window.localStorage?.getItem(STORAGE_ROOT_KEY))
    const settings = parseLegacyValue(window.localStorage?.getItem(LEGACY_SETTINGS_KEY))
    const presets = parseLegacyValue(window.localStorage?.getItem(LEGACY_PRESETS_KEY))
    const themes = parseLegacyValue(window.localStorage?.getItem(LEGACY_THEMES_KEY))
    const backgroundImageAsset = parseLegacyValue(
      window.localStorage?.getItem(LEGACY_BACKGROUND_IMAGE_ASSET_KEY),
    )
    const watermarkFontAsset = parseLegacyValue(
      window.localStorage?.getItem(LEGACY_WATERMARK_FONT_ASSET_KEY),
    )

    const hasLegacyData =
      existingStorage != null ||
      settings != null ||
      presets != null ||
      themes != null ||
      backgroundImageAsset != null ||
      watermarkFontAsset != null

    if (!hasLegacyData) {
      return false
    }

    const migratedStorage = buildMigratedStorage({
      settings,
      presets,
      themes,
      backgroundImageAsset,
      watermarkFontAsset,
      existingStorage,
    })

    await writeValue(STORAGE_ROOT_KEY, migratedStorage, { skipMigration: true })

    try {
      LEGACY_KEYS.forEach(key => window.localStorage?.removeItem(key))
    } catch {
      // ignore cleanup failure
    }

    return true
  })().catch(() => false)

  return legacyMigrationPromise
}

export async function readValue(key, options = {}) {
  if (!options.skipMigration) {
    try {
      await ensureLegacyMigration()
    } catch {
      // ignore migration failure and continue with fallback reads
    }
  }

  try {
    const value = await readFromDatabase(key)

    if (value !== undefined) {
      return value
    }
  } catch {
    // fall through to localStorage
  }

  return readLegacyFallback(key)
}

export async function writeValue(key, value, options = {}) {
  if (!options.skipMigration) {
    try {
      await ensureLegacyMigration()
    } catch {
      // ignore migration failure and continue with fallback writes
    }
  }

  try {
    const result = await writeToDatabase(key, value)
    if (result) {
      return true
    }
  } catch {
    // fall through to localStorage
  }

  if (typeof window !== 'undefined') {
    try {
      window.localStorage?.setItem(key, JSON.stringify(value))
      return true
    } catch {
      return false
    }
  }

  return false
}

export async function removeValue(key, options = {}) {
  if (!options.skipMigration) {
    try {
      await ensureLegacyMigration()
    } catch {
      // ignore migration failure and continue with fallback removals
    }
  }

  try {
    const result = await deleteFromDatabase(key)
    if (result) {
      return true
    }
  } catch {
    // fall through to localStorage
  }

  if (typeof window !== 'undefined') {
    try {
      window.localStorage?.removeItem(key)
    } catch {
      // ignore fallback failure
    }
  }

  return true
}

export async function clearValues(options = {}) {
  if (!options.skipMigration) {
    try {
      await ensureLegacyMigration()
    } catch {
      // ignore migration failure and continue with fallback clear
    }
  }

  try {
    const result = await clearDatabase()
    if (result) {
      if (typeof window !== 'undefined') {
        try {
          LEGACY_KEYS.forEach(key => window.localStorage?.removeItem(key))
        } catch {
          // ignore cleanup failure
        }
      }

      return true
    }
  } catch {
    // fall through to localStorage
  }

  if (typeof window !== 'undefined') {
    try {
      LEGACY_KEYS.forEach(key => window.localStorage?.removeItem(key))
    } catch {
      // ignore fallback failure
    }
  }

  return true
}

/** @returns {Promise<import('./editor-config').SectionedStorage>} */
export async function getStorage() {
  return readRootStorage()
}

/** @param {import('./editor-config').SectionedStorage} nextStorage */
export async function setStorage(nextStorage) {
  return writeValue(STORAGE_ROOT_KEY, normalizeStorageShape(nextStorage))
}

export async function getSection(section) {
  const storage = await readRootStorage()
  return cloneValue(storage[section]) || {}
}

export async function setSection(section, value) {
  const storage = await readRootStorage()
  const nextStorage = normalizeStorageShape(storage)
  nextStorage[section] = removeNilEntries(value)
  await writeValue(STORAGE_ROOT_KEY, nextStorage)
  return cloneValue(nextStorage[section])
}

/**
 * @param {import('./editor-config').StorageSectionName} section
 * @param {Object} updates
 */
export async function patchSection(section, updates) {
  const storage = await readRootStorage()
  const nextStorage = mergeSection(storage, section, updates)
  await writeValue(STORAGE_ROOT_KEY, nextStorage)
  return cloneValue(nextStorage[section])
}

export async function removeSectionKeysByName(section, keys) {
  const storage = await readRootStorage()
  const nextStorage = removeSectionKeys(storage, section, keys)
  await writeValue(STORAGE_ROOT_KEY, nextStorage)
  return cloneValue(nextStorage[section])
}

export async function clearStorage() {
  return clearValues()
}

export async function migrateLegacyStorage(
  storage = typeof window !== 'undefined' ? window.localStorage : null,
) {
  if (storage !== (typeof window !== 'undefined' ? window.localStorage : null)) {
    return false
  }

  return ensureLegacyMigration()
}

export { STORAGE_ROOT_KEY }
