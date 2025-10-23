import { useState, useEffect } from 'react'
import { Calendar, Receipt, ChevronLeft, ChevronRight, Filter, Menu } from 'lucide-react'
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
  Paymongo_Reference_Number?: string
  court: {
    Court_Name: string
  }
  payments?: {
    payment_method: string
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

  // Handle receipt download/view
  const handleReceipt = async (reservation: Reservation) => {
    try {
      if (reservation.Paymongo_Reference_Number) {
        // Get receipt from Paymongo
        const response = await api.get(`/payment/receipt/${reservation.Paymongo_Reference_Number}`)
        
        if (response.data.success && response.data.data) {
          // Open receipt in new tab or download
          const receiptUrl = response.data.data.receipt_url
          if (receiptUrl) {
            window.open(receiptUrl, '_blank')
          } else {
            toast.error('Receipt not available')
          }
        } else {
          toast.error('Failed to retrieve receipt')
        }
      } else {
        toast.error('No payment reference found for this reservation')
      }
    } catch (error) {
      console.error('Error getting receipt:', error)
      toast.error('Failed to retrieve receipt')
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
      return reservation.payments[0].payment_method
    }
    return 'GCash' // Default fallback
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

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 bg-gradient-to-br from-gray-900/80 via-blue-900/20 to-purple-900/20 backdrop-blur-md flex items-center justify-center z-50 p-2 sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div 
        className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 w-full max-w-7xl h-[90vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-500"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200/50">
          <div className="relative">
            <h2 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent">
              My Reservations
            </h2>
            <p className="text-sm text-gray-600 mt-2 font-medium">
              Manage your court bookings and view reservation history
            </p>
            <div className="absolute -bottom-2 left-0 w-20 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"></div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-all duration-300 p-3 hover:bg-gray-100 rounded-xl group"
            aria-label="Close reservations modal"
            title="Close reservations modal"
          >
            <svg className="w-6 h-6 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Hidden on mobile, shown on tablet+ */}
        {!isMobile && (
            <div className="w-72 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 border-r border-blue-200/30 flex flex-col flex-shrink-0 relative overflow-hidden">
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 left-0 w-32 h-32 bg-white rounded-full -translate-x-16 -translate-y-16"></div>
                <div className="absolute top-20 right-0 w-24 h-24 bg-white rounded-full translate-x-12"></div>
                <div className="absolute bottom-0 left-0 w-40 h-40 bg-white rounded-full -translate-x-20 translate-y-20"></div>
              </div>
              
              <div className="p-6 border-b border-white/20 relative z-10">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-white/20 rounded-xl">
                    <Calendar className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-white">Reservations</h2>
                </div>
            </div>
            
              <div className="flex-1 p-6 space-y-3 relative z-10">
              <button
                onClick={() => setActiveTab('current')}
                  className={`w-full flex items-center space-x-4 p-4 rounded-2xl transition-all duration-300 group relative overflow-hidden ${
                  activeTab === 'current'
                      ? 'bg-white/20 text-white shadow-xl backdrop-blur-sm border border-white/30'
                      : 'text-white/80 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {activeTab === 'current' && (
                    <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent"></div>
                  )}
                  <div className={`relative z-10 p-2 rounded-lg ${activeTab === 'current' ? 'bg-white/20' : 'group-hover:bg-white/10'}`}>
                    <Calendar className="w-5 h-5" />
                  </div>
                  <span className="font-semibold relative z-10">My reservations</span>
                  {activeTab === 'current' && (
                    <div className="ml-auto w-3 h-3 bg-white rounded-full shadow-lg relative z-10"></div>
                  )}
              </button>
                
              <button
                onClick={() => setActiveTab('history')}
                  className={`w-full flex items-center space-x-4 p-4 rounded-2xl transition-all duration-300 group relative overflow-hidden ${
                  activeTab === 'history'
                      ? 'bg-white/20 text-white shadow-xl backdrop-blur-sm border border-white/30'
                      : 'text-white/80 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {activeTab === 'history' && (
                    <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent"></div>
                  )}
                  <div className={`relative z-10 p-2 rounded-lg ${activeTab === 'history' ? 'bg-white/20' : 'group-hover:bg-white/10'}`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span className="font-semibold relative z-10">Reservation History</span>
                  {activeTab === 'history' && (
                    <div className="ml-auto w-3 h-3 bg-white rounded-full shadow-lg relative z-10"></div>
                  )}
              </button>
            </div>
          </div>
        )}

        {/* Main Content */}
          <div className="flex-1 flex flex-col overflow-hidden bg-gradient-to-br from-gray-50/50 to-white/80">
          {/* Mobile Header with Sidebar Toggle */}
          {isMobile && (
              <div className="flex items-center justify-between p-6 border-b border-gray-200/50 bg-white/80 backdrop-blur-sm">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="p-3 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all duration-300"
                  aria-label="Toggle sidebar menu"
                  title="Toggle sidebar menu"
                >
                  <Menu className="w-5 h-5" />
                </button>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setActiveTab('current')}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                      activeTab === 'current'
                          ? 'bg-blue-500 text-white shadow-lg'
                          : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600'
                    }`}
                  >
                    Current
                  </button>
                  <button
                    onClick={() => setActiveTab('history')}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                      activeTab === 'history'
                          ? 'bg-blue-500 text-white shadow-lg'
                          : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600'
                    }`}
                  >
                    History
                  </button>
                </div>
              </div>
              <button
                onClick={() => setShowDateFilter(!showDateFilter)}
                  className="p-3 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all duration-300"
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
              <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200/50 backdrop-blur-sm">
                <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Filter className="w-5 h-5 text-blue-600" />
                    </div>
                    <label className="text-sm font-bold text-gray-800">Filter by Date:</label>
                  </div>
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                    className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 bg-white shadow-sm hover:shadow-md"
                />
                <button
                  onClick={() => setDateFilter('')}
                    className="px-6 py-3 text-sm font-medium text-gray-700 hover:text-gray-900 border-2 border-gray-200 rounded-xl hover:bg-white hover:border-gray-300 transition-all duration-300 shadow-sm hover:shadow-md"
                >
                  Clear Filter
                </button>
              </div>
            </div>
          )}

          {/* Content */}
            <div className="flex-1 overflow-hidden p-6">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <div className="relative">
                      <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 mx-auto mb-6"></div>
                      <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent absolute top-0 left-1/2 transform -translate-x-1/2"></div>
                    </div>
                    <p className="text-gray-600 font-medium">Loading reservations...</p>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col">
                {/* Table */}
                  <div className="flex-1 overflow-auto bg-white rounded-2xl shadow-lg border border-gray-200/50">
                  <ResponsiveTable>
                      <ResponsiveTableHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
                        <ResponsiveTableHeaderCell className="font-bold text-gray-800">ID</ResponsiveTableHeaderCell>
                        <ResponsiveTableHeaderCell className="font-bold text-gray-800">Date</ResponsiveTableHeaderCell>
                        <ResponsiveTableHeaderCell className="font-bold text-gray-800">Time</ResponsiveTableHeaderCell>
                        <ResponsiveTableHeaderCell hideOnMobile className="font-bold text-gray-800">Court no.</ResponsiveTableHeaderCell>
                        <ResponsiveTableHeaderCell className="font-bold text-gray-800">Price</ResponsiveTableHeaderCell>
                        <ResponsiveTableHeaderCell hideOnMobile className="font-bold text-gray-800">Mode of Payment</ResponsiveTableHeaderCell>
                        <ResponsiveTableHeaderCell className="font-bold text-gray-800">Action</ResponsiveTableHeaderCell>
                    </ResponsiveTableHeader>
                    <ResponsiveTableBody>
                      {currentReservations.map((reservation, index) => (
                          <ResponsiveTableRow key={reservation.Reservation_ID} className="hover:bg-blue-50/50 transition-colors duration-200 border-b border-gray-100">
                            <ResponsiveTableCell className="font-medium text-gray-700">
                              <div className="flex items-center space-x-2">
                                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                                  <span className="text-xs font-bold text-blue-600">{startIndex + index + 1}</span>
                                </div>
                              </div>
                            </ResponsiveTableCell>
                            <ResponsiveTableCell className="font-medium text-gray-800">{formatDate(reservation.Reservation_Date)}</ResponsiveTableCell>
                            <ResponsiveTableCell className="text-gray-700">
                              <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <span>{formatTime(reservation.Start_Time)}-{formatTime(reservation.End_Time)}</span>
                              </div>
                            </ResponsiveTableCell>
                            <ResponsiveTableCell hideOnMobile className="text-gray-700">
                              <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                                <span>{reservation.court?.Court_Name || 'Unknown Court'}</span>
                              </div>
                          </ResponsiveTableCell>
                            <ResponsiveTableCell className="font-bold text-green-600">₱{formatPrice(reservation.Total_Amount)}</ResponsiveTableCell>
                            <ResponsiveTableCell hideOnMobile className="text-gray-700">
                              <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                                <span>{getPaymentMethod(reservation)}</span>
                              </div>
                          </ResponsiveTableCell>
                          <ResponsiveTableCell>
                            <button
                              onClick={() => handleReceipt(reservation)}
                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-300 group"
                              aria-label={`View receipt for reservation ${reservation.Reservation_ID}`}
                              title={`View receipt for reservation ${reservation.Reservation_ID}`}
                            >
                                <Receipt className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                            </button>
                          </ResponsiveTableCell>
                        </ResponsiveTableRow>
                      ))}
                    </ResponsiveTableBody>
                  </ResponsiveTable>
                </div>

                {/* Empty State */}
                {currentReservations.length === 0 && (
                    <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-blue-50/50 to-indigo-50/50 rounded-2xl m-4">
                      <div className="text-center p-8">
                        <div className="relative mb-6">
                          <div className="w-24 h-24 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto shadow-lg">
                            <Calendar className="w-12 h-12 text-blue-500" />
                          </div>
                          <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
                            <span className="text-white text-sm font-bold">!</span>
                          </div>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-3">No reservations found</h3>
                        <p className="text-gray-600 text-lg mb-6 max-w-md">
                          {dateFilter ? 'No reservations found for the selected date.' : 'You have no reservations yet. Start by booking a court!'}
                        </p>
                        {!dateFilter && (
                          <button
                            onClick={onClose}
                            className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-8 py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                          >
                            Book a Court
                          </button>
                        )}
                    </div>
                  </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200/50">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-sm font-medium text-gray-700">
                          Page {currentPage} of {totalPages}
                        </span>
                    </div>
                      <div className="flex items-center space-x-3">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                          className="p-3 rounded-xl border-2 border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-50 hover:border-blue-300 transition-all duration-300 group disabled:hover:bg-transparent disabled:hover:border-gray-200"
                        aria-label="Previous page"
                        title="Previous page"
                      >
                          <ChevronLeft className="w-5 h-5 text-gray-600 group-hover:text-blue-600 transition-colors duration-200" />
                      </button>
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                          className="p-3 rounded-xl border-2 border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-50 hover:border-blue-300 transition-all duration-300 group disabled:hover:bg-transparent disabled:hover:border-gray-200"
                        aria-label="Next page"
                        title="Next page"
                      >
                          <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-blue-600 transition-colors duration-200" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Notes Section */}
                  <div className="mt-6 p-4 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200/50 rounded-xl">
                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-red-100 rounded-lg flex-shrink-0">
                        <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-base font-bold text-red-800 mb-2">
                          Payment & Cancellation Policy
                        </h4>
                        <p className="text-sm text-red-700">
                          Full payment required at booking. <strong>No cancellations or refunds</strong> once reservation is made.
                        </p>
                      </div>
                    </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      </div>
    </div>
  )
}
