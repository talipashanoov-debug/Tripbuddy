import { Link } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

// Shared top navigation used across authenticated pages.
export default function Navbar() {
  const { user, signOut } = useAuth()

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:py-4">
        <Link
          to="/"
          className="flex items-center gap-2 rounded-lg transition-opacity hover:opacity-80 active:opacity-60"
        >
          <span className="text-2xl">🧳</span>
          <span className="text-lg font-bold text-slate-800">TripBuddy</span>
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          <span className="hidden max-w-[12rem] truncate text-sm text-slate-500 sm:inline">
            {user?.email}
          </span>
          <button
            onClick={signOut}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 active:bg-slate-200"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  )
}
