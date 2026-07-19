import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ChevronLeft, MapPin, Compass } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { formatDateRange } from '../lib/formatDate'
import Navbar from '../components/Navbar'
import Itinerary from '../components/Itinerary'
import Expenses from '../components/Expenses'

const TABS = [
  { key: 'itinerary', label: 'Itinerary' },
  { key: 'expenses', label: 'Expenses' },
]

export default function TripDetails() {
  const { id } = useParams()
  const [trip, setTrip] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('itinerary')

  useEffect(() => {
    let ignore = false

    async function fetchTrip() {
      setLoading(true)
      setError('')

      // maybeSingle(): RLS-blocked or non-existent trips come back as
      // data = null WITHOUT an error, so we can show a friendly state
      // instead of a raw "no rows returned" Postgres message.
      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .eq('id', id)
        .maybeSingle()

      if (ignore) return

      if (error) {
        setError(error.message)
      } else {
        setTrip(data)
      }
      setLoading(false)
    }

    fetchTrip()
    return () => {
      ignore = true
    }
  }, [id])

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <div className="mx-auto max-w-4xl px-4 py-6 sm:py-8">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 rounded-lg text-sm font-medium text-slate-500 transition-colors hover:text-slate-800 active:text-slate-900"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        {loading ? (
          <TripHeaderSkeleton />
        ) : error ? (
          <ErrorCard message={error} />
        ) : !trip ? (
          <AccessDeniedCard />
        ) : (
          <>
            {/* Header */}
            <header className="mt-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 p-6 text-white shadow-sm sm:p-8">
              <div className="flex items-center gap-2 text-emerald-50">
                <MapPin className="h-5 w-5 shrink-0" />
                <span className="text-sm font-medium">{trip.destination}</span>
              </div>
              <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">{trip.title}</h1>
              <p className="mt-1 text-emerald-50">
                {formatDateRange(trip.start_date, trip.end_date)}
              </p>
            </header>

            {/* Tabs */}
            <div className="mt-6">
              <div className="inline-flex w-full rounded-xl bg-slate-100 p-1 sm:w-auto">
                {TABS.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex-1 rounded-lg px-5 py-2 text-sm font-medium transition-colors sm:flex-none ${
                      activeTab === tab.key
                        ? 'bg-white text-slate-800 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700 active:text-slate-900'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab content */}
              <div className="mt-6">
                {activeTab === 'itinerary' ? (
                  <Itinerary tripId={trip.id} />
                ) : (
                  <Expenses tripId={trip.id} />
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function TripHeaderSkeleton() {
  return (
    <div className="mt-4 space-y-4">
      <div className="h-32 animate-pulse rounded-2xl bg-slate-200/70" />
      <div className="h-10 w-48 animate-pulse rounded-xl bg-slate-200/70" />
    </div>
  )
}

function AccessDeniedCard() {
  return (
    <div className="mt-4 rounded-2xl border-2 border-dashed border-slate-200 bg-white py-16 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
        <Compass className="h-7 w-7" />
      </div>
      <h2 className="mt-4 text-lg font-semibold text-slate-800">
        Trip Not Found or Access Denied
      </h2>
      <p className="mx-auto mt-1 max-w-sm px-4 text-sm text-slate-500">
        This trip doesn't exist, or you're not a member of it. Ask a member to add you, or head
        back to your dashboard.
      </p>
      <Link
        to="/"
        className="mt-5 inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 active:bg-emerald-800"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>
    </div>
  )
}

function ErrorCard({ message }) {
  return (
    <div className="mt-4 rounded-2xl bg-red-50 p-8 text-center ring-1 ring-red-100">
      <div className="text-4xl">😕</div>
      <p className="mt-3 text-sm font-medium text-red-700">
        Something went wrong while loading this trip.
      </p>
      <p className="mt-1 text-xs text-red-500">{message}</p>
      <Link
        to="/"
        className="mt-4 inline-block rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 transition-colors hover:bg-slate-50 active:bg-slate-100"
      >
        Back to Dashboard
      </Link>
    </div>
  )
}
