import React from 'react'
import { Alert, Spin } from 'antd'
import { useAsyncCallback } from '../src/shared/react/hooks'

import ButtonPrimitive from './buttons/ButtonPrimitive'
import { useAPI } from './ApiContext'
import PhotoCredit from './PhotoCredit'

function RandomImage(props) {
  const cacheRef = React.useRef([])
  const [cacheIndex, updateIndex] = React.useState(0)
  const api = useAPI()
  const swallowError = React.useCallback(() => {}, [])

  const [selectImage, { loading: selecting }] = useAsyncCallback(async () => {
    const image = cacheRef.current[cacheIndex]

    if (!image) {
      return null
    }

    let nextImage = image

    try {
      const data = await api.unsplash.download(image.id)
      nextImage = { ...image, ...data }
    } catch {
      nextImage = image
    }

    await props.onChange(nextImage)

    return nextImage
  })

  const [updateCache, { loading: updating, error, data: imgs }] = useAsyncCallback(
    api.unsplash.random
  )

  const needsFetch = !error && !updating && (!imgs || cacheIndex > cacheRef.current.length - 2)

  React.useEffect(() => {
    if (needsFetch) {
      void updateCache().catch(swallowError)
    }
  }, [needsFetch, swallowError, updateCache])

  React.useEffect(() => {
    if (imgs) {
      cacheRef.current.push(...imgs)
    }
  }, [imgs])

  const loading = updating || selecting

  const cache = cacheRef.current
  const currentImage = cache[cacheIndex] || null
  const photographer = currentImage && currentImage.photographer
  const bgImage = currentImage && currentImage.dataURL
  const canSelect = Boolean(currentImage) && !loading
  const canAdvance = !loading && (Boolean(currentImage) || Boolean(error))

  const handleAdvance = () => {
    if (error) {
      void updateCache().catch(swallowError)
      return
    }

    updateIndex(index => index + 1)
  }

  return (
    <div className="random-image-container">
      <div className="random-image-controls">
        <ButtonPrimitive
          disabled={!canSelect}
          className="random-image-action"
          onClick={() => {
            void selectImage().catch(swallowError)
          }}
        >
          使用这张
        </ButtonPrimitive>
        <ButtonPrimitive
          disabled={!canAdvance}
          className="random-image-action"
          onClick={handleAdvance}
        >
          {error ? '重试' : '换一张'}
        </ButtonPrimitive>
      </div>
      <div
        className="random-image-preview"
        style={{ backgroundImage: bgImage ? `url(${bgImage})` : 'none' }}
      >
        {loading ? (
          <div className="random-image-preview__spin">
            <Spin size="large" />
          </div>
        ) : null}
      </div>
      {error && !loading ? (
        <Alert className="random-image-status" showIcon type="warning" title="随机图片加载失败，请重试。" />
      ) : null}
      {photographer && <PhotoCredit photographer={photographer} />}
    </div>
  )
}

export default RandomImage
