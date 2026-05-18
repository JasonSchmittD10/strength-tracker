import { useState } from 'react'

export default function TextField({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  autoComplete,
  disabled,
  id,
}) {
  const [focused, setFocused] = useState(false)
  return (
    <div className="flex flex-col gap-[8px] w-full">
      {label && (
        <label
          htmlFor={id}
          className="font-commons text-[14px] text-[#8b8b8b] tracking-[-0.2px] leading-[14px]"
        >
          {label}
        </label>
      )}
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        disabled={disabled}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className={`w-full rounded-[4px] px-[10px] pt-[13px] pb-[12px] font-commons text-[18px] tracking-[-0.5px] leading-[1.19] focus:outline-none transition-colors disabled:opacity-60 ${
          focused
            ? 'bg-[rgba(242,166,85,0.05)] border border-[rgba(242,166,85,0.5)]'
            : 'bg-[#0a0a0a] border border-[rgba(255,255,255,0.1)]'
        } ${value ? 'text-white' : 'text-[rgba(255,255,255,0.6)]'} placeholder:text-[rgba(255,255,255,0.4)]`}
      />
    </div>
  )
}
