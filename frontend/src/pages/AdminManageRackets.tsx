import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { apiServices, Equipment } from '@/lib/apiServices'
import api from '@/lib/api'
import AdminSidebar from '@/components/AdminSidebar'
import AdminFooter from '@/components/AdminFooter'

type FeedbackType = 'success' | 'error' | 'info'

const AdminManageRackets = () => {
  const [showUserDropdown, setShowUserDropdown] = useState(false)
  const [activeSidebarItem, setActiveSidebarItem] = useState('Manage Rackets')
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingRacket, setEditingRacket] = useState<any>(null)
  const [isAddModal, setIsAddModal] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [rackets, setRackets] = useState<Equipment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [initialRacketData, setInitialRacketData] = useState<SanitizedRacket | null>(null)
  const [feedbackModal, setFeedbackModal] = useState<{
    open: boolean
    type: FeedbackType
    title: string
    message: string
  }>({
    open: false,
    type: 'info',
    title: '',
    message: ''
  })
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean
    title: string
    message: string
    confirmLabel?: string
    onConfirm: (() => Promise<void> | void) | null
  }>({
    open: false,
    title: '',
    message: '',
    confirmLabel: 'Confirm',
    onConfirm: null
  })
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const dropdownRef = useRef<HTMLDivElement>(null)

  const clearFieldError = (field: string) => {
    setFormErrors(prev => {
      if (!prev[field]) return prev
      const { [field]: _removed, ...rest } = prev
      return rest
    })
  }

  const resolveApiBaseUrl = () => {
    const explicitBase = typeof api.defaults.baseURL === 'string' ? api.defaults.baseURL : ''
    if (explicitBase) {
      return explicitBase.replace(/\/api\/?$/, '')
    }
    const envBase = (import.meta.env.VITE_API_URL as string | undefined) || ''
    if (envBase) {
      return envBase.replace(/\/api\/?$/, '')
    }
    return window.location.origin
  }

  interface SanitizedRacket {
    equipment_name: string
    price: number
    stocks: number
    status: string
    unit: string
    weight: string
    tension: string
  }

  const sanitizeRacketForComparison = (data: any): SanitizedRacket => {
    const priceValue = Number(data?.price)
    const stockValue = Number(data?.stocks)

    return {
      equipment_name: (data?.equipment_name ?? '').trim(),
      price: Number.isFinite(priceValue) ? Math.round(priceValue * 100) / 100 : 0,
      stocks: Number.isFinite(stockValue) ? Math.max(0, Math.floor(stockValue)) : 0,
      status: (data?.status ?? 'Available').trim(),
      unit: (data?.unit ?? '').toString().trim(),
      weight: (data?.weight ?? '').toString().trim(),
      tension: (data?.tension ?? '').toString().trim()
    }
  }

  const sortRacketsByCreatedDate = (items: Equipment[]) => {
    return [...items].sort((a, b) => {
      const aDate = a.created_at ? new Date(a.created_at).getTime() : 0
      const bDate = b.created_at ? new Date(b.created_at).getTime() : 0

      if (aDate !== bDate) {
        return aDate - bDate
      }

      return (a.id ?? 0) - (b.id ?? 0)
    })
  }

  const validateRacket = (
    data: SanitizedRacket,
    { isAdd, hasImage }: { isAdd: boolean; hasImage: boolean }
  ) => {
    const errors: Record<string, string> = {}

    if (!data.equipment_name) {
      errors.equipment_name = 'Equipment name is required.'
    }

    if (!Number.isFinite(data.price) || data.price <= 0) {
      errors.price = 'Price must be greater than 0.'
    }

    if (!Number.isInteger(data.stocks) || data.stocks < 0) {
      errors.stocks = 'Stock must be a whole number greater than or equal to 0.'
    }

    if (isAdd && !hasImage) {
      errors.image = 'Please upload a racket image.'
    }

    return errors
  }

  const openFeedbackModal = (type: FeedbackType, title: string, message: string) => {
    setFeedbackModal({
      open: true,
      type,
      title,
      message
    })
  }

  const closeFeedbackModal = () => {
    setFeedbackModal(prev => ({
      ...prev,
      open: false
    }))
  }

  const closeConfirmModal = () => {
    setConfirmModal(prev => ({
      ...prev,
      open: false,
      onConfirm: null
    }))
  }

  const feedbackStyleMap: Record<
    FeedbackType,
    { border: string; iconWrapper: string; iconColor: string; titleColor: string }
  > = {
    success: {
      border: 'border-green-200',
      iconWrapper: 'bg-green-100',
      iconColor: 'text-green-600',
      titleColor: 'text-green-700'
    },
    error: {
      border: 'border-red-200',
      iconWrapper: 'bg-red-100',
      iconColor: 'text-red-600',
      titleColor: 'text-red-700'
    },
    info: {
      border: 'border-blue-200',
      iconWrapper: 'bg-blue-100',
      iconColor: 'text-blue-600',
      titleColor: 'text-blue-700'
    }
  }

  const feedbackIconPathMap: Record<FeedbackType, string> = {
    success: 'M5 13l4 4L19 7',
    error: 'M6 18L18 6M6 6l12 12',
    info: 'M13 16h-1v-4h-1m1-4h.01'
  }

  const feedbackStyle = feedbackStyleMap[feedbackModal.type]
  const feedbackIconPath = feedbackIconPathMap[feedbackModal.type]

  // Helper function to format role
  const formatRole = (role?: string) => {
    if (!role) return 'User'
    return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase()
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  // Fetch equipment from API
  useEffect(() => {
    const fetchEquipment = async () => {
      try {
        setLoading(true)
        setError(null)
        const equipmentData = await apiServices.getEquipment()
        setRackets(sortRacketsByCreatedDate(equipmentData))
      } catch (error: any) {
        console.error('Error fetching equipment:', error)
        setError('Failed to load equipment. Please try again.')
        setRackets([])
      } finally {
        setLoading(false)
      }
    }

    fetchEquipment()
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const executeDeleteRacket = async (racketId: number, racketName: string) => {
    try {
      await api.delete(`/equipment/${racketId}`)
      setRackets(prev => prev.filter(racket => racket.id !== racketId))
      openFeedbackModal('success', 'Racket deleted', `${racketName} has been removed successfully.`)
    } catch (error: any) {
      console.error('Error deleting equipment:', error)
      const errorMessage = error.response?.data?.message || error.message || 'Failed to delete equipment. Please try again.'
      openFeedbackModal('error', 'Failed to delete racket', errorMessage)
    }
  }

  const handleDeleteRacket = (racketId: number) => {
    const racket = rackets.find(r => r.id === racketId)
    const racketName = racket?.equipment_name || 'this racket'

    setConfirmModal({
      open: true,
      title: 'Delete Racket',
      message: `Are you sure you want to delete ${racketName}? This action cannot be undone.`,
      confirmLabel: 'Delete',
      onConfirm: () => executeDeleteRacket(racketId, racketName)
    })
  }

  const handleEditRacket = (racketId: number) => {
    const racket = rackets.find(r => r.id === racketId)
    if (racket) {
      const baseUrl = resolveApiBaseUrl()
      const imageUrl = racket.image_path?.startsWith('http')
        ? racket.image_path
        : racket.image_path
        ? `${baseUrl}${racket.image_path.startsWith('/') ? racket.image_path : `/${racket.image_path}`}`
        : ''
      const preparedRacket = {
        ...racket,
        unit: racket.unit ?? '',
        weight: racket.weight ?? '',
        tension: racket.tension ?? ''
      }
      setFormErrors({})
      setEditingRacket(preparedRacket)
      setInitialRacketData(sanitizeRacketForComparison(preparedRacket))
      setImagePreview(imageUrl)
      setSelectedFile(null)
      setIsAddModal(false)
      setEditModalOpen(true)
    }
  }

  const handleAddRacket = () => {
    const newRacket = {
      id: Date.now(), // Temporary ID
      equipment_name: '',
      stocks: null,
      price: null,
      status: '',
      image_path: '',
      unit: '',
      weight: '',
      tension: ''
    }
    setFormErrors({})
    setEditingRacket(newRacket)
    setInitialRacketData(sanitizeRacketForComparison(newRacket))
    setImagePreview(null)
    setSelectedFile(null)
    setIsAddModal(true)
    setEditModalOpen(true)
  }

  const handleSaveRacket = async () => {
    if (!editingRacket) return

    const sanitizedData = sanitizeRacketForComparison(editingRacket)
    const validationErrors = validateRacket(sanitizedData, {
      isAdd: isAddModal,
      hasImage: Boolean(selectedFile || imagePreview)
    })

    setFormErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) {
      return
    }

    if (!isAddModal && initialRacketData) {
      const hasChanges =
        selectedFile ||
        Object.entries(sanitizedData).some(
          ([key, value]) => initialRacketData[key as keyof SanitizedRacket] !== value
        )

      if (!hasChanges) {
        openFeedbackModal('info', 'No changes made', 'No updates were detected. Adjust a field before saving.')
        return
      }
    }

    setIsSaving(true)

    try {
      const formData = new FormData()
      formData.append('equipment_name', sanitizedData.equipment_name)
      formData.append('stocks', sanitizedData.stocks.toString())
      formData.append('price', sanitizedData.price.toString())
      formData.append('status', sanitizedData.status || 'Available')
      formData.append('unit', sanitizedData.unit)
      formData.append('weight', sanitizedData.weight)
      formData.append('tension', sanitizedData.tension)
      if (selectedFile) {
        formData.append('image', selectedFile)
      }

      if (isAddModal) {
        await api.post('/equipment', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        })
      } else {
        await api.patch(`/equipment/${editingRacket.id}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        })
      }

      // Refresh the equipment list
      const equipmentData = await apiServices.getEquipment()
      setRackets(sortRacketsByCreatedDate(equipmentData))
      
      setEditModalOpen(false)
      setEditingRacket(null)
      setIsAddModal(false)
      setSelectedFile(null)
      setImagePreview(null)
      setFormErrors({})
      setInitialRacketData(null)
      openFeedbackModal(
        'success',
        isAddModal ? 'Racket added' : 'Racket updated',
        `${sanitizedData.equipment_name || 'Equipment'} has been ${isAddModal ? 'added' : 'updated'} successfully.`
      )
    } catch (error: any) {
      console.error('Error saving equipment:', error)
      const errorMessage =
        error.response?.data?.message || error.response?.data?.error || 'Failed to save equipment. Please try again.'
      openFeedbackModal('error', 'Failed to save racket', errorMessage)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancelEdit = () => {
    setEditModalOpen(false)
    setEditingRacket(null)
    setIsAddModal(false)
    setSelectedFile(null)
    setImagePreview(null)
    setFormErrors({})
    setInitialRacketData(null)
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      clearFieldError('image')
      setSelectedFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        const result = reader.result as string
        setImagePreview(result)
        setEditingRacket((prev: any) => ({ ...prev, image: result }))
      }
      reader.readAsDataURL(file)
    } else {
      setSelectedFile(null)
      setImagePreview(null)
      setEditingRacket((prev: any) => ({ ...prev, image: '' }))
    }
  }

  const handleImageClick = (imageSrc: string) => {
    setSelectedImage(imageSrc)
  }

  const closeImageModal = () => {
    setSelectedImage(null)
  }

  return (
    <div className="min-h-screen bg-gray-100 scroll-smooth">
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
          background: #cbd5e1;
          border-radius: 4px;
          transition: background 0.3s ease;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
        ::-webkit-scrollbar-corner {
          background: #f1f5f9;
        }
        /* Firefox scrollbar */
        * {
          scrollbar-width: thin;
          scrollbar-color: #cbd5e1 #f1f5f9;
        }
      ` }} />
      
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40 overflow-visible backdrop-blur-sm bg-white/95">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 overflow-visible">
          <div className="flex justify-between items-center h-14 sm:h-16 relative">
            {/* Logo */}
            <div className="flex items-center">
              <img 
                src="/assets/icons/BBC ICON.png" 
                alt="BBC Logo" 
                className="h-12 w-12 sm:h-16 sm:w-16 lg:h-24 lg:w-24 object-contain hover:scale-105 transition-transform duration-200" 
              />
            </div>

            {/* Right Side - Admin Profile */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  className="flex items-center space-x-2 sm:space-x-3 px-2 sm:px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <img
                    src={user?.profile_picture || '/assets/img/home-page/Ellipse 1.png'}
                    alt="Profile"
                    className="w-6 h-6 sm:w-8 sm:h-8 rounded-full object-cover border-2 border-gray-200"
                  />
                  <div className="text-left hidden sm:block">
                    <div className="text-xs sm:text-sm font-medium text-gray-900">{user?.name || user?.username || 'User'}</div>
                    <div className="text-xs text-gray-500">{formatRole(user?.role)}</div>
                  </div>
                  <svg 
                    className={`w-3 h-3 sm:w-4 sm:h-4 text-gray-400 ${showUserDropdown ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showUserDropdown && (
                  <div className="absolute right-0 mt-2 w-40 sm:w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200"
                       style={{
                         position: 'absolute',
                         top: '100%',
                         right: '0',
                         marginTop: '0.5rem'
                       }}>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center space-x-2 px-3 sm:px-4 py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content with Sidebar */}
      <div className="flex">
        <AdminSidebar activeItem={activeSidebarItem} onItemChange={setActiveSidebarItem} />

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen animate-fadeIn">
          {/* Header Section */}
          <div className="mb-8">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 sm:p-8 animate-slideDown">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-6 lg:space-y-0">
                <div className="flex-1">
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-3">
                    Manage Rackets
                  </h1>
                  <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
                    Manage racket inventory, stock levels, and equipment settings with advanced controls
                  </p>
                </div>
                <button 
                  onClick={handleAddRacket}
                  className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-600 text-white px-8 py-4 rounded-2xl hover:from-blue-700 hover:via-blue-800 hover:to-indigo-700 transition-all duration-300 flex items-center space-x-3 shadow-xl hover:shadow-2xl transform hover:scale-105 w-full lg:w-auto font-semibold text-lg"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span>Add New Racket</span>
                </button>
              </div>
            </div>
          </div>

          {/* Rackets Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mr-4"></div>
              <span className="text-gray-600 text-lg">Loading equipment...</span>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
              <p className="text-red-600 text-lg">{error}</p>
            </div>
          ) : rackets.length === 0 ? (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-center">
              <p className="text-gray-600 text-lg">No equipment available</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 lg:gap-8 animate-fadeInUp">
              {rackets.map((racket) => {
                const apiBaseUrl = resolveApiBaseUrl()
                const normalizedPath = racket.image_path
                  ? racket.image_path.startsWith('http')
                    ? racket.image_path
                    : `${apiBaseUrl}${racket.image_path.startsWith('/') ? racket.image_path : `/${racket.image_path}`}`
                  : `${window.location.origin}/assets/img/equipments/racket.png`
                const imageUrl = normalizedPath
                const priceFormatted = `₱${Number(racket.price || 0).toFixed(2)}`
                
                return (
                  <div key={racket.id} className="group bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-2xl transition-all duration-500 transform hover:scale-105 hover:-translate-y-2">
                    {/* Card Header */}
                    <div className="relative p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                      <h3 className="text-xl font-bold text-gray-900 truncate pr-20">{racket.equipment_name}</h3>
                      <button
                        onClick={() => handleDeleteRacket(racket.id)}
                        className="absolute top-4 right-4 w-16 h-16 bg-gradient-to-br from-red-200 to-red-300 hover:from-red-300 hover:to-red-400 rounded-full flex items-center justify-center transition-all duration-300 group shadow-lg hover:shadow-xl transform hover:scale-110"
                        title="Delete Racket"
                      >
                        <svg className="w-8 h-8 text-red-700 group-hover:text-red-800 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>

                    {/* Racket Image */}
                    <div className="p-6 flex justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                      <div className="w-48 h-48 flex items-center justify-center bg-white rounded-2xl shadow-inner border border-gray-200 group-hover:shadow-lg transition-all duration-300">
                        <img
                          src={imageUrl}
                          alt={racket.equipment_name}
                          onClick={() => handleImageClick(imageUrl)}
                          className="w-full h-full object-contain object-center transition-all duration-500 hover:scale-110 cursor-pointer hover:shadow-xl group-hover:rotate-2"
                          style={{
                            filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.2))'
                          }}
                          title="Click to view full size"
                          onError={(e) => {
                            console.log('Image failed to load:', imageUrl);
                            e.currentTarget.style.display = 'none';
                            // Show fallback content
                            const fallback = e.currentTarget.parentElement;
                            if (fallback) {
                              fallback.innerHTML = `
                                <div class="w-full h-full flex flex-col items-center justify-center text-gray-500">
                                  <svg class="w-16 h-16 mb-2" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                                  </svg>
                                  <span class="text-sm">Racket Image</span>
                                </div>
                              `;
                            }
                          }}
                          onLoad={() => {
                            console.log('Image loaded successfully:', imageUrl);
                          }}
                        />
                      </div>
                    </div>

                    {/* Stock Information */}
                    <div className="px-6 py-4 text-center bg-gradient-to-br from-blue-50 to-indigo-50">
                      <div className="space-y-3">
                        <div className="bg-white rounded-xl p-3 shadow-sm border border-green-100">
                          <p className="text-sm text-gray-600 mb-1">Price</p>
                          <p className="text-xl font-bold text-green-600">{priceFormatted}</p>
                        </div>
                        <div className="bg-white rounded-xl p-3 shadow-sm border border-blue-100">
                          <p className="text-sm text-gray-600 mb-1">Available Stock</p>
                          <p className="text-2xl font-bold text-blue-600">{racket.stocks}</p>
                        </div>
                      </div>
                    </div>

                    {/* Specifications */}
                    <div className="px-6 py-4 bg-white border-t border-gray-100">
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <div className="bg-blue-50/70 rounded-xl px-4 py-3 text-center border border-blue-100">
                          <p className="text-xs text-blue-600 uppercase tracking-wide font-semibold">Unit</p>
                          <p className="text-sm font-medium text-slate-800 mt-1 truncate">
                            {racket.unit?.toString().trim() || '—'}
                          </p>
                        </div>
                        <div className="bg-blue-50/70 rounded-xl px-4 py-3 text-center border border-blue-100">
                          <p className="text-xs text-blue-600 uppercase tracking-wide font-semibold">Weight</p>
                          <p className="text-sm font-medium text-slate-800 mt-1 truncate">
                            {racket.weight?.toString().trim() || '—'}
                          </p>
                        </div>
                        <div className="bg-blue-50/70 rounded-xl px-4 py-3 text-center border border-blue-100">
                          <p className="text-xs text-blue-600 uppercase tracking-wide font-semibold">Tension</p>
                          <p className="text-sm font-medium text-slate-800 mt-1 truncate">
                            {racket.tension?.toString().trim() || '—'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Edit Button */}
                    <div className="p-6 pt-4">
                      <button
                        onClick={() => handleEditRacket(racket.id)}
                        className="w-full bg-gradient-to-r from-gray-200 to-gray-300 hover:from-gray-300 hover:to-gray-400 text-gray-800 py-4 px-6 rounded-xl transition-all duration-300 font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 border-2 border-gray-300 hover:border-gray-400"
                      >
                        <span className="flex items-center justify-center space-x-2">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          <span>Edit Racket</span>
                        </span>
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </main>
      </div>

      {/* Edit Modal */}
      {editModalOpen && editingRacket && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200 text-center">
              <h2 className="text-2xl font-bold text-gray-900">
                {isAddModal ? 'Add New Racket' : 'Edit Racket Information'}
              </h2>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column - Name and Image */}
                <div className="space-y-6">
                  {/* Name Field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Equipment Name:</label>
                    <input
                      type="text"
                      value={editingRacket.equipment_name || ''}
                      onChange={(e) => {
                        clearFieldError('equipment_name')
                        setEditingRacket({ ...editingRacket, equipment_name: e.target.value })
                      }}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                        formErrors.equipment_name
                          ? 'border-red-500 focus:ring-red-500'
                          : 'border-gray-300 focus:ring-blue-500'
                      }`}
                      placeholder="Enter equipment name"
                    />
                    {formErrors.equipment_name && (
                      <p className="mt-2 text-sm text-red-600">{formErrors.equipment_name}</p>
                    )}
                  </div>

                  {/* Price Field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Price (₱):</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={
                        editingRacket.price === undefined ||
                        editingRacket.price === null ||
                        editingRacket.price === ''
                          ? ''
                          : editingRacket.price
                      }
                      onChange={(e) => {
                        clearFieldError('price')
                        const value = Number(e.target.value)
                        setEditingRacket({
                          ...editingRacket,
                          price: Number.isNaN(value) ? null : value
                        })
                      }}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                        formErrors.price
                          ? 'border-red-500 focus:ring-red-500'
                          : 'border-gray-300 focus:ring-blue-500'
                      }`}
                      placeholder="Enter price"
                    />
                    {formErrors.price && (
                      <p className="mt-2 text-sm text-red-600">{formErrors.price}</p>
                    )}
                  </div>

                  {/* Image Upload Section */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Racket Image:</label>
                    <div 
                      className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
                        formErrors.image ? 'border-red-400 hover:border-red-500' : 'border-gray-300 hover:border-blue-400'
                      }`}
                      onClick={() => document.getElementById('racket-image-upload')?.click()}
                    >
                      {imagePreview ? (
                        <div className="w-full h-48 flex items-center justify-center bg-gray-50 rounded-lg mb-4">
                          <img
                            src={imagePreview}
                            alt="Racket Preview"
                            className="max-w-full max-h-full object-contain"
                          />
                        </div>
                      ) : (
                        <div className="w-full h-48 flex flex-col items-center justify-center bg-gray-50 rounded-lg mb-4">
                          <svg className="w-12 h-12 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 0115.9 6H16a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V7a2 2 0 012-2h2" />
                          </svg>
                          <p className="text-sm text-gray-500">Upload an attachment</p>
                        </div>
                      )}
                      <input
                        id="racket-image-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </div>
                    {formErrors.image && (
                      <p className="mt-2 text-sm text-red-600">{formErrors.image}</p>
                    )}
                  </div>
                </div>

                {/* Right Column - Specifications */}
                <div className="space-y-6">
                  {/* Unit Field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Unit:</label>
                    <input
                      type="text"
                      value={editingRacket.unit ?? ''}
                      onChange={(e) => setEditingRacket({...editingRacket, unit: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter unit"
                    />
                  </div>

                  {/* Weight Field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Weight:</label>
                    <input
                      type="text"
                      value={editingRacket.weight ?? ''}
                      onChange={(e) => setEditingRacket({...editingRacket, weight: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter weight"
                    />
                  </div>

                  {/* Tension Field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tension:</label>
                    <input
                      type="text"
                      value={editingRacket.tension ?? ''}
                      onChange={(e) => setEditingRacket({...editingRacket, tension: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter tension"
                    />
                  </div>

                  {/* Quantity/Stock Field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Stock Quantity:</label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={
                        editingRacket.stocks === undefined ||
                        editingRacket.stocks === null ||
                        editingRacket.stocks === ''
                          ? ''
                          : editingRacket.stocks
                      }
                      onChange={(e) => {
                        clearFieldError('stocks')
                        const value = Number(e.target.value)
                        setEditingRacket({
                          ...editingRacket,
                          stocks: Number.isNaN(value) ? null : Math.max(0, Math.floor(value))
                        })
                      }}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                        formErrors.stocks
                          ? 'border-red-500 focus:ring-red-500'
                          : 'border-gray-300 focus:ring-blue-500'
                      }`}
                      placeholder="Enter stock quantity"
                    />
                    {formErrors.stocks && (
                      <p className="mt-2 text-sm text-red-600">{formErrors.stocks}</p>
                    )}
                  </div>

                  {/* Status Field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status:</label>
                    <select
                      value={editingRacket.status ?? ''}
                      onChange={(e) => setEditingRacket({...editingRacket, status: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="" disabled>
                        Select status
                      </option>
                      <option value="Available">Available</option>
                      <option value="Unavailable">Unavailable</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-200 flex justify-center space-x-4">
              <button
                onClick={handleCancelEdit}
                className="px-8 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium shadow-md hover:shadow-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveRacket}
                disabled={isSaving}
                className={`px-8 py-3 bg-blue-500 text-white rounded-lg transition-colors font-medium shadow-md hover:shadow-lg ${
                  isSaving ? 'opacity-60 cursor-not-allowed' : 'hover:bg-blue-600'
                }`}
              >
                {isSaving ? 'Saving...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={closeImageModal}
        >
          <div className="relative max-w-4xl max-h-full">
            <button
              onClick={closeImageModal}
              className="absolute top-4 right-4 z-10 w-10 h-10 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-110"
            >
              <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img
              src={selectedImage}
              alt="Racket full size"
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal.open && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 max-w-lg w-full">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-xl font-semibold text-gray-900">{confirmModal.title}</h3>
            </div>
            <div className="p-6">
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">{confirmModal.message}</p>
            </div>
            <div className="px-6 pb-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  if (!isDeleting) {
                    closeConfirmModal()
                  }
                }}
                className="px-5 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!confirmModal.onConfirm) return
                  setIsDeleting(true)
                  try {
                    await confirmModal.onConfirm()
                  } finally {
                    setIsDeleting(false)
                    closeConfirmModal()
                  }
                }}
                disabled={isDeleting}
                className={`px-5 py-2 rounded-lg text-white transition-colors shadow-md disabled:opacity-60 disabled:cursor-not-allowed ${
                  confirmModal.confirmLabel === 'Delete'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {isDeleting ? 'Processing...' : confirmModal.confirmLabel || 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feedback Modal */}
      {feedbackModal.open && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className={`bg-white rounded-2xl shadow-2xl border ${feedbackStyle.border} max-w-lg w-full`}>
            <div className="p-6 space-y-5">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${feedbackStyle.iconWrapper}`}>
                  <svg className={`w-6 h-6 ${feedbackStyle.iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={feedbackIconPath} />
                  </svg>
                </div>
                <h3 className={`text-xl font-semibold ${feedbackStyle.titleColor}`}>{feedbackModal.title}</h3>
              </div>
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">{feedbackModal.message}</p>
              <div className="flex justify-end">
                <button
                  onClick={closeFeedbackModal}
                  className="px-6 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <AdminFooter />
    </div>
  )
}

export default AdminManageRackets
