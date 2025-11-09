import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

interface SidebarItem {
  id: string
  icon: string
  label: string
  indented: boolean
}

export interface AdminSidebarProps {
  activeItem?: string
  onItemChange?: (itemId: string) => void
  onExpandedChange?: (expanded: boolean) => void
}

export function AdminSidebar({ activeItem = 'Dashboard', onItemChange, onExpandedChange }: AdminSidebarProps) {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const navigate = useNavigate()

  // Auto-expand sidebar on mount for better UX
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsSidebarExpanded(true)
    }, 500)
    return () => clearTimeout(timer)
  }, [])

  // Notify parent when expansion changes
  useEffect(() => {
    if (onExpandedChange) {
      onExpandedChange(isSidebarExpanded)
    }
  }, [isSidebarExpanded, onExpandedChange])

  const sidebarItems: SidebarItem[] = [
    { id: 'Dashboard', icon: 'grid', label: 'Dashboard', indented: false },
    { id: 'Upload photo', icon: 'picture', label: 'Upload photo', indented: true },
    { id: 'Add Announcement', icon: 'announcement', label: 'Add Announcement', indented: true },
    { id: 'Manage Courts', icon: 'calendar', label: 'Manage Courts', indented: false },
    { id: 'Manage Rackets', icon: 'racket', label: 'Manage Rackets', indented: false },
    { id: 'Sales Report', icon: 'chart', label: 'Sales Report', indented: false },
    { id: 'Create Reservations', icon: 'document', label: 'Create Reservations', indented: false },
    { id: 'View Suggestions', icon: 'envelope', label: 'View Suggestions', indented: false }
  ]

  const handleNavigation = (itemId: string) => {
    if (itemId === 'Dashboard') {
      navigate('/admin')
    } else if (itemId === 'Manage Courts') {
      navigate('/admin/manage-courts')
    } else if (itemId === 'Manage Rackets') {
      navigate('/admin/manage-rackets')
    } else if (itemId === 'Sales Report') {
      navigate('/admin/sales-report')
    } else if (itemId === 'Create Reservations') {
      navigate('/admin/create-reservations')
    } else if (itemId === 'View Suggestions') {
      navigate('/admin/view-suggestions')
    } else if (itemId === 'Upload photo') {
      navigate('/admin/upload-photo')
    } else if (itemId === 'Add Announcement') {
      navigate('/admin/create-announcement')
    }
    
    if (onItemChange) {
      onItemChange(itemId)
    }
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
      case 'picture':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        )
      case 'announcement':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
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
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Desktop Sidebar */}
      <div 
        className={`hidden md:block transition-all duration-300 ease-in-out sticky top-14 sm:top-16 z-30 self-start h-[calc(100vh-3.5rem)] sm:h-[calc(100vh-4rem)] overflow-y-auto border-r border-gray-200 bg-white shadow-sm scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent ${
          isSidebarExpanded ? 'w-64' : 'w-16'
        }`}
        onMouseEnter={() => setIsSidebarExpanded(true)}
        onMouseLeave={() => setIsSidebarExpanded(false)}
      >
        {/* Custom Scrollbar Styles */}
        <style dangerouslySetInnerHTML={{ __html: `
          .scrollbar-thin::-webkit-scrollbar {
            width: 6px;
          }
          .scrollbar-thin::-webkit-scrollbar-track {
            background: transparent;
          }
          .scrollbar-thin::-webkit-scrollbar-thumb {
            background-color: #cbd5e1;
            border-radius: 3px;
            transition: background-color 0.2s;
          }
          .scrollbar-thin::-webkit-scrollbar-thumb:hover {
            background-color: #94a3b8;
          }
        ` }} />
        {/* Logo/Branding Section */}
        <div className={`flex items-center justify-center ${isSidebarExpanded ? 'px-4' : 'px-2'} py-4 border-b border-gray-100 transition-all duration-300`}>
          <div className={`flex items-center ${isSidebarExpanded ? 'space-x-3' : 'justify-center'}`}>
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 shadow-lg flex-shrink-0">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className={`transition-all duration-300 overflow-hidden text-center ${isSidebarExpanded ? 'opacity-100 max-w-full ml-0' : 'opacity-0 max-w-0 ml-0'}`}>
              <h2 className="text-sm font-bold text-gray-900 whitespace-nowrap">Admin Panel</h2>
              <p className="text-xs text-gray-500 whitespace-nowrap">Budz Reserve</p>
            </div>
          </div>
        </div>

        <nav className={`${isSidebarExpanded ? 'px-2' : 'px-0'} py-4 space-y-1`}>
          {sidebarItems.map((item, index) => (
            <div key={item.id} className={`${!item.indented && index > 0 && !sidebarItems[index - 1].indented ? 'mt-2 pt-2 border-t border-gray-100' : ''}`}>
              <button
                onClick={() => handleNavigation(item.id)}
                className={`w-full flex items-center ${
                  isSidebarExpanded ? 'space-x-3' : 'justify-center'
                } ${isSidebarExpanded ? (item.indented ? 'pl-8' : 'pl-4') : 'pl-0 pr-0'} py-3 rounded-xl ${
                  isSidebarExpanded ? 'mx-2' : 'mx-0'
                } text-left transition-all duration-300 ease-in-out group relative focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  activeItem === item.id
                    ? 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 font-semibold shadow-md transform scale-[1.02]'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:shadow-sm hover:transform hover:scale-[1.01] active:scale-[0.98]'
                }`}
                title={!isSidebarExpanded ? item.label : undefined}
                aria-label={item.label}
              >
                {/* Active indicator bar */}
                {activeItem === item.id && isSidebarExpanded && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-600 rounded-r-full shadow-lg"></div>
                )}
                
                <div className={`w-6 h-6 flex items-center justify-center flex-shrink-0 transition-transform duration-300 ${
                  activeItem === item.id ? 'transform scale-110' : 'group-hover:scale-110'
                }`}>
                  {renderIcon(item.icon)}
                </div>
                <span className={`font-medium transition-all duration-300 relative ${
                  isSidebarExpanded ? 'opacity-100 translate-x-0' : 'opacity-0 w-0 overflow-hidden -translate-x-2'
                }`}>
                  {item.label}
                </span>
                
                {/* Tooltip for collapsed state */}
                {!isSidebarExpanded && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 shadow-lg">
                    {item.label}
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gray-900 transform rotate-45"></div>
                  </div>
                )}
              </button>
            </div>
          ))}
        </nav>
      </div>

      {/* Mobile Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-40 w-72 bg-white shadow-2xl border-r border-gray-200 transform transition-transform duration-300 ease-in-out md:hidden ${
        isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Mobile Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Admin Panel</h2>
              <p className="text-xs text-gray-500">Budz Reserve</p>
            </div>
          </div>
          <button
            onClick={() => setIsMobileSidebarOpen(false)}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 active:bg-gray-200 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <nav className="px-3 py-4 space-y-1 overflow-y-auto max-h-[calc(100vh-80px)]">
          {sidebarItems.map((item, index) => (
            <div key={item.id} className={`${!item.indented && index > 0 && !sidebarItems[index - 1].indented ? 'mt-2 pt-2 border-t border-gray-100' : ''}`}>
              <button
                onClick={() => handleNavigation(item.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-xl text-left transition-all duration-300 relative focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  activeItem === item.id
                    ? 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 font-semibold shadow-md transform scale-[1.02]'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:shadow-sm hover:transform hover:scale-[1.01] active:scale-[0.98]'
                }`}
                aria-label={item.label}
              >
                {/* Active indicator bar */}
                {activeItem === item.id && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-10 bg-blue-600 rounded-r-full shadow-lg"></div>
                )}
                <div className={`w-6 h-6 flex items-center justify-center flex-shrink-0 transition-transform duration-300 ${
                  activeItem === item.id ? 'transform scale-110' : 'group-hover:scale-110'
                }`}>
                  {renderIcon(item.icon)}
                </div>
                <span className="font-medium">{item.label}</span>
              </button>
            </div>
          ))}
        </nav>
      </div>

      {/* Mobile Menu Button */}
      <div className="md:hidden">
        <button
          onClick={() => setIsMobileSidebarOpen(true)}
          className="fixed top-4 left-4 z-40 p-3 rounded-xl bg-white shadow-lg border border-gray-200 text-gray-700 hover:bg-gray-50 hover:shadow-xl active:scale-95 transition-all duration-200"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>
    </>
  )
}

export default AdminSidebar

