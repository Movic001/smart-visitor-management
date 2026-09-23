import { useEffect, useMemo, useState } from 'react'
import {
    Search,
    Filter,
    Users,
    UserCheck,
    UserX,
    ShieldCheck,
    X,
    CheckCircle,
    Clock,
    CalendarDays,
    Building2,
    Phone,
    Mail,
    UserRound,
    LogIn,
    LogOut,
    History,
    AlertCircle,
} from 'lucide-react'

import '../../styles/visitors.css'

const API_BASE_URL = 'http://localhost:8000/api'

function formatDate(date) {
    if (!date) {
        return '—'
    }

    const value = String(date).slice(0, 10)

    const match = value.match(
        /^(\d{4})-(\d{2})-(\d{2})$/
    )

    if (match) {
        const [, year, month, day] = match

        const parsed = new Date(
            Number(year),
            Number(month) - 1,
            Number(day)
        )

        return parsed.toLocaleDateString(
            undefined,
            {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
            }
        )
    }

    const parsed = new Date(date)

    if (Number.isNaN(parsed.getTime())) {
        return '—'
    }

    return parsed.toLocaleDateString(
        undefined,
        {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        }
    )
}

function formatTime(time) {
    if (!time) {
        return '—'
    }

    const value = String(time).slice(0, 5)

    const [hours, minutes] = value.split(':')

    if (!hours || !minutes) {
        return '—'
    }

    const date = new Date()

    date.setHours(
        Number(hours),
        Number(minutes),
        0,
        0
    )

    return date.toLocaleTimeString(
        undefined,
        {
            hour: 'numeric',
            minute: '2-digit',
        }
    )
}

function formatDateTime(dateTime) {
    if (!dateTime) {
        return '—'
    }

    const parsed = new Date(dateTime)

    if (Number.isNaN(parsed.getTime())) {
        return '—'
    }

    return parsed.toLocaleString(
        undefined,
        {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
        }
    )
}

function getTodayString() {
    const today = new Date()

    const year = today.getFullYear()

    const month = String(
        today.getMonth() + 1
    ).padStart(2, '0')

    const day = String(
        today.getDate()
    ).padStart(2, '0')

    return `${year}-${month}-${day}`
}

function getVisitDateString(visit) {
    if (!visit?.visit_date) {
        return ''
    }

    return String(
        visit.visit_date
    ).slice(0, 10)
}

function normalizeStatus(status) {
    if (status === 'Checked-In') {
        return 'Checked In'
    }

    return status || 'Pending'
}

function getDepartmentName(visit) {
    return visit?.department?.name || '—'
}

function getCreatorName(visit) {
    return visit?.staff?.name || '—'
}

function getCreatorRole(visit) {
    return visit?.staff
        ? 'Staff / Host'
        : '—'
}

function isToday(visit) {
    return (
        getVisitDateString(visit)
        === getTodayString()
    )
}

function isFutureVisit(visit) {
    return (
        getVisitDateString(visit)
        > getTodayString()
    )
}

function isPastVisit(visit) {
    return (
        getVisitDateString(visit)
        < getTodayString()
    )
}

function getXsrfToken() {
    const cookies = document.cookie
        .split(';')
        .map((cookie) => cookie.trim())

    const xsrfCookie = cookies.find(
        (cookie) =>
            cookie.startsWith('XSRF-TOKEN=')
    )

    if (!xsrfCookie) {
        return null
    }

    return decodeURIComponent(
        xsrfCookie.split('=')[1]
    )
}

function getStatusClass(status) {
    switch (status) {
        case 'Pending':
            return 'status-inactive'

        case 'Checked In':
            return 'status-active'

        case 'Completed':
            return 'status-inactive'

        case 'Cancelled':
            return 'status-inactive'

        default:
            return 'status-inactive'
    }
}

export default function SecurityVisitors() {
    const [visitors, setVisitors] = useState([])
    const [stats, setStats] = useState({
        total_visitors: 0,
        total_visits: 0,
        currently_inside: 0,
        completed_visits: 0,
    })

    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] =
        useState('all')

    const [selectedVisitor, setSelectedVisitor] =
        useState(null)

    const [selectedVisit, setSelectedVisit] =
        useState(null)

    const [actionLoading, setActionLoading] =
        useState(false)

    const [actionError, setActionError] =
        useState('')

    const loadVisitors = async () => {
        try {
            setLoading(true)
            setError('')

            const response = await fetch(
                `http://localhost:8000/api/security/visitors`,
                {
                    credentials: 'include',
                    headers: {
                        Accept: 'application/json',
                    },
                }
            )

            if (!response.ok) {
                throw new Error(
                    'Failed to load visitors.'
                )
            }

            const result = await response.json()

            setVisitors(result.data || [])

            setStats({
                total_visitors:
                    result.stats?.total_visitors || 0,

                total_visits:
                    result.stats?.total_visits || 0,

                currently_inside:
                    result.stats?.currently_inside || 0,

                completed_visits:
                    result.stats?.completed_visits || 0,
            })
        } catch (err) {
            setError(
                err.message ||
                'Unable to load visitors.'
            )
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadVisitors()
    }, [])

    /*
     * Search/filter locally.
     *
     * No API request is made on every keystroke.
     */
    const filteredVisitors = useMemo(() => {
        const searchValue =
            search.trim().toLowerCase()

        return visitors.filter((visitor) => {
            const matchesSearch =
                !searchValue ||
                visitor.full_name
                    ?.toLowerCase()
                    .includes(searchValue) ||
                visitor.phone
                    ?.toLowerCase()
                    .includes(searchValue) ||
                visitor.visitor_code
                    ?.toLowerCase()
                    .includes(searchValue) ||
                visitor.company_name
                    ?.toLowerCase()
                    .includes(searchValue)

            if (!matchesSearch) {
                return false
            }

            if (statusFilter === 'all') {
                return true
            }

            return visitor.visits?.some(
                (visit) =>
                    normalizeStatus(
                        visit.status
                    ) === statusFilter
            )
        })
    }, [
        visitors,
        search,
        statusFilter,
    ])

    /*
     * One table row per visit.
     *
     * Visitors without visits still get
     * one "No Request" row.
     */
    const tableRows = useMemo(() => {
        const rows = []

        filteredVisitors.forEach((visitor) => {
            const visits =
                visitor.visits || []

            if (visits.length === 0) {
                if (
                    statusFilter === 'all'
                ) {
                    rows.push({
                        visitor,
                        visit: null,
                    })
                }

                return
            }

            visits.forEach((visit) => {
                const normalized =
                    normalizeStatus(
                        visit.status
                    )

                if (
                    statusFilter !== 'all' &&
                    normalized !== statusFilter
                ) {
                    return
                }

                rows.push({
                    visitor,
                    visit,
                })
            })
        })

        return rows
    }, [
        filteredVisitors,
        statusFilter,
    ])

    const clearFilters = () => {
        setSearch('')
        setStatusFilter('all')
    }

    const openVisitorModal = (
        visitor,
        visit = null
    ) => {
        setSelectedVisitor(visitor)
        setSelectedVisit(visit)
        setActionError('')
    }

    const closeModal = () => {
        if (actionLoading) {
            return
        }

        setSelectedVisitor(null)
        setSelectedVisit(null)
        setActionError('')
    }

    /*
     * Update the visit inside local state after
     * check-in/check-out.
     */
    const updateVisitInState = (
        updatedVisit
    ) => {
        setVisitors((currentVisitors) =>
            currentVisitors.map((visitor) => {
                if (
                    visitor.id !==
                    updatedVisit.visitor_id
                ) {
                    return visitor
                }

                return {
                    ...visitor,

                    status:
                        updatedVisit.status ===
                        'Completed'
                            ? 'Inactive'
                            : visitor.status,

                    visits:
                        visitor.visits?.map(
                            (visit) =>
                                visit.id ===
                                updatedVisit.id
                                    ? {
                                          ...visit,
                                          ...updatedVisit,
                                      }
                                    : visit
                        ),
                }
            })
        )

        setSelectedVisit(updatedVisit)
    }

 const handleCheckIn = async () => {
    if (!selectedVisit) {
        return
    }

    setActionLoading(true)
    setActionError('')

    try {
        const response = await fetch(
            `${API_BASE_URL}/security/visits/${selectedVisit.id}/check-in`,
            {
                method: 'POST',
                credentials: 'include',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    ...(getXsrfToken()
                        ? {
                              'X-XSRF-TOKEN':
                                  getXsrfToken(),
                          }
                        : {}),
                },
                body: JSON.stringify({}),
            }
        )

        // Read the response safely.
        const text = await response.text()

        let result = {}

        if (text) {
            try {
                result = JSON.parse(text)
            } catch {
                throw new Error(
                    `Server returned an invalid response (${response.status}).`
                )
            }
        }

        if (!response.ok) {
            throw new Error(
                result.message ||
                    `Check-in failed (${response.status}).`
            )
        }

        if (!result.data) {
            throw new Error(
                'Check-in succeeded but the server returned no visit data.'
            )
        }

        updateVisitInState(result.data)

        setStats((currentStats) => ({
            ...currentStats,
            currently_inside:
                currentStats.currently_inside + 1,
        }))
    } catch (error) {
        console.error('Check-in error:', error)

        setActionError(
            error.message ||
                'Unable to check in visitor.'
        )
    } finally {
        setActionLoading(false)
    }
}

    const handleCheckOut = async () => {
        if (!selectedVisit) {
            return
        }

        try {
            setActionLoading(true)
            setActionError('')

            const xsrfToken =
                getXsrfToken()

            const response = await fetch(
                `${API_BASE_URL}/security/visits/${selectedVisit.id}/check-out`,
                {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        Accept:
                            'application/json',
                        'Content-Type':
                            'application/json',
                        ...(xsrfToken
                            ? {
                                  'X-XSRF-TOKEN':
                                      xsrfToken,
                              }
                            : {}),
                    },
                    body: JSON.stringify({}),
                }
            )

            const result =
                await response.json()

            if (!response.ok) {
                throw new Error(
                    result.message ||
                    'Unable to check out visitor.'
                )
            }

            const updatedVisit =
                result.data

            updateVisitInState(
                updatedVisit
            )

            /*
             * Update statistics immediately.
             */
            setStats((current) => ({
                ...current,

                currently_inside:
                    Math.max(
                        0,
                        current.currently_inside - 1
                    ),

                completed_visits:
                    current.completed_visits + 1,
            }))
        } catch (err) {
            setActionError(
                err.message ||
                'Unable to check out visitor.'
            )
        } finally {
            setActionLoading(false)
        }
    }

    const selectedVisitStatus =
        selectedVisit
            ? normalizeStatus(
                  selectedVisit.status
              )
            : null

    const selectedVisitIsToday =
        selectedVisit
            ? isToday(selectedVisit)
            : false

    const selectedVisitIsFuture =
        selectedVisit
            ? isFutureVisit(selectedVisit)
            : false

    const selectedVisitIsPast =
        selectedVisit
            ? isPastVisit(selectedVisit)
            : false

    return (
        <div className="visitors-page">
            <div className="visitors-container">

                {/* Header */}
                <div className="visitors-header">
                    <div>
                        <div className="breadcrumb">
                            Security
                            <span>/</span>
                            Visitors
                        </div>

                        <h1 className="page-title">
                            Visitors
                        </h1>

                        <p className="page-subtitle">
                            Search and verify visitors,
                            then manage check-in and
                            check-out.
                        </p>
                    </div>
                </div>

                {/* Error */}
                {error && (
                    <div className="filtered-empty-state">
                        <AlertCircle size={20} />
                        <span>{error}</span>
                    </div>
                )}

                {/* Stats */}
                <div className="visitor-stats">

                    <div className="visitor-stat-card">
                        <div className="visitor-stat-top">
                            <div>
                                <p>Total Visitors</p>
                                <strong>
                                    {stats.total_visitors}
                                </strong>
                            </div>

                            <div className="visitor-stat-icon">
                                <Users size={20} />
                            </div>
                        </div>
                    </div>

                    <div className="visitor-stat-card">
                        <div className="visitor-stat-top">
                            <div>
                                <p>Total Visits</p>
                                <strong>
                                    {stats.total_visits}
                                </strong>
                            </div>

                            <div className="visitor-stat-icon neutral">
                                <History size={20} />
                            </div>
                        </div>
                    </div>

                    <div className="visitor-stat-card">
                        <div className="visitor-stat-top">
                            <div>
                                <p>Currently Inside</p>
                                <strong>
                                    {stats.currently_inside}
                                </strong>
                            </div>

                            <div className="visitor-stat-icon success">
                                <UserCheck size={20} />
                            </div>
                        </div>
                    </div>

                    <div className="visitor-stat-card">
                        <div className="visitor-stat-top">
                            <div>
                                <p>Completed Visits</p>
                                <strong>
                                    {stats.completed_visits}
                                </strong>
                            </div>

                            <div className="visitor-stat-icon info">
                                <UserX size={20} />
                            </div>
                        </div>
                    </div>

                </div>

                {/* Filters */}
                <div className="visitor-filter-card">

                    <div className="filter-heading">
                        <Filter size={18} />
                        <span>Search & Filter</span>
                    </div>

                    <div className="visitor-filters">

                        <div className="search-field">
                            <Search size={18} />

                            <input
                                type="text"
                                value={search}
                                onChange={(event) =>
                                    setSearch(
                                        event.target.value
                                    )
                                }
                                placeholder="Search by name, phone, visitor code or company..."
                            />
                        </div>

                        <div className="filter-field">
                            <label>
                                Visit Status
                            </label>

                            <select
                                value={
                                    statusFilter
                                }
                                onChange={(event) =>
                                    setStatusFilter(
                                        event.target.value
                                    )
                                }
                            >
                                <option value="all">
                                    All Visits
                                </option>

                                <option value="Pending">
                                    Pending
                                </option>

                                <option value="Checked In">
                                    Checked In
                                </option>

                                <option value="Completed">
                                    Completed
                                </option>

                                <option value="Cancelled">
                                    Cancelled
                                </option>
                            </select>
                        </div>

                        <button
                            type="button"
                            className="clear-filters-btn"
                            onClick={
                                clearFilters
                            }
                        >
                            Clear Filters
                        </button>

                    </div>
                </div>

                {/* Table */}
                <div className="visitors-table-card">

                    <div className="table-card-header">
                        <div>
                            <h2>
                                Visitor Records
                            </h2>

                            <p>
                                {tableRows.length}{' '}
                                record
                                {tableRows.length !==
                                1
                                    ? 's'
                                    : ''}
                            </p>
                        </div>

                        <ShieldCheck
                            size={22}
                        />
                    </div>

                    <div className="table-wrapper">

                        {loading ? (
                            <div className="filtered-empty-state">
                                <Clock
                                    size={20}
                                />
                                <span>
                                    Loading visitors...
                                </span>
                            </div>
                        ) : tableRows.length ===
                          0 ? (
                            <div className="filtered-empty-state">
                                <Users
                                    size={20}
                                />
                                <span>
                                    No visitors found
                                    matching your
                                    search or
                                    filter.
                                </span>
                            </div>
                        ) : (
                            <table className="visitors-table">
                                <thead>
                                    <tr>
                                        <th>
                                            Visitor
                                        </th>

                                        <th>
                                            Contact
                                        </th>

                                        <th>
                                            Visit
                                        </th>

                                        <th>
                                            Host
                                        </th>

                                        <th>
                                            Date & Time
                                        </th>

                                        <th>
                                            Status
                                        </th>

                                        <th>
                                            Action
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {tableRows.map(
                                        ({
                                            visitor,
                                            visit,
                                        }) => {
                                            const status =
                                                visit
                                                    ? normalizeStatus(
                                                          visit.status
                                                      )
                                                    : null

                                            return (
                                                <tr
                                                    key={
                                                        visit
                                                            ? `visit-${visit.id}`
                                                            : `visitor-${visitor.id}`
                                                    }
                                                >
                                                    <td>
                                                        <div className="visitor-cell">

                                                            <div className="visitor-avatar">
                                                                {visitor.photo ? (
                                                                    <img
                                                                        src={
                                                                            visitor.photo
                                                                        }
                                                                        alt={
                                                                            visitor.full_name
                                                                        }
                                                                    />
                                                                ) : (
                                                                    <UserRound
                                                                        size={
                                                                            18
                                                                        }
                                                                    />
                                                                )}
                                                            </div>

                                                            <div>
                                                                <div className="visitor-name">
                                                                    {
                                                                        visitor.full_name
                                                                    }
                                                                </div>

                                                                <div className="visitor-code">
                                                                    {
                                                                        visitor.visitor_code
                                                                    }
                                                                </div>
                                                            </div>

                                                        </div>
                                                    </td>

                                                    <td>
                                                        <div>
                                                            {
                                                                visitor.phone
                                                            }
                                                        </div>

                                                        {visitor.email && (
                                                            <div className="visitor-email">
                                                                {
                                                                    visitor.email
                                                                }
                                                            </div>
                                                        )}
                                                    </td>

                                                    <td>
                                                        {visit ? (
                                                            <div>
                                                                <div>
                                                                    {
                                                                        visit.purpose
                                                                    }
                                                                </div>

                                                                <div className="visitor-email">
                                                                    {
                                                                        getDepartmentName(
                                                                            visit
                                                                        )
                                                                    }
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            'No Request'
                                                        )}
                                                    </td>

                                                    <td>
                                                        {visit?.host_name ||
                                                            '—'}
                                                    </td>

                                                    <td>
                                                        {visit ? (
                                                            <div>
                                                                <div>
                                                                    {formatDate(
                                                                        visit.visit_date
                                                                    )}
                                                                </div>

                                                                <div className="visitor-email">
                                                                    {formatTime(
                                                                        visit.visit_time
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            '—'
                                                        )}
                                                    </td>

                                                    <td>
                                                        {visit ? (
                                                            <span
                                                                className={`status-badge ${getStatusClass(
                                                                    status
                                                                )}`}
                                                            >
                                                                <span className="status-dot" />
                                                                {
                                                                    status
                                                                }
                                                            </span>
                                                        ) : (
                                                            <span className="status-badge status-inactive">
                                                                <span className="status-dot" />
                                                                No Request
                                                            </span>
                                                        )}
                                                    </td>

                                                    <td>
                                                        <button
                                                            type="button"
                                                            className="view-btn"
                                                            onClick={() =>
                                                                openVisitorModal(
                                                                    visitor,
                                                                    visit
                                                                )
                                                            }
                                                        >
                                                            Verify
                                                        </button>
                                                    </td>
                                                </tr>
                                            )
                                        }
                                    )}
                                </tbody>
                            </table>
                        )}

                    </div>
                </div>
            </div>

           {/* Visitor Details Modal */}
{selectedVisitor && (
    <div
        className="modal-overlay"
        onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
                closeModal()
            }
        }}
    >
        <div className="visitor-details-modal">

            {/* Modal Header */}
            <div className="modal-header">
                <div>
                    <h2>Verify Visitor</h2>
                    <p>Review visitor and visit information.</p>
                </div>

                <button
                    type="button"
                    className="modal-close"
                    onClick={closeModal}
                    disabled={actionLoading}
                >
                    <X size={18} />
                </button>
            </div>

            {/* Modal Body */}
            <div className="modal-body">

                {/* Visitor Profile */}
                <div className="visitor-profile">
                    <div className="large-visitor-avatar">
                        {selectedVisitor.photo ? (
                            <img
                                src={selectedVisitor.photo}
                                alt={selectedVisitor.full_name}
                            />
                       ) : (
                            selectedVisitor.full_name
                                ?.trim()
                                .split(/\s+/)
                                .slice(0, 2)
                                .map((part) => part[0])
                                .join('')
                                .toUpperCase() || <UserRound size={28} />
                        )}
                    </div>

                    <div>
                        <h3>{selectedVisitor.full_name}</h3>
                        <p>{selectedVisitor.visitor_code}</p>

                        <span
                            className={`status-badge ${
                                selectedVisitor.status === 'Active'
                                    ? 'status-active'
                                    : 'status-inactive'
                            }`}
                        >
                            <span className="status-dot" />
                            Visitor Profile: {selectedVisitor.status}
                        </span>
                    </div>
                </div>

                {/* Visitor Information */}
                <div className="visitor-detail-grid">
                    <div className="detail-item">
                        <Phone size={16} />
                        <div>
                            <span>Phone</span>
                            <strong>{selectedVisitor.phone || '—'}</strong>
                        </div>
                    </div>

                    <div className="detail-item">
                        <Mail size={16} />
                        <div>
                            <span>Email</span>
                            <strong>{selectedVisitor.email || '—'}</strong>
                        </div>
                    </div>

                    <div className="detail-item">
                        <Building2 size={16} />
                        <div>
                            <span>Company</span>
                            <strong>
                                {selectedVisitor.company_name || '—'}
                            </strong>
                        </div>
                    </div>

                    <div className="detail-item">
                        <Users size={16} />
                        <div>
                            <span>Visitor Code</span>
                            <strong>
                                {selectedVisitor.visitor_code || '—'}
                            </strong>
                        </div>
                    </div>
                </div>

                {/* No Visit Request */}
                {!selectedVisit && (
                    <div
                        className="modal-section"
                        style={{ marginTop: 24 }}
                    >
                        <div className="modal-section-heading">
                            <AlertCircle size={17} />
                            <h3>Visit Request</h3>
                        </div>

                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: 10,
                                padding: 14,
                                borderRadius: 8,
                                background: '#fff7ed',
                                border: '1px solid #fed7aa',
                                color: '#9a3412',
                            }}
                        >
                            <AlertCircle size={18} />

                            <span>
                                No valid visit request found. Please ask the
                                visitor to contact the person they are visiting
                                or go to the Admin / Staff room to create a
                                visit request.
                            </span>
                        </div>
                    </div>
                )}

                {/* Selected Visit */}
                {selectedVisit && (
                    <>
                        {/* Visit Details */}
                        <div className="modal-section">
                            <div className="modal-section-heading">
                                <h3>Visit Details</h3>

                                <span
                                    className={`status-badge ${getStatusClass(
                                        selectedVisitStatus
                                    )}`}
                                >
                                    <span className="status-dot" />
                                    {selectedVisitStatus}
                                </span>
                            </div>

                            <div className="visit-history">
                                <div className="visit-history-item">
                                    <div className="visit-history-main">
                                        <strong>
                                            {selectedVisit.host_name || '—'}
                                        </strong>

                                        <span>
                                            {getDepartmentName(selectedVisit)}
                                        </span>

                                        <p>{selectedVisit.purpose || '—'}</p>

                                        <div>
                                            <CalendarDays size={14} />
                                            <span>
                                                {formatDate(
                                                    selectedVisit.visit_date
                                                )}
                                            </span>

                                            <Clock size={14} />
                                            <span>
                                                {formatTime(
                                                    selectedVisit.visit_time
                                                )}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="visit-status">
                                        <span
                                            className={`status-badge ${getStatusClass(
                                                selectedVisitStatus
                                            )}`}
                                        >
                                            <span className="status-dot" />
                                            {selectedVisitStatus}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Request Created By */}
                        <div className="modal-section">
                            <div className="modal-section-heading">
                                <h3>Request Created By</h3>
                            </div>

                            <div
                                style={{
                                    padding: 14,
                                    borderRadius: 8,
                                    background: '#f9fafb',
                                    border: '1px solid #e5e7eb',
                                }}
                            >
                                <strong>
                                    {getCreatorName(selectedVisit)}
                                </strong>

                                <p style={{ margin: '4px 0 0' }}>
                                    {getCreatorRole(selectedVisit)}
                                </p>
                            </div>
                        </div>

                        {/* Security Activity */}
                        {(selectedVisit.check_in_at ||
                            selectedVisit.check_out_at ||
                            selectedVisit.checkedInBy ||
                            selectedVisit.checkedOutBy ||
                            selectedVisit.checked_in_by ||
                            selectedVisit.checked_out_by) && (
                            <div className="modal-section">
                                <div className="modal-section-heading">
                                    <h3>Security Activity</h3>
                                </div>

                                <div className="visit-detail-grid">
                                    <div className="detail-item">
                                        <div>
                                            <span>Check-In</span>
                                            <strong>
                                                {selectedVisit.check_in_at
                                                    ? formatDateTime(
                                                          selectedVisit.check_in_at
                                                      )
                                                    : 'Not checked in'}
                                            </strong>
                                        </div>
                                    </div>

                                    <div className="detail-item">
                                        <div>
                                            <span>Checked In By</span>
                                            <strong>
                                                {(
                                                    selectedVisit.checkedInBy ||
                                                    selectedVisit.checked_in_by
                                                )?.name || '—'}
                                            </strong>
                                        </div>
                                    </div>

                                    <div className="detail-item">
                                        <div>
                                            <span>Check-Out</span>
                                            <strong>
                                                {selectedVisit.check_out_at
                                                    ? formatDateTime(
                                                          selectedVisit.check_out_at
                                                      )
                                                    : 'Not checked out'}
                                            </strong>
                                        </div>
                                    </div>

                                    <div className="detail-item">
                                        <div>
                                            <span>Checked Out By</span>
                                            <strong>
                                                {(
                                                    selectedVisit.checkedOutBy ||
                                                    selectedVisit.checked_out_by
                                                )?.name || '—'}
                                            </strong>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Future Visit Notice */}
                        {selectedVisitStatus === 'Pending' &&
                            selectedVisitIsFuture && (
                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'flex-start',
                                        gap: 10,
                                        padding: 14,
                                        borderRadius: 8,
                                        background: '#eff6ff',
                                        border: '1px solid #bfdbfe',
                                        color: '#1d4ed8',
                                    }}
                                >
                                    <CalendarDays size={18} />

                                    <span>
                                        This visit is scheduled for{' '}
                                        <strong>
                                            {formatDate(
                                                selectedVisit.visit_date
                                            )}
                                        </strong>
                                        . It can only be checked in on the
                                        scheduled date.
                                    </span>
                                </div>
                            )}

                        {/* Past Visit Notice */}
                        {selectedVisitStatus === 'Pending' &&
                            selectedVisitIsPast && (
                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'flex-start',
                                        gap: 10,
                                        padding: 14,
                                        borderRadius: 8,
                                        background: '#f9fafb',
                                        border: '1px solid #e5e7eb',
                                        color: '#4b5563',
                                    }}
                                >
                                    <AlertCircle size={18} />

                                    <span>
                                        This visit was scheduled for{' '}
                                        <strong>
                                            {formatDate(
                                                selectedVisit.visit_date
                                            )}
                                        </strong>
                                        . It cannot be checked in now.
                                    </span>
                                </div>
                            )}
                    </>
                )}

                {/* Visit History */}
                {selectedVisitor.visits?.length > 0 && (
                    <div
                        className="modal-section"
                        style={{ marginTop: 24 }}
                    >
                        <div className="modal-section-heading">
                            <h3>Visit History</h3>

                            <span className="history-count">
                                {selectedVisitor.visits.length}
                            </span>
                        </div>

                        <div className="visit-history">
                            {selectedVisitor.visits.map((visit) => (
                                <div
                                    key={visit.id}
                                    className="visit-history-item"
                                    onClick={() =>
                                        handleSelectVisitor(
                                            selectedVisitor,
                                            visit
                                        )
                                    }
                                    style={{ cursor: 'pointer' }}
                                >
                                    <div className="visit-history-main">
                                        <strong>
                                            {visit.host_name || '—'}
                                        </strong>

                                        <span>
                                            {getDepartmentName(visit)}
                                        </span>

                                        <p>{visit.purpose || '—'}</p>

                                        <div>
                                            <CalendarDays size={14} />
                                            <span>
                                                {formatDate(visit.visit_date)}
                                            </span>

                                            <Clock size={14} />
                                            <span>
                                                {formatTime(visit.visit_time)}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="visit-status">
                                        <span
                                            className={`status-badge ${getStatusClass(
                                                normalizeStatus(visit.status)
                                            )}`}
                                        >
                                            <span className="status-dot" />
                                            {normalizeStatus(visit.status)}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Action Error */}
                {actionError && (
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            marginTop: 16,
                            padding: 12,
                            borderRadius: 8,
                            background: '#fef2f2',
                            border: '1px solid #fecaca',
                            color: '#b91c1c',
                        }}
                    >
                        <AlertCircle size={18} />
                        <span>{actionError}</span>
                    </div>
                )}
            </div>

            {/* Modal Footer */}
            <div className="modal-footer">
                <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={closeModal}
                    disabled={actionLoading}
                >
                    Close
                </button>

                {/* Pending + Today */}
                {selectedVisitStatus === 'Pending' &&
                    selectedVisitIsToday && (
                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={handleCheckIn}
                            disabled={actionLoading}
                        >
                            <LogIn size={15} />
                            {actionLoading ? 'Checking In...' : 'Check In'}
                        </button>
                    )}

                {/* Pending + Future */}
                {selectedVisitStatus === 'Pending' &&
                    selectedVisitIsFuture && (
                        <button
                            type="button"
                            className="btn btn-secondary"
                            disabled
                        >
                            <CalendarDays size={15} />
                            Scheduled for{' '}
                            {formatDate(selectedVisit.visit_date)}
                        </button>
                    )}

                {/* Pending + Past */}
                {selectedVisitStatus === 'Pending' &&
                    selectedVisitIsPast && (
                        <button
                            type="button"
                            className="btn btn-secondary"
                            disabled
                        >
                            <AlertCircle size={15} />
                            Visit date has passed
                        </button>
                    )}

                {/* Checked In + Today */}
                {selectedVisitStatus === 'Checked In' &&
                    selectedVisitIsToday && (
                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={handleCheckOut}
                            disabled={actionLoading}
                        >
                            <LogOut size={15} />
                            {actionLoading ? 'Checking Out...' : 'Check Out'}
                        </button>
                    )}

                {/* Completed */}
                {selectedVisitStatus === 'Completed' && (
                    <span
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            color: '#6b7280',
                        }}
                    >
                        <CheckCircle size={16} />
                        Visit Completed
                    </span>
                )}

                {/* Cancelled */}
                {selectedVisitStatus === 'Cancelled' && (
                    <span
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            color: '#6b7280',
                        }}
                    >
                        <X size={16} />
                        Visit Cancelled
                    </span>
                )}
            </div>
        </div>
    </div>
)}
        </div>
    )
}
