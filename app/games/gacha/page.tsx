"use client";

import { useState } from "react";
import ParticipantInput from "@/components/ParticipantInput";
import WinnerModal from "@/components/WinnerModal";
import ClawMachine from "@/components/ClawMachine";

type Stage = "input" | "machine";

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
    setSceneKey((k) => k + 1);
  };

  if (stage === "input") {
    return (
      <ParticipantInput
        onStart={start}
        emoji="🧸"
        title="인형뽑기"
        subtitle="참가자 이름을 한 명씩 입력하세요. (최소 2명)"
        buttonLabel="인형 뽑으러 가기"
      />
    );
  }

  return (
    <div className="mx-auto grid max-w-4xl animate-fadeUp grid-cols-1 gap-8 px-6 py-12 md:grid-cols-[1fr_220px]">
      <div className="flex flex-col items-center">
        <p className="mb-5 max-w-sm rounded-full border border-white/5 bg-white/[0.03] px-4 py-2 text-center text-xs text-slate-400 sm:text-sm">
          ←/→ 로 집게를 움직이고, 스페이스바나 화면의 내리기 버튼으로 뽑아보세요. 어떤 인형이
          나올지는 아무도 몰라요.
        </p>

        <ClawMachine key={sceneKey} names={names} onRevealed={(idx) => setWinnerIdx(idx)} />
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
