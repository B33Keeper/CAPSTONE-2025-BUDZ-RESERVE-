import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'

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
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [togglingId, setTogglingId] = useState<number | null>(null)

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
      toast.error('Failed to load announcements')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleActive = async (id: number, currentStatus: boolean) => {
    try {
      setTogglingId(id)
      await api.patch(`/announcements/${id}`, { is_active: !currentStatus })
      toast.success(`Announcement ${!currentStatus ? 'activated' : 'deactivated'} successfully`)
      await fetchAnnouncements()
    } catch (error: any) {
      console.error('Error toggling announcement status:', error)
      toast.error(error.response?.data?.message || 'Failed to update announcement status')
    } finally {
      setTogglingId(null)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this announcement? This action cannot be undone.')) {
      return
    }

    try {
      setDeletingId(id)
      await api.delete(`/announcements/${id}`)
      toast.success('Announcement deleted successfully')
      await fetchAnnouncements()
    } catch (error: any) {
      console.error('Error deleting announcement:', error)
      toast.error(error.response?.data?.message || 'Failed to delete announcement')
    } finally {
      setDeletingId(null)
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
                      <div className="flex items-center space-x-2">
                        {announcement.is_active && (
                          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                            Active
                          </span>
                        )}
                        <div className="flex items-center space-x-1">
                          {/* Toggle Active/Inactive Button */}
                          <button
                            onClick={() => handleToggleActive(announcement.id, announcement.is_active)}
                            disabled={togglingId === announcement.id}
                            className={`p-2 rounded-lg transition-colors ${
                              announcement.is_active
                                ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                                : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                            title={announcement.is_active ? 'Deactivate' : 'Activate'}
                          >
                            {togglingId === announcement.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                            ) : announcement.is_active ? (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            ) : (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </button>
                          
                          {/* Delete Button */}
                          <button
                            onClick={() => handleDelete(announcement.id)}
                            disabled={deletingId === announcement.id}
                            className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Delete announcement"
                          >
                            {deletingId === announcement.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                            ) : (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            )}
                          </button>
                        </div>
                      </div>
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

