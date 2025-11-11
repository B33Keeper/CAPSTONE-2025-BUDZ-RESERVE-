import { useState, useEffect, useRef } from 'react'
import { api } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'

interface Announcement {
  id: number
  title: string
  content?: string
  image_url?: string
  announcement_type: 'text' | 'image'
  created_at: string
}

export function AnnouncementModal() {
  const { user } = useAuthStore()
  const [announcement, setAnnouncement] = useState<Announcement | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const lastUserIdRef = useRef<string | null>(null)

  useEffect(() => {
    // Reset state when user logs out
    if (!user) {
      if (lastUserIdRef.current) {
        sessionStorage.removeItem(`announcement_shown_${lastUserIdRef.current}`)
        lastUserIdRef.current = null
      }
      setAnnouncement(null)
      setShowModal(false)
      setLoading(false)
      return
    }

    lastUserIdRef.current = String(user.id)

    // Don't show announcement modal for admin users
    if (user.role === 'admin') {
      setLoading(false)
      return
    }

    const storageKey = `announcement_shown_${user.id}`
    const hasSeenAnnouncement = sessionStorage.getItem(storageKey) === 'true'

    if (hasSeenAnnouncement) {
      setLoading(false)
      setShowModal(false)
      return
    }

    const fetchLatestAnnouncement = async () => {
      try {
        setLoading(true)
        const response = await api.get('/announcements/latest')
        if (response.data) {
          setAnnouncement(response.data)
          setShowModal(true)
          sessionStorage.setItem(storageKey, 'true')
        } else {
          setShowModal(false)
        }
      } catch (error) {
        console.error('Error fetching announcement:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchLatestAnnouncement()
  }, [user])

  const handleClose = () => {
    setShowModal(false)
  }

  if (loading || !showModal || !announcement) {
    return null
  }

  const imageUrl = announcement.image_url?.startsWith('http')
    ? announcement.image_url
    : `http://localhost:3001${announcement.image_url}`

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden animate-slideDown">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
            </svg>
            <h2 className="text-xl font-bold">Announcement</h2>
          </div>
          <button
            onClick={handleClose}
            className="text-white hover:text-gray-200 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">{announcement.title}</h3>
          
          {announcement.announcement_type === 'image' && announcement.image_url ? (
            <div className="mb-4">
              <img
                src={imageUrl}
                alt={announcement.title}
                className="w-full h-auto rounded-lg shadow-md"
                onError={(e) => {
                  // Fallback if image fails to load
                  e.currentTarget.style.display = 'none'
                }}
              />
            </div>
          ) : null}

          {announcement.content && (
            <div className="text-gray-700 mb-4 whitespace-pre-wrap">
              {announcement.content}
            </div>
          )}

          <div className="text-sm text-gray-500 mt-4">
            Posted on {new Date(announcement.created_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex justify-end">
          <button
            onClick={handleClose}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  )
}

