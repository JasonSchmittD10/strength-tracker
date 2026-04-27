import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera, Clock, ChevronRight } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useProfile, useUpdateProfile } from '@/hooks/useProfile'
import { useSessions, usePRs } from '@/hooks/useSessions'
import { useProgramConfig } from '@/hooks/useProgramConfig'
import { migrateExerciseNames } from '@/lib/exercises'
import { supabase } from '@/lib/supabase'
import { formatWeight } from '@/lib/units'

const WEEK_START_OPTIONS = [
  { value: 1, label: 'Mon' },
  { value: 0, label: 'Sun' },
  { value: 6, label: 'Sat' },
]

export default function SettingsTab() {
  const { user, signOut } = useAuth()
  const { data: profile } = useProfile()
  const { mutateAsync: updateProfile } = useUpdateProfile()
  const { data: sessions = [] } = useSessions()
  const { program: activeProgram } = useProgramConfig()
  const weightUnit = profile?.weightUnit ?? 'lbs'
  const distanceUnit = profile?.distanceUnit ?? 'mi'
  const weekStartDay = profile?.weekStartDay ?? 1
  const prs = usePRs()
  const [displayName, setDisplayName] = useState('')
  const [editingName, setEditingName] = useState(false)
  const [migrating, setMigrating] = useState(false)
  const fileInputRef = useRef(null)
  const navigate = useNavigate()

  const name = profile?.display_name || user?.email?.split('@')[0] || '?'
  const initial = name[0]?.toUpperCase() || '?'
  const isPrivate = profile?.is_private || false

  async function saveName() {
    if (!displayName.trim()) { setEditingName(false); return }
    try {
      await updateProfile({ display_name: displayName.trim() })
      setEditingName(false)
    } catch (e) {
      // keep editing open; mutation error is handled by TanStack Query
    }
  }

  function exportData() {
    const blob = new Blob([JSON.stringify(sessions, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `hybrid-sessions-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(a.href)
  }

  async function runMigration() {
    if (!window.confirm('This will update exercise names in all your sessions. Continue?')) return
    setMigrating(true)
    try {
      await migrateExerciseNames(supabase)
      alert('Migration complete. Check console for details.')
    } catch (e) {
      alert('Migration failed. Check console for details.')
      console.error('[migrate] Unexpected error', e)
    } finally {
      setMigrating(false)
    }
  }

  async function togglePrivacy() {
    await updateProfile({ is_private: !isPrivate })
  }

  // TODO: create 'avatars' bucket in Supabase Storage (public read, authenticated write)
  async function handlePhotoUpload(e) {
    const file = e.target.files?.[0]
    if (!file || !user) return
    try {
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(`${user.id}/avatar.jpg`, file, { upsert: true })
      if (uploadError) throw uploadError
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(`${user.id}/avatar.jpg`)
      await updateProfile({ avatar_url: publicUrl })
    } catch (e) {
      console.warn('Avatar upload failed', e)
    }
  }

  return (
    <div className="safe-top px-4 pb-8 max-w-lg mx-auto">
      <h1 className="font-bold text-2xl text-text-primary py-4">Settings</h1>

      <Section title="Profile">
        <div className="flex items-center gap-4 mb-4">
          <button
            className="relative flex-shrink-0 group"
            onClick={() => fileInputRef.current?.click()}
            aria-label="Change profile photo"
          >
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} className="w-14 h-14 rounded-full object-cover" alt="Profile" />
            ) : (
              <div className="w-14 h-14 rounded-full bg-accent flex items-center justify-center text-white text-xl font-bold">
                {initial}
              </div>
            )}
            <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity">
              <Camera size={18} className="text-white" />
            </div>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="user"
            className="hidden"
            onChange={handlePhotoUpload}
          />
          <div className="flex-1 min-w-0">
            {editingName ? (
              <div className="flex gap-2">
                <input
                  autoFocus
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  className="flex-1 bg-bg-tertiary rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-accent"
                  onKeyDown={e => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') setEditingName(false) }}
                />
                <button onClick={saveName} className="text-accent text-sm px-2">Save</button>
              </div>
            ) : (
              <button onClick={() => { setDisplayName(name); setEditingName(true) }} className="text-left">
                <div className="font-semibold text-text-primary">{name}</div>
                <div className="text-xs text-accent">Edit name</div>
              </button>
            )}
            <div className="text-xs text-text-muted mt-0.5 truncate">{user?.email}</div>
          </div>
        </div>

        <ToggleRow
          label="Private profile"
          description="Activity hidden from group members"
          checked={isPrivate}
          onChange={togglePrivacy}
        />
      </Section>

      <Section title="Activity">
        <button
          onClick={() => navigate('/history')}
          className="w-full flex items-center justify-between py-3 text-left"
        >
          <div className="flex items-center gap-3">
            <Clock size={16} className="text-text-muted" />
            <div className="text-sm text-text-primary">History</div>
          </div>
          <ChevronRight size={16} className="text-text-muted" />
        </button>
      </Section>

      <Section title="Preferences">
        <SegmentedRow
          label="Week starts on"
          value={weekStartDay}
          options={WEEK_START_OPTIONS}
          onChange={v => updateProfile({ week_start_day: v })}
        />
        <SegmentedRow
          label="Weight unit"
          value={weightUnit}
          options={[{ value: 'lbs', label: 'lbs' }, { value: 'kg', label: 'kg' }]}
          onChange={v => updateProfile({ weight_unit: v })}
        />
        <SegmentedRow
          label="Distance unit"
          description="Used for conditioning sessions (coming soon)"
          value={distanceUnit}
          options={[{ value: 'mi', label: 'mi' }, { value: 'km', label: 'km' }]}
          onChange={v => updateProfile({ distance_unit: v })}
        />
      </Section>

      <Section title="Personal Records">
        <div className="grid grid-cols-2 gap-3 py-2">
          {prs.map(({ name, e1rm }) => (
            <div key={name} className="bg-bg-tertiary rounded-xl p-3">
              <div className="text-xs text-text-muted mb-1 leading-tight">{name}</div>
              <div className="font-bold text-text-primary text-base">
                {formatWeight(e1rm, weightUnit)}
              </div>
              <div className="text-xs text-text-muted">e1RM</div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Program">
        <div className="flex items-center justify-between py-2">
          <div>
            <div className="text-sm font-medium text-text-primary">{activeProgram?.name || 'No active program'}</div>
            <div className="text-xs text-text-muted">Active program</div>
          </div>
          <button
            onClick={() => navigate('/program-selector')}
            className="text-sm text-accent font-medium"
          >
            Change
          </button>
        </div>
      </Section>

      <Section title="Data">
        <ActionRow label="Export Data" description="Download all sessions as JSON" onClick={exportData} />
        <ActionRow
          label={migrating ? 'Migrating…' : 'Run Name Migration'}
          description="Normalize historical exercise names"
          onClick={runMigration}
          disabled={migrating}
        />
      </Section>

      <button
        onClick={signOut}
        className="w-full mt-4 py-3 rounded-xl border border-danger/40 text-danger text-sm font-semibold hover:bg-danger/10 transition-colors"
      >
        Sign Out
      </button>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div className="mb-5">
      <div className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">{title}</div>
      <div className="bg-bg-card border border-bg-tertiary rounded-2xl px-4 py-2 space-y-1">
        {children}
      </div>
    </div>
  )
}

function ToggleRow({ label, description, checked, onChange }) {
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <div className="text-sm text-text-primary">{label}</div>
        {description && <div className="text-xs text-text-muted">{description}</div>}
      </div>
      <button
        role="switch"
        aria-checked={checked}
        onClick={onChange}
        className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0 ${checked ? 'bg-accent' : 'bg-bg-tertiary'}`}
      >
        <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
      </button>
    </div>
  )
}

function SegmentedRow({ label, description, value, options, onChange }) {
  return (
    <div className="py-2">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm text-text-primary">{label}</div>
          {description && <div className="text-xs text-text-muted">{description}</div>}
        </div>
        <div className="flex bg-bg-tertiary rounded-lg p-0.5 flex-shrink-0">
          {options.map(opt => {
            const active = opt.value === value
            return (
              <button
                key={String(opt.value)}
                type="button"
                onClick={() => { if (!active) onChange(opt.value) }}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                  active
                    ? 'bg-accent text-black'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                {opt.label}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function ActionRow({ label, description, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full flex items-center justify-between py-3 text-left disabled:opacity-50"
    >
      <div>
        <div className="text-sm text-text-primary">{label}</div>
        {description && <div className="text-xs text-text-muted">{description}</div>}
      </div>
      <span className="text-text-muted text-sm">›</span>
    </button>
  )
}
