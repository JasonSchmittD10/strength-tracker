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
      <div className="bg-bg-card border border-bg-tertiary rounded-2xl divide-y divide-bg-tertiary mt-4">
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
    <div className="flex items-center justify-between px-4 py-3">
      <div className="text-sm text-text-primary">{label}</div>
      <div className="flex bg-bg-tertiary rounded-lg p-0.5">
        {options.map(opt => {
          const active = opt.value === value
          return (
            <button
              key={String(opt.value)}
              type="button"
              onClick={() => { if (!active) onChange(opt.value) }}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                active ? 'bg-accent text-black' : 'text-text-secondary hover:text-text-primary'
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
