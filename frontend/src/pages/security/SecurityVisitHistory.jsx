import { useEffect, useMemo, useState } from 'react'
import {
    Search,
    Filter,
    History,
    Users,
    UserCheck,
    CheckCircle,
    Clock,
    CalendarDays,
    Building2,
    Phone,
    ShieldCheck,
    AlertCircle,
    Eye,
    X,
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

function getSecurityName(security) {
    return security?.name || '—'
}

function getStatusClass(status) {
    switch (status) {
        case 'Pending':
            return 'status-pending'

        case 'Checked In':
            return 'status-checked-in'

        case 'Completed':
            return 'status-completed'

        case 'Cancelled':
            return 'status-cancelled'

        default:
            return 'status-inactive'
    }
}

function getInitials(name) {
    if (!name) {
        return '?'
    }

    return name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0])
        .join('')
        .toUpperCase()
}

export default function SecurityVisitHistory() {
    const [history, setHistory] = useState([])

    const [loading, setLoading] =
        useState(true)

    const [error, setError] =
        useState('')

    const [search, setSearch] =
        useState('')

    const [statusFilter, setStatusFilter] =
        useState('all')

    const [departmentFilter, setDepartmentFilter] =
        useState('all')

    const [selectedVisit, setSelectedVisit] =
        useState(null)

    const loadHistory = async () => {
        try {
            setLoading(true)
            setError('')

            const response = await fetch(
                `${API_BASE_URL}/security/visitors`,
                {
                    credentials: 'include',
                    headers: {
                        Accept:
                            'application/json',
                    },
                }
            )

            if (!response.ok) {
                throw new Error(
                    'Failed to load visit history.'
                )
            }

            const result =
                await response.json()

            const rows = []

            ;(result.data || []).forEach(
                (visitor) => {
                    ;(visitor.visits || []).forEach(
                        (visit) => {
                            rows.push({
                                visitor,
                                visit,
                            })
                        }
                    )
                }
            )

            setHistory(rows)
        } catch (err) {
            setError(
                err.message ||
                    'Unable to load visit history.'
            )
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadHistory()
    }, [])

    /*
     * Build department list from the
     * actual backend records.
     */
    const departments = useMemo(() => {
        const values = history
            .map(({ visit }) =>
                getDepartmentName(visit)
            )
            .filter(
                (department) =>
                    department &&
                    department !== '—'
            )

        return [...new Set(values)].sort()
    }, [history])

    /*
     * Apply search and filters locally.
     */
    const filteredHistory = useMemo(() => {
        const searchValue =
            search.trim().toLowerCase()

        return history.filter(
            ({ visitor, visit }) => {
                const status =
                    normalizeStatus(
                        visit.status
                    )

                const department =
                    getDepartmentName(
                        visit
                    )

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
                        .includes(searchValue) ||
                    visit.host_name
                        ?.toLowerCase()
                        .includes(searchValue) ||
                    visit.purpose
                        ?.toLowerCase()
                        .includes(searchValue)

                const matchesStatus =
                    statusFilter === 'all' ||
                    status === statusFilter

                const matchesDepartment =
                    departmentFilter ===
                        'all' ||
                    department ===
                        departmentFilter

                return (
                    matchesSearch &&
                    matchesStatus &&
                    matchesDepartment
                )
            }
        )
    }, [
        history,
        search,
        statusFilter,
        departmentFilter,
    ])

    /*
     * History statistics.
     */
    const stats = useMemo(() => {
        return {
            total:
                history.length,

            checkedIn:
                history.filter(
                    ({ visit }) =>
                        normalizeStatus(
                            visit.status
                        ) === 'Checked In'
                ).length,

            completed:
                history.filter(
                    ({ visit }) =>
                        normalizeStatus(
                            visit.status
                        ) === 'Completed'
                ).length,

            cancelled:
                history.filter(
                    ({ visit }) =>
                        normalizeStatus(
                            visit.status
                        ) === 'Cancelled'
                ).length,
        }
    }, [history])

    const clearFilters = () => {
        setSearch('')
        setStatusFilter('all')
        setDepartmentFilter('all')
    }

    const openVisitModal = (row) => {
        setSelectedVisit(row)
    }

    const closeVisitModal = () => {
        setSelectedVisit(null)
    }

    return (
        <div className="visitors-page">
            <div className="visitors-container">

                {/* Header */}
                <div className="visitors-header">
                    <div>
                        <div className="breadcrumb">
                            Security
                            <span>/</span>
                            Visit History
                        </div>

                        <h1 className="page-title">
                            Visit History
                        </h1>

                        <p className="page-subtitle">
                            Review previous and current
                            visitor visit records.
                        </p>
                    </div>
                </div>

                {/* Error */}
                {error && (
                    <div className="filtered-empty-state">
                        <AlertCircle
                            size={20}
                        />

                        <span>{error}</span>
                    </div>
                )}

                {/* Statistics */}
                <div className="visitor-stats">

                    <div className="visitor-stat-card">
                        <div className="visitor-stat-top">
                            <div>
                                <p>
                                    Total Visits
                                </p>

                                <strong>
                                    {stats.total}
                                </strong>
                            </div>

                            <div className="visitor-stat-icon neutral">
                                <History
                                    size={20}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="visitor-stat-card">
                        <div className="visitor-stat-top">
                            <div>
                                <p>
                                    Checked In
                                </p>

                                <strong>
                                    {stats.checkedIn}
                                </strong>
                            </div>

                            <div className="visitor-stat-icon success">
                                <UserCheck
                                    size={20}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="visitor-stat-card">
                        <div className="visitor-stat-top">
                            <div>
                                <p>
                                    Completed
                                </p>

                                <strong>
                                    {stats.completed}
                                </strong>
                            </div>

                            <div className="visitor-stat-icon info">
                                <CheckCircle
                                    size={20}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="visitor-stat-card">
                        <div className="visitor-stat-top">
                            <div>
                                <p>
                                    Cancelled
                                </p>

                                <strong>
                                    {stats.cancelled}
                                </strong>
                            </div>

                            <div className="visitor-stat-icon cancelled">
                                <X size={20} />
                            </div>
                        </div>
                    </div>

                </div>

                {/* Search + Filters */}
                <div className="visitor-filter-card">

                    <div className="filter-heading">
                        <div>
                            <h2>
                                Search & Filter
                            </h2>

                            <p>
                                Find a specific visit
                                record.
                            </p>
                        </div>

                        <Filter size={18} />
                    </div>

                    <div className="visitor-filters">

                        {/* Search */}
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
                                placeholder="Search visitor, phone, code, host or purpose..."
                            />
                        </div>

                        {/* Status */}
                        <div className="filter-field">
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
                                    All Statuses
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

                        {/* Department */}
                        <div className="filter-field">
                            <select
                                value={
                                    departmentFilter
                                }
                                onChange={(event) =>
                                    setDepartmentFilter(
                                        event.target.value
                                    )
                                }
                            >
                                <option value="all">
                                    All Departments
                                </option>

                                {departments.map(
                                    (department) => (
                                        <option
                                            key={
                                                department
                                            }
                                            value={
                                                department
                                            }
                                        >
                                            {department}
                                        </option>
                                    )
                                )}
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

                {/* Visit History Table */}
                <div className="visitors-table-card">

                    <div className="table-card-header">
                        <div>
                            <h2>
                                Visit Records
                            </h2>

                            <p>
                                {filteredHistory.length}{' '}
                                record
                                {filteredHistory.length !==
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
                                    Loading visit
                                    history...
                                </span>
                            </div>
                        ) : filteredHistory.length ===
                          0 ? (
                            <div className="filtered-empty-state">
                                <History
                                    size={20}
                                />

                                <h3>
                                    No visit records
                                    found
                                </h3>

                                <p>
                                    Try changing your
                                    search or filters.
                                </p>
                            </div>
                        ) : (
                            <table className="visitors-table history-table">

                                <thead>
                                    <tr>
                                        <th>
                                            Visitor
                                        </th>

                                        <th>
                                            Host
                                        </th>

                                        <th>
                                            Department
                                        </th>

                                        <th>
                                            Purpose
                                        </th>

                                        <th>
                                            Visit Date
                                        </th>

                                        <th>
                                            Status
                                        </th>

                                        <th>
                                            Check-In
                                        </th>

                                        <th>
                                            Check-Out
                                        </th>

                                        <th>
                                            Action
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {filteredHistory.map(
                                        ({
                                            visitor,
                                            visit,
                                        }) => {
                                            const status =
                                                normalizeStatus(
                                                    visit.status
                                                )

                                            const checkedInBy =
                                                visit.checked_in_by

                                            const checkedOutBy =
                                                visit.checked_out_by

                                            return (
                                                <tr
                                                    key={`history-${visit.id}`}
                                                >

                                                    {/* Visitor */}
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
                                                                    getInitials(
                                                                        visitor.full_name
                                                                    )
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

                                                    {/* Host */}
                                                    <td>
                                                        <strong className="history-primary-text">
                                                            {
                                                                visit.host_name ||
                                                                '—'
                                                            }
                                                        </strong>
                                                    </td>

                                                    {/* Department */}
                                                    <td>
                                                        <span className="history-department">
                                                            <Building2
                                                                size={
                                                                    14
                                                                }
                                                            />

                                                            {
                                                                getDepartmentName(
                                                                    visit
                                                                )
                                                            }
                                                        </span>
                                                    </td>

                                                    {/* Purpose */}
                                                    <td>
                                                        <span className="history-purpose">
                                                            {
                                                                visit.purpose ||
                                                                '—'
                                                            }
                                                        </span>
                                                    </td>

                                                    {/* Date */}
                                                    <td>
                                                        <div className="history-date-cell">
                                                            <strong>
                                                                {formatDate(
                                                                    visit.visit_date
                                                                )}
                                                            </strong>

                                                            <span>
                                                                <Clock
                                                                    size={
                                                                        12
                                                                    }
                                                                />

                                                                {formatTime(
                                                                    visit.visit_time
                                                                )}
                                                            </span>
                                                        </div>
                                                    </td>

                                                    {/* Status */}
                                                    <td>
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
                                                    </td>

                                                    {/* Check-In */}
                                                    <td>
                                                        <div className="history-activity-cell">

                                                            <strong>
                                                                {visit.check_in_at
                                                                    ? formatDateTime(
                                                                          visit.check_in_at
                                                                      )
                                                                    : 'Not checked in'}
                                                            </strong>

                                                            {checkedInBy && (
                                                                <span>
                                                                    By{' '}
                                                                    {getSecurityName(
                                                                        checkedInBy
                                                                    )}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>

                                                    {/* Check-Out */}
                                                    <td>
                                                        <div className="history-activity-cell">

                                                            <strong>
                                                                {visit.check_out_at
                                                                    ? formatDateTime(
                                                                          visit.check_out_at
                                                                      )
                                                                    : 'Not checked out'}
                                                            </strong>

                                                            {checkedOutBy && (
                                                                <span>
                                                                    By{' '}
                                                                    {getSecurityName(
                                                                        checkedOutBy
                                                                    )}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>

                                                    {/* Action */}
                                                    <td>
                                                        <button
                                                            type="button"
                                                            className="view-btn"
                                                            onClick={() =>
                                                                openVisitModal(
                                                                    {
                                                                        visitor,
                                                                        visit,
                                                                    }
                                                                )
                                                            }
                                                        >
                                                            <Eye
                                                                size={
                                                                    15
                                                                }
                                                            />

                                                            View
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

            {/* Visit Details Modal */}
            {selectedVisit && (
                <div
                    className="modal-overlay"
                    onMouseDown={(event) => {
                        if (
                            event.target ===
                            event.currentTarget
                        ) {
                            closeVisitModal()
                        }
                    }}
                >
                    <div className="visitor-details-modal">

                        <div className="modal-header">
                            <div>
                                <h2>
                                    Visit Details
                                </h2>

                                <p>
                                    Review the complete
                                    visit record.
                                </p>
                            </div>

                            <button
                                type="button"
                                className="modal-close"
                                onClick={
                                    closeVisitModal
                                }
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="modal-body">

                            {/* Visitor */}
                            <div className="visitor-profile">
                                <div className="large-visitor-avatar">
                                    {selectedVisit
                                        .visitor
                                        .photo ? (
                                        <img
                                            src={
                                                selectedVisit
                                                    .visitor
                                                    .photo
                                            }
                                            alt={
                                                selectedVisit
                                                    .visitor
                                                    .full_name
                                            }
                                        />
                                    ) : (
                                        getInitials(
                                            selectedVisit
                                                .visitor
                                                .full_name
                                        )
                                    )}
                                </div>

                                <div>
                                    <h3>
                                        {
                                            selectedVisit
                                                .visitor
                                                .full_name
                                        }
                                    </h3>

                                    <p>
                                        {
                                            selectedVisit
                                                .visitor
                                                .visitor_code
                                        }
                                    </p>

                                    <span
                                        className={`status-badge ${getStatusClass(
                                            normalizeStatus(
                                                selectedVisit
                                                    .visit
                                                    .status
                                            )
                                        )}`}
                                    >
                                        <span className="status-dot" />

                                        {normalizeStatus(
                                            selectedVisit
                                                .visit
                                                .status
                                        )}
                                    </span>
                                </div>
                            </div>

                            {/* Visitor Information */}
                            <div className="visitor-detail-grid">

                                <div className="detail-item">
                                    <Phone
                                        size={16}
                                    />

                                    <div>
                                        <span>
                                            Phone
                                        </span>

                                        <strong>
                                            {
                                                selectedVisit
                                                    .visitor
                                                    .phone
                                            }
                                        </strong>
                                    </div>
                                </div>

                                <div className="detail-item">
                                    <Building2
                                        size={16}
                                    />

                                    <div>
                                        <span>
                                            Department
                                        </span>

                                        <strong>
                                            {getDepartmentName(
                                                selectedVisit
                                                    .visit
                                            )}
                                        </strong>
                                    </div>
                                </div>

                                <div className="detail-item">
                                    <Users
                                        size={16}
                                    />

                                    <div>
                                        <span>
                                            Host
                                        </span>

                                        <strong>
                                            {
                                                selectedVisit
                                                    .visit
                                                    .host_name
                                            }
                                        </strong>
                                    </div>
                                </div>

                                <div className="detail-item">
                                    <CalendarDays
                                        size={16}
                                    />

                                    <div>
                                        <span>
                                            Visit Date
                                        </span>

                                        <strong>
                                            {formatDate(
                                                selectedVisit
                                                    .visit
                                                    .visit_date
                                            )}
                                        </strong>
                                    </div>
                                </div>

                            </div>

                            {/* Visit Information */}
                            <div className="modal-section">

                                <div className="modal-section-heading">
                                    <h3>
                                        Visit Information
                                    </h3>
                                </div>

                                <div className="visit-history">

                                    <div className="visit-history-item">

                                        <div className="visit-history-main">

                                            <strong>
                                                Purpose
                                            </strong>

                                            <p>
                                                {
                                                    selectedVisit
                                                        .visit
                                                        .purpose
                                                }
                                            </p>

                                            <span>
                                                Visit Time:{' '}
                                                {formatTime(
                                                    selectedVisit
                                                        .visit
                                                        .visit_time
                                                )}
                                            </span>

                                        </div>

                                        <div className="visit-status">
                                            <span
                                                className={`status-badge ${getStatusClass(
                                                    normalizeStatus(
                                                        selectedVisit
                                                            .visit
                                                            .status
                                                    )
                                                )}`}
                                            >
                                                <span className="status-dot" />

                                                {normalizeStatus(
                                                    selectedVisit
                                                        .visit
                                                        .status
                                                )}
                                            </span>
                                        </div>

                                    </div>

                                </div>

                            </div>

                            {/* Request Creator */}
                            <div className="modal-section">

                                <div className="modal-section-heading">
                                    <h3>
                                        Request Created By
                                    </h3>
                                </div>

                                <div className="detail-item">
                                    <div>
                                        <span>
                                            Staff / Host
                                        </span>

                                        <strong>
                                            {getCreatorName(
                                                selectedVisit
                                                    .visit
                                            )}
                                        </strong>
                                    </div>
                                </div>

                            </div>

                            {/* Security Activity */}
                            <div className="modal-section">

                                <div className="modal-section-heading">
                                    <h3>
                                        Security Activity
                                    </h3>
                                </div>

                                <div className="visit-detail-grid">

                                    <div className="detail-item">
                                        <div>
                                            <span>
                                                Check-In
                                            </span>

                                            <strong>
                                                {selectedVisit
                                                    .visit
                                                    .check_in_at
                                                    ? formatDateTime(
                                                          selectedVisit
                                                              .visit
                                                              .check_in_at
                                                      )
                                                    : 'Not checked in'}
                                            </strong>
                                        </div>
                                    </div>

                                    <div className="detail-item">
                                        <div>
                                            <span>
                                                Checked In By
                                            </span>

                                            <strong>
                                                {getSecurityName(
                                                    selectedVisit
                                                        .visit
                                                        .checked_in_by
                                                )}
                                            </strong>
                                        </div>
                                    </div>

                                    <div className="detail-item">
                                        <div>
                                            <span>
                                                Check-Out
                                            </span>

                                            <strong>
                                                {selectedVisit
                                                    .visit
                                                    .check_out_at
                                                    ? formatDateTime(
                                                          selectedVisit
                                                              .visit
                                                              .check_out_at
                                                      )
                                                    : 'Not checked out'}
                                            </strong>
                                        </div>
                                    </div>

                                    <div className="detail-item">
                                        <div>
                                            <span>
                                                Checked Out By
                                            </span>

                                            <strong>
                                                {getSecurityName(
                                                    selectedVisit
                                                        .visit
                                                        .checked_out_by
                                                )}
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
                                onClick={
                                    closeVisitModal
                                }
                            >
                                Close
                            </button>

                        </div>

                    </div>
                </div>
            )}

        </div>
    )
}