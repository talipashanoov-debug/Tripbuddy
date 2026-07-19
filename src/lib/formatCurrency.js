// Money formatter. Postgres `numeric` can arrive as a string, so coerce first.
// Currency is hard-coded to USD for now — swap here if the trip needs another.
export function formatCurrency(amount) {
  const value = Number(amount) || 0
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
  }).format(value)
}
