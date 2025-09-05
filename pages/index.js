import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import Head from 'next/head'
import Link from 'next/link'

export default function Home() {
  const { data: session } = useSession()
  const [posts, setPosts] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('newest')
  const [loading, setLoading] = useState(false)

  // Fetch posts from API
  const fetchPosts = async (search = '') => {
    setLoading(true)
    try {
      const url = search
        ? `/api/posts?search=${encodeURIComponent(search)}`
        : '/api/posts'
      const response = await fetch(url)
      const data = await response.json()
      setPosts(data)
    } catch (error) {
      console.error('Error fetching posts:', error)
    }
    setLoading(false)
  }

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (searchTerm !== '') {
        fetchPosts(searchTerm)
      } else {
        fetchPosts()
      }
    }, 300)
    return () => clearTimeout(debounceTimer)
  }, [searchTerm])

  // Sorting
  const sortedPosts = posts.sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.createdAt) - new Date(a.createdAt)
    } else if (sortBy === 'oldest') {
      return new Date(a.createdAt) - new Date(b.createdAt)
    } else if (sortBy === 'title') {
      return a.title.localeCompare(b.title)
    }
    return 0
  })

  const calculateReadingTime = (text) => {
    if (!text) return 0
    const wordsPerMinute = 200
    const wordCount = text.trim().split(/\s+/).length
    return Math.ceil(wordCount / wordsPerMinute)
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Invalid Date'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const truncateText = (text, maxLength = 150) => {
    if (!text) return ''
    if (text.length <= maxLength) return text
    return text.substr(0, maxLength).trim() + '...'
  }

  return (
    <>
      <Head>
        <title>BlogSpace - Modern Blog Platform</title>
        <meta
          name="description"
          content="Discover amazing stories and share your thoughts with the world"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="app">
        {/* Header */}
        <header className="header">
          <nav className="nav">
            <Link href="/" className="nav-brand">
              BlogSpace
            </Link>

            <div className="nav-menu">
              <Link href="/" className="btn btn--secondary">
                <i className="fas fa-home"></i> Home
              </Link>

              {session ? (
                <>
                  <Link href="/create" className="btn btn--primary">
                    <i className="fas fa-plus"></i> Create Post
                  </Link>
                  <div className="nav-user">
                    <span>Welcome, {session.user.name}</span>
                    <button
                      className="btn btn--outline btn--sm"
                      onClick={() => signOut()}
                    >
                      <i className="fas fa-sign-out-alt"></i> Logout
                    </button>
                  </div>
                </>
              ) : (
                <Link href="/login" className="btn btn--primary">
                  <i className="fas fa-sign-in-alt"></i> Login
                </Link>
              )}
            </div>
          </nav>
        </header>

        {/* Main Content */}
        <main className="main-content">
          {/* Page Header */}
          <div className="page-header">
            <h1 className="page-title">BlogSpace</h1>
            <p className="page-subtitle">
              Discover amazing stories and share your thoughts with the world
            </p>
          </div>

          {/* Posts Container */}
          <div className="posts-container">
            <div className="posts-header">
              <h2 style={{ margin: 0, color: 'var(--color-text)' }}>
                Latest Posts ({sortedPosts.length})
              </h2>
              <div className="posts-controls">
                <input
                  type="text"
                  className="search-input"
                  placeholder="Search posts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <select
                  className="form-control"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  style={{ width: 'auto', minWidth: '120px' }}
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="title">By Title</option>
                </select>
              </div>
            </div>

            {/* Loading / Empty State / Posts */}
            {loading ? (
              <div className="loading">
                <div className="spinner"></div>
              </div>
            ) : sortedPosts.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <i className="fas fa-newspaper"></i>
                </div>
                <h3>No posts found</h3>
              </div>
            ) : (
              <div className="posts-grid">
                {sortedPosts.map((post) => (
                  <div key={post._id || post.id} className="post-card">
                    {/* Post Header */}
                    <div className="post-card-header">
                      <h3 className="post-title">{post.title || 'Untitled'}</h3>
                      <div className="post-meta">
                        <span className="post-author">
                          By {post.author || 'Unknown Author'}
                        </span>
                        <span className="post-date">
                          {formatDate(post.createdAt)}
                        </span>
                      </div>
                      <p className="post-excerpt">
                        {truncateText(post.content)}
                      </p>
                      {post.image && (
                        <div className="post-image">
                          <img src={post.image} alt={post.title} />
                        </div>
                      )}
                    </div>

                    {/* Post Footer */}
                    <div className="post-card-footer">
                      <div className="reading-time">
                        <i className="fas fa-clock"></i>
                        <span>
                          {calculateReadingTime(post.content)} min read
                        </span>
                      </div>
                      <div className="post-actions">
                        <Link
                          href={`/posts/${post._id || post.id}`}
                          className="btn btn--sm btn--primary"
                        >
                          Read More
                        </Link>
                        {session && session.user.id === post.authorId && (
                          <Link
                            href={`/posts/${post._id || post.id}/edit`}
                            className="btn btn--sm btn--secondary edit-btn"
                            title="Edit Post"
                          >
                            <i className="fas fa-edit"></i> Edit
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  )
}