import { ReactNode, useEffect } from 'react'
import { X } from 'lucide-react'
import { useResponsive } from '@/hooks/useResponsive'

interface ResponsiveModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: ReactNode
  className?: string
  showCloseButton?: boolean
}

export function ResponsiveModal({
  isOpen,
  onClose,
  title,
  children,
  className = '',
  showCloseButton = true,
}: ResponsiveModalProps) {
  const { isMobile } = useResponsive()

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  const modalSize = isMobile ? 'w-full h-full max-h-full' : 'max-w-6xl w-full h-[90vh]'

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
      <div
        className={`bg-white rounded-lg flex flex-col ${modalSize} ${className}`}
      >
        {/* Header */}
        <div className="flex-shrink-0 p-4 sm:p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">
            {title}
          </h2>
          {showCloseButton && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1"
              aria-label="Close modal"
              title="Close modal"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  )
}
