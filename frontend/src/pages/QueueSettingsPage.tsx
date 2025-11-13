import { useState, ChangeEvent, useMemo, useCallback } from 'react'
import { QueueingShell } from '@/components/QueueingShell'

type FeeFormState = {
  doublesFee: string
  courtFee: string
  currency: string
}

const initialFeeState: FeeFormState = {
  doublesFee: '30',
  courtFee: '150',
  currency: 'PHP (₱)',
}

type FeeRow = {
  label: string
  sex: 'male' | 'female'
  games: number
  shuttleFee: number
  courtFee: number
  status: 'paid' | 'unpaid'
}

const initialFeeRows: FeeRow[] = [
  { label: 'Ivan', sex: 'male', games: 2, shuttleFee: 30, courtFee: 0, status: 'paid' },
  { label: 'Filber', sex: 'male', games: 2, shuttleFee: 30, courtFee: 0, status: 'unpaid' },
  { label: 'Patrick', sex: 'male', games: 2, shuttleFee: 30, courtFee: 0, status: 'unpaid' },
  { label: 'Benito', sex: 'male', games: 2, shuttleFee: 30, courtFee: 0, status: 'unpaid' },
]

export function QueueSettingsPage() {
  const [isEditing, setIsEditing] = useState(false)
  const [feeForm, setFeeForm] = useState<FeeFormState>(initialFeeState)
  const [rows, setRows] = useState<FeeRow[]>(initialFeeRows)
  const [searchQuery, setSearchQuery] = useState('')

  const handleInputChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target
    setFeeForm((prev) => ({ ...prev, [name]: value } as FeeFormState))
  }

  const currencySymbol = useMemo(() => {
    const match = feeForm.currency.match(/\(([^)]+)\)/)
    return match ? match[1] : '₱'
  }, [feeForm.currency])

  const formatCurrency = useCallback(
    (value: number) => `${currencySymbol}${Number.isFinite(value) ? value.toFixed(2) : '0.00'}`,
    [currencySymbol]
  )

  const displayValue = useCallback((value: string) => formatCurrency(Number(value || 0)), [formatCurrency])

  const totals = useMemo(() => {
    return rows.reduce(
      (acc, row) => {
        const total = row.shuttleFee + row.courtFee
        if (row.status === 'paid') {
          acc.collected += total
        } else {
          acc.outstanding += total
        }
        return acc
      },
      { collected: 0, outstanding: 0 }
    )
  }, [rows])

  const filteredRows = useMemo(() => {
    if (!searchQuery.trim()) return rows
    const query = searchQuery.toLowerCase()
    return rows.filter((row) => row.label.toLowerCase().includes(query))
  }, [rows, searchQuery])

  const handleTogglePaymentStatus = useCallback((player: string) => {
    setRows((prev) =>
      prev.map((row) =>
        row.label === player ? { ...row, status: row.status === 'paid' ? 'unpaid' : 'paid' } : row
      )
    )
  }, [])

  return (
    <QueueingShell activeTab="settings">
      <section className="rounded-3xl border border-white/10 bg-white/[0.05] text-white shadow-2xl shadow-black/30 backdrop-blur-lg">
        <div className="space-y-6 px-4 py-6 sm:px-6">
          {isEditing ? (
            <div className="space-y-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-lg font-semibold">Fee Configuration</h2>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold uppercase tracking-wide text-white/80">
                    Doubles Player Shuttle Fee
                  </label>
                  <div className="rounded-xl border border-white/25 bg-white/80 px-4 py-3 text-sm text-slate-900 shadow-inner">
                    <input
                      type="number"
                      name="doublesFee"
                      value={feeForm.doublesFee}
                      onChange={handleInputChange}
                      className="w-full bg-transparent outline-none"
                      min="0"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold uppercase tracking-wide text-white/80">
                    Court Fee per Player
                  </label>
                  <div className="rounded-xl border border-white/25 bg-white/80 px-4 py-3 text-sm text-slate-900 shadow-inner">
                    <input
                      type="number"
                      name="courtFee"
                      value={feeForm.courtFee}
                      onChange={handleInputChange}
                      className="w-full bg-transparent outline-none"
                      min="0"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-white/80">Select Currency</label>
                <select
                  name="currency"
                  value={feeForm.currency}
                  onChange={handleInputChange}
                  className="rounded-xl border border-white/25 bg-white/80 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-white/40"
                >
                  <option value="PHP (₱)">PHP (₱)</option>
                  <option value="USD ($)">USD ($)</option>
                  <option value="EUR (€)">EUR (€)</option>
                </select>
              </div>

              <p className="text-xs text-white/70">Flat fee per player for unlimited play.</p>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setFeeForm(initialFeeState)
                    setIsEditing(false)
                  }}
                  className="rounded-md border border-white/40 px-4 py-2 text-xs font-semibold text-white/80 transition hover:bg-white/20"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="rounded-md bg-emerald-500 px-5 py-2 text-xs font-semibold text-white shadow-lg shadow-emerald-500/40 transition hover:bg-emerald-600"
                >
                  Save Changes
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-lg font-semibold">Fee Configuration</h2>
                <button
                  className="rounded-md bg-blue-500 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-blue-500/30 transition hover:bg-blue-600"
                  onClick={() => setIsEditing(true)}
                >
                  Edit fees
                </button>
              </div>
              <div className="rounded-xl border border-white/20 bg-white/15 px-4 py-3 text-sm font-semibold text-white">
                Doubles Player Shuttle Fee
                <p className="mt-1 text-base text-white">{displayValue(feeForm.doublesFee)}</p>
              </div>
              <div className="rounded-xl border border-white/20 bg-white/15 px-4 py-3 text-sm font-semibold text-white">
                Court Fee per Player
                <p className="mt-1 text-base text-white">{displayValue(feeForm.courtFee)}</p>
              </div>
              <div className="rounded-xl border border-white/20 bg-white/15 px-4 py-3 text-sm font-semibold text-white/85">
                Billing Currency
                <p className="mt-1 text-base text-white">{feeForm.currency}</p>
              </div>
            </div>
          )}

          <div className="space-y-4 rounded-2xl border border-white/15 bg-white/15 px-5 py-4 text-sm text-white">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-base font-semibold">Fee Management</h3>
              <button className="rounded-md bg-blue-500 px-3 py-2 text-xs font-semibold text-white shadow-lg shadow-blue-500/30 transition hover:bg-blue-600">
                Export
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-emerald-100/90 px-4 py-3 text-emerald-700">
                <p className="text-xs uppercase tracking-wide">Collected</p>
                <p className="mt-1 text-xl font-semibold">{formatCurrency(totals.collected)}</p>
              </div>
              <div className="rounded-xl bg-amber-100/90 px-4 py-3 text-amber-700">
                <p className="text-xs uppercase tracking-wide">Outstanding</p>
                <p className="mt-1 text-xl font-semibold">{formatCurrency(totals.outstanding)}</p>
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <input
                type="text"
                placeholder="Search players..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="w-full max-w-xs rounded-xl border border-white/20 bg-white/20 px-4 py-2 text-xs text-white placeholder:text-white/60 outline-none transition focus:border-white/40 focus:bg-white/25"
              />
            </div>
            <div className="overflow-hidden rounded-xl border border-white/15">
              <div className="overflow-x-auto">
                <table className="w-full divide-y divide-white/20 text-xs">
                  <thead className="bg-white/15 uppercase tracking-wide text-white/70">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">Player</th>
                      <th className="px-4 py-3 text-center font-semibold">Games Played</th>
                      <th className="px-4 py-3 text-left font-semibold">Shuttle Fees</th>
                      <th className="px-4 py-3 text-left font-semibold">Court Fee</th>
                      <th className="px-4 py-3 text-left font-semibold">Total</th>
                      <th className="px-4 py-3 text-left font-semibold">Status</th>
                      <th className="px-4 py-3 text-right font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/15 text-white/85">
                  {filteredRows.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-6 text-center text-sm text-white/60">
                        No players match the current search.
                      </td>
                    </tr>
                  )}
                  {filteredRows.map((row) => (
                    <tr key={row.label} className="bg-white/10 transition hover:bg-white/15">
                        <td className="px-4 py-2 font-semibold text-white">
                          <div className="flex items-center gap-2">
                            <span
                              className={`inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-sm shadow-inner ${
                                row.sex === 'male' ? 'bg-sky-500/15 text-sky-300' : 'bg-pink-500/15 text-pink-300'
                              }`}
                              aria-label={row.sex === 'male' ? 'Male player' : 'Female player'}
                              title={row.sex === 'male' ? 'Male player' : 'Female player'}
                            >
                              {row.sex === 'male' ? (
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                                  <path d="M13.5 2a.75.75 0 000 1.5h1.69l-3.2 3.2a4.5 4.5 0 10.884.884l3.2-3.2V6.5a.75.75 0 001.5 0V2.75A.75.75 0 0016.75 2H13.5zm-4 5a3 3 0 110 6 3 3 0 010-6z" />
                                </svg>
                              ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                                  <path d="M10 2a4.5 4.5 0 10.878 8.9l-.378.378H8.75a.75.75 0 000 1.5h1.25v1.25a.75.75 0 001.5 0V12.78l.378-.378A4.5 4.5 0 0010 2zm0 1.5a3 3 0 110 6 3 3 0 010-6z" />
                                </svg>
                              )}
                            </span>
                            <span>{row.label}</span>
                          </div>
                        </td>
                        <td className="px-4 py-2 text-center">{row.games}</td>
                        <td className="px-4 py-2">{formatCurrency(row.shuttleFee)}</td>
                        <td className="px-4 py-2">{formatCurrency(row.courtFee)}</td>
                        <td className="px-4 py-2">{formatCurrency(row.shuttleFee + row.courtFee)}</td>
                        <td className="px-4 py-2">
                          {row.status === 'paid' ? (
                            <span className="inline-flex items-center rounded-md bg-emerald-500/20 px-3 py-1 text-[11px] font-semibold text-emerald-200 shadow-inner">
                              Paid
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-md bg-white/20 px-3 py-1 text-[11px] font-semibold text-white/80 shadow-inner">
                              Unpaid
                            </span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-4 py-2 text-right">
                          {row.status === 'paid' ? (
                            <button
                              type="button"
                              onClick={() => handleTogglePaymentStatus(row.label)}
                              className="rounded-md border border-white/30 px-3 py-1 text-[11px] font-semibold text-white/70 transition hover:bg-white/10 hover:text-white"
                            >
                              Mark Unpaid
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleTogglePaymentStatus(row.label)}
                              className="rounded-md bg-emerald-500 px-4 py-1 text-[11px] font-semibold text-white shadow transition hover:bg-emerald-600"
                            >
                              Set Paid
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </section>
    </QueueingShell>
  )
}


