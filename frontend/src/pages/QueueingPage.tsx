import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { QueueingShell } from '@/components/QueueingShell'
import { CreateMatchModal } from '@/components/modals/CreateMatchModal'
import {
  apiServices,
  type QueueMatch,
  type QueueMatchGameType,
  type QueueMatchPlayer,
  type QueueingCourtStatus,
  type QueuePlayer
} from '@/lib/apiServices'
import { getErrorMessage } from '@/lib/errorUtils'

type CourtCard = {
  id: number
  name: string
  status: QueueingCourtStatus
}

const gameTypeLabels: Record<QueueMatchGameType, string> = {
  'mens-doubles': "Men's Doubles",
  'womens-doubles': "Women's Doubles",
  'mixed-doubles': 'Mixed Doubles'
}

function SexBadge({ sex }: { sex: 'male' | 'female' }) {
  const baseClasses = 'flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-full shadow-inner flex-shrink-0'
  const variantClasses =
    sex === 'male'
      ? 'bg-sky-500/20 text-sky-300'
      : 'bg-pink-500/20 text-pink-300'

  return (
    <span className={`${baseClasses} ${variantClasses}`} aria-label={`${sex} player`} title={`${sex} player`}>
      {sex === 'male' ? (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3 sm:h-3.5 sm:w-3.5">
          <path d="M13.5 2a.75.75 0 000 1.5h1.69l-3.2 3.2a4.5 4.5 0 10.884.884l3.2-3.2V6.5a.75.75 0 001.5 0V2.75A.75.75 0 0016.75 2H13.5zm-4 5a3 3 0 110 6 3 3 0 010-6z" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3 sm:h-3.5 sm:w-3.5">
          <path d="M10 2a4.5 4.5 0 10.878 8.9l-.378.378H8.75a.75.75 0 000 1.5h1.25v1.25a.75.75 0 001.5 0V12.78l.378-.378A4.5 4.5 0 0010 2zm0 1.5a3 3 0 110 6 3 3 0 010-6z" />
        </svg>
      )}
    </span>
  )
}

function TeamPlayerCard({ player }: { player: QueueMatchPlayer }) {
  return (
    <div className="flex flex-col items-center gap-1 sm:gap-1.5 md:gap-2 text-center w-full min-w-0">
      <div className="flex items-center justify-center gap-1 sm:gap-1.5 md:gap-2 w-full min-w-0">
        <SexBadge sex={player.sex} />
        <span className="text-xs sm:text-sm md:text-base font-semibold text-white break-words max-w-[150px] sm:max-w-[180px] md:max-w-[200px] lg:max-w-none">{player.name}</span>
      </div>
      <span className="rounded-full bg-white/12 px-2 sm:px-2.5 md:px-3 py-0.5 text-[9px] sm:text-[10px] md:text-xs font-medium uppercase tracking-wide text-white/60">
        {player.skill}
      </span>
    </div>
  )
}

const formatMatchTime = (value: string | null) => {
  if (!value) return '—'
  return new Date(value).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatElapsedTime = (startTime: string | null, now: number) => {
  if (!startTime) return '00:00'
  const diffSeconds = Math.max(0, Math.floor((now - new Date(startTime).getTime()) / 1000))
  const minutes = String(Math.floor(diffSeconds / 60)).padStart(2, '0')
  const seconds = String(diffSeconds % 60).padStart(2, '0')
  return `${minutes}:${seconds}`
}

const formatTeamLabel = (team: QueueMatchPlayer[]) => team.map((player) => player.name).join(' & ')

export function QueueingPage() {
  const [courts, setCourts] = useState<CourtCard[]>([])
  const [loadingCourts, setLoadingCourts] = useState(true)
  const [courtsError, setCourtsError] = useState<string | null>(null)
  const [isClearingCourts, setIsClearingCourts] = useState(false)
  const [isSavingCourt, setIsSavingCourt] = useState(false)
  const [isDeletingCourt, setIsDeletingCourt] = useState(false)
  const [addCourtModal, setAddCourtModal] = useState<{
    open: boolean
    value: string
    error: string
  }>({
    open: false,
    value: '',
    error: ''
  })
  const [courtToDelete, setCourtToDelete] = useState<{ id: number; name: string } | null>(null)
  const [activeMatches, setActiveMatches] = useState<QueueMatch[]>([])
  const [pendingMatches, setPendingMatches] = useState<QueueMatch[]>([])
  const [loadingMatches, setLoadingMatches] = useState(true)
  const [matchesError, setMatchesError] = useState<string | null>(null)
  const [completingMatchIds, setCompletingMatchIds] = useState<Set<number>>(new Set())
  const [cancellingMatchIds, setCancellingMatchIds] = useState<Set<number>>(new Set())
  const [nowTimestamp, setNowTimestamp] = useState(() => Date.now())
  const [matchToComplete, setMatchToComplete] = useState<QueueMatch | null>(null)
  const [isDeclaringWinner, setIsDeclaringWinner] = useState(false)
  const [isClearingPendingMatches, setIsClearingPendingMatches] = useState(false)
  const [createMatchModal, setCreateMatchModal] = useState<{
    open: boolean
    courtId: number | null
    courtName: string | null
  }>({
    open: false,
    courtId: null,
    courtName: null
  })
  const [players, setPlayers] = useState<QueuePlayer[]>([])
  const [loadingPlayers, setLoadingPlayers] = useState(false)
  const nextCourtNumber = useMemo(() => {
    if (courts.length === 0) return 1
    
    // Extract numbers from court names that match "Court X" pattern
    const courtNumbers = courts
      .map((court) => {
        const match = court.name.match(/^Court\s+(\d+)$/i)
        return match ? parseInt(match[1], 10) : null
      })
      .filter((num): num is number => num !== null)
    
    if (courtNumbers.length === 0) return 1
    
    // Return the next number after the highest court number
    return Math.max(...courtNumbers) + 1
  }, [courts])

  const loadCourts = useCallback(async () => {
    try {
      setLoadingCourts(true)
      setCourtsError(null)

      const courtsFromApi = await apiServices.getQueueingCourts()
      const mappedCourts: CourtCard[] = courtsFromApi
        .map((court) => ({
          id: court.id,
          name: court.name,
          status: court.status
        }))
        .sort((a, b) => a.id - b.id)

      setCourts(mappedCourts)
    } catch (error) {
      console.error('[QueueingPage] Failed to load queueing courts:', error)
      setCourtsError('Unable to load courts. Please try again.')
    } finally {
      setLoadingCourts(false)
    }
  }, [])

  const loadMatches = useCallback(async () => {
    try {
      setLoadingMatches(true)
      setMatchesError(null)
      const [active, pending] = await Promise.all([
        apiServices.getQueueMatches({ status: 'active' }),
        apiServices.getQueueMatches({ status: 'pending' })
      ])
      setActiveMatches(active)
      setPendingMatches(pending)
    } catch (error) {
      console.error('[QueueingPage] Failed to load matches:', error)
      setMatchesError('Unable to load matches. Please try again.')
    } finally {
      setLoadingMatches(false)
    }
  }, [])

  const loadPlayers = useCallback(async () => {
    try {
      setLoadingPlayers(true)
      const playersFromApi = await apiServices.getQueuePlayers()
      setPlayers(playersFromApi)
    } catch (error) {
      console.error('[QueueingPage] Failed to load players:', error)
    } finally {
      setLoadingPlayers(false)
    }
  }, [])

  // Stagger data loading to prevent blocking the main thread
  useEffect(() => {
    // Load courts immediately (critical for UI)
    void loadCourts()
    
    // Defer matches and players loading slightly to prevent blocking
    const matchesTimer = setTimeout(() => {
      void loadMatches()
    }, 50)
    
    const playersTimer = setTimeout(() => {
      void loadPlayers()
    }, 100)
    
    return () => {
      clearTimeout(matchesTimer)
      clearTimeout(playersTimer)
    }
  }, [loadCourts, loadMatches, loadPlayers])

  useEffect(() => {
    const interval = window.setInterval(() => {
      // Defer state update to prevent blocking the main thread
      setTimeout(() => {
        setNowTimestamp(Date.now())
      }, 0)
    }, 1000)
    return () => window.clearInterval(interval)
  }, [])

  const handleOpenAddCourtModal = useCallback(() => {
    setAddCourtModal({
      open: true,
      value: `Court ${nextCourtNumber}`,
      error: ''
    })
  }, [nextCourtNumber])

  const handleCloseAddCourtModal = useCallback(() => {
    setAddCourtModal((prev) => ({
      ...prev,
      open: false,
      error: ''
    }))
  }, [])

  const handleSubmitAddCourt = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()

      const trimmedName = addCourtModal.value.trim()
      if (!trimmedName) {
        setAddCourtModal((prev) => ({
          ...prev,
          error: 'Court name cannot be empty.'
        }))
        return
      }

      try {
        setIsSavingCourt(true)
        const createdCourt = await apiServices.createQueueingCourt({
          name: trimmedName,
          status: 'available'
        })

        setCourts((prevCourts) =>
          [...prevCourts, { id: createdCourt.id, name: createdCourt.name, status: createdCourt.status }].sort(
            (a, b) => a.id - b.id
          )
        )

        setAddCourtModal({
          open: false,
          value: '',
          error: ''
        })

        toast.success(`${trimmedName} added successfully.`)
      } catch (error) {
        console.error('[QueueingPage] Failed to add queueing court:', error)
        setAddCourtModal((prev) => ({
          ...prev,
          error: 'Failed to add the court. Please try again.'
        }))
      } finally {
        setIsSavingCourt(false)
      }
    },
    [addCourtModal.value]
  )

  const handlePromptDeleteCourt = useCallback((court: CourtCard) => {
    setCourtToDelete({
      id: court.id,
      name: court.name
    })
  }, [])

  const handleDeleteCourt = useCallback(async () => {
    if (!courtToDelete) return

    const { id, name } = courtToDelete

    try {
      setIsDeletingCourt(true)
      await apiServices.deleteQueueingCourt(id)
      setCourts((prevCourts) => prevCourts.filter((court) => court.id !== id))
      toast.success(`${name} removed.`)
    } catch (error) {
      console.error('[QueueingPage] Failed to delete queueing court:', error)
      toast.error(`Unable to delete ${name}. Please try again.`)
    } finally {
      setIsDeletingCourt(false)
      setCourtToDelete(null)
    }
  }, [courtToDelete])

  const [confirmClearModal, setConfirmClearModal] = useState(false)

  const handleClearCourts = useCallback(async () => {
    if (courts.length === 0 || isClearingCourts) return

    // Check if there are active matches before attempting to clear
    if (activeMatches.length > 0) {
      toast.error('Cannot clear courts while there are active matches in progress.')
      setConfirmClearModal(false)
      return
    }

    try {
      setIsClearingCourts(true)
      await apiServices.clearQueueingCourts()
      setCourts([])
      toast.success('All queue courts removed.')
    } catch (error) {
      console.error('[QueueingPage] Failed to clear queue courts:', error)
      const errorMessage = getErrorMessage(
        error,
        'Unable to clear courts. Please try again.'
      )
      toast.error(errorMessage)
    } finally {
      setIsClearingCourts(false)
      setConfirmClearModal(false)
    }
  }, [courts, isClearingCourts, activeMatches])

  const handleDeclareMatchWinner = useCallback(
    async (winner: 'teamA' | 'teamB' | 'draw') => {
      if (!matchToComplete || isDeclaringWinner) return
      const matchId = matchToComplete.id
      setIsDeclaringWinner(true)
      setCompletingMatchIds((prev) => {
        const next = new Set(prev)
        next.add(matchId)
        return next
      })

      try {
        await apiServices.completeQueueMatch(matchId, { winner })
        toast.success('Match result recorded.')
        await Promise.all([loadMatches(), loadCourts()])
        setMatchToComplete(null)
      } catch (error) {
        console.error('[QueueingPage] Failed to complete match:', error)
        toast.error('Unable to complete match. Please try again.')
      } finally {
        setIsDeclaringWinner(false)
        setCompletingMatchIds((prev) => {
          const next = new Set(prev)
          next.delete(matchId)
          return next
        })
      }
    },
    [isDeclaringWinner, loadCourts, loadMatches, matchToComplete]
  )

  const handleCancelMatch = useCallback(
    async (matchId: number) => {
      if (cancellingMatchIds.has(matchId)) return
      setCancellingMatchIds((prev) => {
        const next = new Set(prev)
        next.add(matchId)
        return next
      })

      try {
        await apiServices.cancelQueueMatch(matchId)
        toast.success('Match cancelled.')
        await Promise.all([loadMatches(), loadCourts()])
      } catch (error) {
        console.error('[QueueingPage] Failed to cancel match:', error)
        toast.error('Unable to cancel match. Please try again.')
      } finally {
        setCancellingMatchIds((prev) => {
          const next = new Set(prev)
          next.delete(matchId)
          return next
        })
      }
    },
    [cancellingMatchIds, loadCourts, loadMatches]
  )
  const handleRequestCompleteMatch = useCallback((match: QueueMatch) => {
    setMatchToComplete(match)
  }, [])

  const handleCloseWinnerModal = useCallback(() => {
    if (isDeclaringWinner) return
    setMatchToComplete(null)
  }, [isDeclaringWinner])

  const handleClearPendingMatches = useCallback(async () => {
    if (pendingMatches.length === 0 || isClearingPendingMatches) {
      return
    }

    try {
      setIsClearingPendingMatches(true)
      await apiServices.clearPendingQueueMatches()
      toast.success('Pending matches cleared.')
      await loadMatches()
    } catch (error) {
      console.error('[QueueingPage] Failed to clear pending matches:', error)
      toast.error('Unable to clear pending matches. Please try again.')
    } finally {
      setIsClearingPendingMatches(false)
    }
  }, [isClearingPendingMatches, loadMatches, pendingMatches.length])

  // Calculate relative match numbers starting from 1 for each batch of pending matches
  const pendingMatchMinId = useMemo(() => {
    if (pendingMatches.length === 0) return 0
    return Math.min(...pendingMatches.map((match) => match.id))
  }, [pendingMatches])

  const getMatchNumber = useCallback(
    (matchId: number) => {
      if (pendingMatchMinId === 0) return matchId
      return matchId - pendingMatchMinId + 1
    },
    [pendingMatchMinId]
  )

  const activeMatchesByCourt = useMemo(() => {
    const map = new Map<number, QueueMatch>()
    activeMatches.forEach((match) => {
      if (match.courtId != null) {
        map.set(match.courtId, match)
      }
    })
    return map
  }, [activeMatches])

  const renderStatusBadge = (status: CourtCard['status']) => {
    if (status === 'maintenance') {
      return (
        <span className="rounded-full border border-amber-400/60 bg-amber-500/5 px-2.5 sm:px-3 md:px-4 py-0.5 sm:py-1 text-[9px] sm:text-[10px] md:text-[11px] font-semibold uppercase tracking-wide text-amber-300 whitespace-nowrap">
          Maintenance
        </span>
      )
    }

    if (status === 'unavailable') {
      return (
        <span className="rounded-full border border-rose-500/60 bg-rose-500/10 px-2.5 sm:px-3 md:px-4 py-0.5 sm:py-1 text-[9px] sm:text-[10px] md:text-[11px] font-semibold uppercase tracking-wide text-rose-300 whitespace-nowrap">
          Unavailable
        </span>
      )
    }

    if (status === 'occupied') {
      return (
        <span className="rounded-full border border-orange-400/70 bg-orange-500/10 px-2.5 sm:px-3 md:px-4 py-0.5 sm:py-1 text-[9px] sm:text-[10px] md:text-[11px] font-semibold uppercase tracking-wide text-orange-200 whitespace-nowrap">
          Occupied
        </span>
      )
    }

    return (
      <span className="rounded-full border border-emerald-500 bg-transparent px-2.5 sm:px-3 md:px-4 py-0.5 sm:py-1 text-[9px] sm:text-[10px] md:text-[11px] font-semibold uppercase tracking-wide text-emerald-300 whitespace-nowrap">
        Available
      </span>
    )
  }

  return (
    <QueueingShell activeTab="queue">
      <section>
        <div className="mb-4 sm:mb-6 flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-xl sm:text-2xl font-semibold text-white/90">Court Management</h1>
          <button
            type="button"
            onClick={handleOpenAddCourtModal}
            className="self-start rounded-full bg-[#2663ff] px-4 sm:px-5 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold shadow-lg shadow-blue-900/40 transition-colors hover:bg-[#2d6dff]"
          >
            + Add new court
          </button>
        </div>
        {courtsError && !loadingCourts && (
          <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {courtsError}
          </div>
        )}
        <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 md:grid-cols-2 xl:grid-cols-3">
          {loadingCourts
            ? Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={`queueing-court-skeleton-${index}`}
                  className="h-56 animate-pulse rounded-xl sm:rounded-[20px] border border-white/12 bg-white/5"
                />
              ))
            : courts.map((court) => {
                const courtMatch = activeMatchesByCourt.get(court.id)
                const isCompleting =
                  courtMatch && (completingMatchIds.has(courtMatch.id) || (matchToComplete?.id === courtMatch.id && isDeclaringWinner))
                const isCancelling = courtMatch ? cancellingMatchIds.has(courtMatch.id) : false

                return (
                  <div key={court.id} className="relative rounded-xl sm:rounded-[20px] border border-white/18 bg-[#14070e] shadow-[0_14px_34px_rgba(0,0,0,0.45)]">
                    <div className="pointer-events-none">
                      <div className="absolute inset-0 rounded-xl sm:rounded-[20px] border border-white/12" />
                      <div className="absolute inset-x-3 sm:inset-x-5 top-[36%] h-px bg-white/16" />
                      <div className="absolute inset-x-3 sm:inset-x-5 bottom-4 sm:bottom-6 h-px bg-white/16" />
                      <div className="absolute top-[36%] bottom-4 sm:bottom-6 left-[33%] w-px bg-white/16" />
                      <div className="absolute top-[36%] bottom-4 sm:bottom-6 right-[33%] w-px bg-white/16" />
                      <div className="absolute top-[52%] bottom-4 sm:bottom-6 left-1/2 w-px -translate-x-1/2 bg-white/16" />
                    </div>
                    <div className="relative flex items-start justify-between px-3 sm:px-4 md:px-6 pt-3 sm:pt-4 gap-2">
                      <div className="flex items-center gap-1.5 sm:gap-2 text-sm font-semibold text-white min-w-0 flex-1">
                        <span className="text-sm sm:text-base truncate">{court.name}</span>
                        <div className="flex items-center gap-1 sm:gap-2 text-white/80 flex-shrink-0">
                          <button
                            className="flex h-7 w-7 sm:h-9 sm:w-9 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition hover:bg-white/20"
                            type="button"
                            aria-label="Edit court"
                            disabled
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="h-3 w-3 sm:h-4 sm:w-4 opacity-40"
                            >
                              <path d="M16.862 3.487l3.651 3.651a1.5 1.5 0 010 2.122l-9.9 9.9-4.604 1.265 1.265-4.604 9.9-9.9a1.5 1.5 0 012.122 0z" />
                              <path d="M13.95 6.4l3.651 3.651" />
                              <path d="M5 21h14" />
                            </svg>
                          </button>
                          <button
                            className="flex h-7 w-7 sm:h-9 sm:w-9 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition hover:bg-white/20 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-60"
                            type="button"
                            onClick={() => handlePromptDeleteCourt(court)}
                            disabled={isDeletingCourt && courtToDelete?.id === court.id}
                            aria-label="Delete court"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="h-3 w-3 sm:h-4 sm:w-4"
                            >
                              <path d="M4 7h16" />
                              <path d="M10 11v6" />
                              <path d="M14 11v6" />
                              <path d="M5 7l1 12a2 2 0 002 2h8a2 2 0 002-2l1-12" />
                              <path d="M9 7V5a2 2 0 012-2h2a2 2 0 012 2v2" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      <div className="flex-shrink-0">{renderStatusBadge(court.status)}</div>
                    </div>
                    {courtMatch ? (
                      <div className="relative flex flex-col gap-2.5 sm:gap-3 md:gap-4 lg:gap-5 px-3 sm:px-4 md:px-6 pb-3 sm:pb-4 md:pb-6 lg:pb-8 pt-3 sm:pt-4 md:pt-6 text-white">
                        <div className="flex flex-col gap-0.5 sm:gap-1 text-[10px] sm:text-xs md:text-sm text-white/70">
                          <span className="text-[10px] sm:text-xs md:text-sm font-semibold text-white">
                            Game Type: <span className="font-normal">{gameTypeLabels[courtMatch.gameType]}</span>
                          </span>
                          <span className="text-[10px] sm:text-xs md:text-sm">Start Time: {formatMatchTime(courtMatch.startedAt)}</span>
                          <span className="text-[10px] sm:text-xs md:text-sm">Elapsed Time: {formatElapsedTime(courtMatch.startedAt, nowTimestamp)}</span>
                        </div>
                        <div className="rounded-lg sm:rounded-xl md:rounded-2xl border border-white/10 bg-white/[0.03] px-2 sm:px-3 md:px-4 py-2.5 sm:py-3 md:py-4 text-center">
                          <div className="grid gap-2 sm:gap-3 md:gap-4 text-white grid-cols-[1fr_auto_1fr] items-center">
                            <div className="flex flex-col items-center gap-1.5 sm:gap-2 md:gap-3 min-w-0">
                              {courtMatch.teamA.map((player) => (
                                <TeamPlayerCard key={`court-${court.id}-teamA-${player.id}`} player={player} />
                              ))}
                            </div>
                            <span className="mx-auto inline-flex items-center justify-center rounded-full bg-white/15 px-2 sm:px-3 md:px-4 py-0.5 sm:py-1 text-[10px] sm:text-xs md:text-sm font-semibold text-white flex-shrink-0">
                              vs
                            </span>
                            <div className="flex flex-col items-center gap-1.5 sm:gap-2 md:gap-3 min-w-0">
                              {courtMatch.teamB.map((player) => (
                                <TeamPlayerCard key={`court-${court.id}-teamB-${player.id}`} player={player} />
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 sm:gap-3 text-xs sm:text-sm font-semibold sm:flex-row sm:items-center sm:justify-between">
                          <button
                            type="button"
                            onClick={() => handleRequestCompleteMatch(courtMatch)}
                            disabled={isCompleting}
                            className={`rounded-full px-4 sm:px-5 py-1.5 sm:py-2 text-xs sm:text-sm text-white transition w-full sm:w-auto ${
                              isCompleting
                                ? 'cursor-not-allowed bg-emerald-500/40'
                                : 'bg-emerald-500 shadow-lg shadow-emerald-900/30 hover:bg-emerald-500/90'
                            }`}
                          >
                            {isCompleting ? 'Completing…' : 'Complete Match'}
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleCancelMatch(courtMatch.id)}
                            disabled={isCancelling}
                            className={`rounded-full px-4 sm:px-5 py-1.5 sm:py-2 text-xs sm:text-sm text-white transition w-full sm:w-auto ${
                              isCancelling
                                ? 'cursor-not-allowed bg-white/10 text-white/50'
                                : 'bg-white/10 text-white/80 hover:bg-white/20'
                            }`}
                          >
                            {isCancelling ? 'Cancelling…' : 'Cancel Match'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="relative flex flex-col items-center justify-center px-3 sm:px-4 md:px-6 pb-8 sm:pb-10 md:pb-12 pt-8 sm:pt-10 md:pt-12 text-center">
                        <p className="mb-4 sm:mb-6 text-xs sm:text-sm text-white/75 px-2">
                          {court.status === 'occupied'
                            ? 'Court marked as occupied but waiting for a match assignment.'
                            : 'Generate matches from the Players tab to occupy this court.'}
                        </p>
                        <button
                          type="button"
                          className="inline-flex items-center justify-center gap-2 rounded-md bg-[#1F49FF] px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-white shadow-[0_14px_24px_rgba(31,73,255,0.35)] transition-transform hover:-translate-y-0.5 hover:bg-[#2b57ff] w-full sm:w-auto max-w-xs sm:max-w-none"
                          onClick={async () => {
                            if (court.status !== 'available') {
                              toast.error('Court is not available')
                              return
                            }

                            // Check if players are loaded, if not load them first
                            if (players.length === 0 && !loadingPlayers) {
                              await loadPlayers()
                            }

                            // Check player count
                            if (players.length === 0) {
                              toast.error('There are no available players')
                              return
                            }

                            if (players.length < 4) {
                              toast.error('There are not enough players. At least 4 players are required to create a match.')
                              return
                            }

                            // Open the create match modal
                            setCreateMatchModal({
                              open: true,
                              courtId: court.id,
                              courtName: court.name
                            })
                          }}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            className="h-3.5 w-3.5 sm:h-4 sm:w-4"
                            aria-hidden="true"
                          >
                            <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                          </svg>
                          Add Match
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
        </div>
        {!loadingCourts && courts.length === 0 && !courtsError && (
          <p className="mt-4 sm:mt-6 text-center text-xs sm:text-sm text-white/60 px-4">No courts added yet.</p>
        )}
        {courts.length > 0 && !loadingCourts && (
          <div className="mt-4 sm:mt-6 flex justify-center">
            <button
              type="button"
              onClick={() => setConfirmClearModal(true)}
              disabled={isClearingCourts}
              className="rounded-full bg-white/10 px-4 sm:px-6 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Clear courts
            </button>
          </div>
        )}
      </section>

      <section className="rounded-2xl sm:rounded-3xl border border-white/10 bg-white/[0.05] shadow-2xl shadow-black/30 backdrop-blur-lg">
        <div className="border-b border-white/5 px-3 sm:px-4 pb-3 sm:pb-4 pt-4 sm:pt-6 md:px-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <h2 className="text-lg sm:text-xl font-semibold text-white/90">
              Pending Matches <span className="text-white/50">({pendingMatches.length})</span>
            </h2>
            <div className="flex flex-col gap-2 sm:gap-3 md:flex-row md:items-center md:gap-4">
              <div className="relative w-full md:w-64">
                <input
                  type="text"
                  placeholder="Search by name..."
                  className="w-full rounded-full border border-white/10 bg-white/5 px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm text-white placeholder:text-white/40 outline-none transition focus:border-white/30 focus:bg-white/10"
                />
                <span className="pointer-events-none absolute inset-y-0 right-3 sm:right-4 flex items-center text-white/40">
                  🔍
                </span>
              </div>
              <button
                type="button"
                onClick={handleClearPendingMatches}
                disabled={pendingMatches.length === 0 || isClearingPendingMatches}
                className="rounded-full border border-white/15 bg-white/5 px-4 sm:px-5 py-2 text-xs sm:text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isClearingPendingMatches ? 'Clearing…' : 'Clear pending'}
              </button>
            </div>
          </div>
          {matchesError && !loadingMatches && (
            <p className="mt-2 sm:mt-3 text-xs sm:text-sm font-medium text-rose-300">{matchesError}</p>
          )}
        </div>

        <div className="grid gap-3 sm:gap-4 px-3 sm:px-4 pb-4 sm:pb-6 md:px-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
          {loadingMatches ? (
            Array.from({ length: 3 }).map((_, index) => (
              <div key={`pending-skeleton-${index}`} className="h-64 animate-pulse rounded-xl sm:rounded-[20px] border border-white/18 bg-[#14070e]" />
            ))
          ) : pendingMatches.length === 0 ? (
            <div className="col-span-full rounded-xl sm:rounded-[20px] border border-white/18 bg-[#14070e] px-4 sm:px-6 py-8 sm:py-10 text-center text-xs sm:text-sm text-white/70">
              {matchesError ?? 'No pending matches. Generate new ones to keep players engaged.'}
            </div>
          ) : (
            pendingMatches.map((match) => (
              <div
                key={match.id}
                className="rounded-xl sm:rounded-[20px] border border-white/18 bg-[#14070e] p-4 sm:p-5 md:p-6 text-white shadow-[0_14px_34px_rgba(0,0,0,0.45)] transition-transform hover:-translate-y-1 hover:shadow-[0_24px_45px_rgba(0,0,0,0.35)]"
              >
                <div className="flex flex-col items-center gap-1.5 sm:gap-2 text-center sm:flex-row sm:justify-between sm:text-left">
                  <div className="min-w-0 flex-1">
                    <span className="block text-[10px] sm:text-xs md:text-sm uppercase tracking-wide text-white/60">#{getMatchNumber(match.id)}</span>
                    <span className="text-sm sm:text-base md:text-lg font-semibold truncate">{gameTypeLabels[match.gameType]}</span>
                  </div>
                  <span className="text-[10px] sm:text-xs md:text-sm text-white/60 whitespace-nowrap flex-shrink-0">
                    Requested {formatMatchTime(match.createdAt)}
                  </span>
                </div>
                <div className="mt-3 sm:mt-4 md:mt-5 flex flex-col gap-2 sm:gap-3 md:gap-4 rounded-lg sm:rounded-xl md:rounded-2xl border border-white/10 bg-white/[0.03] px-3 sm:px-4 md:px-5 lg:px-6 py-3 sm:py-4 md:py-5 text-center text-white/90">
                  <div className="grid gap-2 sm:gap-3 md:gap-4 text-white/90 grid-cols-[1fr_auto_1fr] items-center">
                    <div className="flex w-full flex-col items-center gap-1.5 sm:gap-2 md:gap-3 min-w-0 px-1">
                      {match.teamA.map((player) => (
                        <TeamPlayerCard key={`pending-${match.id}-teamA-${player.id}`} player={player} />
                      ))}
                    </div>
                    <span className="mx-auto inline-flex items-center justify-center rounded-full bg-white/20 px-2 sm:px-3 md:px-4 lg:px-5 py-0.5 sm:py-1 md:py-1.5 text-[10px] sm:text-xs md:text-sm font-semibold text-white flex-shrink-0">
                      vs
                    </span>
                    <div className="flex w-full flex-col items-center gap-1.5 sm:gap-2 md:gap-3 min-w-0 px-1">
                      {match.teamB.map((player) => (
                        <TeamPlayerCard key={`pending-${match.id}-teamB-${player.id}`} player={player} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {matchToComplete && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 px-3 sm:px-4">
          <div className="w-full max-w-md rounded-xl sm:rounded-2xl border border-white/15 bg-[#12060f] p-4 sm:p-5 md:p-6 text-white shadow-[0_30px_60px_rgba(0,0,0,0.5)]">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <h3 className="text-base sm:text-lg font-semibold">Declare Match Winner</h3>
                <p className="text-xs sm:text-sm text-white/70">Select the winning team</p>
              </div>
              <button
                type="button"
                onClick={handleCloseWinnerModal}
                disabled={isDeclaringWinner}
                className="inline-flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white/70 transition hover:bg-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-50 flex-shrink-0"
              >
                ✕
              </button>
            </div>
            <div className="mt-4 sm:mt-6 space-y-2 sm:space-y-3">
              <button
                type="button"
                onClick={() => void handleDeclareMatchWinner('teamA')}
                disabled={isDeclaringWinner}
                className={`flex w-full items-center justify-center gap-2 sm:gap-3 rounded-xl sm:rounded-2xl border px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold transition ${
                  isDeclaringWinner
                    ? 'cursor-not-allowed border-white/10 bg-white/5 text-white/60'
                    : 'border-white/15 bg-white/5 text-white hover:border-emerald-300 hover:bg-emerald-500/15'
                }`}
              >
                <span className="truncate">🏆 {formatTeamLabel(matchToComplete.teamA)}</span>
              </button>
              <button
                type="button"
                onClick={() => void handleDeclareMatchWinner('teamB')}
                disabled={isDeclaringWinner}
                className={`flex w-full items-center justify-center gap-2 sm:gap-3 rounded-xl sm:rounded-2xl border px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold transition ${
                  isDeclaringWinner
                    ? 'cursor-not-allowed border-white/10 bg-white/5 text-white/60'
                    : 'border-white/15 bg-white/5 text-white hover:border-emerald-300 hover:bg-emerald-500/15'
                }`}
              >
                <span className="truncate">🏆 {formatTeamLabel(matchToComplete.teamB)}</span>
              </button>
              <button
                type="button"
                onClick={handleCloseWinnerModal}
                disabled={isDeclaringWinner}
                className="w-full rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs sm:text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {addCourtModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-3 sm:px-4">
          <div className="w-full max-w-md rounded-xl sm:rounded-2xl border border-white/20 bg-[#11050b] p-4 sm:p-5 md:p-6 shadow-[0_30px_50px_rgba(0,0,0,0.45)]">
            <h2 className="text-base sm:text-lg font-semibold text-white">Add new court</h2>
            <p className="mt-1 text-xs sm:text-sm text-white/70">Provide a name for the court you want to create.</p>

            <form onSubmit={handleSubmitAddCourt} className="mt-4 sm:mt-5 space-y-4 sm:space-y-5">
              <div>
                <label htmlFor="new-court-name" className="mb-2 block text-xs sm:text-sm font-medium text-white/80">
                  Court name
                </label>
                <input
                  id="new-court-name"
                  type="text"
                  value={addCourtModal.value}
                  onChange={(event) =>
                    setAddCourtModal((prev) => ({
                      ...prev,
                      value: event.target.value,
                      error: ''
                    }))
                  }
                  className={`w-full rounded-lg sm:rounded-xl border bg-white/5 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-white outline-none transition focus:border-white/40 focus:bg-white/10 ${
                    addCourtModal.error ? 'border-rose-400/70 focus:border-rose-300' : 'border-white/15'
                  }`}
                  placeholder={`Court ${nextCourtNumber}`}
                  autoFocus
                />
                {addCourtModal.error && <p className="mt-2 text-xs sm:text-sm text-rose-300">{addCourtModal.error}</p>}
              </div>
              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={handleCloseAddCourtModal}
                  disabled={isSavingCourt}
                  className="rounded-full bg-white/10 px-4 sm:px-5 py-2 text-xs sm:text-sm font-semibold text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60 w-full sm:w-auto"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingCourt}
                  className="rounded-full bg-[#2663ff] px-4 sm:px-5 py-2 text-xs sm:text-sm font-semibold text-white shadow-lg shadow-blue-900/40 transition-colors hover:bg-[#2d6dff] disabled:cursor-not-allowed disabled:opacity-60 w-full sm:w-auto"
                >
                  {isSavingCourt ? 'Adding…' : 'Add court'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {courtToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-sm rounded-2xl border border-white/20 bg-[#11050b] p-6 text-center shadow-[0_30px_50px_rgba(0,0,0,0.45)]">
            <h3 className="text-lg font-semibold text-white">Remove court?</h3>
            <p className="mt-2 text-sm text-white/70">
              This will remove <span className="font-semibold text-white">{courtToDelete.name}</span> from queue courts.
            </p>
            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  if (isDeletingCourt) return
                  setCourtToDelete(null)
                }}
                disabled={isDeletingCourt}
                className="rounded-full bg-white/10 px-5 py-2 text-sm font-semibold text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleDeleteCourt()}
                disabled={isDeletingCourt}
                className="rounded-full bg-rose-500 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-rose-900/30 transition hover:bg-rose-500/90 disabled:cursor-not-allowed disabled:bg-rose-500/60"
              >
                {isDeletingCourt ? 'Removing…' : 'Remove'}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmClearModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-sm rounded-2xl border border-white/20 bg-[#11050b] p-6 text-center shadow-[0_30px_50px_rgba(0,0,0,0.45)]">
            <h3 className="text-lg font-semibold text-white">Remove courts?</h3>
            <p className="mt-2 text-sm text-white/70">
              This will remove all queue courts. Continue?
            </p>
            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setConfirmClearModal(false)}
                disabled={isClearingCourts}
                className="rounded-full bg-white/10 px-5 py-2 text-sm font-semibold text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleClearCourts}
                disabled={isClearingCourts}
                className="rounded-full bg-rose-500 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-rose-900/30 transition hover:bg-rose-500/90 disabled:cursor-not-allowed disabled:bg-rose-500/60"
              >
                {isClearingCourts ? 'Removing…' : 'Remove'}
              </button>
            </div>
          </div>
        </div>
      )}

      <CreateMatchModal
        isOpen={createMatchModal.open}
        onClose={() => setCreateMatchModal({ open: false, courtId: null, courtName: null })}
        courtId={createMatchModal.courtId}
        courtName={createMatchModal.courtName}
        onMatchCreated={() => {
          void loadMatches()
          void loadCourts()
        }}
      />
    </QueueingShell>
  )
}

