import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { api } from '@/lib/api'
import { AnnouncementHistoryModal } from '@/components/modals/AnnouncementHistoryModal'
import AdminSidebar from '@/components/AdminSidebar'
import AdminFooter from '@/components/AdminFooter'
import { AdminHeader } from '@/components/AdminHeader'
import toast from 'react-hot-toast'

export default function AdminCreateAnnouncement() {
  const [showAnnouncementHistory, setShowAnnouncementHistory] = useState(false)
  const [activeSidebarItem, setActiveSidebarItem] = useState('Add Announcement')
  const [announcementType, setAnnouncementType] = useState<'text' | 'image'>('text')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
      if (!allowedTypes.includes(file.type)) {
        toast.error('Invalid file type. Only images (JPEG, PNG, GIF, WEBP) are allowed.')
        return
      }

      // Validate file size (10MB max)
      const maxSize = 10 * 1024 * 1024 // 10MB
      if (file.size > maxSize) {
        toast.error('File too large. Maximum size is 10MB.')
        return
      }

      setSelectedImage(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveImage = () => {
    setSelectedImage(null)
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) {
      toast.error('Please enter a title')
      return
    }

    if (announcementType === 'text' && !content.trim()) {
      toast.error('Please enter announcement content')
      return
    }

    if (announcementType === 'image' && !selectedImage) {
      toast.error('Please select an image')
      return
    }

    try {
      setIsSubmitting(true)

      if (announcementType === 'image' && selectedImage) {
        // Upload announcement with image
        const formData = new FormData()
        formData.append('title', title)
        formData.append('image', selectedImage)
        if (content.trim()) {
          formData.append('content', content)
        }

        await api.post('/announcements/with-image', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        })
      } else {
        // Create text announcement
        await api.post('/announcements', {
          title,
          content,
          announcement_type: 'text',
          is_active: true,
        })
      }

      toast.success('Announcement created successfully!')
      
      // Reset form
      setTitle('')
      setContent('')
      setSelectedImage(null)
      setImagePreview(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error: any) {
      console.error('Error creating announcement:', error)
      toast.error(error.response?.data?.message || 'Failed to create announcement. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 scroll-smooth">
      {/* Custom Scrollbar Styles */}
      <style dangerouslySetInnerHTML={{ __html: `
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        ::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #cbd5e1, #94a3b8);
          border-radius: 4px;
          transition: background 0.3s ease;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #94a3b8, #64748b);
        }
        ::-webkit-scrollbar-corner {
          background: #f1f5f9;
        }
        * {
          scrollbar-width: thin;
          scrollbar-color: #cbd5e1 #f1f5f9;
        }
      ` }} />
      
      <AnnouncementHistoryModal 
        isOpen={showAnnouncementHistory} 
        onClose={() => setShowAnnouncementHistory(false)} 
      />

      {/* Header */}
      <AdminHeader />

      {/* Main Content with Sidebar */}
      <div className="pt-16">
        <AdminSidebar 
          activeItem={activeSidebarItem} 
          onItemChange={setActiveSidebarItem}
        />

        {/* Main Content */}
        <main className="p-4 sm:p-6 lg:p-8 overflow-x-hidden animate-fadeIn transition-all duration-300 md:ml-64">
          {/* Page Header - Title Container */}
          <div className="mb-8">
            <div className="bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/30 rounded-3xl shadow-2xl border border-gray-200/60 p-8 sm:p-10 animate-slideDown backdrop-blur-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                      </svg>
                    </div>
                    <div>
                      <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-900 bg-clip-text text-transparent mb-2">
                        Create Announcement
                      </h1>
                      <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
                        Share important updates with users
                      </p>
                    </div>
                  </div>
                </div>
                {/* Announcement History Button */}
                <button
                  onClick={() => setShowAnnouncementHistory(true)}
                  className="flex items-center space-x-2 px-6 py-3 rounded-xl bg-white/80 backdrop-blur-sm hover:bg-white border-2 border-gray-200/60 hover:border-blue-400/60 text-gray-700 hover:text-blue-700 transition-all duration-300 hover:shadow-lg hover:scale-105 active:scale-95 font-semibold"
                  title="View Announcement History"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="hidden sm:inline">Announcements</span>
                </button>
              </div>
            </div>
          </div>

          {/* Form Container */}
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-3xl shadow-2xl border border-gray-200/60 p-6 sm:p-8 lg:p-10">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Announcement Type Selection */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-4">
                    Announcement Type
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => {
                        setAnnouncementType('text')
                        setSelectedImage(null)
                        setImagePreview(null)
                        if (fileInputRef.current) {
                          fileInputRef.current.value = ''
                        }
                      }}
                      className={`relative px-6 py-5 rounded-2xl border-2 transition-all duration-300 font-semibold group overflow-hidden ${
                        announcementType === 'text'
                          ? 'border-blue-600 bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-700 shadow-lg scale-105'
                          : 'border-gray-300 bg-white text-gray-700 hover:border-blue-400 hover:bg-blue-50/50 hover:scale-105'
                      }`}
                    >
                      {announcementType === 'text' && (
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-indigo-500/10"></div>
                      )}
                      <div className="relative flex items-center justify-center space-x-3">
                        <div className={`p-2.5 rounded-xl ${
                          announcementType === 'text' 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-gray-100 text-gray-600 group-hover:bg-blue-100 group-hover:text-blue-600'
                        } transition-colors`}>
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <span>Text Announcement</span>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setAnnouncementType('image')}
                      className={`relative px-6 py-5 rounded-2xl border-2 transition-all duration-300 font-semibold group overflow-hidden ${
                        announcementType === 'image'
                          ? 'border-blue-600 bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-700 shadow-lg scale-105'
                          : 'border-gray-300 bg-white text-gray-700 hover:border-blue-400 hover:bg-blue-50/50 hover:scale-105'
                      }`}
                    >
                      {announcementType === 'image' && (
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-indigo-500/10"></div>
                      )}
                      <div className="relative flex items-center justify-center space-x-3">
                        <div className={`p-2.5 rounded-xl ${
                          announcementType === 'image' 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-gray-100 text-gray-600 group-hover:bg-blue-100 group-hover:text-blue-600'
                        } transition-colors`}>
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <span>Image Announcement</span>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter announcement title"
                    className="w-full px-4 py-3.5 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all bg-white text-gray-900 font-medium"
                    required
                    disabled={isSubmitting}
                  />
                </div>

                {/* Content (for text type) */}
                {announcementType === 'text' && (
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-3">
                      Content <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Enter announcement content"
                      rows={10}
                      className="w-full px-4 py-3.5 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all resize-none bg-white text-gray-900"
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                )}

                {/* Image Upload (for image type) */}
                {announcementType === 'image' && (
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-3">
                      Image <span className="text-red-500">*</span>
                    </label>
                    <div className="space-y-4">
                      {!imagePreview ? (
                        <div
                          onClick={() => fileInputRef.current?.click()}
                          className="border-2 border-dashed border-gray-300 rounded-2xl p-12 text-center cursor-pointer hover:border-blue-500 hover:bg-gradient-to-br hover:from-blue-50/50 hover:to-indigo-50/50 transition-all duration-300 group"
                        >
                          <div className="flex flex-col items-center">
                            <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 mb-4 group-hover:scale-110 transition-transform">
                              <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                              </svg>
                            </div>
                            <p className="text-lg font-semibold text-gray-700 mb-2 group-hover:text-blue-600 transition-colors">
                              Click to upload an image
                            </p>
                            <p className="text-sm text-gray-500">PNG, JPG, GIF, WEBP up to 10MB</p>
                          </div>
                        </div>
                      ) : (
                        <div className="relative rounded-2xl overflow-hidden border-2 border-gray-200 shadow-lg">
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="w-full h-auto"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                          <button
                            type="button"
                            onClick={handleRemoveImage}
                            className="absolute top-4 right-4 bg-red-600/90 backdrop-blur-sm text-white p-3 rounded-xl hover:bg-red-700 transition-all duration-200 shadow-lg hover:scale-110"
                            disabled={isSubmitting}
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      )}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageSelect}
                        className="hidden"
                        disabled={isSubmitting}
                      />
                      {imagePreview && (
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-3">
                            Optional Content (Caption)
                          </label>
                          <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Enter optional caption or description"
                            rows={5}
                            className="w-full px-4 py-3.5 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all resize-none bg-white text-gray-900"
                            disabled={isSubmitting}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <div className="flex justify-center pt-6">
                  <button
                    type="submit"
                    className="px-10 py-4 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-600 text-white rounded-xl font-bold text-lg hover:from-blue-700 hover:via-blue-800 hover:to-indigo-700 transition-all duration-200 disabled:from-gray-400 disabled:via-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed flex items-center space-x-3 shadow-xl hover:shadow-2xl transform hover:scale-105 active:scale-95"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Creating...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span>Create Announcement</span>
                      </>
                    )}
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
