import { useProfile, useUpdateProfile } from '@/hooks/useProfile'
import SettingsSubScreen from './SettingsSubScreen'

export default function PrivacyScreen() {
  const { data: profile } = useProfile()
  const { mutateAsync: updateProfile } = useUpdateProfile()

  const isPrivate = profile?.is_private ?? false

  return (
    <SettingsSubScreen title="Privacy">
      <div className="bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-[8px] mt-[16px]">
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
    <div className="flex items-center justify-between px-[16px] py-[14px] gap-[12px]">
      <div className="min-w-0 flex-1">
        <p className="font-commons text-[16px] text-white tracking-[-0.2px]">{label}</p>
        {description && (
          <p className="font-commons text-[14px] text-[#8b8b8b] tracking-[-0.2px] leading-[18px] mt-[2px]">
            {description}
          </p>
        )}
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
