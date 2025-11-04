import { useState, useEffect } from 'react'
import { AdminLayout } from '@/components/AdminLayout'
import { apiServices, Court } from '@/lib/apiServices'
import api from '@/lib/api'

const AdminManageCourts = () => {
  console.log('[AdminManageCourts] Component rendering...')
  
  const [courts, setCourts] = useState<Court[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(8)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newCourt, setNewCourt] = useState({
    Court_Name: '',
    Status: 'Available' as 'Available' | 'Maintenance' | 'Unavailable',
    Price: 250
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  console.log('[AdminManageCourts] State initialized:', { loading, error, courtsCount: courts.length })

  // Fetch courts from API
  useEffect(() => {
    const fetchCourts = async () => {
      try {
        setLoading(true)
        setError(null)
        console.log('[AdminManageCourts] Fetching courts...')
        const courtsData = await apiServices.getCourts()
        console.log('[AdminManageCourts] Courts data received:', courtsData)
        // Sort courts by ID to ensure proper order and ensure Price is a number
        const sortedCourts = courtsData.map(court => ({
          ...court,
          Price: Number(court.Price) || 0 // Ensure Price is always a number
        })).sort((a, b) => a.Court_Id - b.Court_Id)
        setCourts(sortedCourts)
        console.log('[AdminManageCourts] Courts set successfully:', sortedCourts.length)
      } catch (error: any) {
        console.error('[AdminManageCourts] Error fetching courts:', error)
        console.error('[AdminManageCourts] Error details:', error.response?.data || error.message)
        setError('Failed to load courts. Please try again.')
        setCourts([])
      } finally {
        setLoading(false)
        console.log('[AdminManageCourts] Loading set to false')
      }
    }

    fetchCourts()
  }, [])


  const handleStatusChange = async (courtId: number, newStatus: string) => {
    try {
      await api.patch(`/courts/${courtId}`, { Status: newStatus })
      setCourts(courts.map(court => 
        court.Court_Id === courtId ? { ...court, Status: newStatus as any } : court
      ))
    } catch (error: any) {
      console.error('Error updating court status:', error)
      alert('Failed to update court status. Please try again.')
    }
  }

  const handleDeleteCourt = async (courtId: number) => {
    if (!confirm('Are you sure you want to delete this court?')) {
      return
    }

    try {
      await api.delete(`/courts/${courtId}`)
      setCourts(courts.filter(court => court.Court_Id !== courtId))
    } catch (error: any) {
      console.error('Error deleting court:', error)
      alert('Failed to delete court. Please try again.')
    }
  }

  const handleEditCourt = (courtId: number) => {
    // TODO: Implement edit functionality
    console.log('Edit court:', courtId)
  }

  const handleAddCourt = () => {
    setShowAddModal(true)
    setNewCourt({
      Court_Name: '',
      Status: 'Available',
      Price: 250
    })
  }

  const handleCloseAddModal = () => {
    setShowAddModal(false)
    setNewCourt({
      Court_Name: '',
      Status: 'Available',
      Price: 250
    })
  }

  const handleSubmitNewCourt = async () => {
    if (!newCourt.Court_Name.trim()) {
      alert('Please enter a court name')
      return
    }

    try {
      setIsSubmitting(true)
      const response = await api.post('/courts', {
        Court_Name: newCourt.Court_Name.trim(),
        Status: newCourt.Status,
        Price: Number(newCourt.Price) || 0
      })

      console.log('[AdminManageCourts] Court created:', response.data)
      
      // Refresh the courts list
      const courtsData = await apiServices.getCourts()
      const sortedCourts = courtsData.map(court => ({
        ...court,
        Price: Number(court.Price) || 0
      })).sort((a, b) => a.Court_Id - b.Court_Id)
      setCourts(sortedCourts)
      
      handleCloseAddModal()
      alert('Court added successfully!')
    } catch (error: any) {
      console.error('[AdminManageCourts] Error creating court:', error)
      alert(error.response?.data?.message || 'Failed to add court. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Pagination logic
  const totalPages = Math.ceil(courts.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentCourts = courts.slice(startIndex, endIndex)

  console.log('[AdminManageCourts] Rendering with:', { loading, error, courtsCount: courts.length, totalPages, currentPage })

  // Always render something - even if there's an error
  return (
    <AdminLayout activeSidebarItem="Manage Courts">
      <div className="p-4 sm:p-6 lg:p-8 overflow-x-hidden bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
          {/* Header Section */}
          <div className="mb-8">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 sm:p-8">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-6 lg:space-y-0">
                <div className="flex-1">
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-3">
                    Manage Courts
                  </h1>
                  <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
                    Manage court availability, pricing, and maintenance schedules with advanced controls
                  </p>
                </div>
                <button 
                  onClick={handleAddCourt}
                  className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-600 text-white px-8 py-4 rounded-2xl hover:from-blue-700 hover:via-blue-800 hover:to-indigo-700 transition-all duration-300 flex items-center space-x-3 shadow-xl hover:shadow-2xl transform hover:scale-105 w-full lg:w-auto font-semibold text-lg"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span>Add New Court</span>
                </button>
              </div>
            </div>
          </div>

          {/* Courts Table */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-600 text-white">
                  <tr>
                    <th className="px-6 py-6 text-left text-sm font-bold uppercase tracking-wider">Court No.</th>
                    <th className="px-6 py-6 text-left text-sm font-bold uppercase tracking-wider">Court Status</th>
                    <th className="px-6 py-6 text-left text-sm font-bold uppercase tracking-wider">Price</th>
                    <th className="px-6 py-6 text-center text-sm font-bold uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center">
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
                          <span className="text-gray-600">Loading courts...</span>
                        </div>
                      </td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-red-600">{error}</td>
                    </tr>
                  ) : currentCourts.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-gray-500">No courts available</td>
                    </tr>
                  ) : (
                    currentCourts.map((court, index) => (
                      <tr key={court.Court_Id} className={`hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-300 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                        <td className="px-6 py-6 text-sm font-bold text-gray-900">{court.Court_Name}</td>
                        <td className="px-6 py-6">
                          <select 
                            value={court.Status}
                            onChange={(e) => handleStatusChange(court.Court_Id, e.target.value)}
                            className={`px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                              court.Status === 'Available' ? 'bg-green-100 text-green-800 border-green-300 hover:bg-green-200' :
                              'bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-200'
                            }`}
                          >
                            <option value="Available">Available</option>
                            <option value="Maintenance">Maintenance</option>
                            <option value="Unavailable">Unavailable</option>
                          </select>
                        </td>
                        <td className="px-6 py-6 text-sm text-gray-900">
                          <div className="flex items-center space-x-4">
                            <span className="font-bold text-xl text-gray-800 bg-gray-100 px-4 py-2 rounded-xl">₱{Number(court.Price || 0).toFixed(2)}</span>
                            <button
                              onClick={() => handleEditCourt(court.Court_Id)}
                              className="w-8 h-8 bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl flex items-center justify-center hover:from-blue-100 hover:to-blue-200 hover:border-blue-300 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-110 group"
                              title="Edit Court Price"
                            >
                              <svg className="w-5 h-5 text-blue-600 group-hover:text-blue-700 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-6 text-center">
                          <button
                            onClick={() => handleDeleteCourt(court.Court_Id)}
                            className="bg-gradient-to-r from-red-500 via-red-600 to-red-700 text-white px-6 py-3 rounded-xl text-sm font-bold hover:from-red-600 hover:via-red-700 hover:to-red-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                          >
                            <span className="flex items-center space-x-2">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              <span>Delete</span>
                            </span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Enhanced Pagination */}
            {!loading && courts.length > 0 && (
              <div className="flex flex-col sm:flex-row justify-between items-center px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-t border-gray-200">
                <div className="text-sm text-gray-600 mb-2 sm:mb-0">
                  {currentPage === 1 
                    ? `Showing 1 to ${Math.min(itemsPerPage, courts.length)} of ${courts.length} courts`
                    : `Showing ${startIndex + 1} to ${Math.min(endIndex, courts.length)} of ${courts.length} courts`
                  }
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
                  <span className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg text-sm font-medium shadow-md">
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
          </div>
        </div>

      {/* Add Court Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 sm:p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Add New Court</h2>
              <button
                onClick={handleCloseAddModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                disabled={isSubmitting}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Court Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newCourt.Court_Name}
                  onChange={(e) => setNewCourt({ ...newCourt, Court_Name: e.target.value })}
                  placeholder="e.g., Court 13"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={newCourt.Status}
                  onChange={(e) => setNewCourt({ ...newCourt, Status: e.target.value as any })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                  disabled={isSubmitting}
                >
                  <option value="Available">Available</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Unavailable">Unavailable</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Price (₱)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={newCourt.Price}
                  onChange={(e) => setNewCourt({ ...newCourt, Price: Number(e.target.value) || 0 })}
                  placeholder="250"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-4 mt-6">
              <button
                onClick={handleCloseAddModal}
                disabled={isSubmitting}
                className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitNewCourt}
                disabled={isSubmitting || !newCourt.Court_Name.trim()}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Adding...</span>
                  </>
                ) : (
                  <span>Add Court</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}

export default AdminManageCourts