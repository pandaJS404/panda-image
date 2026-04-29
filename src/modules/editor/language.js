import hljs from 'highlight.js/lib/common'

import {
  LANGUAGE_MIME_HASH,
  LANGUAGE_MODE_HASH,
  LANGUAGE_NAME_HASH,
} from './config'

const LANGUAGE_ALIASES = {
  bash: 'shell',
  html: 'htmlmixed',
  js: 'javascript',
  plaintext: 'text',
  react: 'jsx',
  'react-jsx': 'jsx',
  'react-tsx': 'tsx',
  sh: 'shell',
  shell: 'shell',
  text: 'text',
  ts: 'typescript',
  txt: 'text',
  xml: 'htmlmixed',
  zsh: 'shell',
}

const DROP_FILE_LANGUAGE_BY_EXTENSION = {
  apache: 'text/apache',
  bash: 'application/x-sh',
  c: 'text/x-csrc',
  cc: 'text/x-c++src',
  cpp: 'text/x-c++src',
  cs: 'text/x-csharp',
  css: 'css',
  cts: 'application/typescript',
  ctsx: 'text/typescript-jsx',
  cxx: 'text/x-c++src',
  diff: 'text/x-diff',
  gql: 'graphql',
  graphql: 'graphql',
  h: 'text/x-csrc',
  hpp: 'text/x-c++src',
  htm: 'htmlmixed',
  html: 'htmlmixed',
  java: 'text/x-java',
  js: 'javascript',
  json: 'application/json',
  jsx: 'jsx',
  kt: 'text/x-kotlin',
  md: 'markdown',
  markdown: 'markdown',
  mjs: 'javascript',
  mts: 'application/typescript',
  mtsx: 'text/typescript-jsx',
  php: 'text/x-php',
  py: 'python',
  sass: 'sass',
  scss: 'sass',
  sh: 'application/x-sh',
  sql: 'sql',
  svg: 'htmlmixed',
  ts: 'application/typescript',
  tsx: 'text/typescript-jsx',
  txt: 'text',
  vue: 'vue',
  xml: 'htmlmixed',
  yaml: 'yaml',
  yml: 'yaml',
}

const DROP_FILE_LANGUAGE_BY_MIME = {
  'application/javascript': 'javascript',
  'application/json': 'application/json',
  'application/ld+json': 'application/json',
  'application/markdown': 'markdown',
  'application/typescript': 'application/typescript',
  'application/x-httpd-php': 'text/x-php',
  'application/x-sh': 'application/x-sh',
  'application/xml': 'htmlmixed',
  'text/css': 'css',
  'text/html': 'htmlmixed',
  'text/javascript': 'javascript',
  'text/jsx': 'jsx',
  'text/markdown': 'markdown',
  'text/plain': 'text',
  'text/typescript': 'application/typescript',
  'text/typescript-jsx': 'text/typescript-jsx',
  'text/x-typescript': 'application/typescript',
  'text/xml': 'htmlmixed',
}

const TEXT_FILE_EXTENSIONS = new Set(Object.keys(DROP_FILE_LANGUAGE_BY_EXTENSION))
const TEXT_FILE_TYPE_PREFIXES = ['application/', 'text/']

const VUE_SFC_PATTERN = /<(template|script|style)\b/i
const VUE_RUNTIME_PATTERN = /\bdefineComponent\s*\(|\bcreateApp\s*\(|<script\b[^>]*\bsetup\b/i
const JSX_COMPONENT_TAG_PATTERN = /<([A-Z][\w.]*)\b[^>]*>|<>|<\/>/
const JSX_DOM_TAG_PATTERN =
  /<[a-z][\w-]*\b[^>]*\b(?:className|htmlFor|on[A-Z]\w*|dangerouslySetInnerHTML|suppressHydrationWarning)=/
const REACT_RUNTIME_PATTERN =
  /from\s+['"]react(?:\/jsx-runtime)?['"]|require\(['"]react['"]\)|\bReact\.[A-Z]\w+/
const TYPESCRIPT_PATTERN =
  /\binterface\s+\w+|\btype\s+\w+\s*=|\bimport\s+type\b|\benum\s+\w+|\bsatisfies\b|:\s*React\.[A-Z]\w+/

function normalizeLanguageToken(language) {
  return typeof language === 'string' ? language.trim().toLowerCase() : ''
}

function getFileExtension(name = '') {
  const normalizedName = typeof name === 'string' ? name.trim().toLowerCase() : ''
  const fileName = normalizedName.split(/[\\/]/u).pop() || ''
  const extensionStart = fileName.lastIndexOf('.')

  if (extensionStart < 0) {
    return ''
  }

  return fileName.slice(extensionStart + 1)
}

function hasVueSyntax(code) {
  return VUE_SFC_PATTERN.test(code) || VUE_RUNTIME_PATTERN.test(code)
}

function hasJsxSyntax(code) {
  return (
    JSX_COMPONENT_TAG_PATTERN.test(code) ||
    JSX_DOM_TAG_PATTERN.test(code) ||
    (REACT_RUNTIME_PATTERN.test(code) && /return\s*\(\s*</.test(code))
  )
}

function hasTypeScriptSyntax(code) {
  return TYPESCRIPT_PATTERN.test(code)
}

export function searchLanguage(language) {
  const normalizedLanguage = normalizeLanguageToken(language)
  const resolvedLanguage = LANGUAGE_ALIASES[normalizedLanguage] || normalizedLanguage

  return (
    LANGUAGE_NAME_HASH[resolvedLanguage] ||
    LANGUAGE_MODE_HASH[resolvedLanguage] ||
    LANGUAGE_MIME_HASH[resolvedLanguage]
  )
}

export function getDroppedFileLanguage(file = {}) {
  const extension = getFileExtension(file.name)
  const mimeType = normalizeLanguageToken(file.type)
  const resolvedLanguage =
    DROP_FILE_LANGUAGE_BY_EXTENSION[extension] ||
    DROP_FILE_LANGUAGE_BY_MIME[mimeType] ||
    LANGUAGE_ALIASES[mimeType] ||
    mimeType
  const languageMode = searchLanguage(resolvedLanguage)

  return languageMode ? languageMode.mime || languageMode.mode : 'auto'
}

export function isDroppedTextFile(file = {}) {
  const mimeType = normalizeLanguageToken(file.type)

  if (mimeType.startsWith('image/') || mimeType.startsWith('video/') || mimeType.startsWith('audio/')) {
    return false
  }

  if (
    TEXT_FILE_TYPE_PREFIXES.some(prefix => mimeType.startsWith(prefix)) ||
    DROP_FILE_LANGUAGE_BY_MIME[mimeType]
  ) {
    return true
  }

  return TEXT_FILE_EXTENSIONS.has(getFileExtension(file.name))
}

export function detectAutoLanguage(code = '') {
  const source = typeof code === 'string' ? code : ''

  if (!source.trim()) {
    return 'text'
  }

  if (hasVueSyntax(source)) {
    return 'vue'
  }

  if (hasJsxSyntax(source)) {
    return hasTypeScriptSyntax(source) ? 'tsx' : 'jsx'
  }

  const detectedLanguage = normalizeLanguageToken(hljs.highlightAuto(source).language)

  if (!detectedLanguage) {
    return 'text'
  }

  return LANGUAGE_ALIASES[detectedLanguage] || detectedLanguage
}

export function resolveLanguageMode(code, language) {
  const normalizedLanguage = normalizeLanguageToken(language)
  const resolvedLanguage =
    normalizedLanguage === 'auto'
      ? detectAutoLanguage(code)
      : LANGUAGE_ALIASES[normalizedLanguage] || normalizedLanguage
  const languageMode = searchLanguage(resolvedLanguage)

  return {
    detectedLanguage: resolvedLanguage || 'text',
    mode: languageMode ? languageMode.mime || languageMode.mode : resolvedLanguage || 'text/plain',
    modeKey: languageMode ? languageMode.mode : resolvedLanguage || 'text',
  }
}
