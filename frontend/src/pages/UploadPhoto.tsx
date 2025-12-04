import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import AdminSidebar from '@/components/AdminSidebar'
import { AdminHeader } from '@/components/AdminHeader'
import { galleryApiService, GalleryItem, getImageUrl } from '@/lib/galleryApiService'
import toast from 'react-hot-toast'
import { ShuttlecockLoader } from '@/components/ShuttlecockLoader'

const UploadPhoto = () => {
  const [activeSidebarItem, setActiveSidebarItem] = useState('Upload photo')
  const [photos, setPhotos] = useState<GalleryItem[]>([])
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [dragOver, setDragOver] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: ''
  })
  const fileInputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  // Fetch photos from API
  useEffect(() => {
    const fetchPhotos = async () => {
      try {
        setLoading(true)
        const galleryPhotos = await galleryApiService.getAll()
        // Filter only active photos and sort by sort_order or created_at
        const sortedPhotos = galleryPhotos
          .filter(photo => photo.status === 'active')
          .sort((a, b) => {
            if (a.sort_order !== b.sort_order) {
              return a.sort_order - b.sort_order
            }
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          })
        setPhotos(sortedPhotos)
      } catch (error: any) {
        console.error('Error fetching photos:', error)
        toast.error('Failed to load photos')
        setPhotos([])
      } finally {
        setLoading(false)
      }
    }

    fetchPhotos()
  }, [])

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setUploadForm(prev => ({
        ...prev,
        title: file.name.split('.')[0] || file.name
      }))
      setShowUploadModal(true)
    }
  }

  const handleUploadAreaClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileUpload = async () => {
    if (!selectedFile || !uploadForm.title.trim()) {
      toast.error('Please provide a title for the photo')
      return
    }

    setUploading(true)
    try {
      const newPhoto = await galleryApiService.uploadImage(
        selectedFile,
        uploadForm.title,
        uploadForm.description || undefined
      )

      setPhotos(prev => [newPhoto, ...prev])
      setShowUploadModal(false)
      setSelectedFile(null)
      setUploadForm({ title: '', description: '' })
      toast.success('Photo uploaded successfully!')
    } catch (error: any) {
      console.error('Upload failed:', error)
      toast.error(error.response?.data?.message || 'Upload failed. Please try again.')
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleModalClose = () => {
    setShowUploadModal(false)
    setSelectedFile(null)
    setUploadForm({ title: '', description: '' })
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleDeletePhoto = async (id: number) => {
    if (!confirm('Are you sure you want to delete this photo?')) {
      return
    }

    try {
      await galleryApiService.delete(id)
      setPhotos(prev => prev.filter(photo => photo.id !== id))
      toast.success('Photo deleted successfully!')
    } catch (error: any) {
      console.error('Delete failed:', error)
      toast.error(error.response?.data?.message || 'Failed to delete photo. Please try again.')
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    
    const files = e.dataTransfer.files
    if (files.length > 0) {
      const file = files[0]
      if (file.type.startsWith('image/')) {
        setSelectedFile(file)
        setUploadForm(prev => ({
          ...prev,
          title: file.name.split('.')[0] || file.name
        }))
        setShowUploadModal(true)
      }
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

          {/* Page Header */}
          <div className="mb-8">
            <div className="bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/30 rounded-3xl shadow-2xl border border-gray-200/60 p-8 sm:p-10 animate-slideDown backdrop-blur-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-900 bg-clip-text text-transparent mb-2">
                        Upload Photo
                      </h1>
                      <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
                        Manage and organize your photo gallery
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600 bg-white/80 px-4 py-2 rounded-xl border border-gray-200/60">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="font-semibold">{photos.length}</span>
                  <span>photos</span>
                </div>
              </div>
            </div>
          </div>

          {/* Photos Grid */}
          {loading ? (
            <div className="flex flex-col justify-center items-center py-20">
              <ShuttlecockLoader size="lg" />
              <span className="mt-4 text-gray-600 text-lg font-medium">Loading photos...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-fadeInUp">
              {/* Existing Photos */}
              {photos.map((photo, index) => (
                <div
                  key={photo.id}
                  className="relative group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] overflow-hidden border border-gray-200/60"
                >
                  {/* Image Container */}
                  <div className="relative aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                    <img
                      src={getImageUrl(photo.image_path)}
                      alt={photo.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      onError={(e) => {
                        if (e.currentTarget.src !== photo.image_path) {
                          e.currentTarget.src = photo.image_path;
                        }
                      }}
                    />
                    {/* Gradient Overlay on Hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    
                    {/* Delete Button */}
                    <button
                      onClick={() => handleDeletePhoto(photo.id)}
                      className="absolute top-4 right-4 p-2.5 bg-red-500/90 backdrop-blur-sm text-white rounded-xl hover:bg-red-600 transition-all duration-200 opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100 shadow-lg hover:shadow-xl z-10"
                      title="Delete photo"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>

                    {/* Status Badge */}
                    {photo.status === 'active' && (
                      <div className="absolute top-4 left-4 px-3 py-1.5 bg-green-500/90 backdrop-blur-sm text-white text-xs font-semibold rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
                        <div className="flex items-center space-x-1.5">
                          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                          <span>Active</span>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Card Content */}
                  <div className="p-5">
                    <h3 className="text-lg font-bold text-gray-900 truncate mb-2 group-hover:text-blue-600 transition-colors">
                      {photo.title}
                    </h3>
                    {photo.description && (
                      <p className="text-sm text-gray-600 line-clamp-2 mb-4 leading-relaxed">
                        {photo.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-100">
                      <div className="flex items-center space-x-1.5">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>{new Date(photo.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Enhanced Upload Placeholder Card */}
              <div
                onClick={handleUploadAreaClick}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`relative group bg-gradient-to-br ${
                  dragOver 
                    ? 'from-blue-100 via-indigo-100 to-purple-100 border-blue-400 scale-105 shadow-2xl' 
                    : 'from-gray-50 via-blue-50/50 to-indigo-50/50 border-gray-300 hover:border-blue-400'
                } rounded-2xl border-2 border-dashed transition-all duration-300 hover:scale-[1.02] cursor-pointer overflow-hidden shadow-lg hover:shadow-2xl`}
              >
                {/* Animated Background Pattern */}
                <div className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-300">
                  <div className="absolute inset-0" style={{
                    backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)',
                    backgroundSize: '24px 24px'
                  }}></div>
                </div>

                <div className="relative flex flex-col items-center justify-center h-full min-h-[280px] sm:min-h-[320px] p-8">
                  {uploading ? (
                    <div className="flex flex-col items-center">
                      <div className="p-4 rounded-2xl bg-white/80 backdrop-blur-sm shadow-lg mb-4">
                        <ShuttlecockLoader size="md" />
                      </div>
                      <p className="text-blue-600 font-semibold text-lg">Uploading...</p>
                      <p className="text-gray-500 text-sm mt-1">Please wait</p>
                    </div>
                  ) : (
                    <>
                      {/* Icon Container */}
                      <div className={`relative mb-6 transition-all duration-300 ${
                        dragOver ? 'scale-110 rotate-6' : 'group-hover:scale-110 group-hover:rotate-3'
                      }`}>
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-3xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity"></div>
                        <div className="relative w-20 h-20 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl transform group-hover:shadow-blue-500/50">
                          <svg
                            className="w-10 h-10 text-white transform group-hover:scale-110 transition-transform"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                        </div>
                      </div>

                      {/* Text Content */}
                      <div className="text-center space-y-2">
                        <p className={`text-xl font-bold transition-colors ${
                          dragOver 
                            ? 'text-blue-700' 
                            : 'text-gray-800 group-hover:text-blue-600'
                        }`}>
                          {dragOver ? 'Drop your image here' : 'Add New Photo'}
                        </p>
                        <p className="text-sm text-gray-600 group-hover:text-gray-700">
                          Click to browse or drag & drop
                        </p>
                        <div className="flex items-center justify-center space-x-4 mt-4 text-xs text-gray-500">
                          <div className="flex items-center space-x-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span>PNG, JPG</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                            </svg>
                            <span>Max 10MB</span>
                          </div>
                        </div>
                      </div>

                      {/* Shimmer Effect */}
                      <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
            accept="image/*"
          />
        </main>
      </div>

      {/* Enhanced Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden border border-gray-200/60 animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200/60 bg-gradient-to-r from-blue-50/50 to-indigo-50/50">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">Upload Photo</h2>
              </div>
              <button
                onClick={handleModalClose}
                className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all duration-200 hover:scale-110 active:scale-95"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
              {/* File Selection Area */}
              {!selectedFile ? (
                <div className="mb-6">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 rounded-2xl p-12 text-center hover:border-blue-400 hover:bg-gradient-to-br hover:from-blue-50/50 hover:to-indigo-50/50 transition-all duration-300 cursor-pointer group"
                  >
                    <div className="flex flex-col items-center">
                      <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 mb-4 group-hover:scale-110 transition-transform">
                        <svg className="h-12 w-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                      </div>
                      <p className="text-lg font-semibold text-gray-700 mb-2">
                        <span className="text-blue-600 hover:text-blue-700">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-sm text-gray-500">PNG, JPG, GIF up to 10MB</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mb-6">
                  <div className="relative rounded-2xl overflow-hidden border-2 border-gray-200 shadow-lg">
                    <img
                      src={URL.createObjectURL(selectedFile)}
                      alt="Preview"
                      className="w-full h-64 object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                  </div>
                  <div className="mt-4 flex items-center justify-between bg-gray-50 rounded-xl p-3">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-lg bg-blue-100">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <span className="text-sm font-medium text-gray-700">{selectedFile.name}</span>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedFile(null)
                        if (fileInputRef.current) {
                          fileInputRef.current.value = ''
                        }
                      }}
                      className="px-4 py-2 text-sm font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )}

              {/* Form Fields */}
              <div className="space-y-5">
                {/* Title Field */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Photo Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={uploadForm.title}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
                    placeholder="Enter photo title"
                    required
                  />
                </div>

                {/* Description Field */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={uploadForm.description}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-none bg-white"
                    rows={4}
                    placeholder="Enter photo description (optional)"
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200/60 bg-gray-50/50">
              <button
                onClick={handleModalClose}
                className="px-6 py-3 text-gray-700 bg-white hover:bg-gray-100 rounded-xl transition-all duration-200 font-semibold border-2 border-gray-200 hover:border-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleFileUpload}
                disabled={uploading || !selectedFile || !uploadForm.title.trim()}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:via-blue-800 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-200 flex items-center space-x-2 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
              >
                {uploading ? (
                  <>
                    <ShuttlecockLoader size="xs" showProgressBar={false} />
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <span>Upload Photo</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default UploadPhoto
