import { UtensilsCrossed, Car, BedDouble, Ticket, Receipt } from 'lucide-react'

// Category metadata: icon + badge colors, all on-theme with our emerald/slate palette.
export const EXPENSE_CATEGORIES = [
  { value: 'Food', Icon: UtensilsCrossed, badge: 'bg-orange-100 text-orange-700' },
  { value: 'Transport', Icon: Car, badge: 'bg-sky-100 text-sky-700' },
  { value: 'Accommodation', Icon: BedDouble, badge: 'bg-violet-100 text-violet-700' },
  { value: 'Activities', Icon: Ticket, badge: 'bg-emerald-100 text-emerald-700' },
  { value: 'Other', Icon: Receipt, badge: 'bg-slate-100 text-slate-600' },
]

const VALUES = EXPENSE_CATEGORIES.map((c) => c.value)
const OTHER = EXPENSE_CATEGORIES[EXPENSE_CATEGORIES.length - 1]

export function getCategory(value) {
  return EXPENSE_CATEGORIES.find((c) => c.value === value) ?? OTHER
}

// The `expenses.description` column has no dedicated category field, so we
// encode it as a "Category: text" prefix and parse it back for display.
// Existing/uncategorised rows fall through safely to "Other".
export function encodeDescription(category, text) {
  const trimmed = (text ?? '').trim()
  return VALUES.includes(category) ? `${category}: ${trimmed}` : trimmed
}

export function parseDescription(description) {
  const raw = description ?? ''
  const idx = raw.indexOf(': ')
  if (idx > -1) {
    const prefix = raw.slice(0, idx)
    if (VALUES.includes(prefix)) {
      return { category: prefix, text: raw.slice(idx + 2) }
    }
  }
  return { category: 'Other', text: raw }
}
