import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Briefcase, ClipboardList, Bot, User } from 'lucide-react'
import clsx from 'clsx'

const links = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/jobs', icon: Briefcase, label: 'Jobs' },
  { to: '/applications', icon: ClipboardList, label: 'Applications' },
  { to: '/agent', icon: Bot, label: 'AI Agent' },
  { to: '/profile', icon: User, label: 'Profile' },
]

export default function Sidebar() {
  return (
    <aside className="hidden md:flex w-56 flex-col border-r border-gray-200 bg-white">
      <div className="flex h-16 items-center px-5 border-b border-gray-200">
        <span className="text-lg font-bold text-brand-600">JobAgent AI</span>
      </div>
      <nav className="flex-1 space-y-1 p-3 pt-4">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-brand-50 text-brand-600'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              )
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
