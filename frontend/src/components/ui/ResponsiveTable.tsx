import { ReactNode } from 'react'
import { useResponsive } from '@/hooks/useResponsive'

interface ResponsiveTableProps {
  children: ReactNode
  className?: string
}

export function ResponsiveTable({ children, className = '' }: ResponsiveTableProps) {
  const { isMobile } = useResponsive()

  return (
    <div className={`overflow-auto ${className}`}>
      <table className={`w-full ${isMobile ? 'text-xs' : 'text-sm'}`}>
        {children}
      </table>
    </div>
  )
}

interface ResponsiveTableHeaderProps {
  children: ReactNode
  className?: string
}

export function ResponsiveTableHeader({ children, className = '' }: ResponsiveTableHeaderProps) {
  return (
    <thead className={`bg-gray-100 sticky top-0 z-10 ${className}`}>
      <tr>
        {children}
      </tr>
    </thead>
  )
}

interface ResponsiveTableHeaderCellProps {
  children: ReactNode
  className?: string
  hideOnMobile?: boolean
}

export function ResponsiveTableHeaderCell({ 
  children, 
  className = '', 
  hideOnMobile = false 
}: ResponsiveTableHeaderCellProps) {
  const { isMobile } = useResponsive()

  if (isMobile && hideOnMobile) {
    return null
  }

  return (
    <th className={`px-2 sm:px-4 py-3 text-left text-xs sm:text-sm font-medium text-gray-700 ${className}`}>
      {children}
    </th>
  )
}

interface ResponsiveTableBodyProps {
  children: ReactNode
}

export function ResponsiveTableBody({ children }: ResponsiveTableBodyProps) {
  return <tbody>{children}</tbody>
}

interface ResponsiveTableRowProps {
  children: ReactNode
  className?: string
}

export function ResponsiveTableRow({ children, className = '' }: ResponsiveTableRowProps) {
  return (
    <tr className={`border-b border-gray-200 hover:bg-gray-50 ${className}`}>
      {children}
    </tr>
  )
}

interface ResponsiveTableCellProps {
  children: ReactNode
  className?: string
  hideOnMobile?: boolean
}

export function ResponsiveTableCell({ 
  children, 
  className = '', 
  hideOnMobile = false 
}: ResponsiveTableCellProps) {
  const { isMobile } = useResponsive()

  if (isMobile && hideOnMobile) {
    return null
  }

  return (
    <td className={`px-2 sm:px-4 py-3 text-xs sm:text-sm text-gray-900 ${className}`}>
      {children}
    </td>
  )
}
