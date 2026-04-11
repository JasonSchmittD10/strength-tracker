import { useEffect } from 'react'

export default function SlideUpSheet({ open, onClose, title, children, heightClass = 'h-[70vh]' }) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className={`relative bg-bg-secondary rounded-t-2xl ${heightClass} flex flex-col overflow-hidden`}>
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-bg-tertiary flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-bg-tertiary absolute top-2 left-1/2 -translate-x-1/2" />
          <h2 className="font-bold text-text-primary text-base">{title}</h2>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary text-xl leading-none">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {children}
        </div>
      </div>
    </div>
  )
}
