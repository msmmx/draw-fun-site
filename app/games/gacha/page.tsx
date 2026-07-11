"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import ParticipantInput from "@/components/ParticipantInput";
import WinnerModal from "@/components/WinnerModal";

const GachaScene = dynamic(() => import("@/components/GachaScene"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[440px] w-full max-w-xl items-center justify-center rounded-3xl border border-white/5 bg-white/[0.02] text-sm text-slate-500">
      가챠 머신을 준비하는 중...
    </div>
  ),
});

type Stage = "input" | "machine" | "revealed";

export default function GachaGame() {
  const [names, setNames] = useState<string[]>([]);
  const [stage, setStage] = useState<Stage>("input");
  const [winnerIdx, setWinnerIdx] = useState<number | null>(null);
  const [sceneKey, setSceneKey] = useState(0);

  const start = (list: string[]) => {
    setNames(list);
    setWinnerIdx(null);
    setStage("machine");
    setSceneKey((k) => k + 1);
  };

  const reset = () => {
    setWinnerIdx(null);
    setStage("machine");
    setSceneKey((k) => k + 1);
  };

  if (stage === "input") {
    return (
      <ParticipantInput
        onStart={start}
        emoji="🎰"
        title="가챠 뽑기"
        subtitle="참가자 이름을 한 명씩 입력하세요. (최소 2명)"
        buttonLabel="가챠 돌리러 가기"
      />
    );
  }

  return (
    <div className="mx-auto grid max-w-4xl animate-fadeUp grid-cols-1 gap-8 px-6 py-12 md:grid-cols-[1fr_220px]">
      <div className="flex flex-col items-center">
        <p className="mb-5 max-w-sm rounded-full border border-white/5 bg-white/[0.03] px-4 py-2 text-center text-xs text-slate-400 sm:text-sm">
          버튼을 누르면 머신이 흔들리고, 캡슐 하나가 튀어나와 열려요. 어떤 캡슐이 나올지는
          아무도 몰라요.
        </p>

        <GachaScene key={sceneKey} names={names} onRevealed={(idx) => setWinnerIdx(idx)} />
      </div>

      <aside className="h-fit rounded-2xl border border-white/10 bg-white/[0.03] p-4 shadow-card">
        <div className="mb-3 flex items-center gap-1.5 text-xs text-slate-500">
          <span className="h-1.5 w-1.5 rounded-full bg-brand-500/70" />
          참가자 명단
        </div>
        <ol className="space-y-1 text-sm">
          {names.map((n, i) => (
            <li
              key={i}
              className={
                winnerIdx === i
                  ? "rounded-lg bg-brand-500/10 px-2 py-1 font-semibold text-brand-400"
                  : "px-2 py-1 text-slate-300"
              }
            >
              {i + 1}. {n}
            </li>
          ))}
        </ol>
      </aside>

      {winnerIdx !== null && (
        <WinnerModal winner={names[winnerIdx]} onClose={() => setWinnerIdx(null)} onRetry={reset} />
      )}
    </div>
  );
}
