import { useState } from 'react'
import { AdminLayout } from '@/components/AdminLayout'

const AdminManageRackets = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingRacket, setEditingRacket] = useState<any>(null)
  const [isAddModal, setIsAddModal] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [rackets, setRackets] = useState([
    { 
      id: 1, 
      name: 'Yonex GR 303', 
      stock: 5, 
      image: `${window.location.origin}/assets/img/equipments/racket-black-red.png`,
      brand: 'Yonex',
      price: '₱2,500.00'
    },
    { 
      id: 2, 
      name: 'Li-Ning Blaze 100', 
      stock: 1, 
      image: `${window.location.origin}/assets/img/equipments/racket-white-silver.png`,
      brand: 'Li-Ning',
      price: '₱3,200.00'
    },
    { 
      id: 3, 
      name: 'YONEX Arcsaber 7 Play', 
      stock: 3, 
      image: `${window.location.origin}/assets/img/equipments/racket-silver-white.png`,
      brand: 'Yonex',
      price: '₱4,500.00'
    },
    { 
      id: 4, 
      name: 'Victor Thruster', 
      stock: 1, 
      image: `${window.location.origin}/assets/img/equipments/racket-dark-frame.png`,
      brand: 'Victor',
      price: '₱3,800.00'
    },
    { 
      id: 5, 
      name: 'Apacs Power', 
      stock: 1, 
      image: `${window.location.origin}/assets/img/equipments/racket-yellow-green.png`,
      brand: 'Apacs',
      price: '₱2,200.00'
    },
    { 
      id: 6, 
      name: 'Alpsport', 
      stock: 1, 
      image: `${window.location.origin}/assets/img/equipments/racket-removebg-preview.png`,
      brand: 'Alpsport',
      price: '₱1,800.00'
    }
  ])

  const handleDeleteRacket = (racketId: number) => {
    setRackets(rackets.filter(racket => racket.id !== racketId))
  }

  const handleEditRacket = (racketId: number) => {
    const racket = rackets.find(r => r.id === racketId)
    if (racket) {
      setEditingRacket({
        ...racket,
        unit: 'Head Heavy',
        weight: '4u',
        tension: '25 lbs'
      })
      setImagePreview(racket.image)
      setSelectedFile(null)
      setIsAddModal(false)
      setEditModalOpen(true)
    }
  }

  const handleAddRacket = () => {
    setEditingRacket({
      id: Date.now(), // Temporary ID
      name: '',
      stock: 0,
      image: '',
      brand: '',
      price: '',
      unit: 'Head Heavy',
      weight: '4u',
      tension: '25 lbs'
    })
    setImagePreview(null)
    setSelectedFile(null)
    setIsAddModal(true)
    setEditModalOpen(true)
  }

  const handleSaveRacket = () => {
    if (editingRacket) {
      if (isAddModal) {
        // Add new racket
        setRackets([...rackets, editingRacket])
      } else {
        // Update existing racket
        setRackets(rackets.map(racket => 
          racket.id === editingRacket.id ? editingRacket : racket
        ))
      }
      setEditModalOpen(false)
      setEditingRacket(null)
      setIsAddModal(false)
    }
  }

  const handleCancelEdit = () => {
    setEditModalOpen(false)
    setEditingRacket(null)
    setIsAddModal(false)
    setSelectedFile(null)
    setImagePreview(null)
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
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
    <AdminLayout activeSidebarItem="Manage Rackets">
      <div className="p-4 sm:p-6 lg:p-8 overflow-x-hidden bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
          {/* Header Section */}
          <div className="mb-8">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 sm:p-8">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 lg:gap-8">
            {rackets.map((racket) => (
              <div key={racket.id} className="group bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-2xl transition-all duration-500 transform hover:scale-105 hover:-translate-y-2">
                {/* Card Header */}
                <div className="relative p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                  <h3 className="text-xl font-bold text-gray-900 truncate pr-20">{racket.name}</h3>
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
                      src={racket.image}
                      alt={racket.name}
                      onClick={() => handleImageClick(racket.image)}
                      className="w-full h-full object-contain object-center transition-all duration-500 hover:scale-110 cursor-pointer hover:shadow-xl group-hover:rotate-2"
                      style={{
                        filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.2))'
                      }}
                      title="Click to view full size"
                      onError={(e) => {
                        console.log('Image failed to load:', racket.image);
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
                        console.log('Image loaded successfully:', racket.image);
                      }}
                    />
                  </div>
                </div>

                {/* Stock Information */}
                <div className="px-6 py-4 text-center bg-gradient-to-br from-blue-50 to-indigo-50">
                  <div className="space-y-3">
                    <div className="bg-white rounded-xl p-3 shadow-sm border border-blue-100">
                      <p className="text-sm text-gray-600 mb-1">Available Stock</p>
                      <p className="text-2xl font-bold text-blue-600">{racket.stock}</p>
                    </div>
                    <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
                      <p className="text-sm text-gray-600 mb-1">Brand</p>
                      <p className="text-lg font-semibold text-gray-800">{racket.brand}</p>
                    </div>
                    <div className="bg-white rounded-xl p-3 shadow-sm border border-green-100">
                      <p className="text-sm text-gray-600 mb-1">Price</p>
                      <p className="text-xl font-bold text-green-600">{racket.price}</p>
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
            ))}
          </div>
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">Name:</label>
                    <input
                      type="text"
                      value={editingRacket.name}
                      onChange={(e) => setEditingRacket({...editingRacket, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter racket name"
                    />
                  </div>

                  {/* Brand Field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Brand:</label>
                    <input
                      type="text"
                      value={editingRacket.brand}
                      onChange={(e) => setEditingRacket({...editingRacket, brand: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter brand name"
                    />
                  </div>

                  {/* Price Field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Price:</label>
                    <input
                      type="text"
                      value={editingRacket.price}
                      onChange={(e) => setEditingRacket({...editingRacket, price: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter price (e.g., ₱2,500.00)"
                    />
                  </div>

                  {/* Image Upload Section */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Racket Image:</label>
                    <div 
                      className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors cursor-pointer"
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
                  </div>
                </div>

                {/* Right Column - Specifications */}
                <div className="space-y-6">
                  {/* Unit Field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Unit:</label>
                    <input
                      type="text"
                      value={editingRacket.unit}
                      onChange={(e) => setEditingRacket({...editingRacket, unit: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Weight Field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Weight:</label>
                    <input
                      type="text"
                      value={editingRacket.weight}
                      onChange={(e) => setEditingRacket({...editingRacket, weight: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Tension Field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tension:</label>
                    <input
                      type="text"
                      value={editingRacket.tension}
                      onChange={(e) => setEditingRacket({...editingRacket, tension: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Quantity/Stock Field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 text-center">Quantity:</label>
                    <div className="flex items-center justify-center space-x-4">
                      <button
                        type="button"
                        onClick={() => setEditingRacket({...editingRacket, stock: Math.max(0, editingRacket.stock - 1)})}
                        className="w-10 h-10 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors shadow-sm hover:shadow-md"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                        </svg>
                      </button>
                      <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 min-w-[4rem] text-center">
                        <span className="text-xl font-bold text-gray-800">{editingRacket.stock}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setEditingRacket({...editingRacket, stock: editingRacket.stock + 1})}
                        className="w-10 h-10 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors shadow-sm hover:shadow-md"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </button>
                    </div>
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
                className="px-8 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium shadow-md hover:shadow-lg"
              >
                Confirm
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
      </div>
    </AdminLayout>
  )
}

export default AdminManageRackets
