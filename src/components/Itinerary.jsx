import { useCallback, useEffect, useMemo, useState } from 'react'
import { Clock, MapPin, Plus, CalendarDays, Trash2 } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { formatDayHeading, formatTime } from '../lib/formatDate'
import { t } from '../lib/strings'
import AddActivityModal from './AddActivityModal'

// Keep a flat, sorted list in state; group for rendering only.
function sortActivities(list) {
  return [...list].sort((a, b) => {
    const byDate = (a.activity_date ?? '').localeCompare(b.activity_date ?? '')
    if (byDate !== 0) return byDate
    return (a.start_time ?? '').localeCompare(b.start_time ?? '')
  })
}

function groupByDate(list) {
  const groups = new Map()
  for (const activity of list) {
    const key = activity.activity_date
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(activity)
  }
  // Map preserves insertion order, and the list is already sorted by date.
  return Array.from(groups, ([date, activities]) => ({ date, activities }))
}

export default function Itinerary({ tripId }) {
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)

  const fetchActivities = useCallback(async () => {
    setLoading(true)
    setError('')

    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .eq('trip_id', tripId)
      .order('activity_date', { ascending: true })
      .order('start_time', { ascending: true, nullsFirst: true })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setActivities(data ?? [])
    setLoading(false)
  }, [tripId])

  useEffect(() => {
    fetchActivities()
  }, [fetchActivities])

  const handleCreate = async (form) => {
    const { data: activity, error } = await supabase
      .from('activities')
      .insert({
        trip_id: tripId,
        title: form.title.trim(),
        activity_date: form.activity_date,
        start_time: form.start_time || null,
        location: form.location.trim() || null,
      })
      .select()
      .single()

    if (error) throw error

    // Instant UI update — re-sort so it lands in the right day/time slot.
    setActivities((prev) => sortActivities([...prev, activity]))
  }

  const handleDelete = async (id) => {
    const previous = activities
    setActivities((prev) => prev.filter((a) => a.id !== id)) // optimistic

    const { error } = await supabase.from('activities').delete().eq('id', id)
    if (error) {
      setActivities(previous) // roll back on failure
      setError(error.message)
    }
  }

  const days = useMemo(() => groupByDate(activities), [activities])

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold text-slate-800">{t.itinerary.heading}</h2>
        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 active:bg-emerald-800 sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          {t.itinerary.add}
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-100">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-200/70" />
          ))}
        </div>
      ) : days.length === 0 ? (
        <EmptyState onAdd={() => setModalOpen(true)} />
      ) : (
        <div className="space-y-8">
          {days.map(({ date, activities }) => (
            <DaySection
              key={date}
              date={date}
              activities={activities}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <AddActivityModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreate={handleCreate}
      />
    </div>
  )
}

function DaySection({ date, activities, onDelete }) {
  return (
    <section>
      <div className="mb-3 flex items-center gap-2">
        <CalendarDays className="h-4 w-4 text-emerald-600" />
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          {formatDayHeading(date)}
        </h3>
      </div>

      {/* Timeline: a vertical line with a dot per activity (RTL: on the right). */}
      <ol className="relative space-y-3 border-s-2 border-slate-100 ps-6">
        {activities.map((activity) => (
          <li key={activity.id} className="relative">
            <span className="absolute -start-[1.9rem] top-1.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-500 ring-1 ring-emerald-200" />
            <div className="flex items-start justify-between gap-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
              <div className="min-w-0">
                <p className="font-medium text-slate-800">{activity.title}</p>
                <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
                  {activity.start_time && (
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {formatTime(activity.start_time)}
                    </span>
                  )}
                  {activity.location && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {activity.location}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => onDelete(activity.id)}
                aria-label={t.itinerary.deleteAria}
                className="shrink-0 rounded-lg p-1.5 text-slate-300 transition-colors hover:bg-red-50 hover:text-red-500 active:bg-red-100"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}

function EmptyState({ onAdd }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-slate-200 py-12 text-center">
      <div className="text-4xl">🗓️</div>
      <h3 className="mt-3 font-semibold text-slate-700">{t.itinerary.emptyTitle}</h3>
      <p className="mt-1 text-sm text-slate-500">{t.itinerary.emptyText}</p>
      <button
        onClick={onAdd}
        className="mt-4 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 active:bg-emerald-800"
      >
        <Plus className="h-4 w-4" />
        {t.itinerary.add}
      </button>
    </div>
  )
}
