import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { QueueingShell } from '@/components/QueueingShell'
import { apiServices, type QueueingCourtStatus } from '@/lib/apiServices'

type CourtCard = {
  id: number
  name: string
  status: QueueingCourtStatus
}

const matches = [
  {
    id: 1,
    type: 'Doubles Match',
    requestedAt: '01:46 PM',
    teams: [
      { name: 'Ivan', color: 'text-blue-400' },
      { name: 'Filber', color: 'text-blue-400' },
    ],
    opponents: [
      { name: 'Patrick', color: 'text-emerald-400' },
      { name: 'Benito', color: 'text-emerald-400' },
    ],
  },
  {
    id: 2,
    type: 'Singles Match',
    requestedAt: '02:05 PM',
    teams: [{ name: 'Anna', color: 'text-blue-400' }],
    opponents: [{ name: 'Marco', color: 'text-emerald-400' }],
  },
  {
    id: 3,
    type: 'Doubles Match',
    requestedAt: '02:22 PM',
    teams: [
      { name: 'Chris', color: 'text-blue-400' },
      { name: 'Dani', color: 'text-blue-400' },
    ],
    opponents: [
      { name: 'Lia', color: 'text-emerald-400' },
      { name: 'Jude', color: 'text-emerald-400' },
    ],
  },
]

const playerProfiles: Record<string, { sex: 'male' | 'female'; skill: string }> = {
  Ivan: { sex: 'male', skill: 'Beginner' },
  Filber: { sex: 'male', skill: 'Beginner' },
  Patrick: { sex: 'male', skill: 'Beginner' },
  Benito: { sex: 'male', skill: 'Beginner' },
  Anna: { sex: 'female', skill: 'Intermediate' },
  Marco: { sex: 'male', skill: 'Advanced' },
  Chris: { sex: 'male', skill: 'Intermediate' },
  Dani: { sex: 'male', skill: 'Intermediate' },
  Lia: { sex: 'female', skill: 'Intermediate' },
  Jude: { sex: 'male', skill: 'Advanced' },
}

function SexBadge({ sex }: { sex: 'male' | 'female' }) {
  const baseClasses = 'flex h-6 w-6 items-center justify-center rounded-full shadow-inner'
  const variantClasses =
    sex === 'male'
      ? 'bg-sky-500/20 text-sky-300'
      : 'bg-pink-500/20 text-pink-300'

  return (
    <span className={`${baseClasses} ${variantClasses}`} aria-label={`${sex} player`} title={`${sex} player`}>
      {sex === 'male' ? (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
          <path d="M13.5 2a.75.75 0 000 1.5h1.69l-3.2 3.2a4.5 4.5 0 10.884.884l3.2-3.2V6.5a.75.75 0 001.5 0V2.75A.75.75 0 0016.75 2H13.5zm-4 5a3 3 0 110 6 3 3 0 010-6z" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
          <path d="M10 2a4.5 4.5 0 10.878 8.9l-.378.378H8.75a.75.75 0 000 1.5h1.25v1.25a.75.75 0 001.5 0V12.78l.378-.378A4.5 4.5 0 0010 2zm0 1.5a3 3 0 110 6 3 3 0 010-6z" />
        </svg>
      )}
    </span>
  )
}

function TeamPlayerCard({
  player,
  profile
}: {
  player: { name: string; color: string }
  profile: { sex: 'male' | 'female'; skill: string }
}) {
  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <div className="flex items-center justify-center gap-2">
        <SexBadge sex={profile.sex} />
        <span className={`text-base font-semibold ${player.color}`}>{player.name}</span>
      </div>
      <span className="rounded-full bg-white/12 px-3 py-0.5 text-xs font-medium uppercase tracking-wide text-white/60">
        {profile.skill}
      </span>
    </div>
  )
}

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
  const nextCourtNumber = useMemo(() => {
    if (courts.length === 0) return 1
    return Math.max(...courts.map((court) => court.id)) + 1
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

  useEffect(() => {
    void loadCourts()
  }, [loadCourts])

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

    try {
      setIsClearingCourts(true)
      await apiServices.clearQueueingCourts()
      setCourts([])
      toast.success('All queue courts removed.')
    } catch (error) {
      console.error('[QueueingPage] Failed to clear queue courts:', error)
      toast.error('Unable to clear courts. Please try again.')
    } finally {
      setIsClearingCourts(false)
      setConfirmClearModal(false)
    }
  }, [courts, isClearingCourts])

  const renderStatusBadge = (status: CourtCard['status']) => {
    if (status === 'maintenance') {
      return (
        <span className="rounded-full border border-amber-400/60 bg-amber-500/5 px-4 py-1 text-[11px] font-semibold uppercase tracking-wide text-amber-300">
          Maintenance
        </span>
      )
    }

    if (status === 'unavailable') {
      return (
        <span className="rounded-full border border-rose-500/60 bg-rose-500/10 px-4 py-1 text-[11px] font-semibold uppercase tracking-wide text-rose-300">
          Unavailable
        </span>
      )
    }

    return (
      <span className="rounded-full border border-emerald-500 bg-transparent px-4 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-300">
        Available
      </span>
    )
  }

  return (
    <QueueingShell activeTab="queue">
      <section>
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-semibold text-white/90">Court Management</h1>
          <button
            type="button"
            onClick={handleOpenAddCourtModal}
            className="self-start rounded-full bg-[#2663ff] px-5 py-2 text-sm font-semibold shadow-lg shadow-blue-900/40 transition-colors hover:bg-[#2d6dff]"
          >
            + Add new court
          </button>
        </div>
        {courtsError && !loadingCourts && (
          <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {courtsError}
          </div>
        )}
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-2 xl:grid-cols-3">
          {loadingCourts
            ? Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={`queueing-court-skeleton-${index}`}
                  className="h-56 animate-pulse rounded-[20px] border border-white/12 bg-white/5"
                />
              ))
            : courts.map((court) => (
                <div key={court.id} className="relative rounded-[20px] border border-white/18 bg-[#14070e] shadow-[0_14px_34px_rgba(0,0,0,0.45)]">
                  <div className="pointer-events-none">
                    <div className="absolute inset-0 rounded-[20px] border border-white/12" />
                    <div className="absolute inset-x-5 top-[36%] h-px bg-white/16" />
                    <div className="absolute inset-x-5 bottom-6 h-px bg-white/16" />
                    <div className="absolute top-[36%] bottom-6 left-[33%] w-px bg-white/16" />
                    <div className="absolute top-[36%] bottom-6 right-[33%] w-px bg-white/16" />
                    <div className="absolute top-[52%] bottom-6 left-1/2 w-px -translate-x-1/2 bg-white/16" />
                  </div>
                  <div className="relative flex items-start justify-between px-6 pt-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-white">
                      <span className="text-base">{court.name}</span>
                      <div className="flex items-center gap-2 text-white/80">
                        <button
                          className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition hover:bg-white/20"
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
                            className="h-4 w-4 opacity-40"
                          >
                            <path d="M16.862 3.487l3.651 3.651a1.5 1.5 0 010 2.122l-9.9 9.9-4.604 1.265 1.265-4.604 9.9-9.9a1.5 1.5 0 012.122 0z" />
                            <path d="M13.95 6.4l3.651 3.651" />
                            <path d="M5 21h14" />
                          </svg>
                        </button>
                        <button
                          className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition hover:bg-white/20 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-60"
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
                            className="h-4 w-4"
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
                    {renderStatusBadge(court.status)}
                  </div>
                  <div className="relative flex flex-col items-center justify-center px-6 pb-12 pt-12 text-center">
                    <p className="mb-6 text-sm text-white/75">Add players to start the game</p>
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 rounded-md bg-[#1F49FF] px-4 py-2 text-sm font-semibold text-white shadow-[0_14px_24px_rgba(31,73,255,0.35)] transition-transform hover:-translate-y-0.5 hover:bg-[#2b57ff]"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="h-4 w-4"
                        aria-hidden="true"
                      >
                        <path d="M10 10a4 4 0 100-8 4 4 0 000 8zM2 17a6 6 0 1112 0H2zm13.25-7.75a.75.75 0 00-1.5 0V11h-1.75a.75.75 0 000 1.5h1.75v1.75a.75.75 0 001.5 0V12.5H17a.75.75 0 000-1.5h-1.75V9.25z" />
                      </svg>
                      Add Players
                    </button>
                  </div>
                </div>
              ))}
        </div>
        {!loadingCourts && courts.length === 0 && !courtsError && (
          <p className="mt-6 text-center text-sm text-white/60">No courts added yet.</p>
        )}
        {courts.length > 0 && !loadingCourts && (
          <div className="mt-6 flex justify-center">
            <button
              type="button"
              onClick={() => setConfirmClearModal(true)}
              disabled={isClearingCourts}
              className="rounded-full bg-white/10 px-6 py-2 text-sm font-semibold text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Clear courts
            </button>
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/[0.05] shadow-2xl shadow-black/30 backdrop-blur-lg">
        <div className="border-b border-white/5 px-4 pb-4 pt-6 sm:px-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <h2 className="text-xl font-semibold text-white/90">
              Pending Matches <span className="text-white/50">({matches.length})</span>
            </h2>
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
              <div className="relative w-full md:w-64">
                <input
                  type="text"
                  placeholder="Search by name..."
                  className="w-full rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm text-white placeholder:text-white/40 outline-none transition focus:border-white/30 focus:bg-white/10"
                />
                <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-white/40">
                  🔍
                </span>
              </div>
              <select className="w-full rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none transition focus:border-white/30 focus:bg-white/10 md:w-44">
                <option value="all">All Players</option>
                <option value="waiting">Waiting</option>
                <option value="playing">Playing</option>
              </select>
            </div>
          </div>
        </div>

        <div className="grid gap-4 px-4 pb-6 sm:px-6 md:grid-cols-2 xl:grid-cols-3">
          {matches.map((match) => (
              <div
                key={match.id}
                className="rounded-3xl border border-white/12 bg-white/[0.08] p-6 text-white shadow-lg shadow-black/25 backdrop-blur-md transition-transform hover:-translate-y-1 hover:shadow-[0_24px_45px_rgba(0,0,0,0.35)]"
              >
                <div className="flex flex-col items-center gap-2 text-center sm:flex-row sm:justify-between sm:text-left">
                  <div>
                    <span className="block text-sm uppercase tracking-wide text-white/60">#{match.id}</span>
                    <span className="text-lg font-semibold">{match.type}</span>
                  </div>
                  <span className="text-sm text-white/60">Requested {match.requestedAt}</span>
                </div>
                <div className="mt-5 flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.06] px-6 py-5 text-center text-white/90">
                  <div className="grid gap-4 text-white/90 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:items-center">
                    <div className="flex w-full flex-col items-center gap-4">
                      {match.teams.map((player) => {
                        const profile = playerProfiles[player.name] ?? { sex: 'male', skill: 'Recreational' }
                        return (
                          <div key={player.name} className="flex w-full flex-col items-center gap-2">
                            <TeamPlayerCard player={player} profile={profile} />
                          </div>
                        )
                      })}
                    </div>
                    <span className="mx-auto inline-flex items-center justify-center rounded-full bg-white/20 px-5 py-1.5 text-sm font-semibold text-white">
                      vs
                    </span>
                    <div className="flex w-full flex-col items-center gap-4">
                      {match.opponents.map((player) => {
                        const profile = playerProfiles[player.name] ?? { sex: 'male', skill: 'Recreational' }
                        return (
                          <div key={player.name} className="flex w-full flex-col items-center gap-2">
                            <TeamPlayerCard player={player} profile={profile} />
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>
          ))}
        </div>
      </section>

      {addCourtModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-md rounded-2xl border border-white/20 bg-[#11050b] p-6 shadow-[0_30px_50px_rgba(0,0,0,0.45)]">
            <h2 className="text-lg font-semibold text-white">Add new court</h2>
            <p className="mt-1 text-sm text-white/70">Provide a name for the court you want to create.</p>

            <form onSubmit={handleSubmitAddCourt} className="mt-5 space-y-5">
              <div>
                <label htmlFor="new-court-name" className="mb-2 block text-sm font-medium text-white/80">
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
                  className={`w-full rounded-xl border bg-white/5 px-4 py-2.5 text-sm text-white outline-none transition focus:border-white/40 focus:bg-white/10 ${
                    addCourtModal.error ? 'border-rose-400/70 focus:border-rose-300' : 'border-white/15'
                  }`}
                  placeholder={`Court ${nextCourtNumber}`}
                  autoFocus
                />
                {addCourtModal.error && <p className="mt-2 text-sm text-rose-300">{addCourtModal.error}</p>}
              </div>
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCloseAddCourtModal}
                  disabled={isSavingCourt}
                  className="rounded-full bg-white/10 px-5 py-2 text-sm font-semibold text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingCourt}
                  className="rounded-full bg-[#2663ff] px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-900/40 transition-colors hover:bg-[#2d6dff] disabled:cursor-not-allowed disabled:opacity-60"
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

    </QueueingShell>
  )
}

