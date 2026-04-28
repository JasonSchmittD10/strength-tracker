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
        className="mt-[14px] mb-[24px] block"
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

      <div className="flex flex-col gap-[24px]">
        {/* Stats banner */}
        <div
          className="w-full rounded-[8px] border border-[rgba(242,166,85,0.3)] overflow-hidden flex items-stretch"
          style={{
            backgroundImage:
              'linear-gradient(137.96deg, rgba(0,0,0,0.2) 13.625%, rgba(242,166,85,0.2) 170.19%), linear-gradient(90deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.05) 100%)',
          }}
        >
          <StatCol value={String(sessions.length)} label="SESSIONS" />
          <div className="w-px bg-[#2d2d2d]" />
          <StatCol value={formatVolume(totalLbMoved)} label="LB MOVED" />
          <div className="w-px bg-[#2d2d2d]" />
          <StatCol value={String(weekStreak)} label="WEEK STREAK" />
        </div>

        {/* PRs */}
        {topPrs.length > 0 && (
          <Section title="PRs">
            <div className="grid grid-cols-2 gap-[12px]">
              {topPrs.map(({ name, e1rm }) => (
                <div
                  key={name}
                  className="bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-[8px] pt-[16px] pb-[12px] px-[16px] flex flex-col gap-[4px]"
                >
                  <div className="font-commons text-[14px] text-[#8b8b8b] leading-[14px] uppercase whitespace-nowrap overflow-hidden text-ellipsis">
                    {name}
                  </div>
                  <div className="font-judge font-bold text-[36px] text-white leading-none">
                    {formatWeight(e1rm, weightUnit).replace(/\s*lbs?$|\s*kg$/i, '')}
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Current Program */}
        <Section title="Current Program">
          {activeProgram ? (
            <div className="bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-[8px] p-[16px] flex flex-col gap-[8px]">
              <div className="flex items-start justify-between gap-[8px]">
                <p className="font-judge font-bold text-[32px] leading-[40px] text-white whitespace-nowrap">
                  {activeProgram.name}
                </p>
                <div className="flex flex-wrap gap-[8px] items-center justify-end pt-[6px]">
                  {(activeProgram.tags || []).map(tag => (
                    <span
                      key={tag}
                      className="border border-[rgba(255,255,255,0.1)] rounded-[4px] pt-[4px] pb-[2px] px-[6px] font-commons text-[12px] text-[rgba(255,255,255,0.4)] tracking-[-0.2px] leading-[14px]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              {activeProgram.description && (
                <p className="font-commons text-[16px] text-[#8b8b8b] tracking-[-0.2px] leading-[18px]">
                  {activeProgram.description}
                </p>
              )}
            </div>
          ) : (
            <button
              onClick={() => navigate('/program-selector')}
              className="w-full bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-[8px] p-[16px] text-left"
            >
              <div className="font-commons text-[16px] text-[#8b8b8b]">No active program</div>
              <div className="font-commons text-[14px] text-accent mt-1">Choose a program →</div>
            </button>
          )}
        </Section>

        {/* Settings tiles */}
        <Section title="Settings">
          <div className="flex flex-col gap-[8px]">
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
        </Section>

        {/* Logout */}
        <div className="flex flex-col items-center gap-[24px] pt-[8px]">
          <button
            onClick={() => navigate('/settings/account')}
            className="bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-[4px] px-[12px] py-[10px] w-[163px] font-commons font-bold text-[14px] text-white tracking-[-0.28px]"
          >
            Logout
          </button>
          <p className="font-commons text-[16px] text-[#8b8b8b] tracking-[-0.2px] leading-[18px] text-center">
            APP VERSION: {pkg.version}
          </p>
        </div>
      </div>
    </div>
  )
}

function StatCol({ value, label }) {
  return (
    <div className="flex-1 flex flex-col items-center gap-[5px] py-[16px]">
      <p className="font-judge font-bold text-[36px] text-white leading-none whitespace-nowrap">
        {value}
      </p>
      <p className="font-commons text-[14px] text-[#8b8b8b] leading-[14px] tracking-[-0.2px] text-center">
        {label}
      </p>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div className="flex flex-col gap-[12px]">
      <p className="font-commons font-semibold text-[18px] text-[rgba(255,255,255,0.6)] tracking-[-0.36px] leading-[14px]">
        {title}
      </p>
      {children}
    </div>
  )
}

function SettingsTile({ icon, title, subtitle, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full bg-[#222] border border-[#383838] rounded-[8px] p-[16px] flex items-center gap-[12px] text-left"
    >
      <img src={icon} alt="" className="w-6 h-6 flex-shrink-0" />
      <div className="flex flex-col gap-[2px] min-w-0 flex-1">
        <p className="font-commons font-semibold text-[18px] text-white tracking-[-0.5px] leading-[1.19]">
          {title}
        </p>
        <p className="font-commons text-[16px] text-[#8b8b8b] tracking-[-0.2px] leading-[18px]">
          {subtitle}
        </p>
      </div>
    </button>
  )
}
