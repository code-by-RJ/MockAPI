import jwt from 'jsonwebtoken'

export const authenticateToken = (req, res, next) => {
  // Token now lives in an httpOnly cookie (not the Authorization header) —
  // the browser attaches it automatically on every same-credentialed request,
  // so client JS never touches the raw token (mitigates XSS token theft).
  const token = req.cookies?.token

  if (!token)
    return res.status(401).json({ success: false, error: 'Access token required' })

  jwt.verify(token, process.env.JWT_SECRET, (err, payload) => {
    if (err)
      return res.status(403).json({ success: false, error: 'Invalid or expired token' })
    req.user = payload
    next()
  })
}