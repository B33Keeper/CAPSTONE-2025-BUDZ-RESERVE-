import React, { useState } from 'react'

interface RacketConfigModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (time: number, quantity: number) => void
  racket: {
    id: number
    equipment_name: string
    image_path: string
    price: string
    stocks: number
  } | null
}

export function RacketConfigModal({ isOpen, onClose, onConfirm, racket }: RacketConfigModalProps) {
  const [time, setTime] = useState(1)
  const [quantity, setQuantity] = useState(1)

  if (!isOpen || !racket) return null

  const handleConfirm = () => {
    onConfirm(time, quantity)
    onClose()
  }


  const handleQuantityDecrease = () => {
    setQuantity(prev => Math.max(1, prev - 1))
  }

  const handleQuantityIncrease = () => {
    setQuantity(prev => Math.min(racket.stocks, prev + 1))
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-sm w-full mx-4">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 text-center">Configure Rental</h2>
          <p className="text-sm text-gray-600 text-center mt-1">{racket.equipment_name}</p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Time Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 text-center">Time:</label>
            <div className="flex items-center justify-center">
              <select
                value={time}
                onChange={(e) => setTime(Number(e.target.value))}
                className="w-20 px-3 py-2 border border-gray-300 rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((hour) => (
                  <option key={hour} value={hour}>
                    {hour}
                  </option>
                ))}
              </select>
              <span className="ml-2 text-sm text-gray-600">/hr</span>
            </div>
          </div>

          {/* Quantity Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3 text-center">Quantity:</label>
            <div className="flex items-center justify-center space-x-4">
              <button
                onClick={handleQuantityDecrease}
                className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 transition-colors border border-gray-300"
              >
                <span className="text-gray-700 font-medium">-</span>
              </button>
              <span className="w-12 text-center text-lg font-medium">{quantity}</span>
              <button
                onClick={handleQuantityIncrease}
                className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 transition-colors border border-gray-300"
              >
                <span className="text-gray-700 font-medium">+</span>
              </button>
            </div>
          </div>

          {/* Price Calculation */}
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Price per hour:</span>
                <span>₱{racket.price}</span>
              </div>
              <div className="flex justify-between">
                <span>Time:</span>
                <span>{time} hour{time > 1 ? 's' : ''}</span>
              </div>
              <div className="flex justify-between">
                <span>Quantity:</span>
                <span>{quantity}</span>
              </div>
              <div className="border-t border-gray-300 mt-2 pt-2">
                <div className="flex justify-between font-semibold">
                  <span>Total:</span>
                  <span>₱{(parseFloat(racket.price) * time * quantity).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-6 border-t border-gray-200 flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  )
}
