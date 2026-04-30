class LRUCache {
  constructor(maxSize) {
    this._maxSize = maxSize
    this._map = new Map()
  }

  get(key) {
    if (!this._map.has(key)) {
      return undefined
    }
    const value = this._map.get(key)
    this._map.delete(key)
    this._map.set(key, value)
    return value
  }

  set(key, value) {
    if (this._map.has(key)) {
      this._map.delete(key)
    } else if (this._map.size >= this._maxSize) {
      const firstKey = this._map.keys().next().value
      this._map.delete(firstKey)
    }
    this._map.set(key, value)
  }

  has(key) {
    return this._map.has(key)
  }

  delete(key) {
    return this._map.delete(key)
  }

  clear() {
    this._map.clear()
  }

  get size() {
    return this._map.size
  }

  toArray() {
    return Array.from(this._map.values())
  }

  push(...items) {
    for (const item of items) {
      this.set(this._map.size, item)
    }
  }
}

export default LRUCache
