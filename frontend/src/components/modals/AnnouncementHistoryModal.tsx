import { useState, useEffect } from 'react'
import { api } from '@/lib/api'

interface Announcement {
  id: number
  title: string
  content?: string
  image_url?: string
  announcement_type: 'text' | 'image'
  is_active: boolean
  created_at: string
  creator?: {
    id: number
    name: string
    username: string
  }
}

interface AnnouncementHistoryModalProps {
  isOpen: boolean
  onClose: () => void
}

export function AnnouncementHistoryModal({ isOpen, onClose }: AnnouncementHistoryModalProps) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isOpen) {
      fetchAnnouncements()
    }
  }, [isOpen])

  const fetchAnnouncements = async () => {
    try {
      setLoading(true)
      const response = await api.get('/announcements')
      setAnnouncements(response.data || [])
    } catch (error) {
      console.error('Error fetching announcements:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-xl font-bold">Announcement History</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading announcements...</span>
            </div>
          ) : announcements.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No announcements found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {announcements.map((announcement) => {
                const imageUrl = announcement.image_url?.startsWith('http')
                  ? announcement.image_url
                  : `http://localhost:3001${announcement.image_url}`

                return (
                  <div
                    key={announcement.id}
                    className={`border-2 rounded-lg p-4 transition-all ${
                      announcement.is_active
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 mb-1">
                          {announcement.title}
                        </h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>
                            {new Date(announcement.created_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          {announcement.creator && (
                            <span>By {announcement.creator.name || announcement.creator.username}</span>
                          )}
                          <span className="capitalize">{announcement.announcement_type}</span>
                        </div>
                      </div>
                      {announcement.is_active && (
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                          Active
                        </span>
                      )}
                    </div>

                    {announcement.announcement_type === 'image' && announcement.image_url && (
                      <div className="mb-3">
                        <img
                          src={imageUrl}
                          alt={announcement.title}
                          className="w-full h-auto rounded-lg shadow-md max-h-64 object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                          }}
                        />
                      </div>
                    )}

                    {announcement.content && (
                      <div className="text-gray-700 whitespace-pre-wrap mb-2">
                        {announcement.content}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex justify-end border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

