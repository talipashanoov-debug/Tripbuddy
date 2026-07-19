import { useCallback, useEffect, useState } from 'react'
import { Users, UserPlus, Crown } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { invokeFunction } from '../lib/invokeFunction'
import { t } from '../lib/strings'

// Lists trip members (with emails, resolved server-side) and lets the trip
// creator invite others by email or user ID — both via the manage-members
// Edge Function, since neither can be done safely from the browser.
export default function TripMembers({ tripId }) {
  const { user } = useAuth()
  const [members, setMembers] = useState([])
  const [createdBy, setCreatedBy] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const [identifier, setIdentifier] = useState('')
  const [inviting, setInviting] = useState(false)
  const [inviteError, setInviteError] = useState('')
  const [inviteMsg, setInviteMsg] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError('')

    const { data, error } = await invokeFunction('manage-members', {
      trip_id: tripId,
      action: 'list',
    })

    if (error) {
      setLoadError(error)
    } else {
      setMembers(data.members ?? [])
      setCreatedBy(data.created_by ?? null)
    }
    setLoading(false)
  }, [tripId])

  useEffect(() => {
    load()
  }, [load])

  const isCreator = user?.id === createdBy

  const invite = async (e) => {
    e.preventDefault()
    setInviting(true)
    setInviteError('')
    setInviteMsg('')

    const { data, error } = await invokeFunction('manage-members', {
      trip_id: tripId,
      action: 'invite',
      identifier: identifier.trim(),
    })

    if (error) {
      setInviteError(error)
    } else if (data.already) {
      setInviteMsg(t.members.already(data.email))
      setIdentifier('')
    } else {
      setMembers((prev) => [...prev, { user_id: data.user_id, email: data.email, role: data.role }])
      setInviteMsg(t.members.added(data.email))
      setIdentifier('')
    }
    setInviting(false)
  }

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className="flex items-center gap-2">
        <Users className="h-5 w-5 text-emerald-600" />
        <h3 className="font-semibold text-slate-800">{t.members.heading}</h3>
        {!loading && (
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
            {members.length}
          </span>
        )}
      </div>

      {loading ? (
        <div className="mt-4 flex gap-2">
          {[0, 1].map((i) => (
            <div key={i} className="h-8 w-32 animate-pulse rounded-full bg-slate-200/70" />
          ))}
        </div>
      ) : loadError ? (
        <p className="mt-3 text-sm text-red-600">{loadError}</p>
      ) : (
        <div className="mt-4 flex flex-wrap gap-2">
          {members.map((m) => {
            const owner = m.user_id === createdBy
            return (
              <span
                key={m.user_id}
                className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 py-1 pe-3 ps-1 text-sm ring-1 ring-slate-200"
                title={owner ? 'יוצר/ת הטיול' : undefined}
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold uppercase text-emerald-700">
                  {(m.email?.[0] ?? '?')}
                </span>
                <span className="max-w-[12rem] truncate text-slate-700">{m.email}</span>
                {owner && <Crown className="h-3.5 w-3.5 text-amber-500" />}
                {m.user_id === user?.id && (
                  <span className="text-xs text-slate-400">{t.members.you}</span>
                )}
              </span>
            )
          })}
        </div>
      )}

      {/* Invite — creator only (the Edge Function enforces this too) */}
      {!loading && isCreator && (
        <form onSubmit={invite} className="mt-4 border-t border-slate-100 pt-4">
          <label className="mb-1 block text-sm font-medium text-slate-700">{t.members.invite}</label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder={t.members.placeholder}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
            />
            <button
              type="submit"
              disabled={inviting || !identifier.trim()}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-60"
            >
              <UserPlus className="h-4 w-4" />
              {inviting ? t.members.inviting : t.members.inviteBtn}
            </button>
          </div>
          {inviteError && <p className="mt-2 text-sm text-red-600">{inviteError}</p>}
          {inviteMsg && <p className="mt-2 text-sm text-emerald-600">{inviteMsg}</p>}
          <p className="mt-2 text-xs text-slate-400">{t.members.needsAccount}</p>
        </form>
      )}
    </div>
  )
}
