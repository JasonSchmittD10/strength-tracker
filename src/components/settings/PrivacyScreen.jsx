import { useProfile, useUpdateProfile } from '@/hooks/useProfile'
import SettingsSubScreen from './SettingsSubScreen'

export default function PrivacyScreen() {
  const { data: profile } = useProfile()
  const { mutateAsync: updateProfile } = useUpdateProfile()

  const isPrivate = profile?.is_private ?? false

  return (
    <SettingsSubScreen title="Privacy">
      <div className="bg-bg-card border border-bg-tertiary rounded-2xl mt-4">
        <ToggleRow
          label="Private Profile"
          description="Hide your activity from group members"
          checked={isPrivate}
          onChange={() => updateProfile({ is_private: !isPrivate })}
        />
      </div>
    </SettingsSubScreen>
  )
}

function ToggleRow({ label, description, checked, onChange }) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
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
