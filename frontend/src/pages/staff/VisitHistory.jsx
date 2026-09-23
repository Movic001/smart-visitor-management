import { useEffect, useMemo, useState } from 'react'
import {
  Search,
  CalendarDays,
  Filter,
  Building2,
  RotateCcw,
  Eye,
  X,
  Clock,
  User,
  Phone,
  Mail,
  BriefcaseBusiness,
  CheckCircle2,
  CircleAlert,
  CircleX,
  Timer,
  ChevronDown,
} from 'lucide-react'

import '../../styles/visit-history.css'

const statusOptions = [
  'All Status',
  'Pending',
  'Approved',
  'Rejected',
  'Checked-In',
  'Completed',
  'Cancelled',
]

function getStatusClass(status) {
  switch (status) {
    case 'Completed':
      return 'status-completed'

    case 'Checked-In':
      return 'status-checked-in'

    case 'Approved':
      return 'status-approved'

    case 'Pending':
      return 'status-pending'

    case 'Rejected':
      return 'status-rejected'

    case 'Cancelled':
      return 'status-cancelled'

    default:
      return ''
  }
}

function getStatusIcon(status) {
  switch (status) {
    case 'Completed':
      return <CheckCircle2 size={14} />

    case 'Checked-In':
      return <Timer size={14} />

    case 'Approved':
      return <CheckCircle2 size={14} />

    case 'Pending':
      return <CircleAlert size={14} />

    case 'Rejected':
      return <CircleX size={14} />

    case 'Cancelled':
      return <CircleX size={14} />

    default:
      return null
  }
}

// Format a database date for display.
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

// Format a check-in/check-out datetime for display.
function formatDateTime(dateTime) {
  if (!dateTime) {
    return null
  }

  const dateObject = new Date(dateTime)

  if (Number.isNaN(dateObject.getTime())) {
    return dateTime
  }

  return dateObject.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })
}

// Convert the API visit into the format expected by the existing UI.
function normalizeVisit(visit) {
  return {
    ...visit,

    department: visit.department?.name || 'Unknown Department',

    visit_date_display: formatDate(visit.visit_date),

    visit_time_display: formatTime(visit.visit_time),

    check_in_at: formatDateTime(visit.check_in_at),

    check_out_at: formatDateTime(visit.check_out_at),
  }
}

export default function VisitHistory() {
  const [visits, setVisits] = useState([])

  const [loading, setLoading] = useState(true)

  const [error, setError] = useState('')

  const [search, setSearch] = useState('')

  const [statusFilter, setStatusFilter] =
    useState('All Status')

  const [departmentFilter, setDepartmentFilter] =
    useState('All Departments')

  const [dateFilter, setDateFilter] = useState('')

  const [selectedVisit, setSelectedVisit] =
    useState(null)

  // Load visit history from the Laravel API.
  useEffect(() => {
    const loadVisits = async () => {
      try {
        setLoading(true)
        setError('')

        const response = await fetch(
          'http://localhost:8000/api/staff/visits',
          {
            credentials: 'include',
            headers: {
              Accept: 'application/json',
            },
          },
        )

        if (!response.ok) {
          throw new Error(
            'Failed to load visit history.',
          )
        }

        const result = await response.json()

        const normalizedVisits = (
          result.data || []
        ).map(normalizeVisit)

        setVisits(normalizedVisits)
      } catch (error) {
        console.error(
          'Failed to load visit history:',
          error,
        )

        setError(
          'Unable to load visit history. Please try again.',
        )
      } finally {
        setLoading(false)
      }
    }

    loadVisits()
  }, [])

  // Build department options from the real visit data.
  const departmentOptions = useMemo(() => {
    const departments = visits
      .map((visit) => visit.department)
      .filter(Boolean)

    return [
      'All Departments',
      ...Array.from(new Set(departments)).sort(),
    ]
  }, [visits])

  const filteredVisits = useMemo(() => {
    const searchValue = search.trim().toLowerCase()

    return visits.filter((visit) => {
      const visitorName =
        visit.visitor?.full_name
          ?.toLowerCase() || ''

      const visitorCode =
        visit.visitor?.visitor_code
          ?.toLowerCase() || ''

      const visitorPhone =
        visit.visitor?.phone
          ?.toLowerCase() || ''

      const hostName =
        visit.host_name?.toLowerCase() || ''

      const purpose =
        visit.purpose?.toLowerCase() || ''

      const matchesSearch =
        !searchValue ||
        visitorName.includes(searchValue) ||
        visitorCode.includes(searchValue) ||
        visitorPhone.includes(searchValue) ||
        hostName.includes(searchValue) ||
        purpose.includes(searchValue)

      const matchesStatus =
        statusFilter === 'All Status' ||
        visit.status === statusFilter

      const matchesDepartment =
        departmentFilter === 'All Departments' ||
        visit.department === departmentFilter

      const matchesDate =
        !dateFilter ||
        visit.visit_date === dateFilter

      return (
        matchesSearch &&
        matchesStatus &&
        matchesDepartment &&
        matchesDate
      )
    })
  }, [
    visits,
    search,
    statusFilter,
    departmentFilter,
    dateFilter,
  ])

  const stats = useMemo(() => {
    return {
      total: visits.length,

      pending: visits.filter(
        (visit) => visit.status === 'Pending',
      ).length,

      approved: visits.filter(
        (visit) => visit.status === 'Approved',
      ).length,

      completed: visits.filter(
        (visit) => visit.status === 'Completed',
      ).length,
    }
  }, [visits])

  const hasFilters =
    search ||
    statusFilter !== 'All Status' ||
    departmentFilter !== 'All Departments' ||
    dateFilter

  const clearFilters = () => {
    setSearch('')
    setStatusFilter('All Status')
    setDepartmentFilter('All Departments')
    setDateFilter('')
  }

  const openVisitDetails = (visit) => {
    setSelectedVisit(visit)
  }

  const closeVisitDetails = () => {
    setSelectedVisit(null)
  }

  return (
    <main className="visit-history-page">
      <div className="visit-history-container">

        {/* PAGE HEADER */}
        <section className="visit-history-header">
          <div>
            <div className="breadcrumb">
              <span>Staff</span>
              <span>/</span>
              <span>Visit History</span>
            </div>

            <h1 className="page-title">
              Visit History
            </h1>

            <p className="page-subtitle">
              Review and manage visitor visit records.
            </p>
          </div>
        </section>

        {/* SUMMARY CARDS */}
        <section className="visit-history-stats">

          <div className="history-stat-card">
            <div className="history-stat-top">
              <span>Total Visits</span>

              <div className="history-stat-icon">
                <CalendarDays size={19} />
              </div>
            </div>

            <strong>{stats.total}</strong>

            <p>All recorded visits</p>
          </div>

          <div className="history-stat-card">
            <div className="history-stat-top">
              <span>Pending</span>

              <div className="history-stat-icon warning">
                <CircleAlert size={19} />
              </div>
            </div>

            <strong>{stats.pending}</strong>

            <p>Awaiting approval</p>
          </div>

          <div className="history-stat-card">
            <div className="history-stat-top">
              <span>Approved</span>

              <div className="history-stat-icon info">
                <CheckCircle2 size={19} />
              </div>
            </div>

            <strong>{stats.approved}</strong>

            <p>Approved visits</p>
          </div>

          <div className="history-stat-card">
            <div className="history-stat-top">
              <span>Completed</span>

              <div className="history-stat-icon success">
                <CheckCircle2 size={19} />
              </div>
            </div>

            <strong>{stats.completed}</strong>

            <p>Successfully completed</p>
          </div>

        </section>

        {/* FILTERS */}
        <section className="history-filter-card">

          <div className="filter-heading">
            <div>
              <h2>Visit Records</h2>

              <p>
                Search and filter visitor visits.
              </p>
            </div>

            {hasFilters && (
              <button
                type="button"
                className="clear-filters-btn"
                onClick={clearFilters}
              >
                <RotateCcw size={15} />
                Clear filters
              </button>
            )}
          </div>

          <div className="history-filters">

            {/* SEARCH */}
            <div className="history-search-field">
              <Search size={18} />

              <input
                type="text"
                placeholder="Search visitor, code, phone, host, or purpose..."
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
              />
            </div>

            {/* STATUS */}
            <div className="history-filter-field">
              <Filter size={16} />

              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value)
                }
              >
                {statusOptions.map((status) => (
                  <option
                    key={status}
                    value={status}
                  >
                    {status}
                  </option>
                ))}
              </select>

              <ChevronDown size={15} />
            </div>

            {/* DEPARTMENT */}
            <div className="history-filter-field">
              <Building2 size={16} />

              <select
                value={departmentFilter}
                onChange={(event) =>
                  setDepartmentFilter(event.target.value)
                }
              >
                {departmentOptions.map(
                  (department) => (
                    <option
                      key={department}
                      value={department}
                    >
                      {department}
                    </option>
                  ),
                )}
              </select>

              <ChevronDown size={15} />
            </div>

            {/* DATE */}
            <div className="history-date-field">
              <CalendarDays size={16} />

              <input
                type="date"
                value={dateFilter}
                onChange={(event) =>
                  setDateFilter(event.target.value)
                }
              />
            </div>

          </div>
        </section>

        {/* TABLE */}
        <section className="visit-history-table-card">

          <div className="table-card-header">
            <div>
              <h2>All Visits</h2>

              <p>
                Showing {filteredVisits.length} of{' '}
                {visits.length} visits
              </p>
            </div>
          </div>

          {loading ? (
            <div className="history-empty-state">

              <div className="history-empty-icon">
                <CalendarDays size={28} />
              </div>

              <h3>Loading visits...</h3>

              <p>
                Please wait while we load your visit
                history.
              </p>

            </div>
          ) : error ? (
            <div className="history-empty-state">

              <div className="history-empty-icon">
                <CircleX size={28} />
              </div>

              <h3>Unable to load visits</h3>

              <p>{error}</p>

            </div>
          ) : filteredVisits.length > 0 ? (
            <div className="table-wrapper">

              <table className="visit-history-table">

                <thead>
                  <tr>
                    <th>Visitor</th>
                    <th>Host</th>
                    <th>Department</th>
                    <th>Visit Date</th>
                    <th>Purpose</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredVisits.map((visit) => (
                    <tr key={visit.id}>

                      <td>
                        <div className="history-visitor-cell">

                          <div className="history-visitor-avatar">
                            {visit.visitor.full_name
                              .split(' ')
                              .map(
                                (name) => name[0],
                              )
                              .join('')
                              .slice(0, 2)
                              .toUpperCase()}
                          </div>

                          <div>
                            <div className="history-visitor-name">
                              {visit.visitor.full_name}
                            </div>

                            <div className="history-visitor-code">
                              {visit.visitor.visitor_code}
                            </div>
                          </div>

                        </div>
                      </td>

                      <td>
                        <span className="history-host-name">
                          {visit.host_name}
                        </span>
                      </td>

                      <td>
                        <span className="department-name">
                          {visit.department}
                        </span>
                      </td>

                      <td>
                        <div className="visit-date-cell">
                          <strong>
                            {visit.visit_date_display}
                          </strong>

                          <span>
                            {visit.visit_time_display}
                          </span>
                        </div>
                      </td>

                      <td>
                        <span className="purpose-text">
                          {visit.purpose}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`history-status-badge ${getStatusClass(
                            visit.status,
                          )}`}
                        >
                          <span className="status-icon">
                            {getStatusIcon(
                              visit.status,
                            )}
                          </span>

                          {visit.status}
                        </span>
                      </td>

                      <td>
                        <button
                          type="button"
                          className="view-history-btn"
                          onClick={() =>
                            openVisitDetails(visit)
                          }
                        >
                          <Eye size={16} />
                          View
                        </button>
                      </td>

                    </tr>
                  ))}
                </tbody>

              </table>

            </div>
          ) : (
            <div className="history-empty-state">

              <div className="history-empty-icon">
                <CalendarDays size={28} />
              </div>

              <h3>No visits found</h3>

              <p>
                No visit records match your current
                search or filters.
              </p>

              {hasFilters && (
                <button
                  type="button"
                  className="clear-filters-btn"
                  onClick={clearFilters}
                >
                  <RotateCcw size={15} />
                  Clear filters
                </button>
              )}

            </div>
          )}

        </section>
      </div>

      {/* VISIT DETAILS MODAL */}
      {selectedVisit && (
        <div
          className="modal-overlay"
          onClick={closeVisitDetails}
        >
          <div
            className="visit-details-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <div className="modal-header">

              <div>
                <h2>Visit Details</h2>

                <p>
                  Complete information about this visit.
                </p>
              </div>

              <button
                type="button"
                className="modal-close"
                onClick={closeVisitDetails}
                aria-label="Close"
              >
                <X size={20} />
              </button>

            </div>

            <div className="modal-body">

              {/* VISITOR */}
              <div className="visit-modal-profile">

                <div className="large-history-avatar">
                  {selectedVisit.visitor.full_name
                    .split(' ')
                    .map((name) => name[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase()}
                </div>

                <div>
                  <h3>
                    {selectedVisit.visitor.full_name}
                  </h3>

                  <span>
                    {selectedVisit.visitor.visitor_code}
                  </span>
                </div>

              </div>

              {/* STATUS */}
              <div className="visit-modal-status-row">

                <span className="detail-label">
                  Visit Status
                </span>

                <span
                  className={`history-status-badge ${getStatusClass(
                    selectedVisit.status,
                  )}`}
                >
                  {getStatusIcon(
                    selectedVisit.status,
                  )}

                  {selectedVisit.status}
                </span>

              </div>

              {/* VISIT INFORMATION */}
              <div className="modal-section">

                <div className="modal-section-heading">
                  <h3>Visit Information</h3>
                </div>

                <div className="visit-detail-grid">

                  <div className="visit-detail-item">
                    <div className="detail-icon">
                      <User size={17} />
                    </div>

                    <div>
                      <span>Host</span>

                      <strong>
                        {selectedVisit.host_name}
                      </strong>
                    </div>
                  </div>

                  <div className="visit-detail-item">
                    <div className="detail-icon">
                      <Building2 size={17} />
                    </div>

                    <div>
                      <span>Department</span>

                      <strong>
                        {selectedVisit.department}
                      </strong>
                    </div>
                  </div>

                  <div className="visit-detail-item">
                    <div className="detail-icon">
                      <CalendarDays size={17} />
                    </div>

                    <div>
                      <span>Visit Date</span>

                      <strong>
                        {selectedVisit.visit_date_display}
                      </strong>
                    </div>
                  </div>

                  <div className="visit-detail-item">
                    <div className="detail-icon">
                      <Clock size={17} />
                    </div>

                    <div>
                      <span>Visit Time</span>

                      <strong>
                        {selectedVisit.visit_time_display}
                      </strong>
                    </div>
                  </div>

                  <div className="visit-detail-item full-width">
                    <div className="detail-icon">
                      <BriefcaseBusiness size={17} />
                    </div>

                    <div>
                      <span>Purpose</span>

                      <strong>
                        {selectedVisit.purpose}
                      </strong>
                    </div>
                  </div>

                </div>

              </div>

              {/* VISITOR CONTACT */}
              <div className="modal-section">

                <div className="modal-section-heading">
                  <h3>Visitor Contact</h3>
                </div>

                <div className="visit-contact-list">

                  <div>
                    <Phone size={16} />

                    <span>
                      {selectedVisit.visitor.phone}
                    </span>
                  </div>

                  <div>
                    <Mail size={16} />

                    <span>
                      {selectedVisit.visitor.email ||
                        'No email provided'}
                    </span>
                  </div>

                  <div>
                    <BriefcaseBusiness size={16} />

                    <span>
                      {selectedVisit.visitor
                        .company_name ||
                        'No company provided'}
                    </span>
                  </div>

                </div>

              </div>

              {/* CHECK IN / CHECK OUT */}
              <div className="modal-section">

                <div className="modal-section-heading">
                  <h3>Visit Timeline</h3>
                </div>

                <div className="visit-timeline">

                  <div className="timeline-item">

                    <div className="timeline-icon check-in">
                      <CheckCircle2 size={16} />
                    </div>

                    <div>
                      <span>Check-in</span>

                      <strong>
                        {selectedVisit.check_in_at ||
                          'Not checked in'}
                      </strong>
                    </div>

                  </div>

                  <div className="timeline-item">

                    <div className="timeline-icon check-out">
                      <Clock size={16} />
                    </div>

                    <div>
                      <span>Check-out</span>

                      <strong>
                        {selectedVisit.check_out_at ||
                          'Not checked out'}
                      </strong>
                    </div>

                  </div>

                </div>

              </div>

            </div>

            <div className="modal-footer">

              <button
                type="button"
                className="btn btn-secondary"
                onClick={closeVisitDetails}
              >
                Close
              </button>

            </div>

          </div>
        </div>
      )}

    </main>
  )
}