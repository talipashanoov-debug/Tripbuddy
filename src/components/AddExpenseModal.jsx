import { useEffect, useState } from 'react'
import Modal from './Modal'
import { EXPENSE_CATEGORIES } from '../lib/expenseCategories'
import { t } from '../lib/strings'

export default function AddExpenseModal({ open, onClose, onCreate, participants }) {
  const [form, setForm] = useState({ description: '', amount: '', category: 'Food' })
  const [paidBy, setPaidBy] = useState('')
  const [sharers, setSharers] = useState(() => new Set())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Sensible defaults each time the modal opens: first participant pays,
  // everyone shares.
  useEffect(() => {
    if (!open) return
    setForm({ description: '', amount: '', category: 'Food' })
    setError('')
    setPaidBy(participants[0]?.id ?? '')
    setSharers(new Set(participants.map((p) => p.id)))
  }, [open, participants])

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const toggleSharer = (id) =>
    setSharers((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  const allSelected = participants.length > 0 && sharers.size === participants.length
  const toggleAll = () =>
    setSharers(allSelected ? new Set() : new Set(participants.map((p) => p.id)))

  const close = () => {
    if (loading) return
    onClose()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const amount = Number(form.amount)
    if (!Number.isFinite(amount) || amount <= 0) return setError(t.expenses.amountError)
    if (!paidBy) return setError(t.expenses.payerError)
    if (sharers.size === 0) return setError(t.expenses.participantsError)

    setLoading(true)
    try {
      await onCreate({
        description: form.description,
        amount,
        category: form.category,
        paidBy,
        sharerIds: Array.from(sharers),
      })
      onClose()
    } catch (err) {
      setError(err.message ?? 'שגיאה. נסו שוב.')
    } finally {
      setLoading(false)
    }
  }

  const inputClass =
    'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200'

  return (
    <Modal open={open} onClose={close} title={t.expenses.modalHeading}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            {t.expenses.description}
          </label>
          <input
            type="text"
            required
            value={form.description}
            onChange={update('description')}
            placeholder="ארוחת ערב במסעדה"
            className={inputClass}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            {t.expenses.category}
          </label>
          <select value={form.category} onChange={update('category')} className={inputClass}>
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            {t.expenses.amount}
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
              $
            </span>
            <input
              type="number"
              required
              min="0"
              step="0.01"
              value={form.amount}
              onChange={update('amount')}
              placeholder="0.00"
              className={`${inputClass} pe-7`}
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            {t.expenses.paidBy}
          </label>
          <select value={paidBy} onChange={(e) => setPaidBy(e.target.value)} className={inputClass}>
            {participants.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between">
            <label className="text-sm font-medium text-slate-700">
              {t.expenses.splitBetween}
            </label>
            <button
              type="button"
              onClick={toggleAll}
              className="text-xs font-medium text-emerald-600 hover:text-emerald-700"
            >
              {allSelected ? t.expenses.clearAll : t.expenses.selectAll}
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {participants.map((p) => {
              const on = sharers.has(p.id)
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => toggleSharer(p.id)}
                  className={`rounded-full px-3 py-1 text-sm ring-1 transition-colors ${
                    on
                      ? 'bg-emerald-600 text-white ring-emerald-600'
                      : 'bg-white text-slate-600 ring-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {p.name}
                </button>
              )
            })}
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={close}
            disabled={loading}
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 active:bg-slate-200 disabled:opacity-60"
          >
            {t.expenses.cancel}
          </button>
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-60"
          >
            {loading ? t.expenses.saving : t.expenses.save}
          </button>
        </div>
      </form>
    </Modal>
  )
}
