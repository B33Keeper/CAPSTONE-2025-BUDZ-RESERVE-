import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm, FieldErrors } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuthStore } from '@/store/authStore'
import toast from 'react-hot-toast'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { getErrorMessage } from '@/lib/errorUtils'

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
        // Redirect to the intended destination (booking page)
        navigate(returnUrl)
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
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f0f0f0' }}>
      <div className="bg-white rounded-lg shadow-lg p-12 w-full max-w-lg">
        {/* BBC Logo */}
        <div className="text-center mb-8">
          <img src="/assets/icons/BBC ICON.png" alt="BBC Logo" className="h-32 mx-auto mb-4" />
        </div>

        <form className="space-y-6" onSubmit={handleSubmit(onSubmit, onInvalid)}>
          {/* Username Field */}
          <div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <input
                {...register('username')}
                type="text"
                autoComplete="username"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Username"
              />
            </div>
            {errors.username && (
              <p className="mt-1 text-sm text-red-600">{errors.username.message}</p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Password"
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
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
            )}
          </div>

          {/* Remember Me Checkbox */}
          <div className="flex items-center">
            <input
              id="remember-me"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
              Remember me
            </label>
          </div>

          {/* Sign In Button */}
          <div>
            <button
              type="submit"
              disabled={isLoading || isSubmitting}
              className="w-full bg-blue-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </div>

          {/* Forgot Password Link */}
          <div className="text-center">
            <Link to="/forgot-password" className="text-blue-500 hover:text-blue-600 text-sm">
              Forgot password?
            </Link>
          </div>

          {/* Sign Up Link */}
          <div className="text-center text-sm">
            <span className="text-gray-600">Doesn't have an account yet? </span>
            <Link to="/signup" className="text-blue-500 hover:text-blue-600 font-medium">
              Sign up
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
