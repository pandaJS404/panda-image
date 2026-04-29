const BUILT_IN_BACKGROUND_IMAGE_MODULES = import.meta.glob('./panda-bg-*.webp', {
  eager: true,
  import: 'default',
})

const BUILT_IN_BACKGROUND_IMAGE_DEFINITIONS = [
  { number: '01', category: 'panda', categoryLabel: 'Panda', sequence: '01' },
  { number: '02', category: 'panda', categoryLabel: 'Panda', sequence: '02' },
  { number: '03', category: 'panda', categoryLabel: 'Panda', sequence: '03' },
  { number: '04', category: 'panda', categoryLabel: 'Panda', sequence: '04' },
  { number: '05', category: 'panda', categoryLabel: 'Panda', sequence: '05' },
  { number: '06', category: 'panda', categoryLabel: 'Panda', sequence: '06' },
  { number: '07', category: 'unsplash', categoryLabel: 'Unsplash', sequence: '01' },
  { number: '08', category: 'cool', categoryLabel: 'Cool', sequence: '01' },
  { number: '09', category: 'cool', categoryLabel: 'Cool', sequence: '02' },
  { number: '10', category: 'unsplash', categoryLabel: 'Unsplash', sequence: '02' },
  { number: '11', category: 'unsplash', categoryLabel: 'Unsplash', sequence: '03' },
  { number: '12', category: 'unsplash', categoryLabel: 'Unsplash', sequence: '04' },
  { number: '13', category: 'unsplash', categoryLabel: 'Unsplash', sequence: '05' },
  { number: '14', category: 'unsplash', categoryLabel: 'Unsplash', sequence: '06' },
  { number: '15', category: 'unsplash', categoryLabel: 'Unsplash', sequence: '07' },
  { number: '16', category: 'unsplash', categoryLabel: 'Unsplash', sequence: '08' },
  { number: '17', category: 'unsplash', categoryLabel: 'Unsplash', sequence: '09' },
  { number: '18', category: 'unsplash', categoryLabel: 'Unsplash', sequence: '10' },
  { number: '19', category: 'unsplash', categoryLabel: 'Unsplash', sequence: '11' },
  { number: '20', category: 'unsplash', categoryLabel: 'Unsplash', sequence: '12' },
  { number: '21', category: 'unsplash', categoryLabel: 'Unsplash', sequence: '13' },
  { number: '22', category: 'unsplash', categoryLabel: 'Unsplash', sequence: '14' },
]

const BUILT_IN_BACKGROUND_IMAGE_GROUP_ORDER = ['panda', 'cool', 'unsplash']
const BUILT_IN_BACKGROUND_IMAGE_GROUP_LABELS = {
  panda: 'Panda',
  cool: 'Cool Backgrounds',
  unsplash: 'Unsplash',
}
const BUILT_IN_BACKGROUND_IMAGE_CREDIT = {
  name: 'Panda',
  sourceName: 'Panda',
}

export const BUILT_IN_BACKGROUND_IMAGES = BUILT_IN_BACKGROUND_IMAGE_DEFINITIONS.map(definition => {
  const id = `builtin:panda-bg-${definition.number}`
  const url = BUILT_IN_BACKGROUND_IMAGE_MODULES[`./panda-bg-${definition.number}.webp`]

  return {
    id,
    url,
    number: definition.number,
    category: definition.category,
    categoryLabel: definition.categoryLabel,
    sequence: definition.sequence,
    name: `${definition.categoryLabel}-${definition.sequence}`,
    photographer: BUILT_IN_BACKGROUND_IMAGE_CREDIT,
  }
}).filter(image => image.url)

export const BUILT_IN_BACKGROUND_IMAGE_GROUPS = BUILT_IN_BACKGROUND_IMAGE_GROUP_ORDER.map(
  category => ({
    id: category,
    name: BUILT_IN_BACKGROUND_IMAGE_GROUP_LABELS[category],
    images: BUILT_IN_BACKGROUND_IMAGES.filter(image => image.category === category),
  }),
).filter(group => group.images.length)

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
