import axios from 'axios'

import { fileToDataURL } from '../utils'

const normalizeApiOrigin = value => value.replace(/\/api\/?$/u, '').replace(/\/$/u, '')
const configuredApiProxyTarget = normalizeApiOrigin(import.meta.env.VITE_API_PROXY_TARGET || '')
const configuredApiOrigin = normalizeApiOrigin(
  import.meta.env.VITE_API_URL || import.meta.env.NEXT_PUBLIC_API_URL || ''
)
const unsplashAccessKey =
  import.meta.env.VITE_UNSPLASH_ACCESS_KEY || import.meta.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY || ''
const hasConfiguredRandomImageApi = Boolean(configuredApiProxyTarget || configuredApiOrigin)
const RANDOM_IMAGE_PAGE_SIZE = 8
const PICSUM_FALLBACK_WIDTH = 1600
const PICSUM_FALLBACK_HEIGHT = 1200
const FALLBACKABLE_RANDOM_IMAGE_STATUSES = new Set([401, 403, 404, 405])
const randomImageCache = new Map()
let picsumPage = Math.floor(Math.random() * 50) + 1

export const client = axios.create({
  baseURL: configuredApiOrigin ? `${configuredApiOrigin}/api` : '/api',
  headers: {
    Accept: 'application/json',
  },
})

const unsplashClient = unsplashAccessKey
  ? axios.create({
      baseURL: 'https://api.unsplash.com',
      headers: {
        Accept: 'application/json',
        'Accept-Version': 'v1',
        Authorization: `Client-ID ${unsplashAccessKey}`,
      },
    })
  : null

const picsumClient = axios.create({
  baseURL: 'https://picsum.photos/v2',
  headers: {
    Accept: 'application/json',
  },
})

const shouldUseRandomImageFallback = error => {
  const status = error?.response?.status

  return !status || FALLBACKABLE_RANDOM_IMAGE_STATUSES.has(status) || status >= 500
}

const rememberRandomImages = images => {
  images.forEach(image => {
    if (image?.id != null) {
      randomImageCache.set(String(image.id), image)
    }
  })

  return images
}

const normalizePhotographer = photographer => {
  if (!photographer) {
    return null
  }

  return {
    ...photographer,
    sourceName: photographer.sourceName || 'Unsplash',
  }
}

const toPublicRandomImage = image => {
  if (!image) {
    return image
  }

  const { downloadLocation, provider, ...publicImage } = image

  return {
    ...publicImage,
    photographer: normalizePhotographer(publicImage.photographer),
  }
}

const normalizeServerRandomImage = image => ({
  ...image,
  photographer: normalizePhotographer(image.photographer),
})

const normalizeUnsplashImage = photo => ({
  id: String(photo.id),
  url: photo?.urls?.regular || photo?.urls?.full || photo?.urls?.raw || photo?.urls?.small,
  photographer: {
    name: photo?.user?.name || 'Unsplash',
    profile_url: photo?.user?.links?.html || photo?.links?.html || 'https://unsplash.com',
    sourceName: 'Unsplash',
  },
  palette: null,
  provider: 'unsplash-direct',
  downloadLocation: photo?.links?.download_location || null,
})

const buildPicsumImageUrl = id =>
  `https://picsum.photos/id/${id}/${PICSUM_FALLBACK_WIDTH}/${PICSUM_FALLBACK_HEIGHT}`

const normalizePicsumImage = photo => ({
  id: String(photo.id),
  url: buildPicsumImageUrl(photo.id),
  photographer: {
    name: photo?.author || 'Lorem Picsum',
    profile_url: photo?.url || 'https://picsum.photos',
    sourceName: 'Lorem Picsum',
  },
  palette: null,
  provider: 'picsum',
})

const downloadThumbnailImage = img => {
  return client
    .get(img.url.replace('http://', 'https://'), { responseType: 'blob' })
    .then(res => res.data)
    .then(fileToDataURL)
    .then(dataURL => Object.assign(img, { dataURL }))
}

const fetchUnsplashRandomFromClient = async () => {
  if (!unsplashClient) {
    throw new Error('UNSPLASH_CLIENT_UNAVAILABLE')
  }

  const response = await unsplashClient.get('/photos/random', {
    params: {
      count: RANDOM_IMAGE_PAGE_SIZE,
      orientation: 'landscape',
      content_filter: 'low',
    },
  })
  const photos = Array.isArray(response.data) ? response.data : [response.data]
  const images = await Promise.all(photos.map(photo => downloadThumbnailImage(normalizeUnsplashImage(photo))))

  return rememberRandomImages(images)
}

const fetchPicsumRandom = async () => {
  const response = await picsumClient.get('/list', {
    params: {
      page: picsumPage,
      limit: RANDOM_IMAGE_PAGE_SIZE,
    },
  })

  picsumPage += 1

  const images = await Promise.all(
    response.data
      .filter(photo => photo?.id != null)
      .map(photo => downloadThumbnailImage(normalizePicsumImage(photo)))
  )

  return rememberRandomImages(images)
}

const fetchUnsplashImageById = async id => {
  if (!unsplashClient) {
    return null
  }

  const response = await unsplashClient.get(`/photos/${id}`)
  const image = normalizeUnsplashImage(response.data)

  randomImageCache.set(String(image.id), image)

  return image
}

const fetchPicsumImageById = async id => {
  const response = await picsumClient.get(`/id/${id}/info`)
  const image = normalizePicsumImage(response.data)

  randomImageCache.set(String(image.id), image)

  return image
}

const trackUnsplashDownload = async image => {
  if (!unsplashClient || image?.provider !== 'unsplash-direct' || !image.downloadLocation) {
    return
  }

  const downloadLocation = image.downloadLocation.replace('https://api.unsplash.com', '')

  try {
    await unsplashClient.get(downloadLocation)
  } catch {
    // Tracking is best-effort and should never block image usage.
  }
}

const resolveRandomImageByIdFallback = async id => {
  let image = randomImageCache.get(String(id)) || null

  if (!image && unsplashClient) {
    try {
      image = await fetchUnsplashImageById(id)
    } catch (fallbackError) {
      if (!shouldUseRandomImageFallback(fallbackError)) {
        throw fallbackError
      }
    }
  }

  if (!image) {
    image = await fetchPicsumImageById(id)
  }

  await trackUnsplashDownload(image)

  return toPublicRandomImage(image)
}

const resolveRandomImageListFallback = async () => {
  if (unsplashClient) {
    try {
      return await fetchUnsplashRandomFromClient()
    } catch (fallbackError) {
      if (!shouldUseRandomImageFallback(fallbackError)) {
        throw fallbackError
      }
    }
  }

  return fetchPicsumRandom()
}

const unsplash = {
  async download(id) {
    if (!hasConfiguredRandomImageApi) {
      return resolveRandomImageByIdFallback(id)
    }

    try {
      const response = await client.get(`/unsplash/download/${id}`)

      return normalizeServerRandomImage(response.data)
    } catch (error) {
      if (!shouldUseRandomImageFallback(error)) {
        throw error
      }

      return resolveRandomImageByIdFallback(id)
    }
  },
  async random() {
    if (!hasConfiguredRandomImageApi) {
      return resolveRandomImageListFallback()
    }

    try {
      const imageUrls = await client.get('/unsplash/random')
      const images = await Promise.all(imageUrls.data.map(downloadThumbnailImage))

      return rememberRandomImages(images.map(normalizeServerRandomImage))
    } catch (error) {
      if (!shouldUseRandomImageFallback(error)) {
        throw error
      }

      return resolveRandomImageListFallback()
    }
  },
}

const api = {
  unsplash,
  downloadThumbnailImage,
}

export default api
