import { QueueingShell } from '@/components/QueueingShell'

type Sex = 'male' | 'female'
type SkillLevel = 'Beginner' | 'Intermediate' | 'Advanced'

interface PlayerInfo {
  name: string
  sex: Sex
  skill: SkillLevel
}

interface MatchHistoryEntry {
  id: number
  type: string
  requestedAt: string
  teams: PlayerInfo[]
  opponents: PlayerInfo[]
  duration: string
  court: string
  winner: 'teams' | 'opponents'
}

const matches: MatchHistoryEntry[] = [
  {
    id: 2,
    type: 'Doubles',
    requestedAt: '02:29 PM',
    teams: [
      { name: 'Ivan', sex: 'male', skill: 'Intermediate' },
      { name: 'Filber', sex: 'male', skill: 'Beginner' },
    ],
    opponents: [
      { name: 'Patrick', sex: 'male', skill: 'Intermediate' },
      { name: 'Benito', sex: 'male', skill: 'Beginner' },
    ],
    duration: '0 minutes',
    court: 'Court 1',
    winner: 'teams',
  },
  {
    id: 1,
    type: 'Doubles',
    requestedAt: '03:51 AM',
    teams: [
      { name: 'Patrick', sex: 'male', skill: 'Intermediate' },
      { name: 'Benito', sex: 'male', skill: 'Beginner' },
    ],
    opponents: [
      { name: 'Filber', sex: 'male', skill: 'Beginner' },
      { name: 'Ivan', sex: 'male', skill: 'Intermediate' },
    ],
    duration: '3428 minutes',
    court: 'Court 1',
    winner: 'opponents',
  },
]

function PlayerBadge({ player }: { player: PlayerInfo }) {
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

function WinnerBadge() {
  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-200 shadow-[0_8px_18px_rgba(16,185,129,0.25)]">
      Winner
      <span role="img" aria-hidden>
        🏆
      </span>
    </div>
  )
}

function renderPlayer(player?: PlayerInfo) {
  if (!player) {
    return null
  }
  return <PlayerBadge player={player} />
}

export function QueueMatchHistoryPage() {
  return (
    <QueueingShell activeTab="history">
      <section className="rounded-3xl border border-white/10 bg-white/[0.05] shadow-2xl shadow-black/30 backdrop-blur-lg">
        <div className="flex flex-col gap-3 border-b border-white/10 px-4 py-5 sm:px-6 md:flex-row md:items-center md:justify-between">
          <input
            type="text"
            placeholder="Search by player name..."
            className="w-full rounded-2xl border border-white/12 bg-white/10 px-5 py-3 text-sm text-white placeholder:text-white/40 outline-none transition focus:border-white/40 focus:bg-white/15"
          />
          <input
            type="date"
            className="w-full rounded-2xl border border-white/12 bg-white/10 px-5 py-3 text-sm text-white placeholder:text-white/40 outline-none transition focus:border-white/40 focus:bg-white/15 md:w-56"
          />
        </div>
        <div className="space-y-4 px-4 pb-6 pt-4 sm:px-6">
          {matches.map((match) => (
            <div
              key={match.id}
              className="rounded-3xl border border-white/12 bg-white/[0.08] p-4 shadow-lg shadow-black/25 backdrop-blur-md transition-transform hover:-translate-y-1 hover:shadow-[0_24px_45px_rgba(0,0,0,0.35)] sm:p-5"
            >
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-white/70 font-semibold">#{match.id}</span>
                  <span className="rounded-full bg-purple-500/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-purple-200">
                    {match.type}
                  </span>
                </div>
                <span className="text-sm text-white/60">{match.requestedAt}</span>
              </div>

              <div className="mt-4 space-y-3 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-4 sm:px-5">
                {Array.from({ length: Math.max(match.teams.length, match.opponents.length) }).map((_, index) => {
                  const leftPlayer = match.teams[index]
                  const rightPlayer = match.opponents[index]
                  const showVs = index === Math.floor((Math.max(match.teams.length, match.opponents.length) - 1) / 2)

                  return (
                    <div
                      key={`${match.id}-${index}`}
                      className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 text-white/90"
                    >
                      <div className="flex items-center gap-2">
                        {renderPlayer(leftPlayer)}
                        {match.winner === 'teams' && index === 0 && <WinnerBadge />}
                      </div>
                      <span
                        className={`rounded-full bg-white/20 px-4 py-1 text-sm font-semibold text-white/90 ${
                          showVs ? 'opacity-100' : 'opacity-0 md:opacity-0'
                        }`}
                      >
                        vs
                      </span>
                      <div className="flex items-center justify-end gap-2 text-right">
                        {match.winner === 'opponents' && index === 0 && <WinnerBadge />}
                        {renderPlayer(rightPlayer)}
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-white/70">
                  <p className="text-xs uppercase tracking-wide text-white/40">Duration</p>
                  <p className="mt-2 text-sm font-semibold text-white">{match.duration}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-white/70">
                  <p className="text-xs uppercase tracking-wide text-white/40">Court</p>
                  <p className="mt-2 text-sm font-semibold text-white">{match.court}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </QueueingShell>
  )
}

