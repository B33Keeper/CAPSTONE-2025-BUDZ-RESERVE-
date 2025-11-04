import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

interface AdminHeaderProps {
  title?: string
  subtitle?: string
  extraButtons?: React.ReactNode
  sidebarExpanded?: boolean
}

export function AdminHeader({ title, subtitle, extraButtons, sidebarExpanded = false }: AdminHeaderProps) {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const [showUserDropdown, setShowUserDropdown] = useState(false)
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

  return (
    <header className={`bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40 overflow-visible backdrop-blur-sm bg-white/95 transition-all duration-300 ${
      sidebarExpanded ? 'lg:ml-64' : 'lg:ml-16'
    }`}>
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 overflow-visible">
        <div className="flex justify-between items-center h-14 sm:h-16 relative">
          {/* Logo */}
          <div className="flex items-center">
            <img 
              src="/assets/icons/BBC ICON.png" 
              alt="BBC Logo" 
              className="h-12 w-12 sm:h-16 sm:w-16 lg:h-24 lg:w-24 object-contain hover:scale-105 transition-transform duration-200" 
            />
            {title && (
              <div className="ml-4 hidden sm:block">
                <h1 className="text-lg sm:text-xl font-bold text-gray-900">{title}</h1>
                {subtitle && <p className="text-xs sm:text-sm text-gray-600">{subtitle}</p>}
              </div>
            )}
          </div>

          {/* Right Side - Admin Profile and Extra Buttons */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {extraButtons}
            
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
  )
}

