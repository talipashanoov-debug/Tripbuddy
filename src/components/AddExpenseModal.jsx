import { useState } from 'react'
import Modal from './Modal'

const EMPTY = { description: '', amount: '' }

// Presentational form. The parent owns the DB write via `onCreate`,
// which resolves on success or throws on failure.
export default function AddExpenseModal({ open, onClose, onCreate }) {
  const [form, setForm] = useState(EMPTY)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const close = () => {
    if (loading) return
    setForm(EMPTY)
    setError('')
    onClose()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const amount = Number(form.amount)
    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Please enter an amount greater than 0.')
      return
    }

    setLoading(true)
    try {
      await onCreate({ description: form.description, amount })
      setForm(EMPTY)
      onClose()
    } catch (err) {
      setError(err.message ?? 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const inputClass =
    'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none'

  return (
    <Modal open={open} onClose={close} title="Add an expense">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
          <input
            type="text"
            required
            value={form.description}
            onChange={update('description')}
            placeholder="Dinner at Trattoria"
            className={inputClass}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Amount</label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
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
              className={`${inputClass} pl-7`}
            />
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
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-60"
          >
            {loading ? 'Adding…' : 'Add expense'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
