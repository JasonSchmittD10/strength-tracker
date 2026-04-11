import { ChevronRight } from 'lucide-react'

// Props:
//   group   — { id, name, memberCount, created_at }
//   onClick — handler
export default function GroupCard({ group, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between bg-bg-card border border-bg-tertiary rounded-2xl px-4 py-4 hover:border-accent/40 transition-colors text-left"
    >
      <div className="flex items-center gap-3">
        {/* Avatar placeholder — first two letters of group name */}
        <div className="w-11 h-11 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
          <span className="text-accent font-bold text-sm">
            {group.name.slice(0, 2).toUpperCase()}
          </span>
        </div>
        <div>
          <div className="font-semibold text-text-primary text-sm">{group.name}</div>
          <div className="text-xs text-text-muted mt-0.5">
            {group.memberCount} {group.memberCount === 1 ? 'member' : 'members'}
          </div>
        </div>
      </div>
      <ChevronRight size={18} className="text-text-muted flex-shrink-0" />
    </button>
  )
}
