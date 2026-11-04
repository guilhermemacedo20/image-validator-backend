declare module 'exif-parser' {
  interface ExifResult {
    tags?: Record<string, unknown>
    imageSize?: { width: number; height: number }
  }
  interface ExifParserInstance {
    enableSimpleValues(value: boolean): ExifParserInstance
    enableImageSize(value: boolean): ExifParserInstance
    parse(): ExifResult
  }
  const ExifParser: { create(buffer: Buffer): ExifParserInstance }
  export default ExifParser
}
