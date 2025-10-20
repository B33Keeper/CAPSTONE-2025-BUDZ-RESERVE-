import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useActiveSection } from '@/hooks/useActiveSection'
import { TermsAndConditionsModal } from '@/components/modals/TermsAndConditionsModal'
// Simple SVG icons to replace lucide-react
const MenuIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
  </svg>
)

const XIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
)

const UserIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
)

const CalendarIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
)

const LogOutIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
)

import { ProfileModal } from './modals/ProfileModal'
import { ReservationsModal } from './modals/ReservationsModal'

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  const [isReservationsModalOpen, setIsReservationsModalOpen] = useState(false)
  const [showTermsModal, setShowTermsModal] = useState(false)
  const { user, isAuthenticated, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const activeSection = useActiveSection()
  const profileRef = useRef<HTMLDivElement>(null)

  const handleLogout = () => {
    logout()
    navigate('/')
    setIsProfileOpen(false)
  }

  // Handle Terms and Conditions for Book Court
  const handleBookCourtClick = () => {
    if (!isAuthenticated) {
      alert('Please login to proceed on booking')
      navigate('/login')
      return
    }
    setShowTermsModal(true)
  }

  const handleAcceptTerms = () => {
    setShowTermsModal(false)
    navigate('/booking')
  }

  const handleCloseTerms = () => {
    setShowTermsModal(false)
  }

  const scrollToSection = (sectionId: string) => {
    // If we're not on the homepage, navigate there first
    if (window.location.pathname !== '/') {
      navigate('/')
      // Wait for navigation to complete, then scroll
      setTimeout(() => {
        const element = document.getElementById(sectionId)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' })
        }
      }, 100)
    } else {
      const element = document.getElementById(sectionId)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' })
      }
    }
    setIsMenuOpen(false)
  }

  const getNavButtonClasses = (sectionId: string) => {
    const baseClasses = "transition-all duration-300 px-4 py-2 rounded-lg font-medium"
    const activeClasses = "text-blue-600 bg-blue-50 shadow-sm"
    const inactiveClasses = "text-gray-700 hover:text-blue-600 hover:bg-blue-50/50"

    // If we're on the booking page, don't highlight any section navigation
    if (location.pathname === '/booking') {
      return `${baseClasses} ${inactiveClasses}`
    }

    return `${baseClasses} ${activeSection === sectionId ? activeClasses : inactiveClasses}`
  }

  const getBookCourtClasses = () => {
    const baseClasses = "transition-all duration-300 px-4 py-2 rounded-lg font-medium"
    const activeClasses = "text-blue-600 bg-blue-50 shadow-sm"
    const inactiveClasses = "text-gray-700 hover:text-blue-600 hover:bg-blue-50/50"

    return `${baseClasses} ${location.pathname === '/booking' ? activeClasses : inactiveClasses}`
  }


  const handleManageQueueingClick = () => {
    if (!isAuthenticated) {
      alert('Please login to proceed with booking')
      navigate('/login')
      return
    }
    // Add your manage queueing logic here
    console.log('Manage Queueing clicked')
  }

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

  return (
    <>
    <header className="bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-200/50 sticky top-0 z-50 overflow-visible">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 overflow-visible">
        <div className="flex justify-between items-center h-18">
            {/* Logo */}
            <Link to="/" className="flex items-center">
              <img src="/assets/icons/BBC ICON.png" alt="BBC Logo" className="h-12 sm:h-16" />
            </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center justify-between w-full">
            {/* Center Navigation Links */}
            <nav className="flex items-center space-x-8 justify-center flex-1">
              <button
                onClick={() => scrollToSection('home')}
                className={getNavButtonClasses('home')}
              >
                Home
              </button>
              <button
                onClick={() => scrollToSection('about')}
                className={getNavButtonClasses('about')}
              >
                About Us
              </button>
              <button
                onClick={() => scrollToSection('gallery')}
                className={getNavButtonClasses('gallery')}
              >
                Gallery
              </button>
              <button
                onClick={() => scrollToSection('contact')}
                className={getNavButtonClasses('contact')}
              >
                Contact Us
              </button>
              <button
                onClick={handleBookCourtClick}
                className={isAuthenticated ? getBookCourtClasses() : "text-gray-700 hover:text-primary-600 transition-colors"}
              >
                Book Court
              </button>
              <button
                onClick={handleManageQueueingClick}
                className="transition-all duration-300 px-4 py-2 rounded-lg font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50/50"
              >
                Manage Queueing
              </button>
            </nav>
            
            {/* Right Side - Login/Sign Up or Profile */}
            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                <div className="relative flex justify-end" ref={profileRef}>
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center space-x-3 px-3 py-2 rounded-xl text-gray-700 hover:text-blue-600 hover:bg-blue-50/50 transition-all duration-300 group"
                  >
                    <div className="relative">
                      <img
                        src={user?.profile_picture || '/assets/img/home-page/Ellipse 1.png'}
                        alt="Profile"
                        className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border-2 border-gray-200 group-hover:border-blue-300 transition-all duration-300 shadow-sm"
                      />
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                    </div>
                    <div className="hidden sm:block text-left">
                      <div className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors duration-300">
                        {user?.name || user?.username}
                      </div>
                      <div className="text-xs text-gray-500 group-hover:text-blue-500 transition-colors duration-300">
                        Online
                      </div>
                    </div>
                    <svg 
                      className={`w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-all duration-300 ${isProfileOpen ? 'rotate-180' : ''}`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {isProfileOpen && (
                    <div className="absolute right-0 mt-3 w-64 sm:w-72 bg-white rounded-2xl shadow-2xl py-2 z-50 border border-gray-100/50 backdrop-blur-sm animate-in slide-in-from-top-2 duration-200"
                         style={{
                           position: 'absolute',
                           top: '100%',
                           right: '0',
                           marginTop: '0.75rem'
                         }}>
                      {/* User Info Header */}
                      <div className="px-4 py-3 border-b border-gray-100/50">
                        <div className="flex items-center space-x-3">
                          <img
                            src={user?.profile_picture || '/assets/img/home-page/Ellipse 1.png'}
                            alt="Profile"
                            className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold text-gray-900 truncate">
                              {user?.name || user?.username}
                            </div>
                            <div className="text-xs text-gray-500 truncate">
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
                          className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-all duration-200 group"
                        >
                          <div className="w-5 h-5 mr-3 text-gray-400 group-hover:text-blue-500 transition-colors duration-200">
                            <UserIcon />
                          </div>
                          <span className="font-medium">Profile</span>
                          <svg className="w-4 h-4 ml-auto text-gray-300 group-hover:text-blue-400 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                        
                        <button
                          onClick={() => {
                            setIsReservationsModalOpen(true)
                            setIsProfileOpen(false)
                          }}
                          className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-all duration-200 group"
                        >
                          <div className="w-5 h-5 mr-3 text-gray-400 group-hover:text-blue-500 transition-colors duration-200">
                            <CalendarIcon />
                          </div>
                          <span className="font-medium">My Reservations</span>
                          <svg className="w-4 h-4 ml-auto text-gray-300 group-hover:text-blue-400 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>

                      {/* Divider */}
                      <div className="border-t border-gray-100/50 mx-4"></div>

                      {/* Logout Button */}
                      <div className="py-2">
                        <button
                          onClick={handleLogout}
                          className="flex items-center w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 transition-all duration-200 group"
                        >
                          <div className="w-5 h-5 mr-3 text-red-400 group-hover:text-red-500 transition-colors duration-200">
                            <LogOutIcon />
                          </div>
                          <span className="font-medium">Log Out</span>
                          <svg className="w-4 h-4 ml-auto text-red-300 group-hover:text-red-400 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="transition-all duration-300 px-4 py-2 rounded-lg font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50/50"
                  >
                    Login
                  </Link>
                  <Link
                    to="/signup"
                    className="transition-all duration-300 px-4 py-2 rounded-lg font-medium bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-lg text-gray-700 hover:text-blue-600 hover:bg-blue-50/50 transition-all duration-300"
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
              title={isMenuOpen ? "Close menu" : "Open menu"}
            >
              {isMenuOpen ? <XIcon /> : <MenuIcon />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white/95 backdrop-blur-md border-t border-gray-200/50">
              <button
                onClick={() => scrollToSection('home')}
                className={`block w-full text-left px-4 py-3 rounded-lg transition-all duration-300 font-medium ${location.pathname === '/booking' ? 'text-gray-700 hover:text-blue-600 hover:bg-blue-50/50' : (activeSection === 'home' ? 'text-blue-600 bg-blue-50 shadow-sm' : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50/50')}`}
              >
                Home
              </button>
              <button
                onClick={() => scrollToSection('about')}
                className={`block w-full text-left px-4 py-3 rounded-lg transition-all duration-300 font-medium ${location.pathname === '/booking' ? 'text-gray-700 hover:text-blue-600 hover:bg-blue-50/50' : (activeSection === 'about' ? 'text-blue-600 bg-blue-50 shadow-sm' : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50/50')}`}
              >
                About Us
              </button>
              <button
                onClick={() => scrollToSection('gallery')}
                className={`block w-full text-left px-4 py-3 rounded-lg transition-all duration-300 font-medium ${location.pathname === '/booking' ? 'text-gray-700 hover:text-blue-600 hover:bg-blue-50/50' : (activeSection === 'gallery' ? 'text-blue-600 bg-blue-50 shadow-sm' : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50/50')}`}
              >
                Gallery
              </button>
              <button
                onClick={() => scrollToSection('contact')}
                className={`block w-full text-left px-4 py-3 rounded-lg transition-all duration-300 font-medium ${location.pathname === '/booking' ? 'text-gray-700 hover:text-blue-600 hover:bg-blue-50/50' : (activeSection === 'contact' ? 'text-blue-600 bg-blue-50 shadow-sm' : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50/50')}`}
              >
                Contact Us
              </button>
              <button
                onClick={() => {
                  handleBookCourtClick()
                  setIsMenuOpen(false)
                }}
                className={`block w-full text-left px-4 py-3 rounded-lg transition-all duration-300 font-medium ${isAuthenticated && location.pathname === '/booking' ? 'text-blue-600 bg-blue-50 shadow-sm' : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50/50'}`}
              >
                Book Court
              </button>
              <button
                onClick={() => {
                  handleManageQueueingClick()
                  setIsMenuOpen(false)
                }}
                className="block w-full text-left px-4 py-3 rounded-lg transition-all duration-300 font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50/50"
              >
                Manage Queueing
              </button>
              {isAuthenticated ? (
                <>
                  {/* Mobile User Info */}
                  <div className="px-3 py-3 border-b border-gray-100">
                    <div className="flex items-center space-x-3">
                      <img
                        src={user?.profile_picture || '/assets/img/home-page/Ellipse 1.png'}
                        alt="Profile"
                        className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-gray-900 truncate">
                          {user?.name || user?.username}
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          {user?.email || 'user@example.com'}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Mobile Menu Items */}
                  <button
                    onClick={() => {
                      setIsProfileModalOpen(true)
                      setIsMenuOpen(false)
                    }}
                    className="flex items-center w-full px-3 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-all duration-200 group"
                  >
                    <div className="w-5 h-5 mr-3 text-gray-400 group-hover:text-blue-500 transition-colors duration-200">
                      <UserIcon />
                    </div>
                    <span className="font-medium">Profile</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      setIsReservationsModalOpen(true)
                      setIsMenuOpen(false)
                    }}
                    className="flex items-center w-full px-3 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-all duration-200 group"
                  >
                    <div className="w-5 h-5 mr-3 text-gray-400 group-hover:text-blue-500 transition-colors duration-200">
                      <CalendarIcon />
                    </div>
                    <span className="font-medium">My Reservations</span>
                  </button>
                  
                  <div className="border-t border-gray-100 mx-3"></div>
                  
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-3 py-3 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 transition-all duration-200 group"
                  >
                    <div className="w-5 h-5 mr-3 text-red-400 group-hover:text-red-500 transition-colors duration-200">
                      <LogOutIcon />
                    </div>
                    <span className="font-medium">Log Out</span>
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="block px-4 py-3 rounded-lg text-gray-700 hover:text-blue-600 hover:bg-blue-50/50 transition-all duration-300 font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    to="/signup"
                    className="block px-4 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 shadow-sm transition-all duration-300 font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>

    </header>

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

    {/* Terms and Conditions Modal */}
    <TermsAndConditionsModal
      isOpen={showTermsModal}
      onClose={handleCloseTerms}
      onAccept={handleAcceptTerms}
    />
    </>
  )
}
