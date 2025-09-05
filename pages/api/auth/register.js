import { User } from '../../../lib/models/User'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { name, email, password } = req.body

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Missing required fields' })
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' })
    }

    const user = await User.create({ name, email, password })
    
    res.status(201).json({ 
      message: 'User created successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    })
  } catch (error) {
    if (error.message === 'User already exists') {
      return res.status(409).json({ message: 'User already exists' })
    }
    
    console.error('Registration error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}