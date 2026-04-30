const axios = require('axios')

const RANDOM_IMAGE_PAGE_SIZE = 8
const RANDOM_IMAGE_MARKET = 'zh-CN'
const BING_ORIGIN = 'https://www.bing.com'
const BING_DAILY_API_PATH = '/HPImageArchive.aspx'
const BING_FALLBACK_INFO_URL = `${BING_ORIGIN}/?mkt=${RANDOM_IMAGE_MARKET}`
const BING_LIST_CACHE_TTL = 15 * 60 * 1000
const DATA_URL_CACHE_TTL = 60 * 60 * 1000
const DATA_URL_CACHE_MAX_SIZE = 100
const PICSUM_FALLBACK_WIDTH = 1600
const PICSUM_FALLBACK_HEIGHT = 1200
const FALLBACKABLE_RANDOM_IMAGE_STATUSES = new Set([401, 403, 404, 405])
const CORS_ALLOW_METHODS = 'GET, OPTIONS'
const CORS_ALLOW_HEADERS = 'Content-Type'
const DEFAULT_ALLOWED_ORIGINS = [
  'https://pandajs404.github.io',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
]

const bingClient = axios.create({
  baseURL: BING_ORIGIN,
  headers: {
    Accept: 'application/json',
  },
})

const picsumClient = axios.create({
  baseURL: 'https://picsum.photos/v2',
  headers: {
    Accept: 'application/json',
  },
})

let picsumPage = Math.floor(Math.random() * 50) + 1
let bingListCache = {
  expiresAt: 0,
  value: null,
}

const dataUrlCache = new Map()
const allowedCorsOrigins = new Set(
  [
    ...DEFAULT_ALLOWED_ORIGINS,
    ...(process.env.CORS_ALLOW_ORIGINS || '')
      .split(',')
      .map(origin => origin.trim())
      .filter(Boolean),
  ].map(origin => origin.replace(/\/$/u, '')),
)

function shouldUseRandomImageFallback(error) {
  const status = error?.response?.status

  return !status || FALLBACKABLE_RANDOM_IMAGE_STATUSES.has(status) || status >= 500
}

function buildAbsoluteUrl(value, base = BING_ORIGIN) {
  if (!value) {
    return null
  }

  try {
    return new URL(value, base).toString()
  } catch {
    return null
  }
}

function isHttpUrl(value) {
  return /^https?:\/\//iu.test(value || '')
}

function normalizeBingCreditUrl(value) {
  const nextUrl = buildAbsoluteUrl(value)
  return isHttpUrl(nextUrl) ? nextUrl : BING_FALLBACK_INFO_URL
}

function normalizeBingImage(image) {
  const title = image?.title?.trim()
  const copyright = image?.copyright?.trim()
  const url = buildAbsoluteUrl(image?.url)

  if (!url) {
    return null
  }

  return {
    id: String(image?.startdate || image?.hsh || image?.urlbase || url),
    url,
    photographer: {
      name: title || copyright || 'Bing 每日壁纸',
      profile_url: normalizeBingCreditUrl(image?.copyrightlink),
      sourceName: 'Bing 壁纸',
    },
    palette: null,
    provider: 'bing-daily',
  }
}

function buildPicsumImageUrl(id) {
  return `https://picsum.photos/id/${id}/${PICSUM_FALLBACK_WIDTH}/${PICSUM_FALLBACK_HEIGHT}`
}

function normalizePicsumImage(photo) {
  return {
    id: String(photo.id),
    url: buildPicsumImageUrl(photo.id),
    photographer: {
      name: photo?.author || 'Lorem Picsum',
      profile_url: photo?.url || 'https://picsum.photos',
      sourceName: 'Lorem Picsum',
    },
    palette: null,
    provider: 'picsum',
  }
}

async function fetchBingDailyImageList() {
  if (bingListCache.value && Date.now() < bingListCache.expiresAt) {
    return bingListCache.value
  }

  const response = await bingClient.get(BING_DAILY_API_PATH, {
    params: {
      format: 'js',
      idx: 0,
      n: RANDOM_IMAGE_PAGE_SIZE,
      mkt: RANDOM_IMAGE_MARKET,
    },
  })

  const images = Array.isArray(response.data?.images)
    ? response.data.images.map(normalizeBingImage).filter(Boolean)
    : []

  if (!images.length) {
    throw new Error('BING_DAILY_IMAGES_EMPTY')
  }

  bingListCache = {
    expiresAt: Date.now() + BING_LIST_CACHE_TTL,
    value: images,
  }

  return images
}

async function fetchPicsumRandomList() {
  const response = await picsumClient.get('/list', {
    params: {
      page: picsumPage,
      limit: RANDOM_IMAGE_PAGE_SIZE,
    },
  })

  picsumPage += 1

  return response.data.filter(photo => photo?.id != null).map(normalizePicsumImage)
}

function getCachedDataUrl(url) {
  const cached = dataUrlCache.get(url)

  if (!cached || Date.now() >= cached.expiresAt) {
    dataUrlCache.delete(url)
    return null
  }

  return cached.value
}

function setCachedDataUrl(url, dataURL) {
  if (dataUrlCache.size >= DATA_URL_CACHE_MAX_SIZE) {
    const firstKey = dataUrlCache.keys().next().value
    dataUrlCache.delete(firstKey)
  }
  dataUrlCache.set(url, {
    expiresAt: Date.now() + DATA_URL_CACHE_TTL,
    value: dataURL,
  })
}

async function fetchImageAsDataUrl(url) {
  const cachedDataUrl = getCachedDataUrl(url)

  if (cachedDataUrl) {
    return cachedDataUrl
  }

  const response = await axios.get(url, {
    responseType: 'arraybuffer',
  })
  const contentType = response.headers['content-type'] || 'image/jpeg'
  const dataURL = `data:${contentType};base64,${Buffer.from(response.data).toString('base64')}`

  setCachedDataUrl(url, dataURL)

  return dataURL
}

async function fetchRandomImageList() {
  try {
    return await fetchBingDailyImageList()
  } catch (error) {
    if (!shouldUseRandomImageFallback(error)) {
      throw error
    }
  }

  return fetchPicsumRandomList()
}

async function fetchBingImageById(id) {
  const images = await fetchBingDailyImageList()
  const image = images.find(item => String(item.id) === String(id))

  if (!image) {
    return null
  }

  return {
    ...image,
    dataURL: await fetchImageAsDataUrl(image.url),
  }
}

async function fetchPicsumImageById(id) {
  const response = await picsumClient.get(`/id/${id}/info`)
  const image = normalizePicsumImage(response.data)

  return {
    ...image,
    dataURL: await fetchImageAsDataUrl(image.url),
  }
}

async function fetchRandomImageById(id) {
  try {
    const bingImage = await fetchBingImageById(id)

    if (bingImage) {
      return bingImage
    }
  } catch (error) {
    if (!shouldUseRandomImageFallback(error)) {
      throw error
    }
  }

  return fetchPicsumImageById(id)
}

function sendJson(res, statusCode, data) {
  res.statusCode = statusCode
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  res.end(JSON.stringify(data))
}

function setCorsHeaders(res, origin) {
  res.setHeader('Access-Control-Allow-Origin', origin)
  res.setHeader('Access-Control-Allow-Methods', CORS_ALLOW_METHODS)
  res.setHeader('Access-Control-Allow-Headers', CORS_ALLOW_HEADERS)
  res.setHeader('Vary', 'Origin')
}

function getRequestOrigin(req) {
  const origin = req.headers?.origin

  return typeof origin === 'string' ? origin.replace(/\/$/u, '') : null
}

function getAllowedOrigin(req) {
  const origin = getRequestOrigin(req)

  if (!origin) {
    return null
  }

  return allowedCorsOrigins.has(origin) ? origin : false
}

function applyCors(req, res) {
  const allowedOrigin = getAllowedOrigin(req)

  if (allowedOrigin === false) {
    return false
  }

  if (allowedOrigin) {
    setCorsHeaders(res, allowedOrigin)
  }

  return true
}

function sendCorsNotAllowed(res) {
  sendJson(res, 403, {
    error: 'CORS_ORIGIN_NOT_ALLOWED',
  })
}

function sendJsonWithCors(req, res, statusCode, data) {
  if (!applyCors(req, res)) {
    sendCorsNotAllowed(res)
    return
  }

  sendJson(res, statusCode, data)
}

function sendNoContent(req, res) {
  if (!applyCors(req, res)) {
    sendCorsNotAllowed(res)
    return
  }

  res.statusCode = 204
  res.setHeader('Cache-Control', 'no-store')
  res.end()
}

function sendMethodNotAllowed(req, res) {
  sendJsonWithCors(req, res, 405, {
    error: 'METHOD_NOT_ALLOWED',
  })
}

function logRequestError(endpoint, error) {
  console.error('[random-image-proxy] Request failed:', {
    endpoint,
    status: error?.response?.status || null,
    code: error?.code || null,
    message: error?.message || 'UNKNOWN_ERROR',
  })
}

async function handleRandomImageListRequest(req, res) {
  if (req.method === 'OPTIONS') {
    sendNoContent(req, res)
    return
  }

  if (req.method !== 'GET') {
    sendMethodNotAllowed(req, res)
    return
  }

  try {
    const images = await fetchRandomImageList()
    sendJsonWithCors(req, res, 200, images)
  } catch (error) {
    logRequestError('/api/random-image', error)
    sendJsonWithCors(req, res, 502, {
      error: 'RANDOM_IMAGE_LIST_FAILED',
    })
  }
}

async function handleRandomImageDownloadRequest(req, res) {
  if (req.method === 'OPTIONS') {
    sendNoContent(req, res)
    return
  }

  if (req.method !== 'GET') {
    sendMethodNotAllowed(req, res)
    return
  }

  const requestUrl = new URL(req.url, 'http://localhost')
  const id = requestUrl.searchParams.get('id')

  if (!id) {
    sendJsonWithCors(req, res, 400, {
      error: 'RANDOM_IMAGE_ID_REQUIRED',
    })
    return
  }

  if (!/^[a-zA-Z0-9_-]{1,64}$/.test(id)) {
    sendJsonWithCors(req, res, 400, {
      error: 'RANDOM_IMAGE_ID_INVALID',
    })
    return
  }

  try {
    const image = await fetchRandomImageById(id)
    sendJsonWithCors(req, res, 200, image)
  } catch (error) {
    logRequestError('/api/random-image-download', error)
    sendJsonWithCors(req, res, 502, {
      error: 'RANDOM_IMAGE_DOWNLOAD_FAILED',
    })
  }
}

function randomImageApiMiddleware(req, res, next) {
  const requestUrl = new URL(req.originalUrl || req.url, 'http://localhost')

  if (requestUrl.pathname === '/api/random-image') {
    void handleRandomImageListRequest(req, res)
    return
  }

  if (requestUrl.pathname === '/api/random-image-download') {
    void handleRandomImageDownloadRequest(req, res)
    return
  }

  next()
}

module.exports = {
  handleRandomImageDownloadRequest,
  handleRandomImageListRequest,
  randomImageApiMiddleware,
}
