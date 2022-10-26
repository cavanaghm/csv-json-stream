module.exports = class ObjectStore {
  constructor(factory) {
    this.factory = factory;
    this.pool = new Array;
    this.len = 0;
  }

  get() {
    if (this.len > 0) {
      const out = this.pool[this.len -1]
      this.len--
      return out
    }
    return this.factory();
  }

  store(item) {
    this.pool[this.len] = item
    this.len++
  }
}
