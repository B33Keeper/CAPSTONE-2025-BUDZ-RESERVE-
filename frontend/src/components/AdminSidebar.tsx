import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

interface SidebarItem {
  id: string
  icon: string
  label: string
  path: string
}

interface AdminSidebarProps {
  activeItem?: string
  onExpandedChange?: (expanded: boolean) => void
}

export function AdminSidebar({ activeItem, onExpandedChange }: AdminSidebarProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

  // Notify parent about expansion state changes
  useEffect(() => {
    if (onExpandedChange) {
      onExpandedChange(isSidebarExpanded)
    }
  }, [isSidebarExpanded, onExpandedChange])

  const sidebarItems: SidebarItem[] = [
    { id: 'Dashboard', icon: 'grid', label: 'Dashboard', path: '/admin' },
    { id: 'Manage Courts', icon: 'calendar', label: 'Manage Courts', path: '/admin/manage-courts' },
    { id: 'Manage Rackets', icon: 'racket', label: 'Manage Rackets', path: '/admin/manage-rackets' },
    { id: 'Sales Report', icon: 'chart', label: 'Sales Report', path: '/admin/sales-report' },
    { id: 'Create Reservations', icon: 'document', label: 'Create Reservations', path: '/admin/create-reservations' },
    { id: 'View Suggestions', icon: 'envelope', label: 'View Suggestions', path: '/admin/view-suggestions' },
    { id: 'Create Announcement', icon: 'announcement', label: 'Create Announcement', path: '/admin/create-announcement' },
    { id: 'Upload photo', icon: 'picture', label: 'Upload photo', path: '/admin/upload-photo' }
  ]

  // Determine active item from current path
  const currentActiveItem = activeItem || sidebarItems.find(item => item.path === location.pathname)?.id || 'Dashboard'

  const handleItemClick = (item: SidebarItem) => {
    navigate(item.path)
    setIsMobileSidebarOpen(false)
  }

  const renderIcon = (icon: string) => {
    switch (icon) {
      case 'grid':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M3 3h7v7H3V3zm0 11h7v7H3v-7zm11 0h7v7h-7v-7zm0-11h7v7h-7V3z"/>
          </svg>
        )
      case 'calendar':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
            <circle cx="16" cy="12" r="1"/>
          </svg>
        )
      case 'racket':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            <path d="M12 6l-2 2 2 2 2-2-2-2zm0 8l-2 2 2 2 2-2-2-2z"/>
          </svg>
        )
      case 'chart':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M5 9.2h3V19H5zM10.6 5h2.8v14h-2.8zm5.6 8H19v6h-2.8z"/>
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z"/>
          </svg>
        )
      case 'document':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
            <path d="M8 12h8v2H8V12zm0 4h8v2H8V16z"/>
          </svg>
        )
      case 'envelope':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
          </svg>
        )
      case 'announcement':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"/>
          </svg>
        )
      case 'picture':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
            <path d="M21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3V5h18v14z"/>
          </svg>
        )
      default:
        return null
    }
  }

  return (
    <>
      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Desktop Sidebar - Fixed and Sticky */}
      <div 
        className={`hidden lg:block bg-white shadow-sm border-r border-gray-200 transition-all duration-300 ease-in-out ${
          isSidebarExpanded ? 'w-64' : 'w-16'
        } hover:shadow-lg fixed top-0 left-0 h-screen overflow-y-auto z-30`}
        style={{ 
          backgroundColor: 'white',
          position: 'fixed',
          top: 0,
          left: 0,
          height: '100vh',
        }}
        onMouseEnter={() => setIsSidebarExpanded(true)}
        onMouseLeave={() => setIsSidebarExpanded(false)}
      >
        <nav className="px-2 py-8 space-y-2">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleItemClick(item)}
              className={`w-full flex items-center ${
                isSidebarExpanded ? 'space-x-3 px-4' : 'justify-center px-2'
              } py-3 rounded-lg text-left transition-all duration-300 ease-in-out group ${
                currentActiveItem === item.id
                  ? 'bg-blue-100 text-blue-700 shadow-md transform scale-105'
                  : 'text-gray-600 hover:bg-gray-100 hover:shadow-sm hover:transform hover:scale-105'
              }`}
            >
              <div className="w-6 h-6 flex items-center justify-center">
                {renderIcon(item.icon)}
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
              onClick={() => handleItemClick(item)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all duration-200 ${
                currentActiveItem === item.id
                  ? 'bg-blue-100 text-blue-700 shadow-md'
                  : 'text-gray-600 hover:bg-gray-100 hover:shadow-sm'
              }`}
            >
              <div className="w-6 h-6 flex items-center justify-center">
                {renderIcon(item.icon)}
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
    </>
  )
}

