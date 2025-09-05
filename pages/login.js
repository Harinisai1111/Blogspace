import { useState } from 'react'
import { signIn, getSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'

export async function getServerSideProps(context) {
  const session = await getSession(context)
  
  if (session) {
    return {
      redirect: {
        destination: '/',
        permanent: false
      }
    }
  }
  
  return {
    props: {}
  }
}

export default function Login() {
  const [isLogin, setIsLogin] = useState(true)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    confirmPassword: ''
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email'
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }
    
    if (!isLogin) {
      if (!formData.name.trim()) {
        newErrors.name = 'Name is required'
      }
      
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match'
      }
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setLoading(true)
    setErrors({})

    try {
      if (isLogin) {
        const result = await signIn('credentials', {
          email: formData.email,
          password: formData.password,
          redirect: false
        })

        if (result?.error) {
          setErrors({ form: 'Invalid email or password' })
        } else {
          router.push('/')
        }
      } else {
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            password: formData.password
          })
        })

        const data = await response.json()

        if (response.ok) {
          const result = await signIn('credentials', {
            email: formData.email,
            password: formData.password,
            redirect: false
          })

          if (!result?.error) {
            router.push('/')
          }
        } else {
          setErrors({ form: data.message })
        }
      }
    } catch (error) {
      setErrors({ form: 'Something went wrong. Please try again.' })
    }
    
    setLoading(false)
  }

  return (
    <>
      <Head>
        <title>{isLogin ? 'Login' : 'Sign Up'} - BlogSpace</title>
      </Head>

      <div className="app">
        <header className="header">
          <nav className="nav">
            <Link href="/" className="nav-brand">BlogSpace</Link>
          </nav>
        </header>

        <main className="main-content">
          <div className="form-container">
            <div className="form-card">
              <h2 className="form-title">
                {isLogin ? 'Welcome Back' : 'Create Account'}
              </h2>
              
              {errors.form && (
                <div style={{ 
                  background: 'rgba(var(--color-error-rgb), 0.15)', 
                  color: 'var(--color-error)',
                  padding: 'var(--space-12)',
                  borderRadius: 'var(--radius-base)',
                  marginBottom: 'var(--space-16)',
                  textAlign: 'center',
                  fontSize: 'var(--font-size-sm)'
                }}>
                  {errors.form}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                {!isLogin && (
                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <input
                      type="text"
                      name="name"
                      className={`form-control ${errors.name ? 'error' : ''}`}
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Enter your full name"
                    />
                    {errors.name && <div className="form-error">{errors.name}</div>}
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    name="email"
                    className={`form-control ${errors.email ? 'error' : ''}`}
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter your email"
                  />
                  {errors.email && <div className="form-error">{errors.email}</div>}
                </div>

                <div className="form-group">
                  <label className="form-label">Password</label>
                  <input
                    type="password"
                    name="password"
                    className={`form-control ${errors.password ? 'error' : ''}`}
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                  />
                  {errors.password && <div className="form-error">{errors.password}</div>}
                </div>

                {!isLogin && (
                  <div className="form-group">
                    <label className="form-label">Confirm Password</label>
                    <input
                      type="password"
                      name="confirmPassword"
                      className={`form-control ${errors.confirmPassword ? 'error' : ''}`}
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Confirm your password"
                    />
                    {errors.confirmPassword && <div className="form-error">{errors.confirmPassword}</div>}
                  </div>
                )}

                <div className="form-actions">
                  <button 
                    type="submit" 
                    className="btn btn--primary btn--full-width"
                    disabled={loading}
                  >
                    {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
                  </button>
                </div>
              </form>

              <div style={{ 
                textAlign: 'center', 
                marginTop: 'var(--space-20)', 
                color: 'var(--color-text-secondary)',
                fontSize: 'var(--font-size-sm)'
              }}>
                {isLogin ? "Don't have an account? " : "Already have an account? "}
                <button 
                  className="btn btn--secondary btn--sm"
                  onClick={() => setIsLogin(!isLogin)}
                  style={{ marginLeft: 'var(--space-8)' }}
                >
                  {isLogin ? 'Sign Up' : 'Sign In'}
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  )
}