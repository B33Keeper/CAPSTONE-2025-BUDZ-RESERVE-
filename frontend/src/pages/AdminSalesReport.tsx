import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

interface RacketRent {
  brand: string
  model: string
  duration: number // hours
}

interface SalesData {
  id: number
  customer: string
  court: string
  time: string
  date: string
  paymentMethod: string
  price: number
  status: 'confirmed' | 'cancelled'
  racketRent?: RacketRent | null
}

const AdminSalesReport = () => {
  const [showUserDropdown, setShowUserDropdown] = useState(false)
  const [activeSidebarItem, setActiveSidebarItem] = useState('Sales Report')
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [filterPeriod, setFilterPeriod] = useState('Daily')
  const [salesData, setSalesData] = useState<SalesData[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const { logout } = useAuthStore()
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Mock sales data
  const mockSalesData: SalesData[] = [
    { id: 1, customer: 'Snoop Dog', court: 'Court 1', time: '6:00pm-7:00pm', date: 'March.24,2025', paymentMethod: 'G-Cash', price: 250, status: 'confirmed', racketRent: { brand: 'Yonex', model: 'Astrox 99', duration: 1 } },
    { id: 2, customer: 'Jhayvot G.', court: 'Court 4', time: '4:00pm-5:00pm', date: 'March.24,2025', paymentMethod: 'G-Cash', price: 250, status: 'confirmed', racketRent: null },
    { id: 3, customer: 'Al James', court: 'Court 6', time: '3:00pm-4:00pm', date: 'March.24,2025', paymentMethod: 'G-Cash', price: 250, status: 'confirmed', racketRent: { brand: 'Victor', model: 'Thruster F', duration: 1 } },
    { id: 4, customer: 'Haring M.', court: 'Court 3', time: '2:00pm-3:00pm', date: 'March.24,2025', paymentMethod: 'G-Cash', price: 125, status: 'cancelled', racketRent: null },
    { id: 5, customer: 'Hev Abi', court: 'Court 2', time: '11:00am-10:00am', date: 'March.24,2025', paymentMethod: 'G-Cash', price: 250, status: 'confirmed', racketRent: { brand: 'Li-Ning', model: 'N9 II', duration: 2 } },
    { id: 6, customer: 'Shanti D.', court: 'Court 7', time: '9:00am-10:00am', date: 'March.24,2025', paymentMethod: 'G-Cash', price: 250, status: 'confirmed', racketRent: null },
    { id: 7, customer: 'Lebron J.', court: 'Court 11', time: '8:00am-9:00am', date: 'March.24,2025', paymentMethod: 'G-Cash', price: 250, status: 'confirmed', racketRent: { brand: 'Wilson', model: 'Pro Staff', duration: 1 } },
    { id: 8, customer: 'Billy Jean', court: 'Court 10', time: '7:00am-8:00am', date: 'March.24,2025', paymentMethod: 'G-Cash', price: 250, status: 'confirmed', racketRent: null },
    { id: 9, customer: 'Daniel C.', court: 'Court 5', time: '5:00pm-6:00pm', date: 'March.24,2025', paymentMethod: 'G-Cash', price: 250, status: 'confirmed', racketRent: { brand: 'Babolat', model: 'Pure Drive', duration: 1 } },
    { id: 10, customer: 'Arthur N.', court: 'Court 8', time: '1:00pm-2:00pm', date: 'March.24,2025', paymentMethod: 'G-Cash', price: 250, status: 'confirmed', racketRent: null },
    { id: 11, customer: 'John Doe', court: 'Court 1', time: '10:00am-11:00am', date: 'March.24,2025', paymentMethod: 'G-Cash', price: 250, status: 'confirmed', racketRent: { brand: 'Head', model: 'Graphene 360', duration: 1 } },
    { id: 12, customer: 'Jane Smith', court: 'Court 2', time: '12:00pm-1:00pm', date: 'March.24,2025', paymentMethod: 'G-Cash', price: 250, status: 'confirmed', racketRent: null },
    { id: 13, customer: 'Mike Johnson', court: 'Court 3', time: '7:00pm-8:00pm', date: 'March.24,2025', paymentMethod: 'G-Cash', price: 250, status: 'confirmed', racketRent: { brand: 'Dunlop', model: 'Biomimetic', duration: 1 } },
    { id: 14, customer: 'Sarah Wilson', court: 'Court 4', time: '8:00pm-9:00pm', date: 'March.24,2025', paymentMethod: 'G-Cash', price: 250, status: 'confirmed', racketRent: null },
    { id: 15, customer: 'David Brown', court: 'Court 5', time: '9:00pm-10:00pm', date: 'March.24,2025', paymentMethod: 'G-Cash', price: 250, status: 'confirmed', racketRent: { brand: 'Prince', model: 'Textreme', duration: 1 } },
    { id: 16, customer: 'Lisa Davis', court: 'Court 6', time: '10:00am-11:00am', date: 'March.24,2025', paymentMethod: 'G-Cash', price: 250, status: 'confirmed', racketRent: null },
    { id: 17, customer: 'Tom Miller', court: 'Court 7', time: '11:00am-12:00pm', date: 'March.24,2025', paymentMethod: 'G-Cash', price: 250, status: 'confirmed', racketRent: { brand: 'Technifibre', model: 'T-Fight', duration: 1 } },
    { id: 18, customer: 'Anna Garcia', court: 'Court 8', time: '1:00pm-2:00pm', date: 'March.24,2025', paymentMethod: 'G-Cash', price: 250, status: 'confirmed', racketRent: null },
    { id: 19, customer: 'Chris Lee', court: 'Court 9', time: '3:00pm-4:00pm', date: 'March.24,2025', paymentMethod: 'G-Cash', price: 250, status: 'confirmed', racketRent: { brand: 'Volkl', model: 'Organix', duration: 1 } },
    { id: 20, customer: 'Emma Taylor', court: 'Court 10', time: '4:00pm-5:00pm', date: 'March.24,2025', paymentMethod: 'G-Cash', price: 250, status: 'confirmed', racketRent: null },
    { id: 21, customer: 'Ryan Clark', court: 'Court 11', time: '5:00pm-6:00pm', date: 'March.24,2025', paymentMethod: 'G-Cash', price: 250, status: 'confirmed', racketRent: { brand: 'ProKennex', model: 'Ki Q+', duration: 1 } }
  ]

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

  // Load sales data
  useEffect(() => {
    setLoading(true)
    // Simulate API call
    setTimeout(() => {
      setSalesData(mockSalesData)
      setLoading(false)
    }, 1000)
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

  // Calculate statistics
  const totalReservations = salesData.length
  const totalIncome = salesData.reduce((sum, item) => sum + item.price, 0)
  const cancellations = salesData.filter(item => item.status === 'cancelled').length

  // Pagination
  const totalPages = Math.ceil(salesData.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentData = salesData.slice(startIndex, endIndex)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleDownload = () => {
    // Implement download functionality
    console.log('Downloading sales report...')
  }

  const handleFilter = () => {
    // Implement filter functionality
    console.log('Filtering sales report...')
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
                    : 'text-gray-600 hover:bg-gray-100'
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

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
        
        {/* Header */}
        <div className="mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsMobileSidebarOpen(true)}
                className="lg:hidden p-3 rounded-xl bg-white shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900">
                  Sales Report
                </h1>
                <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
                  Track revenue, reservations, and performance metrics
                </p>
              </div>
            </div>
          </div>
          
        </div>

        {/* Controls Row */}
        <div className="mt-8 mb-6 flex justify-between items-center">
          {/* Download Button */}
          <button className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 hover:shadow-lg hover:scale-105 active:scale-95">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="font-medium">Download Report</span>
          </button>

          {/* Period Selector */}
          <div className="flex items-center space-x-1 bg-white p-1 rounded-xl shadow-lg border border-gray-200">
            <button
              onClick={() => setFilterPeriod('Daily')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                filterPeriod === 'Daily' 
                  ? 'bg-blue-500 text-white shadow-lg' 
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
              }`}
            >
              Daily
            </button>
            <button
              onClick={() => setFilterPeriod('Weekly')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                filterPeriod === 'Weekly' 
                  ? 'bg-blue-500 text-white shadow-lg' 
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
              }`}
            >
              Weekly
            </button>
            <button
              onClick={() => setFilterPeriod('Monthly')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                filterPeriod === 'Monthly' 
                  ? 'bg-blue-500 text-white shadow-lg' 
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setFilterPeriod('Quarterly')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                filterPeriod === 'Quarterly' 
                  ? 'bg-blue-500 text-white shadow-lg' 
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
              }`}
            >
              Quarterly
            </button>
            <button
              onClick={() => setFilterPeriod('Yearly')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                filterPeriod === 'Yearly' 
                  ? 'bg-blue-500 text-white shadow-lg' 
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
              }`}
            >
              Yearly
            </button>
          </div>

          {/* Search Field */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search sales data..."
              className="pl-10 pr-4 py-2 w-64 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
            />
          </div>
        </div>

        {/* Sales Report Table */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200 hover:shadow-3xl transition-shadow duration-300">
          <div>
            <table className="w-full table-fixed">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  <th className="px-2 py-4 text-center text-xs font-bold uppercase tracking-wider text-gray-600 w-[14%]">Customer</th>
                  <th className="px-2 py-4 text-center text-xs font-bold uppercase tracking-wider text-gray-600 w-[12%]">Court #</th>
                  <th className="px-2 py-4 text-center text-xs font-bold uppercase tracking-wider text-gray-600 w-[14%]">Time</th>
                  <th className="px-2 py-4 text-center text-xs font-bold uppercase tracking-wider text-gray-600 w-[12%]">Date</th>
                  <th className="px-2 py-4 text-center text-xs font-bold uppercase tracking-wider text-gray-600 w-[12%]">Payment</th>
                  <th className="px-2 py-4 text-center text-xs font-bold uppercase tracking-wider text-gray-600 w-[18%]">Racket Rent / Duration</th>
                  <th className="px-2 py-4 text-center text-xs font-bold uppercase tracking-wider text-gray-600 w-[10%]">Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center space-y-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <p className="text-gray-500 text-sm">Loading sales data...</p>
                      </div>
                    </td>
                  </tr>
                ) : currentData.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center space-y-4">
                        <div className="text-gray-400 text-4xl">📊</div>
                        <p className="text-gray-500 text-sm">No sales data found</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  currentData.map((item, index) => (
                    <tr key={item.id} className={`hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-200 transform hover:scale-[1.01] ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                      <td className="px-2 py-4 text-sm font-semibold text-gray-900 text-center truncate">{item.customer}</td>
                      <td className="px-2 py-4 text-sm text-gray-600 font-medium text-center">{item.court}</td>
                      <td className="px-2 py-4 text-sm text-gray-600 text-center truncate">{item.time}</td>
                      <td className="px-2 py-4 text-sm text-gray-600 text-center truncate">{item.date}</td>
                      <td className="px-2 py-4 text-sm text-center">
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {item.paymentMethod}
                        </span>
                      </td>
                      <td className="px-2 py-4 text-center">
                        <div className="text-sm text-gray-600">
                          {item.racketRent ? (
                            <div className="flex flex-col items-center space-y-1">
                              <div className="flex items-center space-x-1">
                                <span className="font-bold text-gray-900 text-xs truncate">{item.racketRent.brand} {item.racketRent.model}</span>
                                <span className="text-xs bg-blue-500 text-white px-1.5 py-0.5 rounded-full font-medium">
                                  {item.racketRent.duration}h
                                </span>
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">None</span>
                          )}
                        </div>
                      </td>
                      <td className="px-2 py-4 text-sm text-center">
                        <span className="text-sm font-bold text-green-600">
                          ₱{item.price.toFixed(2)}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-6 flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
            <div className="text-sm text-gray-700 font-medium">
              Showing <span className="font-bold text-blue-600">{startIndex + 1}</span> to <span className="font-bold text-blue-600">{Math.min(endIndex, salesData.length)}</span> of <span className="font-bold text-blue-600">{salesData.length}</span> results
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-4 py-2 rounded-xl bg-white border border-gray-300 text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center space-x-2 shadow-md hover:shadow-lg"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="text-sm font-medium">Previous</span>
              </button>
              
              <div className="flex items-center space-x-2">
                <span className="px-4 py-2 text-sm font-bold text-gray-700 bg-white rounded-xl shadow-md">
                  Page {currentPage} of {totalPages}
                </span>
              </div>
              
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-4 py-2 rounded-xl bg-white border border-gray-300 text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center space-x-2 shadow-md hover:shadow-lg"
              >
                <span className="text-sm font-medium">Next</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Summary Statistics */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl shadow-xl p-6 border border-blue-200 hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-blue-700">Total Reservations</p>
                <p className="text-3xl font-bold text-blue-900">{totalReservations}</p>
                <p className="text-xs text-blue-600 mt-1">Active bookings</p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl shadow-xl p-6 border border-green-200 hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-green-700">Total Income</p>
                <p className="text-3xl font-bold text-green-900">₱{totalIncome.toFixed(2)}</p>
                <p className="text-xs text-green-600 mt-1">Revenue generated</p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-2xl shadow-xl p-6 border border-red-200 hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-red-700">Cancellations</p>
                <p className="text-3xl font-bold text-red-900">{cancellations}</p>
                <p className="text-xs text-red-600 mt-1">Cancelled bookings</p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </main>
      </div>
    </div>
  )
}

export default AdminSalesReport
