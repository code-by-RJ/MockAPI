export const errorHandler = (err, _req, res, _next) => {
  console.error('[Server Error]', err)

  const statusCode = err.statusCode || err.status || 500
  const message    = err.message || 'Internal Server Error'

  // Always return { success: false, error: "string" }
  // consistent with rest of controllers
  res.status(statusCode).json({
    success: false,
    error: message
  })
}