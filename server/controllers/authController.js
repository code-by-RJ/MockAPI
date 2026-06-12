import User from '../models/User.js'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'

const signToken = (user) =>
  jwt.sign(
    { userId: user._id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  )

export const authController = {
  async register(req, res, next) {
    try {
      const { name, email, password } = req.body

      if (!name || !email || !password)
        return res.status(400).json({ success: false, error: 'All fields are required' })

      if (password.length < 6)
        return res.status(400).json({ success: false, error: 'Password must be at least 6 characters' })

      const existing = await User.findOne({ email })
      if (existing)
        return res.status(400).json({ success: false, error: 'Email already in use' })

      const hashed = await bcrypt.hash(password, 10)
      const user   = await User.create({ name, email, password: hashed })
      const token  = signToken(user)

      res.status(201).json({
        success: true,
        token,
        user: { id: user._id, name: user.name, email: user.email },
      })
    } catch (err) { next(err) }
  },

  async login(req, res, next) {
    try {
      const { email, password } = req.body

      if (!email || !password)
        return res.status(400).json({ success: false, error: 'Email and password required' })

      const user = await User.findOne({ email })
      if (!user)
        return res.status(401).json({ success: false, error: 'Invalid credentials' })

      const valid = await bcrypt.compare(password, user.password)
      if (!valid)
        return res.status(401).json({ success: false, error: 'Invalid credentials' })

      const token = signToken(user)

      res.json({
        success: true,
        token,
        user: { id: user._id, name: user.name, email: user.email },
      })
    } catch (err) { next(err) }
  },

  async me(req, res, next) {
    try {
      const user = await User.findById(req.user.userId).select('-password')
      if (!user)
        return res.status(404).json({ success: false, error: 'User not found' })

      res.json({ success: true, user })
    } catch (err) { next(err) }
  },
}