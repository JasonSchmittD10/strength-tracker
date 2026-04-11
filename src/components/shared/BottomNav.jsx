import { NavLink } from 'react-router-dom'
import { Home, Clock, TrendingUp, Users, Settings } from 'lucide-react'

const TABS = [
  { to: '/home',     icon: Home,       label: 'Home' },
  { to: '/history',  icon: Clock,      label: 'History' },
  { to: '/progress', icon: TrendingUp, label: 'Progress' },
  { to: '/groups',   icon: Users,      label: 'Groups' },
  { to: '/settings', icon: Settings,   label: 'Settings' },
]

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-bg-secondary border-t border-bg-tertiary safe-bottom">
      <div className="flex">
        {TABS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center gap-1 py-2 text-xs font-medium transition-colors relative ${
                isActive ? 'text-accent' : 'text-text-muted'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-accent" />
                )}
                <Icon size={20} />
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
