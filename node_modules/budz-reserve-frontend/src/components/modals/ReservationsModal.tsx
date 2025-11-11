import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, ChevronLeft, ChevronRight, Filter, Menu, Receipt } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'
import { useResponsive } from '@/hooks/useResponsive'
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
  Created_at?: string
  court: {
    Court_Name: string
  }
  payments?: {
    payment_method: string
    amount?: number
  }[]
}

interface RentalApiItem {
  equipmentName?: string
  equipment?: { equipment_name?: string }
  quantity?: number
  hours?: number
  subtotal?: number
}

interface RentalApiData {
  items?: RentalApiItem[]
  total?: number
}

interface RentalApiResponse {
  success?: boolean
  data?: RentalApiData
}

interface RentalItem {
  equipmentName: string
  quantity: number
  hours: number
  subtotal: number
}

interface RentalEntry {
  items: RentalItem[]
  total: number
}

type RentalsMap = Record<number, RentalEntry>

interface GroupedReservation {
  key: string
  reservations: Reservation[]
  courts: string[]
  reservationDate: string
  startTime: string
  endTime: string
  totalAmount: number
  latestCreatedAt: number
}

const buildReservationGroupKey = (reservation: Reservation) => {
  if (reservation.Reference_Number) return reservation.Reference_Number
  if (reservation.Paymongo_Reference_Number) return reservation.Paymongo_Reference_Number
  return `${reservation.Reservation_Date}_${reservation.Start_Time}_${reservation.End_Time}_${reservation.Reservation_ID}`
}

const groupReservations = (reservations: Reservation[]): GroupedReservation[] => {
  const groupMap = new Map<string, GroupedReservation>()
  const orderedGroups: GroupedReservation[] = []

  const getReservationTimestamp = (reservation: Reservation) => {
    if (reservation.Created_at) {
      const createdAtTime = new Date(reservation.Created_at).getTime()
      if (!Number.isNaN(createdAtTime)) {
        return createdAtTime
      }
    }

    const dateTimeString = reservation.Reservation_Date
      ? `${reservation.Reservation_Date}T${reservation.End_Time || '00:00:00'}`
      : ''
    const fallbackTime = dateTimeString ? new Date(dateTimeString).getTime() : NaN

    if (!Number.isNaN(fallbackTime)) {
      return fallbackTime
    }

    const dateOnlyTime = reservation.Reservation_Date
      ? new Date(reservation.Reservation_Date).getTime()
      : NaN

    return Number.isNaN(dateOnlyTime) ? 0 : dateOnlyTime
  }

  reservations.forEach((reservation) => {
    const key = buildReservationGroupKey(reservation)
    let group = groupMap.get(key)
    const reservationTimestamp = getReservationTimestamp(reservation)

    if (!group) {
      group = {
        key,
        reservations: [reservation],
        courts: reservation.court?.Court_Name ? [reservation.court.Court_Name] : [],
        reservationDate: reservation.Reservation_Date,
        startTime: reservation.Start_Time,
        endTime: reservation.End_Time,
        totalAmount: Number(reservation.Total_Amount) || 0,
        latestCreatedAt: reservationTimestamp
      }
      groupMap.set(key, group)
      orderedGroups.push(group)
    } else {
      group.reservations.push(reservation)
      if (reservation.court?.Court_Name && !group.courts.includes(reservation.court.Court_Name)) {
        group.courts.push(reservation.court.Court_Name)
      }
      if (reservation.Reservation_Date < group.reservationDate) {
        group.reservationDate = reservation.Reservation_Date
      }
      if (reservation.Start_Time < group.startTime) {
        group.startTime = reservation.Start_Time
      }
      if (reservation.End_Time > group.endTime) {
        group.endTime = reservation.End_Time
      }
      const amount = Number(reservation.Total_Amount) || 0
      if (amount > group.totalAmount) {
        group.totalAmount = amount
      }
      if (reservationTimestamp > group.latestCreatedAt) {
        group.latestCreatedAt = reservationTimestamp
      }
    }
  })

  return orderedGroups.sort((a, b) => b.latestCreatedAt - a.latestCreatedAt)
}

interface ReservationsModalProps {
  isOpen: boolean
  onClose: () => void
}

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message
  }
  return typeof error === 'string' ? error : JSON.stringify(error)
}

export function ReservationsModal({ isOpen, onClose }: ReservationsModalProps) {
  const { user } = useAuthStore()
  const { isMobile } = useResponsive()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'current' | 'history'>('current')
  const [groupedReservations, setGroupedReservations] = useState<GroupedReservation[]>([])
  const [loading, setLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [dateFilter, setDateFilter] = useState('')
  const [showDateFilter, setShowDateFilter] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile)
  const [rentalsMap, setRentalsMap] = useState<RentalsMap>({})

  const itemsPerPage = useMemo(() => (isMobile ? 5 : 7), [isMobile])

  // Determine if reservation has already ended
  const isReservationEnded = (reservation: Reservation) => {
    try {
      const endDateTime = new Date(`${reservation.Reservation_Date}T${reservation.End_Time}`)
      if (isNaN(endDateTime.getTime())) return false
      const now = new Date()
      return endDateTime < now
    } catch (error) {
      console.warn('[ReservationsModal] Failed to parse reservation end time:', error)
      return false
    }
  }

  // Fetch reservations
  const fetchReservations = useCallback(async () => {
    if (!user) return
    
    setLoading(true)
    try {
      console.log('[ReservationsModal] Fetching reservations for user:', user.id)
      const response = await api.get('/reservations/my-reservations')
      console.log('[ReservationsModal] Raw response data:', response.data)
      console.log('[ReservationsModal] Total reservations received:', response.data?.length || 0)
      
      let filteredReservations = response.data || []

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
        const beforeTabFilter = filteredReservations.length
        filteredReservations = filteredReservations.filter((res: Reservation) => 
          (res.Status === 'Confirmed' || res.Status === 'Pending') && !isReservationEnded(res)
        )
        console.log(`[ReservationsModal] Tab filter (current): ${beforeTabFilter} → ${filteredReservations.length}`)
      } else {
        const beforeTabFilter = filteredReservations.length
        filteredReservations = filteredReservations.filter((res: Reservation) => 
          res.Status === 'Completed' || res.Status === 'Cancelled' || isReservationEnded(res)
        )
        console.log(`[ReservationsModal] Tab filter (history): ${beforeTabFilter} → ${filteredReservations.length}`)
      }

      console.log('[ReservationsModal] Final filtered reservations:', filteredReservations.length)
      const grouped = groupReservations(filteredReservations)
      setGroupedReservations(grouped)
      
      // Fetch rentals for these reservations
      try {
        const entries: RentalsMap = {}
        await Promise.all(
          filteredReservations.map(async (res: Reservation) => {
            try {
              const rentalResponse = await api.get<RentalApiResponse>(`/payment/rentals/by-reservation/${res.Reservation_ID}`)
              if (rentalResponse.data?.success && rentalResponse.data.data) {
                // Transform the data structure
                const rentalData = rentalResponse.data.data
                entries[res.Reservation_ID] = {
                  items: rentalData.items?.map((item) => ({
                    equipmentName: item.equipmentName || item.equipment?.equipment_name || 'Equipment',
                    quantity: item.quantity || 1,
                    hours: item.hours || 1,
                    subtotal: item.subtotal || 0
                  })) || [],
                  total: rentalData.total || 0
                }
              }
            } catch (rentalError: unknown) {
              console.warn(`[ReservationsModal] Failed to fetch rentals for reservation ${res.Reservation_ID}:`, rentalError)
            }
          })
        )
        setRentalsMap(entries)
        console.log('[ReservationsModal] Rentals map:', entries)
      } catch (rentalsError: unknown) {
        console.error('[ReservationsModal] Error fetching rentals:', rentalsError)
      }
      const safeItemsPerPage = Math.max(itemsPerPage, 1)
      const newTotalPages = Math.max(1, Math.ceil(grouped.length / safeItemsPerPage))
      setTotalPages(newTotalPages)
      setCurrentPage(1)
    } catch (error: unknown) {
      console.error('[ReservationsModal] Error fetching reservations:', error)
      console.error('[ReservationsModal] Error details:', getErrorMessage(error))
      toast.error('Failed to load reservations')
    } finally {
      setLoading(false)
    }
  }, [user, dateFilter, activeTab, itemsPerPage])

  useEffect(() => {
    if (isOpen) {
      fetchReservations()
    }
  }, [isOpen, fetchReservations])

  useEffect(() => {
    const safeItemsPerPage = Math.max(itemsPerPage, 1)
    const newTotalPages = Math.max(1, Math.ceil(groupedReservations.length / safeItemsPerPage))
    setTotalPages(prev => (prev === newTotalPages ? prev : newTotalPages))
    setCurrentPage(prev => Math.max(1, Math.min(prev, newTotalPages)))
  }, [itemsPerPage, groupedReservations.length])

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
    } catch (error: unknown) {
      console.error('Error getting receipt:', error)
      toast.error(`Failed to retrieve receipt: ${getErrorMessage(error)}`)
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
  const getPaymentMethod = (payments?: Reservation['payments']) => {
    if (payments && payments.length > 0) {
      return payments[0].payment_method
    }
    return 'GCash' // Default fallback
  }

  // Safe number formatting
  const formatPrice = (amount: unknown) => {
    const num = Number(amount)
    return Number.isFinite(num) ? num.toFixed(2) : '0.00'
  }

  // Pagination
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentReservations = groupedReservations.slice(startIndex, endIndex)

  const formatRentalItems = (rentalItems: RentalItem[]): JSX.Element => {
    const visibleItems = rentalItems.slice(0, 3)
    const additionalCount = rentalItems.length - visibleItems.length

    return (
      <div className="flex flex-col gap-1">
        {rentalItems.length === 0 ? (
          <span className="text-gray-400 text-sm">None</span>
        ) : (
          <>
            {visibleItems.map((item, idx) => (
              <span key={`${item.equipmentName}-${idx}`} className="text-sm">
                {item.equipmentName}{' '}
                <span className="ml-1 inline-block px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs">
                  {item.hours}h{item.quantity > 1 ? ` x${item.quantity}` : ''}
                </span>
              </span>
            ))}
            {additionalCount > 0 && (
              <span className="text-xs text-gray-400">+{additionalCount} more</span>
            )}
          </>
        )}
      </div>
    )
  }

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
          <div className="flex items-center space-x-2">
            <button
              onClick={fetchReservations}
              disabled={loading}
              className="text-gray-400 hover:text-gray-600 transition-all duration-300 p-3 hover:bg-gray-100 rounded-xl group disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Refresh reservations"
              title="Refresh reservations"
            >
              <svg 
                className={`w-6 h-6 group-hover:scale-110 transition-transform duration-200 ${loading ? 'animate-spin' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
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
                        <ResponsiveTableHeaderCell hideOnMobile className="font-bold text-gray-800">Mode of Payment</ResponsiveTableHeaderCell>
                        <ResponsiveTableHeaderCell className="font-bold text-gray-800">Racket Rent / Duration</ResponsiveTableHeaderCell>
                        <ResponsiveTableHeaderCell className="font-bold text-gray-800">Price</ResponsiveTableHeaderCell>
                    </ResponsiveTableHeader>
                    <ResponsiveTableBody>
                  {currentReservations.map((group, index) => {
                    const rentalItems = group.reservations.flatMap(res => rentalsMap[res.Reservation_ID]?.items ?? [])
                    const payments = group.reservations.flatMap(res => res.payments || [])
                    const paid = payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0)
                    const displayAmount = paid > 0 ? paid : group.totalAmount
                    const courts = group.courts.length > 0
                      ? group.courts
                      : group.reservations.map(res => res.court?.Court_Name || 'Unknown Court')
                    const receiptReservation = group.reservations.find(res => res.Paymongo_Reference_Number)

                    return (
                      <ResponsiveTableRow key={group.key} className="hover:bg-blue-50/50 transition-colors duration-200 border-b border-gray-100">
                            <ResponsiveTableCell className="font-medium text-gray-700">
                              <div className="flex items-center space-x-2">
                                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                                  <span className="text-xs font-bold text-blue-600">{startIndex + index + 1}</span>
                                </div>
                              </div>
                            </ResponsiveTableCell>
                            <ResponsiveTableCell className="font-medium text-gray-800">{formatDate(group.reservationDate)}</ResponsiveTableCell>
                            <ResponsiveTableCell className="text-gray-700">
                              <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <span>{`${formatTime(group.startTime)} - ${formatTime(group.endTime)}`}</span>
                              </div>
                            </ResponsiveTableCell>
                            <ResponsiveTableCell hideOnMobile className="text-gray-700">
                              <div className="flex flex-col gap-1">
                                {courts.map((court, courtIndex) => (
                                  <div key={`${group.key}-court-${courtIndex}`} className="flex items-center space-x-2">
                                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                                    <span>{court}</span>
                                  </div>
                                ))}
                              </div>
                          </ResponsiveTableCell>
                            <ResponsiveTableCell hideOnMobile className="text-gray-700">
                              <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                                <span>{getPaymentMethod(payments)}</span>
                              </div>
                          </ResponsiveTableCell>
                          <ResponsiveTableCell className="text-gray-700">
                            {formatRentalItems(rentalItems)}
                          </ResponsiveTableCell>
                          <ResponsiveTableCell className="text-green-600">
                            <div className="flex flex-col items-start gap-1">
                              <span className="font-bold">₱{formatPrice(displayAmount)}</span>
                              {receiptReservation?.Paymongo_Reference_Number && (
                                <button
                                  type="button"
                                  onClick={() => handleReceipt(receiptReservation)}
                                  className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded-lg px-2 py-1 bg-blue-50 hover:bg-blue-100 transition-colors"
                                >
                                  <Receipt className="w-3.5 h-3.5" />
                                  View receipt
                                </button>
                              )}
                            </div>
                          </ResponsiveTableCell>
                        </ResponsiveTableRow>
                    )
                  })}
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
                        <h3 className="text-2xl font-bold text-gray-900 mb-3">No reservation found</h3>
                        <p className="text-gray-600 text-lg mb-6 max-w-md">
                          {dateFilter ? 'No reservations found for the selected date.' : 'You have no upcoming reservations yet. Start by booking a court!'}
                        </p>
                        {!dateFilter && (
                          <button
                            onClick={() => {
                              onClose()
                              navigate('/booking')
                            }}
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
