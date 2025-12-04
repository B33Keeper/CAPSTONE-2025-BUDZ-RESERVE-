import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { apiServices } from '@/lib/apiServices'
import toast from 'react-hot-toast'
import { QueueingLoadingScreen } from './QueueingLoadingScreen'

interface ProtectedQueueingRouteProps {
  children: React.ReactNode
}

export function ProtectedQueueingRoute({ children }: ProtectedQueueingRouteProps) {
  const { isAuthenticated, isLoading } = useAuthStore()
  const [hasAccess, setHasAccess] = useState<boolean | null>(null)
  const [checkingAccess, setCheckingAccess] = useState(true)
  const [headerLoadingActive, setHeaderLoadingActive] = useState(false)
  const navigate = useNavigate()

  // Listen for Header loading screen state
  useEffect(() => {
    const handleHeaderLoadingStart = () => {
      setHeaderLoadingActive(true)
    }
    const handleHeaderLoadingEnd = () => {
      setHeaderLoadingActive(false)
    }

    window.addEventListener('queueing-header-loading-start', handleHeaderLoadingStart)
    window.addEventListener('queueing-header-loading-end', handleHeaderLoadingEnd)

    return () => {
      window.removeEventListener('queueing-header-loading-start', handleHeaderLoadingStart)
      window.removeEventListener('queueing-header-loading-end', handleHeaderLoadingEnd)
    }
  }, [])

  useEffect(() => {
    const checkAccess = async () => {
      if (!isAuthenticated) {
        setHasAccess(false)
        setCheckingAccess(false)
        // Notify Header that check is complete
        window.dispatchEvent(new CustomEvent('queueing-access-check-complete'))
        return
      }

      try {
        const result = await apiServices.checkQueueingAccess()
        setHasAccess(result.hasAccess)
        if (!result.hasAccess && result.message) {
          toast.error(result.message)
        }
      } catch (error: any) {
        console.error('Error checking queueing access:', error)
        setHasAccess(false)
        toast.error('Failed to verify reservation access. Please try again.')
      } finally {
        setCheckingAccess(false)
        // Notify Header that access check is complete
        window.dispatchEvent(new CustomEvent('queueing-access-check-complete'))
      }
    }

    if (!isLoading) {
      checkAccess()
    }
  }, [isAuthenticated, isLoading])

  // Dispatch event when access is granted and component is ready
  // This helps trigger the instructions modal after loading
  // IMPORTANT: This hook must be called before any conditional returns
  useEffect(() => {
    if (hasAccess === true && !checkingAccess) {
      // Small delay to ensure page is rendered
      const timer = setTimeout(() => {
        window.dispatchEvent(new CustomEvent('queueing-access-granted'))
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [hasAccess, checkingAccess])

  // Only show loading screen if Header's loading screen is not active
  // This ensures we have one continuous loading screen
  if (isLoading || (checkingAccess && !headerLoadingActive)) {
    return <QueueingLoadingScreen />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login?returnUrl=/queueing" replace />
  }

  if (hasAccess === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="mb-6">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-10 h-10 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Restricted</h2>
            <p className="text-gray-600 mb-6">
              You need an active reservation to access the queueing system.
            </p>
          </div>
          <div className="space-y-3">
            <button
              onClick={() => navigate('/booking')}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Book a Court
            </button>
            <button
              onClick={() => navigate('/')}
              className="w-full bg-gray-200 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
            >
              Go to Home
            </button>
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

