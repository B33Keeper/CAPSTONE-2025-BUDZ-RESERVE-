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
import { PaymentSuccessPage } from '@/pages/PaymentSuccessPage'
import { PaymentFailedPage } from '@/pages/PaymentFailedPage'
import { QueueingPage } from '@/pages/QueueingPage'
import AdminDashboard from '@/pages/AdminDashboard'
import AdminManageCourts from '@/pages/AdminManageCourts'
import AdminManageRackets from '@/pages/AdminManageRackets'
import AdminSalesReport from '@/pages/AdminSalesReport'
import AdminViewSuggestions from '@/pages/AdminViewSuggestions'
import AdminCreateAnnouncement from '@/pages/AdminCreateAnnouncement'
import AdminCreateReservations from '@/pages/AdminCreateReservations'
import UploadPhoto from '@/pages/UploadPhoto'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { AnnouncementModal } from '@/components/modals/AnnouncementModal'
import { Toaster } from 'react-hot-toast'

function App() {
  const { checkAuth, isAuthenticated } = useAuthStore()

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  const { isLoading } = useAuthStore()
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <>
      {/* Announcement Modal - shows after login */}
      {isAuthenticated && <AnnouncementModal />}
      
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
          <Route path="payment/success" element={<PaymentSuccessPage />} />
          <Route path="payment/failed" element={<PaymentFailedPage />} />
        </Route>
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/manage-courts" 
          element={
            <ProtectedRoute>
              <AdminManageCourts />
            </ProtectedRoute>
          }
        />
        <Route 
          path="/admin/manage-rackets" 
          element={
            <ProtectedRoute>
              <AdminManageRackets />
            </ProtectedRoute>
          }
        />
        <Route 
          path="/admin/sales-report" 
          element={
            <ProtectedRoute>
              <AdminSalesReport />
            </ProtectedRoute>
          }
        />
        <Route 
          path="/admin/view-suggestions" 
          element={
            <ProtectedRoute>
              <AdminViewSuggestions />
            </ProtectedRoute>
          }
        />
        <Route 
          path="/admin/create-announcement" 
          element={
            <ProtectedRoute>
              <AdminCreateAnnouncement />
            </ProtectedRoute>
          }
        />
        <Route 
          path="/admin/create-reservations" 
          element={
            <ProtectedRoute>
              <AdminCreateReservations />
            </ProtectedRoute>
          }
        />
        <Route 
          path="/admin/upload-photo" 
          element={
            <ProtectedRoute>
              <UploadPhoto />
            </ProtectedRoute>
          }
        />
        <Route
          path="/queueing"
          element={
            <ProtectedRoute>
              <QueueingPage />
            </ProtectedRoute>
          }
        />
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
