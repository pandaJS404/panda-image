/* global cy */
import { clearEditorStorage, editorVisible, readEditorStorage } from '../support'

function blobToDataURL(win, blob) {
  return new Promise(resolve => {
    const reader = new win.FileReader()
    reader.onloadend = () => resolve(reader.result)
    reader.readAsDataURL(blob)
  })
}

const LOCAL_BACKGROUND_DATA_URL =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="36"><rect width="64" height="36" fill="%23ff8a00"/></svg>'

function loadImage(win, src) {
  return new Promise((resolve, reject) => {
    const image = new win.Image()

    image.onload = () => resolve(image)
    image.onerror = reject
    image.src = src
  })
}

function getImagePixel(win, image, x, y) {
  const canvas = win.document.createElement('canvas')
  const context = canvas.getContext('2d')

  canvas.width = image.naturalWidth
  canvas.height = image.naturalHeight
  context.drawImage(image, 0, 0)

  return Array.from(context.getImageData(x, y, 1, 1).data)
}

function installClipboardStub(win, { supportsWebp }) {
  const clipboardWrite = cy
    .stub()
    .callsFake(() => Promise.resolve())
    .as('clipboardWrite')

  Object.defineProperty(win.navigator, 'clipboard', {
    configurable: true,
    value: {
      write: clipboardWrite,
    },
  })

  function ClipboardItem(data) {
    this.data = data
  }

  ClipboardItem.supports = type => (type === 'image/webp' ? supportsWebp : type === 'image/png')

  Object.defineProperty(win, 'ClipboardItem', {
    configurable: true,
    value: ClipboardItem,
  })
}

function waitForDefaultExportLayout() {
  cy.get('#export-container', { timeout: 10000 }).should(([element]) => {
    expect(element.offsetWidth).to.be.greaterThan(890)
  })
}

describe('Basic', () => {
  beforeEach(() => {
    cy.clearLocalStorage()
    clearEditorStorage()
  })

  it('Should open editor with the correct text encoding', () => {
    cy.visit('/', {
      onBeforeLoad(win) {
        win.localStorage.setItem(
          'PANDA_EDITOR_STORAGE',
          JSON.stringify({
            template: {},
            window: {},
            editor: {},
            watermark: {},
            theme: {},
            code: {
              code: "\n/* Passing Boolean as method to find returns the\n * first truthy value in the array!\n */\n[false, false, '', undefined, 'qwijo', 0].find(Boolean) // 'qwijo'",
            },
            assets: {},
          }),
        )
      },
    })
    editorVisible()

    cy.contains(
      '.container',
      "/* Passing Boolean as method to find returns the * first truthy value in the array! */[false, false, '', undefined, 'qwijo', 0].find(Boolean) // 'qwijo'",
    )
  })

  it('Should open editor with the correct text even with bad URI component', () => {
    cy.visit('/', {
      onBeforeLoad(win) {
        win.localStorage.setItem(
          'PANDA_EDITOR_STORAGE',
          JSON.stringify({
            template: {},
            window: {},
            editor: {},
            watermark: {},
            theme: {},
            code: {
              code: '%',
            },
            assets: {},
          }),
        )
      },
    })
    editorVisible()

    cy.contains('.container', '%')
  })

  it('Should clear editor state with Shift+Cmd+\\', () => {
    cy.visit('/', {
      onBeforeLoad(win) {
        win.localStorage.setItem(
          'PANDA_EDITOR_STORAGE',
          JSON.stringify({
            template: {},
            window: {
              backgroundColor: 'red',
            },
            editor: {},
            watermark: {},
            theme: {},
            code: {},
            assets: {},
          }),
        )
      },
    })
    editorVisible()
    cy.wait(50)

    cy.window().then(win => {
      win.document.body.dispatchEvent(
        new win.KeyboardEvent('keydown', {
          key: '|',
          code: 'Backslash',
          ctrlKey: true,
          shiftKey: true,
          bubbles: true,
          cancelable: true,
        }),
      )
    })

    cy.location().its('pathname').should('eq', '/')
    cy.get('.container-bg .bg')
      .invoke('css', 'background-image')
      .should('match', /panda-bg-01|url/i)
    readEditorStorage().should(storage => {
      expect(storage.window.backgroundColor).to.eq('rgba(171, 184, 195, 1)')
    })
  })

  it('Should keep CodeMirror input stable while typing', () => {
    const firstLine =
      "const pluckDeep = key => obj => key.split('.').reduce((accum, key) => accum[key], obj)"
    const secondLine = 'ssas'
    const thirdLine =
      'const compose = (...fns) => res => fns.reduce((accum, next) => next(accum), res)'
    const typedValue = `${firstLine}\n${secondLine}\n${thirdLine}`

    cy.visit('/')
    editorVisible()

    cy.get('.CodeMirror').then(([element]) => {
      element.CodeMirror.setValue('')
      element.CodeMirror.focus()
    })

    cy.get('.CodeMirror textarea')
      .type(firstLine, { delay: 0, force: true })
      .type('{enter}', { force: true })
      .type(secondLine, { delay: 0, force: true })
      .type('{enter}', { force: true })
      .type(thirdLine, { delay: 0, force: true })

    cy.get('.CodeMirror').then(([element]) => {
      expect(element.CodeMirror.getValue()).to.eq(typedValue)
    })
  })

  it('Should copy image as 2x WEBP when the clipboard supports it', () => {
    cy.visit('/', {
      onBeforeLoad(win) {
        installClipboardStub(win, { supportsWebp: true })
      },
    })
    editorVisible()
    waitForDefaultExportLayout()

    cy.get('[data-cy="copy-image-button"]').click()
    cy.get('@clipboardWrite', { timeout: 30000 }).should('have.been.calledOnce')
    cy.contains('.ant-message-notice', '已复制 2x WebP').should('be.visible')

    cy.get('@clipboardWrite').then(clipboardWrite => {
      cy.window().then({ timeout: 40000 }, async win => {
        const exportNode = win.document.getElementById('export-container')
        const clipboardItem = clipboardWrite.firstCall.args[0][0]
        const webpBlob = clipboardItem.data['image/webp']
        const exportedDataUrl = await blobToDataURL(win, webpBlob)
        const image = await new Promise((resolve, reject) => {
          const exportedImage = new win.Image()

          exportedImage.onload = () => resolve(exportedImage)
          exportedImage.onerror = reject
          exportedImage.src = exportedDataUrl
        })

        expect(webpBlob).to.be.instanceof(win.Blob)
        expect(webpBlob.type).to.eq('image/webp')
        expect(image.naturalWidth).to.eq(exportNode.offsetWidth * 2)
        expect(image.naturalHeight).to.eq(exportNode.offsetHeight * 2)
      })
    })
  })

  it('Should fall back to 2x PNG when the clipboard does not support WEBP', () => {
    cy.visit('/', {
      onBeforeLoad(win) {
        installClipboardStub(win, { supportsWebp: false })
      },
    })
    editorVisible()
    waitForDefaultExportLayout()

    cy.get('[data-cy="copy-image-button"]').click()
    cy.get('@clipboardWrite', { timeout: 30000 }).should('have.been.calledOnce')
    cy.contains('.ant-message-notice', '当前剪贴板不支持 WebP，已复制 2x PNG').should('be.visible')

    cy.get('@clipboardWrite').then(clipboardWrite => {
      cy.window().then({ timeout: 40000 }, async win => {
        const exportNode = win.document.getElementById('export-container')
        const clipboardItem = clipboardWrite.firstCall.args[0][0]
        const pngBlob = clipboardItem.data['image/png']
        const exportedDataUrl = await blobToDataURL(win, pngBlob)
        const image = await new Promise((resolve, reject) => {
          const exportedImage = new win.Image()

          exportedImage.onload = () => resolve(exportedImage)
          exportedImage.onerror = reject
          exportedImage.src = exportedDataUrl
        })

        expect(pngBlob).to.be.instanceof(win.Blob)
        expect(pngBlob.type).to.eq('image/png')
        expect(image.naturalWidth).to.eq(exportNode.offsetWidth * 2)
        expect(image.naturalHeight).to.eq(exportNode.offsetHeight * 2)
      })
    })
  })

  it('Should quick export 4x WEBP with the same code layout as the preview', () => {
    cy.visit('/')
    editorVisible()
    cy.get('.CodeMirror').should('exist')
    waitForDefaultExportLayout()

    cy.window().then(win => {
      win.__exportBlob = null

      cy.stub(win.URL, 'createObjectURL').callsFake(blob => {
        win.__exportBlob = blob
        return 'blob:panda-export'
      })

      cy.stub(win.HTMLAnchorElement.prototype, 'click').callsFake(() => {})
    })

    cy.get('[data-cy="quick-export-button"]').click()

    cy.window({ timeout: 30000 }).should(win => {
      expect(win.__exportBlob).to.be.instanceof(win.Blob)
    })

    cy.window().then({ timeout: 40000 }, async win => {
      const exportNode = win.document.getElementById('export-container')
      const exportedDataUrl = await blobToDataURL(win, win.__exportBlob)
      const image = await new Promise((resolve, reject) => {
        const exportedImage = new win.Image()

        exportedImage.onload = () => resolve(exportedImage)
        exportedImage.onerror = reject
        exportedImage.src = exportedDataUrl
      })

      expect(win.__exportBlob.type).to.eq('image/webp')
      expect(win.__exportBlob.size).to.be.greaterThan(0)
      expect(image.naturalWidth).to.eq(exportNode.offsetWidth * 4)
      expect(image.naturalHeight).to.eq(exportNode.offsetHeight * 4)
    })
  })

  it('Should export JPG and WEBP formats', () => {
    cy.visit('/')
    editorVisible()

    cy.window().then(win => {
      win.__exportBlob = null

      cy.stub(win.URL, 'createObjectURL').callsFake(blob => {
        win.__exportBlob = blob
        return 'blob:panda-export'
      })

      cy.stub(win.HTMLAnchorElement.prototype, 'click').callsFake(() => {})
    })

    cy.get('#export-menu').click()
    cy.get('.export-menu-modal').should('be.visible')
    cy.get('#export-jpg').click()

    cy.window({ timeout: 30000 }).should(win => {
      expect(win.__exportBlob).to.be.instanceof(win.Blob)
      expect(win.__exportBlob.type).to.eq('image/jpeg')
    })

    cy.get('#export-menu').click()
    cy.get('.export-menu-modal').should('be.visible')
    cy.get('#export-webp').click()

    cy.window({ timeout: 30000 }).should(win => {
      expect(win.__exportBlob).to.be.instanceof(win.Blob)
      expect(win.__exportBlob.type).to.eq('image/webp')
    })
  })

  it('Should keep local uploaded background images in PNG exports', () => {
    const localBackgroundState = {
      backgroundMode: 'image',
      backgroundImage: LOCAL_BACKGROUND_DATA_URL,
      backgroundImageSource: null,
      backgroundImageSelection: null,
      backgroundGradient: null,
      backgroundGradientBlendMode: null,
      windowControls: false,
      watermark: false,
      dropShadow: false,
    }

    cy.visit('/', {
      onBeforeLoad(win) {
        win.localStorage.setItem(
          'PANDA_EDITOR_STORAGE',
          JSON.stringify({
            template: {},
            window: localBackgroundState,
            editor: {},
            watermark: {},
            theme: {},
            code: {},
            assets: {
              backgroundImage: LOCAL_BACKGROUND_DATA_URL,
              backgroundImageSource: null,
              backgroundImageSelection: null,
            },
          }),
        )
      },
    })
    editorVisible()
    waitForDefaultExportLayout()

    readEditorStorage().should(storage => {
      expect(storage.window.backgroundMode).to.eq('image')
      expect(storage.assets.backgroundImage).to.eq(LOCAL_BACKGROUND_DATA_URL)
    })

    cy.window().then(win => {
      win.__exportBlob = null

      cy.stub(win.URL, 'createObjectURL').callsFake(blob => {
        win.__exportBlob = blob
        return 'blob:panda-export'
      })

      cy.stub(win.HTMLAnchorElement.prototype, 'click').callsFake(() => {})
    })

    cy.get('#export-menu').click()
    cy.get('.export-menu-modal').should('be.visible')
    cy.get('#export-png').click()

    cy.window({ timeout: 30000 }).should(win => {
      expect(win.__exportBlob).to.be.instanceof(win.Blob)
      expect(win.__exportBlob.type).to.eq('image/png')
    })

    cy.window().then({ timeout: 40000 }, async win => {
      const exportedDataUrl = await blobToDataURL(win, win.__exportBlob)
      const image = await loadImage(win, exportedDataUrl)
      const [red, green, blue, alpha] = getImagePixel(win, image, 20, 20)

      expect(alpha).to.eq(255)
      expect(red).to.be.greaterThan(240)
      expect(green).to.be.within(120, 190)
      expect(blue).to.be.lessThan(25)
    })
  })

  it('Should beautify export default object snippets without outer braces', () => {
    const messyCode = `export default

    name: 'all-food',

    props: {
      dataName: String
    }`

    const expectedCode = `export default {
  name: 'all-food',
  props: {
    dataName: String,
  },
}`

    cy.visit('/')
    editorVisible()

    cy.get('.CodeMirror').then(([element]) => {
      element.CodeMirror.setValue(messyCode)
    })

    cy.get('[data-cy="settings-button"]').click()
    cy.get('.settings-modal').should('be.visible')
    cy.get('.settings-tabs .ant-tabs-tab').last().click()
    cy.get('[data-cy="format-code-button"]').click()

    cy.get('.CodeMirror').should(([element]) => {
      expect(element.CodeMirror.getValue()).to.eq(expectedCode)
    })
  })

  it("Should contain id's for CLI integrations to use", () => {
    cy.visit('/')
    editorVisible()
    cy.get('#export-container').should('have.length', 1)
    cy.get('.export-container').should('have.length', 1)
    cy.get('#export-menu').should('have.length', 1)
    cy.get('#export-menu').click()
    cy.get('.export-menu-modal').should('be.visible')
    cy.get('#export-png').should('have.length', 1)
    cy.get('#export-jpg').should('have.length', 1)
    cy.get('#export-webp').should('have.length', 1)
    cy.get('#export-svg').should('have.length', 1)
  })

  /*
   * This test should only be run locally since it actually downloads a file
   * for verification.
   */
  it.skip('Should download a PNGs and SVGs', () => {
    cy.visit('/')
    editorVisible()

    cy.contains('span[type="button"]', 'Save Image').click()
    cy.get('#downshift-2-item-0').click()

    cy.wait(1000)

    cy.contains('span[type="button"]', 'Save Image').click()
    cy.get('#downshift-2-item-1').click()

    cy.wait(1000)
  })
})
