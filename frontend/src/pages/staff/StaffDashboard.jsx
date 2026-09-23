import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowUpRight,
  CalendarDays,
  CheckCircle,
  CircleCheck,
  Clock,
  Clock3,
  History,
  UserPlus,
  Users,
  X,
} from 'lucide-react'
import '../../styles/staff-dashboard.css'

// Return the correct icon for each visit status.
function getStatusIcon(status) {
  const icons = {
    pending: Clock,
    approved: CheckCircle,
    completed: CheckCircle,
    rejected: X,
    'checked-in': CheckCircle,
    cancelled: X,
  }

  return icons[status?.toLowerCase()] || Clock
}

// Format a date returned by Laravel.
// Format a database date for display.
function formatDate(date) {
  if (!date) {
    return '-'
  }

  // If Laravel returns a full ISO datetime,
  // extract only the date portion.
  const dateString = String(date).split('T')[0]

  const [year, month, day] =
    dateString.split('-').map(Number)

  if (!year || !month || !day) {
    return '-'
  }

  const dateObject = new Date(
    year,
    month - 1,
    day,
  )

  if (Number.isNaN(dateObject.getTime())) {
    return '-'
  }

  return dateObject.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

// Format a database time for display.
function formatTime(time) {
  if (!time) {
    return '-'
  }

  const timeString = String(time)

  // Extract HH:mm from values such as:
  // 19:53:00
  // 19:53
  // 19:53:00.000000
  // 1970-01-01T19:53:00.000000Z
  const match = timeString.match(
    /(?:T|\s)?(\d{2}):(\d{2})/,
  )

  if (!match) {
    return '-'
  }

  const hours = Number(match[1])
  const minutes = Number(match[2])

  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes) ||
    hours > 23 ||
    minutes > 59
  ) {
    return '-'
  }

  const dateObject = new Date()

  dateObject.setHours(
    hours,
    minutes,
    0,
    0,
  )

  return dateObject.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

export default function StaffDashboard() {
  const [selectedVisit, setSelectedVisit] =
    useState(null)

  const [user, setUser] = useState(null)

  const [dashboardData, setDashboardData] =
    useState({
      stats: {
        today_visits: 0,
        pending_requests: 0,
        active_visitors: 0,
        completed_today: 0,
      },

      today_summary: {
        expected: 0,
        checked_in: 0,
        currently_inside: 0,
      },

      recent_visits: [],
    })

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Load the logged-in Staff and dashboard data.
  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true)
        setError('')

        // Load the currently authenticated user.
        const userResponse = await fetch(
          'http://localhost:8000/api/user',
          {
            credentials: 'include',
            headers: {
              Accept: 'application/json',
            },
          },
        )

        const userResult =
          await userResponse.json()

        if (!userResponse.ok) {
          console.error(
            'User API error:',
            userResult,
          )

          throw new Error(
            userResult.message ||
              'Failed to load user information.',
          )
        }

        // Store the logged-in Staff user.
        setUser(userResult)

        // Load the Staff dashboard data.
        const dashboardResponse =
          await fetch(
            'http://localhost:8000/api/staff/dashboard',
            {
              credentials: 'include',
              headers: {
                Accept: 'application/json',
              },
            },
          )

        // Read the response even when Laravel returns an error.
        const dashboardResult =
          await dashboardResponse.json()

        // Show the actual Laravel error in the browser console.
        if (!dashboardResponse.ok) {
          console.error(
            'Dashboard API error:',
            dashboardResult,
          )

          throw new Error(
            dashboardResult.message ||
              'Failed to load dashboard data.',
          )
        }

        // Store the dashboard information.
        setDashboardData({
          stats: {
            today_visits:
              dashboardResult.data?.stats
                ?.today_visits ?? 0,

            pending_requests:
              dashboardResult.data?.stats
                ?.pending_requests ?? 0,

            active_visitors:
              dashboardResult.data?.stats
                ?.active_visitors ?? 0,

            completed_today:
              dashboardResult.data?.stats
                ?.completed_today ?? 0,
          },

          today_summary: {
            expected:
              dashboardResult.data
                ?.today_summary?.expected ?? 0,

            checked_in:
              dashboardResult.data
                ?.today_summary?.checked_in ?? 0,

            currently_inside:
              dashboardResult.data
                ?.today_summary
                ?.currently_inside ?? 0,
          },

          recent_visits:
            dashboardResult.data
              ?.recent_visits ?? [],
        })
      } catch (error) {
        // Log the actual error for debugging.
        console.error(
          'Failed to load dashboard:',
          error,
        )

        // Show the actual API error to the user.
        setError(
          error.message ||
            'Unable to load dashboard data. Please try again.',
        )
      } finally {
        setLoading(false)
      }
    }

    loadDashboard()
  }, [])

  // Convert dashboard statistics into the existing UI structure.
  const statsData = [
    {
      label: "Today's Visits",
      value:
        dashboardData.stats.today_visits,
      description: 'Scheduled for today',
      icon: CalendarDays,
      class: '',
    },

    {
      label: 'Pending Requests',
      value:
        dashboardData.stats.pending_requests,
      description: 'Awaiting processing',
      icon: Clock3,
      class: 'warning',
    },

    {
      label: 'Active Visitors',
      value:
        dashboardData.stats.active_visitors,
      description: 'Currently inside',
      icon: Users,
      class: '',
    },

    {
      label: 'Completed Today',
      value:
        dashboardData.stats.completed_today,
      description: 'Visits completed',
      icon: CircleCheck,
      class: 'success',
    },
  ]

  // Convert API visits into the format already used by the UI.
  const visitRequests =
    dashboardData.recent_visits.map(
      (visit) => ({
        id: visit.id,

        visitor:
          visit.visitor?.full_name || '-',

        host:
          visit.host_name || '-',

        department:
          visit.department?.name || '-',

        date:
          formatDate(visit.visit_date),

        time:
          formatTime(visit.visit_time),

        status:
          visit.status || '-',

        email:
          visit.visitor?.email || '-',

        phone:
          visit.visitor?.phone || '-',

        purpose:
          visit.purpose || '-',
      }),
    )

  // Close the visit details modal.
  const closeVisitModal = () => {
    setSelectedVisit(null)
  }

  return (
    <main className="dashboard-page">
      {/* Welcome Section */}
      <section className="welcome-section">
        <h2 className="welcome-title">
          Good afternoon{' '}
          <strong>
            {user?.name || 'Staff'}
          </strong>
        </h2>

        <p className="welcome-subtitle">
          Here's what's happening with your
          visitor requests today.
        </p>
      </section>

      {/* Show the API error when something goes wrong. */}
      {error && (
        <div
          style={{
            marginBottom: '1rem',
            padding: '1rem',
          }}
        >
          {error}
        </div>
      )}

      {/* Statistics Grid */}
      <section
        className="stats-grid"
        id="statsGrid"
      >
        {statsData.map((stat) => {
          const Icon = stat.icon

          return (
            <div
              className={`stat-card ${stat.class}`}
              key={stat.label}
            >
              <div className="stat-top">
                <div className="stat-label">
                  {stat.label}
                </div>

                <div className="stat-icon-container">
                  <Icon />
                </div>
              </div>

              <div className="stat-bottom">
                <div style={{ flex: 1 }}>
                  <div className="stat-number">
                    {loading
                      ? '...'
                      : stat.value}
                  </div>

                  <div className="stat-description">
                    {stat.description}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </section>

      {/* Main Content Grid */}
      <section className="main-grid">
        {/* Recent Visit Requests */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              Recent Visit Requests
            </h3>

            <Link
              to="/staff/history"
              className="card-action"
            >
              View All →
            </Link>
          </div>

          <div className="card-body">
            <div className="table-wrapper">
              <table id="visitTable">
                <thead>
                  <tr>
                    <th>Visitor</th>
                    <th>Host</th>
                    <th>Department</th>
                    <th>Date & Time</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody id="visitTableBody">
                  {loading ? (
                    <tr>
                      <td
                        colSpan="6"
                        style={{
                          textAlign:
                            'center',
                        }}
                      >
                        Loading visits...
                      </td>
                    </tr>
                  ) : visitRequests.length ===
                    0 ? (
                    <tr>
                      <td
                        colSpan="6"
                        style={{
                          textAlign:
                            'center',
                        }}
                      >
                        No recent visit
                        requests.
                      </td>
                    </tr>
                  ) : (
                    visitRequests.map(
                      (request) => {
                        const StatusIcon =
                          getStatusIcon(
                            request.status,
                          )

                        return (
                          <tr
                            key={
                              request.id
                            }
                          >
                            <td>
                              {
                                request.visitor
                              }
                            </td>

                            <td>
                              {
                                request.host
                              }
                            </td>

                            <td>
                              {
                                request.department
                              }
                            </td>

                            <td>
                              {
                                request.date
                              }{' '}
                              {
                                request.time
                              }
                            </td>

                            <td>
                              <span
                                className={`status-badge status-${request.status.toLowerCase()}`}
                              >
                                <StatusIcon />

                                <span>
                                  {
                                    request.status
                                  }
                                </span>
                              </span>
                            </td>

                            <td>
                              <button
                                className="action-btn"
                                aria-label="View details"
                                title="View details"
                                onClick={() =>
                                  setSelectedVisit(
                                    request,
                                  )
                                }
                              >
                                <ArrowUpRight />
                              </button>
                            </td>
                          </tr>
                        )
                      },
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              Quick Actions
            </h3>
          </div>

          <div className="card-body">
            <div
              style={{
                display: 'flex',
                flexDirection:
                  'column',
                gap: '1rem',
              }}
            >
              <Link
                to="/staff/new-visit"
                className="quick-action"
                id="newVisitBtn"
              >
                <div className="quick-action-icon">
                  <UserPlus />
                </div>

                <div className="quick-action-content">
                  <h3>New Visit</h3>

                  <p>
                    Create a visitor
                    request
                  </p>
                </div>
              </Link>

              <Link
                to="/staff/history"
                className="quick-action"
                id="historyBtn"
              >
                <div className="quick-action-icon">
                  <History />
                </div>

                <div className="quick-action-content">
                  <h3>
                    Visit History
                  </h3>

                  <p>
                    View previous
                    visits
                  </p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Today's Visitor Summary */}
      <section
        className="card"
        style={{
          marginBottom: '2rem',
        }}
      >
        <div className="card-header">
          <h3 className="card-title">
            Today's Visitor Summary
          </h3>
        </div>

        <div className="card-body">
          <div className="summary-grid">
            <div className="summary-item">
              <div className="summary-value">
                {loading
                  ? '...'
                  : dashboardData
                      .today_summary
                      .expected}
              </div>

              <div className="summary-label">
                Expected
              </div>
            </div>

            <div className="summary-item">
              <div className="summary-value">
                {loading
                  ? '...'
                  : dashboardData
                      .today_summary
                      .checked_in}
              </div>

              <div className="summary-label">
                Checked In
              </div>
            </div>

            <div className="summary-item">
              <div className="summary-value">
                {loading
                  ? '...'
                  : dashboardData
                      .today_summary
                      .currently_inside}
              </div>

              <div className="summary-label">
                Currently Inside
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Visit Details Modal */}
      <div
        className={`modal ${
          selectedVisit
            ? 'visible'
            : ''
        }`}
        id="visitModal"
        onClick={(event) => {
          if (
            event.target ===
            event.currentTarget
          ) {
            closeVisitModal()
          }
        }}
      >
        <div className="modal-content">
          <div className="modal-header">
            <h2 className="modal-title">
              Visit Details
            </h2>

            <button
              className="modal-close"
              id="closeVisitModal"
              onClick={
                closeVisitModal
              }
              aria-label="Close visit details"
              title="Close"
            >
              <X />
            </button>
          </div>

          {selectedVisit && (
            <>
              <div
                className="modal-body"
                id="visitModalBody"
              >
                <div className="modal-section">
                  <label className="modal-label">
                    Visitor Name
                  </label>

                  <div className="modal-value">
                    {
                      selectedVisit.visitor
                    }
                  </div>
                </div>

                <div className="modal-section">
                  <label className="modal-label">
                    Host
                  </label>

                  <div className="modal-value">
                    {
                      selectedVisit.host
                    }
                  </div>
                </div>

                <div className="modal-section">
                  <label className="modal-label">
                    Department
                  </label>

                  <div className="modal-value">
                    {
                      selectedVisit.department
                    }
                  </div>
                </div>

                <div className="modal-section">
                  <label className="modal-label">
                    Email
                  </label>

                  <div className="modal-value">
                    {
                      selectedVisit.email
                    }
                  </div>
                </div>

                <div className="modal-section">
                  <label className="modal-label">
                    Phone
                  </label>

                  <div className="modal-value">
                    {
                      selectedVisit.phone
                    }
                  </div>
                </div>

                <div className="modal-section">
                  <label className="modal-label">
                    Purpose
                  </label>

                  <div className="modal-value">
                    {
                      selectedVisit.purpose
                    }
                  </div>
                </div>

                <div className="modal-section">
                  <label className="modal-label">
                    Date & Time
                  </label>

                  <div className="modal-value">
                    {
                      selectedVisit.date
                    }{' '}
                    {
                      selectedVisit.time
                    }
                  </div>
                </div>

                <div className="modal-section">
                  <label className="modal-label">
                    Status
                  </label>

                  <div
                    className={`status-badge status-${selectedVisit.status.toLowerCase()}`}
                    style={{
                      display:
                        'inline-flex',
                    }}
                  >
                    {(() => {
                      const StatusIcon =
                        getStatusIcon(
                          selectedVisit.status,
                        )

                      return (
                        <StatusIcon />
                      )
                    })()}

                    <span>
                      {
                        selectedVisit.status
                      }
                    </span>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  id="closeVisitBtn"
                  onClick={
                    closeVisitModal
                  }
                >
                  Close
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  )
}