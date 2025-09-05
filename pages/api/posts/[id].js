import { Post } from '../../../lib/models/Post'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import { ObjectId } from 'mongodb'

export default async function handler(req, res) {
  const { id } = req.query

  // Validate ObjectId format
  if (!id || !ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid post ID' })
  }

  if (req.method === 'GET') {
    try {
      const post = await Post.getById(id)

      if (!post) {
        return res.status(404).json({ message: 'Post not found' })
      }

      return res.status(200).json(post) // ✅ already trimmed by Post.getById
    } catch (error) {
      console.error('Error fetching post:', error)
      return res.status(500).json({ message: 'Internal server error' })
    }
  }

  if (req.method === 'PUT') {
    try {
      const session = await getServerSession(req, res, authOptions)
      if (!session) {
        return res.status(401).json({ message: 'Unauthorized' })
      }

      const post = await Post.getById(id)
      if (!post) {
        return res.status(404).json({ message: 'Post not found' })
      }

      // Ownership check
      if (post.authorId !== session.user.id) {
        return res.status(403).json({ message: 'Forbidden - You can only edit your own posts' })
      }

      const { title, content, image } = req.body

      if (!title || !content) {
        return res.status(400).json({ message: 'Title and content are required' })
      }
      if (title.length < 5) {
        return res.status(400).json({ message: 'Title must be at least 5 characters' })
      }
      if (content.length < 50) {
        return res.status(400).json({ message: 'Content must be at least 50 characters' })
      }

      const updateData = {
        title: title.trim(),
        content: content.trim(),
        image: image ? image.trim() : null,
      }

      const updatedPost = await Post.update(id, updateData)
      return res.status(200).json(updatedPost)
    } catch (error) {
      console.error('Error updating post:', error)
      return res.status(500).json({ message: 'Internal server error' })
    }
  }

  if (req.method === 'DELETE') {
    try {
      const session = await getServerSession(req, res, authOptions)
      if (!session) {
        return res.status(401).json({ message: 'Unauthorized' })
      }

      const post = await Post.getById(id)
      if (!post) {
        return res.status(404).json({ message: 'Post not found' })
      }

      if (post.authorId !== session.user.id) {
        return res.status(403).json({ message: 'Forbidden - You can only delete your own posts' })
      }

      await Post.delete(id)
      return res.status(200).json({ message: 'Post deleted successfully' })
    } catch (error) {
      console.error('Error deleting post:', error)
      return res.status(500).json({ message: 'Internal server error' })
    }
  }

  return res.status(405).json({ message: 'Method not allowed' })
}
