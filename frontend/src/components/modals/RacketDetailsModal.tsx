import React from 'react'

interface RacketDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: () => void
  racket: {
    id: number
    equipment_name: string
    image_path: string
    price: string
    stocks: number
    brand?: string
  } | null
}

export function RacketDetailsModal({ isOpen, onClose, onSelect, racket }: RacketDetailsModalProps) {
  if (!isOpen || !racket) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 text-center">{racket.equipment_name}</h2>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Racket Image */}
          <div className="mb-6 flex justify-center">
            <div className="w-48 h-48 bg-gray-100 rounded-lg border-2 border-gray-200 flex items-center justify-center overflow-hidden">
              <img
                src={`${racket.image_path || "/assets/img/equipments/racket-black-red.png"}?v=${Date.now()}`}
                alt={racket.equipment_name}
                className="w-full h-full object-contain"
              />
            </div>
          </div>

          {/* Specifications */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Specifications</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Unit:</span>
                <span className="font-medium">Head Heavy</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Weight:</span>
                <span className="font-medium">4U</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tension:</span>
                <span className="font-medium">25 lbs</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Price:</span>
                <span className="font-medium text-blue-600">₱{racket.price}/hour</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Stock:</span>
                <span className="font-medium text-green-600">{racket.stocks} available</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onSelect}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Select
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

