import { useCallback, useEffect, useMemo, useState } from 'react'
import { Plus, Receipt, Wallet } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { formatCurrency } from '../lib/formatCurrency'
import { formatShortDate } from '../lib/formatDate'
import AddExpenseModal from './AddExpenseModal'
import SettlementPlan from './SettlementPlan'

export default function Expenses({ tripId }) {
  const { user } = useAuth()
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)

  const fetchExpenses = useCallback(async () => {
    setLoading(true)
    setError('')

    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('trip_id', tripId)
      .order('created_at', { ascending: false })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setExpenses(data ?? [])
    setLoading(false)
  }, [tripId])

  useEffect(() => {
    fetchExpenses()
  }, [fetchExpenses])

  const handleCreate = async ({ description, amount }) => {
    const { data: expense, error } = await supabase
      .from('expenses')
      .insert({
        trip_id: tripId,
        description: description.trim(),
        amount,
        paid_by: user.id, // current user is the payer
      })
      .select()
      .single()

    if (error) throw error

    // Newest first — prepend for an instant update (total recomputes below).
    setExpenses((prev) => [expense, ...prev])
  }

  const total = useMemo(
    () => expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0),
    [expenses]
  )

  return (
    <div>
      {/* Summary card */}
      <div className="mb-6 flex flex-col gap-4 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 p-6 text-white shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-slate-300">
            <Wallet className="h-4 w-4" />
            <span className="text-sm font-medium">Total Expenses</span>
          </div>
          <p className="mt-1 text-3xl font-bold tracking-tight">{formatCurrency(total)}</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-400 active:bg-emerald-600 sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          Add Expense
        </button>
      </div>

      {/* Who owes whom — computed by the calculate-settlement Edge Function */}
      <SettlementPlan tripId={tripId} />

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
      ) : expenses.length === 0 ? (
        <EmptyState onAdd={() => setModalOpen(true)} />
      ) : (
        <ul className="space-y-3">
          {expenses.map((expense) => (
            <li
              key={expense.id}
              className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                  <Receipt className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium text-slate-800">{expense.description}</p>
                  <p className="text-xs text-slate-400">{formatShortDate(expense.created_at)}</p>
                </div>
              </div>
              <p className="font-semibold text-slate-800">{formatCurrency(expense.amount)}</p>
            </li>
          ))}
        </ul>
      )}

      <AddExpenseModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreate={handleCreate}
      />
    </div>
  )
}

function EmptyState({ onAdd }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-slate-200 py-12 text-center">
      <div className="text-4xl">💸</div>
      <h3 className="mt-3 font-semibold text-slate-700">No expenses yet</h3>
      <p className="mt-1 text-sm text-slate-500">Add your first expense to start tracking.</p>
      <button
        onClick={onAdd}
        className="mt-4 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 active:bg-emerald-800"
      >
        <Plus className="h-4 w-4" />
        Add Expense
      </button>
    </div>
  )
}
