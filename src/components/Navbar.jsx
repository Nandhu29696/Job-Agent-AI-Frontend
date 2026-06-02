import { useAuthStore } from '../store/authStore'
import { LogOut, Bell } from 'lucide-react'

export default function Navbar() {
  const { user, logout } = useAuthStore()

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">
      <div className="text-sm text-gray-500">
        Welcome back, <span className="font-medium text-gray-800">{user?.full_name || user?.email}</span>
      </div>
      <div className="flex items-center gap-3">
        <button className="rounded-lg p-2 text-gray-500 hover:bg-gray-100">
          <Bell size={18} />
        </button>
        <button
          onClick={logout}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100"
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </header>
  )
}
