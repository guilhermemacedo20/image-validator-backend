export function normalizeMongoDocument<T extends { _id?: unknown }>(
  document: T | null
) {
  if (!document) return null

  const object = JSON.parse(JSON.stringify(document))

  return {
    ...object,
    id: String(object._id)
  }
}
