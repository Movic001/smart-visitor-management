import { useEffect, useState } from 'react'
import {
  ArrowUpRight,
  CalendarDays,
  CheckCircle,
  CircleCheck,
  Clock,
  LogIn,
  LogOut,
  Search,
  Users,
  X,
} from 'lucide-react'
import '../../styles/security-dashboard.css'

// Return the correct icon for each visit status.
function getStatusIcon(status) {
  const icons = {
    pending: Clock,
    approved: CheckCircle,
    completed: CheckCircle,
    rejected: X,
    'checked-in': LogIn,
    cancelled: X,
  }

  return icons[status?.toLowerCase()] || Clock
}

// Format a date returned by Laravel.
function formatDate(date) {
  if (!date) {
    return '-'
  }

  return new Date(`${date}T00:00:00`).toLocaleDateString(
    'en-US',
    {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    },
  )
}

// Format a time returned by Laravel.
function formatTime(time) {
  if (!time) {
    return '-'
  }

  return new Date(
    `1970-01-01T${time}`,
  ).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

export default function SecurityDashboard() {
  const [selectedVisit, setSelectedVisit] =
    useState(null)

  const [user, setUser] = useState(null)

  const [dashboardData, setDashboardData] =
    useState({
      stats: {
        today_visits: 0,
        checked_in_today: 0,
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

  // Store the visitor search value.
  const [search, setSearch] = useState('')

  // Load the logged-in Security user and dashboard data.
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

        // Store the logged-in Security user.
        setUser(userResult)

        // Load the Security dashboard data.
        const dashboardResponse =
          await fetch(
            'http://localhost:8000/api/security/dashboard',
            {
              credentials: 'include',
              headers: {
                Accept: 'application/json',
              },
            },
          )

        const dashboardResult =
          await dashboardResponse.json()

        // Show the actual Laravel error in the console.
        if (!dashboardResponse.ok) {
          console.error(
            'Security dashboard API error:',
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

            checked_in_today:
              dashboardResult.data?.stats
                ?.checked_in_today ?? 0,

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
          'Failed to load Security dashboard:',
          error,
        )

        // Show the actual API error.
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
      label: "Today's Expected",
      value:
        dashboardData.stats.today_visits,
      description: 'Visitors scheduled today',
      icon: CalendarDays,
      class: '',
    },

    {
      label: 'Checked In Today',
      value:
        dashboardData.stats.checked_in_today,
      description: 'Visitors checked in',
      icon: LogIn,
      class: 'warning',
    },

    {
      label: 'Currently Inside',
      value:
        dashboardData.stats.active_visitors,
      description: 'Visitors currently inside',
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

  // Filter the dashboard visitor activity by the search value.
  const visitorActivity =
    dashboardData.recent_visits
      .filter((visit) => {
        if (!search.trim()) {
          return true
        }

        const searchValue =
          search.trim().toLowerCase()

        return (
          visit.visitor?.full_name
            ?.toLowerCase()
            .includes(searchValue) ||
          visit.visitor?.phone
            ?.toLowerCase()
            .includes(searchValue) ||
          visit.visitor?.visitor_code
            ?.toLowerCase()
            .includes(searchValue)
        )
      })
      .map((visit) => ({
        id: visit.id,

        visitor:
          visit.visitor?.full_name || '-',

        visitorCode:
          visit.visitor?.visitor_code || '-',

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

        checkIn:
          visit.check_in_at
            ? formatTime(
                visit.check_in_at
                  .split(' ')[1],
              )
            : '-',

        checkOut:
          visit.check_out_at
            ? formatTime(
                visit.check_out_at
                  .split(' ')[1],
              )
            : '-',
      }))

  // Close the visitor details modal.
  const closeVisitModal = () => {
    setSelectedVisit(null)
  }

  // Clear the visitor search.
  const clearSearch = () => {
    setSearch('')
  }

  return (
    <main className="dashboard-page">
      {/* Welcome Section */}
      <section className="welcome-section">
        <h2 className="welcome-title">
          Good Morning Oficer{' '}
          <strong>
            {user?.name || 'Security'}
          </strong>
        </h2>

        <p className="welcome-subtitle">
          Verify visitors and manage today's
          check-ins and check-outs.
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
        {/* Visitor Verification */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              Visitor Verification
            </h3>
          </div>

          <div className="card-body">
            <p
              style={{
                margin: '0 0 1rem',
              }}
            >
              Search for a visitor to check
              their visit details and access
              status.
            </p>

            <div
              style={{
                position: 'relative',
              }}
            >
              <Search
                size={18}
                style={{
                  position: 'absolute',
                  left: '0.9rem',
                  top: '50%',
                  transform:
                    'translateY(-50%)',
                  pointerEvents:
                    'none',
                }}
              />

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value,
                  )
                }
                placeholder="Search by name, phone or visitor code"
                aria-label="Search visitor"
                style={{
                  width: '100%',
                  height: '46px',
                  padding:
                    '0 1rem 0 2.7rem',
                  border:
                    '1px solid var(--dashboard-border)',
                  borderRadius: '9px',
                  outline: 'none',
                  fontFamily: 'inherit',
                  boxSizing:
                    'border-box',
                }}
              />
            </div>
          </div>
        </div>

        {/* Security Actions */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              Security Actions
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
              <button
                type="button"
                className="quick-action"
                onClick={() => {
                  document
                    .querySelector(
                      'input[aria-label="Search visitor"]',
                    )
                    ?.focus()
                }}
              >
                <div className="quick-action-icon">
                  <Search />
                </div>

                <div className="quick-action-content">
                  <h3>
                    Check Visitor
                  </h3>

                  <p>
                    Verify visitor
                    details
                  </p>
                </div>
              </button>

              <button
                type="button"
                className="quick-action"
                onClick={clearSearch}
              >
                <div className="quick-action-icon">
                  <Users />
                </div>

                <div className="quick-action-content">
                  <h3>
                    Today's Visitors
                  </h3>

                  <p>
                    View today's
                    visitor activity
                  </p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Today's Visitor Activity */}
      <section
        className="card"
        style={{
          marginBottom: '2rem',
        }}
      >
        <div className="card-header">
          <h3 className="card-title">
            Today's Visitor Activity
          </h3>
        </div>

        <div className="card-body">
          <div className="table-wrapper">
            <table id="visitTable">
              <thead>
                <tr>
                  <th>Visitor</th>
                  <th>Host</th>
                  <th>Department</th>
                  <th>Time</th>
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
                      Loading visitors...
                    </td>
                  </tr>
                ) : visitorActivity.length ===
                  0 ? (
                  <tr>
                    <td
                      colSpan="6"
                      style={{
                        textAlign:
                          'center',
                      }}
                    >
                      No visitors found.
                    </td>
                  </tr>
                ) : (
                  visitorActivity.map(
                    (visit) => {
                      const StatusIcon =
                        getStatusIcon(
                          visit.status,
                        )

                      return (
                        <tr
                          key={
                            visit.id
                          }
                        >
                          <td>
                            <div>
                              {
                                visit.visitor
                              }
                            </div>

                            <small>
                              {
                                visit.visitorCode
                              }
                            </small>
                          </td>

                          <td>
                            {
                              visit.host
                            }
                          </td>

                          <td>
                            {
                              visit.department
                            }
                          </td>

                          <td>
                            {
                              visit.time
                            }
                          </td>

                          <td>
                            <span
                              className={`status-badge status-${visit.status
                                .toLowerCase()
                                .replace(
                                  /\s+/g,
                                  '-',
                                )}`}
                            >
                              <StatusIcon />

                              <span>
                                {
                                  visit.status
                                }
                              </span>
                            </span>
                          </td>

                          <td>
                            <button
                              className="action-btn"
                              aria-label="View visitor details"
                              title="View visitor details"
                              onClick={() =>
                                setSelectedVisit(
                                  visit,
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

      {/* Visitor Details Modal */}
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
              Visitor Details
            </h2>

            <button
              className="modal-close"
              onClick={
                closeVisitModal
              }
              aria-label="Close visitor details"
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
                    Visitor Code
                  </label>

                  <div className="modal-value">
                    {
                      selectedVisit.visitorCode
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
                    className={`status-badge status-${selectedVisit.status
                      .toLowerCase()
                      .replace(
                        /\s+/g,
                        '-',
                      )}`}
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

                <div className="modal-section">
                  <label className="modal-label">
                    Check In
                  </label>

                  <div className="modal-value">
                    {
                      selectedVisit.checkIn
                    }
                  </div>
                </div>

                <div className="modal-section">
                  <label className="modal-label">
                    Check Out
                  </label>

                  <div className="modal-value">
                    {
                      selectedVisit.checkOut
                    }
                  </div>
                </div>
              </div>

              {/* Check-in and check-out APIs will be connected next. */}
              <div className="modal-footer">
                {selectedVisit.status ===
                  'Approved' && (
                  <button
                    className="btn btn-primary"
                    type="button"
                  >
                    <LogIn size={16} />
                    Check In
                  </button>
                )}

                {selectedVisit.status ===
                  'Checked-In' && (
                  <button
                    className="btn btn-primary"
                    type="button"
                  >
                    <LogOut size={16} />
                    Check Out
                  </button>
                )}

                <button
                  className="btn btn-secondary"
                  type="button"
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