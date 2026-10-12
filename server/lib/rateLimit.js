/**
 * Dependency-free fixed-window rate limiter.
 * Deliberately simple: enough to blunt scripted abuse of the login and form
 * endpoints without adding an external store.
 */
export const rateLimit = ({ windowMs, max, message }) => {
  const hits = new Map()

  setInterval(() => {
    const now = Date.now()
    for (const [key, record] of hits) if (now - record.start > windowMs) hits.delete(key)
  }, windowMs).unref?.()

  return (req, res, next) => {
    const key = req.ip || req.socket?.remoteAddress || 'unknown'
    const now = Date.now()
    const record = hits.get(key)

    if (!record || now - record.start > windowMs) {
      hits.set(key, { start: now, count: 1 })
      next()
      return
    }

    record.count += 1
    if (record.count > max) {
      const retryAfter = Math.ceil((record.start + windowMs - now) / 1000)
      // Say how long, in words — "please wait a few minutes" with no number is
      // the kind of message that makes people give up and email instead.
      const minutes = Math.max(1, Math.ceil(retryAfter / 60))
      res.setHeader('Retry-After', String(retryAfter))
      res.status(429).json({
        error: `${message.replace(/\s*Please wait.*$/, '')} Try again in about ${minutes} minute${minutes === 1 ? '' : 's'}.`,
        code: 'RATE_LIMITED',
        retryAfter,
      })
      return
    }
    next()
  }
}
