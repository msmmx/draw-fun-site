"use client";

import { useEffect, useRef, useState } from "react";
import ParticipantInput from "@/components/ParticipantInput";
import WinnerModal from "@/components/WinnerModal";
import { pickWinnerIndex } from "@/lib/drawEngine";

type Stage = "input" | "machine" | "falling" | "landed" | "opening" | "revealed";
type Capsule = { x: number; y: number; r: number; color: string };

const VIEW_W = 300;
const VIEW_H = 470;

const DOME_CENTER = { x: 150, y: 130 };
const DOME_R = 108;

const CRANK_PIVOT = { x: 246, y: 300 };
const CRANK_TRACK_R = 30;
const CRANK_SENSITIVITY = 1.4; // px 드래그당 회전 각도
const CRANK_THRESHOLD = 900; // 이 정도 누적 회전이면 배출 (대략 2.5바퀴 분량의 드래그)

const SLOT = { x: 150, y: 300 };
const LANDING = { x: 150, y: 372 };

const FALL_DURATION = 950;
const OPEN_DURATION = 650;

const PALETTE = ["#f97316", "#38bdf8", "#a78bfa", "#f472b6", "#34d399", "#fbbf24", "#fb7185"];

function easeOutBounce(t: number) {
  const n1 = 7.5625;
  const d1 = 2.75;
  if (t < 1 / d1) return n1 * t * t;
  if (t < 2 / d1) {
    const tt = t - 1.5 / d1;
    return n1 * tt * tt + 0.75;
  }
  if (t < 2.5 / d1) {
    const tt = t - 2.25 / d1;
    return n1 * tt * tt + 0.9375;
  }
  const tt = t - 2.625 / d1;
  return n1 * tt * tt + 0.984375;
}

function generateCapsules(count: number): Capsule[] {
  const n = Math.min(Math.max(count, 2), 18);
  const capsules: Capsule[] = [];
  let tries = 0;
  while (capsules.length < n && tries < n * 40) {
    tries++;
    const r = 12 + Math.random() * 4;
    const ang = Math.random() * Math.PI * 2;
    const dist = Math.sqrt(Math.random()) * (DOME_R - r - 6);
    const x = DOME_CENTER.x + dist * Math.cos(ang);
    const y = DOME_CENTER.y + 10 + dist * Math.sin(ang) * 0.92;
    const overlaps = capsules.some((c) => Math.hypot(c.x - x, c.y - y) < c.r + r + 2);
    if (!overlaps) {
      capsules.push({ x, y, r, color: PALETTE[capsules.length % PALETTE.length] });
    }
  }
  return capsules;
}

export default function GachaGame() {
  const [names, setNames] = useState<string[]>([]);
  const [stage, setStage] = useState<Stage>("input");
  const [winnerIdx, setWinnerIdx] = useState<number | null>(null);
  const [capsules, setCapsules] = useState<Capsule[]>([]);
  const [ejectedColor, setEjectedColor] = useState(PALETTE[0]);

  const [crankAngle, setCrankAngle] = useState(0);
  const [crankAccum, setCrankAccum] = useState(0);
  const [dragging, setDragging] = useState(false);

  const lastPosRef = useRef<{ x: number; y: number } | null>(null);
  const dispensedRef = useRef(false);

  const [fallT, setFallT] = useState(0);
  const fallStartRef = useRef(0);

  const start = (list: string[]) => {
    setNames(list);
    setCapsules(generateCapsules(list.length));
    setStage("machine");
    setWinnerIdx(null);
    setCrankAngle(0);
    setCrankAccum(0);
    dispensedRef.current = false;
  };

  const reset = () => {
    setCapsules(generateCapsules(names.length));
    setStage("machine");
    setWinnerIdx(null);
    setCrankAngle(0);
    setCrankAccum(0);
    dispensedRef.current = false;
  };

  const dispense = () => {
    if (dispensedRef.current || names.length === 0) return;
    dispensedRef.current = true;

    // 당첨자 확정 — 크랭크를 다 돌린 이 시점에 딱 한 번, 연출과 무관하게 랜덤으로 결정된다.
    const idx = pickWinnerIndex(names.length);
    setWinnerIdx(idx);
    setEjectedColor(PALETTE[Math.floor(Math.random() * PALETTE.length)]);

    fallStartRef.current = performance.now();
    setFallT(0);
    setStage("falling");
  };

  const onCrankPointerDown = (e: React.PointerEvent) => {
    if (stage !== "machine") return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
    lastPosRef.current = { x: e.clientX, y: e.clientY };
  };

  const onCrankPointerMove = (e: React.PointerEvent) => {
    if (!dragging || !lastPosRef.current) return;
    const dx = e.clientX - lastPosRef.current.x;
    const dy = e.clientY - lastPosRef.current.y;
    const dist = Math.hypot(dx, dy);
    lastPosRef.current = { x: e.clientX, y: e.clientY };
    if (dist < 0.5) return;

    setCrankAngle((a) => a + dist * CRANK_SENSITIVITY);
    setCrankAccum((prev) => {
      const next = prev + dist * CRANK_SENSITIVITY;
      if (next >= CRANK_THRESHOLD) dispense();
      return next;
    });
  };

  const onCrankPointerUp = () => setDragging(false);

  // 캡슐 낙하 애니메이션
  useEffect(() => {
    if (stage !== "falling") return;
    let raf: number;
    const step = (now: number) => {
      const t = Math.min((now - fallStartRef.current) / FALL_DURATION, 1);
      setFallT(t);
      if (t < 1) {
        raf = requestAnimationFrame(step);
      } else {
        setStage("landed");
      }
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [stage]);

  const openCapsule = () => {
    if (stage !== "landed") return;
    setStage("opening");
    window.setTimeout(() => setStage("revealed"), OPEN_DURATION);
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

  const crankRad = (crankAngle * Math.PI) / 180;
  const knobX = CRANK_PIVOT.x + CRANK_TRACK_R * Math.cos(crankRad);
  const knobY = CRANK_PIVOT.y + CRANK_TRACK_R * Math.sin(crankRad);
  const crankProgress = Math.min(crankAccum / CRANK_THRESHOLD, 1);

  const fallY = SLOT.y + easeOutBounce(fallT) * (LANDING.y - SLOT.y);
  const fallX = SLOT.x + (LANDING.x - SLOT.x) * Math.min(fallT * 1.4, 1);
  const fallRotate = fallT * 620;

  const isCapsuleVisible = stage === "landed" || stage === "opening" || stage === "revealed";
  const isOpen = stage === "opening" || stage === "revealed";

  return (
    <div className="mx-auto grid max-w-4xl animate-fadeUp grid-cols-1 gap-8 px-6 py-12 md:grid-cols-[1fr_220px]">
      <div className="flex flex-col items-center">
        <p className="mb-5 max-w-sm rounded-full border border-white/5 bg-white/[0.03] px-4 py-2 text-center text-xs text-slate-400 sm:text-sm">
          {stage === "machine" &&
            "손잡이를 잡고 동그랗게 돌려보세요. 다 돌리면 캡슐이 툭 떨어져요."}
          {stage === "falling" && "캡슐이 나오고 있어요..."}
          {stage === "landed" && "캡슐을 눌러서 열어보세요!"}
          {(stage === "opening" || stage === "revealed") && "두구두구... 안에 누가 있을까요?"}
        </p>

        <div className="relative select-none" style={{ width: VIEW_W, height: VIEW_H, touchAction: "none" }}>
          <div
            className="pointer-events-none absolute inset-0 -z-10"
            style={{
              background: "radial-gradient(circle at 50% 30%, rgba(249,115,22,0.10), transparent 60%)",
            }}
          />
          <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} width={VIEW_W} height={VIEW_H}>
            {/* 머신 본체 */}
            <rect x={40} y={240} width={220} height={100} rx={18} fill="#1e293b" stroke="#334155" strokeWidth={2} />
            <rect x={40} y={240} width={220} height={22} rx={11} fill="#0f172a" />
            {/* 배출구 */}
            <rect x={126} y={316} width={48} height={20} rx={6} fill="#020617" stroke="#334155" strokeWidth={2} />

            {/* 돔 */}
            <circle cx={DOME_CENTER.x} cy={DOME_CENTER.y} r={DOME_R} fill="#0b1220" opacity={0.9} />
            {capsules.map((c, i) => (
              <g key={i}>
                <circle cx={c.x} cy={c.y - c.r * 0.35} r={c.r} fill={c.color} opacity={0.9} />
                <path
                  d={`M ${c.x - c.r} ${c.y + c.r * 0.15} A ${c.r} ${c.r} 0 0 0 ${c.x + c.r} ${c.y + c.r * 0.15} Z`}
                  fill="#e2e8f0"
                  opacity={0.85}
                />
              </g>
            ))}
            <circle
              cx={DOME_CENTER.x}
              cy={DOME_CENTER.y}
              r={DOME_R}
              fill="none"
              stroke="#475569"
              strokeWidth={4}
            />
            <ellipse
              cx={DOME_CENTER.x - 30}
              cy={DOME_CENTER.y - 60}
              rx={30}
              ry={14}
              fill="#ffffff"
              opacity={0.06}
            />

            {/* 크랭크 */}
            {stage === "machine" && (
              <g>
                <circle
                  cx={CRANK_PIVOT.x}
                  cy={CRANK_PIVOT.y}
                  r={CRANK_TRACK_R}
                  fill="none"
                  stroke="#334155"
                  strokeDasharray="3 4"
                  strokeWidth={2}
                />
                <circle cx={CRANK_PIVOT.x} cy={CRANK_PIVOT.y} r={5} fill="#475569" />
                <line
                  x1={CRANK_PIVOT.x}
                  y1={CRANK_PIVOT.y}
                  x2={knobX}
                  y2={knobY}
                  stroke="#94a3b8"
                  strokeWidth={4}
                  strokeLinecap="round"
                />
                <g
                  transform={`translate(${knobX}, ${knobY})`}
                  onPointerDown={onCrankPointerDown}
                  onPointerMove={onCrankPointerMove}
                  onPointerUp={onCrankPointerUp}
                  onPointerCancel={onCrankPointerUp}
                  style={{ cursor: dragging ? "grabbing" : "grab" }}
                >
                  <circle r={13} fill="#f97316" />
                  <circle r={13} fill="none" stroke="#fb923c" strokeWidth={2} />
                </g>
                {/* 진행도 게이지 */}
                <rect x={30} y={352} width={240} height={8} rx={4} fill="#1e293b" stroke="#334155" />
                <rect
                  x={30}
                  y={352}
                  width={240 * crankProgress}
                  height={8}
                  rx={4}
                  fill="#f97316"
                  style={{ transition: "width 60ms linear" }}
                />
              </g>
            )}

            {/* 낙하하는 캡슐 */}
            {stage === "falling" && (
              <g transform={`translate(${fallX}, ${fallY}) rotate(${fallRotate})`}>
                <circle r={16} fill={ejectedColor} opacity={0.95} />
                <path d="M -16 3 A 16 16 0 0 0 16 3 Z" fill="#e2e8f0" opacity={0.9} />
              </g>
            )}

            {/* 착지한 캡슐 (열기 인터랙션) */}
            {isCapsuleVisible && (
              <g
                transform={`translate(${LANDING.x}, ${LANDING.y})`}
                onClick={openCapsule}
                style={{ cursor: stage === "landed" ? "pointer" : "default" }}
              >
                {!isOpen && (
                  <g className={stage === "landed" ? "animate-float" : ""}>
                    <circle r={20} fill={ejectedColor} opacity={0.95} />
                    <path d="M -20 4 A 20 20 0 0 0 20 4 Z" fill="#e2e8f0" opacity={0.9} />
                    <circle r={20} fill="none" stroke="#ffffff" strokeOpacity={0.15} strokeWidth={2} />
                  </g>
                )}

                {isOpen && (
                  <>
                    <g
                      style={{
                        transition: `transform ${OPEN_DURATION}ms cubic-bezier(0.34, 1.56, 0.64, 1)`,
                        transform: "translate(-26px, -30px) rotate(-35deg)",
                      }}
                    >
                      <path d="M -20 4 A 20 20 0 0 1 20 4 Z" fill={ejectedColor} opacity={0.95} />
                    </g>
                    <g
                      style={{
                        transition: `transform ${OPEN_DURATION}ms cubic-bezier(0.34, 1.56, 0.64, 1)`,
                        transform: "translate(26px, 30px) rotate(35deg)",
                      }}
                    >
                      <path d="M -20 4 A 20 20 0 0 0 20 4 Z" fill="#e2e8f0" opacity={0.9} />
                    </g>
                    <g
                      style={{
                        transition: `all ${OPEN_DURATION}ms cubic-bezier(0.16, 1, 0.3, 1)`,
                        opacity: stage === "revealed" ? 1 : 0,
                        transform: stage === "revealed" ? "scale(1)" : "scale(0.4)",
                      }}
                    >
                      <rect x={-52} y={-16} width={104} height={32} rx={8} fill="#0f172a" stroke="#f97316" strokeWidth={1.5} />
                      <text
                        x={0}
                        y={5}
                        textAnchor="middle"
                        fontSize={13}
                        fontWeight={700}
                        fill="#fb923c"
                      >
                        {winnerIdx !== null ? names[winnerIdx] : ""}
                      </text>
                    </g>
                  </>
                )}
              </g>
            )}
          </svg>
        </div>
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
                stage === "revealed" && i === winnerIdx
                  ? "rounded-lg bg-brand-500/10 px-2 py-1 font-semibold text-brand-400"
                  : "px-2 py-1 text-slate-300"
              }
            >
              {i + 1}. {n}
            </li>
          ))}
        </ol>
      </aside>

      {stage === "revealed" && winnerIdx !== null && (
        <WinnerModal winner={names[winnerIdx]} onClose={() => setStage("landed")} onRetry={reset} />
      )}
    </div>
  );
}
