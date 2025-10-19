import { useState, useEffect } from 'react'
import { Calendar, Trash2, ChevronLeft, ChevronRight, Filter, Menu } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'
import { useResponsive } from '@/hooks/useResponsive'
import { ResponsiveModal } from '@/components/ui/ResponsiveModal'
import { 
  ResponsiveTable, 
  ResponsiveTableHeader, 
  ResponsiveTableHeaderCell, 
  ResponsiveTableBody, 
  ResponsiveTableRow, 
  ResponsiveTableCell 
} from '@/components/ui/ResponsiveTable'

interface Reservation {
  Reservation_ID: number
  Court_ID: number
  Reservation_Date: string
  Start_Time: string
  End_Time: string
  Status: string
  Total_Amount: number
  Reference_Number: string
  court: {
    Court_Name: string
  }
  payments?: {
    Payment_Method: string
  }[]
}

interface ReservationsModalProps {
  isOpen: boolean
  onClose: () => void
}

export function ReservationsModal({ isOpen, onClose }: ReservationsModalProps) {
  const { user } = useAuthStore()
  const { isMobile } = useResponsive()
  const [activeTab, setActiveTab] = useState<'current' | 'history'>('current')
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [dateFilter, setDateFilter] = useState('')
  const [showDateFilter, setShowDateFilter] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile)

  const itemsPerPage = isMobile ? 5 : 7

  // Fetch reservations
  const fetchReservations = async () => {
    if (!user) return
    
    setLoading(true)
    try {
      const response = await api.get('/reservations/my-reservations')
      let filteredReservations = response.data

      // Apply date filter if set
      if (dateFilter) {
        const filterDate = new Date(dateFilter)
        filteredReservations = filteredReservations.filter((res: Reservation) => {
          const resDate = new Date(res.Reservation_Date)
          return resDate.toDateString() === filterDate.toDateString()
        })
      }

      // Filter by tab (current vs history)
      if (activeTab === 'current') {
        filteredReservations = filteredReservations.filter((res: Reservation) => 
          res.Status === 'Confirmed' || res.Status === 'Pending'
        )
      } else {
        filteredReservations = filteredReservations.filter((res: Reservation) => 
          res.Status === 'Completed' || res.Status === 'Cancelled'
        )
      }

      setReservations(filteredReservations)
      setTotalPages(Math.ceil(filteredReservations.length / itemsPerPage))
      setCurrentPage(1)
    } catch (error) {
      console.error('Error fetching reservations:', error)
      toast.error('Failed to load reservations')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      fetchReservations()
    }
  }, [isOpen, activeTab, dateFilter])

  // Delete reservation
  const handleDeleteReservation = async (reservationId: number) => {
    if (!confirm('Are you sure you want to delete this reservation?')) return

    try {
      await api.delete(`/reservations/${reservationId}`)
      toast.success('Reservation deleted successfully')
      fetchReservations()
    } catch (error) {
      console.error('Error deleting reservation:', error)
      toast.error('Failed to delete reservation')
    }
  }

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return 'Invalid Date'
      return date.toLocaleDateString('en-US', {
        month: 'numeric',
        day: 'numeric',
        year: '2-digit'
      })
    } catch (error) {
      return 'Invalid Date'
    }
  }

  // Format time for display
  const formatTime = (timeString: string) => {
    try {
      const time = new Date(`2000-01-01T${timeString}`)
      if (isNaN(time.getTime())) return 'Invalid Time'
      return time.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })
    } catch (error) {
      return 'Invalid Time'
    }
  }

  // Get payment method
  const getPaymentMethod = (reservation: Reservation) => {
    if (reservation.payments && reservation.payments.length > 0) {
      return reservation.payments[0].Payment_Method
    }
    return 'Gcash' // Default fallback
  }

  // Safe number formatting
  const formatPrice = (amount: any) => {
    const num = Number(amount)
    return isNaN(num) ? '0.00' : num.toFixed(2)
  }

  // Pagination
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentReservations = reservations.slice(startIndex, endIndex)

  return (
    <ResponsiveModal
      isOpen={isOpen}
      onClose={onClose}
      title="My Reservations"
      className="flex flex-col"
    >
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Hidden on mobile, shown on tablet+ */}
        {!isMobile && (
          <div className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col flex-shrink-0">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Reservations</h2>
            </div>
            
            <div className="flex-1 p-4 space-y-2">
              <button
                onClick={() => setActiveTab('current')}
                className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                  activeTab === 'current'
                    ? 'bg-gray-200 text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                My reservations
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                  activeTab === 'history'
                    ? 'bg-gray-200 text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Reservation History
              </button>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Mobile Header with Sidebar Toggle */}
          {isMobile && (
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="p-2 text-gray-600 hover:text-gray-900"
                  aria-label="Toggle sidebar menu"
                  title="Toggle sidebar menu"
                >
                  <Menu className="w-5 h-5" />
                </button>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setActiveTab('current')}
                    className={`px-3 py-1 rounded text-sm ${
                      activeTab === 'current'
                        ? 'bg-blue-100 text-blue-800'
                        : 'text-gray-600'
                    }`}
                  >
                    Current
                  </button>
                  <button
                    onClick={() => setActiveTab('history')}
                    className={`px-3 py-1 rounded text-sm ${
                      activeTab === 'history'
                        ? 'bg-blue-100 text-blue-800'
                        : 'text-gray-600'
                    }`}
                  >
                    History
                  </button>
                </div>
              </div>
              <button
                onClick={() => setShowDateFilter(!showDateFilter)}
                className="p-2 text-gray-600 hover:text-gray-900"
                aria-label="Toggle date filter"
                title="Toggle date filter"
              >
                <Filter className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Mobile Sidebar Overlay */}
          {isMobile && sidebarOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={() => setSidebarOpen(false)}>
              <div className="absolute left-0 top-0 h-full w-64 bg-white shadow-lg" onClick={(e) => e.stopPropagation()}>
                <div className="p-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Reservations</h2>
                </div>
                <div className="p-4 space-y-2">
                  <button
                    onClick={() => {
                      setActiveTab('current')
                      setSidebarOpen(false)
                    }}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                      activeTab === 'current'
                        ? 'bg-gray-200 text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    My reservations
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('history')
                      setSidebarOpen(false)
                    }}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                      activeTab === 'history'
                        ? 'bg-gray-200 text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    Reservation History
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Date Filter */}
          {showDateFilter && (
            <div className="p-4 bg-gray-50 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                <label className="text-sm font-medium text-gray-700">Filter by Date:</label>
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={() => setDateFilter('')}
                  className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Clear Filter
                </button>
              </div>
            </div>
          )}

          {/* Content */}
          <div className="flex-1 overflow-hidden p-4">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading reservations...</p>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col">
                {/* Table */}
                <div className="flex-1 overflow-auto">
                  <ResponsiveTable>
                    <ResponsiveTableHeader>
                      <ResponsiveTableHeaderCell>ID</ResponsiveTableHeaderCell>
                      <ResponsiveTableHeaderCell>Date</ResponsiveTableHeaderCell>
                      <ResponsiveTableHeaderCell>Time</ResponsiveTableHeaderCell>
                      <ResponsiveTableHeaderCell hideOnMobile>Court no.</ResponsiveTableHeaderCell>
                      <ResponsiveTableHeaderCell>Price</ResponsiveTableHeaderCell>
                      <ResponsiveTableHeaderCell hideOnMobile>Mode of Payment</ResponsiveTableHeaderCell>
                      <ResponsiveTableHeaderCell>Action</ResponsiveTableHeaderCell>
                    </ResponsiveTableHeader>
                    <ResponsiveTableBody>
                      {currentReservations.map((reservation, index) => (
                        <ResponsiveTableRow key={reservation.Reservation_ID}>
                          <ResponsiveTableCell>{startIndex + index + 1}</ResponsiveTableCell>
                          <ResponsiveTableCell>{formatDate(reservation.Reservation_Date)}</ResponsiveTableCell>
                          <ResponsiveTableCell>
                            {formatTime(reservation.Start_Time)}-{formatTime(reservation.End_Time)}
                          </ResponsiveTableCell>
                          <ResponsiveTableCell hideOnMobile>
                            {reservation.court?.Court_Name || 'Unknown Court'}
                          </ResponsiveTableCell>
                          <ResponsiveTableCell>₱{formatPrice(reservation.Total_Amount)}</ResponsiveTableCell>
                          <ResponsiveTableCell hideOnMobile>{getPaymentMethod(reservation)}</ResponsiveTableCell>
                          <ResponsiveTableCell>
                            <button
                              onClick={() => handleDeleteReservation(reservation.Reservation_ID)}
                              className="text-gray-400 hover:text-red-600 transition-colors"
                              aria-label={`Delete reservation ${reservation.Reservation_ID}`}
                              title={`Delete reservation ${reservation.Reservation_ID}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </ResponsiveTableCell>
                        </ResponsiveTableRow>
                      ))}
                    </ResponsiveTableBody>
                  </ResponsiveTable>
                </div>

                {/* Empty State */}
                {currentReservations.length === 0 && (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No reservations found</h3>
                      <p className="text-gray-600">
                        {dateFilter ? 'No reservations found for the selected date.' : 'You have no reservations yet.'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                    <div className="text-sm text-gray-700">
                      Page {currentPage} out of {totalPages}
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                        aria-label="Previous page"
                        title="Previous page"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                        aria-label="Next page"
                        title="Next page"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Notes Section */}
                <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <h4 className="text-sm font-semibold text-red-800 mb-2">Note: Payment, Refund & Cancellation</h4>
                  <ul className="text-sm text-red-700 space-y-1">
                    <li>• Pay the given price in order to make reservation.</li>
                    <li>• Strictly "No Cancellation and refund policy" once you reserved a court there is no cancellation.</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </ResponsiveModal>
  )
}
