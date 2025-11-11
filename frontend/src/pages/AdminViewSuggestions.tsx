import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import api from '@/lib/api'
import AdminSidebar from '@/components/AdminSidebar'
import AdminFooter from '@/components/AdminFooter'

interface Suggestion {
  id: number
  user: string
  date: string
  time: string
  message: string
  fullMessage: string
  created_at: string
}

const AdminViewSuggestions = () => {
  const [showUserDropdown, setShowUserDropdown] = useState(false)
  const [activeSidebarItem, setActiveSidebarItem] = useState('View Suggestions')
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [selectedSuggestion, setSelectedSuggestion] = useState<Suggestion | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Helper function to format role
  const formatRole = (role?: string) => {
    if (!role) return 'User'
    return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase()
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  // Fetch suggestions from backend
  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        setLoading(true)
        const response = await api.get('/suggestions')
        
        // Transform backend data to match frontend format
        const formattedSuggestions: Suggestion[] = response.data.map((suggestion: any) => {
          const date = new Date(suggestion.created_at)
          const formattedDate = date.toLocaleDateString('en-US', {
            month: 'numeric',
            day: 'numeric',
            year: '2-digit'
          })
          const formattedTime = date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          })
          
          return {
            id: suggestion.id,
            user: suggestion.user?.name || suggestion.name,
            date: formattedDate,
            time: formattedTime,
            message: suggestion.message.length > 30 
              ? suggestion.message.substring(0, 30) + '...' 
              : suggestion.message,
            fullMessage: suggestion.message,
            created_at: suggestion.created_at // Preserve original date for sorting
          }
        })
        
        // Sort suggestions by created_at in ascending order (oldest first, latest at bottom)
        const sortedSuggestions = formattedSuggestions.sort((a: Suggestion, b: Suggestion) => {
          const dateA = new Date(a.created_at).getTime()
          const dateB = new Date(b.created_at).getTime()
          return dateA - dateB // Ascending order (oldest first)
        })
        
        setSuggestions(sortedSuggestions)
      } catch (error: any) {
        console.error('Error fetching suggestions:', error)
        setSuggestions([])
      } finally {
        setLoading(false)
      }
    }

    fetchSuggestions()
  }, [])

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


  const handleViewSuggestion = (suggestion: Suggestion) => {
    setSelectedSuggestion(suggestion)
    setShowModal(true)
  }

  const handleDeleteSuggestion = async (id: number) => {
    if (!confirm('Are you sure you want to delete this suggestion?')) {
      return
    }

    try {
      await api.delete(`/suggestions/${id}`)
      setSuggestions(suggestions.filter(suggestion => suggestion.id !== id))
      
      // If modal is open and showing this suggestion, close it
      if (selectedSuggestion?.id === id) {
        closeModal()
      }
    } catch (error: any) {
      console.error('Error deleting suggestion:', error)
      alert('Failed to delete suggestion. Please try again.')
    }
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

      {/* Main Content with Sidebar */}
      <div className="flex">
        <AdminSidebar activeItem={activeSidebarItem} onItemChange={setActiveSidebarItem} />

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen animate-fadeIn">
          {/* Header Section */}
          <div className="mb-8">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 sm:p-8 animate-slideDown">
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

          {/* Messages Table */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200 w-full animate-fadeInUp">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
                <span className="text-gray-600">Loading suggestions...</span>
              </div>
            ) : suggestions.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">No suggestions available</p>
              </div>
            ) : (
              <>
                <div className="hidden md:block overflow-x-auto w-full">
                  <table className="w-full table-auto">
                    <colgroup>
                      <col className="w-[16.67%]" />
                      <col className="w-[16.67%]" />
                      <col className="w-[16.67%]" />
                      <col className="w-[16.67%]" />
                      <col className="w-[16.67%]" />
                      <col className="w-[16.67%]" />
                    </colgroup>
                    <thead className="bg-gray-600 text-white">
                      <tr>
                        <th className="px-6 py-4 text-center text-sm font-bold uppercase tracking-wider">ID</th>
                        <th className="px-6 py-4 text-center text-sm font-bold uppercase tracking-wider">User</th>
                        <th className="px-6 py-4 text-center text-sm font-bold uppercase tracking-wider">Date</th>
                        <th className="px-6 py-4 text-center text-sm font-bold uppercase tracking-wider">Time</th>
                        <th className="px-6 py-4 text-center text-sm font-bold uppercase tracking-wider">Message</th>
                        <th className="px-6 py-4 text-center text-sm font-bold uppercase tracking-wider">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {currentSuggestions.map((suggestion, index) => (
                        <tr key={suggestion.id} className={`hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-300 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                          <td className="px-6 py-4 text-sm font-bold text-gray-900 align-middle text-center">{suggestion.id}</td>
                          <td className="px-6 py-4 text-sm font-semibold text-gray-800 truncate align-middle text-center">{suggestion.user}</td>
                          <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap align-middle text-center">{suggestion.date}</td>
                          <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap align-middle text-center">{suggestion.time}</td>
                          <td className="px-6 py-4 text-sm text-gray-700 truncate align-middle text-center" title={suggestion.fullMessage || suggestion.message}>{suggestion.message}</td>
                          <td className="px-6 py-4 text-center align-middle">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleViewSuggestion(suggestion)}
                                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 whitespace-nowrap"
                              >
                                View
                              </button>
                              <button
                                onClick={() => handleDeleteSuggestion(suggestion.id)}
                                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 flex items-center justify-center gap-1 whitespace-nowrap"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                <span>Delete</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="md:hidden space-y-4 px-4 py-6 bg-gray-50">
                  {currentSuggestions.map((suggestion) => (
                    <div
                      key={suggestion.id}
                      className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-all duration-200 hover:shadow-lg"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold uppercase tracking-widest text-blue-500">
                          #{suggestion.id}
                        </span>
                        <span className="text-xs font-medium text-gray-500">
                          {suggestion.date} • {suggestion.time}
                        </span>
                      </div>
                      <h3 className="text-base font-semibold text-gray-900 mb-2">{suggestion.user}</h3>
                      <p className="text-sm text-gray-600 mb-4">{suggestion.message}</p>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <button
                          onClick={() => handleViewSuggestion(suggestion)}
                          className="w-full sm:w-auto bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-[1.02]"
                        >
                          View Message
                        </button>
                        <button
                          onClick={() => handleDeleteSuggestion(suggestion.id)}
                          className="w-full sm:w-auto bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-[1.02] flex items-center justify-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {suggestions.length > 0 && (
                  <div className="bg-gray-50 px-6 py-4 flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
                    <div className="text-sm text-gray-600">
                      Page {currentPage} out of {totalPages}
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
                      <span className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg text-sm font-medium shadow-sm">
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
              </>
            )}
          </div>
        </main>
      </div>

      {/* View Message Modal */}
      {showModal && selectedSuggestion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <h2 className="text-2xl font-bold text-gray-900">Message Details</h2>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">User</label>
                    <p className="text-lg font-semibold text-gray-900">{selectedSuggestion.user}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date & Time</label>
                    <p className="text-lg font-semibold text-gray-900">{selectedSuggestion.date} at {selectedSuggestion.time}</p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Message</label>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <p className="text-gray-800 leading-relaxed">{selectedSuggestion.fullMessage}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={closeModal}
                className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
              >
                Close
              </button>
              <button
                onClick={() => {
                  handleDeleteSuggestion(selectedSuggestion.id)
                  closeModal()
                }}
                className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
              >
                Delete Message
              </button>
            </div>
          </div>
        </div>
      )}
      <AdminFooter />
    </div>
  )
}

export default AdminViewSuggestions
