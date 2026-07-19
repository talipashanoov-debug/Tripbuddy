import { useState } from 'react'
import { ArrowRight, HandCoins, Sparkles } from 'lucide-react'
import { invokeFunction } from '../lib/invokeFunction'
import { formatCurrency } from '../lib/formatCurrency'

// Calls the `calculate-settlement` Edge Function. supabase.functions.invoke
// automatically attaches the current user's access token as the Authorization
// header, so the function can authenticate and authorize the caller.
export default function SettlementPlan({ tripId }) {
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const calculate = async () => {
    setLoading(true)
    setError('')

    const { data, error } = await invokeFunction('calculate-settlement', {
      trip_id: tripId,
    })

    if (error) {
      setError(error)
    } else {
      setResult(data)
    }
    setLoading(false)
  }

  return (
    <div className="mb-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <HandCoins className="h-5 w-5 text-emerald-600" />
          <h3 className="font-semibold text-slate-800">Settlement Plan</h3>
        </div>
        <button
          onClick={calculate}
          disabled={loading}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-900 active:bg-black disabled:opacity-60 sm:w-auto"
        >
          {loading ? 'Calculating…' : result ? 'Recalculate' : 'Calculate who owes whom'}
        </button>
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      {!result && !error && (
        <p className="mt-3 text-sm text-slate-500">
          Split all expenses equally and see the fewest payments needed to settle up.
        </p>
      )}

      {result && (
        <div className="mt-4">
          <p className="text-xs text-slate-400">
            Split equally across {result.member_count}{' '}
            {result.member_count === 1 ? 'member' : 'members'} ·{' '}
            {formatCurrency(result.per_person)} each
          </p>

          {result.settlements.length === 0 ? (
            <div className="mt-3 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
              <Sparkles className="h-4 w-4" />
              Everyone is settled up — no payments needed!
            </div>
          ) : (
            <ul className="mt-3 space-y-2">
              {result.settlements.map((s, idx) => (
                <li
                  key={idx}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-50 px-4 py-3"
                >
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium text-slate-700">{s.from_email}</span>
                    <ArrowRight className="h-4 w-4 shrink-0 text-slate-400" />
                    <span className="font-medium text-slate-700">{s.to_email}</span>
                  </div>
                  <span className="font-semibold text-emerald-600">
                    {formatCurrency(s.amount)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
