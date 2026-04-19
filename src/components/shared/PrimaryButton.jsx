// Primary CTA button — matches Figma spec: h-46, rounded-[6px], TT Commons Bold 18px, tracking-[-0.36px]
// variant="filled"  → orange fill, black text (default)
// variant="outline" → orange border + text, transparent fill
// variant="dark"    → dark fill (#181818), white text
export default function PrimaryButton({ children, onClick, disabled, className = '', variant = 'filled', type = 'button' }) {
  const base = 'w-full h-[46px] flex items-center justify-center px-4 rounded-[6px] font-bold text-[18px] tracking-[-0.36px] transition-colors disabled:opacity-50'

  const variants = {
    filled:  'bg-accent hover:bg-accent-hover text-black',
    outline: 'bg-transparent border border-accent text-accent hover:bg-accent/5',
    dark:    'bg-[#181818] hover:bg-[#222] text-white',
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  )
}
