import Link from "next/link";

const games = [
  {
    id: "dart",
    title: "다트 뽑기",
    desc: "멀리 있는 과녁판을 향해 다트를 던져 당첨자를 뽑아요",
    href: "/games/dart",
    ready: true,
    emoji: "🎯",
    gradient: "from-orange-500/20 to-red-500/5",
  },
  {
    id: "gacha",
    title: "가챠 뽑기",
    desc: "손잡이를 돌려 캡슐을 뽑고, 직접 열어서 당첨자를 확인해요",
    href: "/games/gacha",
    ready: true,
    emoji: "🎰",
    gradient: "from-purple-500/20 to-pink-500/5",
  },
  {
    id: "roulette",
    title: "룰렛 뽑기",
    desc: "룰렛이 서서히 멈추며 긴장감 속에 당첨자를 공개해요",
    href: "/games/roulette",
    ready: false,
    emoji: "🎡",
    gradient: "from-sky-500/20 to-indigo-500/5",
  },
];

export default function Home() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-20">
      <div className="mb-14 animate-fadeUp text-center">
        <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-400">
          <span className="h-1.5 w-1.5 animate-glowPulse rounded-full bg-brand-500" />
          공정한 랜덤 · 몰입감 있는 연출
        </div>
        <h1 className="mb-3 text-4xl font-black tracking-tight sm:text-5xl">
          어떤 방식으로{" "}
          <span className="bg-gradient-to-r from-orange-300 via-brand-500 to-orange-600 bg-clip-text text-transparent">
            뽑을까요?
          </span>
        </h1>
        <p className="mx-auto max-w-md text-sm text-slate-400 sm:text-base">
          참가자를 입력하고, 게임을 골라 긴장감 넘치는 추첨을 시작하세요.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {games.map((g, i) => (
          <GameCard key={g.id} {...g} delay={i * 0.08} />
        ))}
      </div>
    </div>
  );
}

function GameCard({
  title,
  desc,
  href,
  ready,
  emoji,
  gradient,
  delay,
}: {
  title: string;
  desc: string;
  href: string;
  ready: boolean;
  emoji: string;
  gradient: string;
  delay: number;
}) {
  const content = (
    <div
      className={`group relative overflow-hidden rounded-2xl border p-7 transition-all duration-300 ${
        ready
          ? "cursor-pointer border-white/10 bg-white/[0.03] hover:-translate-y-1 hover:border-brand-500/50 hover:shadow-glow"
          : "border-white/5 bg-white/[0.015] opacity-60"
      }`}
      style={{ animationDelay: `${delay}s` }}
    >
      <div
        className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 transition-opacity duration-300 ${
          ready ? "group-hover:opacity-100" : ""
        }`}
      />
      <div className="relative">
        <div
          className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 text-2xl ${
            ready ? "group-hover:animate-float" : ""
          }`}
        >
          {emoji}
        </div>
        <h2 className="mb-1.5 text-xl font-bold">{title}</h2>
        <p className="text-sm leading-relaxed text-slate-400">{desc}</p>
        {ready ? (
          <div className="mt-5 inline-flex items-center gap-1 text-xs font-semibold text-brand-400 transition-transform group-hover:translate-x-1">
            시작하기 <span aria-hidden>→</span>
          </div>
        ) : (
          <span className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-white/5 px-2.5 py-1 text-xs text-slate-500">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-600" />
            준비 중
          </span>
        )}
      </div>
    </div>
  );

  return ready ? (
    <Link href={href} className="animate-fadeUp" style={{ animationDelay: `${delay}s` }}>
      {content}
    </Link>
  ) : (
    <div className="animate-fadeUp" style={{ animationDelay: `${delay}s` }}>
      {content}
    </div>
  );
}
