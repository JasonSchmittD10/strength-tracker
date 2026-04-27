export default function DestructiveButton({ children, onClick, disabled, className = '', type = 'button' }) {
  const base = 'w-full flex items-center justify-center px-[16px] py-[12px] rounded-[6px] font-commons font-bold text-[18px] tracking-[-0.36px] transition-colors overflow-hidden disabled:opacity-50 bg-white/5 border border-[rgba(192,39,39,0.5)] text-white active:bg-[rgba(192,39,39,0.1)] active:border-[rgba(192,39,39,0.8)]'

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${className}`}
    >
      {children}
    </button>
  )
}
