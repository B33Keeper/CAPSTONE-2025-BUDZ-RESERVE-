import { useEffect, useMemo, useState, useRef } from 'react'
import { QueueingShell } from '@/components/QueueingShell'
import { apiServices, type QueueMatchHistory } from '@/lib/apiServices'

function PlayerBadge({ player }: { player: QueueMatchHistory['teamA'][number] }) {
  const isMale = player.sex === 'male'
  const sexClasses = isMale ? 'bg-sky-500/15 text-sky-200' : 'bg-pink-500/15 text-pink-200'
  return (
    <span className="inline-flex items-center gap-3 rounded-full bg-white/10 px-4 py-1.5 text-xs text-white/85 shadow-inner">
      <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full ${sexClasses}`}>
        {isMale ? (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
            <path d="M13.5 2a.75.75 0 000 1.5h1.69l-3.2 3.2a4.5 4.5 0 10.884.884l3.2-3.2V6.5a.75.75 0 001.5 0V2.75A.75.75 0 0016.75 2H13.5zm-4 5a3 3 0 110 6 3 3 0 010-6z" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
            <path d="M10 2a4.5 4.5 0 10.878 8.9l-.378.378H8.75a.75.75 0 000 1.5h1.25v1.25a.75.75 0 001.5 0V12.78l.378-.378A4.5 4.5 0 0010 2zm0 1.5a3 3 0 110 6 3 3 0 010-6z" />
          </svg>
        )}
      </span>
      <span className="text-sm font-semibold text-white">{player.name}</span>
      <span className="rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white/70">
        {player.skill}
      </span>
    </span>
  )
}

function renderPlayer(player?: QueueMatch['teamA'][number]) {
  if (!player) {
    return null
  }
  return <PlayerBadge player={player} />
}

function WinnerBadge() {
  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-200 shadow-[0_8px_18px_rgba(16,185,129,0.25)]">
      Winner 🏆
    </div>
  )
}

function DrawBadge() {
  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white/80 shadow-[0_8px_18px_rgba(255,255,255,0.15)]">
      🤝 Match Tied
    </div>
  )
}

export function QueueMatchHistoryPage() {
  const [matches, setMatches] = useState<QueueMatchHistory[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedHistoryDate, setSelectedHistoryDate] = useState<string | null>(null)
  const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 5
  const dateDropdownRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        setLoading(true)
        setError(null)
        const historyMatches = await apiServices.getQueueMatchesHistory()
        setMatches(historyMatches)
      } catch (err) {
        console.error('[QueueMatchHistoryPage] Failed to load matches:', err)
        setError('Unable to load match history. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    void fetchMatches()
  }, [])

  // Group matches by archived date (using local timezone)
  const matchesByDate = useMemo(() => {
    return matches.reduce((acc, match) => {
      if (!match.archivedAt) {
        return acc
      }
      // Convert to local date to match what's displayed
      const archivedDateObj = new Date(match.archivedAt)
      const year = archivedDateObj.getFullYear()
      const month = String(archivedDateObj.getMonth() + 1).padStart(2, '0')
      const day = String(archivedDateObj.getDate()).padStart(2, '0')
      const archivedDate = `${year}-${month}-${day}`
      
      if (!acc[archivedDate]) {
        acc[archivedDate] = []
      }
      acc[archivedDate].push(match)
      return acc
    }, {} as Record<string, QueueMatchHistory[]>)
  }, [matches])

  // Extract unique dates that have matches, sorted descending
  const historyDates = useMemo(() => {
    return Object.keys(matchesByDate).sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
  }, [matchesByDate])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dateDropdownRef.current && !dateDropdownRef.current.contains(event.target as Node)) {
        setIsDateDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Get matches for selected date
  const matchesForSelectedDate = useMemo(() => {
    if (!selectedHistoryDate) return []
    return matchesByDate[selectedHistoryDate] ?? []
  }, [matchesByDate, selectedHistoryDate])

  const filteredMatches = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase()
    return [...matchesForSelectedDate]
      .filter((match) => {
        if (!normalizedQuery) return true
        const players = [...match.teamA, ...match.teamB]
        return players.some((player) => player.name.toLowerCase().includes(normalizedQuery))
      })
      .sort((a, b) => {
        const aDate = new Date(a.completedAt ?? a.createdAt).getTime()
        const bDate = new Date(b.completedAt ?? b.createdAt).getTime()
        return bDate - aDate
      })
  }, [matchesForSelectedDate, searchQuery])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, selectedHistoryDate])

  const totalPages = Math.max(1, Math.ceil(filteredMatches.length / pageSize))

  useEffect(() => {
    setCurrentPage((prev) => Math.min(prev, totalPages))
  }, [totalPages])

  const paginatedMatches = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredMatches.slice(start, start + pageSize)
  }, [filteredMatches, currentPage])

  const formatMatchDate = (value: string | null) => {
    if (!value) return '—'
    return new Date(value).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDuration = (match: QueueMatch) => {
    if (!match.startedAt || !match.completedAt) return '—'
    const diffMs = new Date(match.completedAt).getTime() - new Date(match.startedAt).getTime()
    if (diffMs <= 0) return '—'
    const totalMinutes = Math.floor(diffMs / 60000)
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60

    if (hours === 0) {
      return `${minutes} min`
    }

    return `${hours}h ${minutes}m`
  }

  const formatDateForDropdown = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  return (
    <QueueingShell activeTab="history">
      <section className="rounded-3xl border border-white/10 bg-white/[0.05] shadow-2xl shadow-black/30 backdrop-blur-lg">
        <div className="border-b border-white/10 px-4 py-5 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search by player name..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="w-full rounded-2xl border border-white/12 bg-white/10 px-5 py-3 text-sm text-white placeholder:text-white/40 outline-none transition focus:border-white/40 focus:bg-white/15"
              />
            </div>
            {historyDates.length > 0 && (
              <div className="relative" ref={dateDropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsDateDropdownOpen((prev) => !prev)}
                  className="flex w-full items-center justify-between gap-3 rounded-2xl border border-white/10 bg-gradient-to-r from-white/10 to-white/0 px-4 py-3 text-left text-white shadow-[0_18px_35px_rgba(5,5,32,0.35)] outline-none transition hover:border-white/30 focus-visible:ring-2 focus-visible:ring-[#5560ff]/50 sm:w-auto sm:min-w-[200px]"
                >
                  <div className="flex-1">
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/40">Date</p>
                    <p className="text-sm font-semibold text-white">
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
                    className={`h-5 w-5 text-white/70 transition-transform ${isDateDropdownOpen ? 'rotate-180' : ''}`}
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>

                {isDateDropdownOpen && (
                  <div className="absolute right-0 z-20 mt-3 w-full min-w-[200px] overflow-hidden rounded-2xl border border-white/10 bg-[#11142b]/95 shadow-[0_25px_50px_rgba(0,0,0,0.5)] backdrop-blur-xl sm:right-0">
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
                            className={`flex w-full items-center justify-between px-5 py-3 text-left text-sm font-medium transition ${
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
            )}
          </div>
        </div>
        <div className="space-y-4 px-4 pb-6 pt-4 sm:px-6">
          {loading ? (
            Array.from({ length: 3 }).map((_, index) => (
              <div key={`match-skeleton-${index}`} className="h-40 animate-pulse rounded-3xl border border-white/12 bg-white/5" />
            ))
          ) : error ? (
            <div className="rounded-3xl border border-rose-500/40 bg-rose-500/10 px-5 py-4 text-sm text-rose-100">{error}</div>
          ) : historyDates.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] px-5 py-6 text-center text-sm text-white/70">
              No match history recorded yet.
            </div>
          ) : (
            <div className="flex min-h-[24rem] flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.07]">
              {selectedHistoryDate && (
                <div className="border-b border-white/10 px-4 sm:px-6 py-4">
                  <h4 className="text-base font-semibold text-white">
                    {new Date(selectedHistoryDate).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </h4>
                  <p className="text-xs text-white/60">
                    {matchesForSelectedDate.length} match{matchesForSelectedDate.length === 1 ? '' : 'es'}
                  </p>
                </div>
              )}
              <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6">
                {filteredMatches.length === 0 ? (
                  <div className="py-6 text-center text-sm text-white/70">
                    {selectedHistoryDate ? 'No matches found with the current search.' : 'Select a date to view matches.'}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {paginatedMatches.map((match) => {
                      const isTeamAWinner = match.winner === 'teamA'
                      const isTeamBWinner = match.winner === 'teamB'
                      const isDraw = match.winner === 'draw'

                      return (
                        <div
                          key={match.id}
                          className="rounded-3xl border border-white/12 bg-white/[0.08] p-4 shadow-lg shadow-black/25 backdrop-blur-md transition-transform hover:-translate-y-1 hover:shadow-[0_24px_45px_rgba(0,0,0,0.35)] sm:p-5"
                        >
                          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                            <div className="flex items-center gap-3">
                              <span className="text-white/70 font-semibold">#{match.id}</span>
                              <span className="rounded-full bg-purple-500/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-purple-200">
                                {match.gameType.replace('-', ' ')}
                              </span>
                            </div>
                            <span className="text-sm text-white/60">{formatMatchDate(match.completedAt ?? match.createdAt)}</span>
                          </div>
                          {isDraw && (
                            <div className="mt-2">
                              <DrawBadge />
                            </div>
                          )}

                          <div className="mt-4 space-y-3 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-4 sm:px-5">
                            {Array.from({ length: Math.max(match.teamA.length, match.teamB.length) }).map((_, index) => {
                              const leftPlayer = match.teamA[index]
                              const rightPlayer = match.teamB[index]
                              const showVs = index === Math.floor((Math.max(match.teamA.length, match.teamB.length) - 1) / 2)

                              return (
                                <div
                                  key={`${match.id}-${index}`}
                                  className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 text-white/90"
                                >
                                  <div className="flex items-center gap-2">
                                    {renderPlayer(leftPlayer)}
                                    {isTeamAWinner && index === 0 && <WinnerBadge />}
                                  </div>
                                  <span
                                    className={`rounded-full bg-white/20 px-4 py-1 text-sm font-semibold text-white/90 ${
                                      showVs ? 'opacity-100' : 'opacity-0 md:opacity-0'
                                    }`}
                                  >
                                    vs
                                  </span>
                                  <div className="flex items-center justify-end gap-2 text-right">
                                    {isTeamBWinner && index === 0 && <WinnerBadge />}
                                    {renderPlayer(rightPlayer)}
                                  </div>
                                </div>
                              )
                            })}
                          </div>

                          <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            <div className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-white/70">
                              <p className="text-xs uppercase tracking-wide text-white/40">Duration</p>
                              <p className="mt-2 text-sm font-semibold text-white">{formatDuration(match)}</p>
                            </div>
                            <div className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-white/70">
                              <p className="text-xs uppercase tracking-wide text-white/40">Court</p>
                              <p className="mt-2 text-sm font-semibold text-white">{match.courtName ?? '—'}</p>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
              {filteredMatches.length > pageSize && (
                <div className="border-t border-white/10 px-4 sm:px-6 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-sm">
                  <span className="text-white/70">
                    Showing {(currentPage - 1) * pageSize + 1}-
                    {Math.min(filteredMatches.length, currentPage * pageSize)} of {filteredMatches.length} matches
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="rounded-full border border-white/15 px-4 py-1.5 text-xs font-semibold text-white/80 transition disabled:cursor-not-allowed disabled:opacity-40 hover:border-white/40"
                    >
                      Previous
                    </button>
                    <span className="text-xs font-semibold uppercase tracking-wide text-white/60">
                      Page {Math.min(currentPage, totalPages)} of {totalPages}
                    </span>
                    <button
                      type="button"
                      onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="rounded-full border border-white/15 px-4 py-1.5 text-xs font-semibold text-white/80 transition disabled:cursor-not-allowed disabled:opacity-40 hover:border-white/40"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </QueueingShell>
  )
}

