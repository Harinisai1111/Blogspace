import { Post } from '../../../lib/models/Post'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const { search } = req.query
      const posts = search ? await Post.search(search) : await Post.getAll()

      return res.status(200).json(posts) // ✅ trimmed list from Post.getAll / Post.search
    } catch (error) {
      console.error('Error fetching posts:', error)
      return res.status(500).json({ message: 'Internal server error' })
    }
  }

  if (req.method === 'POST') {
    try {
      const session = await getServerSession(req, res, authOptions)
      if (!session) {
        return res.status(401).json({ message: 'Unauthorized' })
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

      const postData = {
        title: title.trim(),
        content: content.trim(),
        image: image ? image.trim() : null,
        author: session.user.name,
        authorId: session.user.id
      }

      const post = await Post.create(postData)
      return res.status(201).json(post)
    } catch (error) {
      console.error('Error creating post:', error)
      return res.status(500).json({ message: 'Internal server error' })
    }
  }

  return res.status(405).json({ message: 'Method not allowed' })
}
