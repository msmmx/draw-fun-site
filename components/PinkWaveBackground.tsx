/**
 * 핑크 웨이브 레이어 배경 — 순수 SVG로 그린 장식용 배경.
 * fixed로 화면 전체를 덮고, 콘텐츠 뒤(z-index -1)에 깔린다.
 */
export default function PinkWaveBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#F0399F]">
      <svg
        className="absolute bottom-0 left-0 h-full w-full"
        viewBox="0 0 1440 900"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect x="0" y="0" width="1440" height="900" fill="#F0399F" />
        <path
          d="M0,360 Q120,300 240,360 T480,360 T720,360 T960,360 T1200,360 T1440,360 L1440,900 L0,900 Z"
          fill="#F48FC0"
        />
        <path
          d="M0,470 Q140,410 280,470 T560,470 T840,470 T1120,470 T1440,470 L1440,900 L0,900 Z"
          fill="#F9BEDD"
        />
        <path
          d="M0,600 Q160,540 320,600 T640,600 T960,600 T1280,600 T1440,600 L1440,900 L0,900 Z"
          fill="#FCDCEC"
        />
        <path
          d="M0,730 Q180,680 360,730 T720,730 T1080,730 T1440,730 L1440,900 L0,900 Z"
          fill="#FDEEF6"
        />
      </svg>
    </div>
  );
}
