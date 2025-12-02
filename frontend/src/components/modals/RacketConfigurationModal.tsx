import { useState, useEffect } from 'react'
import { X, Minus, Plus, Clock, Package, CheckCircle2 } from 'lucide-react'

interface Equipment {
  id: number
  equipment_name: string
  price: number | string
  available_stock?: number
  stocks?: number
  image_path?: string
  unit?: string | null
  weight?: string | null
  tension?: string | null
}

interface RacketConfigurationModalProps {
  isOpen: boolean
  onClose: () => void
  equipment: Equipment | null
  initialQuantity?: number
  initialTime?: number
  maxTime?: number // Maximum time allowed (based on schedule duration)
  onConfirm: (quantity: number, time: number) => void
  resolveImageUrl?: (path: string) => string
  scheduleSpecificAvailability?: number // Schedule-specific availability (overrides general availability)
}

export function RacketConfigurationModal({
  isOpen,
  onClose,
  equipment,
  initialQuantity = 0,
  initialTime = 1,
  maxTime,
  onConfirm,
  resolveImageUrl,
  scheduleSpecificAvailability
}: RacketConfigurationModalProps) {
  const [quantity, setQuantity] = useState(initialQuantity)
  const [time, setTime] = useState(initialTime)

  useEffect(() => {
    if (isOpen && equipment) {
      // Always sync with the latest initialQuantity when modal opens or equipment changes
      setQuantity(initialQuantity)
      // Clamp initial time to maxTime if provided
      const clampedInitialTime = maxTime !== undefined 
        ? Math.min(initialTime, maxTime) 
        : initialTime
      setTime(Math.max(1, clampedInitialTime))
    }
  }, [isOpen, equipment, initialQuantity, initialTime, maxTime])

  if (!isOpen || !equipment) return null

  // Use schedule-specific availability if provided, otherwise use default stocks from admin
  const maxStock = scheduleSpecificAvailability !== undefined
    ? scheduleSpecificAvailability
    : (equipment.stocks ?? 0)
  const price = Number(equipment.price) || 100
  const subtotal = price * time * quantity

  const handleConfirm = () => {
    onConfirm(quantity, time)
    onClose()
  }

  const handleQuantityChange = (newQuantity: number) => {
    const clampedQuantity = Math.max(0, Math.min(maxStock, newQuantity))
    setQuantity(clampedQuantity)
  }

  const handleTimeChange = (newTime: number) => {
    // Clamp time to be between 1 and maxTime (if provided)
    const minTime = 1
    const maxAllowedTime = maxTime !== undefined ? maxTime : newTime
    const clampedTime = Math.max(minTime, Math.min(maxAllowedTime, newTime))
    setTime(clampedTime)
  }

  const imageUrl = equipment.image_path 
    ? (resolveImageUrl ? resolveImageUrl(equipment.image_path) : equipment.image_path)
    : '/assets/img/equipments/racket-removebg-preview.png'

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start sm:items-center justify-center z-50 p-0 sm:p-2 md:p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div 
        className="bg-white rounded-t-3xl sm:rounded-2xl md:rounded-3xl shadow-2xl w-full max-w-2xl mt-auto sm:my-auto animate-in slide-in-from-bottom-4 duration-300 max-h-[95vh] sm:max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Responsive */}
        <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white p-4 sm:p-5 md:p-6 relative flex-shrink-0">
          <div className="text-center pr-10 sm:pr-0">
            <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold tracking-tight break-words">{equipment.equipment_name}</h2>
            <p className="text-blue-100 mt-1 text-xs sm:text-sm">Configure your rental</p>
          </div>
          <button
            onClick={onClose}
            className="absolute top-3 right-3 sm:top-4 sm:right-4 text-white/90 hover:text-white transition-all p-2 hover:bg-white/20 rounded-lg backdrop-blur-sm active:scale-95 touch-manipulation"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="p-3 sm:p-4 md:p-6 overflow-y-auto flex-1">
          {/* Image and Specs Section - Responsive Layout */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 md:gap-6 mb-4 sm:mb-6">
            {/* Equipment Image - Responsive Size */}
            <div className="flex-shrink-0 mx-auto sm:mx-0">
              <div className="relative w-48 h-48 sm:w-56 sm:h-56 md:w-64 md:h-64 lg:w-72 lg:h-72 xl:w-80 xl:h-80 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl sm:rounded-2xl shadow-lg overflow-hidden border-2 border-gray-200/50 p-3 sm:p-4 md:p-6">
                <img
                  src={imageUrl}
                  alt={equipment.equipment_name}
                  className="w-full h-full object-contain object-center"
                  style={{
                    filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.15))'
                  }}
                />
              </div>
            </div>

            {/* Unit, Weight, Tension, Available, and Price - All Together */}
            <div className="flex-1 flex flex-col justify-center space-y-2 sm:space-y-2.5 md:space-y-3">
              {/* Available Stock */}
              <div className="flex items-center justify-between py-2.5 sm:py-3 px-3 sm:px-4 bg-white rounded-lg sm:rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <span className="text-xs sm:text-sm font-medium text-gray-600">Available:</span>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <div className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full ${
                    maxStock > 0 ? 'bg-green-500' : 'bg-red-500'
                  } ${maxStock > 0 ? 'animate-pulse' : ''}`}></div>
                  <span className={`text-xs sm:text-sm font-semibold ${
                    maxStock > 0 ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {maxStock > 0 ? `${maxStock} available` : 'Out of stock'}
                  </span>
                </div>
              </div>

              {/* Price */}
              <div className="flex items-center justify-between py-2.5 sm:py-3 px-3 sm:px-4 bg-white rounded-lg sm:rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <span className="text-xs sm:text-sm font-medium text-gray-600">Price:</span>
                <span className="text-xs sm:text-sm font-semibold text-blue-600">
                  ₱{price.toLocaleString()}/hour
                </span>
              </div>

              {/* Unit */}
              {equipment.unit && (
                <div className="flex items-center justify-between py-2.5 sm:py-3 px-3 sm:px-4 bg-white rounded-lg sm:rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                  <span className="text-xs sm:text-sm font-medium text-gray-600">Unit:</span>
                  <span className="text-xs sm:text-sm font-semibold text-gray-800 break-words text-right ml-2">{equipment.unit}</span>
                </div>
              )}

              {/* Weight */}
              {equipment.weight && (
                <div className="flex items-center justify-between py-2.5 sm:py-3 px-3 sm:px-4 bg-white rounded-lg sm:rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                  <span className="text-xs sm:text-sm font-medium text-gray-600">Weight:</span>
                  <span className="text-xs sm:text-sm font-semibold text-gray-800 break-words text-right ml-2">{equipment.weight}</span>
                </div>
              )}

              {/* Tension */}
              {equipment.tension && (
                <div className="flex items-center justify-between py-2.5 sm:py-3 px-3 sm:px-4 bg-white rounded-lg sm:rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                  <span className="text-xs sm:text-sm font-medium text-gray-600">Tension:</span>
                  <span className="text-xs sm:text-sm font-semibold text-gray-800 break-words text-right ml-2">{equipment.tension}</span>
                </div>
              )}
            </div>
          </div>

          {/* Time & Quantity - Responsive Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3 md:gap-4 mb-4 sm:mb-6">
            {/* Rental Time Configuration */}
            <div className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <label className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-gray-700 mb-2.5 sm:mb-3">
                <Clock className="w-4 h-4 sm:w-4 sm:h-4 text-blue-600" />
                Rental Time
              </label>
              <div className="flex items-center justify-center gap-2 sm:gap-2.5">
                <button
                  onClick={() => handleTimeChange(time - 1)}
                  disabled={time <= 1}
                  className="w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 rounded-lg flex items-center justify-center transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-gray-100 shadow-sm hover:shadow-md active:scale-95 touch-manipulation"
                  aria-label="Decrease time"
                >
                  <Minus className="w-4 h-4 sm:w-4 sm:h-4 md:w-5 md:h-5 text-gray-700" />
                </button>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    value={time}
                    onChange={(e) => handleTimeChange(Number(e.target.value))}
                    min="1"
                    max={maxTime}
                    className="w-16 sm:w-20 md:w-24 px-2 py-2 sm:py-2.5 border-2 border-gray-200 rounded-lg text-center text-base sm:text-lg font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all touch-manipulation"
                  />
                  <span className="text-xs sm:text-sm text-gray-500 font-medium">hr</span>
                  {maxTime && (
                    <span className="text-xs text-gray-400">(max: {maxTime}hr)</span>
                  )}
                </div>
                <button
                  onClick={() => handleTimeChange(time + 1)}
                  disabled={maxTime !== undefined && time >= maxTime}
                  className="w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 rounded-lg flex items-center justify-center transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-gray-100 shadow-sm hover:shadow-md active:scale-95 touch-manipulation"
                  aria-label="Increase time"
                >
                  <Plus className="w-4 h-4 sm:w-4 sm:h-4 md:w-5 md:h-5 text-gray-700" />
                </button>
              </div>
            </div>

            {/* Quantity Configuration */}
            <div className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <label className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-gray-700 mb-2.5 sm:mb-3">
                <Package className="w-4 h-4 sm:w-4 sm:h-4 text-blue-600" />
                Quantity
              </label>
              <div className="flex items-center justify-center gap-2 sm:gap-2.5">
                <button
                  onClick={() => handleQuantityChange(quantity - 1)}
                  disabled={quantity <= 0}
                  className="w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 rounded-lg flex items-center justify-center transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-gray-100 shadow-sm hover:shadow-md active:scale-95 touch-manipulation"
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-4 h-4 sm:w-4 sm:h-4 md:w-5 md:h-5 text-gray-700" />
                </button>
                <div className="w-16 sm:w-20 md:w-24 px-2 py-2 sm:py-2.5 bg-gray-50 border-2 border-gray-200 rounded-lg text-center">
                  <span className="text-base sm:text-lg font-bold text-gray-800">{quantity}</span>
                </div>
                <button
                  onClick={() => handleQuantityChange(quantity + 1)}
                  disabled={quantity >= maxStock}
                  className="w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 rounded-lg flex items-center justify-center transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-gray-100 shadow-sm hover:shadow-md active:scale-95 touch-manipulation"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-4 h-4 sm:w-4 sm:h-4 md:w-5 md:h-5 text-gray-700" />
                </button>
              </div>
              {maxStock > 0 && (
                <p className="text-xs text-gray-500 text-center mt-2 sm:mt-2.5">
                  Max: {maxStock}
                </p>
              )}
            </div>
          </div>

          {/* Subtotal Card - Responsive */}
          {quantity > 0 && (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-5 shadow-md">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0" />
                  <span className="text-xs sm:text-sm font-semibold text-gray-700">Subtotal:</span>
                </div>
                <span className="text-lg sm:text-xl md:text-2xl font-bold text-blue-700">
                  ₱{subtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="mt-2 pt-2 border-t border-blue-200/50">
                <p className="text-xs sm:text-xs text-gray-600 text-center break-words">
                  {quantity} {quantity === 1 ? 'item' : 'items'} × {time} {time === 1 ? 'hour' : 'hours'} × ₱{price.toLocaleString()}/hr
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions - Responsive */}
        <div className="bg-gradient-to-b from-gray-50 to-white px-3 sm:px-4 md:px-6 py-3 sm:py-4 md:py-5 border-t border-gray-200 flex flex-col sm:flex-row justify-end gap-2.5 sm:gap-3 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 sm:px-5 md:px-6 py-3 sm:py-2.5 md:py-3 border-2 border-gray-300 text-gray-700 rounded-lg sm:rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-semibold shadow-sm hover:shadow-md active:scale-95 text-sm sm:text-base w-full sm:w-auto touch-manipulation"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={quantity === 0}
            className={`px-5 sm:px-6 md:px-8 py-3 sm:py-2.5 md:py-3 rounded-lg sm:rounded-xl font-semibold transition-all duration-200 shadow-lg text-sm sm:text-base w-full sm:w-auto touch-manipulation ${
              quantity > 0
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 hover:shadow-xl transform hover:scale-105 active:scale-95'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none'
            }`}
          >
            {quantity > 0 ? (
              <span className="flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
                Confirm Selection
              </span>
            ) : (
              'Select Quantity'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

