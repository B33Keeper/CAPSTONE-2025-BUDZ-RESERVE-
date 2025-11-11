import { useEffect, useRef, useState } from 'react'
import { QueueingShell } from '@/components/QueueingShell'

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

const players = [
  { id: 1, name: 'Benito', sex: 'male' as const, skill: 'Beginner', gamesPlayed: 1, status: 'In Queue', lastPlayed: '2025-11-09' },
  { id: 2, name: 'Filber', sex: 'male' as const, skill: 'Beginner', gamesPlayed: 1, status: 'In Queue', lastPlayed: '2025-11-10' },
  { id: 3, name: 'Ivan', sex: 'male' as const, skill: 'Beginner', gamesPlayed: 1, status: 'In Queue', lastPlayed: '2025-11-10' },
  { id: 4, name: 'Patrick', sex: 'male' as const, skill: 'Beginner', gamesPlayed: 1, status: 'In Queue', lastPlayed: '2025-11-08' },
  { id: 5, name: 'Amelia', sex: 'female' as const, skill: 'Intermediate', gamesPlayed: 3, status: 'Waiting', lastPlayed: '2025-11-07' },
  { id: 6, name: 'Diana', sex: 'female' as const, skill: 'Advanced', gamesPlayed: 5, status: 'In Queue', lastPlayed: '2025-11-06' },
]

const skillLevels = ['Beginner', 'Intermediate', 'Advanced']

export function QueuePlayersPage() {
  const sortOptions: DropdownOption[] = [
    { label: 'Name', value: 'name' },
    { label: 'Skill level', value: 'skill' },
    { label: 'Games played', value: 'games' }
  ]

  const gameTypeOptions: DropdownOption[] = [
    { label: "Men's Doubles", value: 'mens-doubles' },
    { label: "Women's Doubles", value: 'womens-doubles' },
    { label: 'Mixed Doubles', value: 'mixed-doubles' }
  ]

  const [sortBy, setSortBy] = useState(sortOptions[0].value)
  const [gameType, setGameType] = useState(gameTypeOptions[0].value)
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [historyDateFilter, setHistoryDateFilter] = useState('')

  const filteredHistoryPlayers = historyDateFilter
    ? players.filter((player) => player.lastPlayed === historyDateFilter)
    : players

  return (
    <QueueingShell activeTab="players">
      <section className="rounded-3xl border border-white/10 bg-white/[0.08] p-5 shadow-2xl shadow-black/30 backdrop-blur-lg sm:p-6">
        <div className="space-y-6">
          <div className="space-y-4">
            <h2 className="text-center text-xl font-semibold text-white">Enter Player</h2>
            <input
              type="text"
              placeholder="Enter player name"
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
                    className="rounded-full bg-indigo-500/90 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/40"
                  >
                    Male
                  </button>
                  <button
                    type="button"
                    className="rounded-full bg-white/10 px-5 py-2 text-sm font-semibold text-white/80 transition hover:bg-white/15"
                  >
                    Female
                  </button>
                </div>
              </div>

              <div className="flex flex-col items-center gap-3 text-center">
                <span className="text-xs font-semibold uppercase tracking-wide text-white/70">Skill Level</span>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  {skillLevels.map((level, index) => (
                    <button
                      key={level}
                      type="button"
                      className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
                        index === 0
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
                className="inline-flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-2xl bg-[#1f49ff] px-6 py-3 text-sm font-semibold text-white shadow-[0_20px_35px_rgba(31,73,255,0.35)] transition hover:-translate-y-0.5 hover:bg-[#2b57ff] sm:w-auto"
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
                  className="w-full rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm text-white placeholder:text-white/40 outline-none transition focus:border-white/30 focus:bg-white/10"
                />
                <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-base text-white/40">
                  🔍
                </span>
              </div>

              <DropdownField
                label="Sort By"
                options={sortOptions}
                value={sortBy}
                onChange={setSortBy}
                className="max-w-xs sm:w-40"
              />

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
          </div>
        </div>

        <div className="overflow-hidden px-4 pb-6 sm:px-6">
          <div className="overflow-x-auto rounded-3xl border border-white/10 bg-white/[0.07]">
            <table className="min-w-full divide-y divide-white/10 text-sm text-white/80">
              <thead className="bg-white/8 text-left uppercase tracking-wide text-white/60">
                <tr>
                  <th className="px-6 py-3 font-semibold">Name</th>
                  <th className="px-6 py-3 font-semibold">Skill Level</th>
                  <th className="px-6 py-3 font-semibold">Games Played</th>
                  <th className="px-6 py-3 font-semibold">Status</th>
                  <th className="px-6 py-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/8">
                {players.map((player) => (
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
                      <button
                        type="button"
                        className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white/80 transition hover:border-red-300 hover:bg-red-500/20 hover:text-red-200"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

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
            <div className="space-y-4 pr-10 sm:pr-12">
              <div className="flex flex-col gap-2">
                <h3 className="text-2xl font-semibold text-white">Players History</h3>
                <p className="text-sm text-white/70">Review previously queued players and filter by play date.</p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <label className="flex flex-col text-sm font-medium text-white/70">
                  <span className="mb-1 uppercase tracking-wide text-white/50">Filter by date</span>
                  <input
                    type="date"
                    value={historyDateFilter}
                    onChange={(event) => setHistoryDateFilter(event.target.value)}
                    className="rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-sm text-white outline-none transition focus:border-white/40 focus:bg-white/15"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => setHistoryDateFilter('')}
                  className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white/80 transition hover:-translate-y-0.5 hover:bg-white/15 hover:text-white"
                >
                  Clear Filter
                </button>
              </div>
              <div className="mx-auto w-full max-w-3xl overflow-hidden rounded-2xl border border-white/10 bg-white/[0.07]">
                <table className="min-w-full divide-y divide-white/10 text-sm text-white/80">
                  <thead className="bg-white/10 uppercase tracking-wide text-white/60">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold sm:px-6">Name</th>
                      <th className="px-4 py-3 text-left font-semibold sm:px-6">Skill Level</th>
                      <th className="px-4 py-3 text-left font-semibold sm:px-6">Games Played</th>
                      <th className="px-4 py-3 text-left font-semibold sm:px-6">Last Played</th>
                      <th className="px-4 py-3 text-left font-semibold sm:px-6">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {filteredHistoryPlayers.map((player) => {
                      const formattedDate = new Date(player.lastPlayed).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })

                      return (
                        <tr key={`history-${player.id}`} className="transition hover:bg-white/10">
                          <td className="px-4 py-3 font-semibold text-white sm:px-6">{player.name}</td>
                          <td className="px-4 py-3 sm:px-6">{player.skill}</td>
                          <td className="px-4 py-3 sm:px-6">{player.gamesPlayed}</td>
                          <td className="px-4 py-3 sm:px-6">{formattedDate}</td>
                          <td className="px-4 py-3 sm:px-6">
                            <button
                              type="button"
                              className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-white/80 transition hover:-translate-y-0.5 hover:bg-white/15 hover:text-white"
                            >
                              Get
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                    {filteredHistoryPlayers.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-6 text-center text-sm text-white/60 sm:px-6">
                          No players found for the selected date.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </QueueingShell>
  )
}


