/* global cy */
import { editorVisible } from '../support'

describe('image picker url import errors', () => {
  beforeEach(() => {
    cy.clearLocalStorage()
    cy.visit('/')
    editorVisible()
    cy.get('[data-cy="display"]').click()
    cy.get('.bg-select-modal').should('be.visible')
    cy.get('.bg-select-panel .ant-tabs-tab').eq(2).click()
    cy.get('.image-picker-mode-button').contains('图片链接').click()
  })

  it('shows the targeted message for network-style URL import failures', () => {
    cy.intercept('GET', 'https://example.com/blocked-image.png', {
      forceNetworkError: true,
    }).as('blockedImage')

    cy.get('.image-picker-url-form input[type="text"]').type(
      'https://example.com/blocked-image.png',
    )
    cy.get('.image-picker-url-form').submit()

    cy.wait('@blockedImage')
    cy.get('.image-picker-error').should(
      'contain',
      '图片抓取失败，可能是链接源限制导致。你可以改用本地上传，或换一张图片重试。',
    )
  })

  it('shows the fallback message for non-network URL import failures', () => {
    cy.intercept('GET', 'https://example.com/missing-image.png', {
      statusCode: 404,
      body: 'missing',
    }).as('missingImage')

    cy.get('.image-picker-url-form input[type="text"]').type(
      'https://example.com/missing-image.png',
    )
    cy.get('.image-picker-url-form').submit()

    cy.wait('@missingImage')
    cy.get('.image-picker-error').should('contain', '图片抓取失败，请检查链接是否有效后重试。')
  })
})
