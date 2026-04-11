import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useProfile, useUpdateProfile } from '@/hooks/useProfile'
import { useSessions } from '@/hooks/useSessions'
import { useProgram } from '@/hooks/useProgram'
import { migrateExerciseNames } from '@/lib/exercises'
import { supabase } from '@/lib/supabase'

export default function SettingsTab() {
  const { user, signOut } = useAuth()
  const { data: profile } = useProfile()
  const { mutateAsync: updateProfile } = useUpdateProfile()
  const { data: sessions = [] } = useSessions()
  const { data: programData } = useProgram()
  const [displayName, setDisplayName] = useState('')
  const [editingName, setEditingName] = useState(false)
  const [migrating, setMigrating] = useState(false)

  const name = profile?.display_name || user?.email?.split('@')[0] || '?'
  const initial = name[0]?.toUpperCase() || '?'
  const isPrivate = profile?.is_private || false

  async function saveName() {
    if (!displayName.trim()) { setEditingName(false); return }
    await updateProfile({ display_name: displayName.trim() })
    setEditingName(false)
  }

  function exportData() {
    const blob = new Blob([JSON.stringify(sessions, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `hybrid-sessions-${new Date().toISOString().split('T')[0]}.json`
    a.click()
  }

  async function runMigration() {
    setMigrating(true)
    await migrateExerciseNames(supabase)
    setMigrating(false)
    alert('Migration complete. Check console for details.')
  }

  async function togglePrivacy() {
    await updateProfile({ is_private: !isPrivate })
  }

  return (
    <div className="safe-top px-4 pb-8 max-w-lg mx-auto">
      <h1 className="font-bold text-2xl text-text-primary py-4">Settings</h1>

      <Section title="Profile">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-full bg-accent flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
            {initial}
          </div>
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

      <Section title="Program">
        <div className="flex items-center justify-between py-2">
          <div>
            <div className="text-sm font-medium text-text-primary">{programData?.program?.name || 'PPL × 2'}</div>
            <div className="text-xs text-text-muted">Active program</div>
          </div>
          <span className="text-xs text-text-muted">(change coming soon)</span>
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
        onClick={onChange}
        className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0 ${checked ? 'bg-accent' : 'bg-bg-tertiary'}`}
      >
        <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
      </button>
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
