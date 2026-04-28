import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useProfile } from '@/hooks/useProfile'
import { useSessions, usePRs } from '@/hooks/useSessions'
import { useProgramConfig } from '@/hooks/useProgramConfig'
import { formatVolume, computeWeekStreak } from '@/lib/utils'
import { formatWeight } from '@/lib/units'
import accountIcon from '@/assets/icons/icon-settings-account.svg'
import togglesIcon from '@/assets/icons/icon-settings-toggles.svg'
import lockIcon from '@/assets/icons/icon-settings-lock.svg'
import pkg from '../../../package.json'

export default function SettingsTab() {
  const { user } = useAuth()
  const { data: profile } = useProfile()
  const { data: sessions = [] } = useSessions()
  const { program: activeProgram } = useProgramConfig()
  const prs = usePRs()
  const navigate = useNavigate()

  const name = profile?.display_name || user?.email?.split('@')[0] || '?'
  const initial = name[0]?.toUpperCase() || '?'
  const weightUnit = profile?.weightUnit ?? 'lbs'

  const totalLbMoved = sessions.reduce((sum, s) => sum + (s.totalVolume || 0), 0)
  const weekStreak = computeWeekStreak(sessions)
  const topPrs = prs.slice(0, 4)

  return (
    <div className="safe-top px-4 pb-8">
      {/* Avatar */}
      <button
        className="mt-3 mb-6"
        onClick={() => navigate('/settings/account')}
        aria-label="My Account"
      >
        {profile?.avatar_url ? (
          <img src={profile.avatar_url} className="w-8 h-8 rounded-full object-cover" alt="Profile" />
        ) : (
          <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-white text-sm font-bold">
            {initial}
          </div>
        )}
      </button>

      <div className="flex flex-col gap-6">
        {/* Stats banner */}
        <div
          className="w-full rounded-xl border border-accent/30 overflow-hidden"
          style={{
            background: 'linear-gradient(137.96deg, rgba(0,0,0,0.2) 13.6%, rgba(242,166,85,0.2) 170.2%), rgba(255,255,255,0.05)',
          }}
        >
          <div className="flex items-stretch">
            <StatCol value={sessions.length} label="SESSIONS" />
            <div className="w-px bg-[#2d2d2d]" />
            <StatCol value={formatVolume(totalLbMoved)} label="LB MOVED" />
            <div className="w-px bg-[#2d2d2d]" />
            <StatCol value={weekStreak} label="WEEK STREAK" />
          </div>
        </div>

        {/* PRs */}
        {topPrs.length > 0 && (
          <div>
            <SectionLabel>PRs</SectionLabel>
            <div className="grid grid-cols-2 gap-3">
              {topPrs.map(({ name, e1rm }) => (
                <div
                  key={name}
                  className="bg-white/5 border border-white/10 rounded-xl px-4 pt-4 pb-3"
                >
                  <div className="text-xs text-text-muted uppercase tracking-wide mb-1 leading-tight">{name}</div>
                  <div className="font-display text-4xl text-white leading-none">
                    {formatWeight(e1rm, weightUnit)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Current Program */}
        <div>
          <SectionLabel>Current Program</SectionLabel>
          {activeProgram ? (
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="font-display text-[32px] leading-10 text-white">{activeProgram.name}</div>
                <div className="flex flex-wrap gap-2 justify-end pt-1">
                  {(activeProgram.tags || []).map(tag => (
                    <span
                      key={tag}
                      className="border border-white/10 rounded px-1.5 py-0.5 text-xs text-white/40 leading-tight"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              {activeProgram.description && (
                <div className="text-text-muted text-base leading-snug">{activeProgram.description}</div>
              )}
            </div>
          ) : (
            <button
              onClick={() => navigate('/program-selector')}
              className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-left"
            >
              <div className="text-text-muted text-sm">No active program</div>
              <div className="text-accent text-sm mt-0.5">Choose a program →</div>
            </button>
          )}
        </div>

        {/* Settings nav tiles */}
        <div>
          <SectionLabel>Settings</SectionLabel>
          <div className="flex flex-col gap-2">
            <SettingsTile
              icon={accountIcon}
              title="My Account"
              subtitle="Email, password, sign out"
              onClick={() => navigate('/settings/account')}
            />
            <SettingsTile
              icon={togglesIcon}
              title="Preferences"
              subtitle="Units, week start"
              onClick={() => navigate('/settings/preferences')}
            />
            <SettingsTile
              icon={lockIcon}
              title="Privacy"
              subtitle="Group visibility, activity sharing"
              onClick={() => navigate('/settings/privacy')}
            />
          </div>
        </div>

        {/* Logout */}
        <div className="flex flex-col items-center gap-3">
          <button
            onClick={() => navigate('/settings/account')}
            className="bg-white/5 border border-white/10 rounded px-3 py-2 text-sm font-bold text-white"
          >
            Logout
          </button>
          <div className="text-text-muted text-sm text-center">
            APP VERSION: {pkg.version}
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCol({ value, label }) {
  return (
    <div className="flex-1 flex flex-col items-center gap-1 py-4">
      <div className="font-display text-4xl text-white leading-none">{value}</div>
      <div className="text-xs text-text-muted font-secondary tracking-wide">{label}</div>
    </div>
  )
}

function SectionLabel({ children }) {
  return (
    <div className="text-lg font-semibold text-white/60 tracking-tight mb-3">{children}</div>
  )
}

function SettingsTile({ icon, title, subtitle, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full bg-[#222] border border-[#383838] rounded-xl p-4 flex items-center gap-3 text-left"
    >
      <img src={icon} alt="" className="w-6 h-6 flex-shrink-0" />
      <div>
        <div className="text-white text-lg font-semibold leading-snug tracking-tight">{title}</div>
        <div className="text-text-muted text-base leading-tight">{subtitle}</div>
      </div>
    </button>
  )
}
