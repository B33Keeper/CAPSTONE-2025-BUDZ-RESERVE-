import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import api from '@/lib/api'

interface EquipmentRental {
  equipmentName: string
  quantity: number
  hours: number
}

interface SalesReportItem {
  reservationId: number
  customerName: string
  courtName: string
  time: string
  date: string
  paymentMethod: string
  price: number
  status: 'completed' | 'cancelled'
  equipmentRentals?: EquipmentRental[]
}

interface SalesReportSummary {
  totalReservations: number
  totalIncome: number
  totalCancellations: number
}

const AdminSalesReport = () => {
  const [showUserDropdown, setShowUserDropdown] = useState(false)
  const [activeSidebarItem, setActiveSidebarItem] = useState('Sales Report')
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'>('daily')
  const [salesData, setSalesData] = useState<SalesReportItem[]>([])
  const [summary, setSummary] = useState<SalesReportSummary>({ totalReservations: 0, totalIncome: 0, totalCancellations: 0 })
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [searchQuery, setSearchQuery] = useState('')
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Helper function to format role
  const formatRole = (role?: string) => {
    if (!role) return 'User'
    return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase()
  }

  const handleDownload = () => {
    // TODO: Implement download functionality
    console.log('Download report')
  }

  const handlePeriodChange = (period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly') => {
    setSelectedPeriod(period)
  }

  const periods = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'quarterly', label: 'Quarterly' },
    { value: 'yearly', label: 'Yearly' },
  ]

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  // Close dropdowns when clicking outside
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

  // Fetch sales report data
  const fetchSalesReport = async (period: string) => {
    try {
      setLoading(true)
      console.log(`[SalesReport] Fetching sales report for period: ${period}`)
      const response = await api.get(`/payments/sales-report?period=${period}`)
      console.log(`[SalesReport] Response:`, response.data)
      if (response.data) {
        setSalesData(response.data.data || [])
        setSummary(response.data.summary || { totalReservations: 0, totalIncome: 0, totalCancellations: 0 })
        setCurrentPage(1) // Reset to first page when changing period
      }
    } catch (error: any) {
      console.error('Error fetching sales report:', error)
      console.error('Error details:', error.response?.data || error.message)
      setSalesData([])
      setSummary({ totalReservations: 0, totalIncome: 0, totalCancellations: 0 })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSalesReport(selectedPeriod)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPeriod])

  const sidebarItems = [
    { id: 'Dashboard', icon: 'grid', label: 'Dashboard' },
    { id: 'Manage Courts', icon: 'calendar', label: 'Manage Courts' },
    { id: 'Manage Rackets', icon: 'racket', label: 'Manage Rackets' },
    { id: 'Sales Report', icon: 'chart', label: 'Sales Report' },
    { id: 'Create Reservations', icon: 'document', label: 'Create Reservations' },
    { id: 'View Suggestions', icon: 'envelope', label: 'View Suggestions' },
    { id: 'Upload photo', icon: 'picture', label: 'Upload photo' }
  ]

  // Pagination
  // Filter data by search query
  const filteredData = salesData.filter(item => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      item.customerName.toLowerCase().includes(query) ||
      item.courtName.toLowerCase().includes(query) ||
      item.paymentMethod.toLowerCase().includes(query) ||
      item.time.toLowerCase().includes(query) ||
      item.date.toLowerCase().includes(query)
    )
  })

  const totalPages = Math.ceil(filteredData.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentData = filteredData.slice(startIndex, endIndex)

  // Update pagination when data changes
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1)
    }
  }, [filteredData, currentPage, totalPages])

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2,
    }).format(price)
  }

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
        * {
          scrollbar-width: thin;
          scrollbar-color: #cbd5e1 #f1f5f9;
        }
      ` }} />
      
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40 overflow-visible backdrop-blur-sm bg-white/95">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 overflow-visible">
          <div className="flex justify-between items-center h-14 sm:h-16 relative">
            <div className="flex items-center">
              <img 
                src="/assets/icons/BBC ICON.png" 
                alt="BBC Logo" 
                className="h-12 w-12 sm:h-16 sm:w-16 lg:h-24 lg:w-24 object-contain hover:scale-105 transition-transform duration-200" 
              />
            </div>

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
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden bg-gray-50 min-h-screen animate-fadeIn">
          {/* Sales Report Header Card */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-6 animate-slideDown">
            <h1 className="text-5xl font-bold text-gray-900 mb-2">Sales Report</h1>
            <p className="text-lg text-gray-600">Track revenue, reservations, and performance metrics.</p>
          </div>

          {/* Controls Section - Outside the header card */}
          <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
            {/* Download Report Button - Left */}
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium transition-all duration-200 hover:scale-105 shadow-sm hover:shadow-md"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download Report
            </button>

            {/* Period Segmented Buttons - Centered */}
            <div className="flex-1 flex justify-center">
              <div className="flex items-center gap-0 bg-white border border-gray-300 rounded-md p-0.5">
                {periods.map((period) => (
                  <button
                    key={period.value}
                    onClick={() => handlePeriodChange(period.value as any)}
                    className={`px-4 py-2 rounded-md font-medium text-sm transition-all duration-200 ${
                      selectedPeriod === period.value
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {period.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Search Bar - Right */}
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search sales data..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
              />
              <svg 
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Sales Report Table */}
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden animate-fadeInUp">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Loading sales report...</span>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b-2 border-gray-200">
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">CUSTOMER</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">COURT #</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">TIME</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">DATE</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">PAYMENT</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">RACKET RENT / DURATION</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">PRICE</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredData.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                            No sales data available for the selected period
                          </td>
                        </tr>
                      ) : (
                        currentData.map((item, index) => (
                          <tr 
                            key={item.reservationId} 
                            className={`border-b border-gray-100 transition-all duration-200 hover:bg-blue-50 ${
                              index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                            } animate-slideIn`}
                            style={{ animationDelay: `${index * 50}ms` }}
                          >
                            <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.customerName}</td>
                            <td className="px-6 py-4 text-sm text-gray-700">{item.courtName}</td>
                            <td className="px-6 py-4 text-sm text-gray-700">{item.time}</td>
                            <td className="px-6 py-4 text-sm text-gray-700">{item.date}</td>
                            <td className="px-6 py-4 text-sm font-medium text-green-600">{item.paymentMethod}</td>
                            <td className="px-6 py-4 text-sm text-gray-700">
                              {item.equipmentRentals && item.equipmentRentals.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                  {item.equipmentRentals.slice(0, 2).map((rental, idx) => (
                                    <div key={idx} className="flex items-center gap-2">
                                      <span>{rental.equipmentName}</span>
                                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-blue-100 text-blue-700 text-xs font-medium animate-pulse-slow">
                                        {rental.hours}h
                                      </span>
                                    </div>
                                  ))}
                                  {item.equipmentRentals.length > 2 && (
                                    <span className="text-xs text-gray-500">+{item.equipmentRentals.length - 2} more</span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-gray-400">None</span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-sm font-semibold text-green-600">
                              ₱{formatPrice(item.price)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-end px-4 py-3 border-t border-gray-200">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <span className="mx-4 text-sm text-gray-700">
                      Page {currentPage} out of {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                )}

                {/* Summary Statistics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 px-4 py-4 border-t border-gray-200 bg-gray-50">
                  <div className="bg-white px-4 py-3 rounded-lg border border-gray-200 shadow-sm">
                    <div className="text-sm text-gray-600 mb-1">Total Reservations</div>
                    <div className="text-2xl font-bold text-gray-900">{summary.totalReservations}</div>
                  </div>
                  <div className="bg-white px-4 py-3 rounded-lg border border-gray-200 shadow-sm">
                    <div className="text-sm text-gray-600 mb-1">Total Income</div>
                    <div className="text-2xl font-bold text-green-600">{formatPrice(summary.totalIncome)}</div>
                  </div>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

export default AdminSalesReport

