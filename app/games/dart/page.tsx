"use client";

import { useState } from "react";
import ParticipantInput from "@/components/ParticipantInput";
import WinnerModal from "@/components/WinnerModal";
import { pickWinnerIndex } from "@/lib/drawEngine";

type Stage = "input" | "board" | "revealed";

const SIZE = 300;
const CENTER = SIZE / 2;
const BOARD_R = 150;

export default function DartGame() {
  const [names, setNames] = useState<string[]>([]);
  const [stage, setStage] = useState<Stage>("input");
  const [winnerIdx, setWinnerIdx] = useState<number | null>(null);
  const [thrown, setThrown] = useState(false);
  const [target, setTarget] = useState<{ x: number; y: number } | null>(null);

  const start = (list: string[]) => {
    setNames(list);
    setStage("board");
    setThrown(false);
    setWinnerIdx(null);
    setTarget(null);
  };

  const reset = () => {
    setStage("board");
    setThrown(false);
    setWinnerIdx(null);
    setTarget(null);
  };

  const throwDart = () => {
    if (thrown || names.length === 0) return;

    // 1) 당첨자는 애니메이션과 무관하게 먼저 확정 (공정성의 핵심)
    const idx = pickWinnerIndex(names.length);
    setWinnerIdx(idx);

    // 2) 다트가 꽂힐 좌표는 "연출용"으로 당첨 섹터 내부에서 랜덤하게 계산
    const sectorAngle = 360 / names.length;
    const centerAngle = idx * sectorAngle + sectorAngle / 2;
    const angle = centerAngle + (Math.random() - 0.5) * sectorAngle * 0.6;
    const radius = 30 + Math.random() * (BOARD_R - 40);
    const rad = ((angle - 90) * Math.PI) / 180;
    const x = CENTER + radius * Math.cos(rad);
    const y = CENTER + radius * Math.sin(rad);

    setTarget({ x, y });
    setThrown(true);

    // 3) 다트 비행 → 잠시 뒤 카메라 줌인 리빌
    window.setTimeout(() => setStage("revealed"), 1400);
  };

  if (stage === "input") {
    return <ParticipantInput onStart={start} />;
  }

  const sectorAngle = 360 / Math.max(names.length, 1);

  return (
    <div className="mx-auto grid max-w-4xl grid-cols-1 gap-8 px-6 py-12 md:grid-cols-[1fr_220px]">
      <div className="flex flex-col items-center">
        <p className="mb-4 text-center text-sm text-slate-500">
          과녁판이 멀리 있어 이름이 흐리게 보여요. 다트를 던지면 명중한 곳으로 화면이
          가까이 다가갑니다.
        </p>

        <div className="relative" style={{ width: SIZE, height: SIZE }}>
          <svg
            viewBox={`0 0 ${SIZE} ${SIZE}`}
            width={SIZE}
            height={SIZE}
            className="rounded-full border-4 border-slate-700 bg-slate-900 duration-[900ms] ease-out"
            style={{
              transition: "transform 900ms ease-out",
              transform: stage === "revealed" && target ? "scale(2.4)" : "scale(1)",
              transformOrigin: target
                ? `${target.x}px ${target.y}px`
                : "50% 50%",
            }}
          >
            {names.map((_, i) => {
              const startA = i * sectorAngle - 90;
              const endA = startA + sectorAngle;
              const large = sectorAngle > 180 ? 1 : 0;
              const x1 = CENTER + BOARD_R * Math.cos((startA * Math.PI) / 180);
              const y1 = CENTER + BOARD_R * Math.sin((startA * Math.PI) / 180);
              const x2 = CENTER + BOARD_R * Math.cos((endA * Math.PI) / 180);
              const y2 = CENTER + BOARD_R * Math.sin((endA * Math.PI) / 180);
              const mid = (startA + endA) / 2;
              const labelR = BOARD_R * 0.65;
              const lx = CENTER + labelR * Math.cos((mid * Math.PI) / 180);
              const ly = CENTER + labelR * Math.sin((mid * Math.PI) / 180);
              const isWinner = stage === "revealed" && i === winnerIdx;

              return (
                <g key={i}>
                  <path
                    d={`M${CENTER},${CENTER} L${x1},${y1} A${BOARD_R},${BOARD_R} 0 ${large} 1 ${x2},${y2} Z`}
                    fill={i % 2 === 0 ? "#1e293b" : "#0f172a"}
                    stroke="#334155"
                    strokeWidth={1}
                  />
                  <text
                    x={lx}
                    y={ly}
                    textAnchor="middle"
                    fontSize={10}
                    fill={isWinner ? "#f97316" : "#64748b"}
                    fontWeight={isWinner ? 700 : 400}
                    style={{
                      filter: isWinner ? "none" : "blur(2.5px)",
                      transition: "fill 300ms, filter 300ms",
                    }}
                  >
                    {i + 1}
                  </text>
                </g>
              );
            })}

            {target && (
              <circle
                cx={target.x}
                cy={target.y}
                r={4}
                fill="#f97316"
                style={{
                  opacity: thrown ? 1 : 0,
                  transition: "opacity 200ms linear 1100ms",
                }}
              />
            )}
          </svg>
        </div>

        <button
          onClick={throwDart}
          disabled={thrown}
          className="mt-8 rounded-xl bg-brand-600 px-8 py-3 font-semibold transition hover:bg-brand-500 disabled:cursor-not-allowed disabled:opacity-30"
        >
          🎯 다트 던지기
        </button>
      </div>

      <aside className="h-fit rounded-xl border border-slate-800 p-4">
        <div className="mb-3 text-xs text-slate-500">참가자 명단</div>
        <ol className="space-y-1 text-sm">
          {names.map((n, i) => (
            <li
              key={i}
              className={
                stage === "revealed" && i === winnerIdx
                  ? "font-semibold text-brand-500"
                  : "text-slate-300"
              }
            >
              {i + 1}. {n}
            </li>
          ))}
        </ol>
      </aside>

      {stage === "revealed" && winnerIdx !== null && (
        <WinnerModal
          winner={names[winnerIdx]}
          onClose={() => setStage("board")}
          onRetry={reset}
        />
      )}
    </div>
  );
}
