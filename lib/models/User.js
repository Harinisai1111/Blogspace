import clientPromise from '../mongodb'
import bcrypt from 'bcryptjs'
import { ObjectId } from 'mongodb'

export class User {
  static async create(userData) {
    const client = await clientPromise
    const db = client.db('blogspace')
    
    const existingUser = await db.collection('users').findOne({ email: userData.email })
    if (existingUser) {
      throw new Error('User already exists')
    }
    
    const hashedPassword = await bcrypt.hash(userData.password, 12)
    
    const newUser = {
      name: userData.name,
      email: userData.email,
      password: hashedPassword,
      createdAt: new Date()
    }
    
    const result = await db.collection('users').insertOne(newUser)
    
    return {
      id: result.insertedId.toString(),
      name: newUser.name,
      email: newUser.email,
      createdAt: newUser.createdAt
    }
  }

  static async authenticate(email, password) {
    const client = await clientPromise
    const db = client.db('blogspace')
    
    const user = await db.collection('users').findOne({ email })
    if (!user) {
      throw new Error('Invalid credentials')
    }
    
    const isValid = await bcrypt.compare(password, user.password)
    if (!isValid) {
      throw new Error('Invalid credentials')
    }
    
    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      createdAt: user.createdAt
    }
  }

  static async getById(id) {
    const client = await clientPromise
    const db = client.db('blogspace')
    
    const user = await db.collection('users').findOne({ _id: new ObjectId(id) })
    if (!user) return null
    
    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      createdAt: user.createdAt
    }
  }
}