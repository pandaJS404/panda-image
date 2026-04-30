import Morph from 'morphmorph'

const URL_LIMIT = 4e3
const mapper = new Morph({
  types: {
    bool: v => {
      if (v == null) return undefined
      if (v === 'false') return false
      return Boolean(v)
    },
    int: v => {
      const integer = parseInt(v)
      if (isNaN(integer)) return undefined
      return integer
    },
    intArray: v => {
      if (v == null) return undefined
      return v
        .split(',')
        .filter(i => !isNaN(i))
        .map(i => parseInt(i))
    },
    parse: v => {
      try {
        const x = JSON.parse(v)
        return x
      } catch {
        return v
      }
    },
    decode: v => {
      if (v == null) return undefined
      try {
        return decodeURIComponent(v)
      } catch {
        return v
      }
    },
    encode: v => {
      if (v == null) return undefined
      try {
        const encoded = encodeURIComponent(v)
        if (encoded.length > URL_LIMIT) {
          // soft prevent URL length limit errors https://github.com/panda-app/panda/issues/829
          return encodeURIComponent(v.slice(0, URL_LIMIT / 2))
        }
        return encoded
      } catch {
        return v
      }
    },
  },
})

const readMappings = [
  { field: 'bg:backgroundColor' },
  { field: 'bgg:backgroundGradient' },
  { field: 'bgbm:backgroundGradientBlendMode' },
  { field: 'bgi:backgroundImageSource' },
  { field: 'gl:glassEffect', type: 'bool' },
  { field: 'glb:glassBlurRadius' },
  { field: 't:theme' },
  { field: 'wt:windowTheme' },
  { field: 'cb:codeMirrorBorder', type: 'bool' },
  { field: 'cbc:codeMirrorBorderColor' },
  { field: 'cbr:codeMirrorBorderRadius' },
  { field: 'l:language' },
  { field: 'width' },
  { field: 'ds:dropShadow', type: 'bool' },
  { field: 'dsyoff:dropShadowOffsetY' },
  { field: 'dsblur:dropShadowBlurRadius' },
  { field: 'wc:windowControls', type: 'bool' },
  { field: 'wa:widthAdjustment', type: 'bool' },
  { field: 'pv:paddingVertical' },
  { field: 'ph:paddingHorizontal' },
  { field: 'ln:lineNumbers', type: 'bool' },
  { field: 'fl:firstLineNumber', type: 'int' },
  { field: 'fm:fontFamily' },
  { field: 'fs:fontSize' },
  { field: 'lh:lineHeight' },
  { field: 'si:squaredImage', type: 'bool' },
  { field: 'es:exportSize' },
  { field: 'wm:watermark', type: 'bool' },
  { field: 'wmm:watermarkMode' },
  { field: 'wmo:watermarkOpacity' },
  { field: 'wms:watermarkScale' },
  { field: 'wmx:watermarkOffsetX' },
  { field: 'wmy:watermarkOffsetY' },
  { field: 'wmt:watermarkText', type: 'decode' },
  { field: 'wmf:watermarkFontFamily' },
  { field: 'wmts:watermarkTextSize' },
  { field: 'wmk:watermarkTextKerning', type: 'bool' },
  { field: 'wmsc:watermarkStrokeColor' },
  { field: 'wmsw:watermarkStrokeWidth' },
  { field: 'wmfe:watermarkFillEnabled', type: 'bool' },
  { field: 'wmfc:watermarkFillColor' },
  { field: 'sl:selectedLines', type: 'intArray' },
  { field: 'copy', type: 'bool' },
  { field: 'readonly', type: 'bool' },
  { field: 'highlights', type: 'parse' },
  { field: 'code', type: 'decode' },
  { field: 'tb:titleBar', type: 'decode' },
]

const writeMappings = [
  { field: 'backgroundColor:bg' },
  { field: 'backgroundGradient:bgg' },
  { field: 'backgroundGradientBlendMode:bgbm' },
  { field: 'backgroundImageSource:bgi' },
  { field: 'glassEffect:gl', type: 'bool' },
  { field: 'glassBlurRadius:glb' },
  { field: 'theme:t' },
  { field: 'windowTheme:wt' },
  { field: 'codeMirrorBorder:cb', type: 'bool' },
  { field: 'codeMirrorBorderColor:cbc' },
  { field: 'codeMirrorBorderRadius:cbr' },
  { field: 'language:l' },
  { field: 'width' },
  { field: 'dropShadow:ds', type: 'bool' },
  { field: 'dropShadowOffsetY:dsyoff' },
  { field: 'dropShadowBlurRadius:dsblur' },
  { field: 'windowControls:wc', type: 'bool' },
  { field: 'widthAdjustment:wa', type: 'bool' },
  { field: 'paddingVertical:pv' },
  { field: 'paddingHorizontal:ph' },
  { field: 'lineNumbers:ln', type: 'bool' },
  { field: 'firstLineNumber:fl', type: 'int' },
  { field: 'fontFamily:fm' },
  { field: 'fontSize:fs' },
  { field: 'lineHeight:lh' },
  { field: 'squaredImage:si', type: 'bool' },
  { field: 'exportSize:es' },
  { field: 'watermark:wm', type: 'bool' },
  { field: 'watermarkMode:wmm' },
  { field: 'watermarkOpacity:wmo' },
  { field: 'watermarkScale:wms' },
  { field: 'watermarkOffsetX:wmx' },
  { field: 'watermarkOffsetY:wmy' },
  { field: 'watermarkText:wmt', type: 'encode' },
  { field: 'watermarkFontFamily:wmf' },
  { field: 'watermarkTextSize:wmts' },
  { field: 'watermarkTextKerning:wmk', type: 'bool' },
  { field: 'watermarkStrokeColor:wmsc' },
  { field: 'watermarkStrokeWidth:wmsw' },
  { field: 'watermarkFillEnabled:wmfe', type: 'bool' },
  { field: 'watermarkFillColor:wmfc' },
  { field: 'code', type: 'encode' },
  { field: 'titleBar:tb', type: 'encode' },
]

export const serializeState = state => {
  const stateString = encodeURIComponent(JSON.stringify(state))

  return encodeURIComponent(
    typeof window !== 'undefined' ? btoa(stateString) : Buffer.from(stateString).toString('base64'),
  )
}

export const deserializeState = serializedState => {
  try {
    let stateString
    if (typeof window !== 'undefined') {
      stateString = atob(serializedState)
    } else {
      stateString = Buffer.from(serializedState, 'base64').toString()
    }

    return JSON.parse(decodeURIComponent(stateString))
  } catch {
    return {}
  }
}

const getQueryStringObject = query => {
  if (query.state) {
    return deserializeState(query.state)
  }

  const state = mapper.map(readMappings, query)

  Object.keys(state).forEach(key => {
    if (state[key] === '') state[key] = undefined
  })

  return state
}

function getQueryStringState(query) {
  const queryParams = getQueryStringObject(query)
  return Object.keys(queryParams).length ? queryParams : {}
}

function fixAsPathEncoding(asPath) {
  const base = typeof window !== 'undefined' ? window.location.origin : 'http://localhost'

  try {
    return new URL(asPath, base)
  } catch {
    return new URL(encodeURI(asPath), base)
  }
}

export const getRouteState = router => {
  const { asPath = '' } = router
  const query = Object.fromEntries(fixAsPathEncoding(asPath).searchParams.entries())
  const queryState = getQueryStringState(query)

  return {
    queryState,
  }
}

export const updateRouteState = (router, state) => {
  const mappedState = mapper.map(writeMappings, state)

  router.replace(
    {
      pathname: router.pathname,
    },
    {
      pathname: router.pathname,
      query: mappedState,
    },
  )
}
