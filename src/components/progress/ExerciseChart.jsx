import { useState } from 'react'
import { epley, formatDate } from '@/lib/utils'

// data: array of { date, exercises: [{ sets: [{weight, reps}] }] }
// metric: 'e1rm' | 'volume' | 'maxWeight'
export default function ExerciseChart({ data, metric = 'e1rm' }) {
  const [hovered, setHovered] = useState(null)
  if (!data.length) return null

  const points = data.map(s => {
    const sets = s.exercises?.[0]?.sets || []
    if (metric === 'e1rm') return Math.max(0, ...sets.map(st => epley(st.weight, st.reps) || 0))
    if (metric === 'volume') return sets.reduce((sum, st) => sum + (parseFloat(st.weight) || 0) * (parseInt(st.reps) || 0), 0)
    if (metric === 'maxWeight') return Math.max(0, ...sets.map(st => parseFloat(st.weight) || 0))
    return 0
  })

  const minV = Math.min(...points)
  const maxV = Math.max(...points)
  const range = maxV - minV || 1
  const W = 320, H = 120, PAD = 16
  const n = points.length

  const cx = (i) => PAD + (i / Math.max(n - 1, 1)) * (W - PAD * 2)
  const cy = (v) => H - PAD - ((v - minV) / range) * (H - PAD * 2)

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ overflow: 'visible' }}>
        {/* Y gridlines */}
        {[0, 0.5, 1].map(t => {
          const y = H - PAD - t * (H - PAD * 2)
          const val = Math.round(minV + t * range)
          return (
            <g key={t}>
              <line x1={PAD} x2={W - PAD} y1={y} y2={y} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
              <text x={PAD} y={y - 3} fill="rgba(255,255,255,0.3)" fontSize="8" fontFamily="Syne, sans-serif">{val}</text>
            </g>
          )
        })}

        {/* Connecting line */}
        <polyline
          points={points.map((v, i) => `${cx(i)},${cy(v)}`).join(' ')}
          fill="none"
          stroke="rgba(108,99,255,0.3)"
          strokeWidth="1.5"
        />

        {/* Dots */}
        {points.map((v, i) => {
          const isLast = i === n - 1
          const isHovered = hovered === i
          return (
            <g key={i}>
              <circle
                cx={cx(i)} cy={cy(v)}
                r={isHovered ? 6 : isLast ? 5 : 4}
                fill={isLast ? '#6c63ff' : 'rgba(108,99,255,0.5)'}
                style={{ cursor: 'pointer', transition: 'r 0.1s' }}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
                onTouchStart={() => setHovered(i)}
                onTouchEnd={() => setTimeout(() => setHovered(null), 1500)}
              />
              {isHovered && (() => {
                const tooltipX = Math.max(PAD + 30, Math.min(cx(i), W - PAD - 30))
                return (
                  <g>
                    <rect x={tooltipX - 30} y={cy(v) - 24} width="60" height="18" rx="4" fill="#1e2235" stroke="rgba(108,99,255,0.4)" strokeWidth="1" />
                    <text x={tooltipX} y={cy(v) - 11} textAnchor="middle" fill="#f0f2ff" fontSize="9" fontFamily="Syne, sans-serif">
                      {v}{metric === 'volume' ? ' kg·reps' : ' kg'}
                    </text>
                  </g>
                )
              })()}
            </g>
          )
        })}

        {/* X axis dates (first and last) */}
        {n > 1 && (
          <>
            <text x={PAD} y={H + 12} fill="rgba(255,255,255,0.3)" fontSize="8" fontFamily="Syne, sans-serif">
              {formatDate(data[0].date, true)}
            </text>
            <text x={W - PAD} y={H + 12} textAnchor="end" fill="rgba(255,255,255,0.3)" fontSize="8" fontFamily="Syne, sans-serif">
              {formatDate(data[n - 1].date, true)}
            </text>
          </>
        )}
      </svg>
    </div>
  )
}
