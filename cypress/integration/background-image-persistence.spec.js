/* global cy */
import { editorVisible } from '../support'

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
    cy.get('.bg-select-panel .ant-tabs-tab').eq(2).click()
    cy.wait('@randomImageList')
    cy.get('.random-image-controls .random-image-action').first().click()
    cy.wait('@randomImageDownload')
    cy.wait(1000)

    cy.url().should(url =>
      expect(decodeURIComponent(url)).to.contain(`bgi=${REMOTE_IMAGE_URL}`)
    )
    cy.window().then(win => {
      expect(JSON.parse(win.localStorage.PANDA_BACKGROUND_IMAGE_ASSET)).to.deep.equal({
        source: REMOTE_IMAGE_URL,
        image: REMOTE_IMAGE_DATA_URL,
        selection: null,
      })
    })

    cy.reload()
    editorVisible()
    cy.url().should(url =>
      expect(decodeURIComponent(url)).to.contain(`bgi=${REMOTE_IMAGE_URL}`)
    )

    cy.get('[data-cy="display"]').click()
    cy.get('.bg-select-modal').should('be.visible')
    cy.get('.bg-select-panel .ant-tabs-tab').eq(2).click()
    cy.get('.image-picker-image-container .image-picker-static-preview__image')
      .invoke('attr', 'style')
      .should('contain', 'remote-preview')
  })

  it('restores local background assets and prefers the cropped selection after refresh', () => {
    cy.visit('/', {
      onBeforeLoad(win) {
        win.localStorage.setItem(
          'PANDA_STATE',
          JSON.stringify({
            backgroundMode: 'image',
            backgroundImageSource: null,
          })
        )
        win.localStorage.setItem(
          'PANDA_BACKGROUND_IMAGE_ASSET',
          JSON.stringify({
            source: null,
            image: LOCAL_IMAGE_DATA_URL,
            selection: LOCAL_SELECTION_DATA_URL,
          })
        )
      },
    })

    editorVisible()
    cy.url().should('not.contain', 'bgi=')

    cy.get('[data-cy="display"]').click()
    cy.get('.bg-select-modal').should('be.visible')
    cy.get('.bg-select-panel .ant-tabs-tab').eq(2).click()
    cy.get('.image-picker-image-container .image-picker-static-preview__image')
      .invoke('attr', 'style')
      .should('contain', 'selection-image')
  })
})
