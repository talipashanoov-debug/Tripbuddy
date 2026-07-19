// Parse a 'YYYY-MM-DD' date as local time (avoids the UTC off-by-one day)
// and render a compact range like "Jul 4 – Jul 18, 2026".
export function formatDateRange(start, end) {
  if (!start || !end) return '—'
  const opts = { month: 'short', day: 'numeric' }
  const s = new Date(`${start}T00:00:00`).toLocaleDateString(undefined, opts)
  const e = new Date(`${end}T00:00:00`).toLocaleDateString(undefined, {
    ...opts,
    year: 'numeric',
  })
  return `${s} – ${e}`
}

// Full day heading for itinerary sections, e.g. "Saturday, Jul 4".
export function formatDayHeading(dateStr) {
  if (!dateStr) return ''
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  })
}

// ISO timestamp → 'Jul 4, 2026'. For created_at and similar columns.
export function formatShortDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

// Postgres 'time' ('HH:MM:SS') → '9:30 AM'. Returns '' when no time set.
export function formatTime(timeStr) {
  if (!timeStr) return ''
  return new Date(`1970-01-01T${timeStr}`).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  })
}
