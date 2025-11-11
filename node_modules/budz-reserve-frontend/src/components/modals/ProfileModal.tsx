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

  // Update form values when user data changes
  useEffect(() => {
    if (user) {
      profileForm.reset({
        name: user.name || '',
        age: user.age || 0,
        sex: (user.sex as 'Male' | 'Female') || 'Male',
        email: user.email || '',
        contact_number: user.contact_number || '',
      })
    }
  }, [user, profileForm])

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  })

  const onProfileSubmit = async (data: ProfileFormData) => {
    try {
      // Call backend API to update profile
      const response = await api.patch('/users/profile', data)
      const updatedUser = response.data
      
      // Preserve existing profile_picture if not included in response or if it's not a full URL
      const currentProfilePicture = user?.profile_picture
      const updatedProfilePicture = updatedUser.profile_picture
      
      // If response has profile_picture but it's not a full URL, convert it
      if (updatedProfilePicture && !updatedProfilePicture.startsWith('http')) {
        updatedUser.profile_picture = `http://localhost:3001${updatedProfilePicture}`
      } else if (!updatedProfilePicture && currentProfilePicture) {
        // If response doesn't include profile_picture, preserve the existing one
        updatedUser.profile_picture = currentProfilePicture
      }
      
      // Update local state with the response from backend (preserving profile picture)
      updateUser(updatedUser)
      toast.success('Profile updated successfully!')
    } catch (error: any) {
      console.error('Profile update error:', error)
      toast.error(error.response?.data?.message || error.message || 'Failed to update profile')
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
      className="fixed inset-0 bg-gradient-to-br from-gray-900/80 via-blue-900/20 to-purple-900/20 backdrop-blur-md flex justify-center items-start sm:items-center overflow-y-auto sm:overflow-hidden z-50 p-3 sm:p-6"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div 
        className="bg-white/95 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-2xl border border-white/20 w-full max-w-3xl sm:max-w-5xl lg:max-w-6xl flex flex-col sm:flex-row overflow-hidden max-h-[calc(100vh-1.5rem)] sm:max-h-[700px] sm:min-h-[620px] animate-in slide-in-from-bottom-4 duration-500"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left Sidebar */}
        <div className="w-full sm:w-1/3 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 border-r border-blue-200/30 flex flex-col relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-32 h-32 bg-white rounded-full -translate-x-16 -translate-y-16"></div>
            <div className="absolute top-20 right-0 w-24 h-24 bg-white rounded-full translate-x-12"></div>
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-white rounded-full -translate-x-20 translate-y-20"></div>
          </div>
          {/* Profile Picture Section */}
          <div className="p-5 sm:p-6 text-center relative z-10">
            <div className="flex justify-center mb-6">
              <div className="relative inline-block group">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full p-1 animate-pulse"></div>
                  <img
                    src={user?.profile_picture || '/assets/img/home-page/Ellipse 1.png'}
                    alt="Profile"
                    className="relative w-28 h-28 rounded-full object-cover border-4 border-white shadow-2xl group-hover:shadow-3xl transition-all duration-500 group-hover:scale-105"
                  />
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-4 border-white shadow-lg flex items-center justify-center">
                    <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                  </div>
                  <div className="absolute inset-0 rounded-full bg-black/30 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center backdrop-blur-sm">
                    <div className="bg-white/20 rounded-full p-3">
                      <Upload className="w-6 h-6 text-white" />
                    </div>
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
              </div>
            </div>
            
            {/* Edit Profile Picture Button */}
            <button
              onClick={handleUploadClick}
              className="text-white/90 text-sm hover:text-white flex items-center justify-center mx-auto font-medium transition-all duration-300 mb-8 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-full backdrop-blur-sm"
            >
              <Upload className="w-4 h-4 mr-2" />
              Edit profile picture
            </button>

            {/* User Info */}
            <div className="mb-8">
              <div className="flex items-center justify-center mb-3">
                {user?.sex === 'Male' ? (
                  <div className="w-6 h-6 bg-blue-400 rounded-full mr-3 flex items-center justify-center shadow-lg">
                    <span className="text-white text-sm font-bold">♂</span>
                  </div>
                ) : user?.sex === 'Female' ? (
                  <div className="w-6 h-6 bg-pink-400 rounded-full mr-3 flex items-center justify-center shadow-lg">
                    <span className="text-white text-sm font-bold">♀</span>
                  </div>
                ) : (
                  <div className="w-6 h-6 bg-gray-400 rounded-full mr-3 shadow-lg"></div>
                )}
                <span className="text-white font-bold text-xl">{user?.name || 'User'}</span>
              </div>
              <div className="text-sm text-white/80 break-all bg-white/10 rounded-lg px-3 py-2 backdrop-blur-sm">
                {user?.email || 'user@example.com'}
              </div>
            </div>
          </div>

          {/* Separator */}
          <div className="border-t border-white/20 mx-6"></div>

          {/* Navigation Section */}
          <div className="flex-1 p-6 relative z-10">
            <nav className="flex flex-wrap gap-3 sm:flex-col sm:gap-0 sm:space-y-4">
              <button
                onClick={() => setActiveTab('profile')}
                className={`flex-1 min-w-[calc(50%-0.75rem)] sm:min-w-0 sm:w-full flex items-center space-x-4 p-4 rounded-2xl transition-all duration-300 group relative overflow-hidden ${
                  activeTab === 'profile'
                    ? 'bg-white/20 text-white shadow-xl backdrop-blur-sm border border-white/30'
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                }`}
              >
                {activeTab === 'profile' && (
                  <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent"></div>
                )}
                <div className={`relative z-10 p-2 rounded-lg ${activeTab === 'profile' ? 'bg-white/20' : 'group-hover:bg-white/10'}`}>
                  <User className="w-5 h-5" />
                </div>
                <span className="font-semibold relative z-10">Manage profile</span>
                {activeTab === 'profile' && (
                  <div className="ml-auto w-3 h-3 bg-white rounded-full shadow-lg relative z-10"></div>
                )}
              </button>
                
              <button
                onClick={() => setActiveTab('password')}
                className={`flex-1 min-w-[calc(50%-0.75rem)] sm:min-w-0 sm:w-full flex items-center space-x-4 p-4 rounded-2xl transition-all duration-300 group relative overflow-hidden ${
                  activeTab === 'password'
                    ? 'bg-white/20 text-white shadow-xl backdrop-blur-sm border border-white/30'
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                }`}
              >
                {activeTab === 'password' && (
                  <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent"></div>
                )}
                <div className={`relative z-10 p-2 rounded-lg ${activeTab === 'password' ? 'bg-white/20' : 'group-hover:bg-white/10'}`}>
                  <Lock className="w-5 h-5" />
                </div>
                <span className="font-semibold relative z-10">Change password</span>
                {activeTab === 'password' && (
                  <div className="ml-auto w-3 h-3 bg-white rounded-full shadow-lg relative z-10"></div>
                )}
              </button>
            </nav>
          </div>

          {/* Logout Button Section */}
          <div className="p-6 border-t border-white/20 relative z-10">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center space-x-3 p-4 rounded-2xl text-white/90 hover:text-white transition-all duration-300 group bg-red-500/20 hover:bg-red-500/30 border border-red-400/30 hover:border-red-400/50 backdrop-blur-sm"
            >
              <div className="p-2 rounded-lg bg-red-500/20 group-hover:bg-red-500/30 transition-colors duration-300">
                <svg className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </div>
              <span className="font-semibold">Logout</span>
            </button>
          </div>
        </div>

        {/* Right Content */}
        <div className="w-full sm:w-2/3 p-4 sm:p-8 flex flex-col bg-gradient-to-br from-gray-50/50 to-white/80 overflow-y-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-2 mb-4 sm:mb-8">
            <div className="relative">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent">
                {activeTab === 'profile' ? 'My Profile' : 'Change Password'}
              </h2>
              <p className="text-sm text-gray-600 mt-2 font-medium">
                {activeTab === 'profile' ? 'Manage your personal information' : 'Update your account security'}
              </p>
              <div className="absolute -bottom-2 left-0 w-16 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"></div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-all duration-300 p-3 hover:bg-gray-100 rounded-xl group"
              aria-label="Close profile modal"
              title="Close profile modal"
            >
              <X className="w-6 h-6 group-hover:scale-110 transition-transform duration-200" />
            </button>
          </div>

          {/* Mobile tab controls */}
          <div className="sm:hidden grid grid-cols-2 gap-3 mb-6">
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition-all duration-300 ${
                activeTab === 'profile'
                  ? 'bg-blue-500 text-white shadow-lg'
                  : 'bg-white/80 text-gray-700 border border-gray-200'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Profile</span>
            </button>
            <button
              onClick={() => setActiveTab('password')}
              className={`flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition-all duration-300 ${
                activeTab === 'password'
                  ? 'bg-indigo-500 text-white shadow-lg'
                  : 'bg-white/80 text-gray-700 border border-gray-200'
              }`}
            >
              <Lock className="w-4 h-4" />
              <span>Password</span>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 flex justify-center">
            <div className="max-w-2xl w-full">
              {activeTab === 'profile' ? (
                <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6 sm:space-y-8 py-4 sm:py-6">
                  {/* Username Field */}
                  <div className="space-y-3">
                    <label className="text-sm font-bold text-gray-800 flex items-center">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                      Username
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 sm:pl-5 flex items-center pointer-events-none">
                        <div className="p-2 rounded-lg bg-blue-50 group-focus-within:bg-blue-100 transition-colors duration-300">
                          <User className="h-5 w-5 text-blue-500 group-focus-within:text-blue-600 transition-colors duration-200" />
                        </div>
                      </div>
                      <input
                        {...profileForm.register('name')}
                        className="w-full pl-16 sm:pl-20 pr-6 py-4 sm:py-5 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 bg-white/80 focus:bg-white shadow-sm hover:shadow-md focus:shadow-lg"
                        placeholder="Enter your name"
                        autoComplete="name"
                      />
                    </div>
                    {profileForm.formState.errors.name && (
                      <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-xl">
                        <p className="text-sm text-red-600 flex items-center">
                          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          {profileForm.formState.errors.name.message}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Email Field */}
                  <div className="space-y-3">
                    <label className="text-sm font-bold text-gray-800 flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                      Email
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 sm:pl-5 flex items-center pointer-events-none">
                        <div className="p-2 rounded-lg bg-green-50 group-focus-within:bg-green-100 transition-colors duration-300">
                          <Mail className="h-5 w-5 text-green-500 group-focus-within:text-green-600 transition-colors duration-200" />
                        </div>
                      </div>
                      <input
                        {...profileForm.register('email')}
                        type="email"
                        className="w-full pl-16 sm:pl-20 pr-6 py-4 sm:py-5 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all duration-300 bg-white/80 focus:bg-white shadow-sm hover:shadow-md focus:shadow-lg"
                        placeholder="Enter your email"
                        autoComplete="email"
                      />
                    </div>
                    {profileForm.formState.errors.email && (
                      <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-xl">
                        <p className="text-sm text-red-600 flex items-center">
                          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          {profileForm.formState.errors.email.message}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Age and Sex Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
                    {/* Age Field */}
                    <div className="space-y-3">
                      <label className="text-sm font-bold text-gray-800 flex items-center">
                        <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                        Age
                      </label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 sm:pl-5 flex items-center pointer-events-none">
                          <div className="p-2 rounded-lg bg-purple-50 group-focus-within:bg-purple-100 transition-colors duration-300">
                            <Calendar className="h-5 w-5 text-purple-500 group-focus-within:text-purple-600 transition-colors duration-200" />
                          </div>
                        </div>
                        <input
                          {...profileForm.register('age', { valueAsNumber: true })}
                          type="number"
                          className="w-full pl-16 sm:pl-20 pr-6 py-4 sm:py-5 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-300 bg-white/80 focus:bg-white shadow-sm hover:shadow-md focus:shadow-lg"
                          placeholder="Enter your age"
                        />
                      </div>
                      {profileForm.formState.errors.age && (
                        <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-xl">
                          <p className="text-sm text-red-600 flex items-center">
                            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            {profileForm.formState.errors.age.message}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Sex Field */}
                    <div className="space-y-3">
                      <label className="text-sm font-bold text-gray-800 flex items-center">
                        <div className="w-2 h-2 bg-pink-500 rounded-full mr-3"></div>
                        Gender
                      </label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 sm:pl-5 flex items-center pointer-events-none">
                          <div className="p-2 rounded-lg bg-pink-50 group-focus-within:bg-pink-100 transition-colors duration-300">
                            <div className="w-5 h-5 flex items-center justify-center">
                              {user?.sex === 'Male' ? (
                                <span className="text-pink-500 text-lg font-bold">♂</span>
                              ) : (
                                <span className="text-pink-500 text-lg font-bold">♀</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <select
                          {...profileForm.register('sex')}
                          className="w-full pl-16 sm:pl-20 pr-12 py-4 sm:py-5 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-pink-500/20 focus:border-pink-500 transition-all duration-300 bg-white/80 focus:bg-white shadow-sm hover:shadow-md focus:shadow-lg appearance-none cursor-pointer"
                        >
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                        </select>
                        <div className="absolute inset-y-0 right-0 pr-6 flex items-center pointer-events-none">
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                      {profileForm.formState.errors.sex && (
                        <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-xl">
                          <p className="text-sm text-red-600 flex items-center">
                            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            {profileForm.formState.errors.sex.message}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Contact Number Field */}
                  <div className="space-y-3">
                    <label className="text-sm font-bold text-gray-800 flex items-center">
                      <div className="w-2 h-2 bg-orange-500 rounded-full mr-3"></div>
                      Contact Number
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 sm:pl-5 flex items-center pointer-events-none">
                        <div className="p-2 rounded-lg bg-orange-50 group-focus-within:bg-orange-100 transition-colors duration-300">
                          <Phone className="h-5 w-5 text-orange-500 group-focus-within:text-orange-600 transition-colors duration-200" />
                        </div>
                      </div>
                      <input
                        {...profileForm.register('contact_number')}
                        type="tel"
                        className="w-full pl-16 sm:pl-20 pr-6 py-4 sm:py-5 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 transition-all duration-300 bg-white/80 focus:bg-white shadow-sm hover:shadow-md focus:shadow-lg"
                        placeholder="Enter your contact number"
                        autoComplete="tel"
                      />
                    </div>
                    {profileForm.formState.errors.contact_number && (
                      <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-xl">
                        <p className="text-sm text-red-600 flex items-center">
                          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          {profileForm.formState.errors.contact_number.message}
                        </p>
                      </div>
                    )}
                  </div>
                </form>
              ) : (
                <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-5 sm:space-y-6 py-3 sm:py-4">
                  {/* Current Password */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Current Password
                    </label>
                    <div className="relative group">
                      <input
                        {...passwordForm.register('currentPassword')}
                        type={showPasswords.current ? 'text' : 'password'}
                        className="w-full px-4 py-3 sm:py-4 pr-12 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 bg-gray-50/50 focus:bg-white"
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
                        className="w-full px-4 py-3 sm:py-4 pr-12 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 bg-gray-50/50 focus:bg-white"
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
                        className="w-full px-4 py-3 sm:py-4 pr-12 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 bg-gray-50/50 focus:bg-white"
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
          <div className="flex flex-col sm:flex-row sm:justify-end gap-3 pt-6 sm:pt-8 pb-5 sm:pb-6 border-t border-gray-200/50">
            <button
              onClick={activeTab === 'profile' ? profileForm.handleSubmit(onProfileSubmit) : passwordForm.handleSubmit(onPasswordSubmit)}
              disabled={isPasswordChanging}
              className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-2xl font-bold hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 flex items-center justify-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none disabled:hover:scale-100 w-full sm:w-auto min-h-[52px]"
            >
              {isPasswordChanging ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Changing Password...</span>
                </>
              ) : (
                <>
                  <div className="p-1 bg-white/20 rounded-lg">
                    <Save className="w-5 h-5" />
                  </div>
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