import { useState, useRef } from 'react'
import { Camera } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useProfile, useUpdateProfile } from '@/hooks/useProfile'
import { supabase } from '@/lib/supabase'
import DestructiveButton from '@/components/shared/DestructiveButton'
import SettingsSubScreen from './SettingsSubScreen'

export default function AccountScreen() {
  const { user, signOut } = useAuth()
  const { data: profile } = useProfile()
  const { mutateAsync: updateProfile } = useUpdateProfile()
  const [displayName, setDisplayName] = useState('')
  const [editingName, setEditingName] = useState(false)
  const fileInputRef = useRef(null)

  const name = profile?.display_name || user?.email?.split('@')[0] || '?'
  const initial = name[0]?.toUpperCase() || '?'

  async function saveName() {
    if (!displayName.trim()) { setEditingName(false); return }
    try {
      await updateProfile({ display_name: displayName.trim() })
      setEditingName(false)
    } catch (e) {
      // keep editing open on error
    }
  }

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
    <SettingsSubScreen title="My Account">
      <div className="flex flex-col items-center gap-4 py-6">
        <button
          className="relative flex-shrink-0 group"
          onClick={() => fileInputRef.current?.click()}
          aria-label="Change profile photo"
        >
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} className="w-20 h-20 rounded-full object-cover" alt="Profile" />
          ) : (
            <div className="w-20 h-20 rounded-full bg-accent flex items-center justify-center text-white text-2xl font-bold">
              {initial}
            </div>
          )}
          <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity">
            <Camera size={20} className="text-white" />
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
      </div>

      <div className="bg-bg-card border border-bg-tertiary rounded-2xl divide-y divide-bg-tertiary mb-5">
        <div className="px-4 py-3">
          <div className="text-xs text-text-muted mb-1">Display Name</div>
          {editingName ? (
            <div className="flex gap-2 items-center">
              <input
                autoFocus
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                className="flex-1 bg-bg-tertiary rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:ring-1 focus:ring-accent"
                onKeyDown={e => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') setEditingName(false) }}
              />
              <button onClick={saveName} className="text-accent text-sm font-medium px-2">Save</button>
              <button onClick={() => setEditingName(false)} className="text-text-muted text-sm px-1">✕</button>
            </div>
          ) : (
            <button
              onClick={() => { setDisplayName(name); setEditingName(true) }}
              className="flex items-center justify-between w-full text-left"
            >
              <span className="text-text-primary text-sm">{name}</span>
              <span className="text-accent text-xs">Edit</span>
            </button>
          )}
        </div>
        <div className="px-4 py-3">
          <div className="text-xs text-text-muted mb-1">Email</div>
          <div className="text-text-primary text-sm">{user?.email}</div>
        </div>
      </div>

      <DestructiveButton onClick={signOut} className="w-full">
        Sign Out
      </DestructiveButton>
    </SettingsSubScreen>
  )
}
