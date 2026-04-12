import { useEffect, useRef } from 'react'

export default function SlideUpSheet({ open, onClose, title, children, footer, heightClass = 'h-[70vh]' }) {
  const dragStartY = useRef(null)

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  // Swipe-down-to-close on the handle/header
  function onHandleTouchStart(e) {
    dragStartY.current = e.touches[0].clientY
  }
  function onHandleTouchMove(e) {
    if (dragStartY.current === null) return
    if (e.touches[0].clientY - dragStartY.current > 60) {
      dragStartY.current = null
      onClose()
    }
  }
  function onHandleTouchEnd() {
    dragStartY.current = null
  }

  return (
    <div className="fixed inset-0 z-[60] flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div
        className={`relative bg-bg-secondary rounded-t-2xl ${heightClass} flex flex-col overflow-hidden`}
        onTouchMove={e => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-bg-tertiary flex-shrink-0 touch-none"
          onTouchStart={onHandleTouchStart}
          onTouchMove={onHandleTouchMove}
          onTouchEnd={onHandleTouchEnd}
        >
          <div className="w-10 h-1 rounded-full bg-bg-tertiary absolute top-2 left-1/2 -translate-x-1/2" />
          <h2 className="font-bold text-text-primary text-base">{title}</h2>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary text-xl leading-none">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {children}
        </div>
        {footer && (
          <div className="flex-shrink-0 px-5 pt-3 pb-[88px] border-t border-bg-tertiary">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
