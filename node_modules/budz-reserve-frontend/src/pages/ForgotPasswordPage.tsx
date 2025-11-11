import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { Loader2 } from 'lucide-react'
import api from '@/lib/api'
import { getErrorMessage } from '@/lib/errorUtils'

const forgotPasswordSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .trim()
    .email('Please enter a valid email address')
    .transform((value) => value.toLowerCase()),
})

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>

export function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors, isSubmitting, isValid },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: 'onChange',
    reValidateMode: 'onBlur',
    defaultValues: {
      email: '',
    },
    shouldFocusError: true,
  })

  const onSubmit = async (data: ForgotPasswordFormData) => {
    if (!data.email || data.email.trim() === '') {
      setError('email', { type: 'manual', message: 'Enter your email address' })
      return
    }

    if (!data.email.endsWith('@gmail.com')) {
      setError('email', { type: 'manual', message: 'Please enter a valid Gmail address (e.g., example@gmail.com)' })
      return
    }

    clearErrors('root')
    setIsLoading(true)
    try {
      const response = await api.post('/auth/forgot-password', data)
      
      toast.success(response.data.message || 'OTP sent to your email address!')
      navigate('/verify-otp', { state: { email: data.email } })
    } catch (error) {
      const message = getErrorMessage(error, 'Failed to send OTP')
      setError('root', { type: 'manual', message })
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f0f0f0' }}>
      <div className="bg-white rounded-lg shadow-lg p-12 w-full max-w-lg">
        {/* BBC Logo */}
        <div className="text-center mb-8">
          <img src="/assets/icons/BBC ICON.png" alt="BBC Logo" className="h-32 mx-auto mb-4" />
        </div>


        {/* Title */}
        <div className="text-center mb-8">
          <p className="text-gray-600">
            Enter your email address and we'll send you an OTP to reset your password.
          </p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
          {/* Email Field */}
          <div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <input
                {...register('email')}
                type="email"
                autoComplete="email"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your email address"
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          {errors.root && (
            <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {errors.root.message}
            </div>
          )}

          {/* Send OTP Button */}
          <div>
            <button
              type="submit"
              disabled={isLoading || isSubmitting}
              className="w-full bg-blue-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Sending OTP...
                </>
              ) : (
                'Send OTP'
              )}
            </button>
          </div>

          {/* Remember Password Link */}
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
