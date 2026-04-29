const BUILT_IN_BACKGROUND_IMAGE_MODULES = import.meta.glob('./panda-bg-*.webp', {
  eager: true,
  import: 'default',
})

function getImageNumberLabel(path) {
  const filename = path.split('/').pop()?.replace('.webp', '') || ''
  const match = filename.match(/(\d+)$/)

  return match ? match[1] : ''
}

export const BUILT_IN_BACKGROUND_IMAGES = Object.entries(BUILT_IN_BACKGROUND_IMAGE_MODULES)
  .map(([path, url]) => {
    const numberLabel = getImageNumberLabel(path)
    const id = `builtin:panda-bg-${numberLabel}`

    return {
      id,
      name: `\u80cc\u666f ${numberLabel}`,
      url,
    }
  })
  .sort((left, right) => left.id.localeCompare(right.id, 'en'))

const BUILT_IN_BACKGROUND_IMAGE_HASH = BUILT_IN_BACKGROUND_IMAGES.reduce((allImages, image) => {
  allImages[image.id] = image
  return allImages
}, {})

export function resolveBuiltInBackgroundImageSource(source) {
  return BUILT_IN_BACKGROUND_IMAGE_HASH[source]?.url || null
}

export function isBuiltInBackgroundImageSource(source) {
  return Boolean(resolveBuiltInBackgroundImageSource(source))
}

export function getBuiltInBackgroundImageBySource(source) {
  return BUILT_IN_BACKGROUND_IMAGE_HASH[source] || null
}
