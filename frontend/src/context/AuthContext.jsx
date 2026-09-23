import { createContext, useContext, useEffect, useState } from 'react'
import {
  getCurrentUser,
  getCsrfCookie,
  login as loginRequest,
  logout as logoutRequest,
} from '../services/auth'

// Create the authentication context.
const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Check if a user already has an active Laravel session.
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await getCurrentUser()

        // Store the authenticated user.
        setUser(response.data)
      } catch {
        // No valid session means the user is logged out.
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  // Login through Laravel Sanctum.
  const login = async (email, password) => {
    await getCsrfCookie()
    await loginRequest(email, password)

    // Get the authenticated user after login.
    const response = await getCurrentUser()

    setUser(response.data)

    return response.data
  }

  // Logout through Laravel.
  const logout = async () => {
    await logoutRequest()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

// Easy way for components to access authentication state.
export function useAuth() {
  return useContext(AuthContext)
}
