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
      <div className="flex flex-col gap-[24px] mt-[16px]">
        <div className="flex justify-center">
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

        <div className="bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-[8px] divide-y divide-[rgba(255,255,255,0.1)]">
          <div className="px-[16px] py-[14px]">
            <p className="font-commons text-[12px] text-[#8b8b8b] tracking-[-0.2px] leading-[14px] uppercase mb-[6px]">
              Display Name
            </p>
            {editingName ? (
              <div className="flex gap-[8px] items-center">
                <input
                  autoFocus
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  className="flex-1 bg-bg-tertiary rounded-[6px] px-[12px] py-[8px] font-commons text-[16px] text-white focus:outline-none focus:ring-1 focus:ring-accent"
                  onKeyDown={e => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') setEditingName(false) }}
                />
                <button onClick={saveName} className="font-commons font-bold text-[14px] text-accent px-[8px]">Save</button>
                <button onClick={() => setEditingName(false)} className="font-commons text-[14px] text-[#8b8b8b] px-[4px]">✕</button>
              </div>
            ) : (
              <button
                onClick={() => { setDisplayName(name); setEditingName(true) }}
                className="flex items-center justify-between w-full text-left"
              >
                <span className="font-commons text-[16px] text-white tracking-[-0.2px]">{name}</span>
                <span className="font-commons font-bold text-[14px] text-accent tracking-[-0.28px]">Edit</span>
              </button>
            )}
          </div>
          <div className="px-[16px] py-[14px]">
            <p className="font-commons text-[12px] text-[#8b8b8b] tracking-[-0.2px] leading-[14px] uppercase mb-[6px]">
              Email
            </p>
            <p className="font-commons text-[16px] text-white tracking-[-0.2px]">{user?.email}</p>
          </div>
        </div>

        <DestructiveButton onClick={signOut}>
          Sign Out
        </DestructiveButton>
      </div>
    </SettingsSubScreen>
  )
}
