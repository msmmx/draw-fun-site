/**
 * 핑크 웨이브 레이어 배경 — 순수 SVG로 그린 장식용 배경.
 * fixed로 화면 전체를 덮고, 콘텐츠 뒤(z-index -1)에 깔린다.
 * 각 웨이브 레이어가 서로 다른 속도로 좌우로 흔들리며 살아있는 느낌을 준다(패럴랙스).
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
        <style>{`
          @keyframes waveDriftA {
            0%, 100% { transform: translateX(0); }
            50% { transform: translateX(-36px); }
          }
          @keyframes waveDriftB {
            0%, 100% { transform: translateX(0); }
            50% { transform: translateX(44px); }
          }
          @keyframes waveDriftC {
            0%, 100% { transform: translateX(0); }
            50% { transform: translateX(-52px); }
          }
          @keyframes waveDriftD {
            0%, 100% { transform: translateX(0); }
            50% { transform: translateX(60px); }
          }
          .wave-a { animation: waveDriftA 11s ease-in-out infinite; }
          .wave-b { animation: waveDriftB 14s ease-in-out infinite; }
          .wave-c { animation: waveDriftC 17s ease-in-out infinite; }
          .wave-d { animation: waveDriftD 20s ease-in-out infinite; }
          @media (prefers-reduced-motion: reduce) {
            .wave-a, .wave-b, .wave-c, .wave-d { animation: none; }
          }
        `}</style>
        <rect x="0" y="0" width="1440" height="900" fill="#F0399F" />
        <path
          className="wave-a"
          d="M0,360 Q120,300 240,360 T480,360 T720,360 T960,360 T1200,360 T1440,360 L1440,900 L0,900 Z"
          fill="#F48FC0"
        />
        <path
          className="wave-b"
          d="M0,470 Q140,410 280,470 T560,470 T840,470 T1120,470 T1440,470 L1440,900 L0,900 Z"
          fill="#F9BEDD"
        />
        <path
          className="wave-c"
          d="M0,600 Q160,540 320,600 T640,600 T960,600 T1280,600 T1440,600 L1440,900 L0,900 Z"
          fill="#FCDCEC"
        />
        <path
          className="wave-d"
          d="M0,730 Q180,680 360,730 T720,730 T1080,730 T1440,730 L1440,900 L0,900 Z"
          fill="#FDEEF6"
        />
      </svg>
    </div>
  );
}
