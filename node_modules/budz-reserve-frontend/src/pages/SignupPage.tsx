import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuthStore } from '@/store/authStore'
import toast from 'react-hot-toast'
import { Eye, EyeOff } from 'lucide-react'
import { getErrorMessage } from '@/lib/errorUtils'
import { CONTACT_NUMBER_REGEX, PASSWORD_REGEX, USERNAME_REGEX, formatPHPhoneNumber } from '@/lib/validation'
import { ShuttlecockLoader } from '@/components/ShuttlecockLoader'

const signupSchema = z
  .object({
    name: z
      .string({ required_error: 'Name is required' })
      .trim()
      .min(2, 'Name must be at least 2 characters')
      .max(100, 'Name must be at most 100 characters')
      .refine((value) => /[A-Za-z]/.test(value), 'Name must contain letters'),
    age: z
      .preprocess(
        (value) => {
          if (typeof value === 'number' && Number.isNaN(value)) {
            return undefined
          }
          return value
        },
        z
          .number({
            required_error: 'Age is required',
            invalid_type_error: 'Age must be a valid number',
          })
          .int('Age must be a whole number')
          .min(1, 'Age must be at least 1')
          .max(120, 'Age must be less than or equal to 120')
      ),
    sex: z.enum(['Male', 'Female'], {
      required_error: 'Please select a sex',
    }),
    username: z
      .string({ required_error: 'Username is required' })
      .trim()
      .min(3, 'Username must be at least 3 characters')
      .max(30, 'Username must be at most 30 characters')
      .regex(USERNAME_REGEX, 'Username can only contain letters, numbers, and underscores'),
    email: z
      .string({ required_error: 'Email is required' })
      .trim()
      .email('Please enter a valid email address'),
    password: z
      .string({ required_error: 'Password is required' })
      .min(8, 'Password must be at least 8 characters')
      .max(128, 'Password must be at most 128 characters')
      .regex(PASSWORD_REGEX, 'Password must contain uppercase, lowercase, number, and special character'),
    confirmPassword: z.string({ required_error: 'Please confirm your password' }),
    contact_number: z
      .preprocess(
        (value) => {
          if (typeof value !== 'string') return value
          const normalized = value.replace(/[\s-]/g, '').trim()
          return normalized.length === 0 ? undefined : normalized
        },
        z
          .union([
            z.string().regex(CONTACT_NUMBER_REGEX, 'Contact number must contain 10 to 15 digits and may start with +'),
            z.undefined()
          ])
          .optional(),
      ),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })
  .transform((data) => ({
    ...data,
    name: data.name.trim(),
    username: data.username.trim(),
    email: data.email.trim().toLowerCase(),
  }))

type SignupFormData = z.infer<typeof signupSchema>

export function SignupPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const { register: registerUser, isLoading } = useAuthStore()
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    reset,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    mode: 'onChange',
    reValidateMode: 'onBlur',
    defaultValues: {
      name: '',
      age: undefined,
      sex: undefined,
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      contact_number: undefined,
    },
    shouldFocusError: true,
  })

  const handleInvalidSubmit = () => {
    toast.error('Please fill out the required fields.')
  }

  const onSubmit = async (data: SignupFormData) => {
    clearErrors('root')
    try {
      const { confirmPassword, contact_number, ...userData } = data
      const sanitizedData = {
        ...userData,
        contact_number: contact_number ?? undefined,
      }
      await registerUser(sanitizedData)
      toast.success('Account created successfully!')
      reset()
      navigate('/')
    } catch (error) {
      const message = getErrorMessage(error, 'Registration failed')
      setError('root', { type: 'manual', message })
      toast.error(message)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-50 py-12 px-4">
      <div className="bg-white rounded-xl shadow-xl border border-gray-200 p-6 md:p-10 lg:p-12 w-full max-w-2xl relative overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Decorative accent line matching footer color */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600"></div>
        
        {/* BBC Logo */}
        <div className="text-center mb-6">
          <img src="/assets/icons/BBC ICON.png" alt="BBC Logo" className="h-24 md:h-28 mx-auto mb-4 drop-shadow-sm" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Create Your Account</h2>
          <p className="text-sm text-gray-600">Join us and start booking your badminton court today!</p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit(onSubmit, handleInvalidSubmit)}>
          {/* First Row - Full Name and Age */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Full Name Field */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors duration-200 group-focus-within:text-blue-600">
                  <svg className="h-5 w-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <input
                  {...register('name')}
                  id="name"
                  type="text"
                  autoComplete="name"
                  className={`w-full pl-10 pr-4 py-3 border-2 rounded-lg transition-all duration-200 ${
                    errors.name 
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
                      : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
                  } focus:outline-none focus:ring-4 bg-white hover:bg-blue-50/30 placeholder:text-gray-400`}
                  placeholder="Enter your full name"
                />
              </div>
              {errors.name && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* Age Field */}
            <div>
              <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-2">
                Age
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors duration-200 group-focus-within:text-blue-600">
                  <svg className="h-5 w-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <input
                  {...register('age', { valueAsNumber: true })}
                  id="age"
                  type="number"
                  min="1"
                  max="120"
                  className={`w-full pl-10 pr-4 py-3 border-2 rounded-lg transition-all duration-200 ${
                    errors.age 
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
                      : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
                  } focus:outline-none focus:ring-4 bg-white hover:bg-blue-50/30 placeholder:text-gray-400`}
                  placeholder="Enter your age"
                />
              </div>
              {errors.age && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.age.message}
                </p>
              )}
            </div>
          </div>

          {/* Sex Field - Full Width */}
          <div>
            <div className="flex items-center justify-center space-x-4">
              <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Sex:</label>
              <div className="flex items-center space-x-6">
                {['Male', 'Female'].map((sex) => (
                  <label key={sex} className="flex items-center cursor-pointer group">
                    <input
                      {...register('sex')}
                      type="radio"
                      value={sex}
                      className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 cursor-pointer transition-all duration-200 checked:bg-blue-600 checked:border-blue-600"
                    />
                    <span className="ml-2 text-sm text-gray-700 group-hover:text-gray-900 transition-colors">{sex}</span>
                  </label>
                ))}
              </div>
            </div>
            {errors.sex && (
              <p className="mt-1 text-sm text-red-600 text-center flex items-center justify-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errors.sex.message}
              </p>
            )}
          </div>

          {/* Second Row - Username and Email */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  placeholder="Choose a username"
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

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors duration-200 group-focus-within:text-blue-600">
                  <svg className="h-5 w-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <input
                  {...register('email')}
                  id="email"
                  type="email"
                  autoComplete="email"
                  className={`w-full pl-10 pr-4 py-3 border-2 rounded-lg transition-all duration-200 ${
                    errors.email 
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
                      : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
                  } focus:outline-none focus:ring-4 bg-white hover:bg-blue-50/30 placeholder:text-gray-400`}
                  placeholder="your.email@example.com"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.email.message}
                </p>
              )}
            </div>
          </div>

          {/* Third Row - Password and Confirm Password */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  autoComplete="new-password"
                  className={`w-full pl-10 pr-12 py-3 border-2 rounded-lg transition-all duration-200 ${
                    errors.password 
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
                      : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
                  } focus:outline-none focus:ring-4 bg-white hover:bg-blue-50/30 placeholder:text-gray-400`}
                  placeholder="Create a password"
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

            {/* Confirm Password Field */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors duration-200 group-focus-within:text-blue-600">
                  <svg className="h-5 w-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  {...register('confirmPassword')}
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  className={`w-full pl-10 pr-12 py-3 border-2 rounded-lg transition-all duration-200 ${
                    errors.confirmPassword 
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
                      : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
                  } focus:outline-none focus:ring-4 bg-white hover:bg-blue-50/30 placeholder:text-gray-400`}
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center hover:bg-blue-50 rounded-r-lg transition-colors duration-200"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>
          </div>

          {/* Contact Number Field - Full Width */}
          <div>
            <label htmlFor="contact_number" className="block text-sm font-medium text-gray-700 mb-2">
              Contact Number <span className="text-gray-400 font-normal">(Optional)</span>
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors duration-200 group-focus-within:text-blue-600">
                <svg className="h-5 w-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <input
                {...register('contact_number')}
                id="contact_number"
                type="tel"
                className={`w-full pl-10 pr-4 py-3 border-2 rounded-lg transition-all duration-200 ${
                  errors.contact_number 
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
                    : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
                } focus:outline-none focus:ring-4 bg-white hover:bg-blue-50/30 placeholder:text-gray-400`}
                placeholder="+63 9XX XXX XXXX"
                onChange={(e) => {
                  const formatted = formatPHPhoneNumber(e.target.value)
                  e.target.value = formatted
                  register('contact_number').onChange(e)
                }}
              />
            </div>
            {errors.contact_number && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errors.contact_number.message}
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

          {/* Create Account Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading || isSubmitting}
              className="w-full bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 text-white py-3.5 px-4 rounded-lg font-semibold hover:from-blue-600 hover:via-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-4 focus:ring-blue-300 focus:ring-offset-2 transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-lg"
            >
              {isLoading || isSubmitting ? (
                <>
                  <ShuttlecockLoader size="xs" showProgressBar={false} className="mr-2" />
                  Creating account...
                </>
              ) : (
                <>
                  <span>Create account</span>
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </>
              )}
            </button>
          </div>

          {/* Sign In Link */}
          <div className="text-center text-sm pt-2 border-t border-gray-200">
            <span className="text-gray-600">Already have an account? </span>
            <Link 
              to="/login" 
              className="text-blue-600 hover:text-blue-700 font-semibold transition-colors duration-200 hover:underline inline-flex items-center gap-1"
            >
              Sign in
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
