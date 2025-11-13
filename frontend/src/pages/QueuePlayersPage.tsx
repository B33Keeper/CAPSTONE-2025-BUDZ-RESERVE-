import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { QueueingShell } from '@/components/QueueingShell'
import { apiServices, QueuePlayer } from '@/lib/apiServices'
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
      <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-white/60">{label}</label>
      <button
        type="button"
        className="flex w-full items-center justify-between rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-white outline-none transition focus:border-white/30 focus:bg-white/10"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <span className="truncate">{selectedOption?.label}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className={`h-5 w-5 text-white/70 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
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

  useEffect(() => {
    void loadPlayers()
  }, [loadPlayers])

  const todayISODate = new Date().toISOString().slice(0, 10)

  const todaysPlayers = useMemo(() => {
    return players.filter((player) => {
      if (!player.lastPlayed) return true
      return player.lastPlayed.slice(0, 10) === todayISODate
    })
  }, [players, todayISODate])

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
  }, [players, searchQuery, sortBy])

  const historyByDate = useMemo(() => {
    return players.reduce((acc, player) => {
      if (!player.lastPlayed) {
        return acc
      }
      const dateKey = player.lastPlayed.slice(0, 10)
      if (dateKey >= todayISODate) {
        return acc
      }
      if (!acc[dateKey]) {
        acc[dateKey] = []
      }
      acc[dateKey].push(player)
      return acc
    }, {} as Record<string, QueuePlayer[]>)
  }, [players, todayISODate])

  const historyDates = useMemo(() => {
    return Object.keys(historyByDate).sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
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

  const handleAddPlayer = async () => {
    const trimmedName = playerName.trim()
    if (!trimmedName || isAddingPlayer) {
      return
    }

    if (!selectedSex || !selectedSkill) {
      setPlayersError('Please choose both sex and skill level before adding a player.')
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
        lastPlayed: new Date().toISOString().slice(0, 10)
      }
      const createdPlayer = await apiServices.createQueuePlayer(payload)
      setPlayers((prev) => [...prev, createdPlayer])
      setPlayerName('')
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
      setPlayers((prev) => prev.filter((player) => player.id !== playerId))
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
  }, [])

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
    async (player: QueuePlayer) => {
      const alreadyInQueue = todaysPlayers.some(
        (existing) => existing.name.toLowerCase() === player.name.toLowerCase()
      )

      if (alreadyInQueue) {
        toast('Player is already in today’s queue.')
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

    const trimmedName = editForm.name.trim()
    if (!trimmedName) {
      setPlayersError('Player name cannot be empty.')
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
  }, [editForm.name, editForm.sex, editForm.skill, isUpdatingPlayer, playerToEdit])

  return (
    <QueueingShell activeTab="players">
      <section className="rounded-3xl border border-white/10 bg-white/[0.08] p-5 shadow-2xl shadow-black/30 backdrop-blur-lg sm:p-6">
        <div className="space-y-6">
          <div className="space-y-3">
            <h2 className="text-center text-xl font-semibold text-white">Enter Player</h2>
            <input
              type="text"
              placeholder="Enter player name"
              value={playerName}
              onChange={(event) => setPlayerName(event.target.value)}
              className="w-full rounded-2xl border border-white/12 bg-white/10 px-5 py-3 text-sm text-white placeholder:text-white/40 outline-none transition focus:border-white/40 focus:bg-white/15"
            />
          </div>

          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between md:gap-10">
            <div className="flex w-full flex-col gap-6 md:flex-row md:items-start md:justify-center md:gap-10">
              <div className="flex flex-col items-center gap-3">
                <span className="text-xs font-semibold uppercase tracking-wide text-white/70">Sex</span>
                <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
                  <button
                    type="button"
                onClick={() => setSelectedSex('male')}
                className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
                  selectedSex === 'male'
                    ? 'bg-indigo-500/90 text-white shadow-lg shadow-indigo-500/40'
                    : 'bg-white/10 text-white/80 hover:bg-white/15'
                }`}
                  >
                    Male
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedSex('female')}
                    className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
                  selectedSex === 'female'
                    ? 'bg-indigo-500/90 text-white shadow-lg shadow-indigo-500/40'
                    : 'bg-white/10 text-white/80 hover:bg-white/15'
                }`}
                  >
                    Female
                  </button>
                </div>
              </div>

              <div className="flex flex-col items-center gap-3 text-center">
                <span className="text-xs font-semibold uppercase tracking-wide text-white/70">Skill Level</span>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  {skillLevels.map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setSelectedSkill(level)}
                      className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
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
              <span className="text-xs font-semibold uppercase tracking-wide text-white/70">Actions</span>
              <button
                type="button"
                onClick={handleAddPlayer}
                disabled={isAddingPlayer || !playerName.trim() || !selectedSex || !selectedSkill}
                className={`inline-flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-2xl px-6 py-3 text-sm font-semibold text-white shadow-[0_20px_35px_rgba(31,73,255,0.35)] transition sm:w-auto ${
                  isAddingPlayer || !playerName.trim() || !selectedSex || !selectedSkill
                    ? 'bg-[#1f49ff]/50 cursor-not-allowed opacity-70'
                    : 'bg-[#1f49ff] hover:-translate-y-0.5 hover:bg-[#2b57ff]'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                  <path d="M10 10a4 4 0 100-8 4 4 0 000 8zM2 17a6 6 0 1112 0H2zm13.25-7.75a.75.75 0 00-1.5 0V11h-1.75a.75.75 0 000 1.5h1.75v1.75a.75.75 0 001.5 0V12.5H17a.75.75 0 000-1.5h-1.75V9.25z" />
                </svg>
                Add Player
              </button>
            </div>
          </div>
        </div>
      </section>
      <section className="rounded-3xl border border-white/10 bg-white/[0.05] shadow-2xl shadow-black/30 backdrop-blur-lg">
        <div className="border-b border-white/10 px-4 py-5 sm:px-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-end justify-center gap-4 text-center md:justify-start">
              <div className="relative w-full max-w-sm sm:max-w-xs sm:w-64 text-left">
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-white/60">Search Players</label>
                <input
                  type="text"
                  placeholder="Search players"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="w-full rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm text-white placeholder:text-white/40 outline-none transition focus:border-white/30 focus:bg-white/10"
                />
                <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-base text-white/40">
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
                <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-white/60">Action</span>
                <button
                  type="button"
                  className="w-full rounded-full bg-[#1f49ff] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_20px_35px_rgba(31,73,255,0.35)] transition hover:-translate-y-0.5 hover:bg-[#2b57ff] md:w-auto"
                >
                  Generate Matches
                </button>
              </div>

              <div className="flex w-full flex-col items-start md:ml-auto md:w-auto">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-white/60">History</span>
                <button
                  type="button"
                  onClick={() => setShowHistoryModal(true)}
                  className="w-full rounded-full border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-white/15 md:w-auto"
                >
                  Players History
                </button>
              </div>
            </div>
            {playersError && (
              <p className="text-center text-sm font-medium text-red-300 md:text-left">{playersError}</p>
            )}
          </div>
        </div>

        <div className="overflow-hidden px-4 pb-6 sm:px-6">
          <div className="overflow-x-auto rounded-3xl border border-white/10 bg-white/[0.07]">
            <table className="min-w-full divide-y divide-white/10 text-sm text-white/80">
              <thead className="bg-white/8 text-left uppercase tracking-wide text-white/60">
                <tr>
                  <th className="px-6 py-3 font-semibold">
                    <div ref={sortMenuRef} className="relative flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsSortMenuOpen((prev) => !prev)}
                        className={`rounded-full border border-white/10 bg-white/5 p-1.5 text-white/70 transition hover:border-white/30 hover:text-white ${isSortMenuOpen ? 'border-white/40 text-white' : ''}`}
                        aria-haspopup="listbox"
                        aria-expanded={isSortMenuOpen}
                        aria-label="Sort players"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                          <path d="M2.75 5.5a.75.75 0 01.75-.75h13a.75.75 0 010 1.5h-13a.75.75 0 01-.75-.75zM5 10a.75.75 0 01.75-.75h9.5a.75.75 0 010 1.5h-9.5A.75.75 0 015 10zm3 4.5a.75.75 0 01.75-.75h6.5a.75.75 0 010 1.5h-6.5A.75.75 0 018 14.5z" />
                        </svg>
                      </button>
                      <span className={`${sortBy === 'name' ? 'text-white' : 'text-white/80'}`}>Name</span>
                      {isSortMenuOpen && (
                        <div className="absolute left-0 top-full z-30 mt-3 w-48 overflow-hidden rounded-2xl border border-white/10 bg-slate-950/95 shadow-2xl shadow-black/40 backdrop-blur">
                          <ul className="max-h-64 overflow-y-auto py-2" role="listbox">
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
                                    className={`flex w-full items-center justify-between gap-3 px-4 py-2 text-sm transition ${
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
                  <th className={`px-6 py-3 font-semibold ${sortBy === 'skill' ? 'text-white' : ''}`}>Skill Level</th>
                  <th className={`px-6 py-3 font-semibold ${sortBy === 'games' ? 'text-white' : ''}`}>Games Played</th>
                  <th className={`px-6 py-3 font-semibold ${sortBy === 'status' ? 'text-white' : ''}`}>Status</th>
                  <th className={`px-6 py-3 text-right font-semibold ${sortBy === 'action' ? 'text-white' : ''}`}>Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/8">
                {playersLoading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-6 text-center text-sm text-white/60">
                      Loading players...
                    </td>
                  </tr>
                ) : filteredPlayers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-6 text-center text-sm text-white/60">
                      No players found.
                    </td>
                  </tr>
                ) : (
                  filteredPlayers.map((player) => (
                    <tr key={player.id} className="transition-colors hover:bg-white/10">
                      <td className="px-6 py-4 font-semibold text-white">
                        <div className="flex items-center gap-3">
                          <span
                            className={`inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-sm shadow-inner ${
                              player.sex === 'male' ? 'text-sky-300 bg-sky-500/15' : 'text-pink-300 bg-pink-500/15'
                            }`}
                            aria-label={player.sex === 'male' ? 'Male player' : 'Female player'}
                            title={player.sex === 'male' ? 'Male player' : 'Female player'}
                          >
                            {player.sex === 'male' ? (
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                                <path d="M13.5 2a.75.75 0 000 1.5h1.69l-3.2 3.2a4.5 4.5 0 10.884.884l3.2-3.2V6.5a.75.75 0 001.5 0V2.75A.75.75 0 0016.75 2H13.5zm-4 5a3 3 0 110 6 3 3 0 010-6z" />
                              </svg>
                            ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                                <path d="M10 2a4.5 4.5 0 10.878 8.9l-.378.378H8.75a.75.75 0 000 1.5h1.25v1.25a.75.75 0 001.5 0V12.78l.378-.378A4.5 4.5 0 0010 2zm0 1.5a3 3 0 110 6 3 3 0 010-6z" />
                              </svg>
                            )}
                          </span>
                          <span>{player.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
                          <span>{player.skill}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">{player.gamesPlayed}</td>
                      <td className="px-6 py-4">
                        <span className="rounded-full border border-purple-400/50 bg-purple-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-purple-200">
                          {player.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(player)}
                            className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white/80 transition hover:border-blue-300 hover:bg-blue-500/20 hover:text-blue-100"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => setPlayerToDelete({ id: player.id, name: player.name })}
                            disabled={deletingPlayerIds.has(player.id)}
                            className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-wide transition ${
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
        </div>
      </section>

      {playerToDelete && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-sm rounded-2xl border border-white/15 bg-[#11050b] p-6 text-center shadow-[0_30px_60px_rgba(0,0,0,0.5)]">
            <h3 className="text-lg font-semibold text-white">Remove player?</h3>
            <p className="mt-2 text-sm text-white/70">
              This will remove <span className="font-semibold text-white">{playerToDelete.name}</span> from the queue.
            </p>
            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setPlayerToDelete(null)}
                disabled={deletingSelectedPlayer}
                className="rounded-full bg-white/10 px-5 py-2 text-sm font-semibold text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void confirmDeletePlayer()}
                disabled={deletingSelectedPlayer}
                className="rounded-full bg-rose-500 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-rose-900/30 transition hover:bg-rose-500/90 disabled:cursor-not-allowed disabled:bg-rose-500/60"
              >
                {deletingSelectedPlayer ? 'Removing…' : 'Remove'}
              </button>
            </div>
          </div>
        </div>
      )}

      {playerToEdit && (
        <div className="fixed inset-0 z-[65] flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-md rounded-2xl border border-white/15 bg-[#11050b] p-6 shadow-[0_30px_60px_rgba(0,0,0,0.5)]">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">Edit player</h3>
                <p className="mt-1 text-sm text-white/70">Update the player details for the queue.</p>
              </div>
              <button
                type="button"
                onClick={() => setPlayerToEdit(null)}
                disabled={isUpdatingPlayer}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white/70 transition hover:bg-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                aria-label="Close edit"
              >
                ✕
              </button>
            </div>

            <div className="mt-6 space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-white/80">Player name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(event) =>
                    setEditForm((prev) => ({
                      ...prev,
                      name: event.target.value
                    }))
                  }
                  className="w-full rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-sm text-white outline-none transition focus:border-white/40 focus:bg-white/15"
                />
              </div>

              <div>
                <span className="mb-2 block text-sm font-medium text-white/80">Skill level</span>
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
                      className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wide transition ${
                        editForm.skill === level
                          ? 'bg-emerald-500/90 text-white shadow-lg shadow-emerald-500/40'
                          : 'border border-white/15 bg-white/5 text-white/70 hover:bg-white/10'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="mb-2 block text-sm font-medium text-white/80">Sex</span>
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
                      className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wide transition ${
                        editForm.sex === sex
                          ? 'bg-indigo-500/90 text-white shadow-lg shadow-indigo-500/40'
                          : 'border border-white/15 bg-white/5 text-white/70 hover:bg-white/10'
                      }`}
                    >
                      {sex === 'male' ? 'Male' : 'Female'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setPlayerToEdit(null)}
                disabled={isUpdatingPlayer}
                className="rounded-full bg-white/10 px-5 py-2 text-sm font-semibold text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleUpdatePlayer()}
                disabled={isUpdatingPlayer}
                className="rounded-full bg-[#1f49ff] px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-900/40 transition hover:bg-[#2b57ff] disabled:cursor-not-allowed disabled:bg-[#1f49ff]/60"
              >
                {isUpdatingPlayer ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-4xl rounded-3xl border border-white/10 bg-[#11050b] p-6 text-white shadow-[0_40px_80px_rgba(0,0,0,0.45)]">
            <button
              type="button"
              onClick={() => setShowHistoryModal(false)}
              className="absolute right-5 top-5 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white/80 transition hover:bg-white/20 hover:text-white"
              aria-label="Close history"
            >
              ✕
            </button>
            <div className="space-y-4 pr-10 sm:pr-12 pt-2">
              <div className="flex flex-col gap-2">
                <h3 className="text-2xl font-semibold text-white">Players History</h3>
                <p className="text-sm text-white/70">
                  Select a date to review who entered the queue on that day.
                </p>
              </div>
              {historyDates.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-white/[0.05] px-6 py-8 text-center text-sm text-white/70">
                  No player history recorded yet.
                </div>
              ) : (
                <div className="grid gap-6 lg:grid-cols-[minmax(0,220px)_1fr] min-h-[24rem]">
                  <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.07]">
                    <table className="min-w-full divide-y divide-white/10 text-sm text-white/80">
                      <thead className="bg-white/10 uppercase tracking-wide text-white/60">
                        <tr>
                          <th className="px-4 py-3 text-left font-semibold sm:px-6">Date</th>
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
                              <td className="px-4 py-3 font-semibold sm:px-6">{formattedDate}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex min-h-[18rem] h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.07]">
                    <div className="border-b border-white/10 px-6 py-4">
                      <h4 className="text-base font-semibold text-white">
                        {selectedHistoryDate
                          ? new Date(selectedHistoryDate).toLocaleDateString('en-US', {
                              month: 'long',
                              day: 'numeric',
                              year: 'numeric'
                            })
                          : 'Select a date'}
                      </h4>
                      {selectedHistoryDate && (
                        <p className="text-xs text-white/60">
                          {historyByDate[selectedHistoryDate]?.length ?? 0} player
                          {((historyByDate[selectedHistoryDate]?.length ?? 0) === 1 ? '' : 's')}
                        </p>
                      )}
                    </div>
                    <div className="flex-1 overflow-auto">
                      <table className="min-w-full w-full divide-y divide-white/10 text-sm text-white/80">
                        <thead className="bg-white/10 uppercase tracking-wide text-white/60">
                          <tr>
                            <th className="px-4 py-3 text-left font-semibold sm:px-6">
                              <div className="relative inline-flex items-center gap-2" ref={historySortMenuRef}>
                                <button
                                  type="button"
                                  onClick={() => setIsHistorySortMenuOpen((prev) => !prev)}
                                  className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white/70 transition hover:bg-white/20 hover:text-white"
                                  aria-label="Change history sort order"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                                    <path d="M6.75 3a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5zM4 7.25A1.25 1.25 0 015.25 6h9.5A1.25 1.25 0 0116 7.25v.5A1.25 1.25 0 0114.75 9h-9.5A1.25 1.25 0 014 7.75v-.5zm2.75 3.25a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5zM4 14.25A1.25 1.25 0 015.25 13h9.5A1.25 1.25 0 0116 14.25v.5A1.25 1.25 0 0114.75 16h-9.5A1.25 1.25 0 014 14.75v-.5z" />
                                  </svg>
                                </button>
                                <span>Name</span>
                                {isHistorySortMenuOpen && (
                                  <div className="absolute left-0 top-full z-20 mt-2 w-44 overflow-hidden rounded-2xl border border-white/15 bg-[#11050b] shadow-[0_20px_40px_rgba(0,0,0,0.45)]">
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
                                              className={`flex w-full items-center justify-between px-4 py-2 text-xs font-semibold uppercase tracking-wide transition ${
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
                            <th className="px-4 py-3 text-left font-semibold sm:px-6">Skill Level</th>
                            <th className="px-4 py-3 text-center font-semibold sm:px-6">Games Played</th>
                            <th className="px-4 py-3 text-left font-semibold sm:px-6">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/10">
                          {selectedHistoryDate && historyPlayersForSelectedDate.length > 0 ? (
                            historyPlayersForSelectedDate.map((player) => {
                              return (
                                <tr key={`history-${player.id}`} className="transition hover:bg-white/10">
                                  <td className="px-4 py-3 font-semibold text-white sm:px-6">
                                    <div className="flex items-center gap-3">
                                      <span
                                        className={`inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-xs shadow-inner ${
                                          player.sex === 'male'
                                            ? 'bg-sky-500/15 text-sky-300'
                                            : 'bg-pink-500/15 text-pink-300'
                                        }`}
                                        aria-label={player.sex === 'male' ? 'Male player' : 'Female player'}
                                        title={player.sex === 'male' ? 'Male player' : 'Female player'}
                                      >
                                        {player.sex === 'male' ? (
                                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                                            <path d="M13.5 2a.75.75 0 000 1.5h1.69l-3.2 3.2a4.5 4.5 0 10.884.884l3.2-3.2V6.5a.75.75 0 001.5 0V2.75A.75.75 0 0016.75 2H13.5zm-4 5a3 3 0 110 6 3 3 0 010-6z" />
                                          </svg>
                                        ) : (
                                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                                            <path d="M10 2a4.5 4.5 0 10.878 8.9l-.378.378H8.75a.75.75 0 000 1.5h1.25v1.25a.75.75 0 001.5 0V12.78l.378-.378A4.5 4.5 0 0010 2zm0 1.5a3 3 0 110 6 3 3 0 010-6z" />
                                          </svg>
                                        )}
                                      </span>
                                      <span>{player.name}</span>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 sm:px-6">{player.skill}</td>
                                  <td className="px-4 py-3 text-center sm:px-6">{player.gamesPlayed}</td>
                                  <td className="px-4 py-3 sm:px-6">
                                    <button
                                      type="button"
                                      onClick={() => handleImportHistoryPlayer(player)}
                                      className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-white/80 transition hover:-translate-y-0.5 hover:bg-white/15 hover:text-white"
                                    >
                                      Get
                                    </button>
                                  </td>
                                </tr>
                              )
                            })
                          ) : (
                            <tr>
                              <td colSpan={4} className="px-4 py-6 text-center text-sm text-white/60 sm:px-6">
                                {selectedHistoryDate
                                  ? 'No players recorded for this date.'
                                  : 'Select a date to view its players.'}
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
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


