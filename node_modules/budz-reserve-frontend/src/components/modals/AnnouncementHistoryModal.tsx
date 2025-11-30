import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'
import { resolveImageUrl } from '@/lib/imageUtils'

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
  const [confirmAction, setConfirmAction] = useState<{
    type: 'delete' | 'toggle'
    announcement: Announcement
    nextStatus?: boolean
  } | null>(null)

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

  const handleToggleActive = async (id: number, nextStatus: boolean) => {
    try {
      setTogglingId(id)
      await api.patch(`/announcements/${id}`, { is_active: nextStatus })
      toast.success(`Announcement ${nextStatus ? 'activated' : 'deactivated'} successfully`)
      await fetchAnnouncements()
    } catch (error: any) {
      console.error('Error toggling announcement status:', error)
      toast.error(error.response?.data?.message || 'Failed to update announcement status')
    } finally {
      setTogglingId(null)
    }
  }

  const handleDelete = async (id: number) => {
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

  const openConfirm = (config: {
    type: 'delete' | 'toggle'
    announcement: Announcement
    nextStatus?: boolean
  }) => {
    setConfirmAction(config)
  }

  const closeConfirm = () => {
    setConfirmAction(null)
  }

  const handleConfirmAction = async () => {
    if (!confirmAction) return
    if (confirmAction.type === 'delete') {
      await handleDelete(confirmAction.announcement.id)
    } else {
      const desiredStatus =
        confirmAction.nextStatus ?? !confirmAction.announcement.is_active
      await handleToggleActive(confirmAction.announcement.id, desiredStatus)
    }
    setConfirmAction(null)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-gray-200/60 animate-in zoom-in-95 duration-200">
        {/* Enhanced Header */}
        <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-600 text-white px-6 sm:px-8 py-5 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-2.5 rounded-xl bg-white/20 backdrop-blur-sm">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold">Announcement History</h2>
              <p className="text-sm text-blue-100 mt-0.5">
                {announcements.length} {announcements.length === 1 ? 'announcement' : 'announcements'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-white/90 hover:text-white hover:bg-white/20 transition-all duration-200 hover:scale-110 active:scale-95"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-b from-gray-50/50 to-white">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="relative">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600"></div>
                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-indigo-600 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
              </div>
              <span className="mt-4 text-gray-600 font-medium">Loading announcements...</span>
            </div>
          ) : announcements.length === 0 ? (
            <div className="text-center py-20">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 mb-4">
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                </svg>
              </div>
              <p className="text-xl font-semibold text-gray-700 mb-2">No announcements found</p>
              <p className="text-gray-500">Create your first announcement to get started</p>
            </div>
          ) : (
            <div className="space-y-5">
              {announcements.map((announcement) => {
                const imageUrl = announcement.image_url
                  ? resolveImageUrl(announcement.image_url)
                  : null

                return (
                  <div
                    key={announcement.id}
                    className={`group relative border-2 rounded-2xl p-5 transition-all duration-300 hover:shadow-xl ${
                      announcement.is_active
                        ? 'border-blue-300 bg-gradient-to-br from-blue-50/50 via-white to-indigo-50/30 shadow-lg'
                        : 'border-gray-200 bg-white hover:border-gray-300 shadow-md'
                    }`}
                  >
                    {/* Active Indicator Bar */}
                    {announcement.is_active && (
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-t-2xl"></div>
                    )}

                    {/* Header Section */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1 pr-4">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-700 transition-colors">
                            {announcement.title}
                          </h3>
                          {announcement.is_active && (
                            <span className="px-3 py-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full text-xs font-bold shadow-md flex items-center space-x-1.5">
                              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                              <span>Active</span>
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                          <div className="flex items-center space-x-1.5">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span>
                              {new Date(announcement.created_at).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                          {announcement.creator && (
                            <div className="flex items-center space-x-1.5">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                              <span>By {announcement.creator.name || announcement.creator.username}</span>
                            </div>
                          )}
                          <div className="flex items-center space-x-1.5">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              {announcement.announcement_type === 'image' ? (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              )}
                            </svg>
                            <span className="capitalize font-medium">{announcement.announcement_type}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {/* Toggle Active/Inactive Button */}
                        <button
                          onClick={() =>
                            openConfirm({
                              type: 'toggle',
                              announcement,
                              nextStatus: !announcement.is_active
                            })
                          }
                          disabled={togglingId === announcement.id}
                          className={`p-2.5 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg hover:scale-110 active:scale-95 ${
                            announcement.is_active
                              ? 'bg-gradient-to-br from-yellow-400 to-amber-500 text-white hover:from-yellow-500 hover:to-amber-600'
                              : 'bg-gradient-to-br from-blue-400 to-indigo-500 text-white hover:from-blue-500 hover:to-indigo-600'
                          }`}
                          title={announcement.is_active ? 'Deactivate' : 'Activate'}
                        >
                          {togglingId === announcement.id ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                          ) : announcement.is_active ? (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>
                        
                        {/* Delete Button */}
                        <button
                          onClick={() =>
                            openConfirm({
                              type: 'delete',
                              announcement
                            })
                          }
                          disabled={deletingId === announcement.id}
                          className="p-2.5 bg-gradient-to-br from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg hover:scale-110 active:scale-95"
                          title="Delete announcement"
                        >
                          {deletingId === announcement.id ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                          ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Image Display */}
                    {announcement.announcement_type === 'image' && announcement.image_url && (
                      <div className="mb-4 rounded-xl overflow-hidden border-2 border-gray-200 shadow-lg group-hover:shadow-xl transition-shadow">
                        <div className="relative">
                          <img
                            src={imageUrl}
                            alt={announcement.title}
                            className="w-full h-auto max-h-96 object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none'
                            }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        </div>
                      </div>
                    )}

                    {/* Content Display */}
                    {announcement.content && (
                      <div className="text-gray-700 whitespace-pre-wrap mb-2 p-4 bg-gray-50/50 rounded-xl border border-gray-200/60 leading-relaxed">
                        {announcement.content}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Enhanced Footer */}
        <div className="bg-gradient-to-r from-gray-50 to-blue-50/30 px-6 sm:px-8 py-4 flex justify-end border-t border-gray-200/60">
          <button
            onClick={onClose}
            className="px-8 py-3 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-600 text-white rounded-xl font-bold hover:from-blue-700 hover:via-blue-800 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
          >
            Close
          </button>
        </div>
      </div>

      {/* Enhanced Confirmation Modal */}
      {confirmAction && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[110] p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full border border-gray-200/60 animate-in zoom-in-95 duration-200 overflow-hidden">
            <div className={`px-6 py-5 ${
              confirmAction.type === 'delete'
                ? 'bg-gradient-to-r from-red-500 to-red-600'
                : confirmAction.nextStatus
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600'
                  : 'bg-gradient-to-r from-yellow-400 to-amber-500'
            } text-white`}>
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-xl bg-white/20 backdrop-blur-sm">
                  {confirmAction.type === 'delete' ? (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                </div>
                <h3 className="text-xl font-bold">
                  {confirmAction.type === 'delete'
                    ? 'Delete announcement?'
                    : confirmAction.nextStatus
                      ? 'Activate announcement?'
                      : 'Deactivate announcement?'}
                </h3>
              </div>
            </div>
            <div className="p-6">
              <p className="text-gray-700 leading-relaxed mb-6">
                {confirmAction.type === 'delete'
                  ? 'This action cannot be undone. Are you sure you want to delete this announcement?'
                  : `Are you sure you want to ${confirmAction.nextStatus ? 'activate' : 'deactivate'} "${confirmAction.announcement.title}"?`}
              </p>
              <div className="flex flex-col sm:flex-row sm:justify-end gap-3">
                <button
                  onClick={closeConfirm}
                  className="flex-1 sm:flex-none px-6 py-3 rounded-xl border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmAction}
                  className={`flex-1 sm:flex-none px-6 py-3 rounded-xl font-bold text-white transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 ${
                    confirmAction.type === 'delete'
                      ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800'
                      : confirmAction.nextStatus
                        ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
                        : 'bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600'
                  }`}
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
