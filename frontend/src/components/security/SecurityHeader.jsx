import {
  Bell,
  ChevronDown,
  LogOut,
  Menu,
  Settings,
  User,
} from 'lucide-react'

export default function SecurityHeader({
  userName,
  initials,
  mobileSidebarVisible,
  onToggleMobile,
  profileDropdownVisible,
  onToggleProfile,
  onCloseProfile,
  onLogout,
  pageTitle,
}) {
  return (
    <header className="header">
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
        }}
      >
        <button
          className="mobile-menu-btn"
          id="mobileMenuBtn"
          title="Toggle menu"
          onClick={onToggleMobile}
        >
          <Menu />
        </button>

        <h1 className="header-title" id="pageTitle">
          {pageTitle}
        </h1>
      </div>

      <div className="header-actions">
        <button
          className="notification-btn"
          aria-label="Notifications"
          title="Notifications"
        >
          <Bell />
          <span className="notification-badge">2</span>
        </button>

        <div className="profile-section">
          <button
            className="profile-btn"
            id="profileBtn"
            title="Profile menu"
            onClick={(event) => {
              event.stopPropagation()
              onToggleProfile()
            }}
          >
            <div className="profile-avatar">
              {initials}
            </div>

            <div className="profile-info">
              <div className="profile-name">
                {userName}
              </div>

              <div className="profile-role">
                Security
              </div>
            </div>

            <ChevronDown
              style={{
                width: 16,
                height: 16,
              }}
            />
          </button>

          <div
            className={`profile-dropdown ${
              profileDropdownVisible ? 'visible' : ''
            }`}
            id="profileDropdown"
          >
            <div className="dropdown-header">
              <div className="dropdown-name">
                {userName}
              </div>

              <div className="dropdown-role">
                Security Officer
              </div>
            </div>

            <button
              className="dropdown-item"
              id="profileMenuBtn"
              onClick={onCloseProfile}
            >
              <User />
              <span>Profile</span>
            </button>

            <button className="dropdown-item">
              <Settings />
              <span>Settings</span>
            </button>

            <div className="dropdown-divider" />

            <button
              className="dropdown-item"
              id="dropdownLogoutBtn"
              onClick={onLogout}
            >
              <LogOut />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}