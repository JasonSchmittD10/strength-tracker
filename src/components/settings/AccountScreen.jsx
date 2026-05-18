import { useState, useRef, useEffect } from 'react'
import { Camera } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useProfile, useUpdateProfile } from '@/hooks/useProfile'
import { supabase } from '@/lib/supabase'
import TextField from '@/components/shared/TextField'
import SettingsSubScreen from './SettingsSubScreen'

const PASSWORD_PLACEHOLDER = '•••••••••'

export default function AccountScreen() {
  const { user, signOut } = useAuth()
  const { data: profile } = useProfile()
  const { mutateAsync: updateProfile } = useUpdateProfile()
  const fileInputRef = useRef(null)

  const initialDisplayName = profile?.display_name ?? ''
  const initialEmail = user?.email ?? ''
  const initial = (initialDisplayName || initialEmail || '?')[0]?.toUpperCase() || '?'

  const [displayName, setDisplayName] = useState(initialDisplayName)
  const [email, setEmail] = useState(initialEmail)
  const [password, setPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)

  // Keep local state in sync if profile/user load after mount.
  useEffect(() => { setDisplayName(initialDisplayName) }, [initialDisplayName])
  useEffect(() => { setEmail(initialEmail) }, [initialEmail])

  const nameChanged = displayName.trim() !== initialDisplayName
  const emailChanged = email.trim() !== initialEmail
  const passwordChanged = password.length > 0
  const hasChanges = nameChanged || emailChanged || passwordChanged

  async function handleSave() {
    if (!hasChanges || saving) return
    setSaving(true)
    setError(null)
    setSuccessMessage(null)
    try {
      const successes = []

      if (nameChanged) {
        await updateProfile({ display_name: displayName.trim() })
        successes.push('Display name updated.')
      }

      if (emailChanged || passwordChanged) {
        const payload = {}
        if (emailChanged) payload.email = email.trim()
        if (passwordChanged) payload.password = password
        const { error: authError } = await supabase.auth.updateUser(payload)
        if (authError) throw authError
        if (emailChanged) successes.push('Check your new email to confirm the change.')
        if (passwordChanged) successes.push('Password updated.')
      }

      setPassword('')
      setSuccessMessage(successes.join(' '))
    } catch (e) {
      setError(e?.message ?? 'Failed to save changes. Please try again.')
    } finally {
      setSaving(false)
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
    } catch (err) {
      console.warn('Avatar upload failed', err)
    }
  }

  return (
    <SettingsSubScreen title="My Account">
      <div className="flex flex-col gap-[24px] mt-[16px] pb-[120px]">
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

        <div className="flex flex-col gap-[16px]">
          <TextField
            id="display-name"
            label="Display Name"
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            autoComplete="name"
          />
          <TextField
            id="email"
            label="Email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            autoComplete="email"
          />
          <TextField
            id="password"
            label="Password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder={PASSWORD_PLACEHOLDER}
            autoComplete="new-password"
          />
        </div>

        {error && (
          <p className="font-commons text-[14px] text-danger text-center">{error}</p>
        )}
        {successMessage && (
          <p className="font-commons text-[14px] text-success text-center">{successMessage}</p>
        )}

        <button
          onClick={signOut}
          className="font-commons font-bold text-[18px] text-[#c02727] tracking-[-0.36px] text-center"
        >
          Sign Out
        </button>
      </div>

      {/* Sticky Save Changes footer */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-[rgba(255,255,255,0.1)] bg-bg-primary pt-[16px] pb-[16px] px-[16px]">
        <button
          onClick={handleSave}
          disabled={!hasChanges || saving}
          className={`w-full h-[46px] rounded-[6px] font-commons font-bold text-[18px] tracking-[-0.36px] transition-colors ${
            hasChanges && !saving
              ? 'bg-accent text-black'
              : 'bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.05)] text-[rgba(255,255,255,0.5)]'
          }`}
        >
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </SettingsSubScreen>
  )
}
