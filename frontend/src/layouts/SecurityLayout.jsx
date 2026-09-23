import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

import SecurityHeader from '../components/security/SecurityHeader'
import SecuritySidebar from '../components/security/SecuritySidebar'

import '../styles/security-layout.css'

const pageNames = {
  '/security/dashboard': 'Dashboard',
  '/security/visitors': 'Visitors',
  '/security/history': 'Visit History',
}

export default function SecurityLayout() {
  const { user, logout } = useAuth()
  const location = useLocation()

  const [sidebarCollapsed, setSidebarCollapsed] =
    useState(false)

  const [mobileSidebarVisible, setMobileSidebarVisible] =
    useState(false)

  const [profileDropdownVisible, setProfileDropdownVisible] =
    useState(false)

  // Get the authenticated user's name.
  const userName = user?.name || 'Security'

  // Generate initials from the user's name.
  const initials = userName
    .split(' ')
    .map((name) => name[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  // Get the current page title.
  const pageTitle =
    pageNames[location.pathname] || 'Dashboard'

  // Close the mobile sidebar.
  const closeMobileSidebar = () => {
    setMobileSidebarVisible(false)
  }

  // Logout the authenticated user.
  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  // Close the profile dropdown when clicking outside it.
  useEffect(() => {
    const handleDocumentClick = () => {
      setProfileDropdownVisible(false)
    }

    document.addEventListener('click', handleDocumentClick)

    return () => {
      document.removeEventListener(
        'click',
        handleDocumentClick,
      )
    }
  }, [])

  return (
    <>
      <div
        className={`sidebar-overlay ${
          mobileSidebarVisible ? 'visible' : ''
        }`}
        id="sidebarOverlay"
        onClick={closeMobileSidebar}
      />

    
      <SecuritySidebar
        collapsed={sidebarCollapsed}
        mobileVisible={mobileSidebarVisible}
        onToggle={() =>
          setSidebarCollapsed((value) => !value)
        }
        onCloseMobile={closeMobileSidebar}
        onLogout={handleLogout}
      />

   
      <div
        className={`main-content ${
          sidebarCollapsed ? 'expanded' : ''
        }`}
        id="mainContent"
      >
        <SecurityHeader
          userName={userName}
          initials={initials}
          mobileSidebarVisible={mobileSidebarVisible}
          onToggleMobile={() =>
            setMobileSidebarVisible((value) => !value)
          }
          profileDropdownVisible={profileDropdownVisible}
          onToggleProfile={() =>
            setProfileDropdownVisible((value) => !value)
          }
          onCloseProfile={() =>
            setProfileDropdownVisible(false)
          }
          onLogout={handleLogout}
          pageTitle={pageTitle}
        />

        <div className="content-wrapper">
          <Outlet />
        </div>
      </div>
    </>
  )
}