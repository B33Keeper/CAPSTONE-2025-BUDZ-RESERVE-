import { AdminLayout } from '@/components/AdminLayout'

export default function AdminCreateReservations() {
  return (
    <AdminLayout activeSidebarItem="Create Reservations">
      <div className="flex-1 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 sm:p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Reservation</h1>
            <p className="text-gray-600 mb-6">This page is under construction.</p>
            <div className="text-center py-12">
              <svg className="w-24 h-24 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-500">Create Reservation functionality coming soon...</p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
