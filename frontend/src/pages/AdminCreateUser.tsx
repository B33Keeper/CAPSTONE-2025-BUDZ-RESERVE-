import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'
import { Eye, EyeOff } from 'lucide-react'
import { CONTACT_NUMBER_REGEX, PASSWORD_REGEX, USERNAME_REGEX, formatPHPhoneNumber } from '@/lib/validation'
import AdminSidebar from '@/components/AdminSidebar'
import AdminFooter from '@/components/AdminFooter'
import { AdminHeader } from '@/components/AdminHeader'

const createUserSchema = z
  .object({
    firstName: z
      .string({ required_error: 'First name is required' })
      .trim()
      .min(1, 'First name is required')
      .max(50, 'First name must be at most 50 characters')
      .refine((value) => /[A-Za-z]/.test(value), 'First name must contain letters'),
    middleInitial: z
      .string()
      .trim()
      .max(1, 'Middle initial must be a single character')
      .optional()
      .transform((val) => (val && val.length > 0 ? val.toUpperCase() : undefined)),
    lastName: z
      .string({ required_error: 'Last name is required' })
      .trim()
      .min(1, 'Last name is required')
      .max(50, 'Last name must be at most 50 characters')
      .refine((value) => /[A-Za-z]/.test(value), 'Last name must contain letters'),
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
      .string({ required_error: 'Contact number is required' })
      .trim()
      .min(1, 'Contact number is required')
      .refine(
        (value) => {
          // Remove all non-digit characters except +
          const normalized = value.replace(/[^\d+]/g, '')
          // Must be exactly +63 followed by 10 digits, or 10 digits starting with 9
          // Format: +639XXXXXXXXX (13 chars) or 09XXXXXXXXX (11 chars) or 9XXXXXXXXX (10 chars)
          if (normalized.startsWith('+63')) {
            return normalized.length === 13 && /^\+639\d{9}$/.test(normalized)
          } else if (normalized.startsWith('0')) {
            return normalized.length === 11 && /^09\d{9}$/.test(normalized)
          } else {
            return normalized.length === 10 && /^9\d{9}$/.test(normalized)
          }
        },
        { message: 'Contact number must be a valid Philippine mobile number (e.g., +63 9XX XXX XXXX)' }
      ),
    can_manage_queueing: z.boolean().default(false),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })
  .transform((data) => {
    // Combine firstName, middleInitial, and lastName into a single name field
    const nameParts = [data.firstName.trim()]
    if (data.middleInitial && data.middleInitial.trim().length > 0) {
      nameParts.push(data.middleInitial.trim().toUpperCase())
    }
    nameParts.push(data.lastName.trim())
    const fullName = nameParts.join(' ')
    
    return {
      ...data,
      name: fullName, // Combined name for backend
      username: data.username.trim(),
      email: data.email.trim().toLowerCase(),
    }
  })

type CreateUserFormData = z.infer<typeof createUserSchema>

const AdminCreateUser = () => {
  const [activeSidebarItem, setActiveSidebarItem] = useState('Create User')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    mode: 'onChange',
    defaultValues: {
      firstName: '',
      middleInitial: '',
      lastName: '',
      sex: undefined,
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      contact_number: '',
      can_manage_queueing: false,
    },
  })

  const onSubmit = async (data: CreateUserFormData) => {
    setIsSubmitting(true)
    try {
      // Remove confirmPassword and individual name fields
      const { confirmPassword, firstName, middleInitial, lastName, ...userData } = data
      // Normalize contact number (remove spaces and dashes)
      const sanitizedData = {
        ...userData,
        contact_number: userData.contact_number.replace(/[\s-]/g, '').trim(),
      }
      
      await api.post('/users', sanitizedData)
      toast.success('User account created successfully!')
      reset()
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to create user account'
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <AdminHeader />
      <div className="flex flex-1 overflow-hidden">
        <AdminSidebar activeItem={activeSidebarItem} onItemChange={setActiveSidebarItem} />
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 md:p-8">
              <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Create User Account</h1>
                <p className="text-gray-600">Create a new user account. Users created here can be granted queueing management access.</p>
              </div>

              <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
                {/* First Row - First Name, Middle Initial, Last Name */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* First Name Field */}
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                      First Name
                    </label>
                    <input
                      {...register('firstName')}
                      id="firstName"
                      type="text"
                      className={`w-full px-4 py-3 border-2 rounded-lg transition-all duration-200 ${
                        errors.firstName 
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
                          : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
                      } focus:outline-none focus:ring-4 bg-white`}
                      placeholder="Enter first name"
                    />
                    {errors.firstName && (
                      <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
                    )}
                  </div>

                  {/* Middle Initial Field */}
                  <div>
                    <label htmlFor="middleInitial" className="block text-sm font-medium text-gray-700 mb-2">
                      Middle Initial <span className="text-gray-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      {...register('middleInitial')}
                      id="middleInitial"
                      type="text"
                      maxLength={1}
                      className={`w-full px-4 py-3 border-2 rounded-lg transition-all duration-200 text-center text-lg font-semibold uppercase ${
                        errors.middleInitial 
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
                          : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
                      } focus:outline-none focus:ring-4 bg-white`}
                      placeholder="M"
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^A-Za-z]/g, '').toUpperCase().slice(0, 1)
                        e.target.value = value
                        register('middleInitial').onChange(e)
                      }}
                    />
                    {errors.middleInitial && (
                      <p className="mt-1 text-sm text-red-600">{errors.middleInitial.message}</p>
                    )}
                  </div>

                  {/* Last Name Field */}
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name / Surname
                    </label>
                    <input
                      {...register('lastName')}
                      id="lastName"
                      type="text"
                      className={`w-full px-4 py-3 border-2 rounded-lg transition-all duration-200 ${
                        errors.lastName 
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
                          : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
                      } focus:outline-none focus:ring-4 bg-white`}
                      placeholder="Enter last name"
                    />
                    {errors.lastName && (
                      <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
                    )}
                  </div>
                </div>

                {/* Sex Field */}
                <div>
                  <div className="flex items-center justify-center space-x-4">
                    <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Sex:</label>
                    <div className="flex items-center space-x-6">
                      {['Male', 'Female'].map((sex) => (
                        <label key={sex} className="flex items-center cursor-pointer">
                          <input
                            {...register('sex')}
                            type="radio"
                            value={sex}
                            className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300"
                          />
                          <span className="ml-2 text-sm text-gray-700">{sex}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  {errors.sex && (
                    <p className="mt-1 text-sm text-red-600 text-center">{errors.sex.message}</p>
                  )}
                </div>

                {/* Username and Email */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                      Username
                    </label>
                    <input
                      {...register('username')}
                      id="username"
                      type="text"
                      className={`w-full px-4 py-3 border-2 rounded-lg transition-all duration-200 ${
                        errors.username 
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
                          : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
                      } focus:outline-none focus:ring-4 bg-white`}
                      placeholder="Choose a username"
                    />
                    {errors.username && (
                      <p className="mt-1 text-sm text-red-600">{errors.username.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      {...register('email')}
                      id="email"
                      type="email"
                      className={`w-full px-4 py-3 border-2 rounded-lg transition-all duration-200 ${
                        errors.email 
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
                          : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
                      } focus:outline-none focus:ring-4 bg-white`}
                      placeholder="Enter email address"
                    />
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                    )}
                  </div>
                </div>

                {/* Password Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        {...register('password')}
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        className={`w-full px-4 py-3 pr-10 border-2 rounded-lg transition-all duration-200 ${
                          errors.password 
                            ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
                            : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
                        } focus:outline-none focus:ring-4 bg-white`}
                        placeholder="Enter password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <input
                        {...register('confirmPassword')}
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        className={`w-full px-4 py-3 pr-10 border-2 rounded-lg transition-all duration-200 ${
                          errors.confirmPassword 
                            ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
                            : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
                        } focus:outline-none focus:ring-4 bg-white`}
                        placeholder="Confirm password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
                    )}
                  </div>
                </div>

                {/* Contact Number */}
                <div>
                  <label htmlFor="contact_number" className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Number
                  </label>
                  <input
                    {...register('contact_number')}
                    id="contact_number"
                    type="tel"
                    maxLength={17}
                    className={`w-full px-4 py-3 border-2 rounded-lg transition-all duration-200 ${
                      errors.contact_number 
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
                        : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
                    } focus:outline-none focus:ring-4 bg-white`}
                    placeholder="+63 9XX XXX XXXX"
                    onChange={(e) => {
                      const formatted = formatPHPhoneNumber(e.target.value)
                      e.target.value = formatted
                      register('contact_number').onChange(e)
                    }}
                  />
                  {errors.contact_number && (
                    <p className="mt-1 text-sm text-red-600">{errors.contact_number.message}</p>
                  )}
                </div>

                {/* Can Manage Queueing Checkbox */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <label className="flex items-center cursor-pointer">
                    <input
                      {...register('can_manage_queueing')}
                      type="checkbox"
                      className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="ml-3 text-sm font-medium text-gray-700">
                      Grant Queueing Management Access
                    </span>
                  </label>
                  <p className="mt-2 ml-8 text-xs text-gray-600">
                    When enabled, this user will have access to the "Manage Queueing" feature in the header navigation.
                  </p>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={() => reset()}
                    className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    Reset
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Creating...' : 'Create User'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </main>
      </div>
      <AdminFooter />
    </div>
  )
}

export default AdminCreateUser

