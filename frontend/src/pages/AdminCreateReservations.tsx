import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { apiServices, Court } from '@/lib/apiServices'
import api from '@/lib/api'
import AdminSidebar from '@/components/AdminSidebar'
import AdminFooter from '@/components/AdminFooter'
import toast from 'react-hot-toast'

export default function AdminCreateReservations() {
  const [showUserDropdown, setShowUserDropdown] = useState(false)
  const [activeSidebarItem, setActiveSidebarItem] = useState('Create Reservations')
  const [courts, setCourts] = useState<Court[]>([])
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedCourt, setSelectedCourt] = useState<number | ''>('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [notes, setNotes] = useState('')
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

  // Fetch courts
  useEffect(() => {
    const fetchCourts = async () => {
      try {
        setLoading(true)
        const courtsData = await apiServices.getCourts()
        setCourts(courtsData.filter(court => court.Status === 'Available'))
      } catch (error: any) {
        console.error('Error fetching courts:', error)
        toast.error('Failed to load courts')
      } finally {
        setLoading(false)
      }
    }

    fetchCourts()
  }, [])

  // Generate time slots (8 AM to 11 PM)
  const generateTimeSlots = () => {
    const slots = []
    for (let hour = 8; hour <= 23; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
        slots.push(timeString)
      }
    }
    return slots
  }

  const timeSlots = generateTimeSlots()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedCourt || !selectedDate || !startTime || !endTime) {
      toast.error('Please fill in all required fields')
      return
    }

    if (startTime >= endTime) {
      toast.error('End time must be after start time')
      return
    }

    try {
      setIsSubmitting(true)

      const reservationData = {
        Court_ID: selectedCourt,
        Reservation_Date: selectedDate,
        Start_Time: startTime,
        End_Time: endTime,
        Notes: notes || undefined
      }

      // Create reservation - using admin endpoint if available, otherwise regular endpoint
      await api.post('/reservations', reservationData)

      toast.success('Reservation created successfully!')
      
      // Reset form
      setSelectedCourt('')
      setSelectedDate('')
      setStartTime('')
      setEndTime('')
      setNotes('')
    } catch (error: any) {
      console.error('Error creating reservation:', error)
      toast.error(error.response?.data?.message || 'Failed to create reservation. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Set minimum date to today
  const today = new Date().toISOString().split('T')[0]

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
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 sm:p-8">
              <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Reservation</h1>
                <p className="text-gray-600">Create a new court reservation for a user</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Court Selection */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Court <span className="text-red-500">*</span>
                  </label>
                  {loading ? (
                    <div className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl bg-gray-50">
                      <span className="text-gray-500">Loading courts...</span>
                    </div>
                  ) : (
                    <select
                      value={selectedCourt}
                      onChange={(e) => setSelectedCourt(e.target.value ? parseInt(e.target.value) : '')}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                      required
                      disabled={isSubmitting}
                    >
                      <option value="">Select a court</option>
                      {courts.map((court) => (
                        <option key={court.Court_Id} value={court.Court_Id}>
                          Court {court.Court_Name} - ₱{Number(court.Price || 0).toFixed(2)}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Reservation Date */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Reservation Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    min={today}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                    required
                    disabled={isSubmitting}
                  />
                </div>

                {/* Start Time */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Start Time <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                    required
                    disabled={isSubmitting}
                  >
                    <option value="">Select start time</option>
                    {timeSlots.map((time) => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))}
                  </select>
                </div>

                {/* End Time */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    End Time <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                    required
                    disabled={isSubmitting || !startTime}
                  >
                    <option value="">Select end time</option>
                    {timeSlots
                      .filter((time) => !startTime || time > startTime)
                      .map((time) => (
                        <option key={time} value={time}>
                          {time}
                        </option>
                      ))}
                  </select>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Enter any additional notes..."
                    rows={4}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all resize-none"
                    disabled={isSubmitting}
                  />
                </div>

                {/* Submit Button */}
                <div className="flex justify-end space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={() => window.history.back()}
                    className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Creating...</span>
                      </>
                    ) : (
                      <span>Create Reservation</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </main>
      </div>
      <AdminFooter />
    </div>
  )
}
