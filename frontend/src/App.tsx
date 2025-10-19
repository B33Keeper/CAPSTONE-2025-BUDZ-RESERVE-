import { Routes, Route } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useEffect } from 'react'
import { Layout } from '@/components/Layout'
import { HomePage } from '@/pages/HomePage'
import { LoginPage } from '@/pages/LoginPage'
import { SignupPage } from '@/pages/SignupPage'
import { BookingPage } from '@/pages/BookingPage'
import { ForgotPasswordPage } from '@/pages/ForgotPasswordPage'
import { VerifyOtpPage } from '@/pages/VerifyOtpPage'
import { ResetPasswordPage } from '@/pages/ResetPasswordPage'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { Toaster } from 'react-hot-toast'

function App() {
  const { checkAuth, isLoading } = useAuthStore()

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="signup" element={<SignupPage />} />
          <Route path="forgot-password" element={<ForgotPasswordPage />} />
          <Route path="verify-otp" element={<VerifyOtpPage />} />
          <Route path="reset-password" element={<ResetPasswordPage />} />
          <Route
            path="booking"
            element={
              <ProtectedRoute>
                <BookingPage />
              </ProtectedRoute>
            }
          />
        </Route>
      </Routes>
      <Toaster
        position="top-center"
        containerStyle={{
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 9999,
        }}
        toastOptions={{
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff',
            margin: '0 auto',
            zIndex: 9999,
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#4ade80',
              secondary: '#fff',
            },
          },
          error: {
            duration: 3000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </>
  )
}

export default App
