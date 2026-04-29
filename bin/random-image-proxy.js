const axios = require('axios')

const RANDOM_IMAGE_PAGE_SIZE = 8
const RANDOM_IMAGE_MARKET = 'zh-CN'
const BING_ORIGIN = 'https://www.bing.com'
const BING_DAILY_API_PATH = '/HPImageArchive.aspx'
const BING_FALLBACK_INFO_URL = `${BING_ORIGIN}/?mkt=${RANDOM_IMAGE_MARKET}`
const BING_LIST_CACHE_TTL = 15 * 60 * 1000
const DATA_URL_CACHE_TTL = 60 * 60 * 1000
const PICSUM_FALLBACK_WIDTH = 1600
const PICSUM_FALLBACK_HEIGHT = 1200
const FALLBACKABLE_RANDOM_IMAGE_STATUSES = new Set([401, 403, 404, 405])

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

function sendMethodNotAllowed(res) {
  sendJson(res, 405, {
    error: 'METHOD_NOT_ALLOWED',
  })
}

async function handleRandomImageListRequest(req, res) {
  if (req.method !== 'GET') {
    sendMethodNotAllowed(res)
    return
  }

  try {
    const images = await fetchRandomImageList()
    sendJson(res, 200, images)
  } catch (error) {
    sendJson(res, 502, {
      error: 'RANDOM_IMAGE_LIST_FAILED',
      message: error.message,
    })
  }
}

async function handleRandomImageDownloadRequest(req, res) {
  if (req.method !== 'GET') {
    sendMethodNotAllowed(res)
    return
  }

  const requestUrl = new URL(req.url, 'http://localhost')
  const id = requestUrl.searchParams.get('id')

  if (!id) {
    sendJson(res, 400, {
      error: 'RANDOM_IMAGE_ID_REQUIRED',
    })
    return
  }

  try {
    const image = await fetchRandomImageById(id)
    sendJson(res, 200, image)
  } catch (error) {
    sendJson(res, 502, {
      error: 'RANDOM_IMAGE_DOWNLOAD_FAILED',
      message: error.message,
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
