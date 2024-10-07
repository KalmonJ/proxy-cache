export class MemoryCache {
  data: Map<string, Buffer> = new Map()

  setValue(key: string, value: unknown) {

    if (value instanceof Buffer) {
      this.data.set(key, value)
      return
    }

    if (typeof value === "string") {
      const buffer = Buffer.from(value)
      this.data.set(key, buffer)
      return
    }

    const buffer = Buffer.from(JSON.stringify(value))
    this.data.set(key, buffer)
  }

  getValue(key: string) {
    if (!this.data.has(key)) return null

    const buffer = this.data.get(key)

    if (!buffer) return null

    return buffer
  }

  clear() {
    this.data.clear()
  }
}