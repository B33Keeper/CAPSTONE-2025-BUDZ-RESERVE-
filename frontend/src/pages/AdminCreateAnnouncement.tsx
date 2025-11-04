import { useState, useRef } from 'react'
import { AdminLayout } from '@/components/AdminLayout'
import { api } from '@/lib/api'
import { AnnouncementHistoryModal } from '@/components/modals/AnnouncementHistoryModal'
import toast from 'react-hot-toast'

export default function AdminCreateAnnouncement() {
  const [showAnnouncementHistory, setShowAnnouncementHistory] = useState(false)
  const [announcementType, setAnnouncementType] = useState<'text' | 'image'>('text')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
    <>
      <AnnouncementHistoryModal 
        isOpen={showAnnouncementHistory} 
        onClose={() => setShowAnnouncementHistory(false)} 
      />
      <AdminLayout activeSidebarItem="Create Announcement">
        <div className="flex-1 min-h-screen">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 sm:p-8">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Announcement</h1>
                  <p className="text-gray-600">Share important updates with users</p>
                </div>
                {/* Announcement History Button */}
                <button
                  onClick={() => setShowAnnouncementHistory(true)}
                  className="flex items-center space-x-2 px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors border border-gray-300"
                  title="View Announcement History"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="hidden sm:inline text-sm font-medium">Announcements</span>
                </button>
              </div>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Announcement Type Selection */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Announcement Type
                    </label>
                    <div className="flex gap-4">
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
                        className={`flex-1 px-6 py-4 rounded-xl border-2 transition-all font-semibold ${
                          announcementType === 'text'
                            ? 'border-blue-600 bg-blue-50 text-blue-700'
                            : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                        }`}
                      >
                        <div className="flex items-center justify-center space-x-2">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span>Text Announcement</span>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setAnnouncementType('image')}
                        className={`flex-1 px-6 py-4 rounded-xl border-2 transition-all font-semibold ${
                          announcementType === 'image'
                            ? 'border-blue-600 bg-blue-50 text-blue-700'
                            : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                        }`}
                      >
                        <div className="flex items-center justify-center space-x-2">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span>Image Announcement</span>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Title */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Enter announcement title"
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                      required
                      disabled={isSubmitting}
                    />
                  </div>

                  {/* Content (for text type) */}
                  {announcementType === 'text' && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Content <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Enter announcement content"
                        rows={8}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all resize-none"
                        required
                        disabled={isSubmitting}
                      />
                    </div>
                  )}

                  {/* Image Upload (for image type) */}
                  {announcementType === 'image' && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Image <span className="text-red-500">*</span>
                      </label>
                      <div className="space-y-4">
                        {!imagePreview ? (
                          <div
                            onClick={() => fileInputRef.current?.click()}
                            className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all"
                          >
                            <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            <p className="text-gray-600 font-medium mb-2">Click to upload an image</p>
                            <p className="text-sm text-gray-500">PNG, JPG, GIF, WEBP up to 10MB</p>
                          </div>
                        ) : (
                          <div className="relative">
                            <img
                              src={imagePreview}
                              alt="Preview"
                              className="w-full h-auto rounded-xl shadow-md"
                            />
                            <button
                              type="button"
                              onClick={handleRemoveImage}
                              className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full hover:bg-red-700 transition-colors"
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
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              Optional Content (Caption)
                            </label>
                            <textarea
                              value={content}
                              onChange={(e) => setContent(e.target.value)}
                              placeholder="Enter optional caption or description"
                              rows={4}
                              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all resize-none"
                              disabled={isSubmitting}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Submit Button */}
                  <div className="flex justify-end space-x-4 pt-4">
                    <button
                      type="button"
                      onClick={() => window.history.back()}
                      className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={isSubmitting}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          <span>Creating...</span>
                        </>
                      ) : (
                        <span>Create Announcement</span>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        
      </AdminLayout>
    </>
  )
}
