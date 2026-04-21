import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

export default function SlideUpSheet({ open, onClose, title, children, footer, topOffset = 0 }) {
  const [mounted, setMounted] = useState(false)
  const [visible, setVisible] = useState(false)
  const contentRef = useRef(null)
  const dragStartY = useRef(null)
  const dragCurrentY = useRef(null)
  const sheetRef = useRef(null)

  useEffect(() => {
    if (open) {
      setMounted(true)
      requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)))
    } else {
      setVisible(false)
      const t = setTimeout(() => setMounted(false), 300)
      return () => clearTimeout(t)
    }
  }, [open])

  // Lock background scroll
  useEffect(() => {
    if (!open) return
    function preventBgScroll(e) {
      if (contentRef.current && contentRef.current.contains(e.target)) return
      e.preventDefault()
    }
    document.addEventListener('touchmove', preventBgScroll, { passive: false })
    return () => document.removeEventListener('touchmove', preventBgScroll)
  }, [open])

  function onTouchStart(e) {
    dragStartY.current = e.touches[0].clientY
    dragCurrentY.current = e.touches[0].clientY
  }
  function onTouchMove(e) {
    if (dragStartY.current === null) return
    dragCurrentY.current = e.touches[0].clientY
    const delta = dragCurrentY.current - dragStartY.current
    if (delta > 0 && sheetRef.current) {
      sheetRef.current.style.transform = `translateY(${delta}px)`
    }
  }
  function onTouchEnd() {
    if (dragStartY.current === null) return
    const delta = (dragCurrentY.current ?? dragStartY.current) - dragStartY.current
    if (delta > 80) {
      onClose()
    } else if (sheetRef.current) {
      sheetRef.current.style.transform = ''
    }
    dragStartY.current = null
    dragCurrentY.current = null
  }

  if (!mounted) return null

  return createPortal(
    <div className="fixed inset-0 z-[60] flex flex-col justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 transition-opacity duration-300"
        style={{ opacity: visible ? 1 : 0 }}
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className="relative bg-[#161616] border-t border-[rgba(255,255,255,0.1)] rounded-tl-[16px] rounded-tr-[16px] flex flex-col transition-transform duration-300"
        style={{
          transform: visible ? 'translateY(0)' : 'translateY(100%)',
          maxHeight: topOffset ? `calc(100dvh - ${topOffset}px)` : undefined,
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Pill */}
        <div className="flex justify-center pt-[8px] pb-[0px] flex-shrink-0">
          <div className="h-[4px] w-[39px] bg-[#969698] rounded-full" />
        </div>

        {/* Content */}
        <div ref={contentRef} className="px-[20px] pt-[16px] flex-1 overflow-y-auto min-h-0">
          {title && (
            <h2 className="font-judge text-[26px] leading-[1.2] text-white mb-[4px]">{title}</h2>
          )}
          {children}
        </div>

        {footer && (
          <div className="flex-shrink-0 px-[20px] pt-[12px]">
            {footer}
          </div>
        )}

        {/* Home indicator */}
        <div className="h-[34px] flex-shrink-0 relative">
          <div className="absolute bottom-[8px] left-1/2 -translate-x-1/2 h-[5px] w-[134px] bg-[#969698] rounded-full" />
        </div>
      </div>
    </div>,
    document.body
  )
}
