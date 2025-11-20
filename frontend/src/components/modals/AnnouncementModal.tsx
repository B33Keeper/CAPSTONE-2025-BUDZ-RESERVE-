import { useState, useEffect, useCallback, useRef } from 'react'
import { api } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'

interface Announcement {
  id: number
  title: string
  content?: string
  image_url?: string
  announcement_type: 'text' | 'image'
  created_at: string
  updated_at?: string
}

export function AnnouncementModal() {
  const { user } = useAuthStore()
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const hasAutoShownRef = useRef(false)
  const lastUserIdRef = useRef<number | null>(null)

  const fetchActiveAnnouncements = useCallback(async () => {
    if (!user || user.role === 'admin') {
      return
    }

    try {
      setLoading(true)
      const response = await api.get('/announcements/active')
      const items: Announcement[] = response.data ?? []

      setAnnouncements(items)
      setCurrentIndex(0)
      setShowModal(items.length > 0)
    } catch (error) {
      console.error('Error fetching announcement:', error)
    } finally {
      setLoading(false)
    }
  }, [user])

  const handleNextAnnouncement = () => {
    setCurrentIndex((prev) => Math.min(prev + 1, announcements.length - 1))
  }

  const handlePreviousAnnouncement = () => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0))
  }

  useEffect(() => {
    if (!user || user.role === 'admin') {
      setAnnouncements([])
      setCurrentIndex(0)
      setShowModal(false)
      setLoading(false)
      hasAutoShownRef.current = false
      lastUserIdRef.current = null
      return
    }

    if (lastUserIdRef.current !== user.id) {
      hasAutoShownRef.current = false
      lastUserIdRef.current = user.id
    }

    if (hasAutoShownRef.current) {
      setLoading(false)
      return
    }

    hasAutoShownRef.current = true
    fetchActiveAnnouncements()
  }, [user, fetchActiveAnnouncements])

  useEffect(() => {
    const handleManualOpen = () => {
      if (!user || user.role === 'admin') {
        return
      }
      fetchActiveAnnouncements()
    }

    window.addEventListener('open-announcement-modal', handleManualOpen)
    return () => {
      window.removeEventListener('open-announcement-modal', handleManualOpen)
    }
  }, [user, fetchActiveAnnouncements])

  const handleClose = () => {
    setShowModal(false)
  }

  if (loading || !showModal || announcements.length === 0) {
    return null
  }

  const announcement = announcements[currentIndex]
  const hasPrevious = currentIndex > 0
  const hasNext = currentIndex < announcements.length - 1

  const imageUrl = announcement.image_url?.startsWith('http')
    ? announcement.image_url
    : announcement.image_url
      ? `http://localhost:3001${announcement.image_url}`
      : null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4 sm:p-6">
      <div className="w-full max-w-[90vw] sm:max-w-[520px] md:max-w-[560px] lg:max-w-[620px] max-h-[90vh] overflow-y-auto rounded-3xl bg-gradient-to-br from-white via-white to-blue-50 p-[2px] shadow-2xl shadow-blue-900/20 animate-slideDown">
        <div className="flex flex-col overflow-hidden rounded-[26px] bg-white">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#0b7bff] via-[#5a5bff] to-[#8a33ff] text-white px-6 py-4 flex items-center justify-between shadow-inner">
          <div className="flex items-start space-x-3">
            <svg className="w-6 h-6 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
            </svg>
            <div className="flex flex-col gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-bold">Announcements</h2>
                {announcements.length > 1 && (
                  <span className="text-sm font-semibold text-white/90">
                    {currentIndex + 1} of {announcements.length}
                  </span>
                )}
              </div>
              <p className="text-xs text-white/80">
                Posted on{' '}
                {new Date(announcement.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
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
          <div className="px-4 pb-0 sm:px-6">
            <div className="w-full rounded-[32px] bg-white px-4 py-4 shadow-lg">
              <div className="mb-4 text-center">
                <h3 className="text-xl font-semibold text-gray-900 tracking-tight">{announcement.title}</h3>
              </div>

              {announcement.announcement_type === 'image' && imageUrl && (
                <div className="relative overflow-hidden rounded-[28px] border border-gray-200 bg-gray-100/60">
                  <button
                    type="button"
                    onClick={handlePreviousAnnouncement}
                    disabled={!hasPrevious}
                    className={`absolute left-3 top-1/2 -translate-y-1/2 inline-flex h-9 w-9 items-center justify-center rounded-full border border-blue-200 bg-white/95 text-blue-600 shadow transition ${
                      hasPrevious ? 'hover:bg-white' : 'opacity-40 cursor-default pointer-events-none'
                    }`}
                    aria-label="Previous announcement"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={handleNextAnnouncement}
                    disabled={!hasNext}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 inline-flex h-9 w-9 items-center justify-center rounded-full border border-blue-200 bg-white/95 text-blue-600 shadow transition ${
                      hasNext ? 'hover:bg-white' : 'opacity-40 cursor-default pointer-events-none'
                    }`}
                    aria-label="Next announcement"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                  <img
                    src={imageUrl}
                    alt={announcement.title}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                </div>
              )}

              {announcement.content && (
                <div className="mt-4 text-gray-700 whitespace-pre-wrap text-base leading-relaxed">
                  {announcement.content}
                </div>
              )}

              {announcements.length > 1 && announcement.announcement_type !== 'image' && (
                <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <button
                    type="button"
                    onClick={handlePreviousAnnouncement}
                    disabled={!hasPrevious}
                    className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-xl border border-blue-200 px-4 py-2 text-sm font-semibold text-blue-700 shadow transition ${
                      hasPrevious ? 'bg-white hover:bg-blue-50' : 'opacity-50 cursor-not-allowed'
                    }`}
                    aria-label="Previous announcement"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Previous
                  </button>
                  <button
                    type="button"
                    onClick={handleNextAnnouncement}
                    disabled={!hasNext}
                    className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-xl border border-blue-200 px-4 py-2 text-sm font-semibold text-blue-700 shadow transition ${
                      hasNext ? 'bg-white hover:bg-blue-50' : 'opacity-50 cursor-not-allowed'
                    }`}
                    aria-label="Next announcement"
                  >
                    Next
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 mt-4 flex justify-end">
            <button
              onClick={handleClose}
              className="px-6 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold shadow-lg shadow-blue-600/30 transition hover:brightness-110"
            >
              Got it
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

