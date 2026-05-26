// função para normalizar documentos do MongoDB, convertendo o campo _id para id e retornando um novo objeto com os dados do documento.
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
