export default function PrimaryButton({ children, onClick, disabled, className = '', variant = 'primary', type = 'button' }) {
  const base = 'w-full flex items-center justify-center px-[16px] py-[12px] rounded-[6px] font-commons font-bold text-[18px] tracking-[-0.36px] transition-colors overflow-hidden disabled:opacity-50'

  const variants = {
    primary:   'bg-accent active:bg-accent-hover text-black',
    secondary: 'bg-white/5 border border-white/10 text-white active:bg-white/10',
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${variants[variant] ?? variants.primary} ${className}`}
    >
      {children}
    </button>
  )
}
