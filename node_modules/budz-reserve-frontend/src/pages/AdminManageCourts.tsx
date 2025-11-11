import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { apiServices, Court, type Reservation } from '@/lib/apiServices'
import api from '@/lib/api'
import AdminSidebar from '@/components/AdminSidebar'
import AdminFooter from '@/components/AdminFooter'

const AdminManageCourts = () => {
  console.log('[AdminManageCourts] Component rendering...')
  
  const [showUserDropdown, setShowUserDropdown] = useState(false)
  const [activeSidebarItem, setActiveSidebarItem] = useState('Manage Courts')
  const [courts, setCourts] = useState<Court[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(8)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newCourt, setNewCourt] = useState({
    Court_Name: '',
    Status: 'Available' as 'Available' | 'Maintenance',
    Price: 250
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showEditPriceModal, setShowEditPriceModal] = useState(false)
  const [editingCourt, setEditingCourt] = useState<Court | null>(null)
  const [editPrice, setEditPrice] = useState(0)
  const [isUpdatingPrice, setIsUpdatingPrice] = useState(false)
  const [upcomingReservationsMap, setUpcomingReservationsMap] = useState<Map<number, number>>(new Map())
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Helper function to format role
  const formatRole = (role?: string) => {
    if (!role) return 'User'
    return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase()
  }
  
  console.log('[AdminManageCourts] State initialized:', { loading, error, courtsCount: courts.length })

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  // Fetch courts from API
  useEffect(() => {
    const fetchCourts = async () => {
      try {
        setLoading(true)
        setError(null)
        console.log('[AdminManageCourts] Fetching courts and reservations...')
        const courtsData = await apiServices.getCourts()
        let reservationsData: Reservation[] = []
        try {
          reservationsData = await apiServices.getReservations()
        } catch (reservationsError) {
          console.warn('[AdminManageCourts] Unable to fetch reservations for maintenance guard:', reservationsError)
          reservationsData = []
        }
        console.log('[AdminManageCourts] Courts data received:', courtsData)
        // Sort courts by ID to ensure proper order and ensure Price is a number
        const sortedCourts = courtsData.map(court => ({
          ...court,
          Price: Number(court.Price) || 0 // Ensure Price is always a number
        })).sort((a, b) => a.Court_Id - b.Court_Id)
        setCourts(sortedCourts)

        const upcomingMap = new Map<number, number>()
        const now = new Date()
        const normalizedNow = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
          now.getHours(),
          now.getMinutes(),
          0,
          0
        )

        const inactiveStatuses = ['cancelled', 'canceled', 'completed', 'complete', 'done', 'finished', 'expired']
        const maintenanceGuardWindowMs = 1000 * 60 * 60 * 24 * 7 // 7 days

        reservationsData
          .filter((reservation: Reservation) => {
            const reservationDateTime = new Date(`${reservation.Reservation_Date}T${reservation.Start_Time}`)
            const status = reservation.Status?.toLowerCase() ?? ''
            const isInactive = inactiveStatuses.includes(status)
            const isWithinGuardWindow = reservationDateTime.getTime() - normalizedNow.getTime() <= maintenanceGuardWindowMs

            return reservationDateTime >= normalizedNow && isWithinGuardWindow && !isInactive
          })
          .forEach((reservation: Reservation) => {
            const currentCount = upcomingMap.get(reservation.Court_ID) ?? 0
            upcomingMap.set(reservation.Court_ID, currentCount + 1)
          })

        setUpcomingReservationsMap(upcomingMap)
        console.log('[AdminManageCourts] Courts set successfully:', sortedCourts.length)
      } catch (error: any) {
        console.error('[AdminManageCourts] Error fetching courts:', error)
        console.error('[AdminManageCourts] Error details:', error.response?.data || error.message)
        setError('Failed to load courts. Please try again.')
        setCourts([])
      } finally {
        setLoading(false)
        console.log('[AdminManageCourts] Loading set to false')
      }
    }

    fetchCourts()
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])


  const hasUpcomingReservation = (courtId: number) =>
    (upcomingReservationsMap.get(courtId) ?? 0) > 0

  const handleStatusChange = async (courtId: number, newStatus: string) => {
    if (
      newStatus === 'Maintenance' &&
      hasUpcomingReservation(courtId)
    ) {
      alert('This court has upcoming reservations and cannot be placed under maintenance.')
      return
    }

    try {
      await api.patch(`/courts/${courtId}`, { Status: newStatus })
      setCourts(courts.map(court => 
        court.Court_Id === courtId ? { ...court, Status: newStatus as any } : court
      ))
    } catch (error: any) {
      console.error('Error updating court status:', error)
      alert('Failed to update court status. Please try again.')
    }
  }

  const handleDeleteCourt = async (courtId: number) => {
    const court = courts.find(c => c.Court_Id === courtId)
    const courtName = court?.Court_Name || 'this court'
    
    if (!confirm(`Are you sure you want to delete ${courtName}?`)) {
      return
    }

    try {
      await api.delete(`/courts/${courtId}`)
      setCourts(courts.filter(court => court.Court_Id !== courtId))
      alert(`${courtName} deleted successfully!`)
    } catch (error: any) {
      console.error('Error deleting court:', error)
      const errorMessage = error.response?.data?.message || error.message || 'Failed to delete court. Please try again.'
      alert(errorMessage)
    }
  }

  const handleEditCourt = (courtId: number) => {
    const court = courts.find(c => c.Court_Id === courtId)
    if (court) {
      setEditingCourt(court)
      setEditPrice(Number(court.Price) || 0)
      setShowEditPriceModal(true)
    }
  }

  const handleCloseEditPriceModal = () => {
    setShowEditPriceModal(false)
    setEditingCourt(null)
    setEditPrice(0)
  }

  const handleUpdatePrice = async () => {
    if (!editingCourt) return

    if (editPrice <= 0) {
      alert('Please enter a valid price greater than 0')
      return
    }

    try {
      setIsUpdatingPrice(true)
      await api.patch(`/courts/${editingCourt.Court_Id}`, { Price: Number(editPrice) })
      
      // Refresh the courts list
      const courtsData = await apiServices.getCourts()
      const sortedCourts = courtsData.map(court => ({
        ...court,
        Price: Number(court.Price) || 0
      })).sort((a, b) => a.Court_Id - b.Court_Id)
      setCourts(sortedCourts)
      
      handleCloseEditPriceModal()
      alert('Price updated successfully!')
    } catch (error: any) {
      console.error('Error updating price:', error)
      alert(error.response?.data?.message || 'Failed to update price. Please try again.')
    } finally {
      setIsUpdatingPrice(false)
    }
  }

  const getNextCourtNumber = (): string => {
    if (courts.length === 0) {
      return 'Court 1'
    }
    
    // Extract numbers from existing court names
    const courtNumbers = courts
      .map(court => {
        const match = court.Court_Name.match(/\d+/)
        return match ? parseInt(match[0], 10) : 0
      })
      .filter(num => num > 0)
    
    if (courtNumbers.length === 0) {
      return 'Court 1'
    }
    
    // Find the highest number and add 1
    const maxNumber = Math.max(...courtNumbers)
    return `Court ${maxNumber + 1}`
  }

  const handleAddCourt = () => {
    const nextCourtNumber = getNextCourtNumber()
    setShowAddModal(true)
    setNewCourt({
      Court_Name: nextCourtNumber,
      Status: 'Available',
      Price: 250
    })
  }

  const handleCloseAddModal = () => {
    setShowAddModal(false)
    setNewCourt({
      Court_Name: '',
      Status: 'Available',
      Price: 250
    })
  }

  const handleSubmitNewCourt = async () => {
    if (!newCourt.Court_Name.trim()) {
      alert('Please enter a court name')
      return
    }

    try {
      setIsSubmitting(true)
      const response = await api.post('/courts', {
        Court_Name: newCourt.Court_Name.trim(),
        Status: newCourt.Status,
        Price: Number(newCourt.Price) || 0
      })

      console.log('[AdminManageCourts] Court created:', response.data)
      
      // Refresh the courts list
      const courtsData = await apiServices.getCourts()
      const sortedCourts = courtsData.map(court => ({
        ...court,
        Price: Number(court.Price) || 0
      })).sort((a, b) => a.Court_Id - b.Court_Id)
      setCourts(sortedCourts)
      
      handleCloseAddModal()
      alert('Court added successfully!')
    } catch (error: any) {
      console.error('[AdminManageCourts] Error creating court:', error)
      alert(error.response?.data?.message || 'Failed to add court. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Pagination logic
  const totalPages = Math.ceil(courts.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentCourts = courts.slice(startIndex, endIndex)

  console.log('[AdminManageCourts] Rendering with:', { loading, error, courtsCount: courts.length, totalPages, currentPage })

  // Always render something - even if there's an error
  return (
    <div className="min-h-screen bg-gray-100 scroll-smooth">
      {/* Custom Scrollbar Styles */}
      <style dangerouslySetInnerHTML={{ __html: `
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        ::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
          transition: background 0.3s ease;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
        ::-webkit-scrollbar-corner {
          background: #f1f5f9;
        }
        /* Firefox scrollbar */
        * {
          scrollbar-width: thin;
          scrollbar-color: #cbd5e1 #f1f5f9;
        }
      ` }} />
      
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40 overflow-visible backdrop-blur-sm bg-white/95">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 overflow-visible">
          <div className="flex justify-between items-center h-14 sm:h-16 relative">
            {/* Logo */}
            <div className="flex items-center">
              <img 
                src="/assets/icons/BBC ICON.png" 
                alt="BBC Logo" 
                className="h-12 w-12 sm:h-16 sm:w-16 lg:h-24 lg:w-24 object-contain hover:scale-105 transition-transform duration-200" 
              />
            </div>

            {/* Right Side - Admin Profile */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  className="flex items-center space-x-2 sm:space-x-3 px-2 sm:px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <img
                    src={user?.profile_picture || '/assets/img/home-page/Ellipse 1.png'}
                    alt="Profile"
                    className="w-6 h-6 sm:w-8 sm:h-8 rounded-full object-cover border-2 border-gray-200"
                  />
                  <div className="text-left hidden sm:block">
                    <div className="text-xs sm:text-sm font-medium text-gray-900">{user?.name || user?.username || 'User'}</div>
                    <div className="text-xs text-gray-500">{formatRole(user?.role)}</div>
                  </div>
                  <svg 
                    className={`w-3 h-3 sm:w-4 sm:h-4 text-gray-400 ${showUserDropdown ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showUserDropdown && (
                  <div className="absolute right-0 mt-2 w-40 sm:w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200"
                       style={{
                         position: 'absolute',
                         top: '100%',
                         right: '0',
                         marginTop: '0.5rem'
                       }}>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center space-x-2 px-3 sm:px-4 py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content with Sidebar */}
      <div className="flex">
        <AdminSidebar activeItem={activeSidebarItem} onItemChange={setActiveSidebarItem} />

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen animate-fadeIn">
          {/* Header Section */}
          <div className="mb-8">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 sm:p-8 animate-slideDown">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-6 lg:space-y-0">
                <div className="flex-1">
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-3">
                    Manage Courts
                  </h1>
                  <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
                    Manage court availability, pricing, and maintenance schedules with advanced controls
                  </p>
                </div>
                <button 
                  onClick={handleAddCourt}
                  className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-600 text-white px-8 py-4 rounded-2xl hover:from-blue-700 hover:via-blue-800 hover:to-indigo-700 transition-all duration-300 flex items-center space-x-3 shadow-xl hover:shadow-2xl transform hover:scale-105 w-full lg:w-auto font-semibold text-lg"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span>Add New Court</span>
                </button>
              </div>
            </div>
          </div>

          {/* Courts Table */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200 w-full animate-fadeInUp">
            <div className="hidden lg:block overflow-x-auto w-full">
              <table className="w-full table-auto">
                <colgroup>
                  <col className="w-[25%]" />
                  <col className="w-[25%]" />
                  <col className="w-[25%]" />
                  <col className="w-[25%]" />
                </colgroup>
                <thead className="bg-gray-600 text-white">
                  <tr>
                    <th className="px-6 py-4 text-center text-sm font-bold uppercase tracking-wider">Court No.</th>
                    <th className="px-6 py-4 text-center text-sm font-bold uppercase tracking-wider">Court Status</th>
                    <th className="px-6 py-4 text-center text-sm font-bold uppercase tracking-wider">Price</th>
                    <th className="px-6 py-4 text-center text-sm font-bold uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center align-middle">
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
                          <span className="text-gray-600">Loading courts...</span>
                        </div>
                      </td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-red-600 align-middle">{error}</td>
                    </tr>
                  ) : currentCourts.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-gray-500 align-middle">No courts available</td>
                    </tr>
                  ) : (
                    currentCourts.map((court, index) => (
                      <tr key={court.Court_Id} className={`hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-300 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                        <td className="px-6 py-4 text-sm font-bold text-gray-900 align-middle text-center">{court.Court_Name}</td>
                        <td className="px-6 py-4 align-middle text-center">
                          <div className="flex justify-center">
                            <select 
                              value={court.Status}
                              onChange={(e) => handleStatusChange(court.Court_Id, e.target.value)}
                              className={`w-full max-w-[200px] px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center ${
                                court.Status === 'Available' ? 'bg-green-100 text-green-800 border-green-300 hover:bg-green-200' :
                                'bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-200'
                              }`}
                          title={hasUpcomingReservation(court.Court_Id) ? 'This court has upcoming reservations.' : undefined}
                            >
                              <option value="Available">Available</option>
                          <option
                            value="Maintenance"
                            disabled={hasUpcomingReservation(court.Court_Id) && court.Status !== 'Maintenance'}
                          >
                            Maintenance {hasUpcomingReservation(court.Court_Id) ? '(locked)' : ''}
                          </option>
                            </select>
                          </div>
                      {hasUpcomingReservation(court.Court_Id) && (
                        <p className="mt-2 text-xs font-medium text-red-600">
                          Upcoming reservations prevent maintenance mode.
                        </p>
                      )}
                        </td>
                        <td className="px-6 py-4 text-center align-middle">
                          <div className="flex items-center justify-center gap-3">
                            <span className="font-bold text-lg text-gray-800 bg-gray-100 px-4 py-2 rounded-xl whitespace-nowrap">₱{Number(court.Price || 0).toFixed(2)}</span>
                            <button
                              onClick={() => handleEditCourt(court.Court_Id)}
                              className="w-8 h-8 bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl flex items-center justify-center hover:from-blue-100 hover:to-blue-200 hover:border-blue-300 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-110 group flex-shrink-0"
                              title="Edit Court Price"
                            >
                              <svg className="w-5 h-5 text-blue-600 group-hover:text-blue-700 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center align-middle">
                          <button
                            onClick={() => handleDeleteCourt(court.Court_Id)}
                            className="bg-gradient-to-r from-red-500 via-red-600 to-red-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:from-red-600 hover:via-red-700 hover:to-red-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                          >
                            <span className="flex items-center justify-center gap-2">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              <span>Delete</span>
                            </span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="lg:hidden space-y-4 px-4 py-6 bg-gray-50">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
                  <span className="text-gray-600">Loading courts...</span>
                </div>
              ) : error ? (
                <div className="text-center py-12">
                  <p className="text-red-600">{error}</p>
                  <button
                    onClick={() => window.location.reload()}
                    className="mt-4 inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition"
                  >
                    Retry
                  </button>
                </div>
              ) : currentCourts.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-lg">No courts available</p>
                </div>
              ) : (
                currentCourts.map((court) => (
                  <div
                    key={court.Court_Id}
                    className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-all duration-200 hover:shadow-lg"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                      <div>
                        <span className="text-xs font-semibold uppercase tracking-widest text-blue-500">
                          Court
                        </span>
                        <h3 className="text-xl font-bold text-gray-900">{court.Court_Name}</h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                            court.Status === 'Available'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}
                        >
                          {court.Status}
                        </span>
                        {hasUpcomingReservation(court.Court_Id) && (
                          <span className="inline-flex items-center text-xs font-medium text-red-500">
                            Upcoming reservations
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">Court Status</label>
                        <select
                          value={court.Status}
                          onChange={(e) => handleStatusChange(court.Court_Id, e.target.value)}
                          className={`w-full px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            court.Status === 'Available'
                              ? 'bg-green-100 text-green-800 border-green-300'
                              : 'bg-yellow-100 text-yellow-800 border-yellow-300'
                          }`}
                          title={hasUpcomingReservation(court.Court_Id) ? 'This court has upcoming reservations.' : undefined}
                        >
                          <option value="Available">Available</option>
                          <option
                            value="Maintenance"
                            disabled={hasUpcomingReservation(court.Court_Id) && court.Status !== 'Maintenance'}
                          >
                            Maintenance {hasUpcomingReservation(court.Court_Id) ? '(locked)' : ''}
                          </option>
                        </select>
                      </div>

                      <div className="space-y-3">
                        <label className="text-sm font-semibold text-gray-700">Price</label>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <span className="font-bold text-lg text-gray-800 bg-gray-100 px-4 py-2 rounded-xl whitespace-nowrap text-center">
                            ₱{Number(court.Price || 0).toFixed(2)}
                          </span>
                          <button
                            onClick={() => handleEditCourt(court.Court_Id)}
                            className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-600 transition hover:border-blue-300 hover:bg-blue-100"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Edit Price
                          </button>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteCourt(court.Court_Id)}
                        className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-500 via-red-600 to-red-700 px-4 py-2 text-sm font-bold text-white shadow-lg transition hover:from-red-600 hover:via-red-700 hover:to-red-800"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete Court
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Enhanced Pagination */}
            {!loading && courts.length > 0 && (
              <div className="flex flex-col sm:flex-row justify-between items-center px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-t border-gray-200">
                <div className="text-sm text-gray-600 mb-2 sm:mb-0">
                  {currentPage === 1 
                    ? `Showing 1 to ${Math.min(itemsPerPage, courts.length)} of ${courts.length} courts`
                    : `Showing ${startIndex + 1} to ${Math.min(endIndex, courts.length)} of ${courts.length} courts`
                  }
                </div>
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg bg-white text-gray-500 hover:text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <span className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg text-sm font-medium shadow-md">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button 
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg bg-white text-gray-500 hover:text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Edit Price Modal */}
      {showEditPriceModal && editingCourt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 sm:p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Edit Court Price</h2>
              <button
                onClick={handleCloseEditPriceModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                disabled={isUpdatingPrice}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Court Name
                </label>
                <input
                  type="text"
                  value={editingCourt.Court_Name}
                  disabled
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl bg-gray-100 text-gray-600 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Current Price
                </label>
                <div className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl bg-gray-100 text-gray-600 font-bold text-lg">
                  ₱{Number(editingCourt.Price || 0).toFixed(2)}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  New Price (₱) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={editPrice}
                  onChange={(e) => setEditPrice(Number(e.target.value) || 0)}
                  placeholder="Enter new price"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                  disabled={isUpdatingPrice}
                  autoFocus
                />
              </div>
            </div>

            <div className="flex justify-end space-x-4 mt-6">
              <button
                onClick={handleCloseEditPriceModal}
                disabled={isUpdatingPrice}
                className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdatePrice}
                disabled={isUpdatingPrice || editPrice <= 0}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isUpdatingPrice ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Updating...</span>
                  </>
                ) : (
                  <span>Update Price</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Court Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 sm:p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Add New Court</h2>
              <button
                onClick={handleCloseAddModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                disabled={isSubmitting}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Court Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newCourt.Court_Name}
                  onChange={(e) => setNewCourt({ ...newCourt, Court_Name: e.target.value })}
                  placeholder="e.g., Court 13"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={newCourt.Status}
                  onChange={(e) => setNewCourt({ ...newCourt, Status: e.target.value as any })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                  disabled={isSubmitting}
                >
                  <option value="Available">Available</option>
                  <option value="Maintenance">Maintenance</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Price (₱)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={newCourt.Price}
                  onChange={(e) => setNewCourt({ ...newCourt, Price: Number(e.target.value) || 0 })}
                  placeholder="250"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-4 mt-6">
              <button
                onClick={handleCloseAddModal}
                disabled={isSubmitting}
                className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitNewCourt}
                disabled={isSubmitting || !newCourt.Court_Name.trim()}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Adding...</span>
                  </>
                ) : (
                  <span>Add Court</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      <AdminFooter />
    </div>
  )
}

export default AdminManageCourts