import { useNavigate } from 'react-router-dom'
import backArrow from '@/assets/icons/icon-back-arrow.svg'

export default function SettingsSubScreen({ title, children }) {
  const navigate = useNavigate()
  return (
    <div className="flex flex-col min-h-screen bg-bg-primary">
      <div className="safe-top flex items-center gap-[12px] px-4 pt-[14px] pb-[12px]">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center justify-center w-8 h-8 -ml-1"
          aria-label="Back"
        >
          <img src={backArrow} alt="" className="w-5 h-5" />
        </button>
        <h1 className="font-judge font-bold text-[26px] text-white leading-[1.2]">{title}</h1>
      </div>
      <div className="flex-1 overflow-y-auto px-4 pb-8">
        {children}
      </div>
    </div>
  )
}
