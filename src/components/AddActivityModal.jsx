import { useState } from 'react'
import Modal from './Modal'

const EMPTY = { title: '', activity_date: '', start_time: '', location: '' }

// Presentational form. The parent owns the DB write via `onCreate`,
// which resolves on success or throws on failure.
export default function AddActivityModal({ open, onClose, onCreate, defaultDate }) {
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
    setLoading(true)
    try {
      // Fall back to defaultDate if the user never touched the pre-filled field.
      await onCreate({ ...form, activity_date: form.activity_date || defaultDate || '' })
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
    <Modal open={open} onClose={close} title="Add an activity">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
          <input
            type="text"
            required
            value={form.title}
            onChange={update('title')}
            placeholder="Visit the Colosseum"
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
            <input
              type="date"
              required
              value={form.activity_date || defaultDate || ''}
              onChange={update('activity_date')}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Start time</label>
            <input
              type="time"
              value={form.start_time}
              onChange={update('start_time')}
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
          <input
            type="text"
            value={form.location}
            onChange={update('location')}
            placeholder="Piazza del Colosseo, Rome"
            className={inputClass}
          />
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
            {loading ? 'Adding…' : 'Add activity'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
