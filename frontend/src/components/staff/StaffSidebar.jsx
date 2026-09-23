import {
  History,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  UserPlus,
  Users,
  ChevronLeft,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'

export default function StaffSidebar({
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
          id="sidebarToggle"
          title="Toggle sidebar"
          onClick={onToggle}
        >
          <ChevronLeft />
        </button>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <NavLink
          to="/staff/dashboard"
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
          to="/staff/visitors"
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
          to="/staff/new-visit"
          className={({ isActive }) =>
            `nav-item ${isActive ? 'active' : ''}`
          }
          title="New Visit"
          onClick={onCloseMobile}
        >
          <UserPlus />
          <span className="nav-text">New Visit</span>
        </NavLink>

        <NavLink
          to="/staff/history"
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