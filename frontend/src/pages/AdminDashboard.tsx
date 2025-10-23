import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import api from '@/lib/api'
import { apiServices } from '@/lib/apiServices'

const AdminDashboard = () => {
  const [showUserDropdown, setShowUserDropdown] = useState(false)
  const [activeSidebarItem, setActiveSidebarItem] = useState('Dashboard')
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [userCount, setUserCount] = useState(0)
  const [courtCount, setCourtCount] = useState(0)
  const [availableCourtCount, setAvailableCourtCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const navigate = useNavigate()
  const { logout } = useAuthStore()
  const dropdownRef = useRef<HTMLDivElement>(null)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

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

  const sidebarItems = [
    { id: 'Dashboard', icon: 'grid', label: 'Dashboard' },
    { id: 'Manage Courts', icon: 'calendar', label: 'Manage Courts' },
    { id: 'Manage Rackets', icon: 'racket', label: 'Manage Rackets' },
    { id: 'Sales Report', icon: 'chart', label: 'Sales Report' },
    { id: 'Create Reservations', icon: 'document', label: 'Create Reservations' },
    { id: 'View Suggestions', icon: 'envelope', label: 'View Suggestions' },
    { id: 'Upload photo', icon: 'picture', label: 'Upload photo' }
  ]

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
                    src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face"
                    alt="Profile"
                    className="w-6 h-6 sm:w-8 sm:h-8 rounded-full object-cover"
                  />
                  <div className="text-left hidden sm:block">
                    <div className="text-xs sm:text-sm font-medium text-gray-900">James Harden</div>
                    <div className="text-xs text-gray-500">Administrator</div>
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

      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Main Content with Sidebar */}
      <div className="flex">
        {/* Desktop Sidebar */}
        <div 
          className={`hidden lg:block bg-white shadow-sm border-r border-gray-200 transition-all duration-300 ease-in-out sticky top-0 h-screen overflow-y-auto ${
            isSidebarExpanded ? 'w-64' : 'w-16'
          } hover:shadow-lg`}
          style={{ backgroundColor: 'white' }}
          onMouseEnter={() => setIsSidebarExpanded(true)}
          onMouseLeave={() => setIsSidebarExpanded(false)}
        >
          {/* Navigation Items */}
          <nav className="px-2 py-8 space-y-2">
            {sidebarItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  if (item.id === 'Dashboard') {
                    navigate('/admin')
                  } else if (item.id === 'Manage Courts') {
                    navigate('/admin/manage-courts')
                  } else if (item.id === 'Manage Rackets') {
                    navigate('/admin/manage-rackets')
                  } else if (item.id === 'Sales Report') {
                    navigate('/admin/sales-report')
                  } else if (item.id === 'Create Reservations') {
                    navigate('/admin/create-reservations')
                  } else if (item.id === 'View Suggestions') {
                    navigate('/admin/view-suggestions')
                  } else if (item.id === 'Upload photo') {
                    navigate('/admin/upload-photo')
                  }
                  setActiveSidebarItem(item.id)
                }}
                className={`w-full flex items-center ${
                  isSidebarExpanded ? 'space-x-3 px-4' : 'justify-center px-2'
                } py-3 rounded-lg text-left transition-all duration-300 ease-in-out group ${
                  activeSidebarItem === item.id
                    ? 'bg-blue-100 text-blue-700 shadow-md transform scale-105'
                    : 'text-gray-600 hover:bg-gray-100 hover:shadow-sm hover:transform hover:scale-105'
                }`}
              >
                <div className="w-6 h-6 flex items-center justify-center">
                  {item.icon === 'grid' && (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M3 3h7v7H3V3zm0 11h7v7H3v-7zm11 0h7v7h-7v-7zm0-11h7v7h-7V3z"/>
                    </svg>
                  )}
                  {item.icon === 'calendar' && (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
                      <circle cx="16" cy="12" r="1"/>
                    </svg>
                  )}
                  {item.icon === 'racket' && (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                      <path d="M12 6l-2 2 2 2 2-2-2-2zm0 8l-2 2 2 2 2-2-2-2z"/>
                    </svg>
                  )}
                  {item.icon === 'chart' && (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M5 9.2h3V19H5zM10.6 5h2.8v14h-2.8zm5.6 8H19v6h-2.8z"/>
                      <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z"/>
                    </svg>
                  )}
                  {item.icon === 'document' && (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                      <path d="M8 12h8v2H8V12zm0 4h8v2H8V16z"/>
                    </svg>
                  )}
                  {item.icon === 'envelope' && (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                    </svg>
                  )}
                  {item.icon === 'picture' && (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                      <path d="M21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3V5h18v14z"/>
                    </svg>
                  )}
                </div>
                <span className={`font-medium transition-all duration-200 ${
                  isSidebarExpanded ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'
                }`}>
                  {item.label}
                </span>
              </button>
            ))}
          </nav>
        </div>

        {/* Mobile Sidebar */}
        <div className={`fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-sm border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:hidden ${
          isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`} style={{ backgroundColor: 'white' }}>
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">Menu</h2>
            <button
              onClick={() => setIsMobileSidebarOpen(false)}
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <nav className="px-4 py-6 space-y-2">
            {sidebarItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  if (item.id === 'Dashboard') {
                    navigate('/admin')
                  } else if (item.id === 'Manage Courts') {
                    navigate('/admin/manage-courts')
                  } else if (item.id === 'Manage Rackets') {
                    navigate('/admin/manage-rackets')
                  } else if (item.id === 'Sales Report') {
                    navigate('/admin/sales-report')
                  } else if (item.id === 'Create Reservations') {
                    navigate('/admin/create-reservations')
                  } else if (item.id === 'View Suggestions') {
                    navigate('/admin/view-suggestions')
                  } else if (item.id === 'Upload photo') {
                    navigate('/admin/upload-photo')
                  }
                  setActiveSidebarItem(item.id)
                  setIsMobileSidebarOpen(false)
                }}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all duration-200 ${
                  activeSidebarItem === item.id
                    ? 'bg-blue-100 text-blue-700 shadow-md'
                    : 'text-gray-600 hover:bg-gray-100 hover:shadow-sm'
                }`}
              >
                <div className="w-6 h-6 flex items-center justify-center">
                  {item.icon === 'grid' && (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M3 3h7v7H3V3zm0 11h7v7H3v-7zm11 0h7v7h-7v-7zm0-11h7v7h-7V3z"/>
                    </svg>
                  )}
                  {item.icon === 'calendar' && (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
                      <circle cx="16" cy="12" r="1"/>
                    </svg>
                  )}
                  {item.icon === 'racket' && (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                      <path d="M12 6l-2 2 2 2 2-2-2-2zm0 8l-2 2 2 2 2-2-2-2z"/>
                    </svg>
                  )}
                  {item.icon === 'chart' && (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M5 9.2h3V19H5zM10.6 5h2.8v14h-2.8zm5.6 8H19v6h-2.8z"/>
                      <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z"/>
                    </svg>
                  )}
                  {item.icon === 'document' && (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                      <path d="M8 12h8v2H8V12zm0 4h8v2H8V16z"/>
                    </svg>
                  )}
                  {item.icon === 'envelope' && (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                    </svg>
                  )}
                  {item.icon === 'picture' && (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                      <path d="M21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3V5h18v14z"/>
                    </svg>
                  )}
                </div>
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Mobile Menu Button */}
        <div className="lg:hidden">
          <button
            onClick={() => setIsMobileSidebarOpen(true)}
            className="fixed top-4 left-4 z-40 p-2 rounded-md bg-white shadow-sm border border-gray-200 text-gray-600 hover:bg-gray-100"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
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
        </main>
      </div>
    </div>
  )
}

export default AdminDashboard