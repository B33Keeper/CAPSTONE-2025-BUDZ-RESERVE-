import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { api } from '@/lib/api'
import { AnnouncementHistoryModal } from '@/components/modals/AnnouncementHistoryModal'
import toast from 'react-hot-toast'

export default function AdminCreateAnnouncement() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const [showUserDropdown, setShowUserDropdown] = useState(false)
  const [activeSidebarItem, setActiveSidebarItem] = useState('Create Announcement')
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [showAnnouncementHistory, setShowAnnouncementHistory] = useState(false)
  const [announcementType, setAnnouncementType] = useState<'text' | 'image'>('text')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
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

  const sidebarItems = [
    { id: 'Dashboard', icon: 'grid', label: 'Dashboard' },
    { id: 'Manage Courts', icon: 'calendar', label: 'Manage Courts' },
    { id: 'Manage Rackets', icon: 'racket', label: 'Manage Rackets' },
    { id: 'Sales Report', icon: 'chart', label: 'Sales Report' },
    { id: 'Create Reservations', icon: 'document', label: 'Create Reservations' },
    { id: 'View Suggestions', icon: 'envelope', label: 'View Suggestions' },
    { id: 'Create Announcement', icon: 'announcement', label: 'Create Announcement' },
    { id: 'Upload photo', icon: 'picture', label: 'Upload photo' }
  ]

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
      if (!allowedTypes.includes(file.type)) {
        toast.error('Invalid file type. Only images (JPEG, PNG, GIF, WEBP) are allowed.')
        return
      }

      // Validate file size (10MB max)
      const maxSize = 10 * 1024 * 1024 // 10MB
      if (file.size > maxSize) {
        toast.error('File too large. Maximum size is 10MB.')
        return
      }

      setSelectedImage(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveImage = () => {
    setSelectedImage(null)
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) {
      toast.error('Please enter a title')
      return
    }

    if (announcementType === 'text' && !content.trim()) {
      toast.error('Please enter announcement content')
      return
    }

    if (announcementType === 'image' && !selectedImage) {
      toast.error('Please select an image')
      return
    }

    try {
      setIsSubmitting(true)

      if (announcementType === 'image' && selectedImage) {
        // Upload announcement with image
        const formData = new FormData()
        formData.append('title', title)
        formData.append('image', selectedImage)
        if (content.trim()) {
          formData.append('content', content)
        }

        await api.post('/announcements/with-image', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        })
      } else {
        // Create text announcement
        await api.post('/announcements', {
          title,
          content,
          announcement_type: 'text',
          is_active: true,
        })
      }

      toast.success('Announcement created successfully!')
      
      // Reset form
      setTitle('')
      setContent('')
      setSelectedImage(null)
      setImagePreview(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error: any) {
      console.error('Error creating announcement:', error)
      toast.error(error.response?.data?.message || 'Failed to create announcement. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <AnnouncementHistoryModal 
        isOpen={showAnnouncementHistory} 
        onClose={() => setShowAnnouncementHistory(false)} 
      />
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
                {/* Announcement History Button */}
                <button
                  onClick={() => setShowAnnouncementHistory(true)}
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors border border-gray-300"
                  title="View Announcement History"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="hidden sm:inline text-sm font-medium">Announcements</span>
                </button>
                
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
                    <div className="absolute right-0 mt-2 w-40 sm:w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
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
                    } else if (item.id === 'Create Announcement') {
                      navigate('/admin/create-announcement')
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
                    {item.icon === 'announcement' && (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"/>
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
          }`}>
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
                    } else if (item.id === 'Create Announcement') {
                      navigate('/admin/create-announcement')
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
                    {item.icon === 'announcement' && (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"/>
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
          <div className="flex-1 min-h-screen">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 sm:p-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Announcement</h1>
                <p className="text-gray-600 mb-6">Share important updates with users</p>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Announcement Type Selection */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Announcement Type
                    </label>
                    <div className="flex gap-4">
                      <button
                        type="button"
                        onClick={() => {
                          setAnnouncementType('text')
                          setSelectedImage(null)
                          setImagePreview(null)
                          if (fileInputRef.current) {
                            fileInputRef.current.value = ''
                          }
                        }}
                        className={`flex-1 px-6 py-4 rounded-xl border-2 transition-all font-semibold ${
                          announcementType === 'text'
                            ? 'border-blue-600 bg-blue-50 text-blue-700'
                            : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                        }`}
                      >
                        <div className="flex items-center justify-center space-x-2">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span>Text Announcement</span>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setAnnouncementType('image')}
                        className={`flex-1 px-6 py-4 rounded-xl border-2 transition-all font-semibold ${
                          announcementType === 'image'
                            ? 'border-blue-600 bg-blue-50 text-blue-700'
                            : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                        }`}
                      >
                        <div className="flex items-center justify-center space-x-2">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span>Image Announcement</span>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Title */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Enter announcement title"
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                      required
                      disabled={isSubmitting}
                    />
                  </div>

                  {/* Content (for text type) */}
                  {announcementType === 'text' && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Content <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Enter announcement content"
                        rows={8}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all resize-none"
                        required
                        disabled={isSubmitting}
                      />
                    </div>
                  )}

                  {/* Image Upload (for image type) */}
                  {announcementType === 'image' && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Image <span className="text-red-500">*</span>
                      </label>
                      <div className="space-y-4">
                        {!imagePreview ? (
                          <div
                            onClick={() => fileInputRef.current?.click()}
                            className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all"
                          >
                            <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            <p className="text-gray-600 font-medium mb-2">Click to upload an image</p>
                            <p className="text-sm text-gray-500">PNG, JPG, GIF, WEBP up to 10MB</p>
                          </div>
                        ) : (
                          <div className="relative">
                            <img
                              src={imagePreview}
                              alt="Preview"
                              className="w-full h-auto rounded-xl shadow-md"
                            />
                            <button
                              type="button"
                              onClick={handleRemoveImage}
                              className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full hover:bg-red-700 transition-colors"
                              disabled={isSubmitting}
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        )}
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleImageSelect}
                          className="hidden"
                          disabled={isSubmitting}
                        />
                        {imagePreview && (
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              Optional Content (Caption)
                            </label>
                            <textarea
                              value={content}
                              onChange={(e) => setContent(e.target.value)}
                              placeholder="Enter optional caption or description"
                              rows={4}
                              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all resize-none"
                              disabled={isSubmitting}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Submit Button */}
                  <div className="flex justify-end space-x-4 pt-4">
                    <button
                      type="button"
                      onClick={() => navigate('/admin')}
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
                        <span>Create Announcement</span>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
