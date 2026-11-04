import ExifParser from 'exif-parser'

import {
  detectAiGenerator,
  detectEditingSoftware
} from '../../domain/policies/ai.policies.js'
import type { ImageMetadataSummary } from '../../domain/types/ai.types.js'

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
const PNG_AI_KEYS = new Set([
  'parameters',
  'prompt',
  'workflow',
  'invokeai_metadata',
  'sd-metadata',
  'dream',
  'comment'
])

const IPTC_AI_GENERATED = /digitalsourcetype\/trainedAlgorithmicMedia/i
const IPTC_AI_COMPOSITE = /digitalsourcetype\/compositeWithTrainedAlgorithmicMedia/i

export function detectImageFormat(buffer: Buffer): string {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'JPEG'
  }
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(PNG_SIGNATURE)) return 'PNG'
  if (
    buffer.length >= 12 &&
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return 'WEBP'
  }
  if (buffer.length >= 12 && buffer.toString('ascii', 4, 8) === 'ftyp') return 'HEIC'
  return 'DESCONHECIDO'
}

function emptySummary(format: string): ImageMetadataSummary {
  return {
    format,
    width: null,
    height: null,
    hasExif: false,
    cameraMake: null,
    cameraModel: null,
    software: null,
    captureDate: null,
    hasContentCredentials: false,
    aiGeneratorHint: null,
    editingSoftwareHint: null
  }
}

function asText(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const text = value.replace(/\0/g, '').trim()
  return text ? text.slice(0, 120) : null
}

function readJpeg(buffer: Buffer, summary: ImageMetadataSummary): void {
  try {
    const result = ExifParser.create(buffer)
      .enableSimpleValues(true)
      .enableImageSize(true)
      .parse()

    const tags = result.tags ?? {}
    summary.cameraMake = asText(tags.Make)
    summary.cameraModel = asText(tags.Model)
    summary.software = asText(tags.Software)
    summary.hasExif = Object.keys(tags).length > 0

    const original = tags.DateTimeOriginal ?? tags.CreateDate
    if (typeof original === 'number' && Number.isFinite(original)) {
      summary.captureDate = new Date(original * 1000).toISOString()
    }

    if (result.imageSize) {
      summary.width = result.imageSize.width
      summary.height = result.imageSize.height
    }
  } catch {
  }
}

function readPng(buffer: Buffer, summary: ImageMetadataSummary): void {
  let offset = 8

  while (offset + 12 <= buffer.length) {
    const length = buffer.readUInt32BE(offset)
    const type = buffer.toString('ascii', offset + 4, offset + 8)
    const dataStart = offset + 8
    const dataEnd = dataStart + length
    if (dataEnd > buffer.length) break

    if (type === 'IHDR' && length >= 8) {
      summary.width = buffer.readUInt32BE(dataStart)
      summary.height = buffer.readUInt32BE(dataStart + 4)
    }

    if (type === 'tEXt' || type === 'iTXt') {
      const data = buffer.subarray(dataStart, dataEnd)
      const sep = data.indexOf(0)
      if (sep > 0) {
        const key = data.toString('latin1', 0, sep).trim()
        let value = ''
        if (type === 'tEXt') {
          value = data.toString('latin1', sep + 1)
        } else if (data[sep + 1] === 0) {
          const langEnd = data.indexOf(0, sep + 3)
          const transEnd = langEnd >= 0 ? data.indexOf(0, langEnd + 1) : -1
          if (transEnd >= 0) value = data.toString('utf8', transEnd + 1)
        }

        const lowerKey = key.toLowerCase()
        if (lowerKey === 'software') summary.software = asText(value)
        if (PNG_AI_KEYS.has(lowerKey) && value.trim()) {
          summary.aiGeneratorHint =
            summary.aiGeneratorHint ??
            detectAiGenerator(value) ??
            (lowerKey === 'comment' ? null : 'Stable Diffusion / ComfyUI (prompt salvo no arquivo)')
        }
      }
    }

    if (type === 'IEND') break
    offset = dataEnd + 4
  }
}

function readWebp(buffer: Buffer, summary: ImageMetadataSummary): void {
  if (buffer.length >= 30 && buffer.toString('ascii', 12, 16) === 'VP8X') {
    summary.width = buffer.readUIntLE(24, 3) + 1
    summary.height = buffer.readUIntLE(27, 3) + 1
  }
}

function scanEmbeddedText(buffer: Buffer, summary: ImageMetadataSummary): void {
  const text = buffer.toString('latin1')

  if (/c2pa/i.test(text) && /jumb|jumd|caBX/i.test(text)) {
    summary.hasContentCredentials = true
  }

  if (IPTC_AI_GENERATED.test(text)) {
    summary.aiGeneratorHint =
      summary.aiGeneratorHint ?? 'Marcação IPTC/C2PA de conteúdo gerado por IA'
  } else if (IPTC_AI_COMPOSITE.test(text)) {
    summary.editingSoftwareHint =
      summary.editingSoftwareHint ?? 'Edição com IA generativa (marcação IPTC/C2PA)'
  }

  const creatorTool =
    text.match(/xmp:CreatorTool="([^"]{1,120})"/)?.[1] ??
    text.match(/<xmp:CreatorTool>([^<]{1,120})<\/xmp:CreatorTool>/)?.[1] ??
    null

  if (creatorTool && !summary.software) summary.software = creatorTool.trim()
}

export function extractImageMetadata(buffer: Buffer): ImageMetadataSummary {
  const format = detectImageFormat(buffer)
  const summary = emptySummary(format)

  try {
    if (format === 'JPEG') readJpeg(buffer, summary)
    if (format === 'PNG') readPng(buffer, summary)
    if (format === 'WEBP') readWebp(buffer, summary)
    scanEmbeddedText(buffer, summary)
  } catch {
  }

  summary.aiGeneratorHint = summary.aiGeneratorHint ?? detectAiGenerator(summary.software)
  summary.editingSoftwareHint =
    summary.editingSoftwareHint ?? detectEditingSoftware(summary.software)

  return summary
}
