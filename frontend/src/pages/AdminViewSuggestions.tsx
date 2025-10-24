import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'

const AdminViewSuggestions = () => {
  const [showUserDropdown, setShowUserDropdown] = useState(false)
  const [activeSidebarItem, setActiveSidebarItem] = useState('View Suggestions')
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(5)
  const [selectedSuggestion, setSelectedSuggestion] = useState<any>(null)
  const [showModal, setShowModal] = useState(false)
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

  // Fetch suggestions from API
  const fetchSuggestions = async () => {
    try {
      setLoading(true)
      const response = await api.get('/suggestions')
      const suggestionsData = response.data.map((suggestion: any) => ({
        id: suggestion.id,
        user: suggestion.user_name,
        date: new Date(suggestion.created_at).toLocaleDateString('en-US', {
          month: 'numeric',
          day: 'numeric',
          year: '2-digit'
        }),
        time: new Date(suggestion.created_at).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        }),
        message: suggestion.message.length > 30 ? suggestion.message.substring(0, 30) + '...' : suggestion.message,
        fullMessage: suggestion.message
      }))
      setSuggestions(suggestionsData)
    } catch (error) {
      console.error('Error fetching suggestions:', error)
      toast.error('Failed to load suggestions')
    } finally {
      setLoading(false)
    }
  }

  // Delete suggestion
  const handleDeleteSuggestion = async (id: number) => {
    try {
      await api.delete(`/suggestions/${id}`)
      toast.success('Suggestion deleted successfully')
      fetchSuggestions() // Refresh the list
    } catch (error) {
      console.error('Error deleting suggestion:', error)
      toast.error('Failed to delete suggestion')
    }
  }

  // Fetch suggestions on component mount
  useEffect(() => {
    fetchSuggestions()
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

  const handleViewSuggestion = (suggestion: any) => {
    setSelectedSuggestion(suggestion)
    setShowModal(true)
  }


  const closeModal = () => {
    setShowModal(false)
    setSelectedSuggestion(null)
  }

  const totalPages = Math.ceil(suggestions.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentSuggestions = suggestions.slice(startIndex, endIndex)

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
          {/* Header Section */}
          <div className="mb-8">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 sm:p-8">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-6 lg:space-y-0">
                <div className="flex-1">
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-3">
                    Messages
                  </h1>
                  <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
                    View and manage user suggestions and feedback messages
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Messages Table - Mobile Responsive */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-600 text-white">
                  <tr>
                    <th className="px-3 sm:px-6 py-4 sm:py-6 text-left text-xs sm:text-sm font-bold uppercase tracking-wider">ID</th>
                    <th className="px-3 sm:px-6 py-4 sm:py-6 text-left text-xs sm:text-sm font-bold uppercase tracking-wider">User</th>
                    <th className="px-3 sm:px-6 py-4 sm:py-6 text-left text-xs sm:text-sm font-bold uppercase tracking-wider">Date</th>
                    <th className="px-3 sm:px-6 py-4 sm:py-6 text-left text-xs sm:text-sm font-bold uppercase tracking-wider">Time</th>
                    <th className="px-3 sm:px-6 py-4 sm:py-6 text-left text-xs sm:text-sm font-bold uppercase tracking-wider">Message</th>
                    <th className="px-3 sm:px-6 py-4 sm:py-6 text-center text-xs sm:text-sm font-bold uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center justify-center space-y-4">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                          <p className="text-gray-500 text-sm">Loading suggestions...</p>
                        </div>
                      </td>
                    </tr>
                  ) : currentSuggestions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center justify-center space-y-4">
                          <div className="text-gray-400 text-4xl">📝</div>
                          <p className="text-gray-500 text-sm">No suggestions found</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    currentSuggestions.map((suggestion, index) => (
                    <tr key={suggestion.id} className={`hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-300 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                      <td className="px-3 sm:px-6 py-4 sm:py-6 text-xs sm:text-sm font-bold text-gray-900">{suggestion.id}</td>
                      <td className="px-3 sm:px-6 py-4 sm:py-6 text-xs sm:text-sm font-semibold text-gray-800">{suggestion.user}</td>
                      <td className="px-3 sm:px-6 py-4 sm:py-6 text-xs sm:text-sm text-gray-600">{suggestion.date}</td>
                      <td className="px-3 sm:px-6 py-4 sm:py-6 text-xs sm:text-sm text-gray-600">{suggestion.time}</td>
                      <td className="px-3 sm:px-6 py-4 sm:py-6 text-xs sm:text-sm text-gray-700 max-w-xs truncate">{suggestion.message}</td>
                      <td className="px-3 sm:px-6 py-4 sm:py-6 text-center">
                        <div className="flex flex-col sm:flex-row justify-center space-y-2 sm:space-y-0 sm:space-x-2">
                          <button
                            onClick={() => handleViewSuggestion(suggestion)}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
                          >
                            View
                          </button>
                          <button
                            onClick={() => handleDeleteSuggestion(suggestion.id)}
                            className="bg-red-500 hover:bg-red-600 text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 flex items-center justify-center space-x-1"
                          >
                            <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            <span>Delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination - Mobile Responsive */}
            <div className="bg-gray-50 px-4 sm:px-6 py-4 flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
              <div className="text-xs sm:text-sm text-gray-600">
                Page {currentPage} out of {totalPages}
              </div>
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg bg-white text-gray-500 hover:text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <span className="px-3 sm:px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg text-xs sm:text-sm font-medium shadow-sm">
                  Page {currentPage} of {totalPages}
                </span>
                <button 
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg bg-white text-gray-500 hover:text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* View Message Modal - Mobile Responsive */}
      {showModal && selectedSuggestion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
            {/* Modal Header - Mobile Responsive */}
            <div className="p-4 sm:p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Message Details</h2>
            </div>

            {/* Modal Content - Mobile Responsive */}
            <div className="p-4 sm:p-6">
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">User</label>
                    <p className="text-base sm:text-lg font-semibold text-gray-900">{selectedSuggestion.user}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date & Time</label>
                    <p className="text-base sm:text-lg font-semibold text-gray-900">{selectedSuggestion.date} at {selectedSuggestion.time}</p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Message</label>
                  <div className="bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200">
                    <p className="text-sm sm:text-base text-gray-800 leading-relaxed">{selectedSuggestion.fullMessage}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer - Mobile Responsive */}
            <div className="p-4 sm:p-6 border-t border-gray-200 flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3">
              <button
                onClick={closeModal}
                className="px-4 sm:px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium text-sm sm:text-base"
              >
                Close
              </button>
              <button
                onClick={() => {
                  handleDeleteSuggestion(selectedSuggestion.id)
                  closeModal()
                }}
                className="px-4 sm:px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium text-sm sm:text-base"
              >
                Delete Message
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminViewSuggestions
