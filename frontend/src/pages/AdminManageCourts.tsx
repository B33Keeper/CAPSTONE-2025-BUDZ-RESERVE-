import { useState, useEffect } from 'react'
import { apiServices, Court, type Reservation } from '@/lib/apiServices'
import api from '@/lib/api'
import AdminSidebar from '@/components/AdminSidebar'
import AdminFooter from '@/components/AdminFooter'
import { AdminHeader } from '@/components/AdminHeader'
import toast from 'react-hot-toast'

const AdminManageCourts = () => {
  console.log('[AdminManageCourts] Component rendering...')
  
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
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{
    open: boolean
    courtId: number | null
    courtName: string
  }>({
    open: false,
    courtId: null,
    courtName: ''
  })
  const [isDeleting, setIsDeleting] = useState(false)
  
  console.log('[AdminManageCourts] State initialized:', { loading, error, courtsCount: courts.length })

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



  const hasUpcomingReservation = (courtId: number) =>
    (upcomingReservationsMap.get(courtId) ?? 0) > 0

  const handleStatusChange = async (courtId: number, newStatus: string) => {
    if (
      newStatus === 'Maintenance' &&
      hasUpcomingReservation(courtId)
    ) {
      toast.error('This court has upcoming reservations and cannot be placed under maintenance.')
      return
    }

    try {
      await api.patch(`/courts/${courtId}`, { Status: newStatus })
      setCourts(courts.map(court => 
        court.Court_Id === courtId ? { ...court, Status: newStatus as any } : court
      ))
      toast.success(`Court status updated to ${newStatus}`)
    } catch (error: any) {
      console.error('Error updating court status:', error)
      toast.error('Failed to update court status. Please try again.')
    }
  }

  const handleDeleteCourt = (courtId: number) => {
    const court = courts.find(c => c.Court_Id === courtId)
    const courtName = court?.Court_Name || 'this court'
    setDeleteConfirmModal({
      open: true,
      courtId,
      courtName
    })
  }

  const handleConfirmDelete = async () => {
    if (!deleteConfirmModal.courtId) return

    try {
      setIsDeleting(true)
      await api.delete(`/courts/${deleteConfirmModal.courtId}`)
      setCourts(courts.filter(court => court.Court_Id !== deleteConfirmModal.courtId))
      toast.success(`${deleteConfirmModal.courtName} deleted successfully!`)
      setDeleteConfirmModal({ open: false, courtId: null, courtName: '' })
    } catch (error: any) {
      console.error('Error deleting court:', error)
      const errorMessage = error.response?.data?.message || error.message || 'Failed to delete court. Please try again.'
      toast.error(errorMessage)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleCancelDelete = () => {
    setDeleteConfirmModal({ open: false, courtId: null, courtName: '' })
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
      toast.error('Please enter a valid price greater than 0')
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
      toast.success('Price updated successfully!')
    } catch (error: any) {
      console.error('Error updating price:', error)
      toast.error(error.response?.data?.message || 'Failed to update price. Please try again.')
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
      toast.error('Please enter a court name')
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
      toast.success('Court added successfully!')
    } catch (error: any) {
      console.error('[AdminManageCourts] Error creating court:', error)
      toast.error(error.response?.data?.message || 'Failed to add court. Please try again.')
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
      <AdminHeader />

      {/* Main Content with Sidebar */}
      <div className="pt-14 sm:pt-16">
        <AdminSidebar 
          activeItem={activeSidebarItem} 
          onItemChange={setActiveSidebarItem}
        />

        {/* Main Content */}
        <main className="p-3 sm:p-4 md:p-6 lg:p-8 overflow-x-hidden bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen animate-fadeIn transition-all duration-300 md:ml-64">
          {/* Enhanced Header Section */}
          <div className="mb-4 sm:mb-6 lg:mb-8">
            <div className="bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/30 rounded-2xl sm:rounded-3xl shadow-2xl border border-gray-200/60 p-4 sm:p-6 lg:p-8 xl:p-10 animate-slideDown backdrop-blur-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 sm:space-x-3 mb-3 sm:mb-4">
                    <div className="p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg flex-shrink-0">
                      <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-900 bg-clip-text text-transparent mb-1 sm:mb-2 break-words">
                        Manage Courts
                      </h1>
                      <p className="text-sm sm:text-base lg:text-lg text-gray-600 leading-relaxed">
                        Manage court availability, pricing, and maintenance schedules with advanced controls
                      </p>
                    </div>
                  </div>
                </div>
                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 flex-shrink-0">
                  <button
                    onClick={handleAddCourt}
                    className="flex items-center justify-center space-x-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-2 border-blue-500/60 hover:border-blue-400 transition-all duration-300 hover:shadow-lg hover:scale-105 active:scale-95 font-semibold text-sm sm:text-base w-full sm:w-auto"
                    title="Add New Court"
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <span className="hidden sm:inline">Add Court</span>
                    <span className="sm:hidden">Add</span>
                  </button>
                </div>
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
                <thead className="bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700 text-white">
                  <tr>
                    <th className="px-6 py-4 text-center text-sm font-bold uppercase tracking-wider">
                      <div className="flex items-center justify-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        Court No.
                      </div>
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-bold uppercase tracking-wider">
                      <div className="flex items-center justify-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Court Status
                      </div>
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-bold uppercase tracking-wider">
                      <div className="flex items-center justify-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Price
                      </div>
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-bold uppercase tracking-wider">
                      <div className="flex items-center justify-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                        </svg>
                        Actions
                      </div>
                    </th>
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
                      <tr key={court.Court_Id} className={`hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-300 group ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                        <td className="px-6 py-4 text-sm font-bold text-gray-900 align-middle text-center">
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                              <span className="text-blue-700 font-bold text-xs">{court.Court_Id}</span>
                            </div>
                            <span>{court.Court_Name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 align-middle text-center">
                          <div className="flex justify-center">
                            {hasUpcomingReservation(court.Court_Id) ? (
                              <div className="w-full max-w-[200px] px-4 py-2 rounded-xl text-sm font-semibold border-2 bg-gray-200 text-gray-700 border-gray-300 text-center cursor-not-allowed">
                                Reserved
                              </div>
                            ) : (
                              <select 
                                value={court.Status}
                                onChange={(e) => handleStatusChange(court.Court_Id, e.target.value)}
                                className={`w-full max-w-[200px] px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center ${
                                  court.Status === 'Available' ? 'bg-green-100 text-green-800 border-green-300 hover:bg-green-200' :
                                  'bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-200'
                                }`}
                              >
                                <option value="Available">Available</option>
                                <option value="Maintenance">Maintenance</option>
                              </select>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center align-middle">
                          <div className="flex items-center justify-center gap-3">
                            <div className="relative group/price">
                              <span className="font-bold text-lg text-gray-800 bg-gradient-to-br from-gray-100 to-gray-200 px-4 py-2 rounded-xl whitespace-nowrap border-2 border-gray-300 shadow-sm">
                                ₱{Number(court.Price || 0).toFixed(2)}
                              </span>
                            </div>
                            <button
                              onClick={() => handleEditCourt(court.Court_Id)}
                              className="w-10 h-10 bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl flex items-center justify-center hover:from-blue-100 hover:to-blue-200 hover:border-blue-300 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-110 active:scale-95 group/edit flex-shrink-0"
                              title="Edit Court Price"
                            >
                              <svg className="w-5 h-5 text-blue-600 group-hover/edit:text-blue-700 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center align-middle">
                          <button
                            onClick={() => handleDeleteCourt(court.Court_Id)}
                            className="bg-gradient-to-r from-red-500 via-red-600 to-red-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:from-red-600 hover:via-red-700 hover:to-red-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
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
                    className="rounded-2xl border-2 border-gray-200 bg-white p-6 shadow-lg transition-all duration-300 hover:shadow-2xl hover:border-blue-300 hover:-translate-y-1"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center border-2 border-blue-200">
                          <span className="text-blue-700 font-bold text-lg">{court.Court_Id}</span>
                        </div>
                        <div>
                          <span className="text-xs font-semibold uppercase tracking-widest text-blue-500 block mb-1">
                            Court
                          </span>
                          <h3 className="text-xl font-bold text-gray-900">{court.Court_Name}</h3>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {hasUpcomingReservation(court.Court_Id) ? (
                          <span className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold bg-gray-200 text-gray-700 border-2 border-gray-300">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Reserved
                          </span>
                        ) : (
                          <span
                            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold border-2 ${
                              court.Status === 'Available'
                                ? 'bg-green-100 text-green-700 border-green-200'
                                : 'bg-yellow-100 text-yellow-700 border-yellow-200'
                            }`}
                          >
                            {court.Status === 'Available' ? (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            ) : (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            )}
                            {court.Status}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">Court Status</label>
                        {hasUpcomingReservation(court.Court_Id) ? (
                          <div className="w-full px-4 py-2 rounded-xl text-sm font-semibold border-2 bg-gray-200 text-gray-700 border-gray-300 cursor-not-allowed">
                            Reserved
                          </div>
                        ) : (
                          <select
                            value={court.Status}
                            onChange={(e) => handleStatusChange(court.Court_Id, e.target.value)}
                            className={`w-full px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                              court.Status === 'Available'
                                ? 'bg-green-100 text-green-800 border-green-300'
                                : 'bg-yellow-100 text-yellow-800 border-yellow-300'
                            }`}
                          >
                            <option value="Available">Available</option>
                            <option value="Maintenance">Maintenance</option>
                          </select>
                        )}
                      </div>

                      <div className="space-y-3">
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Price
                        </label>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <span className="font-bold text-lg text-gray-800 bg-gradient-to-br from-gray-100 to-gray-200 px-4 py-2 rounded-xl whitespace-nowrap text-center border-2 border-gray-300 shadow-sm">
                            ₱{Number(court.Price || 0).toFixed(2)}
                          </span>
                          <button
                            onClick={() => handleEditCourt(court.Court_Id)}
                            className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 px-4 py-2 text-sm font-semibold text-blue-600 transition-all hover:border-blue-300 hover:from-blue-100 hover:to-blue-200 shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95"
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
                        className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-500 via-red-600 to-red-700 px-4 py-3 text-sm font-bold text-white shadow-lg transition-all hover:from-red-600 hover:via-red-700 hover:to-red-800 transform hover:scale-105 active:scale-95"
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

      {/* Enhanced Edit Price Modal */}
      {showEditPriceModal && editingCourt && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn"
          onClick={handleCloseEditPriceModal}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col animate-slideUp"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Enhanced Modal Header */}
            <div className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 p-6 text-white relative">
              <button
                onClick={handleCloseEditPriceModal}
                disabled={isUpdatingPrice}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all duration-200 hover:scale-110 disabled:opacity-50"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Edit Court Price</h2>
                  <p className="text-green-100 text-sm mt-1">Update the pricing for {editingCourt.Court_Name}</p>
                </div>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Court Name Display */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  Court Name
                </label>
                <input
                  type="text"
                  value={editingCourt.Court_Name}
                  disabled
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl bg-gray-100 text-gray-600 cursor-not-allowed"
                />
              </div>

              {/* Current Price Display */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Current Price
                </label>
                <div className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 font-bold text-lg flex items-center gap-2">
                  <span className="text-gray-500">₱</span>
                  {Number(editingCourt.Price || 0).toFixed(2)}
                </div>
              </div>

              {/* New Price Input */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  New Price (₱)
                  <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">₱</div>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={editPrice}
                    onChange={(e) => setEditPrice(Number(e.target.value) || 0)}
                    placeholder="Enter new price"
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isUpdatingPrice}
                    autoFocus
                  />
                </div>
                {editPrice > 0 && (
                  <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 text-sm text-green-700">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                      <span className="font-medium">Price difference: ₱{(editPrice - Number(editingCourt.Price || 0)).toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Enhanced Modal Footer */}
            <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end gap-4">
              <button
                onClick={handleCloseEditPriceModal}
                disabled={isUpdatingPrice}
                className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 transition-all font-semibold shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Cancel
              </button>
              <button
                onClick={handleUpdatePrice}
                disabled={isUpdatingPrice || editPrice <= 0}
                className={`px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl transition-all font-semibold shadow-lg hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2 ${
                  !isUpdatingPrice && editPrice > 0 && 'hover:from-green-700 hover:to-emerald-700 transform hover:scale-105 active:scale-95'
                }`}
              >
                {isUpdatingPrice ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Updating...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Update Price</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Add Court Modal */}
      {showAddModal && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn"
          onClick={handleCloseAddModal}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col animate-slideUp"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Enhanced Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-6 text-white relative">
              <button
                onClick={handleCloseAddModal}
                disabled={isSubmitting}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all duration-200 hover:scale-110 disabled:opacity-50"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Add New Court</h2>
                  <p className="text-blue-100 text-sm mt-1">Create a new court for your facility</p>
                </div>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Court Number Field */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  Court Number
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newCourt.Court_Name}
                  onChange={(e) => setNewCourt({ ...newCourt, Court_Name: e.target.value })}
                  placeholder="e.g., Court 13"
                  maxLength={100}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isSubmitting}
                />
              </div>

              {/* Status Field */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <svg className="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Status
                </label>
                <div className="relative">
                  <select
                    value={newCourt.Status}
                    onChange={(e) => setNewCourt({ ...newCourt, Status: e.target.value as any })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all appearance-none bg-white cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isSubmitting}
                  >
                    <option value="Available">Available</option>
                    <option value="Maintenance">Maintenance</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Price Field */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Price (₱)
                  <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">₱</div>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={newCourt.Price}
                    onChange={(e) => setNewCourt({ ...newCourt, Price: Number(e.target.value) || 0 })}
                    placeholder="250.00"
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>

            {/* Enhanced Modal Footer */}
            <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end gap-4">
              <button
                onClick={handleCloseAddModal}
                disabled={isSubmitting}
                className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 transition-all font-semibold shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Cancel
              </button>
              <button
                onClick={handleSubmitNewCourt}
                disabled={isSubmitting || !newCourt.Court_Name.trim()}
                className={`px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl transition-all font-semibold shadow-lg hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2 ${
                  !isSubmitting && !(!newCourt.Court_Name.trim()) && 'hover:from-blue-700 hover:to-indigo-700 transform hover:scale-105 active:scale-95'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Adding...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Add Court</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmModal.open && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-fadeIn"
          onClick={handleCancelDelete}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col animate-slideUp"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-red-600 via-red-700 to-red-800 p-6 text-white relative">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Confirm Deletion</h2>
                  <p className="text-red-100 text-sm mt-1">This action cannot be undone</p>
                </div>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                    <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-gray-800 text-lg font-medium mb-2">
                    Are you sure you want to delete <span className="font-bold text-red-600">{deleteConfirmModal.courtName}</span>?
                  </p>
                  <p className="text-gray-600 text-sm">
                    This will permanently remove the court from the system. All associated data will be lost.
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end gap-4">
              <button
                onClick={handleCancelDelete}
                disabled={isDeleting}
                className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 transition-all font-semibold shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className={`px-8 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl transition-all font-semibold shadow-lg hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2 ${
                  !isDeleting && 'hover:from-red-700 hover:to-red-800 transform hover:scale-105 active:scale-95'
                }`}
              >
                {isDeleting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    <span>Delete Court</span>
                  </>
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