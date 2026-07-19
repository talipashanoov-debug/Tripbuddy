import { useState } from 'react'
import { Users, UserPlus, X } from 'lucide-react'
import { t } from '../lib/strings'

// Presentational: the parent (Expenses) owns the participants list and the
// add/delete handlers so there's a single source of truth for the whole tab.
export default function Participants({ participants, onAdd, onDelete, error }) {
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)

  const add = async (e) => {
    e.preventDefault()
    const value = name.trim()
    if (!value) return
    setBusy(true)
    try {
      await onAdd(value)
      setName('')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mb-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className="flex items-center gap-2">
        <Users className="h-5 w-5 text-emerald-600" />
        <h3 className="font-semibold text-slate-800">{t.participants.heading}</h3>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
          {participants.length}
        </span>
      </div>

      {participants.length === 0 ? (
        <p className="mt-3 text-sm text-slate-500">{t.participants.empty}</p>
      ) : (
        <div className="mt-4 flex flex-wrap gap-2">
          {participants.map((p) => (
            <span
              key={p.id}
              className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 py-1 pe-2 ps-3 text-sm ring-1 ring-slate-200"
            >
              <span className="text-slate-700">{p.name}</span>
              <button
                onClick={() => onDelete(p.id)}
                aria-label={t.participants.deleteAria}
                className="rounded-full p-0.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500 active:bg-red-100"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <form onSubmit={add} className="mt-4 flex flex-col gap-2 sm:flex-row">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t.participants.placeholder}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
        />
        <button
          type="submit"
          disabled={busy || !name.trim()}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-60"
        >
          <UserPlus className="h-4 w-4" />
          {t.participants.add}
        </button>
      </form>
    </div>
  )
}
