import { NavLink } from 'react-router-dom'

import homeDefault      from '@/assets/nav/home-default.svg'
import homeSelected     from '@/assets/nav/home-selected.svg'
import progDefault      from '@/assets/nav/progress-default.svg'
import progSelected     from '@/assets/nav/progress-selected.svg'
import groupDefault     from '@/assets/nav/groups-default.svg'
import groupSelected    from '@/assets/nav/groups-selected.svg'
import planDefault      from '@/assets/nav/program-default.svg'
import planSelected     from '@/assets/nav/program-selected.svg'
import setDefault       from '@/assets/nav/settings-default.svg'
import setSelected      from '@/assets/nav/settings-selected.svg'

const TABS = [
  { to: '/home',     label: 'Home',     icons: [homeDefault,  homeSelected]  },
  { to: '/program',  label: 'Program',  icons: [planDefault,  planSelected]  },
  { to: '/progress', label: 'Progress', icons: [progDefault,  progSelected]  },
  { to: '/groups',   label: 'Groups',   icons: [groupDefault, groupSelected] },
  { to: '/settings', label: 'Settings', icons: [setDefault,   setSelected]   },
]

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-[#181818] border-t border-[rgba(255,255,255,0.1)] overflow-hidden">
      <div className="flex">
        {TABS.map(({ to, label, icons }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center gap-[4px] pt-[12px] font-commons font-semibold text-[12px] leading-[14px] tracking-[0.24px] transition-colors border-t-[1.5px] ${
                isActive
                  ? 'text-[#f2a655] border-[#f2a655]'
                  : 'text-[#8b8b8b] border-transparent'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <img src={isActive ? icons[1] : icons[0]} alt={label} className="size-[18px]" />
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
      {/* iOS home indicator */}
      <div className="relative h-[34px] w-full">
        <div className="absolute bottom-[8px] left-1/2 -translate-x-1/2 h-[5px] w-[134px] bg-[#969698] rounded-full" />
      </div>
    </nav>
  )
}
