import { useState, ChangeEvent, useMemo, useCallback, useEffect, useRef } from 'react'
import { QueueingShell } from '@/components/QueueingShell'
import { apiServices, type QueuePlayer } from '@/lib/apiServices'
import toast from 'react-hot-toast'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

type FeeFormState = {
  doublesFee: string
  courtFee: string
  currency: string
}

const initialFeeState: FeeFormState = {
  doublesFee: '30',
  courtFee: '150',
  currency: 'PHP (₱)',
}

type FeeRow = {
  playerId: number
  label: string
  sex: QueuePlayer['sex']
  games: number
  shuttleFee: number
  courtFee: number
  status: 'paid' | 'unpaid'
}

export function QueueSettingsPage() {
  const [isEditing, setIsEditing] = useState(false)
  const [feeForm, setFeeForm] = useState<FeeFormState>(initialFeeState)
  const [players, setPlayers] = useState<QueuePlayer[]>([])
  const [paidPlayers, setPaidPlayers] = useState<QueuePlayer[]>([]) // Keep paid players visible even after deletion
  const [playersLoading, setPlayersLoading] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState<Record<number, 'paid' | 'unpaid'>>({})
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'current' | 'history'>('current')
  const [selectedHistoryDate, setSelectedHistoryDate] = useState<string | null>(null)
  const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false)
  const dateDropdownRef = useRef<HTMLDivElement | null>(null)

  const handleInputChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target
    setFeeForm((prev) => ({ ...prev, [name]: value } as FeeFormState))
  }

  const currencySymbol = useMemo(() => {
    const match = feeForm.currency.match(/\(([^)]+)\)/)
    return match ? match[1] : '₱'
  }, [feeForm.currency])

  const formatCurrency = useCallback(
    (value: number) => `${currencySymbol}${Number.isFinite(value) ? value.toFixed(2) : '0.00'}`,
    [currencySymbol]
  )

  const displayValue = useCallback((value: string) => formatCurrency(Number(value || 0)), [formatCurrency])

  const numericDoublesFee = useMemo(() => Number(feeForm.doublesFee || 0), [feeForm.doublesFee])
  const numericCourtFee = useMemo(() => Number(feeForm.courtFee || 0), [feeForm.courtFee])

  // Get today's date in ISO format (YYYY-MM-DD) using local timezone
  // This matches the logic in QueuePlayersPage for consistency
  const getTodayISODate = useCallback(() => {
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }, [])

  const todayISODate = getTodayISODate()

  // Show ALL players from queue players page (no date filtering)
  // Also include paid players that were deleted from queue but remain in fee management
  const activePlayers = useMemo(() => {
    // Combine current players and paid players (avoid duplicates)
    const allPlayersMap = new Map<number, QueuePlayer>()
    
    // Add current players
    players.forEach(player => {
      allPlayersMap.set(player.id, player)
    })
    
    // Add paid players (these were deleted from queue but kept for fee management)
    paidPlayers.forEach(player => {
      if (!allPlayersMap.has(player.id)) {
        allPlayersMap.set(player.id, player)
      }
    })
    
    return Array.from(allPlayersMap.values())
  }, [players, paidPlayers])

  // Group players by date for history view
  const historyByDate = useMemo(() => {
    return players.reduce((acc, player) => {
      // Skip players without lastPlayed date
      if (!player.lastPlayed) {
        return acc
      }
      
      // Extract date part (YYYY-MM-DD) from lastPlayed using local timezone
      let playerDate: string
      if (typeof player.lastPlayed === 'string') {
        playerDate = player.lastPlayed.slice(0, 10)
      } else {
        // Use local timezone, not UTC, to match backend behavior
        const date = new Date(player.lastPlayed)
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        playerDate = `${year}-${month}-${day}`
      }
      
      // Only include players with dates BEFORE today (not today or future dates)
      if (playerDate < todayISODate) {
        if (!acc[playerDate]) {
          acc[playerDate] = []
        }
        acc[playerDate].push(player)
      }
      
      return acc
    }, {} as Record<string, QueuePlayer[]>)
  }, [players, todayISODate])

  // Extract unique dates that have players, sorted descending, limited to 5 most recent
  const HISTORY_DATE_LIMIT = 5
  const historyDates = useMemo(() => {
    const sortedDates = Object.keys(historyByDate).sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
    return sortedDates.slice(0, HISTORY_DATE_LIMIT)
  }, [historyByDate])

  // Auto-select first date when switching to history tab
  useEffect(() => {
    if (activeTab === 'history' && historyDates.length > 0 && !selectedHistoryDate) {
      setSelectedHistoryDate(historyDates[0])
    }
  }, [activeTab, historyDates, selectedHistoryDate])

  // Auto-select first date if current selection is not available
  useEffect(() => {
    if (activeTab === 'history' && historyDates.length > 0) {
      if (!selectedHistoryDate || !historyDates.includes(selectedHistoryDate)) {
        setSelectedHistoryDate(historyDates[0])
      }
    }
  }, [activeTab, historyDates, selectedHistoryDate])

  // Handle click outside date dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dateDropdownRef.current && !dateDropdownRef.current.contains(event.target as Node)) {
        setIsDateDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Current fees rows
  const rows = useMemo<FeeRow[]>(() => {
    return activePlayers.map((player) => ({
      playerId: player.id,
      label: player.name,
      sex: player.sex,
      games: player.gamesPlayed,
      shuttleFee: player.gamesPlayed * numericDoublesFee,
      courtFee: numericCourtFee,
      status: paymentStatus[player.id] ?? 'unpaid'
    }))
  }, [activePlayers, numericCourtFee, numericDoublesFee, paymentStatus])

  // History rows for selected date
  const historyRows = useMemo<Omit<FeeRow, 'status'>[]>(() => {
    if (!selectedHistoryDate || !historyByDate[selectedHistoryDate]) {
      return []
    }
    
    return historyByDate[selectedHistoryDate].map((player) => ({
      playerId: player.id,
      label: player.name,
      sex: player.sex,
      games: player.gamesPlayed,
      shuttleFee: player.gamesPlayed * numericDoublesFee,
      courtFee: numericCourtFee
    }))
  }, [selectedHistoryDate, historyByDate, numericCourtFee, numericDoublesFee])

  const totals = useMemo(() => {
    return rows.reduce(
      (acc, row) => {
        const total = row.shuttleFee + row.courtFee
        if (row.status === 'paid') {
          acc.collected += total
        } else {
          acc.outstanding += total
        }
        return acc
      },
      { collected: 0, outstanding: 0 }
    )
  }, [rows])

  const filteredRows = useMemo(() => {
    if (!searchQuery.trim()) return rows
    const query = searchQuery.toLowerCase()
    return rows.filter((row) => row.label.toLowerCase().includes(query))
  }, [rows, searchQuery])

  const filteredHistoryRows = useMemo(() => {
    if (!searchQuery.trim()) return historyRows
    const query = searchQuery.toLowerCase()
    return historyRows.filter((row) => row.label.toLowerCase().includes(query))
  }, [historyRows, searchQuery])

  // Format date for dropdown display
  const formatDateForDropdown = useCallback((dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }, [])

  // Format date for PDF display
  const formatDateForPDF = useCallback((dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    })
  }, [])

  // Export to PDF
  const handleExportPDF = useCallback(() => {
    try {
      const doc = new jsPDF()
      const pageWidth = doc.internal.pageSize.getWidth()
      const margin = 14
      let yPos = margin

      // Title
      doc.setFontSize(18)
      doc.setTextColor(37, 99, 235) // Blue color
      doc.text('Fee Management Report', margin, yPos)
      yPos += 10

      // Report type and date
      doc.setFontSize(12)
      doc.setTextColor(0, 0, 0) // Black
      const reportType = activeTab === 'current' ? 'Current Fees' : 'History'
      doc.text(`Report Type: ${reportType}`, margin, yPos)
      yPos += 6

      const reportDate = activeTab === 'current'
        ? formatDateForPDF(todayISODate)
        : selectedHistoryDate
          ? formatDateForPDF(selectedHistoryDate)
          : 'N/A'
      doc.text(`Date: ${reportDate}`, margin, yPos)
      yPos += 10

      // Summary section
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.text('Summary', margin, yPos)
      yPos += 6
      doc.setFont('helvetica', 'normal')

      if (activeTab === 'current') {
        doc.text(`Collected: ${formatCurrency(totals.collected)}`, margin, yPos)
        yPos += 6
        doc.text(`Unpaids: ${formatCurrency(totals.outstanding)}`, margin, yPos)
      } else {
        const historyTotal = filteredHistoryRows.reduce((sum, row) => sum + row.shuttleFee + row.courtFee, 0)
        doc.text(`Total Fees: ${formatCurrency(historyTotal)}`, margin, yPos)
      }
      yPos += 10

      // Table data
      const tableData = activeTab === 'current'
        ? filteredRows.map((row) => [
            row.label,
            row.sex === 'male' ? 'Male' : 'Female',
            row.games.toString(),
            formatCurrency(row.shuttleFee),
            formatCurrency(row.courtFee),
            formatCurrency(row.shuttleFee + row.courtFee),
            row.status === 'paid' ? 'Paid' : 'Unpaid'
          ])
        : filteredHistoryRows.map((row) => [
            row.label,
            row.sex === 'male' ? 'Male' : 'Female',
            row.games.toString(),
            formatCurrency(row.shuttleFee),
            formatCurrency(row.courtFee),
            formatCurrency(row.shuttleFee + row.courtFee)
          ])

      const tableHeaders = activeTab === 'current'
        ? ['Player', 'Gender', 'Games', 'Shuttle Fees', 'Court Fee', 'Total', 'Status']
        : ['Player', 'Gender', 'Games', 'Shuttle Fees', 'Court Fee', 'Total']

      // Generate table
      autoTable(doc, {
        head: [tableHeaders],
        body: tableData,
        startY: yPos,
        margin: { left: margin, right: margin },
        styles: {
          fontSize: 9,
          cellPadding: 3,
          overflow: 'linebreak',
          cellWidth: 'wrap'
        },
        headStyles: {
          fillColor: [37, 99, 235], // Blue header
          textColor: 255,
          fontStyle: 'bold',
          halign: 'left'
        },
        columnStyles: {
          0: { cellWidth: 50 }, // Player
          1: { cellWidth: 25, halign: 'center' }, // Gender
          2: { cellWidth: 20, halign: 'center' }, // Games
          3: { cellWidth: 30, halign: 'right' }, // Shuttle Fees
          4: { cellWidth: 25, halign: 'right' }, // Court Fee
          5: { cellWidth: 30, halign: 'right' }, // Total
          ...(activeTab === 'current' && { 6: { cellWidth: 25, halign: 'center' } }) // Status
        },
        alternateRowStyles: {
          fillColor: [245, 247, 250]
        }
      })

      // Footer with timestamp
      const pageCount = doc.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.setTextColor(128, 128, 128)
        const footerY = doc.internal.pageSize.getHeight() - 10
        const timestamp = new Date().toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
        doc.text(
          `Generated on ${timestamp}`,
          pageWidth / 2,
          footerY,
          { align: 'center' }
        )
      }

      // Generate filename
      const dateStr = activeTab === 'current'
        ? todayISODate
        : selectedHistoryDate || todayISODate
      const filename = activeTab === 'current'
        ? `fee-management-current-${dateStr}.pdf`
        : `fee-management-history-${dateStr}.pdf`

      // Save PDF
      doc.save(filename)
      toast.success('PDF exported successfully!')
    } catch (error) {
      console.error('Failed to export PDF', error)
      toast.error('Failed to export PDF. Please try again.')
    }
  }, [
    activeTab,
    todayISODate,
    selectedHistoryDate,
    filteredRows,
    filteredHistoryRows,
    totals,
    formatCurrency,
    formatDateForPDF
  ])

  const handleTogglePaymentStatus = useCallback(async (playerId: number) => {
    const currentStatus = paymentStatus[playerId] || 'unpaid'
    const newStatus = currentStatus === 'paid' ? 'unpaid' : 'paid'
    
    if (newStatus === 'paid') {
      // When marking as paid, delete player from queue but keep in fee management
      const playerToKeep = players.find(p => p.id === playerId)
      
      if (playerToKeep) {
        try {
          // Delete player from backend queue
          await apiServices.deleteQueuePlayer(playerId)
          
          // Remove from current players list
          setPlayers(prev => prev.filter(p => p.id !== playerId))
          
          // Add to paid players list (so they remain visible in fee management)
          setPaidPlayers(prev => {
            // Avoid duplicates
            if (prev.some(p => p.id === playerId)) {
              return prev
            }
            return [...prev, playerToKeep]
          })
          
          // Update payment status
          setPaymentStatus(prev => ({
            ...prev,
            [playerId]: 'paid'
          }))
          
          toast.success(`${playerToKeep.name} marked as paid and removed from queue.`)
        } catch (error) {
          console.error('Failed to delete player when marking as paid', error)
          toast.error('Failed to mark player as paid. Please try again.')
        }
      }
    } else {
      // When marking as unpaid, just update the status
      setPaymentStatus(prev => ({
        ...prev,
        [playerId]: 'unpaid'
      }))
    }
  }, [paymentStatus, players])

  const loadPlayers = useCallback(async () => {
    setPlayersLoading(true)
    try {
      const response = await apiServices.getQueuePlayers()
      setPlayers(response)
      setPaymentStatus((prev) => {
        const next: Record<number, 'paid' | 'unpaid'> = {}
        response.forEach((player) => {
          next[player.id] = prev[player.id] ?? 'unpaid'
        })
        return next
      })
    } catch (error) {
      console.error('Failed to load queue players for fee management', error)
      toast.error('Failed to load current players')
    } finally {
      setPlayersLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadPlayers()
  }, [loadPlayers])

  return (
    <QueueingShell activeTab="settings">
      <section className="rounded-3xl border border-white/10 bg-white/[0.05] text-white shadow-2xl shadow-black/30 backdrop-blur-lg">
        <div className="space-y-6 px-4 py-6 sm:px-6">
          {isEditing ? (
            <div className="space-y-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-lg font-semibold">Fee Configuration</h2>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold uppercase tracking-wide text-white/80">
                    Doubles Player Shuttle Fee
                  </label>
                  <div className="rounded-xl border border-white/25 bg-white/80 px-4 py-3 text-sm text-slate-900 shadow-inner">
                    <input
                      type="number"
                      name="doublesFee"
                      value={feeForm.doublesFee}
                      onChange={handleInputChange}
                      className="w-full bg-transparent outline-none"
                      min="0"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold uppercase tracking-wide text-white/80">
                    Court Fee per Player
                  </label>
                  <div className="rounded-xl border border-white/25 bg-white/80 px-4 py-3 text-sm text-slate-900 shadow-inner">
                    <input
                      type="number"
                      name="courtFee"
                      value={feeForm.courtFee}
                      onChange={handleInputChange}
                      className="w-full bg-transparent outline-none"
                      min="0"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-white/80">Select Currency</label>
                <select
                  name="currency"
                  value={feeForm.currency}
                  onChange={handleInputChange}
                  className="rounded-xl border border-white/25 bg-white/80 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-white/40"
                >
                  <option value="PHP (₱)">PHP (₱)</option>
                  <option value="USD ($)">USD ($)</option>
                  <option value="EUR (€)">EUR (€)</option>
                </select>
              </div>

              <p className="text-xs text-white/70">Flat fee per player for unlimited play.</p>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setFeeForm(initialFeeState)
                    setIsEditing(false)
                  }}
                  className="rounded-md border border-white/40 px-4 py-2 text-xs font-semibold text-white/80 transition hover:bg-white/20"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="rounded-md bg-emerald-500 px-5 py-2 text-xs font-semibold text-white shadow-lg shadow-emerald-500/40 transition hover:bg-emerald-600"
                >
                  Save Changes
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-lg font-semibold">Fee Configuration</h2>
                <button
                  className="rounded-md bg-blue-500 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-blue-500/30 transition hover:bg-blue-600"
                  onClick={() => setIsEditing(true)}
                >
                  Edit fees
                </button>
              </div>
              <div className="rounded-xl border border-white/20 bg-white/15 px-4 py-3 text-sm font-semibold text-white">
                Doubles Player Shuttle Fee
                <p className="mt-1 text-base text-white">{displayValue(feeForm.doublesFee)}</p>
              </div>
              <div className="rounded-xl border border-white/20 bg-white/15 px-4 py-3 text-sm font-semibold text-white">
                Court Fee per Player
                <p className="mt-1 text-base text-white">{displayValue(feeForm.courtFee)}</p>
              </div>
              <div className="rounded-xl border border-white/20 bg-white/15 px-4 py-3 text-sm font-semibold text-white/85">
                Billing Currency
                <p className="mt-1 text-base text-white">{feeForm.currency}</p>
              </div>
            </div>
          )}

          <div className="space-y-4 rounded-2xl border border-white/15 bg-white/15 px-5 py-4 text-sm text-white">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-base font-semibold">Fee Management</h3>
              <div className="flex flex-wrap items-center gap-2">
                {activeTab === 'current' && (
                  <span className="rounded-full border border-white/15 px-3 py-1 text-[11px] text-white/70">
                    Active players: {rows.length}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => void loadPlayers()}
                  className="rounded-md border border-white/20 px-3 py-2 text-xs font-semibold text-white/80 transition hover:bg-white/10"
                >
                  Refresh
                </button>
                <button
                  type="button"
                  onClick={handleExportPDF}
                  disabled={playersLoading || (activeTab === 'history' && (!selectedHistoryDate || filteredHistoryRows.length === 0)) || (activeTab === 'current' && filteredRows.length === 0)}
                  className="rounded-md bg-blue-500 px-3 py-2 text-xs font-semibold text-white shadow-lg shadow-blue-500/30 transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Export
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-white/10">
              <button
                type="button"
                onClick={() => setActiveTab('current')}
                className={`px-4 py-2 text-xs font-semibold uppercase tracking-wide transition ${
                  activeTab === 'current'
                    ? 'border-b-2 border-blue-500 text-blue-300'
                    : 'text-white/60 hover:text-white/80'
                }`}
              >
                Current Fees
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('history')}
                className={`px-4 py-2 text-xs font-semibold uppercase tracking-wide transition ${
                  activeTab === 'history'
                    ? 'border-b-2 border-blue-500 text-blue-300'
                    : 'text-white/60 hover:text-white/80'
                }`}
              >
                History
              </button>
            </div>

            {/* Summary boxes - only show in current tab */}
            {activeTab === 'current' && (
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl bg-emerald-100/90 px-4 py-3 text-emerald-700">
                  <p className="text-xs uppercase tracking-wide">Collected</p>
                  <p className="mt-1 text-xl font-semibold">{formatCurrency(totals.collected)}</p>
                </div>
                <div className="rounded-xl bg-amber-100/90 px-4 py-3 text-amber-700">
                  <p className="text-xs uppercase tracking-wide">Unpaids</p>
                  <p className="mt-1 text-xl font-semibold">{formatCurrency(totals.outstanding)}</p>
                </div>
              </div>
            )}

            {/* Search and Date Filter */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-1 gap-3">
                <input
                  type="text"
                  placeholder="Search players..."
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="w-full max-w-xs rounded-xl border border-white/20 bg-white/20 px-4 py-2 text-xs text-white placeholder:text-white/60 outline-none transition focus:border-white/40 focus:bg-white/25"
                />
                {activeTab === 'history' && historyDates.length > 0 && (
                  <div className="relative" ref={dateDropdownRef}>
                    <button
                      type="button"
                      onClick={() => setIsDateDropdownOpen((prev) => !prev)}
                      className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/20 px-4 py-2 text-xs text-white transition hover:bg-white/25"
                    >
                      <span>{selectedHistoryDate ? formatDateForDropdown(selectedHistoryDate) : 'Select date'}</span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className={`h-4 w-4 transition-transform ${isDateDropdownOpen ? 'rotate-180' : ''}`}
                      >
                        <path
                          fillRule="evenodd"
                          d="M5.23 7.21a.75.75 0 011.06.02L10 10.998l3.71-3.77a.75.75 0 011.08 1.04l-4.25 4.32a.75.75 0 01-1.08 0l-4.25-4.32a.75.75 0 01.02-1.06z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>

                    {isDateDropdownOpen && (
                      <div className="absolute left-0 z-20 mt-2 w-full min-w-[200px] overflow-hidden rounded-xl border border-white/10 bg-[#11142b]/95 shadow-xl backdrop-blur-xl">
                        <div className="max-h-[300px] overflow-y-auto divide-y divide-white/5">
                          {historyDates.map((date) => {
                            const isActive = date === selectedHistoryDate
                            return (
                              <button
                                key={`history-date-${date}`}
                                type="button"
                                onClick={() => {
                                  setSelectedHistoryDate(date)
                                  setIsDateDropdownOpen(false)
                                }}
                                className={`flex w-full items-center justify-between px-4 py-3 text-left text-xs font-medium transition ${
                                  isActive
                                    ? 'bg-[#273373]/60 text-white'
                                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                                }`}
                              >
                                <span>{formatDateForDropdown(date)}</span>
                                {isActive && (
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                    className="h-4 w-4 text-blue-400"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                )}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="overflow-hidden rounded-xl border border-white/15">
              <div className="overflow-x-auto">
                {activeTab === 'current' ? (
                  // Current Fees Table
                  <table className="w-full divide-y divide-white/20 text-xs">
                    <thead className="bg-white/15 uppercase tracking-wide text-white/70">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold">Player</th>
                        <th className="px-4 py-3 text-center font-semibold">Games Played</th>
                        <th className="px-4 py-3 text-left font-semibold">Shuttle Fees</th>
                        <th className="px-4 py-3 text-left font-semibold">Court Fee</th>
                        <th className="px-4 py-3 text-left font-semibold">Total</th>
                        <th className="px-4 py-3 text-left font-semibold">Status</th>
                        <th className="px-4 py-3 text-right font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/15 text-white/85">
                      {playersLoading && (
                        <tr>
                          <td colSpan={7} className="px-4 py-6 text-center text-sm text-white/60">
                            Loading players...
                          </td>
                        </tr>
                      )}
                      {!playersLoading && filteredRows.length === 0 && (
                        <tr>
                          <td colSpan={7} className="px-4 py-6 text-center text-sm text-white/60">
                            {rows.length === 0 ? 'No active players found.' : 'No players match the current search.'}
                          </td>
                        </tr>
                      )}
                      {filteredRows.map((row) => (
                        <tr key={row.label} className="bg-white/10 transition hover:bg-white/15">
                          <td className="px-4 py-2 font-semibold text-white">
                            <div className="flex items-center gap-2">
                              <span
                                className={`inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-sm shadow-inner ${
                                  row.sex === 'male' ? 'bg-sky-500/15 text-sky-300' : 'bg-pink-500/15 text-pink-300'
                                }`}
                                aria-label={row.sex === 'male' ? 'Male player' : 'Female player'}
                                title={row.sex === 'male' ? 'Male player' : 'Female player'}
                              >
                                {row.sex === 'male' ? (
                                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                                    <path d="M13.5 2a.75.75 0 000 1.5h1.69l-3.2 3.2a4.5 4.5 0 10.884.884l3.2-3.2V6.5a.75.75 0 001.5 0V2.75A.75.75 0 0016.75 2H13.5zm-4 5a3 3 0 110 6 3 3 0 010-6z" />
                                  </svg>
                                ) : (
                                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                                    <path d="M10 2a4.5 4.5 0 10.878 8.9l-.378.378H8.75a.75.75 0 000 1.5h1.25v1.25a.75.75 0 001.5 0V12.78l.378-.378A4.5 4.5 0 0010 2zm0 1.5a3 3 0 110 6 3 3 0 010-6z" />
                                  </svg>
                                )}
                              </span>
                              <span>{row.label}</span>
                            </div>
                          </td>
                          <td className="px-4 py-2 text-center">{row.games}</td>
                          <td className="px-4 py-2">{formatCurrency(row.shuttleFee)}</td>
                          <td className="px-4 py-2">{formatCurrency(row.courtFee)}</td>
                          <td className="px-4 py-2">{formatCurrency(row.shuttleFee + row.courtFee)}</td>
                          <td className="px-4 py-2">
                            {row.status === 'paid' ? (
                              <span className="inline-flex items-center rounded-md bg-emerald-500/20 px-3 py-1 text-[11px] font-semibold text-emerald-200 shadow-inner">
                                Paid
                              </span>
                            ) : (
                              <span className="inline-flex items-center rounded-md bg-white/20 px-3 py-1 text-[11px] font-semibold text-white/80 shadow-inner">
                                Unpaid
                              </span>
                            )}
                          </td>
                          <td className="whitespace-nowrap px-4 py-2 text-right">
                            {row.status === 'paid' ? (
                              <button
                                type="button"
                                onClick={() => handleTogglePaymentStatus(row.playerId)}
                                className="rounded-md border border-white/30 px-3 py-1 text-[11px] font-semibold text-white/70 transition hover:bg-white/10 hover:text-white"
                              >
                                Mark Unpaid
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleTogglePaymentStatus(row.playerId)}
                                className="rounded-md bg-emerald-500 px-4 py-1 text-[11px] font-semibold text-white shadow transition hover:bg-emerald-600"
                              >
                                Set Paid
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  // History Table (Read-only)
                  <table className="w-full divide-y divide-white/20 text-xs">
                    <thead className="bg-white/15 uppercase tracking-wide text-white/70">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold">Player</th>
                        <th className="px-4 py-3 text-center font-semibold">Games Played</th>
                        <th className="px-4 py-3 text-left font-semibold">Shuttle Fees</th>
                        <th className="px-4 py-3 text-left font-semibold">Court Fee</th>
                        <th className="px-4 py-3 text-left font-semibold">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/15 text-white/85">
                      {playersLoading && (
                        <tr>
                          <td colSpan={5} className="px-4 py-6 text-center text-sm text-white/60">
                            Loading players...
                          </td>
                        </tr>
                      )}
                      {!playersLoading && historyDates.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-4 py-6 text-center text-sm text-white/60">
                            No fee history recorded yet.
                          </td>
                        </tr>
                      )}
                      {!playersLoading && historyDates.length > 0 && !selectedHistoryDate && (
                        <tr>
                          <td colSpan={5} className="px-4 py-6 text-center text-sm text-white/60">
                            Please select a date to view history.
                          </td>
                        </tr>
                      )}
                      {!playersLoading && selectedHistoryDate && filteredHistoryRows.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-4 py-6 text-center text-sm text-white/60">
                            {historyRows.length === 0 ? 'No players found for this date.' : 'No players match the current search.'}
                          </td>
                        </tr>
                      )}
                      {filteredHistoryRows.map((row) => (
                        <tr key={row.label} className="bg-white/10 transition hover:bg-white/15">
                          <td className="px-4 py-2 font-semibold text-white">
                            <div className="flex items-center gap-2">
                              <span
                                className={`inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-sm shadow-inner ${
                                  row.sex === 'male' ? 'bg-sky-500/15 text-sky-300' : 'bg-pink-500/15 text-pink-300'
                                }`}
                                aria-label={row.sex === 'male' ? 'Male player' : 'Female player'}
                                title={row.sex === 'male' ? 'Male player' : 'Female player'}
                              >
                                {row.sex === 'male' ? (
                                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                                    <path d="M13.5 2a.75.75 0 000 1.5h1.69l-3.2 3.2a4.5 4.5 0 10.884.884l3.2-3.2V6.5a.75.75 0 001.5 0V2.75A.75.75 0 0016.75 2H13.5zm-4 5a3 3 0 110 6 3 3 0 010-6z" />
                                  </svg>
                                ) : (
                                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                                    <path d="M10 2a4.5 4.5 0 10.878 8.9l-.378.378H8.75a.75.75 0 000 1.5h1.25v1.25a.75.75 0 001.5 0V12.78l.378-.378A4.5 4.5 0 0010 2zm0 1.5a3 3 0 110 6 3 3 0 010-6z" />
                                  </svg>
                                )}
                              </span>
                              <span>{row.label}</span>
                            </div>
                          </td>
                          <td className="px-4 py-2 text-center">{row.games}</td>
                          <td className="px-4 py-2">{formatCurrency(row.shuttleFee)}</td>
                          <td className="px-4 py-2">{formatCurrency(row.courtFee)}</td>
                          <td className="px-4 py-2">{formatCurrency(row.shuttleFee + row.courtFee)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </QueueingShell>
  )
}


