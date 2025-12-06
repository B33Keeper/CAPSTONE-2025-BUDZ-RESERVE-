import { useState, useEffect } from 'react'
import { apiServices, Equipment } from '@/lib/apiServices'
import { resolveImageUrl } from '@/lib/imageUtils'
import api from '@/lib/api'
import AdminSidebar from '@/components/AdminSidebar'
import { AdminHeader } from '@/components/AdminHeader'

type FeedbackType = 'success' | 'error' | 'info'

const AdminManageRackets = () => {
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
  const [hasActiveRentals, setHasActiveRentals] = useState(false)
  const [checkingRentals, setCheckingRentals] = useState(false)

  const clearFieldError = (field: string) => {
    setFormErrors(prev => {
      if (!prev[field]) return prev
      const { [field]: _removed, ...rest } = prev
      return rest
    })
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

    if (!data.equipment_name || !data.equipment_name.trim()) {
      errors.equipment_name = 'Equipment name is required.'
    }

    if (!Number.isFinite(data.price) || data.price <= 0) {
      errors.price = 'Price must be greater than 0.'
    }

    if (!Number.isInteger(data.stocks) || data.stocks <= 0) {
      errors.stocks = 'Stock quantity is required and must be greater than 0.'
    }

    if (isAdd && !hasImage) {
      errors.image = 'Please upload a racket image.'
    }

    // Make Unit required
    if (!data.unit || !data.unit.trim()) {
      errors.unit = 'Unit is required.'
    }

    // Make Weight required
    if (!data.weight || !data.weight.trim()) {
      errors.weight = 'Weight is required.'
    }

    // Make Tension required
    if (!data.tension || !data.tension.trim()) {
      errors.tension = 'Tension is required.'
    }

    // Status is only required when editing, not when adding (defaults to 'Available')
    if (!isAdd && (!data.status || !data.status.trim())) {
      errors.status = 'Status is required.'
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

  const handleEditRacket = async (racketId: number) => {
    const racket = rackets.find(r => r.id === racketId)
    if (racket) {
      // Check if racket has active or pending rentals
      setCheckingRentals(true)
      try {
        const response = await api.get(`/equipment/${racketId}/has-rentals`)
        setHasActiveRentals(response.data.hasActiveOrPendingRentals || false)
      } catch (error) {
        console.error('Error checking rentals:', error)
        setHasActiveRentals(false) // Default to false if check fails
      } finally {
        setCheckingRentals(false)
      }

      const imageUrl = resolveImageUrl(racket.image_path || '')
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
      status: 'Available', // Default status for new rackets
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
    setHasActiveRentals(false) // Reset rental status for new rackets
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
      setHasActiveRentals(false)
      setCheckingRentals(false)
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
    setHasActiveRentals(false)
    setCheckingRentals(false)
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
      <AdminHeader />

      {/* Main Content with Sidebar */}
      <div className="pt-14 sm:pt-16">
        <AdminSidebar 
          activeItem={activeSidebarItem} 
          onItemChange={setActiveSidebarItem}
        />

        {/* Main Content */}
        <main className="p-4 sm:p-6 lg:p-8 overflow-x-hidden bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen animate-fadeIn transition-all duration-300 md:ml-64">
          {/* Enhanced Header Section */}
          <div className="mb-8">
            <div className="bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/30 rounded-3xl shadow-2xl border border-gray-200/60 p-8 sm:p-10 animate-slideDown backdrop-blur-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                    <div>
                      <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-900 bg-clip-text text-transparent mb-2">
                        Manage Rackets
                      </h1>
                      <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
                        Manage racket inventory, stock levels, and equipment settings with advanced controls
                      </p>
                    </div>
                  </div>
                </div>
                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleAddRacket}
                    className="flex items-center space-x-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-2 border-blue-500/60 hover:border-blue-400 transition-all duration-300 hover:shadow-lg hover:scale-105 active:scale-95 font-semibold"
                    title="Add New Racket"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <span className="hidden sm:inline">Add Racket</span>
                  </button>
                </div>
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
                const imageUrl = racket.image_path 
                  ? resolveImageUrl(racket.image_path)
                  : '/assets/img/equipments/racket-removebg-preview.png'
                const priceFormatted = `₱${Number(racket.price || 0).toFixed(2)}`
                
                return (
                  <div key={racket.id} className="group relative bg-white rounded-3xl shadow-xl border-2 border-gray-100 overflow-hidden hover:shadow-2xl transition-all duration-500 transform hover:scale-[1.02] hover:-translate-y-1 animate-fadeIn">
                    {/* Gradient Border Effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 via-indigo-500/0 to-purple-500/0 group-hover:from-blue-500/10 group-hover:via-indigo-500/10 group-hover:to-purple-500/10 transition-all duration-500 rounded-3xl pointer-events-none"></div>
                    
                    {/* Card Header */}
                    <div className="relative p-5 border-b border-gray-100 bg-gradient-to-r from-slate-50 via-blue-50/30 to-indigo-50/30">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-900 bg-clip-text text-transparent truncate flex-1 pr-3">
                          {racket.equipment_name}
                        </h3>
                        <button
                          onClick={() => handleDeleteRacket(racket.id)}
                          className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-xl flex items-center justify-center transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-110 active:scale-95"
                          title="Delete Racket"
                        >
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Racket Image */}
                    <div className="p-6 flex justify-center bg-gradient-to-br from-gray-50 via-blue-50/20 to-indigo-50/20 relative overflow-hidden">
                      {/* Decorative Background Pattern */}
                      <div className="absolute inset-0 opacity-5">
                        <div className="absolute top-0 left-0 w-32 h-32 bg-blue-500 rounded-full blur-3xl"></div>
                        <div className="absolute bottom-0 right-0 w-32 h-32 bg-indigo-500 rounded-full blur-3xl"></div>
                      </div>
                      <div className="relative w-48 h-48 flex items-center justify-center bg-white rounded-3xl shadow-lg border-2 border-gray-100 group-hover:border-blue-200 group-hover:shadow-xl transition-all duration-500">
                        <img
                          src={imageUrl}
                          alt={racket.equipment_name}
                          onClick={() => handleImageClick(imageUrl)}
                          className="w-full h-full object-contain object-center transition-all duration-500 hover:scale-110 cursor-pointer group-hover:rotate-1"
                          style={{
                            filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.15))'
                          }}
                          title="Click to view full size"
                          onError={(e) => {
                            console.log('Image failed to load:', imageUrl);
                            e.currentTarget.style.display = 'none';
                            // Show fallback content
                            const fallback = e.currentTarget.parentElement;
                            if (fallback) {
                              fallback.innerHTML = `
                                <div class="w-full h-full flex flex-col items-center justify-center text-gray-400">
                                  <svg class="w-16 h-16 mb-2" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                                  </svg>
                                  <span class="text-sm font-medium">Racket Image</span>
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

                    {/* Specifications, Price, and Stock - Compact Layout */}
                    <div className="px-6 py-4 bg-gradient-to-br from-blue-50/50 via-indigo-50/30 to-purple-50/20 space-y-3">
                      {/* Specifications - Unit, Weight, Tension - Top Row */}
                      <div className="grid grid-cols-3 gap-2">
                        {/* Unit */}
                        <div className="bg-white/80 rounded-lg px-2 py-2 text-center border border-blue-100 hover:border-blue-200 transition-all duration-300">
                          <p className="text-[9px] text-blue-600 uppercase tracking-wider font-bold mb-0.5">Unit</p>
                          <p className="text-[11px] font-semibold text-gray-800 truncate w-full">
                            {racket.unit?.toString().trim() || '—'}
                          </p>
                        </div>

                        {/* Weight */}
                        <div className="bg-white/80 rounded-lg px-2 py-2 text-center border border-blue-100 hover:border-blue-200 transition-all duration-300">
                          <p className="text-[9px] text-blue-600 uppercase tracking-wider font-bold mb-0.5">Weight</p>
                          <p className="text-[11px] font-semibold text-gray-800 truncate w-full">
                            {racket.weight?.toString().trim() || '—'}
                          </p>
                        </div>

                        {/* Tension */}
                        <div className="bg-white/80 rounded-lg px-2 py-2 text-center border border-blue-100 hover:border-blue-200 transition-all duration-300">
                          <p className="text-[9px] text-blue-600 uppercase tracking-wider font-bold mb-0.5">Tension</p>
                          <p className="text-[11px] font-semibold text-gray-800 truncate w-full">
                            {racket.tension?.toString().trim() || '—'}
                          </p>
                        </div>
                      </div>

                      {/* Price and Stock - Bottom Row */}
                      <div className="grid grid-cols-2 gap-3">
                        {/* Price */}
                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-3 shadow-sm border border-green-100 hover:border-green-200 transition-all duration-300 text-center">
                          <p className="text-[10px] font-semibold text-green-700 uppercase tracking-wide">Price</p>
                          <p className="text-lg font-bold bg-gradient-to-r from-green-600 to-emerald-700 bg-clip-text text-transparent mt-1">
                            {priceFormatted}
                          </p>
                        </div>

                        {/* Stock */}
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-3 shadow-sm border border-blue-100 hover:border-blue-200 transition-all duration-300 text-center">
                          <p className="text-[10px] font-semibold text-blue-700 uppercase tracking-wide">Stock</p>
                          <p className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent mt-1">
                            {racket.stocks}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Edit Button */}
                    <div className="p-6 pt-4 bg-gradient-to-br from-gray-50 to-white">
                      <button
                        onClick={() => handleEditRacket(racket.id)}
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-4 px-6 rounded-2xl transition-all duration-300 font-bold text-base shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] border-2 border-blue-500/30 hover:border-blue-400/50"
                      >
                        <span className="flex items-center justify-center space-x-2">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
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
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn"
          onClick={handleCancelEdit}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-slideUp"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Enhanced Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-6 text-white relative">
              <button
                onClick={handleCancelEdit}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all duration-200 hover:scale-110"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-bold">
                    {isAddModal ? 'Add New Racket' : 'Edit Racket Information'}
                  </h2>
                  <p className="text-blue-100 text-sm mt-1">
                    {isAddModal ? 'Fill in the details to add a new racket to inventory' : 'Update the racket information below'}
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column - Name and Image */}
                <div className="space-y-6">
                  {/* Name Field */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      Equipment Name
                      <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={editingRacket.equipment_name || ''}
                        onChange={(e) => {
                          clearFieldError('equipment_name')
                          setEditingRacket({ ...editingRacket, equipment_name: e.target.value })
                        }}
                        maxLength={100}
                        className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 transition-all ${
                          formErrors.equipment_name
                            ? 'border-red-400 focus:ring-red-500 focus:border-red-500'
                            : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                        }`}
                        placeholder="e.g., Yonex GR 303"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                        {(editingRacket.equipment_name || '').length}/100
                      </div>
                    </div>
                    {formErrors.equipment_name && (
                      <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {formErrors.equipment_name}
                      </p>
                    )}
                  </div>

                  {/* Price Field */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Price (₱)
                      <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">₱</div>
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
                        disabled={(!isAddModal && hasActiveRentals) || checkingRentals}
                        className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 transition-all ${
                          (!isAddModal && hasActiveRentals) || checkingRentals
                            ? 'bg-gray-100 border-gray-300 cursor-not-allowed text-gray-500'
                            : formErrors.price
                            ? 'border-red-400 focus:ring-red-500 focus:border-red-500'
                            : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                        }`}
                        placeholder="0.00"
                      />
                    </div>
                    {!isAddModal && hasActiveRentals && (
                      <p className="mt-2 text-sm text-amber-600 flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        Price cannot be modified. This racket has active or pending rentals.
                      </p>
                    )}
                    {formErrors.price && (
                      <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {formErrors.price}
                      </p>
                    )}
                  </div>

                  {/* Enhanced Image Upload Section */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                      <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Racket Image
                      <span className="text-red-500">*</span>
                    </label>
                    <div 
                      className={`group border-2 border-dashed rounded-xl p-6 text-center transition-all duration-300 cursor-pointer relative overflow-hidden ${
                        formErrors.image 
                          ? 'border-red-400 hover:border-red-500 bg-red-50/50' 
                          : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50/30 bg-gray-50/50'
                      }`}
                      onClick={() => document.getElementById('racket-image-upload')?.click()}
                      onDragOver={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                      }}
                      onDrop={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        const files = e.dataTransfer.files
                        if (files.length > 0 && files[0].type.startsWith('image/')) {
                          handleFileChange({ target: { files: [files[0]] } } as any)
                        }
                      }}
                    >
                      {imagePreview ? (
                        <div className="relative w-full h-56 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl mb-4 overflow-hidden group-hover:shadow-lg transition-shadow">
                          <img
                            src={imagePreview}
                            alt="Racket Preview"
                            className="max-w-full max-h-full object-contain rounded-lg"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded-full p-3 shadow-lg">
                              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="w-full h-56 flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl mb-4 group-hover:from-blue-50 group-hover:to-indigo-50 transition-all">
                          <div className="w-16 h-16 rounded-full bg-blue-100 group-hover:bg-blue-200 flex items-center justify-center mb-4 transition-colors">
                            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <p className="text-sm font-medium text-gray-700 mb-1">Click to upload or drag and drop</p>
                          <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
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
                      <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {formErrors.image}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right Column - Specifications */}
                <div className="space-y-6">
                  {/* Unit Field */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                      <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Unit
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={editingRacket.unit ?? ''}
                      onChange={(e) => {
                        clearFieldError('unit')
                        setEditingRacket({...editingRacket, unit: e.target.value})
                      }}
                      maxLength={100}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 transition-all ${
                        formErrors.unit
                          ? 'border-red-400 focus:ring-red-500 focus:border-red-500'
                          : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                      }`}
                      placeholder="e.g., Head Heavy"
                    />
                    {formErrors.unit && (
                      <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {formErrors.unit}
                      </p>
                    )}
                  </div>

                  {/* Weight Field */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                      <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                      </svg>
                      Weight
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={editingRacket.weight ?? ''}
                      onChange={(e) => {
                        clearFieldError('weight')
                        setEditingRacket({...editingRacket, weight: e.target.value})
                      }}
                      maxLength={100}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 transition-all ${
                        formErrors.weight
                          ? 'border-red-400 focus:ring-red-500 focus:border-red-500'
                          : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                      }`}
                      placeholder="e.g., 5U"
                    />
                    {formErrors.weight && (
                      <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {formErrors.weight}
                      </p>
                    )}
                  </div>

                  {/* Tension Field */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                      <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Tension
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={editingRacket.tension ?? ''}
                      onChange={(e) => {
                        clearFieldError('tension')
                        setEditingRacket({...editingRacket, tension: e.target.value})
                      }}
                      maxLength={100}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 transition-all ${
                        formErrors.tension
                          ? 'border-red-400 focus:ring-red-500 focus:border-red-500'
                          : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                      }`}
                      placeholder="e.g., 30lbs"
                    />
                    {formErrors.tension && (
                      <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {formErrors.tension}
                      </p>
                    )}
                  </div>

                  {/* Quantity/Stock Field */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                      <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                      Stock Quantity
                      <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col">
                        <button
                          type="button"
                          onClick={() => {
                            clearFieldError('stocks')
                            const current = Number(editingRacket.stocks) || 0
                            setEditingRacket({ ...editingRacket, stocks: current + 1 })
                          }}
                          disabled={(!isAddModal && hasActiveRentals) || checkingRentals}
                          className={`transition-colors ${
                            (!isAddModal && hasActiveRentals) || checkingRentals
                              ? 'text-gray-300 cursor-not-allowed'
                              : 'text-gray-400 hover:text-blue-600'
                          }`}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            clearFieldError('stocks')
                            const current = Number(editingRacket.stocks) || 0
                            setEditingRacket({ ...editingRacket, stocks: Math.max(0, current - 1) })
                          }}
                          disabled={(!isAddModal && hasActiveRentals) || checkingRentals}
                          className={`transition-colors ${
                            (!isAddModal && hasActiveRentals) || checkingRentals
                              ? 'text-gray-300 cursor-not-allowed'
                              : 'text-gray-400 hover:text-blue-600'
                          }`}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </div>
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
                        disabled={(!isAddModal && hasActiveRentals) || checkingRentals}
                        className={`w-full px-4 py-3 pr-12 border-2 rounded-xl focus:outline-none focus:ring-2 transition-all ${
                          (!isAddModal && hasActiveRentals) || checkingRentals
                            ? 'bg-gray-100 border-gray-300 cursor-not-allowed text-gray-500'
                            : formErrors.stocks
                            ? 'border-red-400 focus:ring-red-500 focus:border-red-500'
                            : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                        }`}
                        placeholder="0"
                      />
                    </div>
                    {!isAddModal && hasActiveRentals && (
                      <p className="mt-2 text-sm text-amber-600 flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        Stock cannot be modified. This racket has active or pending rentals.
                      </p>
                    )}
                    {formErrors.stocks && (
                      <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {formErrors.stocks}
                      </p>
                    )}
                  </div>

                  {/* Status Field - Only show when editing, not when adding */}
                  {!isAddModal && (
                    <div>
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                        <svg className="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Status
                        <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <select
                          value={editingRacket.status ?? ''}
                          onChange={(e) => {
                            clearFieldError('status')
                            setEditingRacket({...editingRacket, status: e.target.value})
                          }}
                          disabled={hasActiveRentals || checkingRentals}
                          className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 transition-all appearance-none ${
                            hasActiveRentals || checkingRentals
                              ? 'bg-gray-100 border-gray-300 cursor-not-allowed text-gray-500'
                              : formErrors.status
                              ? 'border-red-400 focus:ring-red-500 focus:border-red-500 bg-white cursor-pointer'
                              : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500 bg-white cursor-pointer'
                          }`}
                        >
                          <option value="" disabled>
                            Select status
                          </option>
                          <option value="Available">Available</option>
                          <option value="Unavailable">Unavailable</option>
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                          <svg className={`w-5 h-5 ${hasActiveRentals || checkingRentals ? 'text-gray-400' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                      {hasActiveRentals && (
                        <p className="mt-2 text-sm text-amber-600 flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          Status cannot be changed. This racket has active or pending rentals.
                        </p>
                      )}
                      {formErrors.status && (
                        <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {formErrors.status}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Enhanced Modal Footer */}
            <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end gap-4">
              <button
                onClick={handleCancelEdit}
                disabled={isSaving}
                className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 transition-all font-semibold shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Cancel
              </button>
              <button
                onClick={handleSaveRacket}
                disabled={isSaving}
                className={`px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl transition-all font-semibold shadow-lg hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2 ${
                  !isSaving && 'hover:from-blue-700 hover:to-indigo-700 transform hover:scale-105 active:scale-95'
                }`}
              >
                {isSaving ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Confirm</span>
                  </>
                )}
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
    </div>
  )
}

export default AdminManageRackets
