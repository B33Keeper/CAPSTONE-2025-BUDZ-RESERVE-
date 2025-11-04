import React, { useState, useEffect } from 'react'
import { AdminLayout } from '@/components/AdminLayout'

const UploadPhoto = () => {
  const [photos, setPhotos] = useState<any[]>([])
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [dragOver, setDragOver] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    category: 'General'
  })
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  // Mock data for existing photos
  useEffect(() => {
    const mockPhotos = [
      {
        id: 1,
        title: 'Badminton Tournament 2024',
        image_path: '/assets/img/home-page/GALLERY/IMAGE 1.jpg',
        description: 'Annual badminton tournament with 50+ participants',
        created_at: '2024-01-15',
        category: 'Tournament'
      },
      {
        id: 2,
        title: 'Weekly Training Session',
        image_path: '/assets/img/home-page/GALLERY/IMAGE 2.jpg',
        description: 'Regular training session with professional coaches',
        created_at: '2024-01-14',
        category: 'Training'
      },
      {
        id: 3,
        title: 'Championship Finals',
        image_path: '/assets/img/home-page/GALLERY/IMAGE 3.jpg',
        description: 'Championship finals with top players',
        created_at: '2024-01-13',
        category: 'Competition'
      },
      {
        id: 4,
        title: 'Youth Development Program',
        image_path: '/assets/img/home-page/GALLERY/IMAGE 4.jpg',
        description: 'Training program for young badminton players',
        created_at: '2024-01-12',
        category: 'Youth'
      },
      {
        id: 5,
        title: 'Community Event',
        image_path: '/assets/img/home-page/GALLERY/IMAGE 5.jpg',
        description: 'Community badminton event for all ages',
        created_at: '2024-01-11',
        category: 'Community'
      },
      {
        id: 6,
        title: 'Professional Coaching',
        image_path: '/assets/img/home-page/GALLERY/IMAGE 6.jpg',
        description: 'One-on-one coaching sessions',
        created_at: '2024-01-10',
        category: 'Coaching'
      }
    ]
    setPhotos(mockPhotos)
    setLoading(false)
  }, [])

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setUploadForm(prev => ({
        ...prev,
        title: file.name.split('.')[0] || file.name
      }))
    }
  }

  const handleUploadAreaClick = () => {
    setShowUploadModal(true)
  }

  const handleFileUpload = async () => {
    if (!selectedFile) return

    setUploading(true)
    try {
      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 1500))

      const newPhoto = {
        id: Date.now(),
        title: uploadForm.title,
        image_path: URL.createObjectURL(selectedFile),
        description: uploadForm.description,
        created_at: new Date().toISOString().split('T')[0],
        category: uploadForm.category
      }

      setPhotos(prev => [...prev, newPhoto])
      setShowUploadModal(false)
      setSelectedFile(null)
      setUploadForm({ title: '', description: '', category: 'General' })
      alert('Photo uploaded successfully!')
    } catch (error) {
      console.error('Upload failed:', error)
      alert('Upload failed. Please try again.')
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
    setUploadForm({ title: '', description: '', category: 'General' })
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleDeletePhoto = async (id: number) => {
    if (confirm('Are you sure you want to delete this photo?')) {
      setPhotos(prev => prev.filter(photo => photo.id !== id))
      alert('Photo deleted successfully!')
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
    <AdminLayout activeSidebarItem="Upload photo">
      <div className="p-3 sm:p-4 lg:p-8 overflow-x-hidden">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
                  Upload Photo
                </h1>
                <p className="text-gray-600 text-lg">
                  Manage and organize your photo gallery
                </p>
              </div>
              <div className="mt-4 sm:mt-0">
                <button className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 hover:shadow-lg hover:scale-105 active:scale-95">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span className="font-medium">Add Announcement</span>
                </button>
              </div>
            </div>
          </div>

          {/* Photos Grid */}
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <span className="ml-4 text-gray-600 text-lg">Loading photos...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {/* Existing Photos */}
              {photos.map((photo) => (
                <div
                  key={photo.id}
                  className="relative group bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 overflow-hidden"
                >
                  <div className="aspect-w-4 aspect-h-3 bg-gray-100 rounded-t-xl overflow-hidden">
                    <img
                      src={photo.image_path}
                      alt={photo.title}
                      className="w-full h-48 sm:h-56 object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                  
                  {/* Category Badge */}
                  <div className="absolute top-3 left-3">
                    <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                      {photo.category}
                    </span>
                  </div>

                  {/* Delete Button */}
                  <button
                    onClick={() => handleDeletePhoto(photo.id)}
                    className="absolute top-3 right-3 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all duration-200 opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>

                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-900 truncate mb-2">
                      {photo.title}
                    </h3>
                    {photo.description && (
                      <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                        {photo.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Uploaded: {new Date(photo.created_at).toLocaleDateString()}</span>
                      <div className="flex items-center space-x-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                        <span>Featured</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Upload Placeholder */}
              <div
                onClick={handleUploadAreaClick}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`relative group bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl border-2 border-dashed transition-all duration-300 hover:scale-105 cursor-pointer ${
                  dragOver 
                    ? 'border-blue-400 bg-blue-50 scale-105' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <div className="flex flex-col items-center justify-center h-48 sm:h-56 p-6">
                  {uploading ? (
                    <div className="flex flex-col items-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                      <p className="text-blue-600 font-medium">Uploading...</p>
                    </div>
                  ) : (
                    <>
                      <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-lg">
                        <svg
                          className="w-8 h-8 text-gray-600 group-hover:text-blue-600 transition-colors"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </div>
                      <p className="text-gray-700 font-medium text-center mb-2">
                        {dragOver ? 'Drop your image here' : 'Add/upload new photo'}
                      </p>
                      <p className="text-gray-500 text-sm text-center">
                        Click or drag & drop
                      </p>
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

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Upload Photo</h2>
              <button
                onClick={handleModalClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {/* File Selection Area */}
              {!selectedFile ? (
                <div className="mb-6">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 hover:bg-blue-50 transition-colors cursor-pointer"
                  >
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="mt-2 text-sm text-gray-600">
                      <span className="font-medium text-blue-600 hover:text-blue-500">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                  </div>
                </div>
              ) : (
                <div className="mb-6">
                  <img
                    src={selectedFile ? URL.createObjectURL(selectedFile) : ''}
                    alt="Preview"
                    className="w-full h-48 object-cover rounded-lg border border-gray-200"
                  />
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-sm text-gray-600">{selectedFile?.name || ''}</span>
                    <button
                      onClick={() => {
                        setSelectedFile(null)
                        if (fileInputRef.current) {
                          fileInputRef.current.value = ''
                        }
                      }}
                      className="text-sm text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )}

              {/* Form Fields */}
              <div className="space-y-4">
                {/* Title Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Photo Title *
                  </label>
                  <input
                    type="text"
                    value={uploadForm.title}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Enter photo title"
                    required
                  />
                </div>

                {/* Description Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={uploadForm.description}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                    rows={3}
                    placeholder="Enter photo description (optional)"
                  />
                </div>

                {/* Category Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={uploadForm.category}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  >
                    <option value="General">General</option>
                    <option value="Tournament">Tournament</option>
                    <option value="Training">Training</option>
                    <option value="Competition">Competition</option>
                    <option value="Youth">Youth</option>
                    <option value="Community">Community</option>
                    <option value="Coaching">Coaching</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
              <button
                onClick={handleModalClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleFileUpload}
                disabled={uploading || !selectedFile || !uploadForm.title.trim()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
              >
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
    </AdminLayout>
  )
}

export default UploadPhoto