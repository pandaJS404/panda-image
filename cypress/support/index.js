/* global cy */
export const editorVisible = () => cy.get('.editor').should('be.visible')

function openEditorDb(win) {
  return new Promise((resolve, reject) => {
    const request = win.indexedDB.open('panda-editor')

    request.onupgradeneeded = () => {
      const db = request.result

      if (!db.objectStoreNames.contains('kv')) {
        db.createObjectStore('kv')
      }
    }

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
  })
}

export const clearEditorStorage = () =>
  cy.window().then(async win => {
    const db = await openEditorDb(win)

    return new Promise((resolve, reject) => {
      const transaction = db.transaction('kv', 'readwrite')
      const store = transaction.objectStore('kv')
      const request = store.clear()

      request.onerror = () => reject(request.error)
      transaction.oncomplete = () => resolve(true)
      transaction.onabort = () => reject(transaction.error)
    })
  })

export const readEditorStorage = () =>
  cy.window().then(async win => {
    const db = await openEditorDb(win)

    return new Promise((resolve, reject) => {
      const transaction = db.transaction('kv', 'readonly')
      const store = transaction.objectStore('kv')
      const request = store.get('PANDA_EDITOR_STORAGE')

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
    })
  })

export const writeEditorStorage = value =>
  cy.window().then(async win => {
    const db = await openEditorDb(win)

    return new Promise((resolve, reject) => {
      const transaction = db.transaction('kv', 'readwrite')
      const store = transaction.objectStore('kv')
      const request = store.put(value, 'PANDA_EDITOR_STORAGE')

      request.onerror = () => reject(request.error)
      transaction.oncomplete = () => resolve(true)
      transaction.onabort = () => reject(transaction.error)
    })
  })
