import { useState } from 'react'
import Modal from './Modal'

const EMPTY = { title: '', destination: '', start_date: '', end_date: '' }

// Presentational form. The parent owns the actual DB write via `onCreate`,
// which should resolve on success or throw on failure.
export default function CreateTripModal({ open, onClose, onCreate }) {
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

    if (form.end_date && form.start_date && form.end_date < form.start_date) {
      setError('End date cannot be before the start date.')
      return
    }

    setLoading(true)
    try {
      await onCreate(form)
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
    <Modal open={open} onClose={close} title="Create a new trip">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
          <input
            type="text"
            required
            value={form.title}
            onChange={update('title')}
            placeholder="Summer in Italy"
            className={inputClass}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Destination</label>
          <input
            type="text"
            required
            value={form.destination}
            onChange={update('destination')}
            placeholder="Rome, Italy"
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Start date</label>
            <input
              type="date"
              required
              value={form.start_date}
              onChange={update('start_date')}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">End date</label>
            <input
              type="date"
              required
              value={form.end_date}
              onChange={update('end_date')}
              className={inputClass}
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
            {loading ? 'Creating…' : 'Create trip'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
