import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import api from '@/lib/api'
import AdminSidebar from '@/components/AdminSidebar'
import AdminFooter from '@/components/AdminFooter'
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

interface SalesReportSummary {
  totalReservations: number
  totalIncome: number
  totalCancellations: number
}

const AdminSalesReport = () => {
  const [showUserDropdown, setShowUserDropdown] = useState(false)
  const [activeSidebarItem, setActiveSidebarItem] = useState('Sales Report')
  const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'>('daily')
  const [salesData, setSalesData] = useState<SalesReportItem[]>([])
  const [summary, setSummary] = useState<SalesReportSummary>({ totalReservations: 0, totalIncome: 0, totalCancellations: 0 })
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [searchQuery, setSearchQuery] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Helper function to format role
  const formatRole = (role?: string) => {
    if (!role) return 'User'
    return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase()
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2,
    }).format(price)
  }

  const periods = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'quarterly', label: 'Quarterly' },
    { value: 'yearly', label: 'Yearly' },
  ]

  const handleDownload = () => {
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
        tableWidth: 'wrap',
        overflow: 'linebreak'
      })

      // Calculate summary from filtered data
      const filteredSummary = dataToExport.reduce(
        (acc, item) => {
          acc.totalReservations += 1
          acc.totalIncome += item.price
          if (item.status === 'cancelled') {
            acc.totalCancellations += 1
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
      doc.text(`Total Reservations: ${filteredSummary.totalReservations}`, 14, finalY + 25)
      doc.text(`Total Income: ${formatPrice(filteredSummary.totalIncome)}`, 14, finalY + 32)
      doc.text(`Total Cancellations: ${filteredSummary.totalCancellations}`, 14, finalY + 39)

      // Save the PDF
      const filename = `Sales_Report_${periodLabel}_${date}.pdf`
      doc.save(filename)
    } catch (error) {
      console.error('Error downloading report:', error)
      alert('Failed to download report. Please try again.')
    }
  }

  const handlePeriodChange = (period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly') => {
    setSelectedPeriod(period)
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Fetch sales report data
  const fetchSalesReport = async (period: string) => {
    try {
      setLoading(true)
      console.log(`[SalesReport] Fetching sales report for period: ${period}`)
      const response = await api.get(`/payments/sales-report?period=${period}`)
      console.log(`[SalesReport] Response:`, response.data)
      if (response.data) {
        setSalesData(response.data.data || [])
        setSummary(response.data.summary || { totalReservations: 0, totalIncome: 0, totalCancellations: 0 })
        setCurrentPage(1) // Reset to first page when changing period
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
  const filteredData = salesData.filter(item => {
    // Filter by date range
    if (dateFrom || dateTo) {
      const itemDate = parseDate(item.date)
      if (itemDate) {
        const fromDate = dateFrom ? new Date(dateFrom) : null
        const toDate = dateTo ? new Date(dateTo) : null
        
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
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40 overflow-visible backdrop-blur-sm bg-white/95">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 overflow-visible">
          <div className="flex justify-between items-center h-14 sm:h-16 relative">
            <div className="flex items-center">
              <img 
                src="/assets/icons/BBC ICON.png" 
                alt="BBC Logo" 
                className="h-12 w-12 sm:h-16 sm:w-16 lg:h-24 lg:w-24 object-contain hover:scale-105 transition-transform duration-200" 
              />
            </div>

            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  className="flex items-center space-x-2 sm:space-x-3 px-2 sm:px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <img
                    src={user?.profile_picture || '/assets/img/home-page/Ellipse 1.png'}
                    alt="Profile"
                    className="w-6 h-6 sm:w-8 sm:h-8 rounded-full object-cover border-2 border-gray-200"
                  />
                  <div className="text-left hidden sm:block">
                    <div className="text-xs sm:text-sm font-medium text-gray-900">{user?.name || user?.username || 'User'}</div>
                    <div className="text-xs text-gray-500">{formatRole(user?.role)}</div>
                  </div>
                  <svg 
                    className={`w-3 h-3 sm:w-4 sm:h-4 text-gray-400 ${showUserDropdown ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showUserDropdown && (
                  <div className="absolute right-0 mt-2 w-40 sm:w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200"
                       style={{
                         position: 'absolute',
                         top: '100%',
                         right: '0',
                         marginTop: '0.5rem'
                       }}>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center space-x-2 px-3 sm:px-4 py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content with Sidebar */}
      <div className="flex">
        <AdminSidebar activeItem={activeSidebarItem} onItemChange={setActiveSidebarItem} />

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden bg-gray-50 min-h-screen animate-fadeIn">
          {/* Sales Report Header Card */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-6 animate-slideDown">
            <h1 className="text-5xl font-bold text-gray-900 mb-2">Sales Report</h1>
            <p className="text-lg text-gray-600">Track revenue, reservations, and performance metrics.</p>
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
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700">To:</label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
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

              {/* Right Side: Download Button and Search Filter */}
              <div className="flex items-center gap-4">
                {/* Download Report Button */}
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium transition-all duration-200 hover:scale-105 shadow-sm hover:shadow-md"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download Report
                </button>

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
                                    </>
                                  ) : searchQuery ? (
                                    <>No sales data matches your search "{searchQuery}"</>
                                  ) : (
                                    <>
                                      No sales data found for the selected date range
                                      {dateFrom && dateTo && (
                                        <> ({new Date(dateFrom).toLocaleDateString()} - {new Date(dateTo).toLocaleDateString()})</>
                                      )}
                                    </>
                                  )}
                                </p>
                              </div>
                            ) : (
                              'No sales data available for the selected period'
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
                            <td className="px-6 py-4 text-sm text-gray-700">{item.courtName}</td>
                            <td className="px-6 py-4 text-sm text-gray-700">{item.time}</td>
                            <td className="px-6 py-4 text-sm text-gray-700">{item.date}</td>
                            <td className="px-6 py-4 text-sm font-medium text-green-600">{item.paymentMethod}</td>
                            <td className="px-6 py-4 text-sm text-gray-700">
                              {item.equipmentRentals && item.equipmentRentals.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                  {item.equipmentRentals.slice(0, 2).map((rental, idx) => (
                                    <div key={idx} className="flex items-center gap-2">
                                      <span>{rental.equipmentName}</span>
                                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-blue-100 text-blue-700 text-xs font-medium animate-pulse-slow">
                                        {rental.hours}h
                                      </span>
                                    </div>
                                  ))}
                                  {item.equipmentRentals.length > 2 && (
                                    <span className="text-xs text-gray-500">+{item.equipmentRentals.length - 2} more</span>
                                  )}
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
                          Total Reservations
                          {(dateFrom || dateTo || searchQuery) && (
                            <span className="text-xs text-gray-400 ml-2">(Filtered)</span>
                          )}
                        </div>
                        <div className="text-2xl font-bold text-gray-900">{filteredData.length}</div>
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
                          {(dateFrom || dateTo || searchQuery) && (
                            <span className="text-xs text-gray-400 ml-2">(Filtered)</span>
                          )}
                        </div>
                        <div className="text-2xl font-bold text-green-600">
                          {formatPrice(filteredData.reduce((sum, item) => sum + item.price, 0))}
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
      <AdminFooter />
    </div>
  )
}

export default AdminSalesReport

