import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { formatDateRange } from '../lib/formatDate'
import Navbar from '../components/Navbar'
import CreateTripModal from '../components/CreateTripModal'

function sortByStart(trips) {
  return [...trips].sort((a, b) =>
    (a.start_date ?? '').localeCompare(b.start_date ?? '')
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const [trips, setTrips] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)

  const fetchTrips = useCallback(async () => {
    setLoading(true)
    setError('')

    // Only return trips the current user is a member of, by joining
    // trip_members -> trips on the foreign key.
    const { data, error } = await supabase
      .from('trip_members')
      .select('trips(*)')
      .eq('user_id', user.id)

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    const rows = (data ?? []).map((row) => row.trips).filter(Boolean)
    setTrips(sortByStart(rows))
    setLoading(false)
  }, [user.id])

  useEffect(() => {
    fetchTrips()
  }, [fetchTrips])

  // Insert the trip, then link the creator in trip_members.
  const handleCreate = async (form) => {
    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .insert({
        title: form.title.trim(),
        destination: form.destination.trim(),
        start_date: form.start_date,
        end_date: form.end_date,
        created_by: user.id,
      })
      .select()
      .single()

    if (tripError) throw tripError

    const { error: memberError } = await supabase
      .from('trip_members')
      .insert({ trip_id: trip.id, user_id: user.id, role: 'owner' })

    if (memberError) throw memberError

    // Instant UI update — no refetch needed.
    setTrips((prev) => sortByStart([...prev, trip]))
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Your trips</h1>
            <p className="text-sm text-slate-500">Plan, share, and split — all in one place.</p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 active:bg-emerald-800 sm:w-auto"
          >
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" />
            </svg>
            Create New Trip
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-100">
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-32 animate-pulse rounded-2xl bg-slate-200/70"
              />
            ))}
          </div>
        ) : trips.length === 0 ? (
          <EmptyState onCreate={() => setModalOpen(true)} />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {trips.map((trip) => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>
        )}
      </main>

      <CreateTripModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreate={handleCreate}
      />
    </div>
  )
}

function TripCard({ trip }) {
  return (
    <Link
      to={`/trip/${trip.id}`}
      className="group block cursor-pointer rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition-all hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path
            fillRule="evenodd"
            d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 103 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 002.273 1.765 11.842 11.842 0 00.976.573l.02.01.006.003zM10 11.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z"
            clipRule="evenodd"
          />
        </svg>
      </div>
      <h3 className="font-semibold text-slate-800 group-hover:text-emerald-700">
        {trip.title}
      </h3>
      <p className="text-sm text-slate-500">{trip.destination}</p>
      <p className="mt-3 text-xs font-medium text-slate-400">
        {formatDateRange(trip.start_date, trip.end_date)}
      </p>
    </Link>
  )
}

function EmptyState({ onCreate }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-slate-200 py-16 text-center">
      <div className="text-4xl">🗺️</div>
      <h3 className="mt-3 font-semibold text-slate-700">No trips yet</h3>
      <p className="mt-1 text-sm text-slate-500">Create your first trip to get started.</p>
      <button
        onClick={onCreate}
        className="mt-4 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 active:bg-emerald-800"
      >
        Create New Trip
      </button>
    </div>
  )
}
