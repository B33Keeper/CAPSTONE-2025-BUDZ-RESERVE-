import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import api from '@/lib/api'
import AdminSidebar from '@/components/AdminSidebar'
import { AdminHeader } from '@/components/AdminHeader'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface EquipmentRental {
  equipmentName: string
  quantity: number
  hours: number
}

interface SalesReportItem {
  reservationId: number
  customerName: string
  courtName: string
  time: string
  date: string
  paymentMethod: string
  price: number
  status: 'completed' | 'cancelled'
  equipmentRentals?: EquipmentRental[]
}

const AdminSalesReport = () => {
  const [showDownloadDropdown, setShowDownloadDropdown] = useState(false)
  const [activeSidebarItem, setActiveSidebarItem] = useState('Sales Report')
  const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'>('daily')
  const [salesData, setSalesData] = useState<SalesReportItem[]>([])
  const [summary, setSummary] = useState<{ totalReservations: number; totalIncome: number; totalCancellations: number }>({
    totalReservations: 0,
    totalIncome: 0,
    totalCancellations: 0
  })
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [searchQuery, setSearchQuery] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const downloadDropdownRef = useRef<HTMLDivElement>(null)

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2,
    }).format(price)
  }

  // Calculate date range based on selected period
  const getPeriodDateRange = () => {
    const today = new Date()
    today.setHours(23, 59, 59, 999) // End of today
    
    let startDate = new Date()
    let endDate = new Date()
    
    switch (selectedPeriod) {
      case 'daily':
        // For daily, only show today's data
        startDate.setHours(0, 0, 0, 0)
        endDate = today
        return { start: startDate, end: endDate }
      
      case 'weekly':
        // Weekly: Show the full calendar week (Monday to Sunday) containing the current date
        // This matches the backend calculation
        const dayOfWeek = today.getDay() // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
        const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
        const daysToSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek
        
        // Start of week: Monday at 00:00:00.000
        startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - daysToMonday, 0, 0, 0, 0)
        // End of week: Sunday at 23:59:59.999
        endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + daysToSunday, 23, 59, 59, 999)
        return { start: startDate, end: endDate }
      
      case 'monthly':
        // Monthly: Show complete current month (1st to last day of month)
        startDate = new Date(today.getFullYear(), today.getMonth(), 1, 0, 0, 0, 0)
        // Get last day of current month
        const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999)
        endDate = lastDayOfMonth
        return { start: startDate, end: endDate }
      
      case 'quarterly':
        // Quarterly: Show complete current quarter
        const quarterStartMonth = Math.floor(today.getMonth() / 3) * 3
        startDate = new Date(today.getFullYear(), quarterStartMonth, 1, 0, 0, 0, 0)
        // Get last day of current quarter (end of 3rd month of quarter)
        const quarterEndMonth = quarterStartMonth + 2
        const lastDayOfQuarter = new Date(today.getFullYear(), quarterEndMonth + 1, 0, 23, 59, 59, 999)
        endDate = lastDayOfQuarter
        return { start: startDate, end: endDate }
      
      case 'yearly':
        // Yearly: Show complete current year (Jan 1 to Dec 31)
        startDate = new Date(today.getFullYear(), 0, 1, 0, 0, 0, 0)
        endDate = new Date(today.getFullYear(), 11, 31, 23, 59, 59, 999)
        return { start: startDate, end: endDate }
      
      default:
        startDate.setHours(0, 0, 0, 0)
        return { start: startDate, end: today }
    }
  }
  

  const periods = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'quarterly', label: 'Quarterly' },
    { value: 'yearly', label: 'Yearly' },
  ]

  const handleDownloadCSV = () => {
    try {
      // Use the same filtered data that's displayed in the table
      const dataToExport = filteredData
      
      if (dataToExport.length === 0) {
        alert('No data available to download')
        return
      }

      // Generate filename with period and date
      const date = new Date().toISOString().split('T')[0]
      const periodLabel = periods.find(p => p.value === selectedPeriod)?.label || 'Daily'
      
      // Prepare CSV headers
      const headers = ['Reservation ID', 'Customer Name', 'Court Name', 'Time', 'Date', 'Payment Method', 'Racket Rent / Duration', 'Price', 'Status']
      
      // Prepare CSV rows
      const csvRows = dataToExport.map(item => {
        // Format equipment rentals
        const equipmentInfo = item.equipmentRentals && item.equipmentRentals.length > 0
          ? item.equipmentRentals.map(rental => 
              `${rental.equipmentName} (Qty: ${rental.quantity}, ${rental.hours}h)`
            ).join('; ')
          : 'None'

        return [
          item.reservationId.toString(),
          `"${item.customerName.replace(/"/g, '""')}"`,
          `"${item.courtName.replace(/"/g, '""')}"`,
          `"${item.time.replace(/"/g, '""')}"`,
          `"${item.date.replace(/"/g, '""')}"`,
          `"${item.paymentMethod.replace(/"/g, '""')}"`,
          `"${equipmentInfo.replace(/"/g, '""')}"`,
          formatPrice(item.price),
          item.status.toUpperCase()
        ]
      })

      // Calculate summary
      const filteredSummary = dataToExport.reduce(
        (acc, item) => {
          const courtCount = item.courtName ? item.courtName.split(',').length : 1
          acc.totalReservations += courtCount
          acc.totalIncome += item.price
          if (item.status === 'cancelled') {
            acc.totalCancellations += courtCount
          }
          return acc
        },
        { totalReservations: 0, totalIncome: 0, totalCancellations: 0 }
      )

      // Build CSV content
      let csvContent = 'Sales Report\n'
      csvContent += `Period: ${periodLabel}\n`
      csvContent += `Generated: ${new Date().toLocaleDateString()}\n`
      
      if (dateFrom || dateTo) {
        const dateRange = dateFrom && dateTo 
          ? `${new Date(dateFrom).toLocaleDateString()} - ${new Date(dateTo).toLocaleDateString()}`
          : dateFrom 
          ? `From: ${new Date(dateFrom).toLocaleDateString()}`
          : `To: ${new Date(dateTo).toLocaleDateString()}`
        csvContent += `Date Range: ${dateRange}\n`
      }
      
      if (searchQuery) {
        csvContent += `Filtered by: "${searchQuery}"\n`
      }
      
      csvContent += '\n'
      csvContent += headers.join(',') + '\n'
      csvRows.forEach(row => {
        csvContent += row.join(',') + '\n'
      })
      
      csvContent += '\n'
      csvContent += 'Summary\n'
      csvContent += `Total Court Reservations,${filteredSummary.totalReservations}\n`
      csvContent += `Total Income,${formatPrice(filteredSummary.totalIncome)}\n`

      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `Sales_Report_${periodLabel}_${date}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      setShowDownloadDropdown(false)
    } catch (error) {
      console.error('Error downloading CSV report:', error)
      alert('Failed to download CSV report. Please try again.')
    }
  }

  const handleDownloadPDF = () => {
    try {
      // Use the same filtered data that's displayed in the table
      const dataToExport = filteredData
      
      if (dataToExport.length === 0) {
        alert('No data available to download')
        return
      }

      // Create new PDF document
      const doc = new jsPDF()
      
      // Generate filename with period and date
      const date = new Date().toISOString().split('T')[0]
      const periodLabel = periods.find(p => p.value === selectedPeriod)?.label || 'Daily'
      
      // Add title
      doc.setFontSize(18)
      doc.text('Sales Report', 14, 20)
      
      // Add period and date info
      doc.setFontSize(11)
      let yPos = 30
      doc.text(`Period: ${periodLabel}`, 14, yPos)
      yPos += 6
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, yPos)
      
      if (dateFrom || dateTo) {
        yPos += 6
        const dateRange = dateFrom && dateTo 
          ? `${new Date(dateFrom).toLocaleDateString()} - ${new Date(dateTo).toLocaleDateString()}`
          : dateFrom 
          ? `From: ${new Date(dateFrom).toLocaleDateString()}`
          : `To: ${new Date(dateTo).toLocaleDateString()}`
        doc.text(`Date Range: ${dateRange}`, 14, yPos)
      }
      
      if (searchQuery) {
        yPos += 6
        doc.text(`Filtered by: "${searchQuery}"`, 14, yPos)
      }

      // Prepare table data
      const tableData = dataToExport.map(item => {
        // Format equipment rentals
        const equipmentInfo = item.equipmentRentals && item.equipmentRentals.length > 0
          ? item.equipmentRentals.map(rental => 
              `${rental.equipmentName} (Qty: ${rental.quantity}, ${rental.hours}h)`
            ).join('; ')
          : 'None'

        return [
          item.reservationId.toString(),
          item.customerName,
          item.courtName,
          item.time,
          item.date,
          item.paymentMethod,
          equipmentInfo,
          formatPrice(item.price),
          item.status.toUpperCase()
        ]
      })

      // Add table using autoTable
      autoTable(doc, {
        head: [['Reservation ID', 'Customer Name', 'Court Name', 'Time', 'Date', 'Payment Method', 'Racket Rent / Duration', 'Price', 'Status']],
        body: tableData,
        startY: yPos + 8,
        styles: { 
          fontSize: 7,
          cellPadding: 1.5,
          overflow: 'linebreak',
          cellWidth: 'wrap'
        },
        headStyles: { 
          fillColor: [66, 139, 202], 
          textColor: 255, 
          fontStyle: 'bold',
          fontSize: 7,
          halign: 'center'
        },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        columnStyles: {
          0: { cellWidth: 16, halign: 'center' }, // Reservation ID
          1: { cellWidth: 25, halign: 'left' }, // Customer Name
          2: { cellWidth: 16, halign: 'center' }, // Court Name
          3: { cellWidth: 20, halign: 'center' }, // Time
          4: { cellWidth: 20, halign: 'center' }, // Date
          5: { cellWidth: 18, halign: 'center' }, // Payment Method
          6: { cellWidth: 32, halign: 'left', overflow: 'linebreak' }, // Racket Rent / Duration - wrap text
          7: { cellWidth: 18, halign: 'right' }, // Price
          8: { cellWidth: 16, halign: 'center' } // Status
        },
        margin: { 
          left: 10,
          right: 10,
          top: searchQuery ? 48 : 42
        },
        tableWidth: 'wrap'
      })

      // Calculate summary from filtered data
      // Count individual court reservations (not transactions)
      const filteredSummary = dataToExport.reduce(
        (acc, item) => {
          // Count courts by splitting comma-separated court names
          const courtCount = item.courtName ? item.courtName.split(',').length : 1
          acc.totalReservations += courtCount
          acc.totalIncome += item.price
          if (item.status === 'cancelled') {
            // Count cancelled courts, not transactions
            acc.totalCancellations += courtCount
          }
          return acc
        },
        { totalReservations: 0, totalIncome: 0, totalCancellations: 0 }
      )

      // Add summary section
      const finalY = (doc as any).lastAutoTable?.finalY || doc.internal.pageSize.height - 40
      doc.setFontSize(12)
      doc.text('Summary', 14, finalY + 15)
      
      doc.setFontSize(10)
      doc.text(`Total Court Reservations: ${filteredSummary.totalReservations}`, 14, finalY + 25)
      doc.text(`Total Income: ${formatPrice(filteredSummary.totalIncome)}`, 14, finalY + 32)

      // Save the PDF
      const filename = `Sales_Report_${periodLabel}_${date}.pdf`
      doc.save(filename)
      
      setShowDownloadDropdown(false)
    } catch (error) {
      console.error('Error downloading PDF report:', error)
      alert('Failed to download PDF report. Please try again.')
    }
  }

  const handlePeriodChange = (period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly') => {
    setSelectedPeriod(period)
  }

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (downloadDropdownRef.current && !downloadDropdownRef.current.contains(event.target as Node)) {
        setShowDownloadDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Fetch sales report data
  const fetchSalesReport = async (period: string, forceRefresh = false) => {
    try {
      setLoading(true)
      console.log(`[SalesReport] Fetching sales report for period: ${period}`, { forceRefresh })
      
      // Note: dateFrom/dateTo are NOT sent to backend because:
      // - Backend filters by Created_at (when reservation was created)
      // - Manual date filters filter by Reservation_Date (when court is booked) - client-side only
      // This is intentional to allow filtering by booking date vs creation date
      const response = await api.get(`/payments/sales-report?period=${period}`)
      console.log(`[SalesReport] Response:`, response.data)
      if (response.data) {
        setSalesData(response.data.data || [])
        setSummary(response.data.summary || { totalReservations: 0, totalIncome: 0, totalCancellations: 0 })
        if (forceRefresh) {
          setCurrentPage(1) // Reset to first page when refreshing
        }
      }
    } catch (error: any) {
      console.error('Error fetching sales report:', error)
      console.error('Error details:', error.response?.data || error.message)
      setSalesData([])
      setSummary({ totalReservations: 0, totalIncome: 0, totalCancellations: 0 })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSalesReport(selectedPeriod)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPeriod])


  // Reset pagination when search query or date filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, dateFrom, dateTo])

  // Helper function to parse date string to Date object
  const parseDate = (dateString: string): Date | null => {
    if (!dateString) return null
    // Try to parse common date formats
    // Format: "October 31, 2025" or "January 1, 2026"
    const months: { [key: string]: string } = {
      'january': '01', 'february': '02', 'march': '03', 'april': '04',
      'may': '05', 'june': '06', 'july': '07', 'august': '08',
      'september': '09', 'october': '10', 'november': '11', 'december': '12'
    }
    
    const parts = dateString.toLowerCase().split(',').map(s => s.trim())
    if (parts.length === 2) {
      const monthDay = parts[0].split(' ')
      const month = months[monthDay[0]]
      const day = monthDay[1]
      const year = parts[1]
      if (month && day && year) {
        return new Date(`${year}-${month}-${day.padStart(2, '0')}`)
      }
    }
    
    // Try parsing as ISO date
    const isoDate = new Date(dateString)
    if (!isNaN(isoDate.getTime())) {
      return isoDate
    }
    
    return null
  }

  // Filter data by search query and date range
  // IMPORTANT: Backend filters by Created_at (when reservation was created) for period buttons
  // Manual date filters (From/To) filter by Reservation_Date (when court is booked) - this is intentional
  // Period buttons = "reservations created in this period"
  // Manual date filters = "reservations booked for this date range"
  const filteredData = salesData.filter(item => {
    // Filter by date range (manual date filters - filters by Reservation_Date/booking date)
    if (dateFrom || dateTo) {
      const itemDate = parseDate(item.date)
      if (itemDate) {
        const fromDate = dateFrom ? new Date(dateFrom) : null
        const toDate = dateTo ? new Date(dateTo) : null
        
        // Validate date range
        if (fromDate && toDate && fromDate > toDate) {
          // Invalid range - don't filter (show all)
          return true
        }
        
        // Set time to start of day for fromDate
        if (fromDate) {
          fromDate.setHours(0, 0, 0, 0)
        }
        
        // Set time to end of day for toDate
        if (toDate) {
          toDate.setHours(23, 59, 59, 999)
        }
        
        // Set time to start of day for itemDate for comparison
        const itemDateStart = new Date(itemDate)
        itemDateStart.setHours(0, 0, 0, 0)
        
        if (fromDate && itemDateStart < fromDate) return false
        if (toDate && itemDateStart > toDate) return false
      } else {
        // If we can't parse the date but filters are set, exclude it
        return false
      }
    }
    
    // Filter by search query
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    
    // Search in customer name
    if (item.customerName.toLowerCase().includes(query)) return true
    
    // Search in court name
    if (item.courtName.toLowerCase().includes(query)) return true
    
    // Search in payment method
    if (item.paymentMethod.toLowerCase().includes(query)) return true
    
    // Search in time
    if (item.time.toLowerCase().includes(query)) return true
    
    // Search in date
    if (item.date.toLowerCase().includes(query)) return true
    
    // Search in reservation ID
    if (item.reservationId.toString().includes(query)) return true
    
    // Search in price (as number and formatted)
    const priceStr = item.price.toString()
    const formattedPrice = formatPrice(item.price).toLowerCase()
    if (priceStr.includes(query) || formattedPrice.includes(query)) return true
    
    // Search in equipment rentals
    if (item.equipmentRentals && item.equipmentRentals.length > 0) {
      const hasMatchingEquipment = item.equipmentRentals.some(rental => 
        rental.equipmentName.toLowerCase().includes(query) ||
        rental.quantity.toString().includes(query) ||
        rental.hours.toString().includes(query)
      )
      if (hasMatchingEquipment) return true
    }
    
    return false
  })

  const totalPages = Math.ceil(filteredData.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentData = filteredData.slice(startIndex, endIndex)

  // Update pagination when data changes
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1)
    }
  }, [filteredData, currentPage, totalPages])

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
      
      {/* Header */}
      <AdminHeader />

      {/* Main Content with Sidebar */}
      <div className="pt-14 sm:pt-16">
        <AdminSidebar 
          activeItem={activeSidebarItem} 
          onItemChange={setActiveSidebarItem}
        />

        {/* Main Content */}
        <main className="p-3 sm:p-4 md:p-6 lg:p-8 overflow-x-hidden bg-gray-50 min-h-screen animate-fadeIn transition-all duration-300 md:ml-64">
          {/* Enhanced Header Section */}
          <div className="mb-4 sm:mb-6 lg:mb-8">
            <div className="bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/30 rounded-2xl sm:rounded-3xl shadow-2xl border border-gray-200/60 p-4 sm:p-6 lg:p-8 xl:p-10 animate-slideDown backdrop-blur-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 sm:space-x-3 mb-3 sm:mb-4">
                    <div className="p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg flex-shrink-0">
                      <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-900 bg-clip-text text-transparent mb-1 sm:mb-2 break-words">
                        Sales Report
                      </h1>
                      <p className="text-sm sm:text-base lg:text-lg text-gray-600 leading-relaxed">
                        Track revenue, reservations, and performance metrics with detailed analytics and insights
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Controls Section - Outside the header card */}
          <div className="flex flex-col gap-4 mb-6">
            {/* Single Row: Date Filter, Period Buttons, Download Button, and Search Filter */}
            <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
              {/* Left Side: Date Filter */}
              <div className="flex items-center gap-3 bg-white rounded-lg border border-gray-300 p-2 shadow-sm">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <label className="text-sm font-medium text-gray-700">From:</label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => {
                      setDateFrom(e.target.value)
                      // Validate: if To date is set and From > To, show warning
                      if (e.target.value && dateTo && new Date(e.target.value) > new Date(dateTo)) {
                        console.warn('Invalid date range: From date is after To date')
                      }
                    }}
                    max={dateTo || undefined}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700">To:</label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => {
                      setDateTo(e.target.value)
                      // Validate: if From date is set and To < From, show warning
                      if (e.target.value && dateFrom && new Date(e.target.value) < new Date(dateFrom)) {
                        console.warn('Invalid date range: To date is before From date')
                      }
                    }}
                    min={dateFrom || undefined}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                  />
                </div>
                {(dateFrom || dateTo) && (
                  <button
                    onClick={() => {
                      setDateFrom('')
                      setDateTo('')
                    }}
                    className="ml-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
                    title="Clear date filter"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Center: Period Buttons */}
              <div className="flex items-center gap-0 bg-white border border-gray-300 rounded-md p-0.5">
                {periods.map((period) => (
                  <button
                    key={period.value}
                    onClick={() => handlePeriodChange(period.value as any)}
                    className={`px-4 py-2 rounded-md font-medium text-sm transition-all duration-200 ${
                      selectedPeriod === period.value
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {period.label}
                  </button>
                ))}
              </div>

              {/* Right Side: Refresh, Download Button and Search Filter */}
              <div className="flex items-center gap-4">
                {/* Refresh Button */}
                <button
                  onClick={() => {
                    fetchSalesReport(selectedPeriod, true)
                  }}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-md font-medium transition-all duration-200 hover:scale-105 shadow-sm hover:shadow-md"
                  title="Refresh data"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh
                </button>
                
                {/* Download Report Button with Dropdown */}
                <div className="relative" ref={downloadDropdownRef}>
                  <button
                    onClick={() => setShowDownloadDropdown(!showDownloadDropdown)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium transition-all duration-200 hover:scale-105 shadow-sm hover:shadow-md"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download Report
                    <svg 
                      className={`w-4 h-4 transition-transform duration-200 ${showDownloadDropdown ? 'rotate-180' : ''}`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {showDownloadDropdown && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                      <button
                        onClick={handleDownloadPDF}
                        className="w-full flex items-center space-x-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        <span>Download as PDF</span>
                      </button>
                      <button
                        onClick={handleDownloadCSV}
                        className="w-full flex items-center space-x-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span>Download as CSV</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Search Bar */}
                <div className="relative w-full sm:w-auto sm:max-w-md">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search sales data..."
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                  />
                  <svg 
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Sales Report Table */}
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden animate-fadeInUp">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Loading sales report...</span>
              </div>
            ) : (
              <>
                {/* Date Display */}
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm font-medium text-gray-700">Report Date:</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {(() => {
                        // If manual date filters are set, use those
                        if (dateFrom || dateTo) {
                          if (dateFrom && dateTo) {
                            return `${new Date(dateFrom).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} - ${new Date(dateTo).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`
                          } else if (dateFrom) {
                            return `From ${new Date(dateFrom).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`
                          } else {
                            return `Until ${new Date(dateTo).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`
                          }
                        }
                        // Otherwise, use calculated period date range
                        const periodRange = getPeriodDateRange()
                        const startDateStr = periodRange.start.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                        const endDateStr = periodRange.end.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                        
                        // For daily, just show the date
                        if (selectedPeriod === 'daily') {
                          return endDateStr
                        }
                        // For other periods, show the range
                        return `${startDateStr} - ${endDateStr}`
                      })()}
                    </span>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b-2 border-gray-200" style={{ backgroundColor: '#475569' }}>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">CUSTOMER</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">COURT #</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">TIME</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">DATE</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">PAYMENT</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">RACKET RENT / DURATION</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">PRICE</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredData.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                            {searchQuery || dateFrom || dateTo ? (
                              <div>
                                <p className="text-lg font-medium mb-2">No results found</p>
                                <p className="text-sm text-gray-400">
                                  {searchQuery && (dateFrom || dateTo) ? (
                                    <>
                                      No sales data matches your search "{searchQuery}" and date range
                                      {dateFrom && dateTo && new Date(dateFrom) > new Date(dateTo) && (
                                        <span className="block mt-2 text-red-500 text-xs">⚠️ Invalid date range: From date is after To date</span>
                                      )}
                                    </>
                                  ) : searchQuery ? (
                                    <>No sales data matches your search "{searchQuery}"</>
                                  ) : (
                                    <>
                                      No sales data found for the selected date range
                                      {dateFrom && dateTo && (
                                        <> ({new Date(dateFrom).toLocaleDateString()} - {new Date(dateTo).toLocaleDateString()})</>
                                      )}
                                      {dateFrom && dateTo && new Date(dateFrom) > new Date(dateTo) && (
                                        <span className="block mt-2 text-red-500 text-xs">⚠️ Invalid date range: From date is after To date</span>
                                      )}
                                    </>
                                  )}
                                </p>
                              </div>
                            ) : (
                              <div>
                                <p className="text-lg font-medium mb-2">No sales data available</p>
                                <p className="text-sm text-gray-400">
                                  No reservations found for the selected period ({selectedPeriod})
                                </p>
                              </div>
                            )}
                          </td>
                        </tr>
                      ) : (
                        currentData.map((item, index) => (
                          <tr 
                            key={item.reservationId} 
                            className={`border-b border-gray-100 transition-all duration-200 hover:bg-blue-50 ${
                              index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                            } animate-slideIn`}
                            style={{ animationDelay: `${index * 50}ms` }}
                          >
                            <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.customerName}</td>
                            <td className="px-6 py-4 text-sm text-gray-700">
                              <div className="flex flex-col gap-1">
                                {item.courtName.split(', ').map((court, idx) => (
                                  <div key={idx} className="flex items-center space-x-2">
                                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                                    <span>{court.trim()}</span>
                                  </div>
                                ))}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-700">
                              <div className="flex flex-col gap-1">
                                {item.time.split(', ').map((time, idx) => (
                                  <div key={idx} className="flex items-center space-x-2">
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    <span>{time.trim()}</span>
                                  </div>
                                ))}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-700">{item.date}</td>
                            <td className="px-6 py-4 text-sm font-medium text-green-600">{item.paymentMethod}</td>
                            <td className="px-6 py-4 text-sm text-gray-700">
                              {item.equipmentRentals && item.equipmentRentals.length > 0 ? (
                                <div className="flex flex-col gap-1.5">
                                  {item.equipmentRentals.map((rental, idx) => (
                                    <div key={idx} className="flex items-center gap-1.5">
                                      <span className="font-medium">{rental.equipmentName}</span>
                                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-blue-100 text-blue-700 text-xs font-medium">
                                        {rental.hours}h
                                        {rental.quantity && rental.quantity > 1 ? ` x${rental.quantity}` : ''}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-gray-400">None</span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-sm font-semibold text-green-600">
                              {formatPrice(item.price)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Summary Statistics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 px-4 py-4 border-t border-gray-200 bg-gray-50">
                  {/* Total Reservations Card */}
                  <div className="bg-white px-4 py-6 rounded-lg border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-4">
                      {/* Icon */}
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <div className="text-sm text-gray-600 mb-1">
                          Total Court Reservations
                          {(dateFrom || dateTo || searchQuery || selectedPeriod === 'daily') && (
                            <span className="text-xs text-gray-400 ml-2">(Filtered)</span>
                          )}
                        </div>
                        <div className="text-2xl font-bold text-gray-900">
                          {/* Count individual court reservations from filtered transactions */}
                          {(() => {
                            // Count courts by splitting comma-separated court names in each transaction
                            // Each transaction can have multiple courts (e.g., "Court 1, Court 2")
                            return filteredData.reduce((total, item) => {
                              // Count courts by splitting the comma-separated court names
                              const courtCount = item.courtName ? item.courtName.split(',').length : 1
                              return total + courtCount
                            }, 0)
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Total Income Card */}
                  <div className="bg-white px-4 py-6 rounded-lg border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-4">
                      {/* Icon */}
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <div className="text-sm text-gray-600 mb-1">
                          Total Income
                          {(dateFrom || dateTo || searchQuery || selectedPeriod === 'daily') && (
                            <span className="text-xs text-gray-400 ml-2">(Filtered)</span>
                          )}
                        </div>
                        <div className="text-2xl font-bold text-green-600">
                          {/* Always calculate from filtered data to ensure accuracy */}
                          {formatPrice(
                            filteredData.reduce((sum, item) => sum + item.price, 0)
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-end px-4 py-3 border-t border-gray-200">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <span className="mx-4 text-sm text-gray-700">
                      Page {currentPage} out of {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

export default AdminSalesReport

