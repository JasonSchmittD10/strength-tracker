import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useSessions } from '@/hooks/useSessions'
import SessionCard from './SessionCard'
import LoadingSpinner from '@/components/shared/LoadingSpinner'

function groupByRelativeDate(sessions) {
  const groups = {}
  const today = new Date().toISOString().split('T')[0]
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]
  const twoWeeksAgo = new Date(Date.now() - 14 * 86400000).toISOString().split('T')[0]

  sessions.forEach(s => {
    const d = s.date || ''
    let label
    if (d === today) label = 'Today'
    else if (d >= weekAgo) label = 'This Week'
    else if (d >= twoWeeksAgo) label = 'Last Week'
    else {
      const dt = new Date(d + 'T00:00:00')
      label = dt.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    }
    if (!groups[label]) groups[label] = []
    groups[label].push(s)
  })
  return groups
}

export default function HistoryTab() {
  const navigate = useNavigate()
  const { data: sessions = [], isLoading } = useSessions()

  if (isLoading) return <LoadingSpinner />

  if (!sessions.length) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center px-6 mt-12">
        <div className="text-4xl mb-3">📋</div>
        <p className="text-text-secondary">No sessions logged yet.</p>
      </div>
    )
  }

  const groups = groupByRelativeDate(sessions)

  return (
    <div className="safe-top px-4 pb-4 max-w-lg mx-auto">
      <div className="flex items-center gap-3 py-4">
        <button
          onClick={() => navigate(-1)}
          className="text-text-muted hover:text-text-primary transition-colors p-1"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-bold text-xl text-text-primary">History</h1>
      </div>
      {Object.entries(groups).map(([label, items]) => (
        <div key={label} className="mb-5">
          <div className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">{label}</div>
          <div className="space-y-2">
            {items.map((s, i) => <SessionCard key={s._id || i} session={s} />)}
          </div>
        </div>
      ))}
    </div>
  )
}
