/* global cy */
import { editorVisible } from '../support'

describe('Antd overlays smoke', () => {
  beforeEach(() => {
    cy.clearLocalStorage()
  })

  it('opens the major overlays and closes the theme create modal on outside click', () => {
    cy.visit('/')
    editorVisible()

    cy.get('[data-cy="settings-button"]').should('have.attr', 'aria-tooltip')
    cy.get('[data-cy="export-button"]').should('have.attr', 'aria-tooltip')
    cy.get('[data-cy="quick-export-button"]').should('have.attr', 'aria-tooltip')
    cy.get('[data-cy="display"]').should('have.attr', 'aria-tooltip')
    cy.get('.copy-trigger-button').should('have.attr', 'aria-tooltip')
    cy.get('[data-cy="themes-container"] .dropdown-container').should('have.attr', 'aria-tooltip')
    cy.get('.toolbar .toolbar-group--leading > .dropdown-container')
      .first()
      .should('have.attr', 'aria-tooltip')

    cy.get('[data-cy="settings-button"]').trigger('mouseenter', { force: true })
    cy.get('[data-cy="export-button"]').trigger('mouseenter', { force: true })
    cy.get('[data-cy="display"]').trigger('mouseenter', { force: true })
    cy.get('.copy-trigger-button').trigger('mouseenter', { force: true })
    cy.get('.ant-tooltip').should('not.exist')

    cy.get('[data-cy="themes-container"] .dropdown-container').click()
    cy.contains('[data-cy="dropdown-item"]', '新建主题 +').click()
    cy.get('.theme-create-modal').should('be.visible')

    cy.get('.theme-create-modal .ant-modal-mask').click({ force: true })
    cy.get('.theme-create-modal').should('not.exist')

    cy.get('[data-cy="display"]').click()
    cy.get('.bg-select-modal').should('be.visible')
    cy.get('.bg-select-panel .ant-tabs-tab').should('have.length', 3)
    cy.get('.bg-select-panel .ant-tabs-tab').eq(1).click()
    cy.get('[data-cy="background-gradient-item"]').its('length').should('be.gt', 0)
    cy.get('.bg-select-panel .ant-tabs-tab').eq(2).click()
    cy.get('.bg-select-panel').should('be.visible')
    cy.get('.bg-select-modal .ant-modal-close').click()
    cy.get('.bg-select-modal').should('not.exist')

    cy.get('[data-cy="settings-button"]').click()
    cy.get('.settings-modal').should('be.visible')
    cy.get('.settings-modal .ant-slider').its('length').should('be.gte', 2)
    cy.get('.settings-modal .slider-control').should('not.exist')
    cy.get('.settings-modal .ant-slider').first().click('center')
    cy.wait(900)
    cy.window().then(win => {
      const state = JSON.parse(win.localStorage.PANDA_STATE)
      expect(state.paddingVertical).to.match(/px$/)
    })
    cy.get('.settings-tabs .ant-tabs-tab').last().click()
    cy.get('[data-cy="format-code-button"]').should('be.visible')
    cy.get('.settings-modal .ant-modal-close').click()
    cy.get('.settings-modal').should('not.exist')

    cy.get('[data-cy="export-button"]').click()
    cy.get('.export-menu-modal').should('be.visible')
  })

  it('keeps theme preset selection and font upload affordance working inside ListSetting select', () => {
    cy.visit('/')
    editorVisible()

    cy.get('[data-cy="themes-container"] .dropdown-container').click()
    cy.get('[data-cy="dropdown-item"]').first().click()
    cy.get('.theme-create-modal').should('be.visible')

    cy.get('.theme-create-color-circle')
      .first()
      .invoke('attr', 'style')
      .then(initialStyle => {
        cy.get('.theme-create-select .list-setting-display-button').click()
        cy.get('.list-setting-popover').should('be.visible')
        cy.contains('.list-setting-item-button', 'Cobalt').click()
        cy.get('.theme-create-select .list-setting-display-value').should('contain', 'Cobalt')
        cy.get('.theme-create-color-circle')
          .first()
          .invoke('attr', 'style')
          .should('not.eq', initialStyle)
      })

    cy.get('.theme-create-modal .ant-modal-close').click()
    cy.get('.theme-create-modal').should('not.exist')

    cy.get('[data-cy="settings-button"]').click()
    cy.get('.settings-modal').should('be.visible')
    cy.get('.settings-tabs .ant-tabs-tab').eq(1).click()

    cy.get('.font-select input[type="file"]').then(([input]) => {
      cy.stub(input, 'click').as('fontUploadClick')
    })

    cy.get('.font-select .list-setting-display-value')
      .invoke('text')
      .then(valueBefore => {
        cy.get('.font-select .list-setting-display-button').click()
        cy.get('.font-select-popover').should('be.visible')
        cy.get('.font-select-popover .list-setting-option').first().click()
        cy.get('@fontUploadClick').should('have.been.calledOnce')
        cy.get('.font-select .list-setting-display-value').should($value => {
          expect($value.text().trim()).to.eq(valueBefore.trim())
        })
      })
  })
})
