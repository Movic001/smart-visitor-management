import api from './api'

// Get the CSRF cookie before starting a Sanctum login session.
export const getCsrfCookie = () => {
  return api.get('/sanctum/csrf-cookie')
}

// Log the user into Laravel.
export const login = (email, password) => {
  return api.post('/api/login', {
    email,
    password,
  })
}

// Get the currently authenticated user.
export const getCurrentUser = () => {
  return api.get('/api/user')
}

// Log the current user out.
export const logout = () => {
  return api.post('/api/logout')
}
