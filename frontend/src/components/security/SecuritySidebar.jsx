import {
  History,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  Users,
  ChevronLeft,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'

export default function SecuritySidebar({
  collapsed,
  mobileVisible,
  onToggle,
  onCloseMobile,
  onLogout,
}) {
  return (
    <aside
      className={`sidebar ${
        mobileVisible ? 'mobile-visible' : ''
      } ${collapsed ? 'collapsed' : ''}`}
      id="sidebar"
    >
      {/* Branding */}
      <div className="sidebar-brand">
        <ShieldCheck className="sidebar-brand-icon" />

        <div className="sidebar-brand-text">
          Smart Visitor
        </div>

        <button
          className="sidebar-toggle"
          id="sidebarToggle"j
          title="Toggle sidebar"
          onClick={onToggle}
        >
          <ChevronLeft />
        </button>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <NavLink
          to="/security/dashboard"
          className={({ isActive }) =>
            `nav-item ${isActive ? 'active' : ''}`
          }
          title="Dashboard"
          onClick={onCloseMobile}
        >
          <LayoutDashboard />
          <span className="nav-text">Dashboard</span>
        </NavLink>

        <NavLink
          to="/security/visitors"
          className={({ isActive }) =>
            `nav-item ${isActive ? 'active' : ''}`
          }
          title="Visitors"
          onClick={onCloseMobile}
        >
          <Users />
          <span className="nav-text">Visitors</span>
        </NavLink>

        <NavLink
          to="/security/history"
          className={({ isActive }) =>
            `nav-item ${isActive ? 'active' : ''}`
          }
          title="Visit History"
          onClick={onCloseMobile}
        >
          <History />
          <span className="nav-text">Visit History</span>
        </NavLink>
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <button
          className="logout-btn"
          id="logoutBtn"
          title="Logout"
          onClick={onLogout}
        >
          <LogOut />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  )
}