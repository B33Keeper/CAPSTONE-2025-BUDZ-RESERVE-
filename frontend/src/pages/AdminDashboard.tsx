import { useState, useEffect } from 'react'
import { AdminLayout } from '@/components/AdminLayout'
import api from '@/lib/api'
import { apiServices } from '@/lib/apiServices'

const AdminDashboard = () => {
  const [userCount, setUserCount] = useState(0)
  const [courtCount, setCourtCount] = useState(0)
  const [availableCourtCount, setAvailableCourtCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Fetch dashboard data from API
  const fetchDashboardData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      
      console.log('Fetching dashboard data...')
      
      // Fetch all data in parallel
      const [userCountData, courtCountData, availableCourtCountData] = await Promise.all([
        api.get('/users/count'),
        apiServices.getCourtCount(),
        apiServices.getAvailableCourtCount()
      ])
      
      console.log('Dashboard data response:', {
        userCount: userCountData.data,
        courtCount: courtCountData,
        availableCourtCount: availableCourtCountData
      })
      
      setUserCount(userCountData.data)
      setCourtCount(courtCountData)
      setAvailableCourtCount(availableCourtCountData)
      setLoading(false)
      setRefreshing(false)
    } catch (error: any) {
      console.error('Error fetching dashboard data:', error)
      console.error('Error details:', error.response?.data)
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchDashboardData(true)
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [])

  return (
    <AdminLayout activeSidebarItem="Dashboard">
      <div className="p-4 sm:p-6 lg:p-8 overflow-x-hidden bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 sm:p-8">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-6 lg:space-y-0">
              <div className="flex-1">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-3">
                  Welcome Admin!
                </h1>
                <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
                  Dashboard Overview - Manage your badminton court operations efficiently
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* Daily Reservation */}
          <div className="bg-gray-800 text-white p-4 sm:p-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:transform hover:scale-105 hover:-translate-y-1 group cursor-pointer">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-gray-300 text-xs sm:text-sm group-hover:text-gray-200 transition-colors truncate">Daily Reservation</p>
                <p className="text-2xl sm:text-3xl font-bold group-hover:text-green-300 transition-colors">120</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-500 rounded-full flex items-center justify-center group-hover:bg-green-400 transition-colors group-hover:scale-110 flex-shrink-0">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                  <path d="M10 12l2 2 4-4m-6 4l-2-2 2-2 2 2-2 2z" fill="white"/>
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
                <p className="text-2xl sm:text-3xl font-bold group-hover:text-yellow-300 transition-colors">₱5,863.00</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-500 rounded-full flex items-center justify-center group-hover:bg-yellow-500 transition-colors group-hover:scale-110 flex-shrink-0">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  <path d="M12 6l-2 2 2 2 2-2-2-2zm0 8l-2 2 2 2 2-2-2-2z" fill="white"/>
                </svg>
              </div>
            </div>
          </div>

          {/* Total Users */}
          <div className="bg-gray-800 text-white p-4 sm:p-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:transform hover:scale-105 hover:-translate-y-1 group cursor-pointer">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-gray-300 text-xs sm:text-sm group-hover:text-gray-200 transition-colors truncate">Total Users</p>
                <p className="text-2xl sm:text-3xl font-bold group-hover:text-blue-300 transition-colors">
                  {loading ? (
                    <div className="flex items-center space-x-1 sm:space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 sm:h-6 sm:w-6 border-b-2 border-white"></div>
                      <span className="text-sm sm:text-base">Loading...</span>
                    </div>
                  ) : (
                    `${userCount}`
                  )}
                </p>
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Monthly Overview Chart */}
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm hover:shadow-lg transition-all duration-300 hover:transform hover:scale-105">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-3 sm:mb-4">Monthly Overview</h3>
            <div className="h-48 sm:h-64 flex items-end justify-between space-x-1 overflow-x-auto">
              {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((month) => (
                <div key={month} className="flex flex-col items-center flex-1 group min-w-0">
                  <div className="relative">
                    <div 
                      className="bg-gradient-to-t from-blue-500 to-blue-400 w-4 sm:w-6 rounded-t hover:from-blue-600 hover:to-blue-500 transition-all duration-300 cursor-pointer group-hover:scale-110"
                      style={{ height: `${Math.random() * 120 + 20}px` }}
                    ></div>
                    {/* Dotted lines extending from top of bars */}
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-px h-full border-l-2 border-dotted border-gray-400 group-hover:border-blue-400 transition-colors"></div>
                    {/* Tooltip on hover */}
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap z-10">
                      {Math.floor(Math.random() * 100 + 50)} reservations
                    </div>
                  </div>
                  <span className="text-xs text-gray-600 mt-2 group-hover:text-gray-800 transition-colors">{month}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Pie Chart */}
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm hover:shadow-lg transition-all duration-300 hover:transform hover:scale-105">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-3 sm:mb-4">Reservation Status</h3>
            
            {/* Legend */}
            <div className="flex justify-center space-x-4 sm:space-x-6 mb-3 sm:mb-4">
              <div className="flex items-center space-x-2 group cursor-pointer">
                <div className="w-3 h-3 sm:w-4 sm:h-4 bg-green-300 rounded group-hover:bg-green-400 transition-colors"></div>
                <span className="text-xs sm:text-sm text-gray-600 group-hover:text-gray-800 transition-colors">Reservation</span>
              </div>
              <div className="flex items-center space-x-2 group cursor-pointer">
                <div className="w-3 h-3 sm:w-4 sm:h-4 bg-red-300 rounded group-hover:bg-red-400 transition-colors"></div>
                <span className="text-xs sm:text-sm text-gray-600 group-hover:text-gray-800 transition-colors">Canceled</span>
              </div>
            </div>
            
            <div className="flex items-center justify-center">
              <div className="relative w-32 h-32 sm:w-48 sm:h-48 hover:scale-110 transition-transform duration-300 cursor-pointer">
                {/* Pie Chart Circle */}
                <div className="absolute inset-0 rounded-full border-4 sm:border-8 border-green-300 hover:border-green-400 transition-colors"></div>
                <div className="absolute inset-0 rounded-full border-4 sm:border-8 border-red-300 transform rotate-45 hover:border-red-400 transition-colors"></div>
                
                {/* Center Text */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-lg sm:text-2xl font-bold hover:text-green-600 transition-colors">120</div>
                    <div className="text-xs sm:text-sm text-gray-600 hover:text-gray-800 transition-colors">Reservation</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}

export default AdminDashboard
