import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { createPortal } from 'react-dom'
import {
  User,
  CalendarDays,
  Check,
  Info,
  Camera,
  ArrowLeft,
  Plus,
  UserCheck,
} from 'lucide-react'
import '../../styles/new-visit.css'

export default function NewVisit() {
  // Read visitor_id from the URL when starting a new visit from the Visitors page.
  const [searchParams] = useSearchParams()

  // Current step of the four-step visit creation process.
  const [currentStep, setCurrentStep] = useState(1)

  // Visitor details entered by the Staff member.
  const [visitor, setVisitor] = useState({
    full_name: '',
    phone: '',
    email: '',
    company_name: '',
    photo: null,
  })

  // Existing visitor selected from the database.
  // If id is null, this represents a new visitor that has not been saved yet.
  const [selectedVisitor, setSelectedVisitor] = useState(null)

  // Existing visitor found when checking the entered name or phone.
  const [duplicateVisitor, setDuplicateVisitor] = useState(null)

  // Departments are now loaded from Laravel instead of mock data.
  const [departments, setDepartments] = useState([])

  // Visit details entered by the Staff member.
  const [visitData, setVisitData] = useState({
    department_id: '',
    host_name: '',
    purpose: '',
    visit_date: '',
    visit_time: '',
  })

  // Validation errors for the form.
  const [errors, setErrors] = useState({})

  // Local preview of the selected visitor photo.
  const [photoPreview, setPhotoPreview] = useState(null)

  // Prevents duplicate submissions while the request is being processed.
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Load active departments from Laravel.
  useEffect(() => {
    const loadDepartments = async () => {
      try {
        const response = await fetch(
          'http://localhost:8000/api/staff/departments',
          {
            credentials: 'include',
            headers: {
              Accept: 'application/json',
            },
          },
        )

        if (!response.ok) {
          throw new Error('Failed to load departments.')
        }

        const result = await response.json()

        setDepartments(result.data || [])
      } catch (error) {
        console.error('Failed to load departments:', error)
      }
    }

    loadDepartments()
  }, [])

  // Load an existing visitor when visitor_id is present in the URL.
  useEffect(() => {
    const visitorId = searchParams.get('visitor_id')

    // If there is no visitor_id, this is a normal new visit.
    if (!visitorId) {
      return
    }

    const loadVisitor = async () => {
      try {
        const response = await fetch(
          `http://localhost:8000/api/staff/visitors/${visitorId}`,
          {
            credentials: 'include',
            headers: {
              Accept: 'application/json',
            },
          },
        )

        if (!response.ok) {
          throw new Error('Failed to load visitor.')
        }

        const result = await response.json()

        if (!result.data) {
          throw new Error('Visitor was not found.')
        }

        // Select the visitor returned by Laravel.
        setSelectedVisitor(result.data)

        // Make sure the page starts at Step 1.
        setCurrentStep(1)
      } catch (error) {
        console.error('Failed to load visitor:', error)

        setErrors({
          submit: 'Unable to load the selected visitor.',
        })
      }
    }

    loadVisitor()
  }, [searchParams])

  // Set the minimum visit date to today.
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]

    const dateInput = document.getElementById('visitDate')

    if (dateInput) {
      dateInput.min = today
    }
  }, [])

  // Handle visitor input changes.
  const handleVisitorChange = (e) => {
    const { name, value } = e.target

    setVisitor((prev) => ({
      ...prev,
      [name]: value,
    }))

    setErrors((prev) => ({
      ...prev,
      [name]: '',
    }))

    // Clear the previous duplicate result when name or phone changes.
    if (name === 'phone' || name === 'full_name') {
      setDuplicateVisitor(null)
    }
  }

  // Handle visit input changes.
  const handleVisitChange = (e) => {
    const { name, value } = e.target

    setVisitData((prev) => ({
      ...prev,
      [name]: value,
    }))

    setErrors((prev) => ({
      ...prev,
      [name]: '',
    }))
  }

  // Handle visitor photo selection.
  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0]

    if (!file) {
      return
    }

    // Keep the existing 5MB photo rule.
    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({
        ...prev,
        photo: 'Photo must not be larger than 5MB.',
      }))

      e.target.value = ''
      return
    }

    // Only allow image files.
    if (!file.type.startsWith('image/')) {
      setErrors((prev) => ({
        ...prev,
        photo: 'Please select a valid image.',
      }))

      e.target.value = ''
      return
    }

    setVisitor((prev) => ({
      ...prev,
      photo: file,
    }))

    setErrors((prev) => ({
      ...prev,
      photo: '',
    }))

    setPhotoPreview(URL.createObjectURL(file))
  }

  // Check whether a visitor already exists.
  const checkDuplicateVisitor = async (field, value) => {
    const searchValue = value.trim()

    if (!searchValue) {
      return
    }

    // Do not search the API for very short values.
    if (field === 'full_name' && searchValue.length < 2) {
      return
    }

    if (field === 'phone' && searchValue.length < 7) {
      return
    }

    try {
      const response = await fetch(
        `http://localhost:8000/api/staff/visitors?search=${encodeURIComponent(searchValue)}`,
        {
          credentials: 'include',
          headers: {
            Accept: 'application/json',
          },
        },
      )

      if (!response.ok) {
        throw new Error('Failed to check visitor.')
      }

      const result = await response.json()

      // Laravel pagination returns visitors inside result.data.
      const visitors = result.data || []

      let match = null

      // Check for an exact full name match.
      if (field === 'full_name') {
        match =
          visitors.find(
            (item) =>
              item.full_name?.trim().toLowerCase() ===
              searchValue.toLowerCase(),
          ) || null
      }

      // Check for an exact phone match.
      if (field === 'phone') {
        match =
          visitors.find(
            (item) => item.phone?.trim() === searchValue,
          ) || null
      }

      // Show the duplicate visitor modal when a match is found.
      if (match) {
        setDuplicateVisitor(match)
      }
    } catch (error) {
      console.error('Failed to check existing visitor:', error)
    }
  }

  // Check the visitor when an input loses focus.
  const handleVisitorBlur = (field) => {
    checkDuplicateVisitor(field, visitor[field])
  }

  // Select an existing visitor from the duplicate modal.
  const useExistingVisitor = () => {
    if (!duplicateVisitor) {
      return
    }

    setSelectedVisitor(duplicateVisitor)

    setDuplicateVisitor(null)

    setVisitor({
      full_name: '',
      phone: '',
      email: '',
      company_name: '',
      photo: null,
    })

    setPhotoPreview(null)

    setErrors({})
  }

  // Continue from visitor information to visit details.
  const continueToDetails = async () => {
    setErrors({})

    // A new visitor must provide a name.
    if (!selectedVisitor && !visitor.full_name.trim()) {
      setErrors({
        full_name: 'Full name is required.',
      })

      return
    }

    // A new visitor must provide a phone number.
    if (!selectedVisitor && !visitor.phone.trim()) {
      setErrors({
        phone: 'Phone number is required.',
      })

      return
    }

    // Check the phone one more time before continuing.
    if (!selectedVisitor) {
      try {
        const response = await fetch(
          `http://localhost:8000/api/staff/visitors?search=${encodeURIComponent(
            visitor.phone.trim(),
          )}`,
          {
            credentials: 'include',
            headers: {
              Accept: 'application/json',
            },
          },
        )

        if (!response.ok) {
          throw new Error('Failed to verify visitor phone.')
        }

        const result = await response.json()

        const existingVisitor = (result.data || []).find(
          (item) => item.phone?.trim() === visitor.phone.trim(),
        )

        // If the visitor now exists, show the existing visitor modal.
        if (existingVisitor) {
          setDuplicateVisitor(existingVisitor)
          return
        }
      } catch (error) {
        console.error('Failed to verify visitor phone:', error)
      }
    }

    // For a new visitor, keep the visitor temporarily in React state.
    // The visitor is only saved when the visit request is submitted.
    if (!selectedVisitor) {
      setSelectedVisitor({
        id: null,
        visitor_code: 'NEW',
        full_name: visitor.full_name,
        phone: visitor.phone,
        email: visitor.email,
        company_name: visitor.company_name,
        photo: visitor.photo,
        status: 'Inactive',
      })
    }

    // Move to Step 2.
    setCurrentStep(2)

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  // Go back to visitor information.
  const backToVisitor = () => {
    setCurrentStep(1)

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  // Validate visit details before showing the review page.
  const reviewRequest = () => {
    const newErrors = {}

    if (!visitData.department_id) {
      newErrors.department_id = 'Please select a department.'
    }

    if (!visitData.host_name.trim()) {
      newErrors.host_name = 'Please enter the person being visited.'
    }

    if (!visitData.purpose.trim()) {
      newErrors.purpose = 'Please describe the purpose of the visit.'
    }

    if (!visitData.visit_date) {
      newErrors.visit_date = 'Please select a visit date.'
    }

    if (!visitData.visit_time) {
      newErrors.visit_time = 'Please select a visit time.'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setErrors({})
    setCurrentStep(3)

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  // Go back from the review page to visit details.
  const backToDetails = () => {
    setCurrentStep(2)

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  // Get the Laravel Sanctum XSRF token.
  const getXsrfToken = () => {
    const cookie = document.cookie
      .split('; ')
      .find((row) => row.startsWith('XSRF-TOKEN='))

    if (!cookie) {
      return ''
    }

    return decodeURIComponent(cookie.split('=')[1])
  }

  // Submit the visit request.
  const submitRequest = async (e) => {
    e.preventDefault()

    setIsSubmitting(true)
    setErrors({})

    try {
      const formData = new FormData()

      // Existing visitor: send only the visitor ID.
      if (selectedVisitor?.id) {
        formData.append('visitor_id', selectedVisitor.id)
      } else {
        // New visitor: send visitor details so Laravel can create the visitor.
        formData.append(
          'full_name',
          selectedVisitor?.full_name || visitor.full_name,
        )

        formData.append(
          'phone',
          selectedVisitor?.phone || visitor.phone,
        )

        if (selectedVisitor?.email || visitor.email) {
          formData.append(
            'email',
            selectedVisitor?.email || visitor.email,
          )
        }

        if (selectedVisitor?.company_name || visitor.company_name) {
          formData.append(
            'company_name',
            selectedVisitor?.company_name || visitor.company_name,
          )
        }

        if (visitor.photo) {
          formData.append('photo', visitor.photo)
        }
      }

      // Add visit information.
      formData.append('department_id', visitData.department_id)
      formData.append('host_name', visitData.host_name)
      formData.append('purpose', visitData.purpose)
      formData.append('visit_date', visitData.visit_date)
      formData.append('visit_time', visitData.visit_time)

      const response = await fetch(
        'http://localhost:8000/api/staff/visits',
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            Accept: 'application/json',
            'X-XSRF-TOKEN': getXsrfToken(),
          },
          body: formData,
        },
      )

      const result = await response.json().catch(() => null)

      // Handle Laravel validation errors.
      if (response.status === 422) {
        setErrors(result?.errors || {})
        setIsSubmitting(false)
        return
      }

      if (!response.ok) {
        throw new Error(
          result?.message || 'Failed to create visit request.',
        )
      }

      // Show the existing success screen.
      setIsSubmitting(false)
      setCurrentStep(4)

      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      })
    } catch (error) {
      console.error('Failed to create visit request:', error)

      setIsSubmitting(false)

      setErrors({
        submit:
          error.message ||
          'Unable to create the visit request. Please try again.',
      })
    }
  }

  // Reset the form for another visit.
  const resetForm = () => {
    setCurrentStep(1)

    setVisitor({
      full_name: '',
      phone: '',
      email: '',
      company_name: '',
      photo: null,
    })

    setSelectedVisitor(null)
    setDuplicateVisitor(null)

    setVisitData({
      department_id: '',
      host_name: '',
      purpose: '',
      visit_date: '',
      visit_time: '',
    })

    setErrors({})
    setPhotoPreview(null)

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  // Get the selected department.
  const selectedDepartment = departments.find(
    (department) =>
      String(department.id) === String(visitData.department_id),
  )

  // Format the visit date for the review and success screens.
  const formatDate = (date) => {
    if (!date) {
      return ''
    }

    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  // Format the visit time for the review and success screens.
  const formatTime = (time) => {
    if (!time) {
      return ''
    }

    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours, 10)
    const suffix = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12

    return `${displayHour}:${minutes} ${suffix}`
  }

  return (
    <div className="new-visit-page">
      <div className="new-visit-container">

        {/* Page Header */}
        <div className="page-header">
          <div className="breadcrumb">
            <span>Staff</span>
            <span className="breadcrumb-divider">/</span>
            <span>New Visit</span>
          </div>

          <h1 className="page-title">Create New Visit</h1>

          <p className="page-subtitle">
            Create a visitor request and schedule their visit.
          </p>
        </div>

        {/* STEP 1 — VISITOR INFORMATION */}
        {currentStep === 1 && (
          <section className="section-step active">
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">
                  <User size={18} />
                  Visitor Information
                </h2>

                <p className="card-subtitle">
                  Register the visitor before creating the visit request.
                </p>
              </div>

              {selectedVisitor ? (
                <div className="selected-visitor-summary">
                  <div className="selected-visitor-content">
                    <div className="selected-visitor-info">
                      <div className="selected-visitor-name">
                        {selectedVisitor.full_name}
                      </div>

                      <div className="selected-visitor-meta">
                        {selectedVisitor.visitor_code}
                      </div>

                      <div className="selected-visitor-details">
                        <div className="selected-visitor-detail">
                          <div className="selected-visitor-detail-label">
                            Phone
                          </div>

                          <div className="selected-visitor-detail-value">
                            {selectedVisitor.phone}
                          </div>
                        </div>

                        <div className="selected-visitor-detail">
                          <div className="selected-visitor-detail-label">
                            Email
                          </div>

                          <div className="selected-visitor-detail-value">
                            {selectedVisitor.email || '—'}
                          </div>
                        </div>

                        <div className="selected-visitor-detail">
                          <div className="selected-visitor-detail-label">
                            Company
                          </div>

                          <div className="selected-visitor-detail-value">
                            {selectedVisitor.company_name || '—'}
                          </div>
                        </div>

                        <div className="selected-visitor-detail">
                          <div className="selected-visitor-detail-label">
                            Status
                          </div>

                          <div className="selected-visitor-detail-value">
                            {selectedVisitor.status}
                          </div>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="change-visitor-btn"
                      onClick={() => setSelectedVisitor(null)}
                    >
                      Change Visitor
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Full Name + Phone */}
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label required">
                        Full Name
                      </label>

                      <input
                        type="text"
                        name="full_name"
                        className="form-input"
                        placeholder="Enter visitor's full name"
                        value={visitor.full_name}
                        onChange={handleVisitorChange}
                        onBlur={() => handleVisitorBlur('full_name')}
                      />

                      {errors.full_name && (
                        <div className="form-error">
                          {errors.full_name}
                        </div>
                      )}
                    </div>

                    <div className="form-group">
                      <label className="form-label required">
                        Phone Number
                      </label>

                      <input
                        type="tel"
                        name="phone"
                        className="form-input"
                        placeholder="Enter phone number"
                        value={visitor.phone}
                        onChange={handleVisitorChange}
                        onBlur={() => handleVisitorBlur('phone')}
                      />

                      {errors.phone && (
                        <div className="form-error">
                          {errors.phone}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Email + Company */}
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">
                        Email
                      </label>

                      <input
                        type="email"
                        name="email"
                        className="form-input"
                        placeholder="Enter email address"
                        value={visitor.email}
                        onChange={handleVisitorChange}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">
                        Company Name
                      </label>

                      <input
                        type="text"
                        name="company_name"
                        className="form-input"
                        placeholder="Enter company or organization"
                        value={visitor.company_name}
                        onChange={handleVisitorChange}
                      />
                    </div>
                  </div>

                  {/* Photo */}
                  <div className="form-group">
                    <label className="form-label">
                      Photo
                    </label>

                    <label
                      htmlFor="visitorPhoto"
                      className="photo-upload-area"
                    >
                      {photoPreview ? (
                        <img
                          src={photoPreview}
                          alt="Visitor preview"
                          className="photo-preview"
                        />
                      ) : (
                        <>
                          <Camera
                            size={32}
                            strokeWidth={1.5}
                          />

                          <p className="photo-upload-title">
                            Upload visitor photo
                          </p>

                          <p className="photo-upload-text">
                            PNG, JPG up to 5MB
                          </p>
                        </>
                      )}
                    </label>

                    <input
                      id="visitorPhoto"
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={handlePhotoChange}
                    />

                    {errors.photo && (
                      <div className="form-error">
                        {errors.photo}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="button-group">
              <button
                type="button"
                className="btn secondary"
                onClick={resetForm}
              >
                Cancel
              </button>

              <button
                type="button"
                className="btn primary"
                onClick={continueToDetails}
              >
                Continue to Visit Details
              </button>
            </div>
          </section>
        )}

        {/* STEP 2 — VISIT DETAILS */}
        {currentStep === 2 && (
          <section className="section-step active">
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">
                  <CalendarDays size={18} />
                  Visit Details
                </h2>

                <p className="card-subtitle">
                  Provide the details for this visit request.
                </p>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label required">
                    Department
                  </label>

                  <select
                    name="department_id"
                    className="form-select"
                    value={visitData.department_id}
                    onChange={handleVisitChange}
                  >
                    <option value="">
                      Select department
                    </option>

                    {departments.map((department) => (
                      <option
                        key={department.id}
                        value={department.id}
                      >
                        {department.name}
                      </option>
                    ))}
                  </select>

                  {errors.department_id && (
                    <div className="form-error">
                      {errors.department_id}
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label required">
                    Person Being Visited
                  </label>

                  <input
                    type="text"
                    name="host_name"
                    className="form-input"
                    placeholder="Enter the name of the person the visitor is coming to see"
                    value={visitData.host_name}
                    onChange={handleVisitChange}
                  />

                  {errors.host_name && (
                    <div className="form-error">
                      {errors.host_name}
                    </div>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label required">
                  Purpose of Visit
                </label>

                <textarea
                  name="purpose"
                  className="form-textarea"
                  placeholder="Briefly describe the reason for the visit"
                  value={visitData.purpose}
                  onChange={handleVisitChange}
                />

                {errors.purpose && (
                  <div className="form-error">
                    {errors.purpose}
                  </div>
                )}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label required">
                    Visit Date
                  </label>

                  <input
                    id="visitDate"
                    type="date"
                    name="visit_date"
                    className="form-input"
                    value={visitData.visit_date}
                    onChange={handleVisitChange}
                  />

                  {errors.visit_date && (
                    <div className="form-error">
                      {errors.visit_date}
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label required">
                    Visit Time
                  </label>

                  <input
                    type="time"
                    name="visit_time"
                    className="form-input"
                    value={visitData.visit_time}
                    onChange={handleVisitChange}
                  />

                  {errors.visit_time && (
                    <div className="form-error">
                      {errors.visit_time}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="button-group">
              <button
                type="button"
                className="btn secondary"
                onClick={backToVisitor}
              >
                <ArrowLeft size={16} />
                Back
              </button>

              <button
                type="button"
                className="btn primary"
                onClick={reviewRequest}
              >
                Review Request
              </button>
            </div>
          </section>
        )}

        {/* STEP 3 — SUMMARY */}
        {currentStep === 3 && (
          <section className="section-step active">
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">
                  <Check size={18} />
                  Visit Summary
                </h2>

                <p className="card-subtitle">
                  Review the visit request details before submission.
                </p>
              </div>

              <div className="summary-grid">
                <div className="summary-item">
                  <div className="summary-item-label">
                    Visitor
                  </div>

                  <div className="summary-item-value">
                    {selectedVisitor?.full_name}
                  </div>
                </div>

                <div className="summary-item">
                  <div className="summary-item-label">
                    Department
                  </div>

                  <div className="summary-item-value">
                    {selectedDepartment?.name}
                  </div>
                </div>

                <div className="summary-item">
                  <div className="summary-item-label">
                    Person Being Visited
                  </div>

                  <div className="summary-item-value">
                    {visitData.host_name}
                  </div>
                </div>

                <div className="summary-item">
                  <div className="summary-item-label">
                    Visit Date
                  </div>

                  <div className="summary-item-value">
                    {formatDate(visitData.visit_date)}
                  </div>
                </div>

                <div className="summary-item">
                  <div className="summary-item-label">
                    Visit Time
                  </div>

                  <div className="summary-item-value">
                    {formatTime(visitData.visit_time)}
                  </div>
                </div>

                <div className="summary-item">
                  <div className="summary-item-label">
                    Status
                  </div>

                  <div className="summary-item-value">
                    <span className="pending-badge">
                      Pending
                    </span>
                  </div>
                </div>
              </div>

              <div className="summary-purpose">
                <div className="summary-purpose-title">
                  Purpose
                </div>

                <div className="summary-purpose-content">
                  {visitData.purpose}
                </div>
              </div>

              <div className="summary-note">
                <Info size={18} />

                <span>
                  This request will be submitted for processing.
                  Security can verify the request when the visitor
                  arrives.
                </span>
              </div>
            </div>

            <div className="button-group">
              <button
                type="button"
                className="btn secondary"
                onClick={backToDetails}
              >
                <ArrowLeft size={16} />
                Back
              </button>

              <button
                type="button"
                className="btn primary"
                onClick={submitRequest}
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? 'Creating Visit Request...'
                  : 'Create Visit Request'}
              </button>
            </div>

            {errors.submit && (
              <div className="form-error">
                {errors.submit}
              </div>
            )}
          </section>
        )}

        {/* STEP 4 — SUCCESS */}
        {currentStep === 4 && (
          <section className="section-step active">
            <div className="card">
              <div className="success-container">
                <div className="success-icon">
                  <Check size={28} />
                </div>

                <h2 className="success-title">
                  Visit Request Created
                </h2>

                <p className="success-text">
                  The visit request has been successfully created.
                </p>

                <div className="success-details">
                  <div className="success-detail-item">
                    <span className="success-detail-label">
                      Visitor
                    </span>

                    <span className="success-detail-value">
                      {selectedVisitor?.full_name}
                    </span>
                  </div>

                  <div className="success-detail-item">
                    <span className="success-detail-label">
                      Visit Date
                    </span>

                    <span className="success-detail-value">
                      {formatDate(visitData.visit_date)}
                    </span>
                  </div>

                  <div className="success-detail-item">
                    <span className="success-detail-label">
                      Visit Time
                    </span>

                    <span className="success-detail-value">
                      {formatTime(visitData.visit_time)}
                    </span>
                  </div>

                  <div className="success-detail-item">
                    <span className="success-detail-label">
                      Status
                    </span>

                    <span className="success-detail-value">
                      Pending
                    </span>
                  </div>
                </div>

                <div className="success-actions">
                  <button
                    type="button"
                    className="btn primary"
                    onClick={resetForm}
                  >
                    <Plus size={16} />
                    Create Another Visit
                  </button>

                  <button
                    type="button"
                    className="btn secondary"
                  >
                    View Visit
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* DUPLICATE VISITOR MODAL */}
        {duplicateVisitor &&
          createPortal(
            <div className="duplicate-modal-overlay">
              <div className="duplicate-modal">

                <div className="duplicate-modal-header">
                  <div className="duplicate-modal-icon">
                    <UserCheck size={22} />
                  </div>

                  <h2 className="duplicate-modal-title">
                    Visitor Already Exists
                  </h2>
                </div>

                <div className="duplicate-modal-content">
                  <p className="duplicate-modal-text">
                    This visitor is already registered in the system.
                  </p>

                  <div className="duplicate-modal-visitor-card">

                    <div className="duplicate-modal-visitor-item">
                      <span className="duplicate-modal-visitor-item-label">
                        Name
                      </span>

                      <span className="duplicate-modal-visitor-item-value">
                        {duplicateVisitor.full_name}
                      </span>
                    </div>

                    <div className="duplicate-modal-visitor-item">
                      <span className="duplicate-modal-visitor-item-label">
                        Visitor Code
                      </span>

                      <span className="duplicate-modal-visitor-item-value">
                        {duplicateVisitor.visitor_code}
                      </span>
                    </div>

                    <div className="duplicate-modal-visitor-item">
                      <span className="duplicate-modal-visitor-item-label">
                        Phone
                      </span>

                      <span className="duplicate-modal-visitor-item-value">
                        {duplicateVisitor.phone}
                      </span>
                    </div>

                    <div className="duplicate-modal-visitor-item">
                      <span className="duplicate-modal-visitor-item-label">
                        Email
                      </span>

                      <span className="duplicate-modal-visitor-item-value">
                        {duplicateVisitor.email || '—'}
                      </span>
                    </div>

                    <div className="duplicate-modal-visitor-item">
                      <span className="duplicate-modal-visitor-item-label">
                        Company
                      </span>

                      <span className="duplicate-modal-visitor-item-value">
                        {duplicateVisitor.company_name || '—'}
                      </span>
                    </div>

                  </div>
                </div>

                <div className="duplicate-modal-actions">

                  <button
                    type="button"
                    className="btn secondary"
                    onClick={() => setDuplicateVisitor(null)}
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    className="btn primary"
                    onClick={useExistingVisitor}
                  >
                    Use Existing Visitor
                  </button>

                </div>
              </div>
            </div>,
            document.body,
          )}
      </div>
    </div>
  )
}