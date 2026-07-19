import { useCallback, useEffect, useMemo, useState } from 'react'
import { Plus, Trash2, Wallet, Users } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { formatCurrency } from '../lib/formatCurrency'
import { formatShortDate } from '../lib/formatDate'
import { encodeDescription, parseDescription, getCategory } from '../lib/expenseCategories'
import { t } from '../lib/strings'
import AddExpenseModal from './AddExpenseModal'
import SettlementPlan from './SettlementPlan'
import Participants from './Participants'

export default function Expenses({ tripId }) {
  const { user } = useAuth()
  const [expenses, setExpenses] = useState([])
  const [participants, setParticipants] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [participantError, setParticipantError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')

    const [{ data: parts, error: pErr }, { data: exps, error: eErr }] = await Promise.all([
      supabase.from('participants').select('id, full_name').eq('trip_id', tripId).order('created_at'),
      supabase
        .from('expenses')
        .select('*, expense_participants(participant_id)')
        .eq('trip_id', tripId)
        .order('created_at', { ascending: false }),
    ])

    if (pErr || eErr) {
      setError((pErr ?? eErr).message)
      setLoading(false)
      return
    }

    setParticipants(parts ?? [])
    setExpenses(exps ?? [])
    setLoading(false)
  }, [tripId])

  useEffect(() => {
    load()
  }, [load])

  const participantsById = useMemo(() => {
    const map = new Map()
    participants.forEach((p) => map.set(p.id, p.full_name))
    return map
  }, [participants])

  // ---- Participants CRUD ----
  const addParticipant = async (name) => {
    setParticipantError('')
    const { data, error } = await supabase
      .from('participants')
      .insert({ trip_id: tripId, full_name: name })
      .select()
      .single()
    if (error) {
      setParticipantError(error.message)
      return
    }
    setParticipants((prev) => [...prev, data])
  }

  const deleteParticipant = async (id) => {
    setParticipantError('')
    const previous = participants
    setParticipants((prev) => prev.filter((p) => p.id !== id))
    const { error } = await supabase.from('participants').delete().eq('id', id)
    if (error) {
      setParticipants(previous)
      // FK from expenses.paid_by_participant blocks deleting someone who paid.
      setParticipantError(t.participants.inUse)
    }
  }

  // ---- Expenses CRUD ----
  const handleCreate = async ({ description, amount, category, paidBy, sharerIds }) => {
    const { data: expense, error } = await supabase
      .from('expenses')
      .insert({
        trip_id: tripId,
        description: encodeDescription(category, description),
        amount,
        paid_by: user.id, // audit: who logged it
        paid_by_participant: paidBy, // who actually paid
      })
      .select()
      .single()
    if (error) throw error

    const links = sharerIds.map((pid) => ({ expense_id: expense.id, participant_id: pid }))
    const { error: linkError } = await supabase.from('expense_participants').insert(links)
    if (linkError) throw linkError

    // Prepend with the shape the list expects (matches the joined fetch).
    setExpenses((prev) => [
      { ...expense, expense_participants: sharerIds.map((participant_id) => ({ participant_id })) },
      ...prev,
    ])
  }

  const handleDelete = async (id) => {
    const previous = expenses
    setExpenses((prev) => prev.filter((e) => e.id !== id))
    const { error } = await supabase.from('expenses').delete().eq('id', id)
    if (error) {
      setExpenses(previous)
      setError(error.message)
    }
  }

  const total = useMemo(
    () => expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0),
    [expenses]
  )

  const canAdd = participants.length > 0

  return (
    <div>
      {/* Summary card */}
      <div className="mb-6 flex flex-col gap-4 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 p-6 text-white shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-slate-300">
            <Wallet className="h-4 w-4" />
            <span className="text-sm font-medium">{t.expenses.total}</span>
          </div>
          <p className="mt-1 text-3xl font-bold tracking-tight">{formatCurrency(total)}</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          disabled={!canAdd}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-400 active:bg-emerald-600 disabled:opacity-50 sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          {t.expenses.add}
        </button>
      </div>

      {/* Participants manager */}
      <Participants
        participants={participants}
        onAdd={addParticipant}
        onDelete={deleteParticipant}
        error={participantError}
      />

      {!canAdd && (
        <p className="mb-6 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-700 ring-1 ring-amber-100">
          {t.expenses.needParticipants}
        </p>
      )}

      {/* Who owes whom */}
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
        <EmptyState onAdd={() => setModalOpen(true)} disabled={!canAdd} />
      ) : (
        <ul className="space-y-3">
          {expenses.map((expense) => {
            const { category, text } = parseDescription(expense.description)
            const { Icon, badge } = getCategory(category)
            const payer = participantsById.get(expense.paid_by_participant)
            const sharerCount = expense.expense_participants?.length ?? 0
            return (
              <li
                key={expense.id}
                className="flex items-center justify-between gap-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${badge}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-800">{text}</p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-400">
                      {payer && <span>{t.expenses.paidBy}: {payer}</span>}
                      {sharerCount > 0 && (
                        <span className="inline-flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {sharerCount}
                        </span>
                      )}
                      <span>{formatShortDate(expense.created_at)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <p className="font-semibold text-slate-800">{formatCurrency(expense.amount)}</p>
                  <button
                    onClick={() => handleDelete(expense.id)}
                    aria-label={t.expenses.deleteAria}
                    className="rounded-lg p-1.5 text-slate-300 transition-colors hover:bg-red-50 hover:text-red-500 active:bg-red-100"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <AddExpenseModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreate={handleCreate}
        participants={participants}
      />
    </div>
  )
}

function EmptyState({ onAdd, disabled }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-slate-200 py-12 text-center">
      <div className="text-4xl">💸</div>
      <h3 className="mt-3 font-semibold text-slate-700">{t.expenses.emptyTitle}</h3>
      <p className="mt-1 text-sm text-slate-500">{t.expenses.emptyText}</p>
      <button
        onClick={onAdd}
        disabled={disabled}
        className="mt-4 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50"
      >
        <Plus className="h-4 w-4" />
        {t.expenses.add}
      </button>
    </div>
  )
}
