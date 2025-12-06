import { useState, ChangeEvent, useMemo, useCallback, useEffect, useRef } from 'react'
import { QueueingShell } from '@/components/QueueingShell'
import { apiServices, type QueuePlayer, type QueueMatch } from '@/lib/apiServices'
import { useAuthStore } from '@/store/authStore'
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

type FeeManagementRecord = {
  id: number
  playerId: number
  userId: number | null
  playerName: string
  playerSex: 'male' | 'female'
  gamesPlayed: number
  shuttleFee: number
  courtFee: number
  totalAmount: number
  paymentStatus: 'paid' | 'unpaid'
  feeDate: string | Date
  notes: string | null
  createdAt: string | Date
  updatedAt: string | Date
}

type FeeManagementHistoryRecord = {
  id: number
  playerId: number
  userId: number | null
  batchId: string | null
  playerName: string
  playerSex: 'male' | 'female'
  gamesPlayed: number
  shuttleFee: number
  courtFee: number
  totalAmount: number
  paymentStatus: 'paid' | 'unpaid'
  feeDate: string | Date
  paidAt: string | Date | null
  notes: string | null
  createdAt: string | Date
  updatedAt: string | Date
}

type FeeRow = {
  playerId: number
  label: string
  sex: QueuePlayer['sex']
  games: number
  shuttleFee: number
  courtFee: number
  status: 'paid' | 'unpaid'
  playerStatus: 'Playing' | 'Waiting' | 'In Queue' | 'Pending Match'
  isInActiveMatch?: boolean
}

export function QueueSettingsPage() {
  const { user } = useAuthStore()
  const [isEditing, setIsEditing] = useState(false)
  const [feeForm, setFeeForm] = useState<FeeFormState>(initialFeeState)
  const [players, setPlayers] = useState<QueuePlayer[]>([])
  const [paidPlayers, setPaidPlayers] = useState<QueuePlayer[]>([]) // Keep paid players visible in fee management
  const [playersLoading, setPlayersLoading] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState<Record<number, 'paid' | 'unpaid'>>({})
  const [activeMatches, setActiveMatches] = useState<QueueMatch[]>([])
  const [pendingMatches, setPendingMatches] = useState<QueueMatch[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'current' | 'history'>('current')
  const [isSavingToHistory, setIsSavingToHistory] = useState(false)
  const [feeManagementHistory, setFeeManagementHistory] = useState<FeeManagementHistoryRecord[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false)
  const dateDropdownRef = useRef<HTMLDivElement | null>(null)
  const playersRef = useRef<QueuePlayer[]>([])

  // Get today's date in ISO format (YYYY-MM-DD) using local timezone
  // This matches the logic in QueuePlayersPage for consistency
  const getTodayISODate = useCallback(() => {
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }, [])

  const [selectedHistoryDate, setSelectedHistoryDate] = useState<string>(getTodayISODate())
  const sortOptions = [
    { label: 'Player', value: 'label' },
    { label: 'Games', value: 'games' },
    { label: 'Shuttle Fees', value: 'shuttleFee' },
    { label: 'Court Fee', value: 'courtFee' },
    { label: 'Player Status', value: 'playerStatus' },
    { label: 'Status', value: 'status' }
  ] as const
  const [sortBy, setSortBy] = useState<keyof FeeRow | ''>('')
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false)
  const sortMenuRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortMenuRef.current && !sortMenuRef.current.contains(event.target as Node)) {
        setIsSortMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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

  const todayISODate = getTodayISODate()

  // Show players from queue players table AND paid players (no duplicates)
  // Paid players remain visible in fee management even after being removed from queue
  const activePlayers = useMemo(() => {
    // Use a Map to ensure no duplicates by player ID
    const playersMap = new Map<number, QueuePlayer>()
    
    // Add all players from queue (unpaid players)
    players.forEach(player => {
      playersMap.set(player.id, player)
    })
    
    // Add paid players (these were removed from queue but remain in fee management)
    // Only add if not already in the map (avoid duplicates)
    paidPlayers.forEach(player => {
      if (!playersMap.has(player.id)) {
        playersMap.set(player.id, player)
      }
    })
    
    return Array.from(playersMap.values())
  }, [players, paidPlayers])



  // Current fees rows
  const rows = useMemo<FeeRow[]>(() => {
    // Get all player IDs in active matches
    const playersInActiveMatches = new Set<number>()
    activeMatches.forEach((match) => {
      match.teamA.forEach((p) => playersInActiveMatches.add(p.id))
      match.teamB.forEach((p) => playersInActiveMatches.add(p.id))
    })

    // Get all player IDs in pending matches
    const playersInPendingMatches = new Set<number>()
    pendingMatches.forEach((match) => {
      match.teamA.forEach((p) => playersInPendingMatches.add(p.id))
      match.teamB.forEach((p) => playersInPendingMatches.add(p.id))
    })

    return activePlayers.map((player) => {
      let playerStatus: 'Playing' | 'Waiting' | 'In Queue' | 'Pending Match' = 'Waiting'
      
      if (playersInActiveMatches.has(player.id)) {
        playerStatus = 'Playing'
      } else if (playersInPendingMatches.has(player.id)) {
        playerStatus = 'In Queue'
      } else {
        playerStatus = 'Waiting'
      }

      return {
        playerId: player.id,
        label: player.name,
        sex: player.sex,
        games: player.gamesPlayed,
        shuttleFee: player.gamesPlayed * numericDoublesFee,
        courtFee: numericCourtFee,
        status: paymentStatus[player.id] ?? 'unpaid',
        playerStatus,
        isInActiveMatch: playersInActiveMatches.has(player.id)
      }
    })
  }, [activePlayers, numericCourtFee, numericDoublesFee, paymentStatus, activeMatches, pendingMatches])


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
    let filtered = rows
    
    // Apply search filter
    if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase()
      filtered = filtered.filter((row) => row.label.toLowerCase().includes(query))
    }
    
    // Apply sorting
    if (sortBy) {
      filtered = [...filtered].sort((a, b) => {
        let aValue: string | number
        let bValue: string | number
        
        switch (sortBy) {
          case 'label':
            aValue = a.label.toLowerCase()
            bValue = b.label.toLowerCase()
            break
          case 'games':
            aValue = a.games
            bValue = b.games
            break
          case 'shuttleFee':
            aValue = a.shuttleFee
            bValue = b.shuttleFee
            break
          case 'courtFee':
            aValue = a.courtFee
            bValue = b.courtFee
            break
          case 'status':
            aValue = a.status
            bValue = b.status
            break
          case 'playerStatus':
            aValue = a.playerStatus
            bValue = b.playerStatus
            break
          default:
            return 0
        }
        
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return aValue.localeCompare(bValue)
        } else {
          return (aValue as number) - (bValue as number)
        }
      })
    }
    
    return filtered
  }, [rows, searchQuery, sortBy])

  // Filter history by selected date and search query - show all records for the date in one table
  const filteredHistoryByDate = useMemo(() => {
    let filtered = feeManagementHistory

    // Filter by selected date
    if (selectedHistoryDate) {
      filtered = filtered.filter(record => {
        const recordDate = typeof record.feeDate === 'string' 
          ? record.feeDate.slice(0, 10) 
          : new Date(record.feeDate).toISOString().slice(0, 10)
        return recordDate === selectedHistoryDate
      })
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(record => record.playerName.toLowerCase().includes(query))
    }

    // Sort by creation time (most recent first)
    return filtered.sort((a, b) => {
      const timeA = new Date(a.createdAt).getTime()
      const timeB = new Date(b.createdAt).getTime()
      return timeB - timeA
    })
  }, [feeManagementHistory, selectedHistoryDate, searchQuery])

  // Calculate total for all filtered records
  const filteredHistoryTotal = useMemo(() => {
    return filteredHistoryByDate.reduce((sum: number, record: FeeManagementHistoryRecord) => 
      sum + Number(record.shuttleFee) + Number(record.courtFee), 0
    )
  }, [filteredHistoryByDate])

  // Get all unique dates from history records (sorted, most recent first)
  const availableHistoryDates = useMemo(() => {
    const dateSet = new Set<string>()
    feeManagementHistory.forEach(record => {
      const recordDate = typeof record.feeDate === 'string' 
        ? record.feeDate.slice(0, 10) 
        : new Date(record.feeDate).toISOString().slice(0, 10)
      dateSet.add(recordDate)
    })
    return Array.from(dateSet).sort((a, b) => b.localeCompare(a)) // Most recent first
  }, [feeManagementHistory])

  // Set selected date to first available date when history tab is opened or when history loads
  useEffect(() => {
    if (activeTab === 'history' && availableHistoryDates.length > 0) {
      // If current selection doesn't have records, select the first available date
      if (!availableHistoryDates.includes(selectedHistoryDate)) {
        setSelectedHistoryDate(availableHistoryDates[0])
      }
    }
  }, [activeTab, availableHistoryDates, selectedHistoryDate])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      requestAnimationFrame(() => {
        if (dateDropdownRef.current && !dateDropdownRef.current.contains(event.target as Node)) {
          requestAnimationFrame(() => {
            setIsDateDropdownOpen(false)
          })
        }
      })
    }

    document.addEventListener('mousedown', handleClickOutside, true)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside, true)
    }
  }, [])

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

  // Check if all players are paid
  const allPlayersPaid = useMemo(() => {
    return rows.length > 0 && totals.outstanding === 0
  }, [rows.length, totals.outstanding])

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
        : 'All History Batches'
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
        // Calculate total from all filtered records
        const historyTotal = filteredHistoryByDate.reduce((sum: number, record: FeeManagementHistoryRecord) => 
          sum + Number(record.shuttleFee) + Number(record.courtFee), 0
        )
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
        : filteredHistoryByDate.map((record: FeeManagementHistoryRecord) => [
            record.playerName,
            record.playerSex === 'male' ? 'Male' : 'Female',
            record.gamesPlayed.toString(),
            formatCurrency(Number(record.shuttleFee)),
            formatCurrency(Number(record.courtFee)),
            formatCurrency(Number(record.shuttleFee) + Number(record.courtFee)),
            'Paid' // All history records are paid since they can only be saved when all are paid
          ])

      const tableHeaders = activeTab === 'current'
        ? ['Player', 'Gender', 'Games', 'Shuttle Fees', 'Court Fee', 'Total', 'Status']
        : ['Player', 'Gender', 'Games', 'Shuttle Fees', 'Court Fee', 'Total', 'Status']

      // Generate table with adjusted column widths to fit page
      autoTable(doc, {
        head: [tableHeaders],
        body: tableData,
        startY: yPos,
        margin: { left: margin, right: margin },
        styles: {
          fontSize: 8,
          cellPadding: 2,
          overflow: 'linebreak',
          cellWidth: 'wrap'
        },
        headStyles: {
          fillColor: [37, 99, 235], // Blue header
          textColor: 255,
          fontStyle: 'bold',
          halign: 'left',
          fontSize: 8
        },
        columnStyles: activeTab === 'current' 
          ? {
              // Current tab: 7 columns (total: 170 units)
              0: { cellWidth: 40, halign: 'left' }, // Player
              1: { cellWidth: 20, halign: 'center' }, // Gender
              2: { cellWidth: 18, halign: 'center' }, // Games
              3: { cellWidth: 25, halign: 'right' }, // Shuttle Fees
              4: { cellWidth: 22, halign: 'right' }, // Court Fee
              5: { cellWidth: 25, halign: 'right' }, // Total
              6: { cellWidth: 20, halign: 'center' } // Status
            }
          : {
              // History tab: 7 columns (total: 170 units)
              0: { cellWidth: 40, halign: 'left' }, // Player
              1: { cellWidth: 20, halign: 'center' }, // Gender
              2: { cellWidth: 18, halign: 'center' }, // Games
              3: { cellWidth: 25, halign: 'right' }, // Shuttle Fees
              4: { cellWidth: 22, halign: 'right' }, // Court Fee
              5: { cellWidth: 25, halign: 'right' }, // Total
              6: { cellWidth: 20, halign: 'center' } // Status
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
        : todayISODate
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
    filteredRows,
    filteredHistoryByDate,
    searchQuery,
    selectedHistoryDate,
    totals,
    formatCurrency,
    formatDateForPDF
  ])

  const handleTogglePaymentStatus = useCallback(async (playerId: number) => {
    const currentStatus = paymentStatus[playerId] || 'unpaid'
    const newStatus = currentStatus === 'paid' ? 'unpaid' : 'paid'
    
    if (newStatus === 'paid') {
      // Check if player is in an active match
      const playerInActiveMatch = activeMatches.find(match => {
        const allPlayers = [...match.teamA, ...match.teamB]
        return allPlayers.some(p => p.id === playerId)
      })

      if (playerInActiveMatch) {
        toast.error('Cannot mark player as paid while they are playing in an active match.')
        return
      }

      // Check if player is in a pending match
      const playerInPendingMatch = pendingMatches.find(match => {
        const allPlayers = [...match.teamA, ...match.teamB]
        return allPlayers.some(p => p.id === playerId)
      })

      // When marking as paid, delete player from queue but keep in fee management
      const playerToKeep = players.find(p => p.id === playerId)
      
      if (playerToKeep) {
        try {
          // Calculate fees
          const shuttleFee = playerToKeep.gamesPlayed * numericDoublesFee
          const courtFee = numericCourtFee
          const totalAmount = shuttleFee + courtFee

          // Update fee_management database record (or create if doesn't exist)
          try {
            // Get all fee records to check for existing one
            const feeRecords: FeeManagementRecord[] = await apiServices.getFeeManagement()
            const existingRecord = feeRecords.find(r => {
              const recordDate = typeof r.feeDate === 'string' 
                ? r.feeDate.split('T')[0] 
                : new Date(r.feeDate).toISOString().split('T')[0]
              return r.playerId === playerId && recordDate === todayISODate
            })
            
            if (existingRecord) {
              // Update existing record to paid
              await apiServices.updateFeeManagement(existingRecord.id, {
                paymentStatus: 'paid'
              })
            } else {
              // Create new record as paid
              // Note: ensureFeeRecordsExist should have created an unpaid record,
              // but if it didn't, we create one here
              try {
                await apiServices.createFeeManagement({
                  playerId: playerToKeep.id,
                  userId: user?.id ?? null,
                  playerName: playerToKeep.name,
                  playerSex: playerToKeep.sex,
                  gamesPlayed: playerToKeep.gamesPlayed,
                  shuttleFee,
                  courtFee,
                  totalAmount,
                  paymentStatus: 'paid',
                  feeDate: todayISODate,
                  notes: null
                })
              } catch (createError: any) {
                // If creation fails (maybe duplicate), try to find and update
                if (createError?.response?.status === 400 || createError?.response?.status === 409) {
                  // Wait a moment and reload to find the record
                  await new Promise(resolve => setTimeout(resolve, 200))
                  const updatedFeeRecords: FeeManagementRecord[] = await apiServices.getFeeManagement()
                  const foundRecord = updatedFeeRecords.find(r => {
                    const recordDate = typeof r.feeDate === 'string' 
                      ? r.feeDate.split('T')[0] 
                      : new Date(r.feeDate).toISOString().split('T')[0]
                    return r.playerId === playerId && recordDate === todayISODate
                  })
                  
                  if (foundRecord) {
                    await apiServices.updateFeeManagement(foundRecord.id, {
                      paymentStatus: 'paid'
                    })
                  } else {
                    throw createError
                  }
                } else {
                  throw createError
                }
              }
            }
            // The backend will automatically check if all players for this date are paid
            // and move them to history if so
          } catch (feeError: any) {
            console.error('Failed to save fee management record', feeError)
            const errorMessage = feeError?.response?.data?.message || feeError?.message || 'Unknown error'
            console.error('Error details:', errorMessage, feeError?.response?.data)
            toast.error(`Failed to save payment record: ${errorMessage}`)
            return // Don't proceed with deletion if we can't save the record
          }

          // Delete player from backend queue (they're no longer in active queue)
          await apiServices.deleteQueuePlayer(playerId)
          
          // Remove from current players list
          setPlayers(prev => {
            const updated = prev.filter(p => p.id !== playerId)
            playersRef.current = updated // Update ref with latest players
            return updated
          })
          
          // Reload fee management records - this will add the player to paidPlayers
          // so they remain visible in fee management even though removed from queue
          await loadFeeManagementRecords()
          
          // Player is now removed from queue players table but remains visible in fee management

          // If player was in a pending match, check if all players in that match are now paid
          if (playerInPendingMatch) {
            const allMatchPlayerIds = new Set<number>()
            playerInPendingMatch.teamA.forEach(p => allMatchPlayerIds.add(p.id))
            playerInPendingMatch.teamB.forEach(p => allMatchPlayerIds.add(p.id))

            // Create updated payment status that includes the current player being marked as paid
            const updatedPaymentStatus = { ...paymentStatus, [playerId]: 'paid' as const }

            // Check if all players in the match are now marked as paid
            const allPlayersPaid = Array.from(allMatchPlayerIds).every(id => {
              // Player is considered paid if they are in the updated payment status as paid
              return updatedPaymentStatus[id] === 'paid'
            })

            if (allPlayersPaid) {
              // All players are paid, cancel the match (it will be removed from pending)
              try {
                await apiServices.cancelQueueMatch(playerInPendingMatch.id)
                toast.success(`${playerToKeep.name} marked as paid. All players in match are paid - match removed.`)
                // Reload matches to reflect the change
                await loadMatches()
              } catch (error) {
                console.error('Failed to remove match after all players paid', error)
                toast.success(`${playerToKeep.name} marked as paid.`)
              }
            } else {
              toast.success(`${playerToKeep.name} marked as paid and removed from queue.`)
            }
          } else {
            toast.success(`${playerToKeep.name} marked as paid and removed from queue.`)
          }

          // Reload matches to update the lists
          await loadMatches()
        } catch (error) {
          console.error('Failed to delete player when marking as paid', error)
          toast.error('Failed to mark player as paid. Please try again.')
        }
      }
    } else {
          // When marking as unpaid, restore player to queue and update fee management
      try {
        // Find the player record from current players, paid players, or fee management
        let playerRecord = players.find(p => p.id === playerId) || paidPlayers.find(p => p.id === playerId)
        
        // If not found in current players or paid players, try to get from fee management
        if (!playerRecord) {
          const feeRecords: FeeManagementRecord[] = await apiServices.getFeeManagement()
          const feeRecord = feeRecords.find(r => r.playerId === playerId)
          if (feeRecord) {
            // Create a player object from fee record
            playerRecord = {
              id: feeRecord.playerId,
              name: feeRecord.playerName,
              sex: feeRecord.playerSex,
              skill: 'Intermediate' as const,
              gamesPlayed: feeRecord.gamesPlayed,
              status: 'In Queue' as const,
              createdAt: typeof feeRecord.createdAt === 'string' ? feeRecord.createdAt : feeRecord.createdAt.toISOString(),
              updatedAt: typeof feeRecord.updatedAt === 'string' ? feeRecord.updatedAt : feeRecord.updatedAt.toISOString(),
              lastPlayed: typeof feeRecord.feeDate === 'string' ? feeRecord.feeDate : feeRecord.feeDate.toISOString().split('T')[0]
            }
          }
        }
        
        if (playerRecord) {
          // Update fee management record to unpaid
          const feeRecords: FeeManagementRecord[] = await apiServices.getFeeManagement()
          const existingRecord = feeRecords.find(r => {
            const recordDate = typeof r.feeDate === 'string' 
              ? r.feeDate.split('T')[0] 
              : new Date(r.feeDate).toISOString().split('T')[0]
            return r.playerId === playerId && recordDate === todayISODate
          })

          if (existingRecord) {
            // Update fee management record to unpaid
            await apiServices.updateFeeManagement(existingRecord.id, {
              paymentStatus: 'unpaid'
            })
          }

          // Re-add player to queue players page
          // Check if player already exists in queue
          const existingInQueue = players.find(p => p.id === playerId)
          
          if (!existingInQueue) {
            // Player doesn't exist in queue, create them
            // Try to get skill from playerRecord, or look up from history, or default to Intermediate
            let playerSkill: 'Beginner' | 'Intermediate' | 'Advanced' = 'Intermediate'
            
            if ('skill' in playerRecord && playerRecord.skill) {
              playerSkill = playerRecord.skill as 'Beginner' | 'Intermediate' | 'Advanced'
            } else {
              // Try to find skill from queue players history
              try {
                const historyPlayers = await apiServices.getQueuePlayersHistory()
                const historyPlayer = historyPlayers.find((hp: any) => hp.originalId === playerId || hp.name === playerRecord?.name)
                if (historyPlayer) {
                  playerSkill = historyPlayer.skill
                }
              } catch (error) {
                // If history lookup fails, use default
                console.debug('Could not lookup player skill from history, using default')
              }
            }
            
            await apiServices.createQueuePlayer({
              name: playerRecord.name,
              sex: playerRecord.sex,
              skill: playerSkill,
              status: 'In Queue',
              lastPlayed: todayISODate
            })
            
            // Reload players to include the restored player
            await loadPlayers()
            // Note: loadPlayers will update playersRef.current
          }

          // Update payment status
          setPaymentStatus(prev => ({
            ...prev,
            [playerId]: 'unpaid'
          }))

          // Remove from paid players list since they're now unpaid
          setPaidPlayers(prev => prev.filter(p => p.id !== playerId))

          // Reload fee management records to reflect the change
          await loadFeeManagementRecords()

          toast.success(`${playerRecord.name} marked as unpaid and restored to queue.`)
        } else {
          // Player record not found, just update status
          setPaymentStatus(prev => ({
            ...prev,
            [playerId]: 'unpaid'
          }))
          toast.success('Player marked as unpaid.')
        }
      } catch (error) {
        console.error('Failed to mark player as unpaid', error)
        toast.error('Failed to mark player as unpaid. Please try again.')
      }
    }
  }, [paymentStatus, players, activeMatches, pendingMatches, paidPlayers, numericDoublesFee, numericCourtFee, todayISODate, user?.id])

  const loadFeeManagementRecords = useCallback(async () => {
    try {
      // Load all fee management records (both paid and unpaid)
      // Only records that are moved to history will be removed
      const feeRecords: FeeManagementRecord[] = await apiServices.getFeeManagement()
      
      // Filter to only today's records to show in current fees
      const todayRecords = feeRecords.filter(record => {
        const recordDate = typeof record.feeDate === 'string' 
          ? record.feeDate.split('T')[0] 
          : new Date(record.feeDate).toISOString().split('T')[0]
        return recordDate === todayISODate
      })
      
      // Set payment status and store paid players separately
      const feePaymentStatus: Record<number, 'paid' | 'unpaid'> = {}
      const paidPlayersList: QueuePlayer[] = []
      
      // Use ref to get current players state (avoids closure issues)
      const currentPlayers = playersRef.current
      
      todayRecords.forEach((record) => {
        feePaymentStatus[record.playerId] = record.paymentStatus
        
        // If player is paid, add them to paid players list (they may not be in queue anymore)
        if (record.paymentStatus === 'paid') {
          // Check if player is already in current players list
          const inCurrentPlayers = currentPlayers.find(p => p.id === record.playerId)
          
          // Only add to paid players if they're not in current players (they were removed from queue)
          if (!inCurrentPlayers) {
            paidPlayersList.push({
              id: record.playerId,
              name: record.playerName,
              sex: record.playerSex,
              skill: 'Intermediate' as const, // Default since not stored in fee management
              gamesPlayed: record.gamesPlayed,
              status: 'Waiting' as const,
              createdAt: typeof record.createdAt === 'string' ? record.createdAt : record.createdAt.toISOString(),
              updatedAt: typeof record.updatedAt === 'string' ? record.updatedAt : record.updatedAt.toISOString(),
              lastPlayed: typeof record.feeDate === 'string' ? record.feeDate : record.feeDate.toISOString().split('T')[0]
            })
          }
        }
      })
      
      // Update payment status and paid players
      setPaidPlayers(paidPlayersList)
      setPaymentStatus((prev) => ({
        ...prev,
        ...feePaymentStatus
      }))
    } catch (error) {
      console.error('Failed to load fee management records', error)
      // Don't show error toast - it's okay if there are no records yet
    }
  }, [todayISODate])

  // Create fee management records for unpaid players if they don't exist
  const ensureFeeRecordsExist = useCallback(async (playersList: QueuePlayer[]) => {
    try {
      const feeRecords: FeeManagementRecord[] = await apiServices.getFeeManagement()
      const existingPlayerIds = new Set(feeRecords.map(r => r.playerId))
      
      // Create unpaid fee records for players that don't have them yet
      const playersNeedingRecords = playersList.filter(player => !existingPlayerIds.has(player.id))
      
      if (playersNeedingRecords.length > 0) {
        await Promise.all(
          playersNeedingRecords.map(async (player) => {
            try {
              const shuttleFee = player.gamesPlayed * numericDoublesFee
              const courtFee = numericCourtFee
              const totalAmount = shuttleFee + courtFee
              
              await apiServices.createFeeManagement({
                playerId: player.id,
                userId: user?.id ?? null,
                playerName: player.name,
                playerSex: player.sex,
                gamesPlayed: player.gamesPlayed,
                shuttleFee,
                courtFee,
                totalAmount,
                paymentStatus: 'unpaid',
                feeDate: todayISODate,
                notes: null
              })
            } catch (error) {
              // Ignore errors for individual records (might already exist)
              console.debug(`Fee record may already exist for player ${player.id}`)
            }
          })
        )
      }
    } catch (error) {
      console.error('Failed to ensure fee records exist', error)
      // Don't show error - this is a background operation
    }
  }, [numericDoublesFee, numericCourtFee, todayISODate, user?.id])

  const loadPlayers = useCallback(async () => {
    setPlayersLoading(true)
    try {
      const playersResponse = await apiServices.getQueuePlayers()
      
      // Load fee management records first
      await loadFeeManagementRecords()
      
      // Ensure all current players have fee records (create unpaid ones if missing)
      await ensureFeeRecordsExist(playersResponse)
      
      // Reload fee management records after creating missing ones
      await loadFeeManagementRecords()
      
      setPlayers(playersResponse)
      playersRef.current = playersResponse // Update ref with latest players
      setPaymentStatus((prev) => {
        const next: Record<number, 'paid' | 'unpaid'> = { ...prev }
        playersResponse.forEach((player) => {
          // Only set to unpaid if not already set from fee management records
          if (next[player.id] === undefined) {
            next[player.id] = 'unpaid'
          }
        })
        return next
      })
    } catch (error) {
      console.error('Failed to load queue players for fee management', error)
      toast.error('Failed to load current players')
    } finally {
      setPlayersLoading(false)
    }
  }, [loadFeeManagementRecords, ensureFeeRecordsExist])

  const loadMatches = useCallback(async () => {
    try {
      const [activeResponse, pendingResponse] = await Promise.all([
        apiServices.getQueueMatches({ status: 'active' }),
        apiServices.getQueueMatches({ status: 'pending' })
      ])
      setActiveMatches(activeResponse)
      setPendingMatches(pendingResponse)
    } catch (error) {
      console.error('Failed to load matches for fee management', error)
    }
  }, [])

  // Load fee management history
  const loadFeeManagementHistory = useCallback(async () => {
    setHistoryLoading(true)
    try {
      const historyRecords: FeeManagementHistoryRecord[] = await apiServices.getFeeManagementHistory()
      setFeeManagementHistory(historyRecords)
    } catch (error) {
      console.error('Failed to load fee management history', error)
      toast.error('Failed to load fee management history')
    } finally {
      setHistoryLoading(false)
    }
  }, [])

  // Save all fee management records to history
  const handleSaveAllToHistory = useCallback(async () => {
    if (!allPlayersPaid || isSavingToHistory) return

    setIsSavingToHistory(true)
    try {
      const result = await apiServices.saveAllFeeManagementToHistory(todayISODate)
      toast.success(result.message || `Successfully saved ${result.movedCount || 0} record(s) to history.`)
      // Reload players and fee management records to reflect changes
      await loadPlayers()
      await loadFeeManagementRecords()
      // Reload history to show newly saved records
      await loadFeeManagementHistory()
    } catch (error: any) {
      console.error('Failed to save to history', error)
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to save to history. Please try again.'
      toast.error(errorMessage)
    } finally {
      setIsSavingToHistory(false)
    }
  }, [allPlayersPaid, isSavingToHistory, todayISODate, loadPlayers, loadFeeManagementRecords, loadFeeManagementHistory])

  // Load history when switching to history tab
  useEffect(() => {
    if (activeTab === 'history') {
      void loadFeeManagementHistory()
    } else {
      // Close dropdown when switching away from history tab
      setIsDateDropdownOpen(false)
    }
  }, [activeTab, loadFeeManagementHistory])

  useEffect(() => {
    void loadPlayers()
    void loadMatches()
    // Also load fee management records separately to ensure we get all paid players
    void loadFeeManagementRecords()
  }, [loadPlayers, loadMatches, loadFeeManagementRecords])

  return (
    <QueueingShell activeTab="settings">
      <section className="rounded-2xl sm:rounded-3xl border border-white/10 bg-white/[0.05] text-white shadow-2xl shadow-black/30 backdrop-blur-lg">
        <div className="space-y-4 sm:space-y-5 md:space-y-6 px-3 sm:px-4 md:px-6 py-4 sm:py-5 md:py-6">
          {isEditing ? (
            <div className="space-y-4 sm:space-y-5 md:space-y-6">
              <div className="flex flex-col gap-2 sm:gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-base sm:text-lg font-semibold">Fee Configuration</h2>
              </div>

              <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2">
                <div className="flex flex-col gap-1.5 sm:gap-2">
                  <label className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-white/80">
                    Doubles Player Shuttle Fee
                  </label>
                  <div className="rounded-lg sm:rounded-xl border border-white/25 bg-white/80 px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-slate-900 shadow-inner">
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

                <div className="flex flex-col gap-1.5 sm:gap-2">
                  <label className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-white/80">
                    Court Fee per Player
                  </label>
                  <div className="rounded-lg sm:rounded-xl border border-white/25 bg-white/80 px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-slate-900 shadow-inner">
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

              <div className="flex flex-col gap-1.5 sm:gap-2">
                <label className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-white/80">Select Currency</label>
                <select
                  name="currency"
                  value={feeForm.currency}
                  onChange={handleInputChange}
                  className="rounded-lg sm:rounded-xl border border-white/25 bg-white/80 px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-slate-900 outline-none transition focus:border-white/40"
                >
                  <option value="PHP (₱)">PHP (₱)</option>
                  <option value="USD ($)">USD ($)</option>
                  <option value="EUR (€)">EUR (€)</option>
                </select>
              </div>

              <p className="text-[10px] sm:text-xs text-white/70">Flat fee per player for unlimited play.</p>

              <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 sm:items-center sm:justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setFeeForm(initialFeeState)
                    setIsEditing(false)
                  }}
                  className="rounded-md border border-white/40 px-4 sm:px-5 py-2 text-xs font-semibold text-white/80 transition hover:bg-white/20 w-full sm:w-auto"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false)
                    toast.success('Fee configuration saved successfully!')
                  }}
                  className="rounded-md bg-emerald-500 px-4 sm:px-5 py-2 text-xs font-semibold text-white shadow-lg shadow-emerald-500/40 transition hover:bg-emerald-600 w-full sm:w-auto"
                >
                  Save Changes
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2.5 sm:space-y-3">
              <div className="mb-3 sm:mb-4 flex flex-col gap-2 sm:gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-base sm:text-lg font-semibold">Fee Configuration</h2>
                <button
                  className="rounded-md bg-blue-500 px-3 sm:px-4 py-1.5 sm:py-2 text-xs font-semibold text-white shadow-lg shadow-blue-500/30 transition hover:bg-blue-600 w-full sm:w-auto"
                  onClick={() => setIsEditing(true)}
                >
                  Edit fees
                </button>
              </div>
              <div className="overflow-hidden rounded-2xl sm:rounded-3xl border border-white/10 bg-white/[0.07]">
                <div className="border-b border-white/18 bg-[#14070e] px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-white">
                  Doubles Player Shuttle Fee
                  <p className="mt-1 text-sm sm:text-base text-white">{displayValue(feeForm.doublesFee)}</p>
                </div>
                <div className="border-b border-white/18 bg-[#14070e] px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-white">
                  Court Fee per Player
                  <p className="mt-1 text-sm sm:text-base text-white">{displayValue(feeForm.courtFee)}</p>
                </div>
                <div className="bg-[#14070e] px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-white/85">
                  Billing Currency
                  <p className="mt-1 text-sm sm:text-base text-white">{feeForm.currency}</p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3 sm:space-y-4 rounded-xl sm:rounded-2xl border border-white/15 bg-white/15 px-3 sm:px-4 md:px-5 py-3 sm:py-4 text-xs sm:text-sm text-white">
            <div className="flex flex-col gap-2 sm:gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-sm sm:text-base font-semibold">Fee Management</h3>
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                {activeTab === 'current' && (
                  <span className="rounded-full border border-white/15 px-2 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-[11px] text-white/70 whitespace-nowrap">
                    Active players: {rows.length}
                  </span>
                )}
                {activeTab === 'current' && (
                  <button
                    type="button"
                    onClick={handleSaveAllToHistory}
                    disabled={!allPlayersPaid || isSavingToHistory || playersLoading || rows.length === 0}
                    className="rounded-md bg-emerald-500 px-2.5 sm:px-3 py-1.5 sm:py-2 text-[10px] sm:text-xs font-semibold text-white shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50 whitespace-nowrap"
                    title={!allPlayersPaid && rows.length > 0 ? 'All players must be marked as paid before saving to history' : ''}
                  >
                    {isSavingToHistory ? 'Saving...' : 'Save to History'}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => void loadPlayers()}
                  className="rounded-md border border-white/20 px-2.5 sm:px-3 py-1.5 sm:py-2 text-[10px] sm:text-xs font-semibold text-white/80 transition hover:bg-white/10 whitespace-nowrap"
                >
                  Refresh
                </button>
                <button
                  type="button"
                  onClick={handleExportPDF}
                  disabled={(activeTab === 'current' && (playersLoading || filteredRows.length === 0)) || (activeTab === 'history' && (historyLoading || filteredHistoryByDate.length === 0))}
                  className="rounded-md bg-blue-500 px-2.5 sm:px-3 py-1.5 sm:py-2 text-[10px] sm:text-xs font-semibold text-white shadow-lg shadow-blue-500/30 transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50 whitespace-nowrap"
                >
                  Export
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 sm:gap-2 border-b border-white/10">
              <button
                type="button"
                onClick={() => setActiveTab('current')}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 text-[10px] sm:text-xs font-semibold uppercase tracking-wide transition ${
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
                className={`px-3 sm:px-4 py-1.5 sm:py-2 text-[10px] sm:text-xs font-semibold uppercase tracking-wide transition ${
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
              <div className="grid gap-2.5 sm:gap-3 grid-cols-1 sm:grid-cols-2">
                <div className="rounded-lg sm:rounded-xl bg-emerald-100/90 px-3 sm:px-4 py-2.5 sm:py-3 text-emerald-700">
                  <p className="text-[10px] sm:text-xs uppercase tracking-wide">Collected</p>
                  <p className="mt-1 text-lg sm:text-xl font-semibold">{formatCurrency(totals.collected)}</p>
                </div>
                <div className="rounded-lg sm:rounded-xl bg-amber-100/90 px-3 sm:px-4 py-2.5 sm:py-3 text-amber-700">
                  <p className="text-[10px] sm:text-xs uppercase tracking-wide">Unpaids</p>
                  <p className="mt-1 text-lg sm:text-xl font-semibold">{formatCurrency(totals.outstanding)}</p>
                </div>
              </div>
            )}

            {/* Search and Date Filter */}
            <div className="flex flex-col gap-2 sm:gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col sm:flex-row flex-1 gap-2 sm:gap-3">
                <input
                  type="text"
                  placeholder="Search players..."
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="w-full sm:max-w-xs rounded-lg sm:rounded-xl border border-white/20 bg-white/20 px-3 sm:px-4 py-1.5 sm:py-2 text-[10px] sm:text-xs text-white placeholder:text-white/60 outline-none transition focus:border-white/40 focus:bg-white/25"
                />
                {activeTab === 'history' && availableHistoryDates.length > 0 && (
                  <div className="relative" ref={dateDropdownRef}>
                    <button
                      type="button"
                      onClick={() => setIsDateDropdownOpen((prev) => !prev)}
                      className="flex w-full sm:w-auto items-center justify-between gap-2 sm:gap-3 rounded-xl sm:rounded-2xl border border-white/10 bg-gradient-to-r from-[#14070e]/90 to-[#14070e]/70 px-3 sm:px-4 py-2.5 sm:py-3 text-left text-white shadow-[0_18px_35px_rgba(5,5,32,0.35)] outline-none transition hover:border-white/30 focus-visible:ring-2 focus-visible:ring-[#5560ff]/50 sm:min-w-[200px]"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.2em] sm:tracking-[0.3em] text-white/40">Date</p>
                        <p className="text-xs sm:text-sm font-semibold text-white truncate">
                          {selectedHistoryDate ? formatDateForDropdown(selectedHistoryDate) : 'Select date'}
                        </p>
                      </div>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className={`h-4 w-4 sm:h-5 sm:w-5 text-white/70 transition-transform flex-shrink-0 ${isDateDropdownOpen ? 'rotate-180' : ''}`}
                      >
                        <path d="m6 9 6 6 6-6" />
                      </svg>
                    </button>

                    {isDateDropdownOpen && (
                      <div className="absolute left-0 right-0 sm:right-auto sm:left-0 z-20 mt-2 sm:mt-3 w-full sm:w-auto sm:min-w-[200px] overflow-hidden rounded-xl sm:rounded-2xl border border-white/10 bg-[#11142b]/95 shadow-[0_25px_50px_rgba(0,0,0,0.5)] backdrop-blur-xl">
                        <div className="max-h-[50vh] sm:max-h-[300px] overflow-y-auto divide-y divide-white/5">
                          {availableHistoryDates.map((date) => {
                            const isActive = date === selectedHistoryDate
                            return (
                              <button
                                key={`history-date-${date}`}
                                type="button"
                                onClick={() => {
                                  setSelectedHistoryDate(date)
                                  setIsDateDropdownOpen(false)
                                }}
                                className={`flex w-full items-center justify-between px-4 sm:px-5 py-2.5 sm:py-3 text-left text-xs sm:text-sm font-medium transition ${
                                  isActive
                                    ? 'bg-[#273373]/60 text-white'
                                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                                }`}
                              >
                                <span className="truncate">{formatDateForDropdown(date)}</span>
                                {isActive && (
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                    className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#8ea2ff] flex-shrink-0 ml-2"
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
            <div className="overflow-hidden rounded-2xl sm:rounded-3xl border border-white/10 bg-white/[0.07]">
              <div className="overflow-x-auto">
                {activeTab === 'current' ? (
                  // Current Fees Table
                  <table className="min-w-full divide-y divide-white/10 text-xs sm:text-sm text-white/80">
                    <thead className="border-b border-white/18 bg-[#14070e] uppercase tracking-wide text-white/60">
                      <tr>
                        <th className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-center font-semibold">
                          <div ref={sortMenuRef} className="relative flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => setIsSortMenuOpen((prev) => !prev)}
                              className={`rounded-full border border-white/10 bg-white/5 p-1 sm:p-1.5 text-white/70 transition hover:border-white/30 hover:text-white ${isSortMenuOpen ? 'border-white/40 text-white' : ''}`}
                              aria-haspopup="listbox"
                              aria-expanded={isSortMenuOpen}
                              aria-label="Sort by column"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5 sm:h-4 sm:w-4">
                                <path d="M2.75 5.5a.75.75 0 01.75-.75h13a.75.75 0 010 1.5h-13a.75.75 0 01-.75-.75zM5 10a.75.75 0 01.75-.75h9.5a.75.75 0 010 1.5h-9.5A.75.75 0 015 10zm3 4.5a.75.75 0 01.75-.75h6.5a.75.75 0 010 1.5h-6.5A.75.75 0 018 14.5z" />
                              </svg>
                            </button>
                            <span className={`text-[10px] sm:text-xs ${sortBy === 'label' ? 'text-white' : 'text-white/80'}`}>Player</span>
                            {isSortMenuOpen && (
                              <div className="absolute left-0 top-full z-30 mt-2 sm:mt-3 w-44 sm:w-48 overflow-hidden rounded-xl sm:rounded-2xl border border-white/10 bg-slate-950/95 shadow-2xl shadow-black/40 backdrop-blur">
                                <ul className="max-h-64 overflow-y-auto py-1 sm:py-2" role="listbox">
                                  {sortOptions.map((option) => {
                                    const isActive = sortBy === option.value
                                    return (
                                      <li key={option.value}>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setSortBy(option.value as keyof FeeRow)
                                            setIsSortMenuOpen(false)
                                          }}
                                          className={`flex w-full items-center justify-between gap-2 sm:gap-3 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm transition ${
                                            isActive
                                              ? 'bg-indigo-500/90 text-white shadow-[0_15px_25px_rgba(99,102,241,0.35)]'
                                              : 'text-white/75 hover:bg-white/10 hover:text-white'
                                          }`}
                                          role="option"
                                          aria-selected={isActive}
                                        >
                                          <span className="truncate text-left">{option.label}</span>
                                          {isActive && (
                                            <svg
                                              xmlns="http://www.w3.org/2000/svg"
                                              viewBox="0 0 20 20"
                                              fill="currentColor"
                                              className="h-4 w-4 shrink-0 text-white"
                                            >
                                              <path
                                                fillRule="evenodd"
                                                d="M16.704 5.29a1 1 0 010 1.42l-7.25 7.24a1 1 0 01-1.414 0l-3.25-3.24a1 1 0 011.414-1.42L8.75 11.59l6.543-6.3a1 1 0 011.411 0z"
                                                clipRule="evenodd"
                                              />
                                            </svg>
                                          )}
                                        </button>
                                      </li>
                                    )
                                  })}
                                </ul>
                              </div>
                            )}
                          </div>
                        </th>
                        <th className={`px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-center font-semibold text-[10px] sm:text-xs ${sortBy === 'games' ? 'text-white' : ''}`}>Games</th>
                        <th className={`px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-center font-semibold text-[10px] sm:text-xs ${sortBy === 'shuttleFee' ? 'text-white' : ''}`}>Shuttle Fees</th>
                        <th className={`px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-center font-semibold text-[10px] sm:text-xs ${sortBy === 'courtFee' ? 'text-white' : ''}`}>Court Fee</th>
                        <th className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-center font-semibold text-[10px] sm:text-xs">Total</th>
                        <th className={`px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-center font-semibold text-[10px] sm:text-xs ${sortBy === 'playerStatus' ? 'text-white' : ''}`}>Player Status</th>
                        <th className={`px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-center font-semibold text-[10px] sm:text-xs ${sortBy === 'status' ? 'text-white' : ''}`}>Status</th>
                        <th className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-right font-semibold text-[10px] sm:text-xs">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {playersLoading ? (
                        <tr>
                          <td colSpan={8} className="px-3 sm:px-4 md:px-6 py-4 sm:py-6 text-center text-xs sm:text-sm text-white/60">
                            Loading players...
                          </td>
                        </tr>
                      ) : filteredRows.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="px-3 sm:px-4 md:px-6 py-4 sm:py-6 text-center text-xs sm:text-sm text-white/60">
                            {rows.length === 0 ? 'No active players found.' : 'No players match the current search.'}
                          </td>
                        </tr>
                      ) : (
                        filteredRows.map((row) => (
                          <tr key={row.label} className="border-b border-white/18 bg-[#14070e] transition-colors hover:bg-[#1a0a12]">
                            <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 font-semibold text-white text-center">
                              <div className="flex items-center justify-center gap-2 sm:gap-3">
                                <span
                                  className={`inline-flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full bg-white/10 text-xs sm:text-sm shadow-inner flex-shrink-0 ${
                                    row.sex === 'male' ? 'text-sky-300 bg-sky-500/15' : 'text-pink-300 bg-pink-500/15'
                                  }`}
                                  aria-label={row.sex === 'male' ? 'Male player' : 'Female player'}
                                  title={row.sex === 'male' ? 'Male player' : 'Female player'}
                                >
                                  {row.sex === 'male' ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3 sm:h-4 sm:w-4">
                                      <path d="M13.5 2a.75.75 0 000 1.5h1.69l-3.2 3.2a4.5 4.5 0 10.884.884l3.2-3.2V6.5a.75.75 0 001.5 0V2.75A.75.75 0 0016.75 2H13.5zm-4 5a3 3 0 110 6 3 3 0 010-6z" />
                                    </svg>
                                  ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3 sm:h-4 sm:w-4">
                                      <path d="M10 2a4.5 4.5 0 10.878 8.9l-.378.378H8.75a.75.75 0 000 1.5h1.25v1.25a.75.75 0 001.5 0V12.78l.378-.378A4.5 4.5 0 0010 2zm0 1.5a3 3 0 110 6 3 3 0 010-6z" />
                                    </svg>
                                  )}
                                </span>
                                <span className="truncate text-xs sm:text-sm">{row.label}</span>
                              </div>
                            </td>
                            <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-center text-xs sm:text-sm">{row.games}</td>
                            <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-center text-xs sm:text-sm">{formatCurrency(row.shuttleFee)}</td>
                            <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-center text-xs sm:text-sm">{formatCurrency(row.courtFee)}</td>
                            <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-center font-semibold text-xs sm:text-sm">{formatCurrency(row.shuttleFee + row.courtFee)}</td>
                            <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-center">
                              <span className={`inline-flex rounded-full px-2 sm:px-3 py-0.5 sm:py-1 text-[9px] sm:text-xs font-semibold uppercase tracking-wide ${
                                row.playerStatus === 'Playing' 
                                  ? 'border border-blue-400/60 bg-blue-500/15 text-blue-200'
                                  : row.playerStatus === 'In Queue'
                                  ? 'border border-purple-400/60 bg-purple-500/15 text-purple-200'
                                  : row.playerStatus === 'Waiting'
                                  ? 'border border-yellow-400/60 bg-yellow-500/15 text-yellow-200'
                                  : 'border border-gray-400/60 bg-gray-500/15 text-gray-200'
                              }`}>
                                {row.playerStatus}
                              </span>
                            </td>
                            <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-center">
                              {row.status === 'paid' ? (
                                <span className="inline-flex rounded-full px-2 sm:px-3 py-0.5 sm:py-1 text-[9px] sm:text-xs font-semibold uppercase tracking-wide border border-emerald-400/60 bg-emerald-500/15 text-emerald-200">
                                  Paid
                                </span>
                              ) : (
                                <span className="inline-flex rounded-full px-2 sm:px-3 py-0.5 sm:py-1 text-[9px] sm:text-xs font-semibold uppercase tracking-wide border border-amber-400/60 bg-amber-500/10 text-amber-200">
                                  Unpaid
                                </span>
                              )}
                            </td>
                            <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-center">
                              <div className="flex justify-center gap-1.5 sm:gap-2">
                                {row.status === 'paid' ? (
                                  <button
                                    type="button"
                                    onClick={() => handleTogglePaymentStatus(row.playerId)}
                                    className="rounded-full border border-white/20 bg-white/10 px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-white/80 transition hover:border-blue-300 hover:bg-blue-500/20 hover:text-blue-100 whitespace-nowrap text-center"
                                  >
                                    Mark Unpaid
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleTogglePaymentStatus(row.playerId)}
                                    disabled={row.isInActiveMatch}
                                    className="rounded-full border border-white/20 bg-white/10 px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-white/80 transition hover:border-emerald-300 hover:bg-emerald-500/20 hover:text-emerald-100 whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-white/20 disabled:hover:bg-white/10 disabled:hover:text-white/80 text-center"
                                    title={row.isInActiveMatch ? 'Cannot mark as paid while player is in an active match' : ''}
                                  >
                                    Set Paid
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                ) : (
                  // History - Show all records for selected date in one table
                  <div>
                    {historyLoading ? (
                      <div className="px-3 sm:px-4 md:px-6 py-4 sm:py-6 text-center text-xs sm:text-sm text-white/60">
                        Loading history...
                      </div>
                    ) : filteredHistoryByDate.length === 0 ? (
                      <div className="px-3 sm:px-4 md:px-6 py-4 sm:py-6 text-center text-xs sm:text-sm text-white/60">
                        {feeManagementHistory.length === 0 ? 'No fee history recorded yet.' : 'No records match the selected date and search.'}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between px-3 sm:px-4 py-2 bg-white/5 border-b border-white/10">
                          <h3 className="text-xs sm:text-sm font-semibold text-white/80">
                            {formatDateForDropdown(selectedHistoryDate)}
                          </h3>
                          <span className="text-xs sm:text-sm font-semibold text-white/60">
                            Total: {formatCurrency(filteredHistoryTotal)}
                          </span>
                        </div>
                        <table className="min-w-full divide-y divide-white/10 text-xs sm:text-sm text-white/80">
                          <thead className="border-b border-white/18 bg-[#14070e] uppercase tracking-wide text-white/60">
                            <tr>
                              <th className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-left font-semibold text-[10px] sm:text-xs">PLAYER</th>
                              <th className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-center font-semibold text-[10px] sm:text-xs">GAMES</th>
                              <th className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-center font-semibold text-[10px] sm:text-xs">SHUTTLE FEES</th>
                              <th className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-center font-semibold text-[10px] sm:text-xs">COURT FEE</th>
                              <th className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-center font-semibold text-[10px] sm:text-xs">TOTAL</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredHistoryByDate.map((record: FeeManagementHistoryRecord) => (
                              <tr key={`history-${record.id}`} className="border-b border-white/18 bg-[#14070e] transition-colors hover:bg-[#1a0a12]">
                                <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 font-semibold text-white">
                                  <div className="flex items-center gap-2 sm:gap-3">
                                    <span
                                      className={`inline-flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full bg-white/10 text-xs sm:text-sm shadow-inner flex-shrink-0 ${
                                        record.playerSex === 'male' ? 'text-sky-300 bg-sky-500/15' : 'text-pink-300 bg-pink-500/15'
                                      }`}
                                      aria-label={record.playerSex === 'male' ? 'Male player' : 'Female player'}
                                      title={record.playerSex === 'male' ? 'Male player' : 'Female player'}
                                    >
                                      {record.playerSex === 'male' ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3 sm:h-4 sm:w-4">
                                          <path d="M13.5 2a.75.75 0 000 1.5h1.69l-3.2 3.2a4.5 4.5 0 10.884.884l3.2-3.2V6.5a.75.75 0 001.5 0V2.75A.75.75 0 0016.75 2H13.5zm-4 5a3 3 0 110 6 3 3 0 010-6z" />
                                        </svg>
                                      ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3 sm:h-4 sm:w-4">
                                          <path d="M10 2a4.5 4.5 0 10.878 8.9l-.378.378H8.75a.75.75 0 000 1.5h1.25v1.25a.75.75 0 001.5 0V12.78l.378-.378A4.5 4.5 0 0010 2zm0 1.5a3 3 0 110 6 3 3 0 010-6z" />
                                        </svg>
                                      )}
                                    </span>
                                    <span className="truncate text-xs sm:text-sm">{record.playerName}</span>
                                  </div>
                                </td>
                                <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-center text-xs sm:text-sm">{record.gamesPlayed}</td>
                                <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-center text-xs sm:text-sm">{formatCurrency(Number(record.shuttleFee))}</td>
                                <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-center text-xs sm:text-sm">{formatCurrency(Number(record.courtFee))}</td>
                                <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-center font-semibold text-xs sm:text-sm">{formatCurrency(Number(record.shuttleFee) + Number(record.courtFee))}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </QueueingShell>
  )
}


