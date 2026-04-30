import React from 'react'

const parseJSON = value => {
  try {
    return JSON.parse(value)
  } catch {
    return value
  }
}

const stringify = value => (typeof value === 'string' ? value : JSON.stringify(value))
const KEY_ALIASES = {
  '~': '`',
  '!': '1',
  '@': '2',
  '#': '3',
  $: '4',
  '%': '5',
  '^': '6',
  '&': '7',
  '*': '8',
  '(': '9',
  ')': '0',
  _: '-',
  '+': '=',
  '{': '[',
  '}': ']',
  '|': '\\',
  ':': ';',
  '"': "'",
  '<': ',',
  '>': '.',
  '?': '/',
}
const KEY_CODE_ALIASES = {
  Backquote: '`',
  Minus: '-',
  Equal: '=',
  BracketLeft: '[',
  BracketRight: ']',
  Backslash: '\\',
  Semicolon: ';',
  Quote: "'",
  Comma: ',',
  Period: '.',
  Slash: '/',
}

const shortcutIncludes = (shortcut, values) => values.some(value => shortcut.includes(value))
const normalizeKey = value =>
  KEY_ALIASES[(value || '').toLowerCase()] || (value || '').toLowerCase()
const normalizeCode = value => KEY_CODE_ALIASES[value] || ''

const matchesShortcut = (shortcut, event) => {
  const normalizedShortcut = shortcut.toLowerCase()
  const parts = normalizedShortcut.split('-').filter(Boolean)
  const expectedKey = normalizeKey(parts[parts.length - 1])
  const actualKey = normalizeKey(event.key)
  const actualCode = normalizeCode(event.code)
  const expectsMeta = shortcutIncludes(normalizedShortcut, ['cmd', 'meta'])
  const expectsCtrl = shortcutIncludes(normalizedShortcut, ['ctrl'])
  const expectsShift = shortcutIncludes(normalizedShortcut, ['shift'])
  const expectsAlt = shortcutIncludes(normalizedShortcut, ['alt', 'opt', 'option'])

  if (actualKey !== expectedKey && actualCode !== expectedKey) {
    return false
  }

  if (expectsMeta && !(event.metaKey || event.ctrlKey)) {
    return false
  }

  if (expectsCtrl && !event.ctrlKey) {
    return false
  }

  if (expectsShift && !event.shiftKey) {
    return false
  }

  if (expectsAlt && !event.altKey) {
    return false
  }

  return true
}

const copyText = async text => {
  if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    await navigator.clipboard.writeText(text)
    return
  }

  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.setAttribute('readonly', '')
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'

  document.body.appendChild(textarea)
  textarea.select()

  try {
    document.execCommand('copy')
  } finally {
    textarea.remove()
  }
}

const resolveElement = node => {
  if (!node) {
    return null
  }

  if (typeof HTMLElement !== 'undefined' && node instanceof HTMLElement) {
    return node
  }

  if (typeof SVGElement !== 'undefined' && node instanceof SVGElement) {
    return node
  }

  if (node.nativeElement) {
    return resolveElement(node.nativeElement)
  }

  return null
}

export const syncDomAttribute = (target, name, value) => {
  const element = resolveElement(target)

  if (!element) {
    return
  }

  if (value == null || value === false || value === '') {
    element.removeAttribute(name)
    return
  }

  element.setAttribute(name, String(value))
}

export const useAsyncCallback = callback => {
  const callbackRef = React.useRef(callback)
  const [state, setState] = React.useState({
    data: null,
    loading: false,
    error: null,
  })

  React.useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  const run = React.useCallback(async (...args) => {
    setState(current => ({
      ...current,
      loading: true,
      error: null,
    }))

    try {
      const data = await callbackRef.current(...args)

      setState(current => ({
        ...current,
        data,
        loading: false,
        error: null,
      }))

      return data
    } catch (error) {
      setState(current => ({
        ...current,
        loading: false,
        error,
      }))

      throw error
    }
  }, [])

  return [run, state]
}

export const useKeyboardListener = (shortcut, handler) => {
  const handlerRef = React.useRef(handler)

  React.useEffect(() => {
    handlerRef.current = handler
  }, [handler])

  React.useEffect(() => {
    const onKeyDown = event => {
      if (event.__pandaShortcutHandled) {
        return
      }

      if (matchesShortcut(shortcut, event)) {
        event.__pandaShortcutHandled = true
        handlerRef.current(event)
      }
    }

    const targets = [window, document, document.body].filter(Boolean)

    targets.forEach(target => target.addEventListener('keydown', onKeyDown, true))

    return () => {
      targets.forEach(target => target.removeEventListener('keydown', onKeyDown, true))
    }
  }, [shortcut])
}

export const useLocalStorage = key => {
  const [value, setValue] = React.useState(() => {
    if (typeof window === 'undefined') {
      return null
    }

    try {
      if (Object.prototype.hasOwnProperty.call(localStorage, key)) {
        return parseJSON(localStorage.getItem(key))
      }
    } catch {
      // localStorage unavailable (e.g. private browsing mode)
    }

    return null
  })
  const [loaded, setLoaded] = React.useState(typeof window !== 'undefined')

  React.useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    try {
      if (Object.prototype.hasOwnProperty.call(localStorage, key)) {
        setValue(parseJSON(localStorage.getItem(key)))
      }
    } catch {
      // ignore storage read failures
    }

    setLoaded(true)
  }, [key])

  React.useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const onStorage = event => {
      if (event.key === key) {
        setValue(parseJSON(event.newValue))
      }
    }

    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [key])

  React.useEffect(() => {
    if (typeof window === 'undefined' || !loaded) {
      return
    }

    try {
      if (value == null) {
        localStorage.removeItem(key)
        return
      }

      localStorage.setItem(key, stringify(value))
    } catch {
      // ignore storage write failures (e.g. quota exceeded)
    }
  }, [key, loaded, value])

  return [value, setValue]
}

export const useCopyTextHandler = (text, { interval = 1000 } = {}) => {
  const [copied, setCopied] = React.useState(false)

  React.useEffect(() => {
    if (!copied) {
      return
    }

    const timeoutId = window.setTimeout(() => setCopied(false), interval)
    return () => window.clearTimeout(timeoutId)
  }, [copied, interval])

  const onClick = React.useCallback(
    async event => {
      if (event && typeof event.preventDefault === 'function') {
        event.preventDefault()
      }

      try {
        await copyText(text)
        setCopied(true)
      } catch {
        setCopied(false)
      }
    },
    [text],
  )

  return { onClick, copied }
}
