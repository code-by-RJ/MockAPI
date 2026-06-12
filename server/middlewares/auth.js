import jwt from 'jsonwebtoken'

export const authenticateToken = (req, res, next) => {
  const auth  = req.headers['authorization']
  const token = auth && auth.startsWith('Bearer ') ? auth.slice(7) : null

  if (!token)
    return res.status(401).json({ success: false, error: 'Access token required' })

  jwt.verify(token, process.env.JWT_SECRET, (err, payload) => {
    if (err)
      return res.status(403).json({ success: false, error: 'Invalid or expired token' })
    req.user = payload
    next()
  })
}