import { useState, useEffect } from 'react'
import { AdminLayout } from '@/components/AdminLayout'
import api from '@/lib/api'

const AdminViewSuggestions = () => {
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(5)
  const [selectedSuggestion, setSelectedSuggestion] = useState<any>(null)
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(true)

  // Fetch suggestions from backend
  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        setLoading(true)
        const response = await api.get('/suggestions')
        
        // Transform backend data to match frontend format
        const formattedSuggestions = response.data.map((suggestion: any) => {
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
            fullMessage: suggestion.message
          }
        })
        
        setSuggestions(formattedSuggestions)
      } catch (error: any) {
        console.error('Error fetching suggestions:', error)
        setSuggestions([])
      } finally {
        setLoading(false)
      }
    }

    fetchSuggestions()
  }, [])


  const handleViewSuggestion = (suggestion: any) => {
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
    <AdminLayout activeSidebarItem="View Suggestions">
      <div className="p-4 sm:p-6 lg:p-8 overflow-x-hidden bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
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

          {/* Messages Table */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
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
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-600 text-white">
                      <tr>
                        <th className="px-6 py-6 text-left text-sm font-bold uppercase tracking-wider">ID</th>
                        <th className="px-6 py-6 text-left text-sm font-bold uppercase tracking-wider">User</th>
                        <th className="px-6 py-6 text-left text-sm font-bold uppercase tracking-wider">Date</th>
                        <th className="px-6 py-6 text-left text-sm font-bold uppercase tracking-wider">Time</th>
                        <th className="px-6 py-6 text-left text-sm font-bold uppercase tracking-wider">Message</th>
                        <th className="px-6 py-6 text-center text-sm font-bold uppercase tracking-wider">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {currentSuggestions.map((suggestion, index) => (
                        <tr key={suggestion.id} className={`hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-300 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                          <td className="px-6 py-6 text-sm font-bold text-gray-900">{suggestion.id}</td>
                          <td className="px-6 py-6 text-sm font-semibold text-gray-800">{suggestion.user}</td>
                          <td className="px-6 py-6 text-sm text-gray-600">{suggestion.date}</td>
                          <td className="px-6 py-6 text-sm text-gray-600">{suggestion.time}</td>
                          <td className="px-6 py-6 text-sm text-gray-700 max-w-xs truncate">{suggestion.message}</td>
                          <td className="px-6 py-6 text-center">
                            <div className="flex justify-center space-x-2">
                              <button
                                onClick={() => handleViewSuggestion(suggestion)}
                                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
                              >
                                View
                              </button>
                              <button
                                onClick={() => handleDeleteSuggestion(suggestion.id)}
                                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 flex items-center space-x-1"
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
    </AdminLayout>
  )
}

export default AdminViewSuggestions
