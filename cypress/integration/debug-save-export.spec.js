/* global cy */
import { editorVisible } from '../support'

describe('Debug Save Export', () => {
  it('Writes the exported PNG for visual inspection', () => {
    cy.visit('/')
    editorVisible()
    cy.get('.CodeMirror').should('exist')

    cy.window().then(win => {
      win.__exportBlob = null

      cy.stub(win.URL, 'createObjectURL').callsFake(blob => {
        win.__exportBlob = blob
        return 'blob:panda-export'
      })

      cy.stub(win.HTMLAnchorElement.prototype, 'click').callsFake(() => {})
    })

    cy.get('[data-cy="quick-export-button"]').click()

    cy.window({ timeout: 30000 })
      .should(win => {
        expect(win.__exportBlob).to.be.instanceof(win.Blob)
      })
      .then(async win => {
        const dataUrl = await new Promise(resolve => {
          const reader = new win.FileReader()
          reader.onloadend = () => resolve(reader.result)
          reader.readAsDataURL(win.__exportBlob)
        })

        return cy.writeFile(
          'cypress/tmp/exported-from-app.png',
          dataUrl.replace(/^data:image\/png;base64,/, ''),
          'base64',
        )
      })

    cy.get('#export-container').screenshot('debug-preview-container')
  })
})
