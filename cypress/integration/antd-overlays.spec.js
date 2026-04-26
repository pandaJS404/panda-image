/* global cy */
import { editorVisible } from '../support'

describe('Antd overlays smoke', () => {
  beforeEach(() => {
    cy.clearLocalStorage()
  })

  it('opens the major popovers and closes the theme create popover on outside click', () => {
    cy.visit('/')
    editorVisible()

    cy.get('[data-cy="themes-container"] .dropdown-container').click()
    cy.contains('[data-cy="dropdown-item"]', '新建主题 +').click()
    cy.get('.theme-create-popover').should('be.visible')

    cy.get('body').click(0, 0)
    cy.get('.theme-create-popover').should('not.be.visible')

    cy.get('[data-cy="display"]').click()
    cy.get('.bg-select-popover').should('be.visible')
    cy.contains('.bg-select-panel', '图片').click()
    cy.get('.bg-select-panel').should('be.visible')

    cy.get('[data-cy="settings-button"]').click()
    cy.get('.settings-popover').should('be.visible')
    cy.contains('.settings-panel', '其他').click()
    cy.get('[data-cy="format-code-button"]').should('be.visible')

    cy.get('.copy-trigger-button').click()
    cy.get('.copy-menu-popover').should('be.visible')

    cy.get('[data-cy="export-button"]').click()
    cy.get('.export-menu-popover').should('be.visible')
  })
})
