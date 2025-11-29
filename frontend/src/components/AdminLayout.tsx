import { ReactNode } from 'react'
import AdminSidebar from '@/components/AdminSidebar'
import { AdminHeader } from './AdminHeader'

interface AdminLayoutProps {
  children: ReactNode
  title?: string
  subtitle?: string
  extraButtons?: ReactNode
  activeSidebarItem?: string
}

export function AdminLayout({ 
  children, 
  title, 
  subtitle, 
  extraButtons,
  activeSidebarItem 
}: AdminLayoutProps) {

  return (
    <div className="min-h-screen bg-gray-100 scroll-smooth">
      {/* Custom Scrollbar Styles */}
      <style dangerouslySetInnerHTML={{ __html: `
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        ::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
          transition: background 0.3s ease;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
        ::-webkit-scrollbar-corner {
          background: #f1f5f9;
        }
        * {
          scrollbar-width: thin;
          scrollbar-color: #cbd5e1 #f1f5f9;
        }
      ` }} />
      
      {/* Sidebar - Fixed and Sticky */}
      <AdminSidebar 
        activeItem={activeSidebarItem ?? 'Dashboard'} 
      />

      {/* Header - positioned after sidebar */}
      <AdminHeader 
        title={title} 
        subtitle={subtitle} 
        extraButtons={extraButtons}
      />

      {/* Main Content - with fixed left padding for sidebar */}
      <main className="min-h-screen lg:pl-64">
        <div className="w-full">
          {children}
        </div>
      </main>
    </div>
  )
}

