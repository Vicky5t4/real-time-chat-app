const jwt = require('jsonwebtoken')
const User = require('../models/User')

const authenticate = async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '')

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized - No token provided' })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET) // ✅ vicky123456789 env se
    req.user = await User.findById(decoded.userId).select('-password')
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized - User not found' })
    }
    next()
  } catch (err) {
    res.status(401).json({ error: 'Unauthorized - Invalid token' })
  }
}

module.exports = authenticate
