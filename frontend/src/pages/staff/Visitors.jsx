import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Search,
  UserPlus,
  Users,
  UserCheck,
  UserX,
  CalendarDays,
  Eye,
  X,
  Phone,
  Mail,
  Building2,
  Clock,
  ChevronDown,
  Filter,
  RotateCcw,
} from 'lucide-react'

import '../../styles/visitors.css'

// Get the date of the most recent visit.
function getLastVisit(visitor) {
  if (!visitor.visits?.length) {
    return 'No visits'
  }

  return visitor.visits[0].date
}

// Generate initials when a visitor has no photo.
function getInitials(name) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export default function Visitors() {
  // Store visitors returned from the API.
  const [visitors, setVisitors] = useState([])

  // Load registered visitors from the API.
  useEffect(() => {
    const loadVisitors = async () => {
      try {
        const response = await fetch(
          'http://localhost:8000/api/staff/visitors',
          {
            credentials: 'include',
            headers: {
              Accept: 'application/json',
            },
          },
        )

        if (!response.ok) {
          throw new Error('Failed to load visitors.')
        }

        const result = await response.json()

        setVisitors(result.data || [])
      } catch (error) {
        console.error('Failed to load visitors:', error)
      }
    }

    loadVisitors()
  }, [])

  // Store search and filter values.
  const [search, setSearch] = useState('')

  const [statusFilter, setStatusFilter] = useState('All')
  const [companyFilter, setCompanyFilter] = useState('All')

  // Store the visitor currently being viewed.
  const [selectedVisitor, setSelectedVisitor] = useState(null)

  // Get the available company names from the loaded visitors.
  const companies = useMemo(() => {
    return [
      ...new Set(
        visitors
          .map((visitor) => visitor.company_name)
          .filter(Boolean),
      ),
    ]
  }, [visitors])

  // Calculate visitor statistics.
  const stats = useMemo(() => {
    const total = visitors.length

    const active = visitors.filter(
      (visitor) => visitor.status === 'Active',
    ).length

    const inactive = visitors.filter(
      (visitor) => visitor.status === 'Inactive',
    ).length

    // Count visits that belong to today.
    const today = new Date().toISOString().split('T')[0]

    const visitsToday = visitors.reduce(
      (totalVisits, visitor) => {
        return (
          totalVisits +
          (visitor.visits || []).filter(
            (visit) => visit.visit_date === today,
          ).length
        )
      },
      0,
    )

    return {
      total,
      active,
      inactive,
      visitsToday,
    }
  }, [visitors])

  // Filter visitors based on the current search and filters.
  const filteredVisitors = useMemo(() => {
    const query = search.trim().toLowerCase()

    return visitors.filter((visitor) => {
      const matchesSearch =
        !query ||
        visitor.full_name?.toLowerCase().includes(query) ||
        visitor.phone?.toLowerCase().includes(query) ||
        visitor.visitor_code?.toLowerCase().includes(query) ||
        visitor.company_name?.toLowerCase().includes(query)

      const matchesStatus =
        statusFilter === 'All' ||
        visitor.status === statusFilter

      const matchesCompany =
        companyFilter === 'All' ||
        visitor.company_name === companyFilter

      return (
        matchesSearch &&
        matchesStatus &&
        matchesCompany
      )
    })
  }, [
    visitors,
    search,
    statusFilter,
    companyFilter,
  ])

  // Check whether any search or filters are active.
  const hasFilters =
    search ||
    statusFilter !== 'All' ||
    companyFilter !== 'All'

  // Clear all search and filter values.
  const clearFilters = () => {
    setSearch('')
    setStatusFilter('All')
    setCompanyFilter('All')
  }

  // Open the visitor details modal.
  const openVisitorDetails = (visitor) => {
    setSelectedVisitor(visitor)
  }

  // Close the visitor details modal.
  const closeVisitorDetails = () => {
    setSelectedVisitor(null)
  }

  return (
    <main className="visitors-page">
      <div className="visitors-container">

        {/* PAGE HEADER */}
        <section className="visitors-header">
          <div>
            <div className="breadcrumb">
              <span>Staff</span>
              <span>/</span>
              <span>Visitors</span>
            </div>

            <h1 className="page-title">
              Visitors
            </h1>

            <p className="page-subtitle">
              Search and manage registered visitors.
            </p>
          </div>

          {/* Go to the New Visit page instead of registering a visitor here. */}
          <Link
            to="/staff/new-visit"
            className="btn btn-primary"
          >
            <UserPlus size={17} />
            New Visit
          </Link>
        </section>

        {/* STATISTICS */}
        <section className="visitor-stats">

          <div className="visitor-stat-card">
            <div className="visitor-stat-top">
              <span>Total Visitors</span>

              <div className="visitor-stat-icon">
                <Users size={19} />
              </div>
            </div>

            <strong>{stats.total}</strong>

            <p>Registered visitors</p>
          </div>

          <div className="visitor-stat-card">
            <div className="visitor-stat-top">
              <span>Active Visitors</span>

              <div className="visitor-stat-icon success">
                <UserCheck size={19} />
              </div>
            </div>

            <strong>{stats.active}</strong>

            <p>Currently active</p>
          </div>

          <div className="visitor-stat-card">
            <div className="visitor-stat-top">
              <span>Inactive Visitors</span>

              <div className="visitor-stat-icon neutral">
                <UserX size={19} />
              </div>
            </div>

            <strong>{stats.inactive}</strong>

            <p>Inactive records</p>
          </div>

          <div className="visitor-stat-card">
            <div className="visitor-stat-top">
              <span>Visits Today</span>

              <div className="visitor-stat-icon info">
                <CalendarDays size={19} />
              </div>
            </div>

            <strong>{stats.visitsToday}</strong>

            <p>Recorded today</p>
          </div>

        </section>

        {/* SEARCH + FILTERS */}
        <section className="visitor-filter-card">

          <div className="filter-heading">
            <div>
              <h2>Visitors</h2>

              <p>
                Search and filter registered visitors.
              </p>
            </div>

            {hasFilters && (
              <button
                className="clear-filters-btn"
                onClick={clearFilters}
              >
                <RotateCcw size={15} />
                Clear filters
              </button>
            )}
          </div>

          <div className="visitor-filters">

            <div className="search-field">
              <Search size={18} />

              <input
                type="text"
                placeholder="Search by name, phone, visitor code, or company..."
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
              />
            </div>

            <div className="filter-field">
              <Filter size={16} />

              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value)
                }
              >
                <option value="All">
                  All Status
                </option>

                <option value="Active">
                  Active
                </option>

                <option value="Inactive">
                  Inactive
                </option>
              </select>

              <ChevronDown size={15} />
            </div>

            <div className="filter-field">

              <Building2 size={16} />

              <select
                value={companyFilter}
                onChange={(event) =>
                  setCompanyFilter(event.target.value)
                }
              >
                <option value="All">
                  All Companies
                </option>

                {companies.map((company) => (
                  <option
                    value={company}
                    key={company}
                  >
                    {company}
                  </option>
                ))}
              </select>

              <ChevronDown size={15} />

            </div>

          </div>
        </section>

        {/* TABLE */}
        <section className="visitors-table-card">

          <div className="table-card-header">
            <div>
              <h2>All Visitors</h2>

              <p>
                Showing {filteredVisitors.length} of{' '}
                {visitors.length} visitors
              </p>
            </div>
          </div>

          {filteredVisitors.length > 0 ? (
            <div className="table-wrapper">
              <table className="visitors-table">

                <thead>
                  <tr>
                    <th>Visitor</th>
                    <th>Visitor Code</th>
                    <th>Phone</th>
                    <th>Company</th>
                    <th>Status</th>
                    <th>Last Visit</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredVisitors.map((visitor) => (
                    <tr key={visitor.id}>

                      <td>
                        <div className="visitor-cell">

                          <div className="visitor-avatar">
                            {visitor.photo ? (
                              <img
                                src={visitor.photo}
                                alt={visitor.full_name}
                              />
                            ) : (
                              getInitials(
                                visitor.full_name,
                              )
                            )}
                          </div>

                          <div>
                            <div className="visitor-name">
                              {visitor.full_name}
                            </div>

                            <div className="visitor-email">
                              {visitor.email ||
                                'No email'}
                            </div>
                          </div>

                        </div>
                      </td>

                      <td>
                        <span className="visitor-code">
                          {visitor.visitor_code}
                        </span>
                      </td>

                      <td>{visitor.phone}</td>

                      <td>
                        {visitor.company_name ||
                          '—'}
                      </td>

                      <td>
                        <span
                          className={`status-badge ${
                            visitor.status ===
                            'Active'
                              ? 'status-active'
                              : 'status-inactive'
                          }`}
                        >
                          <span className="status-dot" />
                          {visitor.status}
                        </span>
                      </td>

                      <td>
                        {getLastVisit(visitor)}
                      </td>

                      <td>
                        <button
                          className="view-btn"
                          onClick={() =>
                            openVisitorDetails(
                              visitor,
                            )
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
            <div className="filtered-empty-state">

              <Search size={32} />

              <h3>
                No visitors found
              </h3>

              <p>
                No visitors match your current
                search or filters.
              </p>

              <button
                className="btn btn-secondary"
                onClick={clearFilters}
              >
                <RotateCcw size={16} />
                Clear Filters
              </button>

            </div>
          )}

        </section>

      </div>

      {/* VISITOR DETAILS MODAL */}
      {selectedVisitor && (
        <div
          className="modal-overlay"
          onClick={(event) => {
            if (
              event.target === event.currentTarget
            ) {
              closeVisitorDetails()
            }
          }}
        >
          <div className="visitor-details-modal">

            <div className="modal-header">
              <h2>Visitor Details</h2>

              <button
                className="modal-close"
                onClick={closeVisitorDetails}
              >
                <X size={19} />
              </button>
            </div>

            <div className="modal-body">

              <div className="visitor-profile">

                <div className="large-visitor-avatar">
                  {selectedVisitor.photo ? (
                    <img
                      src={selectedVisitor.photo}
                      alt={selectedVisitor.full_name}
                    />
                  ) : (
                    getInitials(
                      selectedVisitor.full_name,
                    )
                  )}
                </div>

                <div>
                  <h3>
                    {selectedVisitor.full_name}
                  </h3>

                  <p>
                    {selectedVisitor.visitor_code}
                  </p>

                  <span
                    className={`status-badge ${
                      selectedVisitor.status ===
                      'Active'
                        ? 'status-active'
                        : 'status-inactive'
                    }`}
                  >
                    <span className="status-dot" />
                    {selectedVisitor.status}
                  </span>
                </div>

              </div>

              <div className="visitor-detail-grid">

                <div className="detail-item">
                  <Phone size={16} />

                  <div>
                    <span>Phone</span>

                    <strong>
                      {selectedVisitor.phone}
                    </strong>
                  </div>
                </div>

                <div className="detail-item">
                  <Mail size={16} />

                  <div>
                    <span>Email</span>

                    <strong>
                      {selectedVisitor.email ||
                        '—'}
                    </strong>
                  </div>
                </div>

                <div className="detail-item">
                  <Building2 size={16} />

                  <div>
                    <span>Company</span>

                    <strong>
                      {selectedVisitor.company_name ||
                        '—'}
                    </strong>
                  </div>
                </div>

                <div className="detail-item">
                  <CalendarDays size={16} />

                  <div>
                    <span>Registered</span>

                    <strong>
                      {selectedVisitor.created_at}
                    </strong>
                  </div>
                </div>

              </div>

              <div className="modal-section">

                <div className="modal-section-heading">
                  <h3>Previous Visits</h3>

                  <span>
                    {selectedVisitor.visits?.length || 0}
                  </span>
                </div>

                {selectedVisitor.visits?.length > 0 ? (
                  <div className="visit-history">

                    {selectedVisitor.visits.map(
                      (visit) => (
                        <div
                          className="visit-history-item"
                          key={visit.id}
                        >
                          <div className="visit-history-main">

                            <strong>
                              {visit.date}
                            </strong>

                            <span>
                              {visit.time}
                            </span>

                            <p>
                              {visit.host} ·{' '}
                              {visit.department}
                            </p>

                            <small>
                              {visit.purpose}
                            </small>

                          </div>

                          <span className="visit-status">
                            {visit.status}
                          </span>
                        </div>
                      ),
                    )}

                  </div>
                ) : (
                  <div className="no-visits">
                    <Clock size={20} />

                    <span>
                      No previous visits
                    </span>
                  </div>
                )}

              </div>

            </div>

            <div className="modal-footer">

              <button
                className="btn btn-secondary"
                onClick={closeVisitorDetails}
              >
                Close
              </button>

              <Link
                to={`/staff/new-visit?visitor_id=${selectedVisitor.id}`}
                className="btn btn-primary"
              >
                <UserPlus size={16} />
                Start New Visit
              </Link>

            </div>

          </div>
        </div>
      )}

    </main>
  )
}