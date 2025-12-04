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
}

export function AdminSidebar({ activeItem = 'Dashboard', onItemChange }: AdminSidebarProps) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [isDashboardExpanded, setIsDashboardExpanded] = useState(true)
  const navigate = useNavigate()

  const sidebarItems: SidebarItem[] = [
    { id: 'Dashboard', icon: 'grid', label: 'Dashboard', indented: false },
    { id: 'Upload photo', icon: 'picture', label: 'Upload photo', indented: true },
    { id: 'Add Announcement', icon: 'announcement', label: 'Add Announcement', indented: true },
    { id: 'Create User', icon: 'user', label: 'Create User', indented: true },
    { id: 'Manage Courts', icon: 'calendar', label: 'Manage Courts', indented: false },
    { id: 'Manage Rackets', icon: 'racket', label: 'Manage Rackets', indented: false },
    { id: 'Create Reservations', icon: 'reservation', label: 'Create Reservations', indented: false },
    { id: 'Sales Report', icon: 'chart', label: 'Sales Report', indented: false },
    { id: 'View Suggestions', icon: 'envelope', label: 'View Suggestions', indented: false }
  ]

  // Auto-expand dashboard if a sub-item is active
  const dashboardSubItems = ['Upload photo', 'Add Announcement', 'Create User']
  const isDashboardSubItemActive = dashboardSubItems.includes(activeItem)

  useEffect(() => {
    if (isDashboardSubItemActive) {
      setIsDashboardExpanded(true)
    }
  }, [isDashboardSubItemActive])

  const handleNavigation = (itemId: string) => {
    if (itemId === 'Dashboard') {
      setIsDashboardExpanded(!isDashboardExpanded)
      navigate('/admin')
    } else if (itemId === 'Manage Courts') {
      navigate('/admin/manage-courts')
    } else if (itemId === 'Manage Rackets') {
      navigate('/admin/manage-rackets')
    } else if (itemId === 'Create Reservations') {
      navigate('/admin/create-reservations')
    } else if (itemId === 'Sales Report') {
      navigate('/admin/sales-report')
    } else if (itemId === 'View Suggestions') {
      navigate('/admin/view-suggestions')
    } else if (itemId === 'Upload photo') {
      navigate('/admin/upload-photo')
    } else if (itemId === 'Add Announcement') {
      navigate('/admin/create-announcement')
    } else if (itemId === 'Create User') {
      navigate('/admin/create-user')
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
      case 'reservation':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        )
      case 'user':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
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
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden transition-opacity duration-300"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Desktop Sidebar */}
      <div 
        className="hidden md:block fixed top-16 left-0 z-30 w-64 h-[calc(100vh-4rem)] overflow-y-auto bg-gradient-to-b from-white via-gray-50/30 to-white border-r border-gray-200/80 shadow-xl sidebar-scroll"
      >
        {/* Custom Scrollbar Styles */}
        <style dangerouslySetInnerHTML={{ __html: `
          .sidebar-scroll::-webkit-scrollbar {
            width: 6px;
          }
          .sidebar-scroll::-webkit-scrollbar-track {
            background: transparent;
          }
          .sidebar-scroll::-webkit-scrollbar-thumb {
            background: linear-gradient(to bottom, #cbd5e1, #94a3b8);
            border-radius: 10px;
          }
          .sidebar-scroll::-webkit-scrollbar-thumb:hover {
            background: linear-gradient(to bottom, #94a3b8, #64748b);
          }
        ` }} />
        
        {/* Logo/Branding Section */}
        <div className="flex items-center justify-center px-4 py-5 border-b border-gray-200/60 bg-gradient-to-r from-blue-50/50 via-white to-indigo-50/50 backdrop-blur-sm">
          <div className="flex items-center space-x-3 group">
            <div className="relative flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 shadow-lg shadow-blue-500/30 flex-shrink-0 transform transition-all duration-300 group-hover:scale-110 group-hover:shadow-xl group-hover:shadow-blue-500/40">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/20 to-transparent"></div>
            </div>
            <div className="overflow-hidden">
              <h2 className="text-base font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent whitespace-nowrap">
                Admin Panel
              </h2>
              <p className="text-xs font-medium text-gray-500 whitespace-nowrap">Budz Reserve</p>
            </div>
          </div>
        </div>

        <nav className="px-3 py-4 space-y-1 pb-6">
          {sidebarItems.map((item, index) => {
            const isActive = activeItem === item.id
            const hasDivider = !item.indented && index > 0 && !sidebarItems[index - 1].indented
            const isDashboardSubItem = dashboardSubItems.includes(item.id)
            
            // Hide sub-items if dashboard is collapsed
            if (isDashboardSubItem && !isDashboardExpanded) {
              return null
            }
            
            const isDashboard = item.id === 'Dashboard'
            
            return (
              <div key={item.id} className={hasDivider ? 'mt-3 pt-3 border-t border-gray-200/60' : ''}>
                <button
                  onClick={() => handleNavigation(item.id)}
                  className={`group relative w-full flex items-center space-x-3 ${item.indented ? 'pl-10' : 'pl-4'} pr-4 py-3.5 rounded-xl text-left transition-all duration-300 ease-out ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30 transform scale-[1.02]'
                      : 'text-gray-700 hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50/50 hover:text-gray-900 hover:shadow-md hover:transform hover:scale-[1.01] active:scale-[0.99]'
                  }`}
                  aria-label={item.label}
                >
                  {/* Active indicator bar with glow */}
                  {isActive && (
                    <>
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-10 bg-white/90 rounded-r-full shadow-lg shadow-white/50"></div>
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-white/10 via-transparent to-transparent"></div>
                    </>
                  )}
                  
                  {/* Icon container */}
                  <div className={`relative w-7 h-7 flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                    isActive 
                      ? 'text-white transform scale-110' 
                      : 'text-gray-600 group-hover:text-blue-600 group-hover:scale-110 group-hover:rotate-3'
                  }`}>
                    {isActive && (
                      <div className="absolute inset-0 rounded-lg bg-white/20 blur-sm"></div>
                    )}
                    {renderIcon(item.icon)}
                  </div>
                  
                  {/* Label */}
                  <span className={`font-semibold text-sm transition-all duration-300 flex-1 ${
                    isActive 
                      ? 'text-white' 
                      : 'text-gray-700 group-hover:text-gray-900'
                  }`}>
                    {item.label}
                  </span>
                  
                  {/* Chevron icon for Dashboard */}
                  {isDashboard && (
                    <svg 
                      className={`w-4 h-4 transition-transform duration-300 flex-shrink-0 ${
                        isDashboardExpanded ? 'rotate-90' : ''
                      } ${isActive ? 'text-white' : 'text-gray-500'}`}
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                  
                  {/* Hover effect overlay */}
                  {!isActive && (
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  )}
                </button>
              </div>
            )
          })}
        </nav>

        {/* Bottom decorative element */}
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-blue-50/30 via-transparent to-transparent pointer-events-none"></div>
      </div>

      {/* Mobile Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-40 w-80 bg-gradient-to-b from-white via-gray-50/50 to-white shadow-2xl border-r border-gray-200/80 transform transition-transform duration-300 ease-out md:hidden overflow-hidden flex flex-col ${
        isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Mobile Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200/60 bg-gradient-to-r from-blue-50 via-white to-indigo-50/50 backdrop-blur-sm">
          <div className="flex items-center space-x-3">
            <div className="relative flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 shadow-lg shadow-blue-500/30">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/20 to-transparent"></div>
            </div>
            <div>
              <h2 className="text-base font-bold bg-gradient-to-r from-gray-900 to-gray-800 bg-clip-text text-transparent">Admin Panel</h2>
              <p className="text-xs font-medium text-gray-500">Budz Reserve</p>
            </div>
          </div>
          <button
            onClick={() => setIsMobileSidebarOpen(false)}
            className="p-2.5 rounded-xl text-gray-500 hover:bg-gray-100 hover:text-gray-700 active:bg-gray-200 transition-all duration-200 hover:scale-110 active:scale-95"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <nav className="px-4 py-5 space-y-2 overflow-y-auto flex-1 pb-6">
          {sidebarItems.map((item, index) => {
            const isActive = activeItem === item.id
            const hasDivider = !item.indented && index > 0 && !sidebarItems[index - 1].indented
            const isDashboardSubItem = dashboardSubItems.includes(item.id)
            
            // Hide sub-items if dashboard is collapsed
            if (isDashboardSubItem && !isDashboardExpanded) {
              return null
            }
            
            const isDashboard = item.id === 'Dashboard'
            
            return (
              <div key={item.id} className={hasDivider ? 'mt-3 pt-3 border-t border-gray-200/60' : ''}>
                <button
                  onClick={() => handleNavigation(item.id)}
                  className={`group relative w-full flex items-center space-x-3 px-4 py-4 rounded-xl text-left transition-all duration-300 ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30 transform scale-[1.02]'
                      : 'text-gray-700 hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50/50 hover:text-gray-900 hover:shadow-md hover:transform hover:scale-[1.01] active:scale-[0.99]'
                  }`}
                  aria-label={item.label}
                >
                  {isActive && (
                    <>
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-12 bg-white/90 rounded-r-full shadow-lg"></div>
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-white/10 via-transparent to-transparent"></div>
                    </>
                  )}
                  <div className={`relative w-7 h-7 flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                    isActive 
                      ? 'text-white transform scale-110' 
                      : 'text-gray-600 group-hover:text-blue-600 group-hover:scale-110'
                  }`}>
                    {isActive && (
                      <div className="absolute inset-0 rounded-lg bg-white/20 blur-sm"></div>
                    )}
                    {renderIcon(item.icon)}
                  </div>
                  <span className={`font-semibold text-sm flex-1 ${
                    isActive ? 'text-white' : 'text-gray-700 group-hover:text-gray-900'
                  }`}>
                    {item.label}
                  </span>
                  
                  {/* Chevron icon for Dashboard */}
                  {isDashboard && (
                    <svg 
                      className={`w-4 h-4 transition-transform duration-300 flex-shrink-0 ${
                        isDashboardExpanded ? 'rotate-90' : ''
                      } ${isActive ? 'text-white' : 'text-gray-500'}`}
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </button>
              </div>
            )
          })}
        </nav>
      </div>

      {/* Mobile Menu Button */}
      <div className="md:hidden">
        <button
          onClick={() => setIsMobileSidebarOpen(true)}
          className="fixed top-4 left-4 z-40 p-3.5 rounded-xl bg-white/95 backdrop-blur-md shadow-xl border border-gray-200/60 text-gray-700 hover:bg-white hover:shadow-2xl hover:scale-110 active:scale-95 transition-all duration-200"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>
    </>
  )
}

export default AdminSidebar
