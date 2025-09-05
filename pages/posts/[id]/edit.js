import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'

export async function getServerSideProps({ params, req }) {
  try {
    const { id } = params;

    // Relative fetch — works on Vercel and locally
    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const host = req.headers.host;
    const baseUrl = `${protocol}://${host}`;

    const response = await fetch(`${baseUrl}/api/posts/${id}`);
    if (!response.ok) return { notFound: true };

    const post = await response.json();
    return { props: { post } };
  } catch (error) {
    console.error('Error fetching post:', error);
    return { notFound: true };
  }
}


export default function EditPost({ post }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [formData, setFormData] = useState({
    title: post.title || '',
    content: post.content || '',
    image: post.image || ''
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  if (status === 'loading') return <div>Loading...</div>

  if (!session || session.user.id !== post.authorId) {
    router.push('/')
    return null
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const validateForm = () => {
    const newErrors = {}
    if (!formData.title.trim()) newErrors.title = 'Title is required'
    else if (formData.title.length < 5)
      newErrors.title = 'Title must be at least 5 characters'
    if (!formData.content.trim()) newErrors.content = 'Content is required'
    else if (formData.content.length < 50)
      newErrors.content = 'Content must be at least 50 characters'
    if (formData.image && formData.image.trim()) {
      const urlPattern = /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i
      if (!urlPattern.test(formData.image.trim()))
        newErrors.image =
          'Please enter a valid image URL (jpg, jpeg, png, gif, webp)'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return
    setLoading(true)

    try {
      const response = await fetch(`/api/posts/${post.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title.trim(),
          content: formData.content.trim(),
          image: formData.image.trim() || null
        })
      })

      if (response.ok) {
        router.push(`/posts/${post.id}`)
      } else {
        const data = await response.json()
        setErrors({ form: data.message })
      }
    } catch (error) {
      console.error('Update error:', error)
      setErrors({ form: 'Something went wrong. Please try again.' })
    }

    setLoading(false)
  }

  return (
    <>
      <Head>
        <title>Edit Post - BlogSpace</title>
      </Head>
      <div className="app">
        <header className="header">
          <nav className="nav">
            <Link href="/" className="nav-brand">
              BlogSpace
            </Link>
          </nav>
        </header>
        <main className="main-content">
          <div className="form-container">
            <div className="form-card">
              <h2 className="form-title">Edit Post</h2>
              {errors.form && <div className="error-message">{errors.form}</div>}
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label">Title</label>
                  <input
                    type="text"
                    name="title"
                    className={`form-control ${errors.title ? 'error' : ''}`}
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="Enter your post title..."
                  />
                  {errors.title && <div className="form-error">{errors.title}</div>}
                </div>

                <div className="form-group">
                  <label className="form-label">Image URL (optional)</label>
                  <textarea
                    name="image"
                    className={`form-control ${errors.image ? 'error' : ''}`}
                    value={formData.image}
                    onChange={handleChange}
                    placeholder="https://example.com/image.jpg or paste base64 image data"
                    rows="3"
                    style={{ resize: 'vertical', fontSize: '12px', fontFamily: 'monospace' }}
                  />
                  {errors.image && <div className="form-error">{errors.image}</div>}
                  {formData.image && (
                    <div className="image-preview">
                      <img
                        src={formData.image}
                        alt="Preview"
                        onError={(e) => (e.target.style.display = 'none')}
                      />
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Content</label>
                  <textarea
                    name="content"
                    className={`form-control form-textarea ${errors.content ? 'error' : ''}`}
                    value={formData.content}
                    onChange={handleChange}
                    placeholder="Write your post content here..."
                    rows="12"
                  />
                  <div className="char-counter">
                    {formData.content.length} characters
                    {formData.content.length < 50 && (
                      <span className="char-counter-warning">(minimum 50 characters)</span>
                    )}
                  </div>
                  {errors.content && <div className="form-error">{errors.content}</div>}
                </div>

                <div className="form-actions">
                  <Link href={`/posts/${post.id}`} className="btn btn--secondary">
                    Cancel
                  </Link>
                  <button type="submit" className="btn btn--primary" disabled={loading}>
                    {loading ? 'Updating...' : 'Update Post'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </main>
      </div>
    </>
  )
}
