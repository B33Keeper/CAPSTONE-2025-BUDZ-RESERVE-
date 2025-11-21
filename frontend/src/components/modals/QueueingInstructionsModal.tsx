import { useEffect, useState } from 'react'

interface QueueingInstructionsModalProps {
  isOpen: boolean
  onClose: () => void
}

export function QueueingInstructionsModal({ isOpen, onClose }: QueueingInstructionsModalProps) {
  const [dontShowAgain, setDontShowAgain] = useState(false)

  useEffect(() => {
    // Check if user has permanently disabled instructions
    const permanentlyDisabled = localStorage.getItem('queueing-instructions-seen') === 'true'
    if (permanentlyDisabled) {
      setDontShowAgain(true)
    }
  }, [])

  if (!isOpen) {
    return null
  }

  const handleClose = () => {
    // If "Don't show again" is checked, save to localStorage (permanent)
    if (dontShowAgain) {
      localStorage.setItem('queueing-instructions-seen', 'true')
    } else {
      // Otherwise, just mark as seen in this session
      sessionStorage.setItem('queueing-instructions-seen-this-session', 'true')
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-2xl rounded-3xl border border-white/20 bg-[#0a0308]/95 backdrop-blur-lg shadow-2xl shadow-black/50 overflow-hidden">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white/80 transition hover:bg-white/20 hover:text-white"
          aria-label="Close instructions"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-5 w-5"
          >
            <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
          </svg>
        </button>

        {/* Header */}
        <div className="border-b border-white/10 bg-gradient-to-r from-white/5 to-transparent px-6 py-5">
          <h2 className="text-2xl font-bold text-white">Welcome to Queueing System</h2>
          <p className="mt-1 text-sm text-white/70">Learn how to manage your queue efficiently</p>
        </div>

        {/* Content */}
        <div className="max-h-[60vh] overflow-y-auto px-6 py-6">
          <div className="space-y-6">
            {/* Section 1: Players */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="h-5 w-5 text-white"
                  >
                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path d="M5.5 14a3.5 3.5 0 117 0v.75a.75.75 0 01-.75.75h-5.5a.75.75 0 01-.75-.75V14z" />
                    <path d="M15.25 9.5a1.75 1.75 0 11-3.5 0 1.75 1.75 0 013.5 0zM16 13.25a.75.75 0 01-.75.75h-1.5a.75.75 0 01-.75-.75v-.25a2.25 2.25 0 114.5 0v.25a.75.75 0 01-.75.75h-1.5z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white">Players Management</h3>
              </div>
              <ul className="ml-13 space-y-2 text-sm text-white/80">
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-white/40" />
                  <span>Add players by entering their name, selecting sex (Male/Female), and skill level (Beginner/Intermediate/Advanced)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-white/40" />
                  <span>Players stay in the current list until manually deleted - they won't automatically move to history after matches</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-white/40" />
                  <span>Use "Generate Matches" to automatically create matches based on game type (Men's/Women's/Mixed Doubles)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-white/40" />
                  <span>View player history to see previously deleted players and import them back if needed</span>
                </li>
              </ul>
            </div>

            {/* Section 2: Queue Management */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="h-5 w-5 text-white"
                  >
                    <path d="M5 3a2 2 0 00-2 2v2.586A2 2 0 003.586 9L5 10.414V16a1 1 0 001.447.894l3.106-1.553 3.106 1.553A1 1 0 0014 16v-5.586L15.414 9A2 2 0 0016 7.586V5a2 2 0 00-2-2H5z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white">Queue Management</h3>
              </div>
              <ul className="ml-13 space-y-2 text-sm text-white/80">
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-white/40" />
                  <span>Add courts to track available playing spaces</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-white/40" />
                  <span>Matches can be created manually or generated automatically from the Players page</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-white/40" />
                  <span>Complete matches when finished - players will automatically return to the queue</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-white/40" />
                  <span>Cancel matches if needed - players will be freed up for other matches</span>
                </li>
              </ul>
            </div>

            {/* Section 3: Fee Management */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="h-5 w-5 text-white"
                  >
                    <path d="M10.75 3a.75.75 0 00-1.5 0v1.128a5.5 5.5 0 00-2.796 1.16L5.5 4.333a.75.75 0 10-1 1.124l.964.857a5.5 5.5 0 000 2.372l-.964.857a.75.75 0 001 1.124l.954-.82A5.5 5.5 0 009.25 15.872V17a.75.75 0 001.5 0v-1.128a5.5 5.5 0 002.796-1.16l.954.82a.75.75 0 101-1.124l-.964-.857a5.5 5.5 0 000-2.372l.964-.857a.75.75 0 10-1-1.124l-.954.82a5.5 5.5 0 00-2.796-1.16V3zm-3.5 7a3.5 3.5 0 117 0 3.5 3.5 0 01-7 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white">Fee Management</h3>
              </div>
              <ul className="ml-13 space-y-2 text-sm text-white/80">
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-white/40" />
                  <span>Set doubles fee (per game) and court fee in the settings</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-white/40" />
                  <span>View current fees for today's players and mark payments as paid/unpaid</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-white/40" />
                  <span>Check fee history for previous days to review past transactions</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-white/40" />
                  <span>Export fee reports as PDF for record keeping</span>
                </li>
              </ul>
            </div>

            {/* Section 4: Match History */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="h-5 w-5 text-white"
                  >
                    <path d="M10 2a8 8 0 104.906 14.32.75.75 0 10-.812-1.26A6.5 6.5 0 1116.5 10a.75.75 0 101.5 0A8 8 0 0010 2z" />
                    <path d="M10 5.25a.75.75 0 00-.75.75v4l2.5 2.5a.75.75 0 001.06-1.06L10.75 9.5V6a.75.75 0 00-.75-.75z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white">Match History</h3>
              </div>
              <ul className="ml-13 space-y-2 text-sm text-white/80">
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-white/40" />
                  <span>View all completed matches organized by date</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-white/40" />
                  <span>See match results, winners, and player statistics</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-white/40" />
                  <span>Track game history for reporting and analysis</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-white/10 bg-gradient-to-r from-transparent to-white/5 px-6 py-4">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-white/70">
              <input
                type="checkbox"
                checked={dontShowAgain}
                onChange={(e) => {
                  setDontShowAgain(e.target.checked)
                  // If unchecking, remove from localStorage but keep sessionStorage
                  if (!e.target.checked) {
                    localStorage.removeItem('queueing-instructions-seen')
                  }
                }}
                className="h-4 w-4 rounded border-white/20 bg-white/10 text-blue-600 focus:ring-2 focus:ring-blue-500"
              />
              <span>Don't show this again</span>
            </label>
            <button
              onClick={handleClose}
              className="rounded-full bg-[#2663ff] px-6 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-900/40 transition-colors hover:bg-[#2d6dff]"
            >
              Got it!
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

