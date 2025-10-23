import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { Eye, EyeOff, Loader2, ArrowLeft, CheckCircle } from 'lucide-react'
import api from '@/lib/api'

const resetPasswordSchema = z.object({
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/`~]).{8,}$/,
      'Password must contain uppercase, lowercase, number, and special character'
    ),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>

export function ResetPasswordPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const navigate = useNavigate()
  const location = useLocation()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  })

  useEffect(() => {
    // Get email and OTP from navigation state
    if (location.state?.email && location.state?.otp) {
      setEmail(location.state.email)
      setOtp(location.state.otp)
    } else {
      // If no email/OTP in state, redirect to forgot password
      navigate('/forgot-password')
    }
  }, [location.state, navigate])

  const onSubmit = async (data: ResetPasswordFormData) => {
    setIsLoading(true)
    try {
      const response = await api.post('/auth/reset-password', {
        email,
        otp,
        newPassword: data.newPassword,
      })

      setIsSuccess(true)
      toast.success('Password reset successfully!')
      // Navigate to login page after a short delay
      setTimeout(() => {
        navigate('/login')
      }, 2000)
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to reset password')
    } finally {
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f0f0f0' }}>
        <div className="bg-white rounded-lg shadow-lg p-12 w-full max-w-lg text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Password Reset Successful!</h1>
          <p className="text-gray-600 mb-6">Your password has been updated successfully.</p>
          <p className="text-sm text-gray-500">Redirecting to login page...</p>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mt-4"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f0f0f0' }}>
      <div className="bg-white rounded-lg shadow-lg p-12 w-full max-w-lg">
        {/* BBC Logo */}
        <div className="text-center mb-8">
          <img src="/assets/icons/BBC ICON.png" alt="BBC Logo" className="h-32 mx-auto mb-4" />
        </div>

        {/* Back to Verify OTP */}
        <div className="mb-6">
          <Link 
            to="/verify-otp" 
            className="inline-flex items-center text-blue-500 hover:text-blue-600 text-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Verify OTP
          </Link>
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Reset Password</h1>
          <p className="text-gray-600">
            Enter your new password below.
          </p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
          {/* New Password Field */}
          <div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <input
                {...register('newPassword')}
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter new password"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </div>
            {errors.newPassword && (
              <p className="mt-1 text-sm text-red-600">{errors.newPassword.message}</p>
            )}
          </div>

          {/* Confirm Password Field */}
          <div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <input
                {...register('confirmPassword')}
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete="new-password"
                className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Confirm new password"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
            )}
          </div>

          {/* Password Requirements */}
          <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
            <p className="font-medium mb-2">Password requirements:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>At least 8 characters long</li>
              <li>Contains uppercase letter</li>
              <li>Contains lowercase letter</li>
              <li>Contains number</li>
              <li>Contains special character</li>
            </ul>
          </div>

          {/* Reset Password Button */}
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Resetting Password...
                </>
              ) : (
                'Reset Password'
              )}
            </button>
          </div>

          {/* Back to Login */}
          <div className="text-center text-sm">
            <span className="text-gray-600">Remember your password? </span>
            <Link to="/login" className="text-blue-500 hover:text-blue-600 font-medium">
              Sign in
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
