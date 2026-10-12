import { Router } from 'express'
import multer from 'multer'
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { config } from '../lib/config.js'
import { requireAdmin, requireCsrf } from '../lib/auth.js'

export const uploadsRouter = Router()
uploadsRouter.use(requireAdmin)

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: config.maxUploadBytes, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (!/^image\/(jpeg|png|webp|avif)$/.test(file.mimetype)) {
      cb(new Error('Only JPEG, PNG, WEBP or AVIF images can be uploaded.'))
      return
    }
    cb(null, true)
  },
})

/** Reads intrinsic dimensions so the public site can reserve layout space. */
export const imageSize = (buffer) => {
  try {
    if (buffer.length > 24 && buffer.toString('ascii', 1, 4) === 'PNG') {
      return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) }
    }
    if (buffer.length > 4 && buffer[0] === 0xff && buffer[1] === 0xd8) {
      let offset = 2
      while (offset < buffer.length - 9) {
        if (buffer[offset] !== 0xff) {
          offset += 1
          continue
        }
        const marker = buffer[offset + 1]
        const length = buffer.readUInt16BE(offset + 2)
        if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
          return { height: buffer.readUInt16BE(offset + 5), width: buffer.readUInt16BE(offset + 7) }
        }
        offset += 2 + length
      }
    }
    if (buffer.length > 30 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') {
      if (buffer.toString('ascii', 12, 16) === 'VP8X') {
        const width = 1 + (buffer[24] | (buffer[25] << 8) | (buffer[26] << 16))
        const height = 1 + (buffer[27] | (buffer[28] << 8) | (buffer[29] << 16))
        return { width, height }
      }
      if (buffer.toString('ascii', 12, 16) === 'VP8 ') {
        return { width: buffer.readUInt16LE(26) & 0x3fff, height: buffer.readUInt16LE(28) & 0x3fff }
      }
      if (buffer.toString('ascii', 12, 16) === 'VP8L') {
        const bits = buffer.readUInt32LE(21)
        return { width: 1 + (bits & 0x3fff), height: 1 + ((bits >> 14) & 0x3fff) }
      }
    }
  } catch {
    /* fall through */
  }
  return {}
}

/**
 * Confirms the file really is the image it claims to be. The browser-provided
 * MIME type is not trusted — an upload path that accepts whatever it is told is
 * how malicious files end up on disk.
 */
const MAGIC = [
  { ext: 'jpg', mime: 'image/jpeg', test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { ext: 'png', mime: 'image/png', test: (b) => b.length > 8 && b.toString('hex', 0, 8) === '89504e470d0a1a0a' },
  { ext: 'webp', mime: 'image/webp', test: (b) => b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP' },
  { ext: 'avif', mime: 'image/avif', test: (b) => b.length > 12 && b.toString('ascii', 4, 8) === 'ftyp' && /avif|avis/.test(b.toString('ascii', 8, 12)) },
]

const detect = (buffer) => MAGIC.find((entry) => entry.test(buffer))

uploadsRouter.post('/', requireCsrf, (req, res, next) => {
  upload.single('file')(req, res, (error) => {
    if (error) {
      res.status(400).json({
        error: error.code === 'LIMIT_FILE_SIZE' ? `That file is larger than ${Math.round(config.maxUploadBytes / 1024 / 1024)} MB.` : error.message,
        code: 'UPLOAD_REJECTED',
      })
      return
    }
    try {
      if (!req.file) {
        res.status(400).json({ error: 'No file was received.', code: 'NO_FILE' })
        return
      }
      const kind = detect(req.file.buffer)
      if (!kind) {
        res.status(400).json({ error: 'That file is not a valid JPEG, PNG, WEBP or AVIF image.', code: 'BAD_FILE_TYPE' })
        return
      }

      // Random filename: uploads can never overwrite each other or shadow an
      // existing path, and a guessed URL cannot be used to probe the directory.
      const name = `${Date.now().toString(36)}-${crypto.randomBytes(6).toString('hex')}.${kind.ext}`
      const target = path.join(config.uploadsDir, name)
      fs.mkdirSync(config.uploadsDir, { recursive: true })
      try {
        fs.writeFileSync(target, req.file.buffer, { mode: 0o644 })
      } catch (error) {
        if (['EACCES', 'EROFS', 'EPERM', 'ENOSPC'].includes(error?.code)) {
          res.status(503).json({
            error:
              `The image could not be stored: ${config.uploadsDir} is not writable on this deployment (${error.code}). ` +
              'Set UPLOADS_DIR to a persistent, writable path.',
            code: 'STORAGE_READONLY',
          })
          return
        }
        throw error
      }

      const size = imageSize(req.file.buffer)
      console.log(`[uploads] stored ${name} (${Math.round(req.file.buffer.length / 1024)} KB)`)
      res.status(201).json({
        url: `/uploads/${name}`,
        name,
        bytes: req.file.buffer.length,
        mime: kind.mime,
        width: size.width,
        height: size.height,
      })
    } catch (cause) {
      next(cause)
    }
  })
})

uploadsRouter.get('/', (_req, res, next) => {
  try {
    fs.mkdirSync(config.uploadsDir, { recursive: true })
    const files = fs
      .readdirSync(config.uploadsDir)
      .filter((name) => /\.(jpe?g|png|webp|avif)$/i.test(name))
      .map((name) => {
        const stat = fs.statSync(path.join(config.uploadsDir, name))
        const size = imageSize(fs.readFileSync(path.join(config.uploadsDir, name)))
        return { name, url: `/uploads/${name}`, bytes: stat.size, uploadedAt: stat.mtime.toISOString(), ...size }
      })
      .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt))
    res.json({ files })
  } catch (error) {
    next(error)
  }
})

uploadsRouter.delete('/:name', requireCsrf, (req, res, next) => {
  try {
    const { name } = req.params
    // Path traversal guard: only a bare filename matching our own pattern.
    if (!/^[a-z0-9-]+\.(jpe?g|png|webp|avif)$/i.test(name)) {
      res.status(400).json({ error: 'Invalid file name.', code: 'BAD_NAME' })
      return
    }
    const target = path.join(config.uploadsDir, name)
    if (!target.startsWith(config.uploadsDir) || !fs.existsSync(target)) {
      res.status(404).json({ error: 'File not found.', code: 'NOT_FOUND' })
      return
    }
    fs.rmSync(target)
    res.json({ deleted: name })
  } catch (error) {
    next(error)
  }
})
