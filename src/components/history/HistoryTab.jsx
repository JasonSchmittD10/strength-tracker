import { useNavigate } from 'react-router-dom'
import { useSessions } from '@/hooks/useSessions'
import SessionCard from './SessionCard'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import backArrow from '@/assets/icons/icon-back-arrow.svg'
import emptyWorkoutIcon from '@/assets/icons/icon-empty-workout.svg'

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

  return (
    <div className="flex flex-col min-h-screen bg-bg-primary">
      <div className="safe-top flex items-center gap-[12px] px-4 pt-[14px] pb-[12px]">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center justify-center w-8 h-8 -ml-1"
          aria-label="Back"
        >
          <img src={backArrow} alt="" className="w-[5px] h-[11px]" />
        </button>
        <h1 className="font-judge font-bold text-[26px] text-white leading-[1.2]">History</h1>
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : sessions.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center px-6 pb-[80px] gap-[16px]">
          <img src={emptyWorkoutIcon} alt="" className="w-[48px] h-[48px] opacity-60" />
          <p className="font-commons text-[16px] text-[#8b8b8b] tracking-[-0.2px] leading-[18px] text-center">
            No sessions logged yet.
          </p>
        </div>
      ) : (
        <div className="px-4 pb-8 flex flex-col gap-[24px]">
          {Object.entries(groupByRelativeDate(sessions)).map(([label, items]) => (
            <div key={label} className="flex flex-col gap-[12px]">
              <p className="font-commons font-semibold text-[18px] text-[rgba(255,255,255,0.6)] tracking-[-0.36px] leading-[14px]">
                {label}
              </p>
              <div className="flex flex-col gap-[8px]">
                {items.map((s, i) => <SessionCard key={s._id || i} session={s} />)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
