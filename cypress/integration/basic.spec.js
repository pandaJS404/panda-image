/* global cy */
import { editorVisible } from '../support'

function blobToDataURL(win, blob) {
  return new Promise(resolve => {
    const reader = new win.FileReader()
    reader.onloadend = () => resolve(reader.result)
    reader.readAsDataURL(blob)
  })
}

describe('Basic', () => {
  it('Should open editor with the correct text encoding', () => {
    cy.visit(
      '/?code=%250A%252F*%2520Passing%2520Boolean%2520as%2520method%2520to%2520find%2520returns%2520the%250A%2520*%2520first%2520truthy%2520value%2520in%2520the%2520array!%250A%2520*%252F%250A%255Bfalse%252C%2520false%252C%2520%27%27%252C%2520undefined%252C%2520%27qwijo%27%252C%25200%255D.find(Boolean)%2520%252F%252F%2520%27qwijo%27'
    )
    editorVisible()

    cy.contains(
      '.container',
      "/* Passing Boolean as method to find returns the * first truthy value in the array! */[false, false, '', undefined, 'qwijo', 0].find(Boolean) // 'qwijo'"
    )
  })

  it('Should open editor with the correct text even with bad URI component', () => {
    cy.visit('/?code=%25')
    editorVisible()

    cy.contains('.container', '%')
  })

  it('Should clear editor state with Shift+Cmd+\\', () => {
    cy.visit('/?bg=red')
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
        })
      )
    })

    cy.location().its('pathname').should('eq', '/')
    cy.get('.container-bg .bg').should('have.css', 'background-color', 'rgb(171, 184, 195)')
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

  it('Should quick export 4x WEBP with the same code layout as the preview', () => {
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
    cy.get('.settings-tabs .ant-tabs-tab').eq(2).click()
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
