import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm, FieldErrors } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuthStore } from '@/store/authStore'
import toast from 'react-hot-toast'
import { Eye, EyeOff } from 'lucide-react'
import { getErrorMessage } from '@/lib/errorUtils'
import { ShuttlecockLoader } from '@/components/ShuttlecockLoader'

const loginSchema = z
  .object({
    username: z
      .string({ required_error: 'Username is required' })
      .trim()
      .min(1, 'Username is required')
      .max(50, 'Username must be at most 50 characters'),
    password: z
      .string({ required_error: 'Password is required' })
      .superRefine((value, ctx) => {
        const trimmed = value.trim()

        if (trimmed.length === 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Password is required',
          })
          return
        }

        if (value.length < 6) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Password must be at least 6 characters',
          })
        }

        if (value.length > 128) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Password must be at most 128 characters',
          })
        }
      }),
  })
  .transform((data) => ({
    ...data,
    username: data.username.trim(),
  }))

type LoginFormData = z.infer<typeof loginSchema>

export function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const { login, isLoading } = useAuthStore()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: 'onChange',
    reValidateMode: 'onBlur',
    defaultValues: {
      username: '',
      password: '',
    },
    shouldFocusError: true,
  })

  // Load saved credentials on component mount
  useEffect(() => {
    try {
      const savedUsername = localStorage.getItem('savedUsername')
      const savedPassword = localStorage.getItem('savedPassword')
      const savedRememberMe = localStorage.getItem('rememberMe') === 'true'

      if (savedUsername && savedPassword && savedRememberMe) {
        setValue('username', savedUsername)
        setValue('password', savedPassword)
        setRememberMe(true)
      }
    } catch (error) {
      const message = getErrorMessage(error, 'Unable to load saved credentials')
      toast.error(message)
    }
  }, [setValue])

  const onSubmit = async (data: LoginFormData) => {
    clearErrors('root')

    try {
      const payload = {
        username: data.username,
        password: data.password,
      }

      const { user } = await login(payload)
      toast.success('Login successful!')

      // Save credentials if "Remember me" is checked
      try {
        if (rememberMe) {
          localStorage.setItem('savedUsername', data.username)
          localStorage.setItem('savedPassword', data.password)
          localStorage.setItem('rememberMe', 'true')
        } else {
          // Clear saved credentials if "Remember me" is unchecked
          localStorage.removeItem('savedUsername')
          localStorage.removeItem('savedPassword')
          localStorage.removeItem('rememberMe')
        }
      } catch (storageError) {
        toast.error(getErrorMessage(storageError, 'Unable to update saved credentials'))
      }

      // Check for returnUrl parameter (when user came from booking action)
      const returnUrl = searchParams.get('returnUrl')

      // Check if user is admin and redirect accordingly
      if (user?.role === 'admin') {
        navigate('/admin')
      } else if (returnUrl) {
        // If returnUrl is /queueing, check if user has access before redirecting
        if (returnUrl.startsWith('/queueing')) {
          try {
            const { apiServices } = await import('@/lib/apiServices')
            const accessCheck = await apiServices.checkQueueingAccess()
            
            if (!accessCheck.hasAccess) {
              // User doesn't have reservation, show error and redirect to home
              toast.error(accessCheck.message || 'You need an active reservation to access the queueing system.')
              navigate('/')
            } else {
              // User has access, redirect to queueing page
              navigate(returnUrl)
            }
          } catch (error: any) {
            // If check fails, show error and redirect to home
            console.error('Error checking queueing access:', error)
            toast.error('Failed to verify reservation access. Please try again.')
            navigate('/')
          }
        } else {
          // For other returnUrls (like /booking), redirect normally
          navigate(returnUrl)
        }
      } else {
        navigate('/')
      }
    } catch (error) {
      const message = getErrorMessage(error, 'Login failed')
      setError('root', { type: 'manual', message })
      toast.error(message)
    }
  }

  const onInvalid = (formErrors: FieldErrors<LoginFormData>) => {
    if (formErrors.username || formErrors.password) {
      toast.error('Please fill in all required fields')
    }
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

        <form className="space-y-6" onSubmit={handleSubmit(onSubmit, onInvalid)}>
          {/* Username Field */}
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
              Username
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors duration-200 group-focus-within:text-blue-600">
                <svg className="h-5 w-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <input
                {...register('username')}
                id="username"
                type="text"
                autoComplete="username"
                className={`w-full pl-10 pr-4 py-3 border-2 rounded-lg transition-all duration-200 ${
                  errors.username 
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
                    : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
                } focus:outline-none focus:ring-4 bg-white hover:bg-blue-50/30 placeholder:text-gray-400`}
                placeholder="Enter your username"
              />
            </div>
            {errors.username && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errors.username.message}
              </p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors duration-200 group-focus-within:text-blue-600">
                <svg className="h-5 w-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <input
                {...register('password')}
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                className={`w-full pl-10 pr-12 py-3 border-2 rounded-lg transition-all duration-200 ${
                  errors.password 
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
                    : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
                } focus:outline-none focus:ring-4 bg-white hover:bg-blue-50/30 placeholder:text-gray-400`}
                placeholder="Enter your password"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center hover:bg-blue-50 rounded-r-lg transition-colors duration-200"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Remember Me Checkbox */}
          <div className="flex items-center group">
            <input
              id="remember-me"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer transition-all duration-200 checked:bg-blue-600 checked:border-blue-600"
            />
            <label htmlFor="remember-me" className="ml-3 block text-sm text-gray-700 cursor-pointer select-none group-hover:text-gray-900 transition-colors">
              Remember me
            </label>
          </div>

          {/* Sign In Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading || isSubmitting}
              className="w-full bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 text-white py-3.5 px-4 rounded-lg font-semibold hover:from-blue-600 hover:via-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-4 focus:ring-blue-300 focus:ring-offset-2 transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-lg"
            >
              {isLoading || isSubmitting ? (
                <>
                  <ShuttlecockLoader size="xs" showProgressBar={false} className="mr-2" />
                  Signing in...
                </>
              ) : (
                <>
                  <span>Sign in</span>
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </>
              )}
            </button>
          </div>

          {/* Forgot Password Link */}
          <div className="text-center pt-2">
            <Link 
              to="/forgot-password" 
              className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors duration-200 hover:underline inline-flex items-center gap-1"
            >
              Forgot password?
            </Link>
          </div>

          {/* Sign Up Link */}
          <div className="text-center text-sm pt-2 border-t border-gray-200">
            <span className="text-gray-600">Doesn't have an account yet? </span>
            <Link 
              to="/signup" 
              className="text-blue-600 hover:text-blue-700 font-semibold transition-colors duration-200 hover:underline inline-flex items-center gap-1"
            >
              Sign up
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
