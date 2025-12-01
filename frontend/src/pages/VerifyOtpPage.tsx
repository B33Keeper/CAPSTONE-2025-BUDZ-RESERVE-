import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { ArrowLeft, CheckCircle } from 'lucide-react'
import api from '@/lib/api'
import { getErrorMessage } from '@/lib/errorUtils'
import { OTP_REGEX } from '@/lib/validation'
import { ShuttlecockLoader } from '@/components/ShuttlecockLoader'

const verifyOtpSchema = z.object({
  otp: z.preprocess(
    (value) => (typeof value === 'string' ? value.replace(/\s+/g, '') : value),
    z
      .string({ required_error: 'OTP is required' })
      .regex(OTP_REGEX, 'OTP must be 6 digits')
  ),
})

type VerifyOtpFormData = z.infer<typeof verifyOtpSchema>

export function VerifyOtpPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isVerified, setIsVerified] = useState(false)
  const [email, setEmail] = useState('')
  const navigate = useNavigate()
  const location = useLocation()

  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors, isSubmitting, isValid },
  } = useForm<VerifyOtpFormData>({
    resolver: zodResolver(verifyOtpSchema),
    mode: 'onChange',
    reValidateMode: 'onBlur',
    defaultValues: {
      otp: '',
    },
    shouldFocusError: true,
  })

  useEffect(() => {
    // Get email from navigation state
    if (location.state?.email) {
      setEmail(location.state.email)
      // If development OTP is provided, show it in a toast
      if (location.state?.developmentOtp) {
        toast.success(
          `Development Mode: Your OTP is ${location.state.developmentOtp}`,
          { duration: 8000 }
        )
      }
    } else {
      // If no email in state, redirect to forgot password
      navigate('/forgot-password')
    }
  }, [location.state, navigate])

  const onSubmit = async (data: VerifyOtpFormData) => {
    clearErrors('root')
    setIsLoading(true)
    try {
      const response = await api.post('/auth/verify-otp', {
        email,
        otp: data.otp,
      })

      setIsVerified(true)
      toast.success('OTP verified successfully!')
      // Navigate to reset password page after a short delay
      setTimeout(() => {
        navigate('/reset-password', { state: { email, otp: data.otp } })
      }, 1500)
    } catch (error) {
      const message = getErrorMessage(error, 'Invalid OTP')
      setError('root', { type: 'manual', message })
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  if (isVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-50 py-12 px-4">
        <div className="bg-white rounded-xl shadow-xl border border-gray-200 p-8 md:p-12 w-full max-w-lg text-center relative overflow-hidden">
          {/* Decorative accent line matching footer color */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600"></div>
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">OTP Verified!</h1>
          <p className="text-gray-600 mb-6">Redirecting to password reset...</p>
          <ShuttlecockLoader size="md" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-50 py-12 px-4">
      <div className="bg-white rounded-xl shadow-xl border border-gray-200 p-8 md:p-12 w-full max-w-lg relative overflow-hidden">
        {/* Decorative accent line matching footer color */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600"></div>
        
        {/* BBC Logo */}
        <div className="text-center mb-8">
          <img src="/assets/icons/BBC ICON.png" alt="BBC Logo" className="h-28 md:h-32 mx-auto mb-4 drop-shadow-sm" />
        </div>

        {/* Back to Forgot Password */}
        <div className="mb-6">
          <Link 
            to="/forgot-password" 
            className="inline-flex items-center text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors duration-200 hover:underline"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Forgot Password
          </Link>
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Verify Your OTP</h2>
          {location.state?.developmentOtp ? (
            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4 mb-4">
              <p className="text-sm font-semibold text-yellow-800 mb-1">Development Mode</p>
              <p className="text-gray-700">
                Your OTP is: <span className="text-2xl font-mono font-bold text-blue-600">{location.state.developmentOtp}</span>
              </p>
              <p className="text-xs text-gray-600 mt-2">SMTP is not configured. Using development OTP.</p>
            </div>
          ) : (
            <>
              <p className="text-gray-600">
                We've sent a 6-digit OTP to <span className="text-blue-600 font-semibold">{email}</span>
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Please check your email and enter the OTP below.
              </p>
            </>
          )}
        </div>

        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
          {/* OTP Field */}
          <div>
            <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-2 text-center">
              Enter 6-Digit OTP
            </label>
            <div className="relative">
              <input
                {...register('otp')}
                id="otp"
                type="text"
                maxLength={6}
                className={`w-full px-4 py-4 text-center text-2xl font-mono border-2 rounded-lg focus:outline-none focus:ring-4 tracking-widest transition-all duration-200 ${
                  errors.otp 
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
                    : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
                } bg-white hover:bg-blue-50/30 placeholder:text-gray-400`}
                placeholder="000000"
                autoComplete="one-time-code"
              />
            </div>
            {errors.otp && (
              <p className="mt-1 text-sm text-red-600 flex items-center justify-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errors.otp.message}
              </p>
            )}
          </div>

          {errors.root && (
            <div className="rounded-lg bg-red-50 border-2 border-red-200 px-4 py-3 text-sm text-red-700 flex items-center gap-2">
              <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {errors.root.message}
            </div>
          )}

          {/* Verify OTP Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading || isSubmitting || !isValid}
              className="w-full bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 text-white py-3.5 px-4 rounded-lg font-semibold hover:from-blue-600 hover:via-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-4 focus:ring-blue-300 focus:ring-offset-2 transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-lg"
            >
              {isLoading || isSubmitting ? (
                <>
                  <ShuttlecockLoader size="xs" showProgressBar={false} className="mr-2" />
                  Verifying...
                </>
              ) : (
                <>
                  <span>Verify OTP</span>
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </>
              )}
            </button>
          </div>

          {/* Resend OTP */}
          <div className="text-center text-sm pt-2 border-t border-gray-200">
            <span className="text-gray-600">Didn't receive the OTP? </span>
            <button
              type="button"
              onClick={() => navigate('/forgot-password', { state: { email } })}
              className="text-blue-600 hover:text-blue-700 font-semibold transition-colors duration-200 hover:underline"
            >
              Resend OTP
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
