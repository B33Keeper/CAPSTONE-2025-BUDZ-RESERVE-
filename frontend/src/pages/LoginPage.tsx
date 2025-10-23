import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuthStore } from '@/store/authStore'
import toast from 'react-hot-toast'
import { Eye, EyeOff, Loader2 } from 'lucide-react'

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type LoginFormData = z.infer<typeof loginSchema>

export function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const { login, isLoading } = useAuthStore()
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  // Load saved credentials on component mount
  useEffect(() => {
    const savedUsername = localStorage.getItem('savedUsername')
    const savedPassword = localStorage.getItem('savedPassword')
    const savedRememberMe = localStorage.getItem('rememberMe') === 'true'

    if (savedUsername && savedPassword && savedRememberMe) {
      setValue('username', savedUsername)
      setValue('password', savedPassword)
      setRememberMe(true)
    }
  }, [setValue])

  const onSubmit = async (data: LoginFormData) => {
    try {
      const result = await login(data)
      toast.success('Login successful!')
      
      // Save credentials if "Remember me" is checked
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
      
      // Check for intended destination first
      const intendedDestination = localStorage.getItem('intendedDestination')
      if (intendedDestination) {
        localStorage.removeItem('intendedDestination')
        navigate(intendedDestination)
      } else if (result?.user?.role === 'admin') {
        navigate('/admin')
      } else {
        navigate('/')
      }
    } catch (error: any) {
      toast.error(error.message || 'Login failed')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#f0f0f0' }}>
      <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8 lg:p-12 w-full max-w-lg">
        {/* BBC Logo - Mobile Responsive */}
        <div className="text-center mb-6 sm:mb-8">
          <img src="/assets/icons/BBC ICON.png" alt="BBC Logo" className="h-24 sm:h-28 lg:h-32 mx-auto mb-3 sm:mb-4" />
        </div>

        <form className="space-y-4 sm:space-y-6" onSubmit={handleSubmit(onSubmit)}>
          {/* Username Field - Mobile Responsive */}
          <div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <input
                {...register('username')}
                type="text"
                autoComplete="username"
                className="w-full pl-9 sm:pl-10 pr-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                placeholder="Username"
              />
            </div>
            {errors.username && (
              <p className="mt-1 text-xs sm:text-sm text-red-600">{errors.username.message}</p>
            )}
          </div>

          {/* Password Field - Mobile Responsive */}
          <div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                className="w-full pl-9 sm:pl-10 pr-10 sm:pr-12 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                placeholder="Password"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                ) : (
                  <Eye className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-xs sm:text-sm text-red-600">{errors.password.message}</p>
            )}
          </div>

          {/* Remember Me Checkbox - Mobile Responsive */}
          <div className="flex items-center">
            <input
              id="remember-me"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="remember-me" className="ml-2 block text-xs sm:text-sm text-gray-700">
              Remember me
            </label>
          </div>

          {/* Sign In Button - Mobile Responsive */}
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-500 text-white py-2.5 sm:py-3 px-4 rounded-lg font-medium hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 flex items-center justify-center text-sm sm:text-base"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </div>

          {/* Forgot Password Link - Mobile Responsive */}
          <div className="text-center">
            <Link to="/forgot-password" className="text-blue-500 hover:text-blue-600 text-xs sm:text-sm">
              Forgot password?
            </Link>
          </div>

          {/* Sign Up Link - Mobile Responsive */}
          <div className="text-center text-xs sm:text-sm">
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
