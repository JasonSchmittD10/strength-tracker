import { createPortal } from 'react-dom'

export default function ModalOverlay({ children, className = '' }) {
  return createPortal(
    <div className={`fixed inset-0 z-[60] ${className}`}>
      {children}
    </div>,
    document.body
  )
}
