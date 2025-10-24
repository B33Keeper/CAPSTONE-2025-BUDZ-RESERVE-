import { useState, useRef, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuthStore } from '@/store/authStore'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'
import { User, Mail, Phone, Calendar, Save, Upload, Lock, X } from 'lucide-react'

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  age: z.number().min(1, 'Age must be at least 1').max(120, 'Age must be less than 120'),
  sex: z.enum(['Male', 'Female']),
  email: z.string().email('Please enter a valid email address'),
  contact_number: z.string().optional(),
})

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
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

type ProfileFormData = z.infer<typeof profileSchema>
type PasswordFormData = z.infer<typeof passwordSchema>

interface ProfileModalProps {
  isOpen: boolean
  onClose: () => void
}

export function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { user, updateUser, logout } = useAuthStore()
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile')
  const [, setIsUploading] = useState(false)
  const [isPasswordChanging, setIsPasswordChanging] = useState(false)
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  })
  const fileInputRef = useRef<HTMLInputElement>(null)

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      age: user?.age || 0,
      sex: (user?.sex as 'Male' | 'Female') || 'Male',
      email: user?.email || '',
      contact_number: user?.contact_number || '',
    },
  })

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  })

  const onProfileSubmit = async (data: ProfileFormData) => {
    try {
      updateUser(data)
      toast.success('Profile updated successfully!')
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile')
    }
  }

  const onPasswordSubmit = async (data: PasswordFormData) => {
    setIsPasswordChanging(true)
    try {
      await api.patch('/users/change-password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      })
      toast.success('Password changed successfully!')
      passwordForm.reset()
    } catch (error: any) {
      // Handle different types of errors with specific messages
      const errorMessage = error.response?.data?.message || error.message
      
      if (error.response?.status === 400) {
        if (errorMessage?.includes('Current password is incorrect')) {
          toast.error('Current password is incorrect. Please try again.')
        } else if (errorMessage?.includes('New password must be different')) {
          toast.error('New password must be different from your current password.')
        } else if (errorMessage?.includes('Current password is required')) {
          toast.error('Please enter your current password.')
        } else if (errorMessage?.includes('New password is required')) {
          toast.error('Please enter a new password.')
        } else if (errorMessage?.includes('at least 8 characters')) {
          toast.error('New password must be at least 8 characters long.')
        } else {
          toast.error(errorMessage || 'Invalid password format. Please check requirements.')
        }
      } else if (error.response?.status === 401) {
        toast.error('Session expired. Please log in again.')
      } else if (error.response?.status === 500) {
        // Check if it's actually a password validation error disguised as 500
        if (errorMessage?.includes('Current password is incorrect')) {
          toast.error('Current password is incorrect. Please try again.')
        } else if (errorMessage?.includes('New password must be different')) {
          toast.error('New password must be different from your current password.')
        } else {
          toast.error('Server error. Please try again later.')
        }
      } else {
        // Check error message regardless of status code
        if (errorMessage?.includes('Current password is incorrect')) {
          toast.error('Current password is incorrect. Please try again.')
        } else if (errorMessage?.includes('New password must be different')) {
          toast.error('New password must be different from your current password.')
        } else {
          toast.error(errorMessage || 'Failed to change password. Please try again.')
        }
      }
    } finally {
      setIsPasswordChanging(false)
    }
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    event.preventDefault()
    event.stopPropagation()
    
    console.log('File input changed:', event.target.files)
    
    const file = event.target.files?.[0]
    if (!file) {
      console.log('No file selected')
      return
    }

    console.log('File selected:', { name: file.name, size: file.size, type: file.type })

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image size must be less than 10MB')
      return
    }

    console.log('Starting upload process...')
    setIsUploading(true)
    try {
      // Create FormData for multipart upload
      const formData = new FormData()
      formData.append('file', file)
      
      console.log('Sending upload request...')
      const response = await api.post('/upload/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      console.log('Upload response:', response.data)
      
      const data = response.data
      const fullImageUrl = `http://localhost:3001${data.profilePicture}`
      updateUser({ profile_picture: fullImageUrl })
      toast.success('Profile picture updated successfully!')
    } catch (error: any) {
      console.error('Upload error:', error)
      toast.error(error.response?.data?.message || error.message || 'Failed to upload image')
    } finally {
      setIsUploading(false)
    }
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleLogout = () => {
    logout()
    onClose()
  }

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[90vh] sm:h-[700px] flex flex-col sm:flex-row overflow-hidden animate-in slide-in-from-bottom-4 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left Sidebar */}
        <div className="w-full sm:w-1/3 bg-gradient-to-br from-blue-50/30 to-indigo-50/30 border-r border-gray-200/50 p-4 sm:p-6 flex flex-col">
          {/* Profile Picture */}
          <div className="text-center mb-6">
            <div className="relative inline-block group">
              <div className="relative">
                <img
                  src={user?.profile_picture || '/assets/img/home-page/Ellipse 1.png'}
                  alt="Profile"
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-4 border-white shadow-lg group-hover:shadow-xl transition-all duration-300"
                />
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-4 border-white shadow-md"></div>
                <div className="absolute inset-0 rounded-full bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <Upload className="w-6 h-6 text-white" />
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                form="none"
              />
              <button
                onClick={handleUploadClick}
                className="text-blue-600 text-sm mt-3 hover:text-blue-700 flex items-center justify-center mx-auto font-medium transition-colors duration-200"
              >
                <Upload className="w-4 h-4 mr-2" />
                Edit profile picture
              </button>
            </div>
          </div>

          {/* User Info */}
          <div className="text-center mb-6">
            <div className="flex items-center justify-center mb-2">
              {user?.sex === 'Male' ? (
                <div className="w-4 h-4 bg-blue-500 rounded-full mr-3 flex items-center justify-center shadow-sm">
                  <span className="text-white text-xs font-bold">♂</span>
                </div>
              ) : user?.sex === 'Female' ? (
                <div className="w-4 h-4 bg-pink-500 rounded-full mr-3 flex items-center justify-center shadow-sm">
                  <span className="text-white text-xs font-bold">♀</span>
                </div>
              ) : (
                <div className="w-4 h-4 bg-gray-400 rounded-full mr-3 shadow-sm"></div>
              )}
              <span className="text-gray-800 font-semibold text-lg">{user?.name || 'User'}</span>
            </div>
            <div className="text-sm text-gray-500">
              {user?.email || 'user@example.com'}
            </div>
          </div>

          {/* Separator */}
          <div className="border-t border-gray-200/50 mb-6"></div>

          {/* Navigation */}
          <nav className="space-y-2 flex-1">
            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center space-x-3 p-4 rounded-xl transition-all duration-200 group ${
                activeTab === 'profile'
                  ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                  : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600'
              }`}
            >
              <User className={`w-5 h-5 ${activeTab === 'profile' ? 'text-white' : 'text-gray-400 group-hover:text-blue-500'}`} />
              <span className="font-medium">Manage profile</span>
              {activeTab === 'profile' && (
                <div className="ml-auto w-2 h-2 bg-white rounded-full"></div>
              )}
            </button>
            <button
              onClick={() => setActiveTab('password')}
              className={`w-full flex items-center space-x-3 p-4 rounded-xl transition-all duration-200 group ${
                activeTab === 'password'
                  ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                  : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600'
              }`}
            >
              <Lock className={`w-5 h-5 ${activeTab === 'password' ? 'text-white' : 'text-gray-400 group-hover:text-blue-500'}`} />
              <span className="font-medium">Change password</span>
              {activeTab === 'password' && (
                <div className="ml-auto w-2 h-2 bg-white rounded-full"></div>
              )}
            </button>
          </nav>

          {/* Logout Button - Bottom Center */}
          <div className="mt-auto pt-4">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center space-x-2 p-4 rounded-xl text-red-600 hover:bg-red-50 hover:text-red-700 transition-all duration-200 group border border-red-200 hover:border-red-300"
            >
              <svg className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>

        {/* Right Content */}
        <div className="w-full sm:w-2/3 p-4 sm:p-6 flex flex-col">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                {activeTab === 'profile' ? 'My Profile' : 'Change Password'}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {activeTab === 'profile' ? 'Manage your personal information' : 'Update your account security'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
              aria-label="Close profile modal"
              title="Close profile modal"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto flex justify-center">
            <div className="max-w-lg w-full">
              {activeTab === 'profile' ? (
                <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6 py-4">
                  {/* Username Field */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Username
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-200" />
                      </div>
                      <input
                        {...profileForm.register('name')}
                        className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 bg-gray-50/50 focus:bg-white"
                        placeholder="Enter your name"
                        autoComplete="name"
                      />
                    </div>
                    {profileForm.formState.errors.name && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {profileForm.formState.errors.name.message}
                      </p>
                    )}
                  </div>

                  {/* Email Field */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Email
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-200" />
                      </div>
                      <input
                        {...profileForm.register('email')}
                        type="email"
                        className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 bg-gray-50/50 focus:bg-white"
                        placeholder="Enter your email"
                        autoComplete="email"
                      />
                    </div>
                    {profileForm.formState.errors.email && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {profileForm.formState.errors.email.message}
                      </p>
                    )}
                  </div>

                  {/* Age and Sex Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* Age Field */}
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">
                        Age
                      </label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <Calendar className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-200" />
                        </div>
                        <input
                          {...profileForm.register('age', { valueAsNumber: true })}
                          type="number"
                          className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 bg-gray-50/50 focus:bg-white"
                          placeholder="Enter your age"
                        />
                      </div>
                      {profileForm.formState.errors.age && (
                        <p className="mt-1 text-sm text-red-600 flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          {profileForm.formState.errors.age.message}
                        </p>
                      )}
                    </div>

                    {/* Sex Field */}
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">
                        Gender
                      </label>
                      <div className="relative group">
                        <select
                          {...profileForm.register('sex')}
                          className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 bg-gray-50/50 focus:bg-white appearance-none cursor-pointer"
                        >
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                        </select>
                        <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                      {profileForm.formState.errors.sex && (
                        <p className="mt-1 text-sm text-red-600 flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          {profileForm.formState.errors.sex.message}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Contact Number Field */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Contact Number
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Phone className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-200" />
                      </div>
                      <input
                        {...profileForm.register('contact_number')}
                        type="tel"
                        className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 bg-gray-50/50 focus:bg-white"
                        placeholder="Enter your contact number"
                        autoComplete="tel"
                      />
                    </div>
                    {profileForm.formState.errors.contact_number && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {profileForm.formState.errors.contact_number.message}
                      </p>
                    )}
                  </div>
                </form>
              ) : (
                <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-6 py-4">
                  {/* Current Password */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Current Password
                    </label>
                    <div className="relative group">
                      <input
                        {...passwordForm.register('currentPassword')}
                        type={showPasswords.current ? 'text' : 'password'}
                        className="w-full px-4 py-4 pr-12 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 bg-gray-50/50 focus:bg-white"
                        placeholder="Enter current password"
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-4 flex items-center hover:bg-gray-100 rounded-r-xl transition-colors duration-200"
                        onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                        aria-label={showPasswords.current ? "Hide current password" : "Show current password"}
                        title={showPasswords.current ? "Hide current password" : "Show current password"}
                      >
                        {showPasswords.current ? (
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                    {passwordForm.formState.errors.currentPassword && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {passwordForm.formState.errors.currentPassword.message}
                      </p>
                    )}
                  </div>

                  {/* New Password */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      New Password
                    </label>
                    <div className="relative group">
                      <input
                        {...passwordForm.register('newPassword')}
                        type={showPasswords.new ? 'text' : 'password'}
                        className="w-full px-4 py-4 pr-12 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 bg-gray-50/50 focus:bg-white"
                        placeholder="Enter new password"
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-4 flex items-center hover:bg-gray-100 rounded-r-xl transition-colors duration-200"
                        onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                        aria-label={showPasswords.new ? "Hide new password" : "Show new password"}
                        title={showPasswords.new ? "Hide new password" : "Show new password"}
                      >
                        {showPasswords.new ? (
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                    {passwordForm.formState.errors.newPassword && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {passwordForm.formState.errors.newPassword.message}
                      </p>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Confirm New Password
                    </label>
                    <div className="relative group">
                      <input
                        {...passwordForm.register('confirmPassword')}
                        type={showPasswords.confirm ? 'text' : 'password'}
                        className="w-full px-4 py-4 pr-12 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 bg-gray-50/50 focus:bg-white"
                        placeholder="Confirm new password"
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-4 flex items-center hover:bg-gray-100 rounded-r-xl transition-colors duration-200"
                        onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                        aria-label={showPasswords.confirm ? "Hide confirm password" : "Show confirm password"}
                        title={showPasswords.confirm ? "Hide confirm password" : "Show confirm password"}
                      >
                        {showPasswords.confirm ? (
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                    {passwordForm.formState.errors.confirmPassword && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {passwordForm.formState.errors.confirmPassword.message}
                      </p>
                    )}
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-8 pb-6 border-t border-gray-200">
            <button
              onClick={activeTab === 'profile' ? profileForm.handleSubmit(onProfileSubmit) : passwordForm.handleSubmit(onPasswordSubmit)}
              disabled={isPasswordChanging}
              className="bg-blue-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPasswordChanging ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Changing Password...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}