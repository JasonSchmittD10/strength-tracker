// src/components/shared/BottomNav.jsx
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
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-[#181818] backdrop-blur-[8px]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex pt-[10px] px-2">
        {TABS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center gap-[2px] pb-2 text-[10px] font-medium transition-colors relative ${
                isActive ? 'text-accent' : 'text-[#8b8b8b]'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-accent" />
                )}
                <Icon size={18} />
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
