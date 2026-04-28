import { useProfile, useUpdateProfile } from '@/hooks/useProfile'
import SettingsSubScreen from './SettingsSubScreen'

const WEEK_START_OPTIONS = [
  { value: 1, label: 'Mon' },
  { value: 0, label: 'Sun' },
  { value: 6, label: 'Sat' },
]

export default function PreferencesScreen() {
  const { data: profile } = useProfile()
  const { mutateAsync: updateProfile } = useUpdateProfile()

  const weightUnit = profile?.weightUnit ?? 'lbs'
  const distanceUnit = profile?.distanceUnit ?? 'mi'
  const weekStartDay = profile?.weekStartDay ?? 1

  return (
    <SettingsSubScreen title="Preferences">
      <div className="bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-[8px] divide-y divide-[rgba(255,255,255,0.1)] mt-[16px]">
        <SegmentedRow
          label="Weight"
          value={weightUnit}
          options={[{ value: 'lbs', label: 'lbs' }, { value: 'kg', label: 'kg' }]}
          onChange={v => updateProfile({ weight_unit: v })}
        />
        <SegmentedRow
          label="Distance"
          value={distanceUnit}
          options={[{ value: 'mi', label: 'mi' }, { value: 'km', label: 'km' }]}
          onChange={v => updateProfile({ distance_unit: v })}
        />
        <SegmentedRow
          label="Week Starts"
          value={weekStartDay}
          options={WEEK_START_OPTIONS}
          onChange={v => updateProfile({ week_start_day: v })}
        />
      </div>
    </SettingsSubScreen>
  )
}

function SegmentedRow({ label, value, options, onChange }) {
  return (
    <div className="flex items-center justify-between px-[16px] py-[14px] gap-[12px]">
      <p className="font-commons text-[16px] text-white tracking-[-0.2px]">{label}</p>
      <div className="flex bg-bg-tertiary rounded-[6px] p-[2px]">
        {options.map(opt => {
          const active = opt.value === value
          return (
            <button
              key={String(opt.value)}
              type="button"
              onClick={() => { if (!active) onChange(opt.value) }}
              className={`px-[12px] py-[4px] font-commons font-bold text-[12px] rounded-[4px] transition-colors tracking-[-0.2px] ${
                active ? 'bg-accent text-black' : 'text-[#8b8b8b] hover:text-white'
              }`}
            >
              {opt.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
