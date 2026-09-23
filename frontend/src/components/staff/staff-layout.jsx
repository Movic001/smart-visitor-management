import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

import StaffHeader from '../components/staff/StaffHeader'
import StaffSidebar from '../components/staff/StaffSidebar'

import '../styles/staff-layout.css'

const pageNames = {
  '/staff/dashboard': 'Dashboard',
  '/staff/visitors': 'Visitors',
  '/staff/new-visit': 'New Visit',
  '/staff/history': 'Visit History',
}

export default function StaffLayout() {
  const { user, logout } = useAuth()
  const location = useLocation()

  const [sidebarCollapsed, setSidebarCollapsed] =
    useState(false)

  const [mobileSidebarVisible, setMobileSidebarVisible] =
    useState(false)

  const [profileDropdownVisible, setProfileDropdownVisible] =
    useState(false)

  const userName = user?.name || 'John Staff'

  const initials = userName
    .split(' ')
    .map((name) => name[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const pageTitle =
    pageNames[location.pathname] || 'Dashboard'

  const closeMobileSidebar = () => {
    setMobileSidebarVisible(false)
  }

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

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
      {/* Mobile Overlay */}
      <div
        className={`sidebar-overlay ${
          mobileSidebarVisible ? 'visible' : ''
        }`}
        onClick={closeMobileSidebar}
      />

      {/* Reusable Sidebar */}
      <StaffSidebar
        collapsed={sidebarCollapsed}
        mobileVisible={mobileSidebarVisible}
        onToggle={() =>
          setSidebarCollapsed((value) => !value)
        }
        onCloseMobile={closeMobileSidebar}
        onLogout={handleLogout}
      />

      {/* Main Area */}
      <div
        className={`main-content ${
          sidebarCollapsed ? 'expanded' : ''
        }`}
      >
        <StaffHeader
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