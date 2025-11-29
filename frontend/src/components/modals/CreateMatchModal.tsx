import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import toast from 'react-hot-toast'
import { apiServices, type QueuePlayer, type QueueMatchGameType, type QueueMatchPlayer, type QueueMatch } from '@/lib/apiServices'

interface CreateMatchModalProps {
  isOpen: boolean
  onClose: () => void
  courtId: number | null
  courtName: string | null
  onMatchCreated: () => void
}

const gameTypeOptions: { label: string; value: QueueMatchGameType }[] = [
  { label: "Men's Doubles", value: 'mens-doubles' },
  { label: "Women's Doubles", value: 'womens-doubles' },
  { label: 'Mixed Doubles', value: 'mixed-doubles' }
]

function SexBadge({ sex }: { sex: 'male' | 'female' }) {
  const baseClasses = 'flex h-4 w-4 sm:h-5 sm:w-5 items-center justify-center rounded-full shadow-inner flex-shrink-0'
  const variantClasses =
    sex === 'male'
      ? 'bg-sky-500/20 text-sky-300'
      : 'bg-pink-500/20 text-pink-300'

  return (
    <span className={`${baseClasses} ${variantClasses}`} aria-label={`${sex} player`}>
      {sex === 'male' ? (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-2.5 w-2.5 sm:h-3 sm:w-3">
          <path d="M13.5 2a.75.75 0 000 1.5h1.69l-3.2 3.2a4.5 4.5 0 10.884.884l3.2-3.2V6.5a.75.75 0 001.5 0V2.75A.75.75 0 0016.75 2H13.5zm-4 5a3 3 0 110 6 3 3 0 010-6z" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-2.5 w-2.5 sm:h-3 sm:w-3">
          <path d="M10 2a4.5 4.5 0 10.878 8.9l-.378.378H8.75a.75.75 0 000 1.5h1.25v1.25a.75.75 0 001.5 0V12.78l.378-.378A4.5 4.5 0 0010 2zm0 1.5a3 3 0 110 6 3 3 0 010-6z" />
        </svg>
      )}
    </span>
  )
}

function StatusBadge({ status }: { status: QueuePlayer['status'] }) {
  const statusConfig = {
    'In Queue': {
      label: 'Available',
      className: 'border-purple-400/50 bg-purple-500/10 text-purple-200'
    },
    'Waiting': {
      label: 'Waiting',
      className: 'border-amber-400/60 bg-amber-500/10 text-amber-200'
    },
    'In Match': {
      label: 'Playing',
      className: 'border-emerald-400/60 bg-emerald-500/15 text-emerald-200'
    }
  }

  const config = statusConfig[status] || statusConfig['In Queue']

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${config.className}`}
      title={status}
    >
      {config.label}
    </span>
  )
}

export function CreateMatchModal({ isOpen, onClose, courtId, courtName, onMatchCreated }: CreateMatchModalProps) {
  const [players, setPlayers] = useState<QueuePlayer[]>([])
  const [activeMatches, setActiveMatches] = useState<QueueMatch[]>([])
  const [pendingMatches, setPendingMatches] = useState<QueueMatch[]>([])
  const [loadingPlayers, setLoadingPlayers] = useState(false)
  const [gameType, setGameType] = useState<QueueMatchGameType>('mens-doubles')
  const [isGameTypeDropdownOpen, setIsGameTypeDropdownOpen] = useState(false)
  const [selectedTeamA, setSelectedTeamA] = useState<number[]>([])
  const [selectedTeamB, setSelectedTeamB] = useState<number[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const gameTypeDropdownRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (isOpen) {
      loadPlayers()
      loadMatches()
      // Reset form
      setGameType('mens-doubles')
      setSelectedTeamA([])
      setSelectedTeamB([])
      setSearchQuery('')
      setIsGameTypeDropdownOpen(false)
    }
  }, [isOpen])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (gameTypeDropdownRef.current && !gameTypeDropdownRef.current.contains(event.target as Node)) {
        setIsGameTypeDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const loadPlayers = async () => {
    setLoadingPlayers(true)
    try {
      const response = await apiServices.getQueuePlayers()
      // Show ALL players - no date filtering
      // Players remain in the queue after completing matches
      setPlayers(response)
    } catch (error) {
      console.error('Failed to load players', error)
      toast.error('Failed to load players')
    } finally {
      setLoadingPlayers(false)
    }
  }

  const loadMatches = async () => {
    try {
      const [activeResponse, pendingResponse] = await Promise.all([
        apiServices.getQueueMatches({ status: 'active' }),
        apiServices.getQueueMatches({ status: 'pending' })
      ])
      setActiveMatches(activeResponse)
      setPendingMatches(pendingResponse)
    } catch (error) {
      console.error('Failed to load matches', error)
      // Don't show error toast - this is a background operation
    }
  }

  // Skill level order for sorting
  const skillOrder = { Advanced: 1, Intermediate: 2, Beginner: 3 }

  // Calculate real-time player status based on matches
  const playersWithRealTimeStatus = useMemo(() => {
    // Get all player IDs in active matches (playing)
    const playersInActiveMatches = new Set<number>()
    activeMatches.forEach((match) => {
      match.teamA.forEach((p) => playersInActiveMatches.add(p.id))
      match.teamB.forEach((p) => playersInActiveMatches.add(p.id))
    })

    // Get all player IDs in pending matches (waiting for match to start)
    const playersInPendingMatches = new Set<number>()
    pendingMatches.forEach((match) => {
      match.teamA.forEach((p) => playersInPendingMatches.add(p.id))
      match.teamB.forEach((p) => playersInPendingMatches.add(p.id))
    })

    // Update player status based on match data
    return players.map((player) => {
      let status: 'In Queue' | 'Waiting' | 'In Match' = 'Waiting' // Default to Waiting

      if (playersInActiveMatches.has(player.id)) {
        status = 'In Match' // Playing
      } else if (playersInPendingMatches.has(player.id)) {
        status = 'Waiting' // In a pending match, waiting for it to start
      } else {
        status = 'Waiting' // Not in any match - show as Waiting
      }

      return {
        ...player,
        status
      }
    })
  }, [players, activeMatches, pendingMatches])

  const filteredPlayers = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase()
    let filtered = playersWithRealTimeStatus

    // Filter by game type gender requirement
    if (gameType === 'mens-doubles') {
      filtered = filtered.filter((p) => p.sex === 'male')
    } else if (gameType === 'womens-doubles') {
      filtered = filtered.filter((p) => p.sex === 'female')
    }

    // Filter by search query
    if (normalizedQuery) {
      filtered = filtered.filter((p) => p.name.toLowerCase().includes(normalizedQuery))
    }

    // Sort by skill level first (Advanced > Intermediate > Beginner), then by name
    return filtered.sort((a, b) => {
      const skillDiff = (skillOrder[a.skill] || 999) - (skillOrder[b.skill] || 999)
      if (skillDiff !== 0) return skillDiff
      return a.name.localeCompare(b.name)
    })
  }, [players, searchQuery, gameType])

  // Separate players by gender, already sorted by skill then name
  const malePlayers = useMemo(() => {
    return filteredPlayers.filter((p) => p.sex === 'male')
  }, [filteredPlayers])

  const femalePlayers = useMemo(() => {
    return filteredPlayers.filter((p) => p.sex === 'female')
  }, [filteredPlayers])

  // Group players by skill level for display
  const groupPlayersBySkill = useCallback((playerList: typeof filteredPlayers) => {
    const grouped: Record<string, typeof filteredPlayers> = {
      Advanced: [],
      Intermediate: [],
      Beginner: []
    }

    playerList.forEach((player) => {
      if (grouped[player.skill]) {
        grouped[player.skill].push(player)
      }
    })

    // Filter out empty groups
    return Object.entries(grouped).filter(([_, players]) => players.length > 0)
  }, [])

  const handlePlayerClick = (playerId: number, team: 'A' | 'B') => {
    if (team === 'A') {
      setSelectedTeamA((prev) => {
        if (prev.includes(playerId)) {
          return prev.filter((id) => id !== playerId)
        }
        if (prev.length >= 2) {
          toast.error('Team A can only have 2 players')
          return prev
        }
        // Check if player is already in Team B
        if (selectedTeamB.includes(playerId)) {
          toast.error('Player is already selected in Team B')
          return prev
        }
        return [...prev, playerId]
      })
    } else {
      setSelectedTeamB((prev) => {
        if (prev.includes(playerId)) {
          return prev.filter((id) => id !== playerId)
        }
        if (prev.length >= 2) {
          toast.error('Team B can only have 2 players')
          return prev
        }
        // Check if player is already in Team A
        if (selectedTeamA.includes(playerId)) {
          toast.error('Player is already selected in Team A')
          return prev
        }
        return [...prev, playerId]
      })
    }
  }

  const getSelectedPlayers = (teamIds: number[]): QueuePlayer[] => {
    return teamIds.map((id) => playersWithRealTimeStatus.find((p) => p.id === id)!).filter(Boolean)
  }

  const handleCreateMatch = async () => {
    if (selectedTeamA.length !== 2 || selectedTeamB.length !== 2) {
      toast.error('Each team must have exactly 2 players')
      return
    }

    const teamAPlayers = getSelectedPlayers(selectedTeamA)
    const teamBPlayers = getSelectedPlayers(selectedTeamB)

    // Validate mixed doubles
    if (gameType === 'mixed-doubles') {
      const teamAHasBoth = teamAPlayers.some((p) => p.sex === 'male') && teamAPlayers.some((p) => p.sex === 'female')
      const teamBHasBoth = teamBPlayers.some((p) => p.sex === 'male') && teamBPlayers.some((p) => p.sex === 'female')
      if (!teamAHasBoth || !teamBHasBoth) {
        toast.error('Mixed Doubles requires each team to have one male and one female player')
        return
      }
    }

    setIsCreating(true)
    try {
      const teamA: QueueMatchPlayer[] = teamAPlayers.map((p) => ({
        id: p.id,
        name: p.name,
        sex: p.sex,
        skill: p.skill
      }))
      const teamB: QueueMatchPlayer[] = teamBPlayers.map((p) => ({
        id: p.id,
        name: p.name,
        sex: p.sex,
        skill: p.skill
      }))

      await apiServices.createQueueMatch({
        gameType,
        courtId,
        teamA,
        teamB
      })

      toast.success('Match created successfully!')
      onMatchCreated()
      onClose()
    } catch (error: any) {
      console.error('Failed to create match', error)
      toast.error(error.response?.data?.message || 'Failed to create match')
    } finally {
      setIsCreating(false)
    }
  }

  if (!isOpen) return null

  const selectedTeamAPlayers = getSelectedPlayers(selectedTeamA)
  const selectedTeamBPlayers = getSelectedPlayers(selectedTeamB)

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/50 p-0 sm:p-2 md:p-4 overflow-y-auto pt-20 sm:pt-4 md:pt-4">
      <div className="w-full h-full sm:h-auto sm:max-h-[95vh] sm:max-w-4xl lg:max-w-5xl xl:max-w-6xl rounded-none sm:rounded-2xl md:rounded-3xl border-0 sm:border border-white/10 bg-[#1a1a2e] shadow-2xl flex flex-col my-0 sm:my-auto">
        <div className="border-b border-white/10 px-3 sm:px-4 md:px-5 lg:px-6 py-2.5 sm:py-3 md:py-4 sticky top-0 sm:top-0 bg-[#1a1a2e] z-10 flex-shrink-0">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base sm:text-lg md:text-xl font-semibold text-white truncate flex-1">Create Match{courtName ? ` on ${courtName}` : ''}</h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 sm:p-2 text-white/60 transition hover:bg-white/10 hover:text-white flex-shrink-0"
              aria-label="Close modal"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 sm:h-5 sm:w-5">
                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-5 lg:p-6">
          <div className="mb-3 sm:mb-4 md:mb-6">
            <label className="mb-2 block text-xs sm:text-sm font-medium uppercase tracking-[0.3em] text-white/60">
              Game Type
            </label>
            <div className="relative" ref={gameTypeDropdownRef}>
              <button
                type="button"
                onClick={() => setIsGameTypeDropdownOpen((prev) => !prev)}
                className="flex w-full items-center justify-between rounded-xl sm:rounded-2xl border border-white/10 bg-gradient-to-r from-white/10 to-white/0 px-3 sm:px-4 py-2.5 sm:py-3 text-left text-white shadow-[0_18px_35px_rgba(5,5,32,0.35)] outline-none transition hover:border-white/30 focus-visible:ring-2 focus-visible:ring-[#5560ff]/50"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.3em] text-white/40">Selected</p>
                  <p className="text-sm sm:text-base font-semibold text-white truncate">
                    {gameTypeOptions.find((option) => option.value === gameType)?.label || 'Select game type'}
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
                  className={`h-4 w-4 sm:h-5 sm:w-5 text-white/70 transition-transform flex-shrink-0 ml-2 ${isGameTypeDropdownOpen ? 'rotate-180' : ''}`}
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>

              {isGameTypeDropdownOpen && (
                <div className="absolute left-0 right-0 z-20 mt-2 sm:mt-3 overflow-hidden rounded-xl sm:rounded-2xl border border-white/10 bg-[#11142b]/95 shadow-[0_25px_50px_rgba(0,0,0,0.5)] backdrop-blur-xl">
                  <div className="divide-y divide-white/5">
                    {gameTypeOptions.map((option) => {
                      const isActive = option.value === gameType
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => {
                            setGameType(option.value)
                            setSelectedTeamA([])
                            setSelectedTeamB([])
                            setIsGameTypeDropdownOpen(false)
                          }}
                          className={`flex w-full items-center justify-between px-4 sm:px-5 py-2.5 sm:py-3 text-left text-xs sm:text-sm font-medium transition ${
                            isActive
                              ? 'bg-[#273373]/60 text-white'
                              : 'text-white/70 hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          <span>{option.label}</span>
                          {isActive && (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                              className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#8ea2ff] flex-shrink-0"
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
          </div>

          <div className="mb-3 sm:mb-4 md:mb-6 grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 md:gap-4 lg:gap-6">
            <div>
              <h3 className="mb-2 sm:mb-3 text-xs sm:text-sm font-semibold text-white">Team A</h3>
              <div className="min-h-[70px] sm:min-h-[80px] rounded-lg border border-white/10 bg-white/5 p-2.5 sm:p-3">
                {selectedTeamAPlayers.length === 0 ? (
                  <p className="text-center text-xs sm:text-sm text-white/40">Select 2 players</p>
                ) : (
                  <div className="flex flex-col gap-1.5 sm:gap-2">
                    {selectedTeamAPlayers.map((player) => (
                      <div key={player.id} className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-white">
                        <SexBadge sex={player.sex} />
                        <span className="truncate flex-1">{player.name}</span>
                        <span className="text-white/50 text-[10px] sm:text-xs">({player.skill})</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="mb-2 sm:mb-3 text-xs sm:text-sm font-semibold text-white">Team B</h3>
              <div className="min-h-[70px] sm:min-h-[80px] rounded-lg border border-white/10 bg-white/5 p-2.5 sm:p-3">
                {selectedTeamBPlayers.length === 0 ? (
                  <p className="text-center text-xs sm:text-sm text-white/40">Select 2 players</p>
                ) : (
                  <div className="flex flex-col gap-1.5 sm:gap-2">
                    {selectedTeamBPlayers.map((player) => (
                      <div key={player.id} className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-white">
                        <SexBadge sex={player.sex} />
                        <span className="truncate flex-1">{player.name}</span>
                        <span className="text-white/50 text-[10px] sm:text-xs">({player.skill})</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mb-3 sm:mb-4 md:mb-6">
            <input
              type="text"
              placeholder="Search players..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 sm:px-4 py-2 text-xs sm:text-sm text-white placeholder:text-white/40 outline-none focus:border-white/30 focus:bg-white/10"
            />
          </div>

          <div className="max-h-[calc(100vh-500px)] sm:max-h-[calc(100vh-450px)] md:max-h-80 lg:max-h-96 overflow-y-auto rounded-lg border border-white/10 bg-white/5 p-2 sm:p-3 md:p-4">
            {loadingPlayers ? (
              <p className="text-center text-xs sm:text-sm text-white/60 py-4">Loading players...</p>
            ) : filteredPlayers.length === 0 ? (
              <p className="text-center text-xs sm:text-sm text-white/60 py-4">No players found</p>
            ) : gameType === 'mixed-doubles' ? (
              // Mixed Doubles: Side-by-side layout with male and female players separated, grouped by skill
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                {malePlayers.length > 0 && (
                  <div>
                    <h4 className="mb-2 sm:mb-3 text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-white/60">Male Players</h4>
                    <div className="space-y-3 sm:space-y-4">
                      {groupPlayersBySkill(malePlayers).map(([skillLevel, skillPlayers]) => (
                        <div key={`male-${skillLevel}`} className="space-y-1.5 sm:space-y-2">
                          <h5 className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-wide text-white/50">
                            {skillLevel} ({skillPlayers.length})
                          </h5>
                          <div className="space-y-1.5 sm:space-y-2">
                            {skillPlayers.map((player) => {
                        const isSelectedA = selectedTeamA.includes(player.id)
                        const isSelectedB = selectedTeamB.includes(player.id)
                        const isSelected = isSelectedA || isSelectedB

                        return (
                          <button
                            key={player.id}
                            type="button"
                            onClick={() => {
                              if (isSelectedA) {
                                handlePlayerClick(player.id, 'A')
                              } else if (isSelectedB) {
                                handlePlayerClick(player.id, 'B')
                              } else {
                                // Auto-select to team with fewer players
                                if (selectedTeamA.length < selectedTeamB.length) {
                                  handlePlayerClick(player.id, 'A')
                                } else {
                                  handlePlayerClick(player.id, 'B')
                                }
                              }
                            }}
                            className={`flex w-full items-center gap-2 rounded-lg border p-2 text-left text-sm transition ${
                              isSelectedA
                                ? 'border-blue-500 bg-blue-500/20 text-white'
                                : isSelectedB
                                  ? 'border-pink-500 bg-pink-500/20 text-white'
                                  : 'border-white/10 bg-white/5 text-white/80 hover:border-white/30 hover:bg-white/10'
                            }`}
                          >
                            <SexBadge sex={player.sex} />
                            <div className="flex-1">
                              <div className="font-medium">{player.name}</div>
                              <div className="flex items-center gap-2">
                                <div className="text-xs text-white/60">{player.skill}</div>
                                <StatusBadge status={player.status} />
                              </div>
                            </div>
                            {isSelected && (
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
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
                      ))}
                    </div>
                  </div>
                )}
                {femalePlayers.length > 0 && (
                  <div>
                    <h4 className="mb-2 sm:mb-3 text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-white/60">Female Players</h4>
                    <div className="space-y-3 sm:space-y-4">
                      {groupPlayersBySkill(femalePlayers).map(([skillLevel, skillPlayers]) => (
                        <div key={`female-${skillLevel}`} className="space-y-1.5 sm:space-y-2">
                          <h5 className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-wide text-white/50">
                            {skillLevel} ({skillPlayers.length})
                          </h5>
                          <div className="space-y-1.5 sm:space-y-2">
                            {skillPlayers.map((player) => {
                        const isSelectedA = selectedTeamA.includes(player.id)
                        const isSelectedB = selectedTeamB.includes(player.id)
                        const isSelected = isSelectedA || isSelectedB

                        return (
                          <button
                            key={player.id}
                            type="button"
                            onClick={() => {
                              if (isSelectedA) {
                                handlePlayerClick(player.id, 'A')
                              } else if (isSelectedB) {
                                handlePlayerClick(player.id, 'B')
                              } else {
                                // Auto-select to team with fewer players
                                if (selectedTeamA.length < selectedTeamB.length) {
                                  handlePlayerClick(player.id, 'A')
                                } else {
                                  handlePlayerClick(player.id, 'B')
                                }
                              }
                            }}
                            className={`flex w-full items-center gap-1.5 sm:gap-2 rounded-lg border p-1.5 sm:p-2 text-left text-xs sm:text-sm transition ${
                              isSelectedA
                                ? 'border-blue-500 bg-blue-500/20 text-white'
                                : isSelectedB
                                  ? 'border-pink-500 bg-pink-500/20 text-white'
                                  : 'border-white/10 bg-white/5 text-white/80 hover:border-white/30 hover:bg-white/10'
                            }`}
                          >
                            <SexBadge sex={player.sex} />
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">{player.name}</div>
                              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                                <div className="text-[10px] sm:text-xs text-white/60">{player.skill}</div>
                                <StatusBadge status={player.status} />
                              </div>
                            </div>
                            {isSelected && (
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0">
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
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // Men's or Women's Doubles: Grid layout grouped by skill
              <div className="space-y-3 sm:space-y-4">
                {groupPlayersBySkill(filteredPlayers).map(([skillLevel, skillPlayers]) => (
                  <div key={skillLevel} className="space-y-1.5 sm:space-y-2">
                    <h4 className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-white/60">
                      {skillLevel} Players ({skillPlayers.length})
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-1.5 sm:gap-2 md:gap-2.5">
                      {skillPlayers.map((player) => {
                        const isSelectedA = selectedTeamA.includes(player.id)
                        const isSelectedB = selectedTeamB.includes(player.id)
                        const isSelected = isSelectedA || isSelectedB

                        return (
                          <button
                            key={player.id}
                            type="button"
                            onClick={() => {
                              if (isSelectedA) {
                                handlePlayerClick(player.id, 'A')
                              } else if (isSelectedB) {
                                handlePlayerClick(player.id, 'B')
                              } else {
                                // Auto-select to team with fewer players
                                if (selectedTeamA.length < selectedTeamB.length) {
                                  handlePlayerClick(player.id, 'A')
                                } else {
                                  handlePlayerClick(player.id, 'B')
                                }
                              }
                            }}
                            className={`flex flex-col sm:flex-row items-start sm:items-center gap-1.5 sm:gap-2 rounded-lg border p-1.5 sm:p-2 text-left text-xs sm:text-sm transition ${
                              isSelectedA
                                ? 'border-blue-500 bg-blue-500/20 text-white'
                                : isSelectedB
                                  ? 'border-pink-500 bg-pink-500/20 text-white'
                                  : 'border-white/10 bg-white/5 text-white/80 hover:border-white/30 hover:bg-white/10'
                            }`}
                          >
                            <SexBadge sex={player.sex} />
                            <div className="flex-1 min-w-0 w-full sm:w-auto">
                              <div className="font-medium truncate">{player.name}</div>
                              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                                <div className="text-[10px] sm:text-xs text-white/60">{player.skill}</div>
                                <StatusBadge status={player.status} />
                              </div>
                            </div>
                            {isSelected && (
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0 self-end sm:self-center">
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
                ))}
              </div>
            )}
          </div>

          <div className="mt-3 sm:mt-4 md:mt-6 flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isCreating}
              className="rounded-lg border border-white/10 bg-white/5 px-4 sm:px-5 md:px-6 py-2 text-xs sm:text-sm font-semibold text-white transition hover:bg-white/10 disabled:opacity-50 w-full sm:w-auto"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCreateMatch}
              disabled={isCreating || selectedTeamA.length !== 2 || selectedTeamB.length !== 2}
              className="rounded-lg bg-[#1F49FF] px-4 sm:px-5 md:px-6 py-2 text-xs sm:text-sm font-semibold text-white shadow-[0_14px_24px_rgba(31,73,255,0.35)] transition hover:bg-[#2b57ff] disabled:cursor-not-allowed disabled:opacity-50 w-full sm:w-auto"
            >
              {isCreating ? 'Creating...' : 'Create Match'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

