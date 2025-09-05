import { useState } from 'react'
import { useSession } from 'next-auth/react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { Post } from '../../lib/models/Post'
import { ObjectId } from 'mongodb'

export async function getServerSideProps({ params }) {
  try {
    const { id } = params
    
    // Validate ObjectId format
    if (!id || !ObjectId.isValid(id)) {
      return { notFound: true }
    }
    
    const post = await Post.getById(id)
    
    if (!post) {
      return { notFound: true }
    }

    return {
      props: {
        post: JSON.parse(JSON.stringify(post))
      }
    }
  } catch (error) {
    console.error('Error fetching post:', error)
    return { notFound: true }
  }
}

export default function PostView({ post }) {
  const { data: session } = useSession()
  const router = useRouter()
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const calculateReadingTime = (text) => {
    const wordsPerMinute = 200
    const wordCount = text.trim().split(/\s+/).length
    return Math.ceil(wordCount / wordsPerMinute)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatContent = (content) => {
    return content.split('\n').map((paragraph, index) => {
      if (!paragraph.trim()) return null
      
      if (paragraph.startsWith('## ')) {
        return <h2 key={index} className="content-heading">{paragraph.replace('## ', '')}</h2>
      }
      if (paragraph.startsWith('### ')) {
        return <h3 key={index} className="content-subheading">{paragraph.replace('### ', '')}</h3>
      }
      
      const formattedText = paragraph.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      
      return (
        <p 
          key={index} 
          className="content-paragraph"
          dangerouslySetInnerHTML={{ __html: formattedText }}
        />
      )
    }).filter(Boolean)
  }

  const handleDelete = async () => {
    setDeleting(true)
    
    try {
      const response = await fetch(`/api/posts/${post.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        router.push('/')
      } else {
        const errorData = await response.json()
        console.error('Delete failed:', errorData)
        alert('Failed to delete post: ' + (errorData.message || 'Unknown error'))
      }
    } catch (error) {
      console.error('Delete error:', error)
      alert('Something went wrong: ' + error.message)
    }
    
    setDeleting(false)
    setShowDeleteModal(false)
  }

  if (!post) {
    return (
      <div className="app">
        <div className="loading">
          <div className="spinner"></div>
        </div>
      </div>
    )
  }

  const canEdit = session && session.user?.id === post.authorId
  const readingTime = calculateReadingTime(post.content)

  return (
    <>
      <Head>
        <title>{post.title} - BlogSpace</title>
        <meta name="description" content={post.content.substring(0, 160)} />
      </Head>

      <div className="app">
        <header className="header">
          <nav className="nav">
            <Link href="/" className="nav-brand">BlogSpace</Link>
            <div className="nav-menu">
              <Link href="/" className="btn btn--secondary">
                <i className="fas fa-home"></i> Home
              </Link>
            </div>
          </nav>
        </header>

        <main className="main-content">
          <div className="post-view">
            <div className="post-view-header">
              <Link href="/" className="post-view-back">
                <i className="fas fa-arrow-left"></i>
                Back to Posts
              </Link>
              
              <h1 className="post-view-title">{post.title}</h1>
              
              <div className="post-view-meta">
                <div className="post-view-author-info">
                  <span className="post-view-author">By {post.author}</span>
                  <span className="post-view-date">{formatDate(post.createdAt)}</span>
                </div>
                <div className="post-view-stats">
                  <span className="reading-time">
                    <i className="fas fa-clock"></i>
                    {readingTime} min read
                  </span>
                  <span>
                    <i className="fas fa-font"></i>
                    {post.content.length} characters
                  </span>
                </div>
              </div>
            </div>

            {/* Display image if it exists */}
            {post.image && (
              <div className="post-view-image">
                <img src={post.image} alt={post.title} />
              </div>
            )}

            <div className="post-view-content">
              {formatContent(post.content)}
            </div>

            {canEdit && (
              <div className="post-view-actions">
                <div className="post-view-actions-left">
                  <Link href={`/posts/${post.id}/edit`} className="btn btn--secondary">
                    <i className="fas fa-edit"></i> Edit Post
                  </Link>
                  <button 
                    className="btn btn--outline" 
                    onClick={() => setShowDeleteModal(true)}
                    style={{ color: 'var(--color-error)', borderColor: 'var(--color-error)' }}
                  >
                    <i className="fas fa-trash"></i> Delete Post
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Delete Modal */}
          {showDeleteModal && (
            <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
              <div className="modal" onClick={e => e.stopPropagation()}>
                <h3 className="modal-title">Delete Post</h3>
                <div className="modal-content">
                  Are you sure you want to delete this post? This action cannot be undone.
                </div>
                <div className="modal-actions">
                  <button 
                    className="btn btn--secondary" 
                    onClick={() => setShowDeleteModal(false)}
                    disabled={deleting}
                  >
                    Cancel
                  </button>
                  <button 
                    className="btn btn--outline"
                    onClick={handleDelete}
                    disabled={deleting}
                    style={{ color: 'var(--color-error)', borderColor: 'var(--color-error)' }}
                  >
                    {deleting ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  )
}