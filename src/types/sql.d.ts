interface SQLiteColumnInfo {
  cid: number
  name: string
  type: string
  notnull: number
  dflt_value: unknown
  pk: number
}

interface BlacklistRow {
  id: number
}