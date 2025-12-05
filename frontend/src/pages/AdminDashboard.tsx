import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '@/lib/api'
import { apiServices } from '@/lib/apiServices'
import AdminSidebar from '@/components/AdminSidebar'
import { AdminHeader } from '@/components/AdminHeader'
import toast from 'react-hot-toast'

const AdminDashboard = () => {
  const navigate = useNavigate()
  const [activeSidebarItem, setActiveSidebarItem] = useState('Dashboard')
  const [userCount, setUserCount] = useState(0)
  const [courtCount, setCourtCount] = useState(0)
  const [availableCourtCount, setAvailableCourtCount] = useState(0)
  const [dailyReservations, setDailyReservations] = useState(0)
  const [dailySales, setDailySales] = useState(0)
  const [dailyRacketRentals, setDailyRacketRentals] = useState(0)
  const [monthlyReservationData, setMonthlyReservationData] = useState<{ label: string; count: number; monthIndex: number }[]>([])
  const [maxMonthlyReservation, setMaxMonthlyReservation] = useState(0)
  const [yearlyReservationTotal, setYearlyReservationTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [recentReservations, setRecentReservations] = useState<any[]>([])
  const [todayUpcomingReservations, setTodayUpcomingReservations] = useState<any[]>([])

  // Format price for display
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2,
    }).format(price)
  }

  const extractReservationAmount = useCallback((reservation: any) => {
    if (!reservation) return 0

    const payments = Array.isArray(reservation.payments)
      ? reservation.payments.reduce((sum: number, payment: any) => {
          const amount = Number(payment?.amount ?? 0)
          return sum + (isNaN(amount) ? 0 : amount)
        }, 0)
      : 0

    if (payments > 0) {
      return payments
    }

    const possibleFields = [
      reservation.Total_Amount,
      reservation.total_amount,
      reservation.totalAmount,
      reservation.Total,
      reservation.amount,
      reservation.TotalAmount
    ]

    for (const field of possibleFields) {
      const numeric = Number(field)
      if (!isNaN(numeric) && numeric > 0) {
        return numeric
      }
    }

    return 0
  }, [])

  const calculateDailySalesFromReservations = useCallback((reservations: any[]) => {
    if (!Array.isArray(reservations)) return 0

    // Group reservations by transaction (same logic as Sales Report)
    // This prevents double-counting when multiple reservations share the same transaction
    const transactionMap = new Map<string, {
      reservations: any[]
      payments: any[]
      equipmentRentals: any[]
    }>()

    // First pass: Group reservations by transaction
    for (const reservation of reservations) {
      const status = reservation?.Status?.toLowerCase?.() ?? ''
      if (status === 'cancelled') {
        continue // Skip cancelled reservations (same as Sales Report)
      }

      // Use same transaction key logic as Sales Report
      let transactionKey = reservation.Reference_Number || reservation.Paymongo_Reference_Number
      
      // Fallback: Use payment transaction_id if available
      if (!transactionKey && reservation.payments && reservation.payments.length > 0) {
        transactionKey = reservation.payments[0]?.transaction_id
      }
      
      // Last resort: Unique key per reservation
      if (!transactionKey) {
        transactionKey = `${reservation.Reservation_Date}_${reservation.Start_Time}_${reservation.End_Time}_${reservation.Reservation_ID}`
      }

      if (!transactionMap.has(transactionKey)) {
        transactionMap.set(transactionKey, {
          reservations: [],
          payments: [],
          equipmentRentals: []
        })
      }

      const transaction = transactionMap.get(transactionKey)!
      transaction.reservations.push(reservation)
      
      // Collect payments (avoid duplicates)
      if (reservation.payments && Array.isArray(reservation.payments)) {
        for (const payment of reservation.payments) {
          const paymentId = payment?.transaction_id || payment?.id || `${payment?.amount}_${Date.now()}`
          if (!transaction.payments.find(p => (p?.transaction_id || p?.id) === paymentId)) {
            transaction.payments.push(payment)
          }
        }
      }
      
      // Collect equipment rentals
      const rentalsArray = Array.isArray(reservation.rentals)
        ? reservation.rentals
        : Array.isArray(reservation.equipmentRentals)
          ? reservation.equipmentRentals
          : []
      
      if (rentalsArray.length > 0) {
        transaction.equipmentRentals.push(...rentalsArray)
      }
    }

    // Second pass: Calculate total for each transaction (same as Sales Report)
    let totalSales = 0
    for (const [transactionKey, transaction] of transactionMap.entries()) {
      // Calculate transaction total amount
      // Priority 1: Sum of payment amounts (if payments exist)
      let transactionAmount = 0
      if (transaction.payments.length > 0) {
        transactionAmount = transaction.payments.reduce((sum: number, payment: any) => {
          const amount = Number(payment?.amount ?? 0)
          return sum + (isNaN(amount) ? 0 : amount)
        }, 0)
      }
      
      // Priority 2: Sum of Total_Amount from all reservations in transaction (if no payments)
      if (transactionAmount === 0) {
        transactionAmount = transaction.reservations.reduce((sum: number, res: any) => {
          const totalAmount = Number(res.Total_Amount ?? res.total_amount ?? res.totalAmount ?? 0)
          return sum + (isNaN(totalAmount) ? 0 : totalAmount)
        }, 0)
      }
      
      // Add equipment rental amounts (sum from all reservations in transaction)
      let equipmentRentalAmount = 0
      if (transaction.equipmentRentals.length > 0) {
        // Use Set to avoid double-counting same rental
        const uniqueRentals = new Map<string, any>()
        for (const rental of transaction.equipmentRentals) {
          const rentalId = rental?.id || `${rental?.total_amount}_${rental?.reservation_id}`
          if (!uniqueRentals.has(rentalId)) {
            uniqueRentals.set(rentalId, rental)
          }
        }
        
        equipmentRentalAmount = Array.from(uniqueRentals.values()).reduce((sum: number, rental: any) => {
          const rentalTotal = Number(rental?.total_amount ?? rental?.totalAmount ?? 0)
          return sum + (isNaN(rentalTotal) ? 0 : rentalTotal)
        }, 0)
      }
      
      // Total for this transaction = transaction amount + equipment rental amount
      totalSales += transactionAmount + equipmentRentalAmount
    }

    return totalSales
  }, [])

  const extractRacketRentalCount = useCallback((reservation: any) => {
    if (!reservation) return 0

    const rentalsArray = Array.isArray(reservation.rentals)
      ? reservation.rentals
      : Array.isArray(reservation.equipmentRentals)
        ? reservation.equipmentRentals
        : Array.isArray(reservation.equipment)
          ? reservation.equipment
          : []

    if (rentalsArray.length > 0) {
      const totalFromRentals = rentalsArray.reduce((sum: number, rental: any) => {
        // Check if rental has items array (nested structure from backend)
        if (Array.isArray(rental.items) && rental.items.length > 0) {
          const itemsTotal = rental.items.reduce((itemSum: number, item: any) => {
            const itemQuantity = Number(
              item?.quantity ??
              item?.Quantity ??
              item?.qty ??
              item?.count ??
              0
            )
            return itemSum + (isNaN(itemQuantity) ? 0 : itemQuantity)
          }, 0)
          return sum + itemsTotal
        }
        
        // Fallback: try to get quantity directly from rental
        const quantity = Number(
          rental?.quantity ??
          rental?.Quantity ??
          rental?.qty ??
          rental?.count ??
          0
        )
        return sum + (isNaN(quantity) ? 0 : quantity)
      }, 0)

      if (totalFromRentals > 0) {
        return totalFromRentals
      }
    }

    const possibleFields = [
      reservation.total_racket_rented,
      reservation.Total_Racket_Rented,
      reservation.racket_rented,
      reservation.racketRented,
      reservation.racket_count,
      reservation.racketCount,
      reservation.Racket_Count,
      reservation.equipment_quantity,
      reservation.equipmentQuantity,
      reservation.racket_quantity,
      reservation.Racket_Quantity
    ]

    for (const field of possibleFields) {
      const numeric = Number(field)
      if (!isNaN(numeric) && numeric > 0) {
        return numeric
      }
    }

    return 0
  }, [])

  const calculateDailyRacketRentals = useCallback(
    (reservations: any[]) => {
      // Calculate from reservations CREATED today
      if (!Array.isArray(reservations) || reservations.length === 0) {
        return 0
      }

      return reservations.reduce((sum, reservation) => {
        const status = reservation?.Status?.toLowerCase?.() ?? ''
        if (status === 'cancelled') {
          return sum
        }

        return sum + extractRacketRentalCount(reservation)
      }, 0)
    },
    [extractRacketRentalCount]
  )

  // Fetch dashboard data from API
  const fetchDashboardData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      
      console.log('Fetching dashboard data...')
      
      // Get today's date for daily data
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      // Fetch all data in parallel
      const [userCountData, courtCountData, availableCourtCountData, reservationsData] = await Promise.all([
        api.get('/users/count'),
        apiServices.getCourtCount(),
        apiServices.getAvailableCourtCount(),
        api.get('/reservations')
      ])
      
      // Calculate daily reservations (reservations created today) and monthly breakdown
      const monthsAccumulator = Array.from({ length: 12 }, () => 0)
      const currentYear = today.getFullYear()
      const safeReservations: any[] = Array.isArray(reservationsData.data) ? reservationsData.data : []

      // IMPORTANT: Filter by Created_at (when reservation was created) for daily dashboard metrics
      // This ensures "Daily Reservations" shows reservations created today, not bookings for today
      const todayReservations = safeReservations.filter((reservation: any) => {
        // Use Created_at as the primary source (when reservation was created)
        const createdDateValue = reservation.Created_at || reservation.created_at || reservation.Created_At
        if (!createdDateValue) return false
        
        const createdDate = new Date(createdDateValue)
        if (isNaN(createdDate.getTime())) return false
        createdDate.setHours(0, 0, 0, 0)

        // Track monthly data for all reservations in current year (use Reservation_Date for monthly chart)
        const reservationDateValue = reservation.Reservation_Date || reservation.reservation_date
        if (reservationDateValue) {
          const reservationDate = new Date(reservationDateValue)
          if (!isNaN(reservationDate.getTime()) && reservationDate.getFullYear() === currentYear) {
            const monthIndex = reservationDate.getMonth()
            monthsAccumulator[monthIndex] = (monthsAccumulator[monthIndex] || 0) + 1
          }
        }

        // Only include reservations created today
        return createdDate.getTime() === today.getTime()
      })
      
      // IMPORTANT: Calculate daily sales and racket rentals from reservations CREATED today
      // This ensures consistency with Daily Reservations count (all use Created_at)
      // Use todayReservations (filtered by Created_at = today) instead of sales report
      const finalDailySales = calculateDailySalesFromReservations(todayReservations)
      
      console.log('Daily Sales Calculation:', {
        todayReservationsCount: todayReservations.length,
        finalDailySales,
        reservationsWithAmount: todayReservations.filter((r: any) => {
          const amount = extractReservationAmount(r)
          return amount > 0
        }).length
      })
      
      // Calculate racket rentals from reservations CREATED today
      // IMPORTANT: Use todayReservations (filtered by Created_at = today)
      const totalDailyRacketRentals = calculateDailyRacketRentals(todayReservations)
      
      console.log('Daily Racket Rentals Calculation:', {
        todayReservationsCount: todayReservations.length,
        totalDailyRacketRentals,
        reservationsWithRentals: todayReservations.filter((r: any) => {
          const count = extractRacketRentalCount(r)
          return count > 0
        }).length
      })
      
      const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      const monthlyData = monthLabels.map((label, index) => ({
        label,
        count: monthsAccumulator[index] || 0,
        monthIndex: index
      }))
      const yearlyTotal = monthsAccumulator.reduce((sum, value) => sum + value, 0)
      
      console.log('Dashboard data response:', {
        userCount: userCountData.data,
        courtCount: courtCountData,
        availableCourtCount: availableCourtCountData,
        dailyReservations: todayReservations.length,
        dailySales: finalDailySales,
        monthlyData,
        yearlyTotal,
        totalDailyRacketRentals
      })
      
      setUserCount(userCountData.data)
      setCourtCount(courtCountData)
      setAvailableCourtCount(availableCourtCountData)
      setDailyReservations(todayReservations.length)
      setDailySales(finalDailySales)
      setDailyRacketRentals(totalDailyRacketRentals)
      setMonthlyReservationData(monthlyData)
      setMaxMonthlyReservation(Math.max(...monthsAccumulator, 0))
      setYearlyReservationTotal(yearlyTotal)
      
      // Get recent reservations (last 5, sorted by Created_at)
      const sortedByCreated = [...safeReservations].sort((a: any, b: any) => {
        const dateA = new Date(a.Created_at || a.created_at || 0).getTime()
        const dateB = new Date(b.Created_at || b.created_at || 0).getTime()
        return dateB - dateA
      })
      setRecentReservations(sortedByCreated.slice(0, 5))
      
      // Get today's upcoming reservations (reservations scheduled for today that haven't ended)
      const now = new Date()
      const todayStr = now.toISOString().split('T')[0]
      const todayUpcoming = safeReservations.filter((res: any) => {
        const resDate = res.Reservation_Date || res.reservation_date
        if (!resDate) return false
        
        const resDateStr = new Date(resDate).toISOString().split('T')[0]
        if (resDateStr !== todayStr) return false
        
        const status = (res.Status || res.status || '').toLowerCase()
        if (status === 'cancelled') return false
        
        // Check if reservation hasn't ended yet
        const endTime = res.End_Time || res.end_time
        if (!endTime) return true
        
        const [hours, minutes] = endTime.split(':').map(Number)
        const endDateTime = new Date(resDate)
        endDateTime.setHours(hours, minutes, 0, 0)
        
        return endDateTime > now
      }).sort((a: any, b: any) => {
        const timeA = (a.Start_Time || a.start_time || '').split(':').map(Number)
        const timeB = (b.Start_Time || b.start_time || '').split(':').map(Number)
        if (timeA[0] !== timeB[0]) return timeA[0] - timeB[0]
        return timeA[1] - timeB[1]
      })
      setTodayUpcomingReservations(todayUpcoming.slice(0, 5))
      
      setLoading(false)
      setRefreshing(false)
    } catch (error: any) {
      console.error('Error fetching dashboard data:', error)
      console.error('Error details:', error.response?.data)
      if (!isRefresh) {
        toast.error('Failed to load dashboard data. Please try again.')
      }
      setLoading(false)
      setRefreshing(false)
    }
  }, [calculateDailyRacketRentals, calculateDailySalesFromReservations])

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      // Defer the async work to prevent blocking the main thread
      setTimeout(() => {
        void fetchDashboardData(true)
      }, 0)
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [fetchDashboardData])

  useEffect(() => {
    let midnightTimer: ReturnType<typeof setTimeout>

    const scheduleMidnightRefresh = () => {
      const now = new Date()
      const nextMidnight = new Date(now)
      nextMidnight.setHours(24, 0, 0, 0)
      const msUntilMidnight = nextMidnight.getTime() - now.getTime()

      console.log(`[Dashboard] Midnight reset scheduled in ${Math.round(msUntilMidnight / 1000 / 60)} minutes`)

      midnightTimer = setTimeout(async () => {
        console.log('[Dashboard] Midnight reset triggered - Resetting daily metrics')
        setDailyReservations(0)
        setDailySales(0)
        setDailyRacketRentals(0)

        // Wait a moment to ensure state is reset, then fetch fresh data
        await new Promise(resolve => setTimeout(resolve, 100))
        await fetchDashboardData(true)
        
        console.log('[Dashboard] Fresh data fetched after midnight reset')
        scheduleMidnightRefresh() // Schedule next midnight
      }, Math.max(msUntilMidnight, 0))
    }

    scheduleMidnightRefresh()

    return () => {
      if (midnightTimer) {
        clearTimeout(midnightTimer)
      }
    }
  }, [fetchDashboardData])


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
          {/* Welcome Section */}
          <div className="mb-4 sm:mb-6 lg:mb-8">
            <div className="bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/30 rounded-2xl sm:rounded-3xl shadow-2xl border border-gray-200/60 p-4 sm:p-6 lg:p-8 xl:p-10 animate-slideDown backdrop-blur-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 sm:space-x-3 mb-3 sm:mb-4">
                    <div className="p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg flex-shrink-0">
                      <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-900 bg-clip-text text-transparent mb-1 sm:mb-2 break-words">
                        Welcome Admin!
                      </h1>
                      <p className="text-sm sm:text-base lg:text-lg text-gray-600 leading-relaxed">
                        Dashboard Overview - Manage your badminton court operations efficiently
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8 animate-fadeInUp">
            {/* Daily Court Reservation */}
            <div className="bg-gray-800 text-white p-4 sm:p-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:transform hover:scale-105 hover:-translate-y-1 group cursor-pointer">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-gray-300 text-xs sm:text-sm group-hover:text-gray-200 transition-colors truncate">Daily Court Reservation</p>
                  <div className="text-2xl sm:text-3xl font-bold group-hover:text-green-300 transition-colors">
                    {loading ? (
                      <div className="flex items-center space-x-1 sm:space-x-2 text-white">
                        <div className="animate-spin rounded-full h-4 w-4 sm:h-6 sm:w-6 border-b-2 border-white"></div>
                        <span className="text-sm sm:text-base">Loading...</span>
                      </div>
                    ) : (
                      <span>{dailyReservations}</span>
                    )}
                  </div>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-500 rounded-full flex items-center justify-center group-hover:bg-green-400 transition-colors group-hover:scale-110 flex-shrink-0">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                </div>
              </div>
            </div>

            {/* Number of Courts */}
            <div className="bg-gray-800 text-white p-4 sm:p-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:transform hover:scale-105 hover:-translate-y-1 group cursor-pointer">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-gray-300 text-xs sm:text-sm group-hover:text-gray-200 transition-colors truncate">Total Courts</p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        fetchDashboardData(true)
                      }}
                      className="text-gray-400 hover:text-white transition-colors flex-shrink-0"
                      disabled={refreshing}
                    >
                      <svg 
                        className={`w-3 h-3 sm:w-4 sm:h-4 ${refreshing ? 'animate-spin' : ''}`} 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </button>
                  </div>
                  <p className="text-2xl sm:text-3xl font-bold group-hover:text-red-300 transition-colors">
                    {loading ? '...' : courtCount}
                  </p>
                  <p className="text-gray-400 text-xs mt-1 truncate">
                    {loading ? '...' : `${availableCourtCount} available`}
                  </p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-500 rounded-full flex items-center justify-center group-hover:bg-red-400 transition-colors group-hover:scale-110 flex-shrink-0">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    {/* Badminton Court Icon */}
                    <rect x="2" y="6" width="20" height="12" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                    <line x1="12" y1="6" x2="12" y2="18" stroke="currentColor" strokeWidth="1.5"/>
                    <line x1="2" y1="12" x2="22" y2="12" stroke="currentColor" strokeWidth="1.5"/>
                    {/* Shuttlecocks */}
                    <circle cx="6" cy="9" r="1" fill="currentColor"/>
                    <circle cx="18" cy="9" r="1" fill="currentColor"/>
                    <circle cx="6" cy="15" r="1" fill="currentColor"/>
                    <circle cx="18" cy="15" r="1" fill="currentColor"/>
                    {/* Badminton Racket */}
                    <path d="M20 2L22 4L20 6" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                    <circle cx="21" cy="4" r="1.5" fill="currentColor"/>
                  </svg>
                </div>
              </div>
            </div>

            {/* Daily Sales */}
            <div className="bg-gray-800 text-white p-4 sm:p-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:transform hover:scale-105 hover:-translate-y-1 group cursor-pointer">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-gray-300 text-xs sm:text-sm group-hover:text-gray-200 transition-colors truncate">Daily Sales</p>
                  <div className="text-2xl sm:text-3xl font-bold group-hover:text-yellow-300 transition-colors">
                    {loading ? (
                      <div className="flex items-center space-x-1 sm:space-x-2 text-white">
                        <div className="animate-spin rounded-full h-4 w-4 sm:h-6 sm:w-6 border-b-2 border-white"></div>
                        <span className="text-sm sm:text-base">Loading...</span>
                      </div>
                    ) : (
                      <span>{formatPrice(dailySales)}</span>
                    )}
                  </div>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-500 rounded-full flex items-center justify-center group-hover:bg-yellow-500 transition-colors group-hover:scale-110 flex-shrink-0">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                </div>
              </div>
            </div>

            {/* Total Users */}
            <div className="bg-gray-800 text-white p-4 sm:p-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:transform hover:scale-105 hover:-translate-y-1 group cursor-pointer">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-gray-300 text-xs sm:text-sm group-hover:text-gray-200 transition-colors truncate">Total Users</p>
                  <div className="text-2xl sm:text-3xl font-bold group-hover:text-blue-300 transition-colors">
                    {loading ? (
                      <div className="flex items-center space-x-1 sm:space-x-2 text-white">
                        <div className="animate-spin rounded-full h-4 w-4 sm:h-6 sm:w-6 border-b-2 border-white"></div>
                        <span className="text-sm sm:text-base">Loading...</span>
                      </div>
                    ) : (
                      <span>{userCount}</span>
                    )}
                  </div>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-500 rounded-full flex items-center justify-center group-hover:bg-blue-500 transition-colors group-hover:scale-110 flex-shrink-0">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2.5l-2.54-7.63A1.5 1.5 0 0 0 18.54 8H17c-.8 0-1.54.37-2.01.99L14 10.5V22h2v-6h2v6h2zM12.5 11.5c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5S11 9.17 11 10s.67 1.5 1.5 1.5zM5.5 6c1.11 0 2-.89 2-2s-.89-2-2-2-2 .89-2 2 .89 2 2 2zm2 16v-7H9l-2.5-7.5A1.5 1.5 0 0 0 5.04 8H3.5c-.8 0-1.54.37-2.01.99L1 10.5V22h2v-6h2v6h2z"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8 animate-fadeInUp">
            {/* Monthly Overview Chart */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white via-blue-50 to-indigo-100 p-6 sm:p-8 shadow-lg transition-all duration-500 hover:shadow-2xl">
              <div className="absolute inset-x-0 -top-32 h-64 bg-gradient-to-b from-blue-200/60 to-transparent blur-3xl"></div>
              <div className="absolute -bottom-20 -right-10 h-48 w-48 rounded-full bg-blue-200/40 blur-2xl"></div>
              <div className="relative z-10">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
                  <div>
                    <p className="text-sm uppercase tracking-[0.35em] text-blue-500/80">Monthly Overview</p>
                    <h3 className="text-2xl font-semibold text-slate-800">Reservation Trends</h3>
                    <p className="text-sm text-slate-500 mt-1">
                      Tracking confirmed reservations for {new Date().getFullYear()}.
                    </p>
                  </div>
                  <div className="flex items-center gap-3 bg-white/90 px-4 py-2 rounded-full shadow-sm ring-1 ring-blue-100">
                    <div className="text-left">
                      <p className="text-xs uppercase tracking-[0.25em] text-blue-500">Total</p>
                      <p className="text-lg font-semibold text-slate-800">{yearlyReservationTotal}</p>
                    </div>
                    <div className="h-10 w-px bg-gradient-to-b from-transparent via-blue-200 to-transparent"></div>
                    <div className="text-left">
                      <p className="text-xs uppercase tracking-[0.25em] text-blue-500">Average</p>
                      <p className="text-lg font-semibold text-slate-800">
                        {monthlyReservationData.length > 0
                          ? Math.round(
                              monthlyReservationData.reduce((sum, item) => sum + item.count, 0) /
                                monthlyReservationData.length
                            )
                          : 0}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="relative mt-4">
                  {/* Chart Container with Grid Background */}
                  <div className="relative bg-white/50 rounded-2xl p-4 sm:p-6 border border-blue-100/50">
                    {/* Y-axis grid lines */}
                    <div className="absolute inset-0 flex flex-col justify-between p-4 sm:p-6 pointer-events-none">
                      {[0, 1, 2, 3, 4].map((i) => (
                        <div key={i} className="border-t border-blue-100/40"></div>
                      ))}
                    </div>
                    
                    {/* Chart Bars */}
                    <div className="relative flex items-end gap-2 sm:gap-3 h-52 sm:h-64 px-2 sm:px-4">
                      {monthlyReservationData.map(({ label, count }, index) => {
                        const maxValue = Math.max(maxMonthlyReservation, 1)
                        const heightPercentage = maxValue > 0 ? Math.max(8, (count / maxValue) * 90) : 8
                        const isCurrentMonth = new Date().getMonth() === index
                        return (
                          <div key={label} className="relative flex-1 min-w-[2rem] sm:min-w-[2.5rem] flex flex-col items-center">
                            {/* Current Month Badge - Positioned above the chart area */}
                            {isCurrentMonth && (
                              <div className="absolute -top-12 sm:-top-14 inset-x-0 flex justify-center z-20">
                                <span className="inline-flex items-center gap-1 rounded-full bg-blue-600 px-2.5 py-1 text-[10px] font-bold text-white shadow-md ring-2 ring-blue-200">
                                  Current
                                </span>
                              </div>
                            )}
                            
                            {/* Bar Container */}
                            <div className="relative w-full h-full flex flex-col justify-end">
                              {/* Bar */}
                              <div
                                className={`group relative w-full rounded-t-lg bg-gradient-to-t ${
                                  isCurrentMonth 
                                    ? 'from-blue-600 via-blue-500 to-blue-400 shadow-lg shadow-blue-500/50' 
                                    : 'from-blue-400/70 via-blue-300/70 to-blue-400/50'
                                } transition-all duration-500 hover:shadow-xl hover:scale-105 cursor-pointer border-2 ${
                                  isCurrentMonth ? 'border-blue-600' : 'border-blue-300/50'
                                }`}
                                style={{ height: `${heightPercentage}%`, minHeight: '8px' }}
                              >
                                {/* Value label on hover */}
                                <div className="absolute inset-x-0 -top-10 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                                  <div className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white shadow-lg whitespace-nowrap">
                                    {count}
                                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full">
                                      <div className="border-4 border-transparent border-t-blue-600"></div>
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Bar value display (always visible if > 0) */}
                                {count > 0 && (
                                  <div className="absolute inset-x-0 -top-6 flex justify-center">
                                    <span className="text-xs font-semibold text-blue-700 opacity-0 group-hover:opacity-100 transition-opacity">
                                      {count}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {/* Month Label */}
                            <div className="mt-3 text-center">
                              <div className={`text-xs sm:text-sm font-semibold uppercase tracking-wider ${
                                isCurrentMonth ? 'text-blue-600' : 'text-slate-500'
                              }`}>
                                {label}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                      {monthlyReservationData.length === 0 && (
                        <div className="flex h-full w-full items-center justify-center absolute inset-0">
                          <p className="text-sm text-slate-500">No reservation data recorded for this year yet.</p>
                        </div>
                      )}
                    </div>
                    
                    {/* X-axis label */}
                    <div className="mt-2 text-center">
                      <p className="text-xs text-slate-400 uppercase tracking-wider">Months</p>
                    </div>
                  </div>
                  <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {monthlyReservationData
                      .filter((item) => item.count > 0)
                      .slice(0, 4)
                      .map(({ label, count }) => (
                        <div
                          key={`summary-${label}`}
                          className="flex items-center gap-3 rounded-2xl bg-white/90 px-3 py-2 shadow-sm ring-1 ring-blue-100"
                        >
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/10 text-sm font-semibold text-blue-600">
                            {count}
                          </span>
                          <div>
                            <p className="text-xs uppercase tracking-[0.2em] text-blue-400">Reservations</p>
                            <p className="text-sm font-semibold text-slate-700">{label}</p>
                          </div>
                  </div>
                ))}
              </div>
            </div>
                </div>
              </div>
              
            {/* Daily Racket Rented */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-500/10 via-white to-indigo-100/30 p-6 sm:p-8 shadow-lg transition-all duration-500 hover:shadow-2xl">
              <div className="absolute -right-24 -top-24 h-56 w-56 rounded-full bg-emerald-400/30 blur-3xl"></div>
              <div className="absolute -left-20 bottom-0 h-44 w-44 rounded-full bg-indigo-300/20 blur-2xl"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-sm uppercase tracking-[0.3em] text-emerald-600/90">Daily</p>
                    <h3 className="text-xl sm:text-2xl font-semibold text-slate-800">Racket Rentals</h3>
                  </div>
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-xs font-medium text-slate-600 shadow-sm ring-1 ring-emerald-200">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    Live Update
                  </span>
                </div>
                <div className="flex flex-col items-center justify-center gap-4 py-4">
                  <div className="relative flex h-44 w-44 items-center justify-center">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-emerald-300/20 to-emerald-500/40 blur-md"></div>
                    <svg className="h-full w-full" viewBox="0 0 120 120">
                      <defs>
                        <linearGradient id="racketGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#22c55e" />
                          <stop offset="100%" stopColor="#0ea5e9" />
                        </linearGradient>
                      </defs>
                      {(() => {
                        const circumference = 2 * Math.PI * 52
                        const clampedValue = Math.min(Math.max(dailyRacketRentals, 0), 100)
                        const progress = circumference - (clampedValue / 100) * circumference
                        return (
                          <>
                            <circle
                              cx="60"
                              cy="60"
                              r="52"
                              fill="none"
                              stroke="rgba(34,197,94,0.15)"
                              strokeWidth="10"
                            ></circle>
                            <circle
                              cx="60"
                              cy="60"
                              r="52"
                              fill="none"
                              stroke="url(#racketGradient)"
                              strokeWidth="10"
                              strokeLinecap="round"
                              strokeDasharray={circumference}
                              strokeDashoffset={progress}
                              className="transition-all duration-700 ease-out"
                            ></circle>
                          </>
                        )
                      })()}
                    </svg>
                    <div className="absolute inset-4 flex flex-col items-center justify-center rounded-full bg-white/80 text-center shadow-inner">
                      <div className="text-4xl font-bold text-slate-800">{dailyRacketRentals}</div>
                      <p className="text-xs font-medium uppercase tracking-[0.2em] text-emerald-500">Rackets Rented</p>
                      <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-semibold text-emerald-600">
                        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M3 3h18M3 7h18M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z"></path>
                          <path d="M14 15l-3 3l-2-2"></path>
                        </svg>
                        {dailyReservations} bookings
                      </span>
                    </div>
                  </div>
                  <div className="text-center text-sm text-slate-600">
                    Tracking all rackets rented today across confirmed reservations.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity & Today's Schedule */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
            {/* Recent Reservations */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 sm:p-8 animate-fadeInUp">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Recent Reservations</h2>
                </div>
                <button
                  onClick={() => navigate('/admin/create-reservations')}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  View All →
                </button>
              </div>
              <div className="space-y-3">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : recentReservations.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <svg className="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p>No recent reservations</p>
                  </div>
                ) : (
                  recentReservations.map((res: any) => {
                    const courtName = res.court?.Court_Name || res.Court_Name || 'N/A'
                    const customerName = res.user?.Name || res.user?.name || 'Guest'
                    const date = res.Reservation_Date || res.reservation_date
                    const time = `${res.Start_Time || res.start_time || ''} - ${res.End_Time || res.end_time || ''}`
                    const status = (res.Status || res.status || '').toLowerCase()
                    const createdDate = new Date(res.Created_at || res.created_at || Date.now())
                    const timeAgo = Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60))
                    
                    return (
                      <div
                        key={res.Reservation_ID || res.id}
                        className="p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200 cursor-pointer"
                        onClick={() => navigate('/admin/create-reservations')}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-gray-900 truncate">{customerName}</span>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                status === 'confirmed' ? 'bg-green-100 text-green-700' :
                                status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {status}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-1">
                              <span className="font-medium">{courtName}</span> • {date ? new Date(date).toLocaleDateString() : 'N/A'}
                            </p>
                            <p className="text-xs text-gray-500">{time}</p>
                          </div>
                          <div className="text-right ml-4">
                            <p className="text-xs text-gray-400">
                              {timeAgo < 60 ? `${timeAgo}m ago` : `${Math.floor(timeAgo / 60)}h ago`}
                            </p>
                            <p className="text-sm font-semibold text-blue-600 mt-1">
                              {formatPrice(extractReservationAmount(res))}
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>

            {/* Today's Upcoming Reservations */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 sm:p-8 animate-fadeInUp">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Today's Schedule</h2>
                </div>
                <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                  {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </span>
              </div>
              <div className="space-y-3">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                  </div>
                ) : todayUpcomingReservations.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <svg className="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p>No upcoming reservations today</p>
                  </div>
                ) : (
                  todayUpcomingReservations.map((res: any) => {
                    const courtName = res.court?.Court_Name || res.Court_Name || 'N/A'
                    const customerName = res.user?.Name || res.user?.name || 'Guest'
                    const startTime = res.Start_Time || res.start_time || ''
                    const endTime = res.End_Time || res.end_time || ''
                    const [startHour, startMin] = startTime.split(':').map(Number)
                    const [endHour, endMin] = endTime.split(':').map(Number)
                    const now = new Date()
                    const startDateTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), startHour, startMin)
                    const endDateTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), endHour, endMin)
                    const isUpcoming = startDateTime > now
                    const isOngoing = now >= startDateTime && now < endDateTime
                    
                    return (
                      <div
                        key={res.Reservation_ID || res.id}
                        className={`p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer ${
                          isOngoing 
                            ? 'bg-emerald-50 border-emerald-300 shadow-md' 
                            : 'bg-gradient-to-r from-gray-50 to-white border-gray-200 hover:border-emerald-300 hover:shadow-md'
                        }`}
                        onClick={() => navigate('/admin/create-reservations')}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-gray-900 truncate">{customerName}</span>
                              {isOngoing && (
                                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500 text-white animate-pulse">
                                  Ongoing
                                </span>
                              )}
                              {isUpcoming && (
                                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500 text-white">
                                  Upcoming
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mb-1">
                              <span className="font-medium">{courtName}</span>
                            </p>
                            <p className="text-sm font-medium text-emerald-600">
                              {startTime} - {endTime}
                            </p>
                          </div>
                          <div className="text-right ml-4">
                            <p className="text-sm font-semibold text-emerald-600">
                              {formatPrice(extractReservationAmount(res))}
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default AdminDashboard