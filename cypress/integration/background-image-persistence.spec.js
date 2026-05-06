/* global cy */
import { clearEditorStorage, editorVisible, readEditorStorage } from '../support'

const REMOTE_IMAGE_URL = 'https://example.com/bing-wallpaper.png'
const REMOTE_IMAGE_DATA_URL =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="36"><rect width="64" height="36" fill="%2300a3ff"/><text x="4" y="20">remote-preview</text></svg>'
const LOCAL_IMAGE_DATA_URL =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="36"><rect width="64" height="36" fill="%23ff8a00"/><text x="4" y="20">local-image</text></svg>'
const LOCAL_SELECTION_DATA_URL =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="36"><rect width="64" height="36" fill="%232ecc71"/><text x="4" y="20">selection-image</text></svg>'

describe('background image persistence', () => {
  beforeEach(() => {
    cy.clearLocalStorage()
    clearEditorStorage()
  })

  it('persists builtin image source in the route and restores the current preview after refresh', () => {
    cy.visit('/')
    editorVisible()

    cy.get('[data-cy="display"]').click()
    cy.get('.bg-select-modal').should('be.visible')
    cy.get('.bg-select-panel .ant-tabs-tab').eq(2).click()
    cy.get('[data-cy="background-builtin-group-trigger"]').its('length').should('be.gte', 3)
    cy.get('[data-cy="background-builtin-group-trigger"][data-category="panda"]').click()
    cy.get('[data-cy="background-builtin-item"][data-category="panda"]')
      .its('length')
      .should('be.gte', 1)
    cy.get('[data-cy="background-builtin-item"][data-category="panda"]').first().click()
    cy.get('.image-picker-image-container .ReactCrop').should('be.visible')
    cy.get('.CodeMirror').should(([element]) => {
      expect(element.CodeMirror.getValue()).to.contain('// 图片来源：Panda')
    })
    cy.wait(1000)

    readEditorStorage().should(storage => {
      expect(storage.assets.backgroundImageSource).to.eq('builtin:panda-bg-01')
      expect(storage.assets.backgroundImage).to.eq(null)
      expect(storage.assets.backgroundImageSelection).to.eq(null)
    })

    cy.reload()
    editorVisible()

    cy.get('.container-bg .bg').invoke('css', 'background-image').should('not.eq', 'none')
    cy.get('.bg-color-container .bg-color')
      .invoke('attr', 'style')
      .should('contain', 'url(')
      .and('not.contain', 'gradient')

    cy.get('[data-cy="display"]').click()
    cy.get('.bg-select-modal').should('be.visible')
    cy.get('.bg-select-panel .ant-tabs-tab').eq(2).click()
    cy.get('[data-cy="background-builtin-group-trigger"][data-category="panda"]')
      .closest('.ant-collapse-item')
      .should('have.class', 'ant-collapse-item-active')
    cy.get('[data-cy="background-builtin-item"][data-category="panda"]')
      .first()
      .should('have.attr', 'data-selected')
    cy.get('.CodeMirror').should(([element]) => {
      expect(element.CodeMirror.getValue()).to.contain('// 图片来源：Panda')
    })
    cy.get('.image-picker-image-container .image-picker-static-preview__image')
      .invoke('attr', 'style')
      .should('contain', 'url(')
  })

  it('persists remote image source in the route and restores the current preview after refresh', () => {
    cy.intercept('GET', '/api/random-image', [
      {
        id: 'bing-1',
        url: REMOTE_IMAGE_URL,
        photographer: {
          name: 'Bing Test',
          profile_url: 'https://www.bing.com/',
          sourceName: 'Bing 壁纸',
        },
      },
    ]).as('randomImageList')

    cy.intercept('GET', '/api/random-image-download*', {
      id: 'bing-1',
      url: REMOTE_IMAGE_URL,
      dataURL: REMOTE_IMAGE_DATA_URL,
      photographer: {
        name: 'Bing Test',
        profile_url: 'https://www.bing.com/',
        sourceName: 'Bing 壁纸',
      },
    }).as('randomImageDownload')

    cy.visit('/')
    editorVisible()

    cy.get('[data-cy="display"]').click()
    cy.get('.bg-select-modal').should('be.visible')
    cy.get('.bg-select-panel .ant-tabs-tab').eq(1).click()
    cy.get('[data-cy="background-gradient-item"][data-gradient-name="Warm Flame"]').click()
    cy.get('.bg-select-panel .ant-tabs-tab').eq(2).click()
    cy.wait('@randomImageList')
    cy.get('.random-image-controls .random-image-action').first().click()
    cy.wait('@randomImageDownload')
    cy.wait(1000)

    readEditorStorage().should(storage => {
      expect(storage.assets.backgroundImageSource).to.eq(REMOTE_IMAGE_URL)
      expect(storage.assets.backgroundImage).to.eq(null)
      expect(storage.assets.backgroundImageSelection).to.eq(null)
    })

    cy.reload()
    editorVisible()
    cy.get('.container-bg .bg').invoke('css', 'background-image').should('not.eq', 'none')
    cy.get('.bg-color-container .bg-color')
      .invoke('attr', 'style')
      .should('contain', REMOTE_IMAGE_URL)
      .and('not.contain', 'gradient')

    cy.get('[data-cy="display"]').click()
    cy.get('.bg-select-modal').should('be.visible')
    cy.get('.bg-select-panel .ant-tabs-tab').eq(2).click()
    cy.get('.image-picker-image-container .image-picker-static-preview__image')
      .invoke('attr', 'style')
      .should('contain', REMOTE_IMAGE_URL)
  })

  it('restores local background assets and prefers the cropped selection after refresh', () => {
    cy.visit('/', {
      onBeforeLoad(win) {
        win.localStorage.setItem(
          'PANDA_EDITOR_STORAGE',
          JSON.stringify({
            template: {},
            window: {
              backgroundMode: 'image',
              backgroundImageSource: null,
            },
            editor: {},
            watermark: {},
            theme: {},
            code: {},
            assets: {
              backgroundImage: LOCAL_IMAGE_DATA_URL,
              backgroundImageSource: null,
              backgroundImageSelection: LOCAL_SELECTION_DATA_URL,
            },
          }),
        )
      },
    })

    editorVisible()

    readEditorStorage().should(storage => {
      expect(storage.window.backgroundMode).to.eq('image')
      expect(storage.assets.backgroundImage).to.eq(LOCAL_IMAGE_DATA_URL)
      expect(storage.assets.backgroundImageSelection).to.eq(LOCAL_SELECTION_DATA_URL)
    })

    cy.get('[data-cy="display"]').click()
    cy.get('.bg-select-modal').should('be.visible')
    cy.get('.bg-select-panel .ant-tabs-tab').eq(2).click()
    cy.get('.image-picker-image-container .image-picker-static-preview__image')
      .invoke('attr', 'style')
      .should('contain', 'selection-image')
  })

  it('falls back to the stored gradient when image mode is restored without a usable image asset', () => {
    const gradient = 'linear-gradient(135deg, #96F8D6 0%, #44D8F8 100%)'

    cy.visit('/', {
      onBeforeLoad(win) {
        win.localStorage.setItem(
          'PANDA_EDITOR_STORAGE',
          JSON.stringify({
            template: {},
            window: {
              backgroundMode: 'image',
              backgroundGradient: gradient,
              backgroundGradientBlendMode: null,
              backgroundImageSource: null,
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

    readEditorStorage().should(storage => {
      expect(storage.window.backgroundMode).to.eq('image')
      expect(storage.window.backgroundGradient).to.eq(gradient)
    })

    cy.get('.container-bg .bg')
      .invoke('css', 'background-image')
      .should('match', /gradient/i)
    cy.get('.bg-color-container .bg-color')
      .invoke('attr', 'style')
      .should('contain', 'linear-gradient')
      .and('not.contain', 'url(')
  })
})
