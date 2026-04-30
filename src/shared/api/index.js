import axios from 'axios'

import { fileToDataURL } from '../utils'

const normalizeApiOrigin = value => value.replace(/\/api\/?$/u, '').replace(/\/$/u, '')
const configuredApiOrigin = normalizeApiOrigin(
  import.meta.env.VITE_API_URL || import.meta.env.NEXT_PUBLIC_API_URL || ''
)
const isGitHubPagesRuntime = () =>
  typeof window !== 'undefined' && /(^|\.)github\.io$/iu.test(window.location.hostname || '')
const hasRandomImageApi = Boolean(configuredApiOrigin) || !isGitHubPagesRuntime()
const randomImageUnavailableReason = hasRandomImageApi
  ? null
  : '当前站点未配置外部图片 API，请为 GitHub Pages 设置 PAGES_API_URL。'

export const client = axios.create({
  baseURL: configuredApiOrigin ? `${configuredApiOrigin}/api` : '/api',
  headers: {
    Accept: 'application/json',
  },
})

const normalizePhotographer = photographer => {
  if (!photographer) {
    return null
  }

  return {
    ...photographer,
    sourceName: photographer.sourceName || '图片来源',
  }
}

const normalizeRandomImage = image => {
  if (!image) {
    return image
  }

  return {
    ...image,
    photographer: normalizePhotographer(image.photographer),
  }
}

const downloadThumbnailImage = img => {
  if (!img?.url) {
    return Promise.reject(new Error('IMAGE_URL_REQUIRED'))
  }

  return client
    .get(img.url.replace('http://', 'https://'), { responseType: 'blob' })
    .then(res => res.data)
    .then(fileToDataURL)
    .then(dataURL => Object.assign(img, { dataURL }))
}

const randomImage = {
  isAvailable: hasRandomImageApi,
  unavailableReason: randomImageUnavailableReason,
  async download(id) {
    if (!hasRandomImageApi) {
      throw new Error('RANDOM_IMAGE_API_UNAVAILABLE')
    }

    const response = await client.get('/random-image-download', {
      params: { id },
    })

    return normalizeRandomImage(response.data)
  },
  async random() {
    if (!hasRandomImageApi) {
      throw new Error('RANDOM_IMAGE_API_UNAVAILABLE')
    }

    const response = await client.get('/random-image')

    return response.data.map(normalizeRandomImage)
  },
}

const api = {
  hasRandomImageApi,
  randomImage,
  downloadThumbnailImage,
}

export default api
