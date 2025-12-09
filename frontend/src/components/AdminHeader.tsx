import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import api from '@/lib/api'

interface AdminHeaderProps {
  title?: string
  subtitle?: string
  extraButtons?: React.ReactNode
}

interface Notification {
  id: number
  type: string
  title: string
  message: string
  is_read: boolean
  equipment_rental_item_id?: number
  user_id?: number
  created_at: string
}

export function AdminHeader({ title, subtitle, extraButtons }: AdminHeaderProps) {
  const navigate = useNavigate()
  const { user, logout, checkAuth } = useAuthStore()
  const [showUserDropdown, setShowUserDropdown] = useState(false)
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loadingNotifications, setLoadingNotifications] = useState(false)
  const [expandedNotifications, setExpandedNotifications] = useState<Set<number>>(new Set())
  const dropdownRef = useRef<HTMLDivElement>(null)
  const notificationsRef = useRef<HTMLDivElement>(null)

  // Refresh user data on mount to ensure latest data from backend
  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  // Helper function to format role
  const formatRole = (role?: string) => {
    if (!role) return 'User'
    return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase()
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (user?.role !== 'admin') return
    
    try {
      setLoadingNotifications(true)
      const [notificationsResponse, countResponse] = await Promise.all([
        api.get('/notifications/unread'),
        api.get('/notifications/unread/count'),
      ])
      
      // Handle response data - check if it's an array or wrapped in data property
      const notificationsData = Array.isArray(notificationsResponse.data) 
        ? notificationsResponse.data 
        : notificationsResponse.data?.data || []
      
      setNotifications(notificationsData)
      setUnreadCount(countResponse.data?.count || 0)
    } catch (error: any) {
      console.error('Failed to fetch notifications:', error)
      console.error('Error details:', {
        message: error?.message,
        response: error?.response?.data,
        status: error?.response?.status,
        url: error?.config?.url
      })
      // Set empty arrays on error to prevent infinite loading
      setNotifications([])
      setUnreadCount(0)
    } finally {
      setLoadingNotifications(false)
    }
  }, [user?.role])

  // Mark notification as read
  const markAsRead = async (notificationId: number) => {
    try {
      await api.patch(`/notifications/${notificationId}/read`)
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      await api.patch('/notifications/read-all')
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      setUnreadCount(0)
    } catch (error) {
      console.error('Failed to mark all as read:', error)
    }
  }

  // Format time ago
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (diffInSeconds < 60) return 'Just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    return `${Math.floor(diffInSeconds / 86400)}d ago`
  }

  // Fetch notifications on mount and periodically
  useEffect(() => {
    if (user?.role === 'admin') {
      fetchNotifications()
      const interval = setInterval(() => {
        // Defer the async work to prevent blocking the main thread
        setTimeout(() => {
          void fetchNotifications()
        }, 0)
      }, 60000) // Refresh every minute
      return () => clearInterval(interval)
    }
  }, [user?.role, fetchNotifications])

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false)
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotificationsDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-200/60 shadow-lg shadow-gray-900/5 overflow-visible">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 overflow-visible">
        <div className="flex justify-between items-center h-16 sm:h-18 relative overflow-visible">
          {/* Logo Section */}
          <div className="flex items-center space-x-4 group">
            <div className="relative">
              <img 
                src="/assets/icons/BBC ICON.png" 
                alt="BBC Logo" 
                className="h-12 w-12 sm:h-14 sm:w-14 lg:h-16 lg:w-16 object-contain transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 drop-shadow-md" 
              />
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
            {title && (
              <div className="hidden sm:block ml-2">
                <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
                  {title}
                </h1>
                {subtitle && (
                  <p className="text-xs sm:text-sm font-medium text-gray-500 mt-0.5">
                    {subtitle}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Right Side - Extra Buttons, Notifications, and Admin Profile */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            {extraButtons && (
              <div className="flex items-center space-x-2">
                {extraButtons}
              </div>
            )}

            {/* Notifications Bell */}
            {user?.role === 'admin' && (
              <div className="relative overflow-visible" ref={notificationsRef}>
                <button
                  onClick={() => {
                    setShowNotificationsDropdown(!showNotificationsDropdown)
                    if (!showNotificationsDropdown) {
                      fetchNotifications()
                    }
                  }}
                  className="relative group flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-r from-gray-50 to-blue-50/50 hover:from-blue-50 hover:to-indigo-50 border border-gray-200/60 hover:border-blue-300/60 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10 hover:scale-105 active:scale-95"
                >
                  <svg 
                    className="w-5 h-5 text-gray-600 group-hover:text-blue-600 transition-colors" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full border-2 border-white shadow-sm">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {showNotificationsDropdown && (
                  <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl shadow-gray-900/20 border border-gray-200/60 z-[60] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 max-h-[500px] flex flex-col">
                    {/* Header */}
                    <div className="px-4 py-3 border-b border-gray-200/60 flex items-center justify-between bg-gradient-to-r from-blue-50/50 to-indigo-50/30">
                      <h3 className="text-sm font-semibold text-gray-900">Equipment Reminders</h3>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors"
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>

                    {/* Notifications List */}
                    <div className="overflow-y-auto flex-1">
                      {loadingNotifications ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                        </div>
                      ) : notifications.length === 0 ? (
                        <div className="px-4 py-8 text-center">
                          <svg className="w-12 h-12 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                          </svg>
                          <p className="text-sm text-gray-500">No equipment reminders</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-gray-100">
                          {notifications.map((notification) => {
                            const isExpanded = expandedNotifications.has(notification.id)
                            return (
                              <div
                                key={notification.id}
                                className={`px-4 py-3 hover:bg-gray-50/50 transition-colors ${
                                  !notification.is_read ? 'bg-blue-50/30' : ''
                                }`}
                              >
                                <div className="flex items-start space-x-3">
                                  <div className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 ${
                                    !notification.is_read ? 'bg-blue-500' : 'bg-transparent'
                                  }`}></div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                      <p className={`text-sm font-medium flex-1 ${
                                        !notification.is_read ? 'text-gray-900' : 'text-gray-700'
                                      }`}>
                                        {notification.title}
                                      </p>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          setExpandedNotifications(prev => {
                                            const newSet = new Set(prev)
                                            if (newSet.has(notification.id)) {
                                              newSet.delete(notification.id)
                                            } else {
                                              newSet.add(notification.id)
                                            }
                                            return newSet
                                          })
                                          if (!notification.is_read) {
                                            markAsRead(notification.id)
                                          }
                                        }}
                                        className="flex-shrink-0 p-1 rounded-md hover:bg-gray-200/50 transition-colors"
                                        aria-label={isExpanded ? 'Collapse' : 'Expand'}
                                      >
                                        <svg
                                          className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
                                            isExpanded ? 'rotate-180' : ''
                                          }`}
                                          fill="none"
                                          stroke="currentColor"
                                          viewBox="0 0 24 24"
                                        >
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                      </button>
                                    </div>
                                    <p className={`text-xs text-gray-600 mt-1 transition-all duration-200 ${
                                      isExpanded ? '' : 'line-clamp-2'
                                    }`}>
                                      {notification.message}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">
                                      {formatTimeAgo(notification.created_at)}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            <div className="relative overflow-visible" ref={dropdownRef}>
              <button
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="group flex items-center space-x-2 sm:space-x-3 px-3 sm:px-4 py-2 rounded-xl bg-gradient-to-r from-gray-50 to-blue-50/50 hover:from-blue-50 hover:to-indigo-50 border border-gray-200/60 hover:border-blue-300/60 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10 hover:scale-105 active:scale-95 z-10 relative"
              >
                {/* Profile Picture */}
                <div className="relative">
                  <img
                    src={user?.profile_picture || (user?.role === 'admin' ? '/assets/Admin Profile/Admin.png' : '/assets/img/home-page/Ellipse 1.png')}
                    alt="Profile"
                    className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover border-2 border-white shadow-md ring-2 ring-gray-200/60 group-hover:ring-blue-400/60 transition-all duration-300"
                  />
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow-sm"></div>
                </div>
                
                {/* User Info */}
                <div className="text-left hidden sm:block">
                  <div className="text-xs sm:text-sm font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
                    {user?.username || user?.name || 'User'}
                  </div>
                  <div className="text-xs font-medium text-gray-500 group-hover:text-blue-600 transition-colors">
                    {formatRole(user?.role)}
                  </div>
                </div>
                
                {/* Dropdown Icon */}
                <svg 
                  className={`w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-all duration-300 ${showUserDropdown ? 'rotate-180 text-blue-600' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {showUserDropdown && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl shadow-gray-900/20 border border-gray-200/60 py-2 z-[60] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  {/* Decorative gradient */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-transparent to-indigo-50/30 pointer-events-none"></div>
                  
                  {/* Menu Items */}
                  <div className="relative">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center space-x-3 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50 hover:text-red-600 transition-all duration-200 group"
                    >
                      <div className="p-1.5 rounded-lg bg-red-100 group-hover:bg-red-200 transition-colors">
                        <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                      </div>
                      <span className="flex-1">Logout</span>
                      <svg className="w-4 h-4 text-gray-400 group-hover:text-red-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                  
                  {/* Bottom border accent */}
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-blue-200 to-transparent"></div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Bottom border gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
    </header>
  )
}
