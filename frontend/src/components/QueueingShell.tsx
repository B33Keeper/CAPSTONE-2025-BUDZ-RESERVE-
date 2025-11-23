import { ReactNode, useEffect, useState, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { QueueingInstructionsModal } from './modals/QueueingInstructionsModal'
import { ProfileModal } from './modals/ProfileModal'
import { ReservationsModal } from './modals/ReservationsModal'
import { useAuthStore } from '@/store/authStore'

const navItems = [
  {
    key: 'players',
    label: 'Players',
    to: '/queueing/players',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
        <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0z" />
        <path d="M5.5 14a3.5 3.5 0 117 0v.75a.75.75 0 01-.75.75h-5.5a.75.75 0 01-.75-.75V14z" />
        <path d="M15.25 9.5a1.75 1.75 0 11-3.5 0 1.75 1.75 0 013.5 0zM16 13.25a.75.75 0 01-.75.75h-1.5a.75.75 0 01-.75-.75v-.25a2.25 2.25 0 114.5 0v.25a.75.75 0 01-.75.75h-1.5z" />
      </svg>
    ),
  },
  {
    key: 'queue',
    label: 'Queue',
    to: '/queueing',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
        <path d="M5 3a2 2 0 00-2 2v2.586A2 2 0 003.586 9L5 10.414V16a1 1 0 001.447.894l3.106-1.553 3.106 1.553A1 1 0 0014 16v-5.586L15.414 9A2 2 0 0016 7.586V5a2 2 0 00-2-2H5z" />
      </svg>
    ),
  },
  {
    key: 'history',
    label: 'Match History',
    to: '/queueing/history',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
        <path d="M10 2a8 8 0 104.906 14.32.75.75 0 10-.812-1.26A6.5 6.5 0 1116.5 10a.75.75 0 101.5 0A8 8 0 0010 2z" />
        <path d="M10 5.25a.75.75 0 00-.75.75v4l2.5 2.5a.75.75 0 001.06-1.06L10.75 9.5V6a.75.75 0 00-.75-.75z" />
      </svg>
    ),
  },
  {
    key: 'settings',
    label: 'ManageFees',
    to: '/queueing/settings',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
        <path d="M10.75 3a.75.75 0 00-1.5 0v1.128a5.5 5.5 0 00-2.796 1.16L5.5 4.333a.75.75 0 10-1 1.124l.964.857a5.5 5.5 0 000 2.372l-.964.857a.75.75 0 001 1.124l.954-.82A5.5 5.5 0 009.25 15.872V17a.75.75 0 001.5 0v-1.128a5.5 5.5 0 002.796-1.16l.954.82a.75.75 0 101-1.124l-.964-.857a5.5 5.5 0 000-2.372l.964-.857a.75.75 0 10-1-1.124l-.954.82a5.5 5.5 0 00-2.796-1.16V3zm-3.5 7a3.5 3.5 0 117 0 3.5 3.5 0 01-7 0z" />
      </svg>
    ),
  },
]

interface QueueingShellProps {
  activeTab: 'players' | 'queue' | 'settings' | 'history'
  children: ReactNode
}

const UserIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
)

const CalendarIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
)

const MegaphoneIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 8a5 5 0 010 8m-6.58 3.19A1 1 0 018 18V6a1 1 0 01.58-.91L19 1v22l-10.42-3.81zM5 10v4a1 1 0 01-1 1H3a1 1 0 01-1-1v-4a1 1 0 011-1h1a1 1 0 011 1z" />
  </svg>
)

const LogOutIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
)

export function QueueingShell({ activeTab, children }: QueueingShellProps) {
  const [showInstructions, setShowInstructions] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  const [isReservationsModalOpen, setIsReservationsModalOpen] = useState(false)
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const profileRef = useRef<HTMLDivElement>(null)

  // Listen for custom events when loading screen completes or access is granted
  // This ensures the modal shows automatically on first login (after loading screen) 
  // and when redirected to manage queueing page
  useEffect(() => {
    // Only check on queueing pages
    if (!location.pathname.startsWith('/queueing')) {
      return
    }

    // Wait for user to be available
    if (!user) {
      return
    }

    const checkAndShowInstructions = () => {
      // Check if user has permanently disabled instructions
      const permanentlyDisabled = localStorage.getItem('queueing-instructions-seen') === 'true'
      if (permanentlyDisabled) {
        console.log('[QueueingShell] Instructions permanently disabled')
        return
      }

      // Check if this is the user's first time accessing queueing (first login)
      const userId = user?.id
      const firstAccessKey = userId ? `queueing-first-access-${userId}` : 'queueing-first-access'
      const hasAccessedBefore = localStorage.getItem(firstAccessKey) === 'true'
      
      // Check if user has seen instructions in this session
      const hasSeenInstructionsThisSession = sessionStorage.getItem('queueing-instructions-seen-this-session') === 'true'
      
      console.log('[QueueingShell] Checking instructions:', {
        userId,
        firstAccessKey,
        hasAccessedBefore,
        hasSeenInstructionsThisSession,
        shouldShow: !hasAccessedBefore || !hasSeenInstructionsThisSession
      })
      
      // Show on first access (first login) OR when redirected to queueing page (if not seen in this session)
      if (!hasAccessedBefore || !hasSeenInstructionsThisSession) {
        console.log('[QueueingShell] Showing instructions modal')
        // Show after a small delay to ensure page is rendered
        setTimeout(() => {
          setShowInstructions(true)
        }, 500)
      }
    }

    const handleLoadingComplete = () => {
      console.log('[QueueingShell] Loading complete event received')
      // Wait a bit longer after loading screen completes to ensure page is fully rendered
      setTimeout(() => {
        checkAndShowInstructions()
      }, 500)
    }

    const handleAccessGranted = () => {
      console.log('[QueueingShell] Access granted event received')
      // When access is granted, check and show instructions
      // This handles the case when user is redirected to queueing page
      setTimeout(() => {
        checkAndShowInstructions()
      }, 800)
    }

    // Listen for both events
    window.addEventListener('queueing-loading-complete', handleLoadingComplete)
    window.addEventListener('queueing-access-granted', handleAccessGranted)
    
    // Check after loading screen duration (1.5s) + buffer
    // This ensures we wait for loading screen to complete
    const timer1 = setTimeout(() => {
      console.log('[QueueingShell] First check after loading screen duration')
      checkAndShowInstructions()
    }, 2000) // After loading screen (1.5s) + fade out (0.3s) + buffer
    
    // Final fallback check
    const timer2 = setTimeout(() => {
      console.log('[QueueingShell] Final fallback check')
      checkAndShowInstructions()
    }, 3000) // Final fallback
    
    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
      window.removeEventListener('queueing-loading-complete', handleLoadingComplete)
      window.removeEventListener('queueing-access-granted', handleAccessGranted)
    }
  }, [location.pathname, user])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/')
    setIsProfileOpen(false)
  }

  const triggerAnnouncementModal = () => {
    window.dispatchEvent(new CustomEvent('open-announcement-modal'))
  }

  return (
    <>
      <div
        className="relative min-h-screen overflow-hidden text-white"
        style={{
          backgroundImage: "url('/assets/img/queueing-bg.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
        }}
      >
        <div className="pointer-events-none absolute inset-0 bg-[#0a0308]/78 backdrop-blur-[2px]" />

      <header className="fixed top-0 left-0 right-0 z-30 bg-gradient-to-b from-[#0a0308]/95 via-[#0a0308]/50 to-transparent backdrop-blur-sm overflow-visible">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:px-6 sm:py-6 overflow-visible">
          <div className="flex w-full flex-wrap items-center justify-between gap-3 sm:w-auto sm:flex-nowrap">
            <Link to="/" className="flex items-center gap-2">
              <span className="text-2xl font-semibold tracking-wide text-white drop-shadow">BudzSmash</span>
            </Link>
          </div>
          <div className="flex w-full flex-wrap items-center justify-center gap-2 sm:w-auto sm:justify-end overflow-visible">
            <nav className="-mx-1 flex w-full flex-wrap items-center justify-center gap-2 overflow-x-auto pb-1 sm:mx-0 sm:w-auto sm:overflow-visible sm:pb-0">
              {navItems.map((item) => {
                const isActive = item.key === activeTab
                return (
                  <Link
                    key={item.key}
                    to={item.to}
                    className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                      isActive
                        ? 'bg-white/20 text-white shadow-lg shadow-black/30 backdrop-blur'
                        : 'text-white/75 hover:bg-white/12'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      {item.icon}
                      <span>{item.label}</span>
                    </span>
                  </Link>
                )
              })}
            </nav>

            {/* Profile Section */}
            <div className="relative flex justify-end overflow-visible" ref={profileRef}>
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center space-x-3 px-3 py-2 rounded-xl text-white/90 hover:text-white hover:bg-white/10 transition-all duration-300 group"
              >
                <div className="relative">
                  <img
                    src={user?.profile_picture || '/assets/img/home-page/Ellipse 1.png'}
                    alt="Profile"
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border-2 border-white/20 group-hover:border-white/40 transition-all duration-300 shadow-sm"
                  />
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-[#0a0308]"></div>
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-sm font-semibold text-white group-hover:text-white transition-colors duration-300">
                    {user?.name || user?.username}
                  </div>
                  <div className="text-xs text-white/70 group-hover:text-white/90 transition-colors duration-300">
                    Online
                  </div>
                </div>
                <svg 
                  className={`w-4 h-4 text-white/70 group-hover:text-white transition-all duration-300 ${isProfileOpen ? 'rotate-180' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 top-full mt-3 w-64 sm:w-72 bg-[#0a0308]/95 backdrop-blur-lg rounded-2xl shadow-2xl py-2 z-[100] border border-white/20"
                     style={{
                       position: 'absolute',
                       top: '100%',
                       right: '0',
                       marginTop: '0.75rem'
                     }}>
                  {/* User Info Header */}
                  <div className="px-4 py-3 border-b border-white/10">
                    <div className="flex items-center space-x-3">
                      <img
                        src={user?.profile_picture || '/assets/img/home-page/Ellipse 1.png'}
                        alt="Profile"
                        className="w-12 h-12 rounded-full object-cover border-2 border-white/20"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-white truncate">
                          {user?.name || user?.username}
                        </div>
                        <div className="text-xs text-white/70 truncate">
                          {user?.email || 'user@example.com'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="py-2">
                    <button
                      onClick={() => {
                        setIsProfileModalOpen(true)
                        setIsProfileOpen(false)
                      }}
                      className="flex items-center w-full px-4 py-3 text-sm text-white/80 hover:bg-white/10 hover:text-white transition-all duration-200 group"
                    >
                      <div className="w-5 h-5 mr-3 text-white/60 group-hover:text-white transition-colors duration-200">
                        <UserIcon />
                      </div>
                      <span className="font-medium">Profile</span>
                      <svg className="w-4 h-4 ml-auto text-white/40 group-hover:text-white/60 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                    
                    <button
                      onClick={() => {
                        setIsReservationsModalOpen(true)
                        setIsProfileOpen(false)
                      }}
                      className="flex items-center w-full px-4 py-3 text-sm text-white/80 hover:bg-white/10 hover:text-white transition-all duration-200 group"
                    >
                      <div className="w-5 h-5 mr-3 text-white/60 group-hover:text-white transition-colors duration-200">
                        <CalendarIcon />
                      </div>
                      <span className="font-medium">My Reservations</span>
                      <svg className="w-4 h-4 ml-auto text-white/40 group-hover:text-white/60 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>

                    <button
                      onClick={() => {
                        triggerAnnouncementModal()
                        setIsProfileOpen(false)
                      }}
                      className="flex items-center w-full px-4 py-3 text-sm text-white/80 hover:bg-white/10 hover:text-white transition-all duration-200 group"
                    >
                      <div className="w-5 h-5 mr-3 text-white/60 group-hover:text-white transition-colors duration-200">
                        <MegaphoneIcon />
                      </div>
                      <span className="font-medium">View Announcement</span>
                      <svg className="w-4 h-4 ml-auto text-white/40 group-hover:text-white/60 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-white/10 mx-4"></div>

                  {/* Logout Button */}
                  <div className="py-2">
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-3 text-sm text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-all duration-200 group"
                    >
                      <div className="w-5 h-5 mr-3 text-red-400/80 group-hover:text-red-300 transition-colors duration-200">
                        <LogOutIcon />
                      </div>
                      <span className="font-medium">Log Out</span>
                      <svg className="w-4 h-4 ml-auto text-red-400/60 group-hover:text-red-300/80 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto mt-28 flex max-w-6xl flex-col gap-10 px-4 pb-10 sm:px-6">
        {children}
      </main>

      {/* Floating Back to Home Button - Upper Left */}
      <Link
        to="/"
        className="fixed top-6 left-6 z-40 flex items-center gap-2 rounded-full border border-white/20 bg-white/10 hover:bg-white/20 backdrop-blur-sm px-4 py-2 text-sm font-semibold text-white transition-all duration-300 hover:scale-105 shadow-lg group"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-6 w-6 group-hover:translate-x-[-2px] transition-transform duration-300">
          <path d="M9.707 3.293a1 1 0 010 1.414L6.414 8H16a1 1 0 110 2H6.414l3.293 3.293a1 1 0 01-1.414 1.414l-5-5a1 1 0 010-1.414l5-5a1 1 0 011.414 0z" />
        </svg>
        <span>Back</span>
      </Link>

      {/* Floating Instruction Button - Lower Left */}
      <button
        onClick={() => setShowInstructions(true)}
        className="fixed bottom-6 left-6 z-40 w-14 h-14 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg border border-white/30 hover:border-white/50 transition-all duration-300 hover:scale-110 group"
        aria-label="View Instructions"
      >
        <svg 
          className="w-7 h-7 text-white group-hover:text-white transition-colors duration-300" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
          />
        </svg>
      </button>
      </div>

      {/* Queueing Instructions Modal */}
      <QueueingInstructionsModal
        isOpen={showInstructions}
        onClose={() => setShowInstructions(false)}
      />

      {/* Profile Modal */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />

      {/* Reservations Modal */}
      <ReservationsModal
        isOpen={isReservationsModalOpen}
        onClose={() => setIsReservationsModalOpen(false)}
      />
    </>
  )
}


