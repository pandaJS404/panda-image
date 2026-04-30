import React from 'react'
import ReactCrop, { makeAspectCrop } from 'react-image-crop'
import { Card, Collapse } from 'antd'

import {
  BUILT_IN_BACKGROUND_IMAGE_GROUPS,
  resolveBuiltInBackgroundImageSource,
} from '../src/bg-image'
import { useLocalStorage } from '../src/shared/react/hooks'
import ButtonPrimitive from './buttons/ButtonPrimitive'
import RandomImage from './RandomImage'
import PhotoCredit from './PhotoCredit'
import Input from './Input'
import Toggle from './Toggle'
import { Link } from './Meta'
import { fileToDataURL } from '../src/shared/utils'
import ApiContext from './ApiContext'
import { getAssetUrl } from '../src/shared/assets'

const getCroppedImg = (imageDataURL, pixelCrop) => {
  const canvas = document.createElement('canvas')
  canvas.width = pixelCrop.width
  canvas.height = pixelCrop.height
  const ctx = canvas.getContext('2d')

  return new Promise(resolve => {
    const image = new Image()
    image.src = imageDataURL
    image.onload = () => {
      ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height,
      )

      resolve(canvas.toDataURL('image/jpeg'))
    }
  })
}

const INITIAL_STATE = {
  mode: 'file',
  crop: null,
  imageAspectRatio: null,
  pixelCrop: null,
  photographer: null,
  dataURL: null,
  error: null,
  activeBuiltInGroups: [],
}

const URL_IMPORT_NETWORK_ERROR_MESSAGE =
  '图片抓取失败，可能是链接源限制导致。你可以改用本地上传，或换一张图片重试。'
const URL_IMPORT_FALLBACK_ERROR_MESSAGE = '图片抓取失败，请检查链接是否有效后重试。'

const isUrlImportNetworkError = error => {
  const message = error?.message || ''
  const errorCode = error?.response?.data?.error || ''

  return (
    message.indexOf('Network Error') > -1 ||
    errorCode === 'CORS_ORIGIN_NOT_ALLOWED' ||
    errorCode === 'RANDOM_IMAGE_DOWNLOAD_FAILED'
  )
}

const getBuiltInImageGroup = source =>
  BUILT_IN_BACKGROUND_IMAGE_GROUPS.find(group => group.images.some(image => image.id === source)) ||
  null

const getDefaultActiveBuiltInGroups = source => {
  const group = getBuiltInImageGroup(source)

  return group ? [group.id] : []
}

const normalizeCollapseKeys = activeKeys => {
  if (Array.isArray(activeKeys)) {
    return activeKeys
  }

  return activeKeys ? [activeKeys] : []
}

export default class ImagePicker extends React.Component {
  static contextType = ApiContext

  static getDerivedStateFromProps(nextProps, state) {
    if (state.crop) {
      return {
        crop: makeAspectCrop(
          {
            ...state.crop,
            aspect: nextProps.aspectRatio,
          },
          state.imageAspectRatio,
        ),
      }
    }

    return null
  }

  constructor(props) {
    super(props)

    this.state = {
      ...INITIAL_STATE,
      activeBuiltInGroups: getDefaultActiveBuiltInGroups(props.imageSource),
    }
  }

  componentDidUpdate(prevProps) {
    if (prevProps.imageSource === this.props.imageSource) {
      return
    }

    const nextGroup = getBuiltInImageGroup(this.props.imageSource)

    if (!nextGroup) {
      return
    }

    this.setState(currentState => {
      if (currentState.activeBuiltInGroups.includes(nextGroup.id)) {
        return null
      }

      return {
        activeBuiltInGroups: [...currentState.activeBuiltInGroups, nextGroup.id],
      }
    })
  }

  getSelectedImagePreview = () =>
    this.props.imageSelection ||
    this.props.image ||
    resolveBuiltInBackgroundImageSource(this.props.imageSource) ||
    this.props.imageSource ||
    null

  selectMode = mode => this.setState({ mode })

  handleBuiltInImageKeyDown = (event, image) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      this.selectBuiltInImage(image)
    }
  }

  handleBuiltInCollapseChange = activeBuiltInGroups => {
    this.setState({
      activeBuiltInGroups: normalizeCollapseKeys(activeBuiltInGroups),
    })
  }

  selectBuiltInImage = image => {
    this.setState({ error: null })
    this.handleImageChange({
      source: image.id,
      image: image.url,
      dataURL: image.url,
      photographer: image.photographer,
    })
  }

  onDragEnd = async () => {
    if (this.state.pixelCrop) {
      const croppedImg = await getCroppedImg(this.state.dataURL, this.state.pixelCrop)
      this.props.onChange({
        backgroundMode: 'image',
        backgroundImageSelection: croppedImg,
      })
    }
  }

  onCropChange = (crop, pixelCrop) => {
    this.setState({
      crop: { ...crop, aspect: this.props.aspectRatio },
      pixelCrop,
    })
  }

  onImageLoaded = image => {
    const imageAspectRatio = image.width / image.height
    const initialCrop = {
      x: 0,
      y: 0,
      width: 100,
      aspect: this.props.aspectRatio,
    }

    this.setState({
      imageAspectRatio,
      crop: makeAspectCrop(initialCrop, imageAspectRatio),
    })
  }

  handleImageChange = ({ source, image, dataURL, photographer }) => {
    this.setState({ dataURL, photographer }, () => {
      this.props.onChange({
        backgroundImage: image,
        backgroundImageSource: source,
        backgroundImageSelection: null,
        backgroundMode: 'image',
        photographer,
      })
    })
  }

  handleURLInput = event => {
    event.preventDefault()
    const url = event.target[0].value

    this.setState({ error: null })

    return this.context
      .downloadThumbnailImage({ url })
      .then(result => result.dataURL)
      .then(dataURL => {
        this.setState({ error: null })

        return this.handleImageChange({
          source: url,
          image: dataURL,
          dataURL,
        })
      })
      .catch(error => {
        this.setState({
          error: isUrlImportNetworkError(error)
            ? URL_IMPORT_NETWORK_ERROR_MESSAGE
            : URL_IMPORT_FALLBACK_ERROR_MESSAGE,
        })
      })
  }

  uploadImage = async event => {
    const dataURL = await fileToDataURL(event.target.files[0])

    return this.handleImageChange({
      source: null,
      image: dataURL,
      dataURL,
    })
  }

  selectImage = async image => {
    try {
      const dataURL = image.dataURL || (await this.context.downloadThumbnailImage(image)).dataURL

      this.setState({ error: null })
      this.handleImageChange({
        source: image.url || null,
        image: dataURL,
        dataURL,
        photographer: image.photographer,
      })

      if (image.palette && image.palette.length && this.generateColorPalette) {
        const palette = image.palette.map(color => color.hex)

        this.props.updateHighlights({
          background: palette[0],
          text: palette[1],
          variable: palette[2],
          attribute: palette[3],
          definition: palette[4],
          keyword: palette[5],
          property: palette[6],
          string: palette[7],
          number: palette[8],
          operator: palette[9],
          meta: palette[10],
          tag: palette[11],
          comment: palette[12],
        })
      }
    } catch (error) {
      this.setState({
        error: '随机图片应用失败，请重试或换一张。',
      })

      throw error
    }
  }

  removeImage = () => {
    this.setState(
      {
        ...INITIAL_STATE,
      },
      () => {
        this.props.onChange({
          backgroundImage: null,
          backgroundImageSource: null,
          backgroundImageSelection: null,
        })
      },
    )
  }

  renderSelectedPreview() {
    const selectedImagePreview = this.getSelectedImagePreview()

    if (!selectedImagePreview || this.state.dataURL) {
      return null
    }

    return (
      <div className="image-picker-settings-container">
        <div className="image-picker-image-container">
          <div className="image-picker-label">
            <span>当前使用图片</span>
            <ButtonPrimitive className="image-picker-remove-button" onClick={this.removeImage}>
              &times;
            </ButtonPrimitive>
          </div>
          <div className="image-picker-static-preview">
            <div
              className="image-picker-static-preview__image"
              style={{ backgroundImage: `url(${selectedImagePreview})` }}
            />
          </div>
        </div>
      </div>
    )
  }

  renderCropPreview() {
    if (!this.state.dataURL) {
      return null
    }

    return (
      <div className="image-picker-settings-container">
        <div className="image-picker-image-container">
          <div className="image-picker-label">
            <span>背景图片</span>
            <ButtonPrimitive className="image-picker-remove-button" onClick={this.removeImage}>
              &times;
            </ButtonPrimitive>
          </div>
          <ReactCrop
            src={this.state.dataURL}
            onImageLoaded={this.onImageLoaded}
            crop={this.state.crop}
            onChange={this.onCropChange}
            onDragEnd={this.onDragEnd}
            minHeight={10}
            minWidth={10}
            keepSelection
          />
          {this.state.photographer ? <PhotoCredit photographer={this.state.photographer} /> : null}
        </div>
      </div>
    )
  }

  renderBuiltInGallery() {
    const items = BUILT_IN_BACKGROUND_IMAGE_GROUPS.map(group => ({
      key: group.id,
      label: (
        <div
          className="image-picker-builtin-group__title"
          data-cy="background-builtin-group-trigger"
          data-category={group.id}
        >
          <span>{group.name}</span>
          <span className="image-picker-builtin-group__count">{group.images.length}</span>
        </div>
      ),
      children: (
        <div className="image-picker-builtin-grid">
          {group.images.map(image => (
            <Card
              key={image.id}
              hoverable
              role="button"
              tabIndex={0}
              className="image-picker-builtin-card"
              data-cy="background-builtin-item"
              data-category={group.id}
              data-selected={this.props.imageSource === image.id || undefined}
              onClick={() => this.selectBuiltInImage(image)}
              onKeyDown={event => this.handleBuiltInImageKeyDown(event, image)}
              cover={
                <div
                  className="image-picker-builtin-preview"
                  style={{ backgroundImage: `url(${image.url})` }}
                />
              }
            >
              <div className="image-picker-builtin-name">{image.name}</div>
            </Card>
          ))}
        </div>
      ),
    }))

    return (
      <div className="image-picker-builtin">
        <span className="image-picker-copy">{'\u5185\u7f6e\u56fe\u7247\uff1a'}</span>
        <Collapse
          items={items}
          activeKey={this.state.activeBuiltInGroups}
          className="image-picker-builtin-collapse"
          expandIconPlacement="end"
          onChange={this.handleBuiltInCollapseChange}
        />
      </div>
    )
  }

  render() {
    const content = (
      <div>
        {this.renderCropPreview() || this.renderSelectedPreview()}
        <div className="image-picker-chooser">
          <span className="image-picker-copy">上传背景图：</span>
          <ButtonPrimitive
            active={this.state.mode === 'file'}
            className="image-picker-mode-button"
            onClick={this.selectMode.bind(this, 'file')}
          >
            本地文件
          </ButtonPrimitive>
          <ButtonPrimitive
            active={this.state.mode === 'url'}
            className="image-picker-mode-button"
            onClick={this.selectMode.bind(this, 'url')}
          >
            图片链接
          </ButtonPrimitive>
          {this.state.mode === 'file' ? (
            <Input
              type="file"
              accept="image/png,image/x-png,image/jpeg,image/jpg,image/webp"
              onChange={this.uploadImage}
            />
          ) : (
            <form className="image-picker-url-form" onSubmit={this.handleURLInput}>
              <Input type="text" title="背景图片" placeholder="输入图片 URL" align="left" />
              <ButtonPrimitive className="image-picker-submit" htmlType="submit">
                使用
              </ButtonPrimitive>
            </form>
          )}
          {this.state.error ? <span className="image-picker-error">{this.state.error}</span> : null}
        </div>
        <hr className="image-picker-divider" />
        {this.renderBuiltInGallery()}
        <hr className="image-picker-divider" />
        <div className="image-picker-random">
          <span className="image-picker-copy">
            使用一张来自 <a href="https://www.bing.com/?mkt=zh-CN">Bing 壁纸</a> 的随机图片。
          </span>
          <RandomImage onChange={this.selectImage} />
          <GeneratePaletteSetting onChange={value => (this.generateColorPalette = value)} />
        </div>
      </div>
    )

    return (
      <div className="image-picker-container">
        <Link href={getAssetUrl('static/react-crop.css')} />
        {content}
      </div>
    )
  }
}

function GeneratePaletteSetting({ onChange }) {
  const [enabled, setEnabled] = useLocalStorage('PANDA_GENERATE_COLOR_PALETTE')

  React.useEffect(() => void onChange(enabled), [enabled, onChange])

  return (
    <Toggle
      label="自动生成配色（Beta）"
      enabled={enabled}
      onChange={setEnabled}
      className="image-picker-generate-palette-toggle"
    />
  )
}
