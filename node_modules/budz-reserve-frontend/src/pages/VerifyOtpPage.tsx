import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { Loader2, ArrowLeft, CheckCircle } from 'lucide-react'
import api from '@/lib/api'
import { getErrorMessage } from '@/lib/errorUtils'
import { OTP_REGEX } from '@/lib/validation'

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
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f0f0f0' }}>
        <div className="bg-white rounded-lg shadow-lg p-12 w-full max-w-lg text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">OTP Verified!</h1>
          <p className="text-gray-600 mb-6">Redirecting to password reset...</p>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
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

        {/* Back to Forgot Password */}
        <div className="mb-6">
          <Link 
            to="/forgot-password" 
            className="inline-flex items-center text-blue-500 hover:text-blue-600 text-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Forgot Password
          </Link>
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          <p className="text-gray-600">
            We've sent a 6-digit OTP to <strong>{email}</strong>
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Please check your email and enter the OTP below.
          </p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
          {/* OTP Field */}
          <div>
            <div className="relative">
              <input
                {...register('otp')}
                type="text"
                maxLength={6}
                className="w-full px-4 py-3 text-center text-2xl font-mono border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent tracking-widest"
                placeholder="000000"
                autoComplete="one-time-code"
              />
            </div>
            {errors.otp && (
              <p className="mt-1 text-sm text-red-600">{errors.otp.message}</p>
            )}
          </div>

          {errors.root && (
            <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {errors.root.message}
            </div>
          )}

          {/* Verify OTP Button */}
          <div>
            <button
              type="submit"
              disabled={isLoading || isSubmitting || !isValid}
              className="w-full bg-blue-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Verify OTP'
              )}
            </button>
          </div>

          {/* Resend OTP */}
          <div className="text-center text-sm">
            <span className="text-gray-600">Didn't receive the OTP? </span>
            <button
              type="button"
              onClick={() => navigate('/forgot-password', { state: { email } })}
              className="text-blue-500 hover:text-blue-600 font-medium"
            >
              Resend OTP
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
