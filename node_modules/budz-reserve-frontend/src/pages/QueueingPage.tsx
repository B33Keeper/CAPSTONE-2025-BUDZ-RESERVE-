import { Fragment } from 'react'

const courts = [
  { id: 1, name: 'Court 1', status: 'available' },
  { id: 5, name: 'Court 5', status: 'available' },
  { id: 6, name: 'Court 6', status: 'available' },
]

const players = [
  { id: 1, name: 'Benito', skill: 'Beginner', gamesPlayed: 1, status: 'Available' },
  { id: 2, name: 'Filber', skill: 'Beginner', gamesPlayed: 1, status: 'Available' },
  { id: 3, name: 'Ivan', skill: 'Beginner', gamesPlayed: 1, status: 'Available' },
  { id: 4, name: 'Patrick', skill: 'Beginner', gamesPlayed: 1, status: 'Available' },
]

const NavButton = ({ label, active = false }: { label: string; active?: boolean }) => (
  <button
    className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
      active ? 'bg-white/15 text-white shadow-lg shadow-black/10' : 'text-white/80 hover:bg-white/10'
    }`}
    type="button"
  >
    {label}
  </button>
)

const CourtCard = ({ name }: { name: string }) => (
  <div className="relative rounded-2xl border border-white/5 bg-gradient-to-br from-white/5 via-white/[0.04] to-white/[0.02] shadow-xl shadow-black/30 backdrop-blur-sm overflow-hidden">
    <div className="absolute inset-0 bg-[url('/assets/img/home-page/shuttle%20cock.png')] opacity-[0.04] bg-center bg-cover pointer-events-none" />
    <div className="relative h-full flex flex-col">
      <div className="flex items-center justify-between px-5 pt-4 pb-3">
        <div className="flex items-center gap-2 text-white/90 font-semibold">
          <span>{name}</span>
          <div className="flex items-center gap-2 text-xs text-white/60">
            <span className="cursor-pointer hover:text-white/80 transition-colors">&#9998;</span>
            <span className="cursor-pointer hover:text-white/80 transition-colors">&#128295;</span>
            <span className="cursor-pointer hover:text-red-200 transition-colors">&#128465;</span>
          </div>
        </div>
        <span className="rounded-full border border-emerald-400/50 bg-emerald-500/10 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-300">
          Available
        </span>
      </div>
      <div className="flex flex-1 flex-col items-center justify-center px-6 pb-8 text-center">
        <p className="text-sm text-white/70 mb-6">Add players to start the game</p>
        <button
          type="button"
          className="rounded-full bg-[#1E42FF] px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-900/40 transition-transform hover:-translate-y-0.5 hover:bg-[#244dff]"
        >
          Add Players
        </button>
      </div>
    </div>
  </div>
)

const StatusBullet = ({ color }: { color: string }) => (
  <span
    className="inline-flex h-2.5 w-2.5 rounded-full"
    style={{ backgroundColor: color }}
  />
)

export function QueueingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#12040a] via-[#11040a] to-[#08040a] text-white">
      <header className="bg-[#d21d27] shadow-lg shadow-black/20">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-6">
            <span className="text-2xl font-bold tracking-wide">ShuttleFlow</span>
            <div className="hidden items-center gap-2 sm:flex">
              <NavButton label="Court" active />
              <NavButton label="Players" />
              <NavButton label="Fees" />
              <NavButton label="Settings" />
            </div>
          </div>
          <button
            type="button"
            className="rounded-full bg-[#2663ff] px-4 py-2 text-sm font-semibold shadow-lg shadow-blue-900/40 transition-colors hover:bg-[#2d6dff]"
          >
            + Add new court
          </button>
        </div>
      </header>

      <main className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-10">
        <section>
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-white/90">Court Management</h1>
          </div>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {courts.map((court) => (
              <CourtCard key={court.id} name={`Court ${court.id}`} />
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-white/5 bg-white/[0.04] shadow-xl shadow-black/20 backdrop-blur-md">
          <div className="border-b border-white/5 px-6 pb-4 pt-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <h2 className="text-xl font-semibold text-white/90">
                Player List <span className="text-white/50">(4)</span>
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
                <select className="w-full rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none transition focus:border-white/30 focus:bg-white/10 md:w-40">
                  <option value="name">Name</option>
                  <option value="skill">Skill level</option>
                  <option value="games">Games played</option>
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-hidden px-6 pb-6">
            <div className="overflow-x-auto rounded-2xl border border-white/5 bg-white/5">
              <table className="min-w-full divide-y divide-white/10 text-sm">
                <thead className="bg-white/8 text-left text-white/60">
                  <tr>
                    <th className="px-6 py-3 font-semibold uppercase tracking-wide">Name</th>
                    <th className="px-6 py-3 font-semibold uppercase tracking-wide">Skill Level</th>
                    <th className="px-6 py-3 font-semibold uppercase tracking-wide">Games Played</th>
                    <th className="px-6 py-3 font-semibold uppercase tracking-wide">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 bg-white/[0.02] text-white/80">
                  {players.map((player) => (
                    <Fragment key={player.id}>
                      <tr className="transition-colors hover:bg-white/8">
                        <td className="px-6 py-4 text-white">{player.name}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <StatusBullet color="#32d583" />
                            <span>{player.skill}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">{player.gamesPlayed}</td>
                        <td className="px-6 py-4">
                          <span className="rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-300">
                            {player.status}
                          </span>
                        </td>
                      </tr>
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

