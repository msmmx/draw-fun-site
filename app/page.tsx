import Link from "next/link";

const games = [
  {
    id: "dart",
    title: "다트 뽑기",
    desc: "멀리 있는 과녁판을 향해 다트를 던져 당첨자를 뽑아요",
    href: "/games/dart",
    ready: true,
  },
  {
    id: "roulette",
    title: "룰렛 뽑기",
    desc: "룰렛이 서서히 멈추며 긴장감 속에 당첨자를 공개해요",
    href: "/games/roulette",
    ready: false,
  },
];

export default function Home() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="mb-2 text-3xl font-bold">어떤 방식으로 뽑을까요?</h1>
      <p className="mb-10 text-slate-400">
        참가자를 입력하고, 게임을 골라 긴장감 넘치는 추첨을 시작하세요.
      </p>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {games.map((g) => (
          <GameCard key={g.id} {...g} />
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
}: {
  title: string;
  desc: string;
  href: string;
  ready: boolean;
}) {
  const content = (
    <div
      className={`rounded-2xl border p-6 transition ${
        ready
          ? "cursor-pointer border-slate-700 hover:border-brand-500 hover:bg-slate-900"
          : "border-slate-800 opacity-50"
      }`}
    >
      <h2 className="mb-2 text-xl font-semibold">{title}</h2>
      <p className="text-sm text-slate-400">{desc}</p>
      {!ready && (
        <span className="mt-4 inline-block text-xs text-slate-500">준비 중</span>
      )}
    </div>
  );

  return ready ? <Link href={href}>{content}</Link> : content;
}
