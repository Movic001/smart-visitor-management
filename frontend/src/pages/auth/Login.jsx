import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import '../../styles/login.css'

// Login page used by Staff and Security users.
export default function Login() {
  // Get the login function from our global authentication context.
  const { login } = useAuth()

  // React Router function used to move the user to another page.
  const navigate = useNavigate()

  // Store the values entered into the login form.
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // Store login errors and loading state.
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Control password visibility.
  const [showPassword, setShowPassword] = useState(false)

  
 // Handle the login form submission.
const handleSubmit = async (event) => {
  event.preventDefault()

  // Clear any previous error before trying again.
  setError('')

  // Disable the button while the login request is running.
  setLoading(true)

  try {
    // Send the login details to Laravel.
    const loggedInUser = await login(email, password)

    // Keep this for development debugging.
    console.log('LOGIN USER:', loggedInUser)

    // Redirect the user based on their role.
    if (loggedInUser?.role === 'Staff') {
      navigate('/staff/dashboard')
      return
    }

    if (loggedInUser?.role === 'Security') {
      navigate('/security/dashboard')
      return
    }

    // Handle an unexpected or unsupported role.
    setError('Your account does not have a valid system role.')
  } catch (error) {
    // Show Laravel's validation error when available.
    console.error('LOGIN ERROR:', error)

    setError(
      error.response?.data?.message ||
        error.response?.data?.errors?.email?.[0] ||
        'Invalid email or password.',
    )
  } finally {
    // Enable the button again after the request finishes.
    setLoading(false)
  }
}

  return (
    <main className="login-page">
      <div className="login-container">
        {/* Brand section */}
        <div className="login-brand">
          <div className="login-brand-mark">
            SV
          </div>

          <div>
            <div className="login-brand-name">
              Smart Visitor
            </div>

            <div className="login-brand-subtitle">
              Management System
            </div>
          </div>
        </div>

        {/* Login card */}
        <div className="login-card">
          <div className="login-header">
            <div className="login-icon">
              <LockKeyhole size={22} />
            </div>

            <h1 className="login-title">
              Welcome back
            </h1>

            <p className="login-description">
              Sign in to access your visitor management dashboard.
            </p>
          </div>

          {/* Login form */}
          <form
            className="login-form"
            onSubmit={handleSubmit}
          >
            {/* Email field */}
            <div className="login-field">
              <label htmlFor="email">
                Email address
              </label>

              <div className="login-input-wrapper">
                <Mail
                  className="login-input-icon"
                  size={18}
                />

                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  placeholder="Enter your email"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            {/* Password field */}
            <div className="login-field">
              <label htmlFor="password">
                Password
              </label>

              <div className="login-input-wrapper">
                <LockKeyhole
                  className="login-input-icon"
                  size={18}
                />

                <input
                  id="password"
                  type={
                    showPassword
                      ? 'text'
                      : 'password'
                  }
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() =>
                    setShowPassword(
                      !showPassword,
                    )
                  }
                  aria-label={
                    showPassword
                      ? 'Hide password'
                      : 'Show password'
                  }
                  title={
                    showPassword
                      ? 'Hide password'
                      : 'Show password'
                  }
                >
                  {showPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </div>

            {/* Display an error when login fails */}
            {error && (
              <div
                className="login-error"
                role="alert"
              >
                {error}
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              className="login-button"
              disabled={loading}
            >
              {loading
                ? 'Signing in...'
                : 'Sign in'}
            </button>
          </form>

          {/* Login security note */}
          <div className="login-security">
            <LockKeyhole size={14} />

            <span>
              Authorized Staff and Security access only
            </span>
          </div>
        </div>

        {/* Footer */}
        <p className="login-footer">
          Smart Visitor Management System
        </p>
      </div>
    </main>
  )
}