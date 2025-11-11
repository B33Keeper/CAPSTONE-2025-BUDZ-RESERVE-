import { ReactNode } from 'react'
import { Link } from 'react-router-dom'

const navItems = [
  {
    key: 'players',
    label: 'Players',
    to: '/queueing/players',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
        <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0z" />
        <path d="M5.5 14a3.5 3.5 0 117 0v.75a.75.75 0 01-.75.75h-5.5a.75.75 0 01-.75-.75V14z" />
        <path d="M15.25 9.5a1.75 1.75 0 11-3.5 0 1.75 1.75 0 013.5 0zM16 13.25a.75.75 0 01-.75.75h-1.5a.75.75 0 01-.75-.75v-.25a2.25 2.25 0 114.5 0v.25a.75.75 0 01-.75.75h-1.5z" />
      </svg>
    ),
  },
  {
    key: 'queue',
    label: 'Queue',
    to: '/queueing',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
        <path d="M5 3a2 2 0 00-2 2v2.586A2 2 0 003.586 9L5 10.414V16a1 1 0 001.447.894l3.106-1.553 3.106 1.553A1 1 0 0014 16v-5.586L15.414 9A2 2 0 0016 7.586V5a2 2 0 00-2-2H5z" />
      </svg>
    ),
  },
  {
    key: 'history',
    label: 'Match History',
    to: '/queueing/history',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
        <path d="M10 2a8 8 0 104.906 14.32.75.75 0 10-.812-1.26A6.5 6.5 0 1116.5 10a.75.75 0 101.5 0A8 8 0 0010 2z" />
        <path d="M10 5.25a.75.75 0 00-.75.75v4l2.5 2.5a.75.75 0 001.06-1.06L10.75 9.5V6a.75.75 0 00-.75-.75z" />
      </svg>
    ),
  },
  {
    key: 'settings',
    label: 'ManageFees',
    to: '/queueing/settings',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
        <path d="M10.75 3a.75.75 0 00-1.5 0v1.128a5.5 5.5 0 00-2.796 1.16L5.5 4.333a.75.75 0 10-1 1.124l.964.857a5.5 5.5 0 000 2.372l-.964.857a.75.75 0 001 1.124l.954-.82A5.5 5.5 0 009.25 15.872V17a.75.75 0 001.5 0v-1.128a5.5 5.5 0 002.796-1.16l.954.82a.75.75 0 101-1.124l-.964-.857a5.5 5.5 0 000-2.372l.964-.857a.75.75 0 10-1-1.124l-.954.82a5.5 5.5 0 00-2.796-1.16V3zm-3.5 7a3.5 3.5 0 117 0 3.5 3.5 0 01-7 0z" />
      </svg>
    ),
  },
]

interface QueueingShellProps {
  activeTab: 'players' | 'queue' | 'settings' | 'history'
  children: ReactNode
}

export function QueueingShell({ activeTab, children }: QueueingShellProps) {
  return (
    <div
      className="relative min-h-screen overflow-hidden text-white"
      style={{
        backgroundImage: "url('/assets/img/queueing-bg.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      <div className="pointer-events-none absolute inset-0 bg-[#0a0308]/78 backdrop-blur-[2px]" />

      <header className="fixed top-0 left-0 right-0 z-30 bg-gradient-to-b from-[#0a0308]/95 via-[#0a0308]/50 to-transparent backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:px-6 sm:py-6">
          <div className="flex w-full flex-wrap items-center justify-between gap-3 sm:w-auto sm:flex-nowrap">
            <Link
              to="/"
              className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                <path d="M9.707 3.293a1 1 0 010 1.414L6.414 8H16a1 1 0 110 2H6.414l3.293 3.293a1 1 0 01-1.414 1.414l-5-5a1 1 0 010-1.414l5-5a1 1 0 011.414 0z" />
              </svg>
              Back to Home Screen
            </Link>
            <Link to="/" className="flex items-center gap-2">
              <span className="text-2xl font-semibold tracking-wide text-white drop-shadow">BudzSmash</span>
            </Link>
          </div>
          <nav className="-mx-1 flex w-full flex-wrap items-center justify-center gap-2 overflow-x-auto pb-1 sm:mx-0 sm:w-auto sm:justify-end sm:overflow-visible sm:pb-0">
            {navItems.map((item) => {
              const isActive = item.key === activeTab
              return (
                <Link
                  key={item.key}
                  to={item.to}
                  className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                    isActive
                      ? 'bg-white/20 text-white shadow-lg shadow-black/30 backdrop-blur'
                      : 'text-white/75 hover:bg-white/12'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {item.icon}
                    <span>{item.label}</span>
                  </span>
                </Link>
              )
            })}
          </nav>
        </div>
      </header>

      <main className="relative z-10 mx-auto mt-28 flex max-w-6xl flex-col gap-10 px-4 pb-10 sm:px-6">
        {children}
      </main>
    </div>
  )
}


