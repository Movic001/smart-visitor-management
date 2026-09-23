import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// Protect a route based on the user's role.
export default function RoleProtectedRoute({ allowedRole, children }) {
  const { user, loading } = useAuth()

  // Wait until Laravel authentication has been checked.
  if (loading) {
    return <p>Loading...</p>
  }

  // User is not logged in.
  if (!user) {
    return <Navigate to="/login" replace />
  }

  // User is logged in but does not have the required role.
  if (user.role !== allowedRole) {
    return <Navigate to="/login" replace />
  }

  // User has the correct role.
  return children
}