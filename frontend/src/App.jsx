import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom'

import Login from './pages/auth/Login'

// Staff pages
import StaffDashboard from './pages/staff/StaffDashboard'
import StaffLayout from './layouts/StaffLayout'
import NewVisit from './pages/staff/NewVisit'
import Visitors from './pages/staff/Visitors'
import VisitHistory from './pages/staff/VisitHistory'


// security pages
import SecurityDashboard from './pages/security/SecurityDashboard'
import SecurityVisitors from './pages/security/SecurityVisitors'
import SecurityVisitHistory from './pages/security/SecurityVisitHistory'
import SecurityLayout from './layouts/SecurityLayout'

// Protected route
import RoleProtectedRoute from './routes/RoleProtectedRoute'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Login */}
        <Route
          path="/login"
          element={<Login />}
        />

        {/* Staff Area */}
        <Route
          path="/staff"
          element={
            <RoleProtectedRoute allowedRole="Staff">
              <StaffLayout />
            </RoleProtectedRoute>
          }
        >
          <Route
            path="dashboard"
            element={<StaffDashboard />}
          />

          <Route
            path="new-visit"
            element={<NewVisit />}
          />

          <Route
            path="visitors"
            element={<Visitors />}
          />

          <Route
            path="history"
            element={<VisitHistory />}
          />
        </Route>

        {/* Security Area */}

        <Route
          path="/security"
          element={
            <RoleProtectedRoute allowedRole="Security">
              <SecurityLayout />
            </RoleProtectedRoute>
          }
        >
          <Route
            path="dashboard"
            element={<SecurityDashboard />}
          />

          <Route
            path="visitors"
            element={<SecurityVisitors />}
          />

          <Route
            path="history"
            element={<SecurityVisitHistory />}
          />
        </Route>

        {/* Default */}
        <Route
          path="/"
          element={
            <Navigate
              to="/login"
              replace
            />
          }
        />

      </Routes>
    </BrowserRouter>
  )
}