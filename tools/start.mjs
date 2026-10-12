// Production entry: sets NODE_ENV and boots the API + static site server.
process.env.NODE_ENV = process.env.NODE_ENV || 'production'
await import('../server/index.js')
