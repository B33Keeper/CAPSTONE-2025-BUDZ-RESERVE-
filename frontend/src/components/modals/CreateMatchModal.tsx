import { useState, useMemo, useEffect, useRef } from 'react'
import toast from 'react-hot-toast'
import { apiServices, type QueuePlayer, type QueueMatchGameType, type QueueMatchPlayer } from '@/lib/apiServices'

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
  const baseClasses = 'flex h-5 w-5 items-center justify-center rounded-full shadow-inner'
  const variantClasses =
    sex === 'male'
      ? 'bg-sky-500/20 text-sky-300'
      : 'bg-pink-500/20 text-pink-300'

  return (
    <span className={`${baseClasses} ${variantClasses}`} aria-label={`${sex} player`}>
      {sex === 'male' ? (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3">
          <path d="M13.5 2a.75.75 0 000 1.5h1.69l-3.2 3.2a4.5 4.5 0 10.884.884l3.2-3.2V6.5a.75.75 0 001.5 0V2.75A.75.75 0 0016.75 2H13.5zm-4 5a3 3 0 110 6 3 3 0 010-6z" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3">
          <path d="M10 2a4.5 4.5 0 10.878 8.9l-.378.378H8.75a.75.75 0 000 1.5h1.25v1.25a.75.75 0 001.5 0V12.78l.378-.378A4.5 4.5 0 0010 2zm0 1.5a3 3 0 110 6 3 3 0 010-6z" />
        </svg>
      )}
    </span>
  )
}

export function CreateMatchModal({ isOpen, onClose, courtId, courtName, onMatchCreated }: CreateMatchModalProps) {
  const [players, setPlayers] = useState<QueuePlayer[]>([])
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
      // Filter to only show today's players (same as Players table)
      const todayISODate = new Date().toISOString().slice(0, 10)
      const todaysPlayers = response.filter((player) => {
        if (!player.lastPlayed) return true
        return player.lastPlayed.slice(0, 10) === todayISODate
      })
      setPlayers(todaysPlayers)
    } catch (error) {
      console.error('Failed to load players', error)
      toast.error('Failed to load players')
    } finally {
      setLoadingPlayers(false)
    }
  }

  const filteredPlayers = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase()
    let filtered = players

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

    return filtered.sort((a, b) => a.name.localeCompare(b.name))
  }, [players, searchQuery, gameType])

  // Separate players by gender
  const malePlayers = useMemo(() => {
    return filteredPlayers.filter((p) => p.sex === 'male').sort((a, b) => a.name.localeCompare(b.name))
  }, [filteredPlayers])

  const femalePlayers = useMemo(() => {
    return filteredPlayers.filter((p) => p.sex === 'female').sort((a, b) => a.name.localeCompare(b.name))
  }, [filteredPlayers])

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
    return teamIds.map((id) => players.find((p) => p.id === id)!).filter(Boolean)
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-4xl rounded-3xl border border-white/10 bg-[#1a1a2e] shadow-2xl">
        <div className="border-b border-white/10 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">Create Match{courtName ? ` on ${courtName}` : ''}</h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-white/60 transition hover:bg-white/10 hover:text-white"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium uppercase tracking-[0.3em] text-white/60">
              Game Type
            </label>
            <div className="relative" ref={gameTypeDropdownRef}>
              <button
                type="button"
                onClick={() => setIsGameTypeDropdownOpen((prev) => !prev)}
                className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-gradient-to-r from-white/10 to-white/0 px-4 py-3 text-left text-white shadow-[0_18px_35px_rgba(5,5,32,0.35)] outline-none transition hover:border-white/30 focus-visible:ring-2 focus-visible:ring-[#5560ff]/50"
              >
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/40">Selected</p>
                  <p className="text-base font-semibold text-white">
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
                  className={`h-5 w-5 text-white/70 transition-transform ${isGameTypeDropdownOpen ? 'rotate-180' : ''}`}
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>

              {isGameTypeDropdownOpen && (
                <div className="absolute left-0 right-0 z-20 mt-3 overflow-hidden rounded-2xl border border-white/10 bg-[#11142b]/95 shadow-[0_25px_50px_rgba(0,0,0,0.5)] backdrop-blur-xl">
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
                          className={`flex w-full items-center justify-between px-5 py-3 text-left text-sm font-medium transition ${
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
                              className="h-4 w-4 text-[#8ea2ff]"
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

          <div className="mb-6 grid grid-cols-2 gap-6">
            <div>
              <h3 className="mb-3 text-sm font-semibold text-white">Team A</h3>
              <div className="min-h-[80px] rounded-lg border border-white/10 bg-white/5 p-3">
                {selectedTeamAPlayers.length === 0 ? (
                  <p className="text-center text-sm text-white/40">Select 2 players</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {selectedTeamAPlayers.map((player) => (
                      <div key={player.id} className="flex items-center gap-2 text-sm text-white">
                        <SexBadge sex={player.sex} />
                        <span>{player.name}</span>
                        <span className="text-white/50">({player.skill})</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="mb-3 text-sm font-semibold text-white">Team B</h3>
              <div className="min-h-[80px] rounded-lg border border-white/10 bg-white/5 p-3">
                {selectedTeamBPlayers.length === 0 ? (
                  <p className="text-center text-sm text-white/40">Select 2 players</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {selectedTeamBPlayers.map((player) => (
                      <div key={player.id} className="flex items-center gap-2 text-sm text-white">
                        <SexBadge sex={player.sex} />
                        <span>{player.name}</span>
                        <span className="text-white/50">({player.skill})</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mb-6">
            <input
              type="text"
              placeholder="Search players..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white placeholder:text-white/40 outline-none focus:border-white/30 focus:bg-white/10"
            />
          </div>

          <div className="max-h-64 overflow-y-auto rounded-lg border border-white/10 bg-white/5 p-4">
            {loadingPlayers ? (
              <p className="text-center text-sm text-white/60">Loading players...</p>
            ) : filteredPlayers.length === 0 ? (
              <p className="text-center text-sm text-white/60">No players found</p>
            ) : gameType === 'mixed-doubles' ? (
              // Mixed Doubles: Side-by-side layout with male and female players separated
              <div className="grid grid-cols-2 gap-6">
                {malePlayers.length > 0 && (
                  <div>
                    <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-white/60">Male Players</h4>
                    <div className="space-y-2">
                      {malePlayers.map((player) => {
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
                              <div className="text-xs text-white/60">{player.skill}</div>
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
                )}
                {femalePlayers.length > 0 && (
                  <div>
                    <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-white/60">Female Players</h4>
                    <div className="space-y-2">
                      {femalePlayers.map((player) => {
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
                              <div className="text-xs text-white/60">{player.skill}</div>
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
                )}
              </div>
            ) : (
              // Men's or Women's Doubles: Grid layout
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                {filteredPlayers.map((player) => {
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
                      className={`flex items-center gap-2 rounded-lg border p-2 text-left text-sm transition ${
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
                        <div className="text-xs text-white/60">{player.skill}</div>
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
            )}
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isCreating}
              className="rounded-lg border border-white/10 bg-white/5 px-6 py-2 text-sm font-semibold text-white transition hover:bg-white/10 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCreateMatch}
              disabled={isCreating || selectedTeamA.length !== 2 || selectedTeamB.length !== 2}
              className="rounded-lg bg-[#1F49FF] px-6 py-2 text-sm font-semibold text-white shadow-[0_14px_24px_rgba(31,73,255,0.35)] transition hover:bg-[#2b57ff] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isCreating ? 'Creating...' : 'Create Match'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

