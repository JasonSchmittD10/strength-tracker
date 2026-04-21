import mascotImage from '@/assets/images/mascot.png'

export default function SplashScreen() {
  return (
    <div className="h-screen bg-[#0a0a0a] flex flex-col items-center justify-center">
      {/* Mascot — crop matches Figma node 133:16897 */}
      <div className="relative w-[177px] h-[159px] overflow-hidden flex-shrink-0">
        <img
          src={mascotImage}
          alt=""
          className="absolute max-w-none"
          style={{
            width: '141.24%',
            height: '280.55%',
            left: '-20.34%',
            top: '-105.69%',
          }}
        />
      </div>

      <p className="font-judge text-[24px] text-white leading-normal mt-[18px]">
        MEATHEAD
      </p>
    </div>
  )
}
