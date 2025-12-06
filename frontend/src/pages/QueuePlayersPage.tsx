import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { QueueingShell } from '@/components/QueueingShell'
import { apiServices, QueueMatchGameType, QueuePlayer, QueueMatch, QueuePlayerHistory } from '@/lib/apiServices'
import toast from 'react-hot-toast'

interface DropdownOption {
  label: string
  value: string
}

interface DropdownFieldProps {
  label: string
  options: DropdownOption[]
  value: string
  onChange: (value: string) => void
  className?: string
}

function DropdownField({ label, options, value, onChange, className }: DropdownFieldProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const selectedOption = options.find((option) => option.value === value) ?? options[0]

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const containerClasses = [
    'relative',
    'w-full',
    'flex-1',
    'sm:flex-none',
    'text-left',
    className ?? 'max-w-xs sm:w-64'
  ]

  return (
    <div ref={containerRef} className={containerClasses.join(' ')}>
      <label className="mb-1 block text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-white/60">{label}</label>
      <button
        type="button"
        className="flex w-full items-center justify-between rounded-full border border-white/10 bg-white/5 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium text-white outline-none transition focus:border-white/30 focus:bg-white/10"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <span className="truncate">{selectedOption?.label}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className={`h-4 w-4 sm:h-5 sm:w-5 text-white/70 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 10.998l3.71-3.77a.75.75 0 011.08 1.04l-4.25 4.32a.75.75 0 01-1.08 0l-4.25-4.32a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border border-white/10 bg-slate-950/95 shadow-2xl shadow-black/30 backdrop-blur">
          <ul className="max-h-56 overflow-y-auto py-2">
            {options.map((option) => {
              const isActive = option.value === selectedOption?.value
              return (
                <li key={option.value}>
                  <button
                    type="button"
                    className={`flex w-full items-center justify-between px-4 py-2 text-sm transition ${
                      isActive
                        ? 'bg-indigo-500/90 text-white shadow-[0_12px_20px_rgba(99,102,241,0.35)]'
                        : 'text-white/80 hover:bg-white/10 hover:text-white'
                    }`}
                    onClick={() => {
                      onChange(option.value)
                      setIsOpen(false)
                    }}
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
  )
}

const skillLevels = ['Beginner', 'Intermediate', 'Advanced'] as const
const PLAYERS_PER_PAGE = 10
const HISTORY_PLAYERS_PER_PAGE = 10

type PlayerSex = 'male' | 'female'
type PlayerSkill = (typeof skillLevels)[number]
type CreateQueuePlayerPayload = Parameters<typeof apiServices.createQueuePlayer>[0]

export function QueuePlayersPage() {
  const sortOptions: DropdownOption[] = [
    { label: 'Name', value: 'name' },
    { label: 'Skill Level', value: 'skill' },
    { label: 'Games Played', value: 'games' },
    { label: 'Status', value: 'status' },
    { label: 'Action (Recent)', value: 'action' }
  ]

  const gameTypeOptions: DropdownOption[] = [
    { label: "Men's Doubles", value: 'mens-doubles' },
    { label: "Women's Doubles", value: 'womens-doubles' },
    { label: 'Mixed Doubles', value: 'mixed-doubles' }
  ]

  const [sortBy, setSortBy] = useState(sortOptions[0].value)
  const [gameType, setGameType] = useState(gameTypeOptions[0].value)
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [selectedHistoryDate, setSelectedHistoryDate] = useState<string | null>(null)
  const historySortOptions: DropdownOption[] = [
    { label: 'Name', value: 'name' },
    { label: 'Skill Level', value: 'skill' },
    { label: 'Games Played', value: 'games' }
  ]
  const [historySortBy, setHistorySortBy] = useState(historySortOptions[0].value)
  const [isHistorySortMenuOpen, setIsHistorySortMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [playerName, setPlayerName] = useState('')
  const [selectedSex, setSelectedSex] = useState<PlayerSex | null>(null)
  const [selectedSkill, setSelectedSkill] = useState<PlayerSkill | null>(null)
  const [players, setPlayers] = useState<QueuePlayer[]>([])
  const [playersLoading, setPlayersLoading] = useState(true)
  const [playersError, setPlayersError] = useState<string | null>(null)
  const [historyPlayers, setHistoryPlayers] = useState<QueuePlayerHistory[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [activeMatches, setActiveMatches] = useState<QueueMatch[]>([])
  const [pendingMatches, setPendingMatches] = useState<QueueMatch[]>([])
  const [isAddingPlayer, setIsAddingPlayer] = useState(false)
  const [deletingPlayerIds, setDeletingPlayerIds] = useState<Set<number>>(new Set())
  const [playerToDelete, setPlayerToDelete] = useState<{ id: number; name: string } | null>(null)
  const [playerToEdit, setPlayerToEdit] = useState<QueuePlayer | null>(null)
  const [editForm, setEditForm] = useState<{ name: string; skill: PlayerSkill; sex: PlayerSex }>({
    name: '',
    skill: 'Beginner',
    sex: 'male'
  })
  const [isUpdatingPlayer, setIsUpdatingPlayer] = useState(false)
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false)
  const sortMenuRef = useRef<HTMLDivElement>(null)
  const historySortMenuRef = useRef<HTMLDivElement>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [isGeneratingMatches, setIsGeneratingMatches] = useState(false)
  const [historyPage, setHistoryPage] = useState(1)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [isClearingPlayers, setIsClearingPlayers] = useState(false)
  const [isSavingPlayers, setIsSavingPlayers] = useState(false)
  const [isClearingHistory, setIsClearingHistory] = useState(false)
  const [showClearHistoryConfirm, setShowClearHistoryConfirm] = useState(false)
  const [isMigratingPlayers, setIsMigratingPlayers] = useState(false)

  const toggleSexSelection = useCallback(
    (sex: PlayerSex) => {
      setSelectedSex((current) => (current === sex ? null : sex))
    },
    [setSelectedSex]
  )

  const toggleSkillSelection = useCallback(
    (skill: PlayerSkill) => {
      setSelectedSkill((current) => (current === skill ? null : skill))
    },
    [setSelectedSkill]
  )

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortMenuRef.current && !sortMenuRef.current.contains(event.target as Node)) {
        setIsSortMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (historySortMenuRef.current && !historySortMenuRef.current.contains(event.target as Node)) {
        setIsHistorySortMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, sortBy])

  useEffect(() => {
    setHistoryPage(1)
  }, [selectedHistoryDate, historySortBy])

  const loadPlayers = useCallback(async () => {
    setPlayersLoading(true)
    setPlayersError(null)
    try {
      const response = await apiServices.getQueuePlayers()
      setPlayers(response)
    } catch (error) {
      console.error('Failed to load queue players', error)
      setPlayersError('Unable to load players. Please try again later.')
    } finally {
      setPlayersLoading(false)
    }
  }, [])

  const loadMatches = useCallback(async () => {
    try {
      const [active, pending] = await Promise.all([
        apiServices.getQueueMatches({ status: 'active' }),
        apiServices.getQueueMatches({ status: 'pending' })
      ])
      setActiveMatches(active)
      setPendingMatches(pending)
    } catch (error) {
      console.error('Failed to load matches', error)
      // Don't show error toast, just log it - matches are for status only
    }
  }, [])

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true)
    try {
      const history = await apiServices.getQueuePlayersHistory()
      setHistoryPlayers(history)
    } catch (error) {
      console.error('Failed to load history', error)
    } finally {
      setHistoryLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadPlayers()
    void loadMatches()
    void loadHistory()
  }, [loadPlayers, loadMatches, loadHistory])

  // Reload history when modal opens
  useEffect(() => {
    if (showHistoryModal) {
      void loadHistory()
    }
  }, [showHistoryModal, loadHistory])

  // Set up polling to refresh matches every 5 seconds for real-time status updates
  useEffect(() => {
    const interval = setInterval(() => {
      // Defer the async work to prevent blocking the main thread
      setTimeout(() => {
      void loadMatches()
      }, 0)
    }, 5000) // Poll every 5 seconds

    return () => clearInterval(interval)
  }, [loadMatches])

  // Get today's date in ISO format (YYYY-MM-DD) using local timezone
  const getTodayISODate = () => {
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const todayISODate = getTodayISODate()

  // Calculate real-time player status based on matches
  // Players remain in the list unless deleted - they just get updated status
  const playersWithRealTimeStatus = useMemo(() => {
    // Get all player IDs in active matches (playing)
    const playersInActiveMatches = new Set<number>()
    activeMatches.forEach((match) => {
      match.teamA.forEach((p) => playersInActiveMatches.add(p.id))
      match.teamB.forEach((p) => playersInActiveMatches.add(p.id))
    })

    // Get all player IDs in pending matches (pending)
    const playersInPendingMatches = new Set<number>()
    pendingMatches.forEach((match) => {
      match.teamA.forEach((p) => playersInPendingMatches.add(p.id))
      match.teamB.forEach((p) => playersInPendingMatches.add(p.id))
    })

    // Update player status based on match data
    // All players remain in the list - only their status changes
    return players.map((player) => {
      let status: 'In Queue' | 'Waiting' | 'In Match' = 'Waiting' // Default to Waiting

      if (playersInActiveMatches.has(player.id)) {
        status = 'In Match' // Playing
      } else if (playersInPendingMatches.has(player.id)) {
        status = 'Waiting' // Pending
      } else {
        status = 'Waiting' // Not in any match - show as Waiting
      }

      return {
        ...player,
        status
      }
    })
  }, [players, activeMatches, pendingMatches])

  // Show ALL players in the queue - they remain visible regardless of lastPlayed date
  // Players are only removed when manually deleted, not when matches complete
  const todaysPlayers = useMemo(() => {
    // Return all players - no date filtering
    // Players stay in the queue after completing matches, they just get their gamesPlayed incremented
    return playersWithRealTimeStatus
  }, [playersWithRealTimeStatus])

  const filteredPlayers = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase()
    const base = normalizedQuery
      ? todaysPlayers.filter((player) => player.name.toLowerCase().includes(normalizedQuery))
      : todaysPlayers

    return [...base].sort((a, b) => {
      if (sortBy === 'skill') {
        return a.skill.localeCompare(b.skill)
      }
      if (sortBy === 'games') {
        return b.gamesPlayed - a.gamesPlayed
      }
      if (sortBy === 'status') {
        return a.status.localeCompare(b.status)
      }
      if (sortBy === 'action') {
        const updatedAtComparison = new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        if (updatedAtComparison !== 0) {
          return updatedAtComparison
        }
        return b.createdAt.localeCompare(a.createdAt)
      }
      return a.name.localeCompare(b.name)
    })
  }, [todaysPlayers, searchQuery, sortBy])

  const totalPages = Math.max(1, Math.ceil(filteredPlayers.length / PLAYERS_PER_PAGE))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const paginatedPlayers = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * PLAYERS_PER_PAGE
    return filteredPlayers.slice(startIndex, startIndex + PLAYERS_PER_PAGE)
  }, [filteredPlayers, safeCurrentPage])
  const showingRangeStart =
    filteredPlayers.length === 0 ? 0 : (safeCurrentPage - 1) * PLAYERS_PER_PAGE + 1
  const showingRangeEnd =
    filteredPlayers.length === 0
      ? 0
      : Math.min(filteredPlayers.length, showingRangeStart + PLAYERS_PER_PAGE - 1)
  const shouldShowPagination = filteredPlayers.length > PLAYERS_PER_PAGE

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  // History uses data from the history table, grouped by archivedAt date
  const historyByDate = useMemo(() => {
    return historyPlayers.reduce((acc, historyPlayer) => {
      // Extract date part (YYYY-MM-DD) from archivedAt using local timezone
      let archiveDate: string
      if (typeof historyPlayer.archivedAt === 'string') {
        archiveDate = historyPlayer.archivedAt.slice(0, 10)
      } else {
        // Use local timezone, not UTC, to match backend behavior
        const date = new Date(historyPlayer.archivedAt)
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        archiveDate = `${year}-${month}-${day}`
      }
      
      if (!acc[archiveDate]) {
        acc[archiveDate] = []
      }
      acc[archiveDate].push(historyPlayer)
      
      return acc
    }, {} as Record<string, QueuePlayerHistory[]>)
  }, [historyPlayers])

  // Limit history to only the 5 most recent dates
  const HISTORY_DATE_LIMIT = 5
  const historyDates = useMemo(() => {
    const sortedDates = Object.keys(historyByDate).sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
    return sortedDates.slice(0, HISTORY_DATE_LIMIT)
  }, [historyByDate])

  const historyPlayersForSelectedDate = useMemo(() => {
    if (!selectedHistoryDate) return []
    const playersForDate = historyByDate[selectedHistoryDate] ?? []
    const sorted = [...playersForDate]

    if (historySortBy === 'skill') {
      return sorted.sort((a, b) => a.skill.localeCompare(b.skill))
    }

    if (historySortBy === 'games') {
      return sorted.sort((a, b) => b.gamesPlayed - a.gamesPlayed)
    }

    return sorted.sort((a, b) => a.name.localeCompare(b.name))
  }, [historyByDate, historySortBy, selectedHistoryDate])

  const historyTotalPages = selectedHistoryDate
    ? Math.max(1, Math.ceil(historyPlayersForSelectedDate.length / HISTORY_PLAYERS_PER_PAGE))
    : 1
  const safeHistoryPage = Math.min(historyPage, historyTotalPages)
  const paginatedHistoryPlayers = useMemo(() => {
    if (!selectedHistoryDate) return []
    const startIndex = (safeHistoryPage - 1) * HISTORY_PLAYERS_PER_PAGE
    return historyPlayersForSelectedDate.slice(startIndex, startIndex + HISTORY_PLAYERS_PER_PAGE)
  }, [historyPlayersForSelectedDate, safeHistoryPage, selectedHistoryDate])

  const statusStyles = useMemo(() => {
    return {
      'In Queue': {
        label: 'Queued',
        badgeClass: 'border border-purple-400/50 bg-purple-500/10 text-purple-200'
      },
      Waiting: {
        label: 'Waiting',
        badgeClass: 'border border-amber-400/60 bg-amber-500/10 text-amber-200'
      },
      'In Match': {
        label: 'Playing',
        badgeClass: 'border border-emerald-400/60 bg-emerald-500/15 text-emerald-200'
      }
    } satisfies Record<
      QueuePlayer['status'],
      { label: string; badgeClass: string }
    >
  }, [])

  useEffect(() => {
    if (historyDates.length === 0) {
      if (selectedHistoryDate !== null) {
        setSelectedHistoryDate(null)
      }
      return
    }

    if (!selectedHistoryDate || !historyDates.includes(selectedHistoryDate)) {
      setSelectedHistoryDate(historyDates[0])
    }
  }, [historyDates, selectedHistoryDate])

  useEffect(() => {
    if (historyPage > historyTotalPages) {
      setHistoryPage(historyTotalPages)
    }
  }, [historyPage, historyTotalPages])

  const handleAddPlayer = async () => {
    const trimmedName = playerName.trim()
    if (!trimmedName || isAddingPlayer) {
      return
    }

    if (!selectedSex || !selectedSkill) {
      setPlayersError('Please choose both sex and skill level before adding a player.')
      return
    }

    // Check for duplicate player name (case-insensitive)
    const duplicatePlayer = players.find(
      (player) => player.name.toLowerCase().trim() === trimmedName.toLowerCase()
    )

    if (duplicatePlayer) {
      setPlayersError(`A player with the name "${duplicatePlayer.name}" already exists.`)
      toast.error(`A player with the name "${duplicatePlayer.name}" already exists.`)
      return
    }

    setIsAddingPlayer(true)
    setPlayersError(null)

    try {
      const payload: CreateQueuePlayerPayload = {
        name: trimmedName,
        sex: selectedSex,
        skill: selectedSkill,
        status: 'In Queue',
        lastPlayed: todayISODate // Use the same date format as the filter for consistency
      }
      const createdPlayer = await apiServices.createQueuePlayer(payload)
      setPlayers((prev) => [...prev, createdPlayer])
      setPlayerName('')
      setSelectedSex(null)
      setSelectedSkill(null)
      toast.success(`${createdPlayer.name} added to queue.`)
    } catch (error) {
      console.error('Failed to create queue player', error)
      setPlayersError('Unable to add player. Please try again.')
      toast.error('Failed to add player. Please try again.')
    } finally {
      setIsAddingPlayer(false)
    }
  }

  const handleDeletePlayer = useCallback(async (playerId: number, playerName?: string) => {
    setPlayersError(null)
    setDeletingPlayerIds((prev) => {
      const next = new Set(prev)
      next.add(playerId)
      return next
    })

    try {
      await apiServices.deleteQueuePlayer(playerId)
      // Reload players from server to ensure UI is in sync with database
      await loadPlayers()
      if (playerName) {
        toast.success(`${playerName} removed from queue.`)
      } else {
        toast.success('Player removed.')
      }
    } catch (error) {
      console.error('Failed to delete queue player', error)
      setPlayersError('Unable to delete player. Please try again.')
      toast.error('Unable to delete player. Please try again.')
    } finally {
      setDeletingPlayerIds((prev) => {
        const next = new Set(prev)
        next.delete(playerId)
        return next
      })
    }
  }, [loadPlayers])

  const confirmDeletePlayer = useCallback(async () => {
    if (!playerToDelete || deletingPlayerIds.has(playerToDelete.id)) {
      return
    }

    await handleDeletePlayer(playerToDelete.id, playerToDelete.name)
    setPlayerToDelete(null)
  }, [deletingPlayerIds, handleDeletePlayer, playerToDelete])

  const deletingSelectedPlayer = playerToDelete ? deletingPlayerIds.has(playerToDelete.id) : false

  const handleOpenEdit = useCallback((player: QueuePlayer) => {
    setPlayerToEdit(player)
    setEditForm({
      name: player.name,
      skill: player.skill,
      sex: player.sex
    })
  }, [])

  const handleImportHistoryPlayer = useCallback(
    async (player: QueuePlayerHistory) => {
      const alreadyInQueue = todaysPlayers.some(
        (existing) => existing.name.toLowerCase() === player.name.toLowerCase()
      )

      if (alreadyInQueue) {
        toast('Player is already in today\'s queue.')
        return
      }

      try {
        setPlayersError(null)
        const createdPlayer = await apiServices.createQueuePlayer({
          name: player.name,
          sex: player.sex,
          skill: player.skill,
          status: 'In Queue',
          lastPlayed: todayISODate
        })

        setPlayers((prev) => [...prev, createdPlayer])
        toast.success(`${player.name} added to today’s queue.`)
      } catch (error) {
        console.error('Failed to import player from history', error)
        setPlayersError('Unable to import player. Please try again.')
        toast.error('Unable to import player. Please try again.')
      }
    },
    [setPlayersError, todaysPlayers, todayISODate]
  )

  const handleUpdatePlayer = useCallback(async () => {
    if (!playerToEdit || isUpdatingPlayer) return

    // Check if player is currently playing
    const playerWithStatus = playersWithRealTimeStatus.find(p => p.id === playerToEdit.id)
    const isPlaying = playerWithStatus?.status === 'In Match'
    
    // Check if any field is being changed
    const nameChanged = editForm.name.trim() !== playerToEdit.name.trim()
    const skillChanged = editForm.skill !== playerToEdit.skill
    const sexChanged = editForm.sex !== playerToEdit.sex
    
    // Prevent any updates when player is playing
    if (isPlaying && (nameChanged || skillChanged || sexChanged)) {
      setPlayersError('Player details cannot be edited while the player is playing.')
      toast.error('Player details cannot be edited while the player is playing.')
      return
    }

    const trimmedName = editForm.name.trim()
    if (!trimmedName) {
      setPlayersError('Player name cannot be empty.')
      return
    }

    // Check for duplicate player name (case-insensitive), excluding the current player being edited
    const duplicatePlayer = players.find(
      (player) =>
        player.id !== playerToEdit.id &&
        player.name.toLowerCase().trim() === trimmedName.toLowerCase()
    )

    if (duplicatePlayer) {
      setPlayersError(`A player with the name "${duplicatePlayer.name}" already exists.`)
      toast.error(`A player with the name "${duplicatePlayer.name}" already exists.`)
      return
    }

    setIsUpdatingPlayer(true)
    setPlayersError(null)

    try {
      const updatedPlayer = await apiServices.updateQueuePlayer(playerToEdit.id, {
        name: trimmedName,
        skill: editForm.skill,
        sex: editForm.sex
      })

      setPlayers((prev) =>
        prev.map((player) => (player.id === updatedPlayer.id ? { ...player, ...updatedPlayer } : player))
      )
      setPlayerToEdit(null)
    } catch (error) {
      console.error('Failed to update queue player', error)
      setPlayersError('Unable to update player. Please try again.')
    } finally {
      setIsUpdatingPlayer(false)
    }
  }, [editForm.name, editForm.sex, editForm.skill, isUpdatingPlayer, playerToEdit, players, playersWithRealTimeStatus])

  const handleGenerateMatches = useCallback(async () => {
    if (isGeneratingMatches) return
    
    // Validate game type
    const validGameTypes: QueueMatchGameType[] = ['mens-doubles', 'womens-doubles', 'mixed-doubles']
    if (!validGameTypes.includes(gameType as QueueMatchGameType)) {
      toast.error('Invalid game type selected.')
      return
    }

    setIsGeneratingMatches(true)
    setPlayersError(null)

    try {
      const selectedGameType = gameType as QueueMatchGameType
      const gameTypeLabel = gameTypeOptions.find(opt => opt.value === selectedGameType)?.label || selectedGameType
      
      const response = await apiServices.generateQueueMatches({ gameType: selectedGameType })
      const generatedCount = response?.matchesGenerated ?? 0
      const activeCount = response?.activeMatches?.length ?? 0
      const pendingCount = response?.pendingMatches?.length ?? 0

      if (generatedCount > 0) {
        toast.success(
          `Generated ${generatedCount} ${gameTypeLabel} match${generatedCount === 1 ? '' : 'es'} (${activeCount} active, ${pendingCount} pending).`
        )
      } else {
        // Check if there's a specific reason (e.g., no active courts)
        if (response?.reason) {
          toast.error(response.reason)
        } else {
          const genderRequired = 
            selectedGameType === 'mens-doubles' ? 'male' :
            selectedGameType === 'womens-doubles' ? 'female' :
            'male and female'
          toast.error(
            `No ${gameTypeLabel} matches generated. Need at least 4 ${genderRequired} players.`
          )
        }
      }
      await Promise.all([loadPlayers(), loadMatches()]) // Refresh players and matches to update statuses
    } catch (error: any) {
      console.error('Failed to generate matches', error)
      const errorMessage = error?.response?.data?.message || error?.message || 'Unable to generate matches. Please try again.'
      setPlayersError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsGeneratingMatches(false)
    }
  }, [gameType, isGeneratingMatches, loadPlayers, loadMatches])

  const handleClearAllPlayers = useCallback(async () => {
    if (isClearingPlayers || todaysPlayers.length === 0) return
    
    setIsClearingPlayers(true)
    setPlayersError(null)
    setShowClearConfirm(false)

    try {
      // Delete all today's players and clear fee management records
      const [clearFeeResult] = await Promise.all([
        apiServices.clearTodayFeeManagement().catch((error) => {
          // Log error but don't fail the entire operation if fee management clear fails
          console.warn('Failed to clear fee management records:', error)
          return { deletedCount: 0 }
        }),
        ...todaysPlayers.map((player) => apiServices.deleteQueuePlayer(player.id))
      ])
      
      const clearedCount = todaysPlayers.length
      const feeClearedCount = clearFeeResult?.deletedCount || 0
      
      if (feeClearedCount > 0) {
        toast.success(`Cleared ${clearedCount} player${clearedCount === 1 ? '' : 's'} and ${feeClearedCount} fee management record${feeClearedCount === 1 ? '' : 's'}.`)
      } else {
        toast.success(`Cleared ${clearedCount} player${clearedCount === 1 ? '' : 's'} from the queue.`)
      }
      await loadPlayers()
    } catch (error) {
      console.error('Failed to clear players', error)
      setPlayersError('Unable to clear players. Please try again.')
      toast.error('Unable to clear players. Please try again.')
    } finally {
      setIsClearingPlayers(false)
    }
  }, [isClearingPlayers, todaysPlayers, loadPlayers])

  const handleSavePlayersToHistory = useCallback(async () => {
    if (isSavingPlayers || todaysPlayers.length === 0) {
      if (todaysPlayers.length === 0) {
        toast.error('No players to save. Add players to the queue first.')
      }
      return
    }
    
    setIsSavingPlayers(true)
    setPlayersError(null)

    try {
      const result = await apiServices.savePlayersToHistory() as {
        message?: string
        savedCount?: number
        skippedCount?: number
        players?: any[]
      }
      
      // Ensure we have valid numbers
      const savedCount = Number(result?.savedCount) || 0
      const skippedCount = Number(result?.skippedCount) || 0
      
      // When all players are already in history (savedCount is 0 but skippedCount > 0)
      if (savedCount === 0 && skippedCount > 0) {
        // Show success message that all players are already added
        toast.success(`All ${skippedCount} player${skippedCount === 1 ? '' : 's'} are already added to today's history.`)
        // Reload history to ensure UI is up to date
        await loadHistory()
      } else if (savedCount === 0 && skippedCount === 0) {
        // No players to save (empty queue)
        toast.error('No players were saved to history.')
      } else {
        // Some or all players were saved
        let message = `Successfully saved ${savedCount} player${savedCount === 1 ? '' : 's'} to history.`
        if (skippedCount > 0) {
          message += ` ${skippedCount} player${skippedCount === 1 ? '' : 's'} skipped (already exist).`
        }
        toast.success(message)
        // Reload history to show the newly saved players
        await loadHistory()
      }
    } catch (error) {
      console.error('Failed to save players to history', error)
      setPlayersError('Unable to save players to history. Please try again.')
      toast.error('Unable to save players to history. Please try again.')
    } finally {
      setIsSavingPlayers(false)
    }
  }, [isSavingPlayers, todaysPlayers.length, loadHistory])

  const handleClearHistory = useCallback(async () => {
    if (isClearingHistory) return
    
    setIsClearingHistory(true)
    setPlayersError(null)
    setShowClearHistoryConfirm(false)

    try {
      const result = await apiServices.clearPlayersHistory()
      const deletedCount = result.deletedCount || 0
      toast.success(`Successfully cleared ${deletedCount} history record${deletedCount === 1 ? '' : 's'}.`)
      // Reload history to refresh the view
      await loadHistory()
      // Reload players in case any were deleted from active queue
      await loadPlayers()
      // Reset selected date if it was set
      setSelectedHistoryDate(null)
    } catch (error) {
      console.error('Failed to clear history', error)
      setPlayersError('Unable to clear history. Please try again.')
      toast.error('Unable to clear history. Please try again.')
    } finally {
      setIsClearingHistory(false)
    }
  }, [isClearingHistory, loadHistory, loadPlayers])

  const handleMigratePlayers = useCallback(async () => {
    if (isMigratingPlayers) return
    
    setIsMigratingPlayers(true)
    setPlayersError(null)

    try {
      const result = await apiServices.migratePlayers()
      const migratedCount = result.migratedCount || 0
      if (migratedCount > 0) {
        toast.success(`Successfully migrated ${migratedCount} player${migratedCount === 1 ? '' : 's'} to your account.`)
        // Reload players to show the migrated players
        await loadPlayers()
      } else {
        toast('No players found to migrate.')
      }
    } catch (error) {
      console.error('Failed to migrate players', error)
      setPlayersError('Unable to migrate players. Please try again.')
      toast.error('Unable to migrate players. Please try again.')
    } finally {
      setIsMigratingPlayers(false)
    }
  }, [isMigratingPlayers, loadPlayers])

  return (
    <QueueingShell activeTab="players">
      <section className="rounded-2xl sm:rounded-3xl border border-white/10 bg-white/[0.08] p-4 sm:p-5 md:p-6 shadow-2xl shadow-black/30 backdrop-blur-lg">
        <div className="space-y-4 sm:space-y-5 md:space-y-6">
          <div className="space-y-2 sm:space-y-3">
            <h2 className="text-center text-lg sm:text-xl font-semibold text-white">Enter Player</h2>
            <input
              type="text"
              placeholder="Enter player name"
              value={playerName}
              onChange={(event) => setPlayerName(event.target.value)}
              className="w-full rounded-xl sm:rounded-2xl border border-white/12 bg-white/10 px-4 sm:px-5 py-2.5 sm:py-3 text-sm text-white placeholder:text-white/40 outline-none transition focus:border-white/40 focus:bg-white/15"
            />
          </div>

          <div className="flex flex-col gap-4 sm:gap-5 md:gap-6 lg:flex-row lg:items-start lg:justify-between lg:gap-10">
            <div className="flex w-full flex-col gap-4 sm:gap-5 md:gap-6 lg:flex-row lg:items-start lg:justify-center lg:gap-10">
              <div className="flex flex-col items-center gap-2 sm:gap-3">
                <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-white/70">Sex</span>
                <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 md:gap-4">
                  <button
                    type="button"
                    onClick={() => toggleSexSelection('male')}
                    className={`rounded-full px-4 sm:px-5 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold transition ${
                      selectedSex === 'male'
                        ? 'bg-indigo-500/90 text-white shadow-lg shadow-indigo-500/40'
                        : 'bg-white/10 text-white/80 hover:bg-white/15'
                    }`}
                  >
                    Male
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleSexSelection('female')}
                    className={`rounded-full px-4 sm:px-5 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold transition ${
                      selectedSex === 'female'
                        ? 'bg-indigo-500/90 text-white shadow-lg shadow-indigo-500/40'
                        : 'bg-white/10 text-white/80 hover:bg-white/15'
                    }`}
                  >
                    Female
                  </button>
                </div>
              </div>

              <div className="flex flex-col items-center gap-2 sm:gap-3 text-center">
                <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-white/70">Skill Level</span>
                <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
                  {skillLevels.map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => toggleSkillSelection(level)}
                      className={`rounded-full px-3 sm:px-4 md:px-5 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold transition ${
                        selectedSkill === level
                          ? 'bg-emerald-500/90 text-white shadow-lg shadow-emerald-500/40'
                          : 'bg-white/10 text-white/80 hover:bg-white/15'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex w-full flex-col items-center gap-2 sm:w-auto">
              <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-white/70">Actions</span>
              <button
                type="button"
                onClick={handleAddPlayer}
                disabled={isAddingPlayer || !playerName.trim() || !selectedSex || !selectedSkill}
                className={`inline-flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-xl sm:rounded-2xl px-5 sm:px-6 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold text-white shadow-[0_20px_35px_rgba(31,73,255,0.35)] transition sm:w-auto ${
                  isAddingPlayer || !playerName.trim() || !selectedSex || !selectedSkill
                    ? 'bg-[#1f49ff]/50 cursor-not-allowed opacity-70'
                    : 'bg-[#1f49ff] hover:-translate-y-0.5 hover:bg-[#2b57ff]'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5 sm:h-4 sm:w-4">
                  <path d="M10 10a4 4 0 100-8 4 4 0 000 8zM2 17a6 6 0 1112 0H2zm13.25-7.75a.75.75 0 00-1.5 0V11h-1.75a.75.75 0 000 1.5h1.75v1.75a.75.75 0 001.5 0V12.5H17a.75.75 0 000-1.5h-1.75V9.25z" />
                </svg>
                Add Player
              </button>
            </div>
          </div>
        </div>
      </section>
      <section className="rounded-2xl sm:rounded-3xl border border-white/10 bg-white/[0.05] shadow-2xl shadow-black/30 backdrop-blur-lg">
        <div className="border-b border-white/10 px-3 sm:px-4 md:px-5 lg:px-6 py-4 sm:py-5">
          <div className="flex flex-col gap-3 sm:gap-4">
            <div className="flex flex-col gap-3 sm:gap-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-center lg:justify-start">
                <div className="relative w-full sm:max-w-xs sm:w-64 text-left">
                  <label className="mb-1 block text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-white/60">Search Players</label>
                  <input
                    type="text"
                    placeholder="Search players"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    className="w-full rounded-full border border-white/10 bg-white/5 px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm text-white placeholder:text-white/40 outline-none transition focus:border-white/30 focus:bg-white/10"
                  />
                  <span className="pointer-events-none absolute inset-y-0 right-3 sm:right-4 flex items-center text-sm sm:text-base text-white/40">
                    🔍
                  </span>
                </div>

                <DropdownField
                  label="Game Type"
                  options={gameTypeOptions}
                  value={gameType}
                  onChange={setGameType}
                  className="max-w-xs sm:w-64"
                />

                <div className="flex w-full flex-col items-start sm:w-auto">
                  <span className="mb-1.5 sm:mb-2 block text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-white/60">Action</span>
                  <button
                    type="button"
                    onClick={() => void handleGenerateMatches()}
                    disabled={isGeneratingMatches || playersLoading}
                    className={`w-full rounded-full px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-white shadow-[0_20px_35px_rgba(31,73,255,0.35)] transition sm:w-auto ${
                      isGeneratingMatches || playersLoading
                        ? 'bg-[#1f49ff]/60 cursor-not-allowed opacity-70'
                        : 'bg-[#1f49ff] hover:-translate-y-0.5 hover:bg-[#2b57ff]'
                    }`}
                  >
                    {isGeneratingMatches ? 'Generating…' : 'Generate Matches'}
                  </button>
                </div>

                <div className="flex w-full flex-col items-start sm:w-auto">
                  <span className="mb-1.5 sm:mb-2 block text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-white/60">Actions</span>
                  <button
                    type="button"
                    onClick={handleSavePlayersToHistory}
                    disabled={isSavingPlayers || todaysPlayers.length === 0}
                    className={`w-full rounded-full border border-white/20 px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-white transition hover:-translate-y-0.5 sm:w-auto ${
                      isSavingPlayers || todaysPlayers.length === 0
                        ? 'bg-white/5 cursor-not-allowed opacity-50'
                        : 'bg-green-600/80 hover:bg-green-600'
                    }`}
                  >
                    {isSavingPlayers ? 'Saving...' : 'Save Players'}
                  </button>
                </div>

                <div className="flex w-full flex-col items-start sm:w-auto">
                  <span className="mb-1.5 sm:mb-2 block text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-white/60">History</span>
                  <button
                    type="button"
                    onClick={() => setShowHistoryModal(true)}
                    className="w-full rounded-full border border-white/20 bg-white/10 px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-white/15 sm:w-auto"
                  >
                    Players History
                  </button>
                </div>
              </div>
            </div>
            {playersError && (
              <p className="text-center text-xs sm:text-sm font-medium text-red-300 lg:text-left">{playersError}</p>
            )}
          </div>
        </div>

        <div className="overflow-hidden px-3 sm:px-4 md:px-6 pb-4 sm:pb-6">
          <div className="overflow-x-auto rounded-2xl sm:rounded-3xl border border-white/10 bg-white/[0.07]">
            <table className="min-w-full divide-y divide-white/10 text-xs sm:text-sm text-white/80">
              <thead className="border-b border-white/18 bg-[#14070e] text-left uppercase tracking-wide text-white/60">
                <tr>
                  <th className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 font-semibold">
                    <div ref={sortMenuRef} className="relative flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsSortMenuOpen((prev) => !prev)}
                        className={`rounded-full border border-white/10 bg-white/5 p-1 sm:p-1.5 text-white/70 transition hover:border-white/30 hover:text-white ${isSortMenuOpen ? 'border-white/40 text-white' : ''}`}
                        aria-haspopup="listbox"
                        aria-expanded={isSortMenuOpen}
                        aria-label="Sort players"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5 sm:h-4 sm:w-4">
                          <path d="M2.75 5.5a.75.75 0 01.75-.75h13a.75.75 0 010 1.5h-13a.75.75 0 01-.75-.75zM5 10a.75.75 0 01.75-.75h9.5a.75.75 0 010 1.5h-9.5A.75.75 0 015 10zm3 4.5a.75.75 0 01.75-.75h6.5a.75.75 0 010 1.5h-6.5A.75.75 0 018 14.5z" />
                        </svg>
                      </button>
                      <span className={`text-xs sm:text-sm ${sortBy === 'name' ? 'text-white' : 'text-white/80'}`}>Name</span>
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
                                      setSortBy(option.value)
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
                  <th className={`px-3 sm:px-4 md:px-6 py-2 sm:py-3 font-semibold text-[10px] sm:text-xs ${sortBy === 'skill' ? 'text-white' : ''}`}>Skill Level</th>
                  <th className={`px-3 sm:px-4 md:px-6 py-2 sm:py-3 font-semibold text-[10px] sm:text-xs ${sortBy === 'games' ? 'text-white' : ''}`}>Games Played</th>
                  <th className={`px-3 sm:px-4 md:px-6 py-2 sm:py-3 font-semibold text-[10px] sm:text-xs ${sortBy === 'status' ? 'text-white' : ''}`}>Status</th>
                  <th className={`px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-right font-semibold text-[10px] sm:text-xs ${sortBy === 'action' ? 'text-white' : ''}`}>Action</th>
                </tr>
              </thead>
              <tbody>
                {playersLoading ? (
                  <tr>
                    <td colSpan={5} className="px-3 sm:px-4 md:px-6 py-4 sm:py-6 text-center text-xs sm:text-sm text-white/60">
                      Loading players...
                    </td>
                  </tr>
                ) : filteredPlayers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-3 sm:px-4 md:px-6 py-4 sm:py-6 text-center text-xs sm:text-sm text-white/60">
                      No players found.
                    </td>
                  </tr>
                ) : (
                  paginatedPlayers.map((player) => (
                    <tr key={player.id} className="border-b border-white/18 bg-[#14070e] transition-colors hover:bg-[#1a0a12]">
                      <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 font-semibold text-white">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <span
                            className={`inline-flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full bg-white/10 text-xs sm:text-sm shadow-inner flex-shrink-0 ${
                              player.sex === 'male' ? 'text-sky-300 bg-sky-500/15' : 'text-pink-300 bg-pink-500/15'
                            }`}
                            aria-label={player.sex === 'male' ? 'Male player' : 'Female player'}
                            title={player.sex === 'male' ? 'Male player' : 'Female player'}
                          >
                            {player.sex === 'male' ? (
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3 sm:h-4 sm:w-4">
                                <path d="M13.5 2a.75.75 0 000 1.5h1.69l-3.2 3.2a4.5 4.5 0 10.884.884l3.2-3.2V6.5a.75.75 0 001.5 0V2.75A.75.75 0 0016.75 2H13.5zm-4 5a3 3 0 110 6 3 3 0 010-6z" />
                              </svg>
                            ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3 sm:h-4 sm:w-4">
                                <path d="M10 2a4.5 4.5 0 10.878 8.9l-.378.378H8.75a.75.75 0 000 1.5h1.25v1.25a.75.75 0 001.5 0V12.78l.378-.378A4.5 4.5 0 0010 2zm0 1.5a3 3 0 110 6 3 3 0 010-6z" />
                              </svg>
                            )}
                          </span>
                          <span className="truncate text-xs sm:text-sm">{player.name}</span>
                        </div>
                      </td>
                      <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4">
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          <span className="inline-flex h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full bg-emerald-400 flex-shrink-0" />
                          <span className="text-xs sm:text-sm">{player.skill}</span>
                        </div>
                      </td>
                      <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-center text-xs sm:text-sm">{player.gamesPlayed}</td>
                      <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4">
                        <span
                          className={`rounded-full px-2 sm:px-3 py-0.5 sm:py-1 text-[9px] sm:text-xs font-semibold uppercase tracking-wide ${
                            statusStyles[player.status]?.badgeClass ?? 'border border-white/20 bg-white/10 text-white'
                          }`}
                        >
                          {statusStyles[player.status]?.label ?? player.status}
                        </span>
                      </td>
                      <td className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-right">
                        <div className="flex justify-end gap-1.5 sm:gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(player)}
                            className="rounded-full border border-white/20 bg-white/10 px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-white/80 transition hover:border-blue-300 hover:bg-blue-500/20 hover:text-blue-100 whitespace-nowrap"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => setPlayerToDelete({ id: player.id, name: player.name })}
                            disabled={deletingPlayerIds.has(player.id)}
                            className={`rounded-full border px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 text-[10px] sm:text-xs font-semibold uppercase tracking-wide transition whitespace-nowrap ${
                              deletingPlayerIds.has(player.id)
                                ? 'cursor-wait border-white/10 bg-white/5 text-white/60'
                                : 'border-white/20 bg-white/10 text-white/80 hover:border-red-300 hover:bg-red-500/20 hover:text-red-200'
                            }`}
                          >
                            {deletingPlayerIds.has(player.id) ? 'Removing...' : 'Delete'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="flex flex-col gap-2 sm:gap-3 border-t border-white/10 px-2 sm:px-3 md:px-4 pt-3 sm:pt-4">
            {shouldShowPagination && filteredPlayers.length > 0 && (
              <div className="flex flex-col gap-2 sm:gap-3 text-xs sm:text-sm text-white/70 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-center sm:text-left">
                  Showing {showingRangeStart}-{showingRangeEnd} of {filteredPlayers.length} players
                </span>
                <div className="flex items-center justify-center gap-2 sm:gap-3">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={safeCurrentPage === 1}
                    className={`rounded-full border px-3 sm:px-4 py-1.5 sm:py-2 text-[10px] sm:text-xs font-semibold uppercase tracking-wide transition ${
                      safeCurrentPage === 1
                        ? 'cursor-not-allowed border-white/10 bg-white/5 text-white/40'
                        : 'border-white/20 bg-white/10 text-white/80 hover:bg-white/20 hover:text-white'
                    }`}
                  >
                    Previous
                  </button>
                  <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-white/60 whitespace-nowrap">
                    Page {safeCurrentPage} of {totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={safeCurrentPage === totalPages}
                    className={`rounded-full border px-3 sm:px-4 py-1.5 sm:py-2 text-[10px] sm:text-xs font-semibold uppercase tracking-wide transition ${
                      safeCurrentPage === totalPages
                        ? 'cursor-not-allowed border-white/10 bg-white/5 text-white/40'
                        : 'border-white/20 bg-white/10 text-white/80 hover:bg-white/20 hover:text-white'
                    }`}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
            {todaysPlayers.length > 0 && (
              <div className="flex justify-center pt-2 sm:pt-3">
                <button
                  type="button"
                  onClick={() => setShowClearConfirm(true)}
                  disabled={isClearingPlayers || playersLoading}
                  className={`rounded-full border px-4 sm:px-5 md:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold uppercase tracking-wide transition ${
                    isClearingPlayers || playersLoading
                      ? 'cursor-not-allowed border-red-500/30 bg-red-500/10 text-red-400/50'
                      : 'border-red-400/50 bg-red-500/10 text-red-200 hover:border-red-400/70 hover:bg-red-500/20 hover:text-red-100'
                  }`}
                >
                  {isClearingPlayers ? 'Clearing...' : 'Clear Players'}
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {playerToDelete && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 px-4 py-4">
          <div className="w-full max-w-sm rounded-xl sm:rounded-2xl border border-white/15 bg-[#11050b] p-4 sm:p-6 text-center shadow-[0_30px_60px_rgba(0,0,0,0.5)]">
            <h3 className="text-base sm:text-lg font-semibold text-white">Remove player?</h3>
            <p className="mt-2 text-xs sm:text-sm text-white/70">
              This will remove <span className="font-semibold text-white">{playerToDelete.name}</span> from the queue.
            </p>
            <div className="mt-5 sm:mt-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => setPlayerToDelete(null)}
                disabled={deletingSelectedPlayer}
                className="rounded-full bg-white/10 px-4 sm:px-5 py-2 text-xs sm:text-sm font-semibold text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void confirmDeletePlayer()}
                disabled={deletingSelectedPlayer}
                className="rounded-full bg-rose-500 px-4 sm:px-5 py-2 text-xs sm:text-sm font-semibold text-white shadow-lg shadow-rose-900/30 transition hover:bg-rose-500/90 disabled:cursor-not-allowed disabled:bg-rose-500/60"
              >
                {deletingSelectedPlayer ? 'Removing…' : 'Remove'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showClearConfirm && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 px-4 py-4">
          <div className="w-full max-w-sm rounded-xl sm:rounded-2xl border border-white/15 bg-[#11050b] p-4 sm:p-6 text-center shadow-[0_30px_60px_rgba(0,0,0,0.5)]">
            <h3 className="text-base sm:text-lg font-semibold text-white">Clear all players?</h3>
            <p className="mt-2 text-xs sm:text-sm text-white/70">
              This will remove all <span className="font-semibold text-white">{todaysPlayers.length}</span> player{todaysPlayers.length === 1 ? '' : 's'} from today's queue. This action cannot be undone.
            </p>
            <div className="mt-5 sm:mt-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                disabled={isClearingPlayers}
                className="rounded-full bg-white/10 px-4 sm:px-5 py-2 text-xs sm:text-sm font-semibold text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleClearAllPlayers()}
                disabled={isClearingPlayers}
                className="rounded-full bg-rose-500 px-4 sm:px-5 py-2 text-xs sm:text-sm font-semibold text-white shadow-lg shadow-rose-900/30 transition hover:bg-rose-500/90 disabled:cursor-not-allowed disabled:bg-rose-500/60"
              >
                {isClearingPlayers ? 'Clearing…' : 'Clear All'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showClearHistoryConfirm && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 px-4 py-4">
          <div className="w-full max-w-sm rounded-xl sm:rounded-2xl border border-white/15 bg-[#11050b] p-4 sm:p-6 text-center shadow-[0_30px_60px_rgba(0,0,0,0.5)]">
            <h3 className="text-base sm:text-lg font-semibold text-white">Clear all history?</h3>
            <p className="mt-2 text-xs sm:text-sm text-white/70">
              This will permanently delete all players history records. This action cannot be undone.
            </p>
            <div className="mt-5 sm:mt-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => setShowClearHistoryConfirm(false)}
                disabled={isClearingHistory}
                className="rounded-full bg-white/10 px-4 sm:px-5 py-2 text-xs sm:text-sm font-semibold text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleClearHistory()}
                disabled={isClearingHistory}
                className="rounded-full bg-rose-500 px-4 sm:px-5 py-2 text-xs sm:text-sm font-semibold text-white shadow-lg shadow-rose-900/30 transition hover:bg-rose-500/90 disabled:cursor-not-allowed disabled:bg-rose-500/60"
              >
                {isClearingHistory ? 'Clearing…' : 'Clear History'}
              </button>
            </div>
          </div>
        </div>
      )}

      {playerToEdit && (() => {
        const playerWithStatus = playersWithRealTimeStatus.find(p => p.id === playerToEdit.id)
        const isPlaying = playerWithStatus?.status === 'In Match'
        
        return (
        <div className="fixed inset-0 z-[65] flex items-center justify-center bg-black/60 px-4 py-4 overflow-y-auto">
          <div className="w-full max-w-md rounded-xl sm:rounded-2xl border border-white/15 bg-[#11050b] p-4 sm:p-6 shadow-[0_30px_60px_rgba(0,0,0,0.5)] my-auto">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="text-base sm:text-lg font-semibold text-white">Edit player</h3>
                <p className="mt-1 text-xs sm:text-sm text-white/70">Update the player details for the queue.</p>
              </div>
              <button
                type="button"
                onClick={() => setPlayerToEdit(null)}
                disabled={isUpdatingPlayer}
                className="inline-flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white/70 transition hover:bg-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-60 flex-shrink-0"
                aria-label="Close edit"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 sm:mt-6 space-y-4 sm:space-y-5">
              <div>
                <label className="mb-2 block text-xs sm:text-sm font-medium text-white/80">Player name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(event) =>
                    setEditForm((prev) => ({
                      ...prev,
                      name: event.target.value
                    }))
                  }
                  disabled={isPlaying}
                  className={`w-full rounded-lg sm:rounded-xl border border-white/15 bg-white/10 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-white outline-none transition focus:border-white/40 focus:bg-white/15 ${
                    isPlaying ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                />
                {isPlaying && (
                  <p className="mt-1.5 text-xs text-white/60">Player name cannot be edited while playing.</p>
                )}
              </div>

              <div>
                <span className="mb-2 block text-xs sm:text-sm font-medium text-white/80">Skill level</span>
                <div className="flex flex-wrap gap-2">
                  {skillLevels.map((level) => (
                    <button
                      key={`edit-skill-${level}`}
                      type="button"
                      onClick={() =>
                        setEditForm((prev) => ({
                          ...prev,
                          skill: level
                        }))
                      }
                      disabled={isPlaying}
                      className={`rounded-full px-3 sm:px-4 py-1.5 sm:py-2 text-[10px] sm:text-xs font-semibold uppercase tracking-wide transition ${
                        editForm.skill === level
                          ? 'bg-emerald-500/90 text-white shadow-lg shadow-emerald-500/40'
                          : 'border border-white/15 bg-white/5 text-white/70 hover:bg-white/10'
                      } ${isPlaying ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
                {isPlaying && (
                  <p className="mt-1.5 text-xs text-white/60">Skill level cannot be edited while playing.</p>
                )}
              </div>

              <div>
                <span className="mb-2 block text-xs sm:text-sm font-medium text-white/80">Sex</span>
                <div className="flex gap-2">
                  {(['male', 'female'] as PlayerSex[]).map((sex) => (
                    <button
                      key={`edit-sex-${sex}`}
                      type="button"
                      onClick={() =>
                        setEditForm((prev) => ({
                          ...prev,
                          sex
                        }))
                      }
                      disabled={isPlaying}
                      className={`rounded-full px-3 sm:px-4 py-1.5 sm:py-2 text-[10px] sm:text-xs font-semibold uppercase tracking-wide transition ${
                        editForm.sex === sex
                          ? 'bg-indigo-500/90 text-white shadow-lg shadow-indigo-500/40'
                          : 'border border-white/15 bg-white/5 text-white/70 hover:bg-white/10'
                      } ${isPlaying ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {sex === 'male' ? 'Male' : 'Female'}
                    </button>
                  ))}
                </div>
                {isPlaying && (
                  <p className="mt-1.5 text-xs text-white/60">Gender cannot be edited while playing.</p>
                )}
              </div>
            </div>

            <div className="mt-5 sm:mt-6 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => setPlayerToEdit(null)}
                disabled={isUpdatingPlayer}
                className="rounded-full bg-white/10 px-4 sm:px-5 py-2 text-xs sm:text-sm font-semibold text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleUpdatePlayer()}
                disabled={isUpdatingPlayer}
                className="rounded-full bg-[#1f49ff] px-4 sm:px-5 py-2 text-xs sm:text-sm font-semibold text-white shadow-lg shadow-blue-900/40 transition hover:bg-[#2b57ff] disabled:cursor-not-allowed disabled:bg-[#1f49ff]/60"
              >
                {isUpdatingPlayer ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </div>
        </div>
        )
      })()}

      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-2 sm:p-4 pt-20 sm:items-center sm:pt-4 backdrop-blur-sm">
          <div className="relative w-full max-w-5xl rounded-2xl sm:rounded-3xl border border-white/10 bg-[#11050b] p-3 sm:p-4 md:p-6 text-white shadow-[0_40px_80px_rgba(0,0,0,0.45)] max-h-[calc(90vh-4rem)] sm:max-h-[calc(90vh-6rem)] overflow-y-auto">
            <button
              type="button"
              onClick={() => setShowHistoryModal(false)}
              className="absolute right-3 top-3 sm:right-5 sm:top-5 inline-flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white/80 transition hover:bg-white/20 hover:text-white z-10"
              aria-label="Close history"
            >
              ✕
            </button>
            <div className="space-y-3 sm:space-y-4 pr-8 sm:pr-2 md:pr-6 pt-1 sm:pt-2">
              <div className="flex flex-col gap-2">
                <div className="flex flex-col sm:flex-row items-start justify-between gap-3 sm:gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg sm:text-xl md:text-2xl font-semibold text-white">Players History</h3>
                    <p className="text-xs sm:text-sm text-white/70 mt-1">
                      Select a date to review who entered the queue on that day. History is limited to the 5 most recent dates.
                    </p>
                  </div>
                  {historyDates.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowClearHistoryConfirm(true)}
                      disabled={isClearingHistory}
                      className="rounded-full border border-red-500/50 bg-red-500/20 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-red-300 transition hover:bg-red-500/30 disabled:cursor-not-allowed disabled:opacity-50 whitespace-nowrap flex-shrink-0"
                    >
                      {isClearingHistory ? 'Clearing...' : 'Clear History'}
                    </button>
                  )}
                </div>
              </div>
              {historyDates.length === 0 ? (
                <div className="rounded-xl sm:rounded-2xl border border-white/10 bg-white/[0.05] px-4 sm:px-6 py-6 sm:py-8 text-center text-xs sm:text-sm text-white/70">
                  No player history recorded yet.
                </div>
              ) : (
                <div className="grid gap-4 sm:gap-6 min-h-[20rem] sm:min-h-[24rem] grid-cols-1 lg:grid-cols-[minmax(0,220px)_1fr]">
                  <div className="overflow-hidden rounded-xl sm:rounded-2xl border border-white/10 bg-white/[0.07]">
                    <div className="max-h-[40vh] sm:max-h-[50vh] overflow-y-auto">
                      <table className="min-w-full divide-y divide-white/10 text-xs sm:text-sm text-white/80">
                      <thead className="bg-white/10 uppercase tracking-wide text-white/60">
                        <tr>
                          <th className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 text-left font-semibold text-[10px] sm:text-xs">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/10">
                        {historyDates.map((date) => {
                          const isActive = date === selectedHistoryDate
                          const formattedDate = new Date(date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })
                          return (
                            <tr
                              key={`history-date-${date}`}
                              className={`cursor-pointer transition ${
                                isActive ? 'bg-indigo-500/20 text-white' : 'hover:bg-white/10'
                              }`}
                              onClick={() => setSelectedHistoryDate(date)}
                            >
                              <td className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 font-semibold text-xs sm:text-sm">{formattedDate}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                      </table>
                    </div>
                  </div>
                  <div className="flex min-h-[16rem] sm:min-h-[18rem] h-full flex-col overflow-hidden rounded-xl sm:rounded-2xl border border-white/10 bg-white/[0.07]">
                    <div className="border-b border-white/10 px-3 sm:px-4 md:px-6 py-3 sm:py-4">
                      <h4 className="text-sm sm:text-base font-semibold text-white">
                        {selectedHistoryDate
                          ? new Date(selectedHistoryDate).toLocaleDateString('en-US', {
                              month: 'long',
                              day: 'numeric',
                              year: 'numeric'
                            })
                          : 'Select a date'}
                      </h4>
                      {selectedHistoryDate && (
                        <p className="text-[10px] sm:text-xs text-white/60 mt-1">
                          {historyPlayersForSelectedDate.length} player
                          {historyPlayersForSelectedDate.length === 1 ? '' : 's'}
                        </p>
                      )}
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="min-w-full w-full divide-y divide-white/10 text-xs sm:text-sm text-white/80">
                        <thead className="bg-white/10 uppercase tracking-wide text-white/60">
                          <tr>
                            <th className="px-2 sm:px-3 md:px-4 lg:px-6 py-2 sm:py-3 text-left font-semibold text-[10px] sm:text-xs">
                              <div className="relative inline-flex items-center gap-1.5 sm:gap-2" ref={historySortMenuRef}>
                                <button
                                  type="button"
                                  onClick={() => setIsHistorySortMenuOpen((prev) => !prev)}
                                  className="inline-flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white/70 transition hover:bg-white/20 hover:text-white"
                                  aria-label="Change history sort order"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3 sm:h-4 sm:w-4">
                                    <path d="M6.75 3a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5zM4 7.25A1.25 1.25 0 015.25 6h9.5A1.25 1.25 0 0116 7.25v.5A1.25 1.25 0 0114.75 9h-9.5A1.25 1.25 0 014 7.75v-.5zm2.75 3.25a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5zM4 14.25A1.25 1.25 0 015.25 13h9.5A1.25 1.25 0 0116 14.25v.5A1.25 1.25 0 0114.75 16h-9.5A1.25 1.25 0 014 14.75v-.5z" />
                                  </svg>
                                </button>
                                <span className="text-[10px] sm:text-xs md:text-sm">Name</span>
                                {isHistorySortMenuOpen && (
                                  <div className="absolute left-0 top-full z-20 mt-2 w-40 sm:w-44 overflow-hidden rounded-xl sm:rounded-2xl border border-white/15 bg-[#11050b] shadow-[0_20px_40px_rgba(0,0,0,0.45)]">
                                    <ul className="py-1">
                                      {historySortOptions.map((option) => {
                                        const isActive = option.value === historySortBy
                                        return (
                                          <li key={option.value}>
                                            <button
                                              type="button"
                                              onClick={() => {
                                                setHistorySortBy(option.value)
                                                setIsHistorySortMenuOpen(false)
                                              }}
                                              className={`flex w-full items-center justify-between px-3 sm:px-4 py-1.5 sm:py-2 text-[10px] sm:text-xs font-semibold uppercase tracking-wide transition ${
                                                isActive
                                                  ? 'bg-indigo-500/90 text-white shadow-[0_12px_20px_rgba(99,102,241,0.35)]'
                                                  : 'text-white/70 hover:bg-white/10 hover:text-white'
                                              }`}
                                            >
                                              {option.label}
                                              {isActive && (
                                                <svg
                                                  xmlns="http://www.w3.org/2000/svg"
                                                  viewBox="0 0 20 20"
                                                  fill="currentColor"
                                                  className="h-3 w-3 sm:h-4 sm:w-4 shrink-0 text-white"
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
                            <th className="px-2 sm:px-3 md:px-4 lg:px-6 py-2 sm:py-3 text-left font-semibold text-[10px] sm:text-xs">Skill Level</th>
                            <th className="px-2 sm:px-3 md:px-4 lg:px-6 py-2 sm:py-3 text-center font-semibold text-[10px] sm:text-xs">Games Played</th>
                            <th className="px-2 sm:px-3 md:px-4 lg:px-6 py-2 sm:py-3 text-left font-semibold text-[10px] sm:text-xs">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/10">
                          {selectedHistoryDate && paginatedHistoryPlayers.length > 0 ? (
                            paginatedHistoryPlayers.map((player) => {
                              return (
                                <tr key={`history-${player.id}`} className="transition hover:bg-white/10">
                                  <td className="px-2 sm:px-3 md:px-4 lg:px-6 py-2 sm:py-3 font-semibold text-white">
                                    <div className="flex items-center gap-2 sm:gap-3">
                                      <span
                                        className={`inline-flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-full bg-white/10 text-xs shadow-inner flex-shrink-0 ${
                                          player.sex === 'male'
                                            ? 'bg-sky-500/15 text-sky-300'
                                            : 'bg-pink-500/15 text-pink-300'
                                        }`}
                                        aria-label={player.sex === 'male' ? 'Male player' : 'Female player'}
                                        title={player.sex === 'male' ? 'Male player' : 'Female player'}
                                      >
                                        {player.sex === 'male' ? (
                                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3 sm:h-3.5 sm:w-3.5">
                                            <path d="M13.5 2a.75.75 0 000 1.5h1.69l-3.2 3.2a4.5 4.5 0 10.884.884l3.2-3.2V6.5a.75.75 0 001.5 0V2.75A.75.75 0 0016.75 2H13.5zm-4 5a3 3 0 110 6 3 3 0 010-6z" />
                                          </svg>
                                        ) : (
                                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3 sm:h-3.5 sm:w-3.5">
                                            <path d="M10 2a4.5 4.5 0 10.878 8.9l-.378.378H8.75a.75.75 0 000 1.5h1.25v1.25a.75.75 0 001.5 0V12.78l.378-.378A4.5 4.5 0 0010 2zm0 1.5a3 3 0 110 6 3 3 0 010-6z" />
                                          </svg>
                                        )}
                                      </span>
                                      <span className="truncate text-xs sm:text-sm">{player.name}</span>
                                    </div>
                                  </td>
                                  <td className="px-2 sm:px-3 md:px-4 lg:px-6 py-2 sm:py-3 font-medium capitalize text-xs sm:text-sm">
                                    {player.skill.toLowerCase()}
                                  </td>
                                  <td className="px-2 sm:px-3 md:px-4 lg:px-6 py-2 sm:py-3 text-center font-semibold text-indigo-200 text-xs sm:text-sm">
                                    {player.gamesPlayed}
                                  </td>
                                  <td className="px-2 sm:px-3 md:px-4 lg:px-6 py-2 sm:py-3">
                                    <button
                                      type="button"
                                      onClick={() => handleImportHistoryPlayer(player)}
                                      className="inline-flex items-center justify-center rounded-full border border-indigo-400/40 bg-indigo-500/10 px-2.5 sm:px-3 md:px-4 py-1 sm:py-1.5 text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-indigo-100 transition hover:bg-indigo-500/20 whitespace-nowrap"
                                    >
                                      Get
                                    </button>
                                  </td>
                                </tr>
                              )
                            })
                          ) : (
                            <tr>
                              <td colSpan={4} className="px-3 sm:px-4 md:px-6 py-4 sm:py-6 text-center text-xs sm:text-sm text-white/60">
                                {selectedHistoryDate ? 'No players recorded for this date.' : 'Select a date to view its players.'}
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                      </div>
                    </div>
                    {selectedHistoryDate && historyPlayersForSelectedDate.length > HISTORY_PLAYERS_PER_PAGE && (
                      <div className="border-t border-white/10 px-3 sm:px-4 md:px-6 py-3 sm:py-4 flex flex-col gap-2 sm:gap-3 sm:flex-row sm:items-center sm:justify-between text-xs sm:text-sm">
                        <span className="text-white/70 text-center sm:text-left">
                          Showing {(safeHistoryPage - 1) * HISTORY_PLAYERS_PER_PAGE + 1}-
                          {Math.min(historyPlayersForSelectedDate.length, safeHistoryPage * HISTORY_PLAYERS_PER_PAGE)} of{' '}
                          {historyPlayersForSelectedDate.length} players
                        </span>
                        <div className="flex items-center justify-center gap-2 sm:gap-3">
                          <button
                            type="button"
                            onClick={() => setHistoryPage((prev) => Math.max(1, prev - 1))}
                            disabled={safeHistoryPage === 1}
                            className="inline-flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full border border-white/20 bg-white/5 text-white/80 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                            aria-label="Previous history page"
                          >
                            ‹
                          </button>
                          <span className="text-white/80 text-xs sm:text-sm whitespace-nowrap">
                            Page {safeHistoryPage} of {historyTotalPages}
                          </span>
                          <button
                            type="button"
                            onClick={() => setHistoryPage((prev) => Math.min(historyTotalPages, prev + 1))}
                            disabled={safeHistoryPage === historyTotalPages}
                            className="inline-flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full border border-white/20 bg-white/5 text-white/80 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                            aria-label="Next history page"
                          >
                            ›
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </QueueingShell>
  )
}


