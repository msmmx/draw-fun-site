"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { pickWinnerIndex, seededRng } from "@/lib/drawEngine";

type Phase =
  | "idle"
  | "lowering"
  | "grabbing"
  | "rising"
  | "moving"
  | "dropping"
  | "releasing"
  | "done";

const PALETTE = [
  "#FF8FA3", // 코랄 핑크
  "#FFD166", // 머스터드
  "#8DE3C0", // 민트
  "#8FC7FF", // 스카이블루
  "#C9A8FF", // 라벤더
  "#FFB88C", // 피치
  "#FF6FB0", // 핫핑크
  "#9AD1D4", // 스카이민트
];

// SVG 좌표계 상수
const BOX_LEFT = 70;
const BOX_RIGHT = 250;
const BOX_TOP = 118;
const BOX_BOTTOM = 320;
const RAIL_Y = 112;
const CLAW_REST_Y = 132;
const GRAB_Y = 288;
const CHUTE_X = 228;
const CHUTE_Y = 296;
const STEP = 18;
const MAX_PLUSH = 12;

const PHASE_DURATION: Partial<Record<Phase, number>> = {
  lowering: 700,
  grabbing: 320,
  rising: 700,
  moving: 700,
  dropping: 420,
  releasing: 320,
};

const PHASE_LABEL: Record<Phase, string> = {
  idle: "←/→ 로 이동, 스페이스바(또는 내리기 버튼)로 뽑기",
  lowering: "집게가 내려가는 중...",
  grabbing: "인형을 붙잡는 중...",
  rising: "집게가 올라오는 중...",
  moving: "배출구로 옮기는 중...",
  dropping: "구멍으로 넣는 중...",
  releasing: "두구두구...",
  done: "두구두구...",
};

function nextPhase(p: Phase): Phase {
  switch (p) {
    case "lowering":
      return "grabbing";
    case "grabbing":
      return "rising";
    case "rising":
      return "moving";
    case "moving":
      return "dropping";
    case "dropping":
      return "releasing";
    case "releasing":
      return "done";
    default:
      return p;
  }
}

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

type PlushSpec = {
  x: number;
  y: number;
  scale: number;
  rotate: number;
  color: string;
};

/** 이름을 노출하지 않는, 색상만 다른 귀여운 인형 아이콘 */
function PlushIcon({
  spec,
  opacity = 1,
}: {
  spec: PlushSpec;
  opacity?: number;
}) {
  const { x, y, scale, rotate, color } = spec;
  return (
    <g
      transform={`translate(${x} ${y}) rotate(${rotate}) scale(${scale})`}
      style={{ opacity, transition: "opacity 260ms ease" }}
    >
      {/* 귀 */}
      <circle cx={-11} cy={-10} r={7.5} fill={color} />
      <circle cx={11} cy={-10} r={7.5} fill={color} />
      {/* 몸통 */}
      <ellipse cx={0} cy={2} rx={17} ry={14} fill={color} />
      {/* 볼터치 */}
      <circle cx={-7} cy={4} r={2.2} fill="#ffffff" opacity={0.35} />
      <circle cx={7} cy={4} r={2.2} fill="#ffffff" opacity={0.35} />
      {/* 눈 */}
      <circle cx={-5} cy={0} r={1.4} fill="#3a2233" />
      <circle cx={5} cy={0} r={1.4} fill="#3a2233" />
    </g>
  );
}

export default function ClawMachine({
  names,
  onRevealed,
}: {
  names: string[];
  onRevealed: (winnerIndex: number) => void;
}) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [clawX, setClawX] = useState((BOX_LEFT + BOX_RIGHT) / 2);
  const [clawY, setClawY] = useState(CLAW_REST_Y);

  const winnerRef = useRef<number | null>(null);
  const heldIndexRef = useRef<number | null>(null);
  const revealedRef = useRef(false);

  const count = Math.min(Math.max(names.length, 2), MAX_PLUSH);

  // 참가자 수에 따라 결정적(고정된) 배치의 인형 더미를 생성한다.
  // Math.random 대신 seededRng를 써서 서버/클라이언트 렌더링이 항상 같은 모양이 되도록 한다.
  const pile = useMemo<PlushSpec[]>(() => {
    const rng = seededRng(count * 97 + 13);
    const specs: PlushSpec[] = [];
    const cols = Math.min(count, 5);
    for (let i = 0; i < count; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const baseX = BOX_LEFT + 30 + col * ((BOX_RIGHT - BOX_LEFT - 60) / Math.max(cols - 1, 1));
      const jitterX = (rng() - 0.5) * 14;
      const baseY = BOX_BOTTOM - 34 - row * 30;
      const jitterY = (rng() - 0.5) * 8;
      specs.push({
        x: clamp(baseX + jitterX, BOX_LEFT + 16, BOX_RIGHT - 16),
        y: baseY + jitterY,
        scale: 0.85 + rng() * 0.35,
        rotate: (rng() - 0.5) * 24,
        color: PALETTE[i % PALETTE.length],
      });
    }
    return specs;
  }, [count]);

  const nearestPlushIndex = useCallback(
    (x: number) => {
      let best = 0;
      let bestDist = Infinity;
      pile.forEach((p, i) => {
        const d = Math.abs(p.x - x);
        if (d < bestDist) {
          bestDist = d;
          best = i;
        }
      });
      return best;
    },
    [pile]
  );

  const moveLeft = useCallback(() => {
    setClawX((x) => clamp(x - STEP, BOX_LEFT + 16, BOX_RIGHT - 16));
  }, []);

  const moveRight = useCallback(() => {
    setClawX((x) => clamp(x + STEP, BOX_LEFT + 16, BOX_RIGHT - 16));
  }, []);

  const drop = useCallback(() => {
    setPhase((p) => {
      if (p !== "idle") return p;
      // 공정성 원칙: 애니메이션이 시작되기 전, "내리기"를 실행하는 이 순간 당첨자를 확정한다.
      winnerRef.current = pickWinnerIndex(names.length);
      heldIndexRef.current = nearestPlushIndex(clawX);
      return "lowering";
    });
  }, [names.length, nearestPlushIndex, clawX]);

  // 키보드 컨트롤
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (phase !== "idle") return;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        moveLeft();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        moveRight();
      } else if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        drop();
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [phase, moveLeft, moveRight, drop]);

  // 단계별 목표 좌표 설정
  useEffect(() => {
    if (phase === "lowering") setClawY(GRAB_Y);
    else if (phase === "rising") setClawY(CLAW_REST_Y);
    else if (phase === "moving") setClawX(CHUTE_X);
    else if (phase === "dropping") setClawY(CHUTE_Y);
  }, [phase]);

  // 단계 자동 진행 (스크립트 기반 연출 — 물리 시뮬레이션이 아닌 확정적 타이밍)
  useEffect(() => {
    const duration = PHASE_DURATION[phase];
    if (!duration) return;
    const t = setTimeout(() => setPhase((p) => nextPhase(p)), duration);
    return () => clearTimeout(t);
  }, [phase]);

  // 연출이 끝나면 부모에게 당첨자를 공개
  useEffect(() => {
    if (phase === "done" && !revealedRef.current && winnerRef.current !== null) {
      revealedRef.current = true;
      onRevealed(winnerRef.current);
    }
  }, [phase, onRevealed]);

  const clawOpen = phase === "idle" || phase === "lowering" || phase === "releasing" || phase === "done";
  const isCarrying =
    heldIndexRef.current !== null &&
    ["grabbing", "rising", "moving", "dropping", "releasing"].includes(phase);
  const carriedOpacity = phase === "releasing" || phase === "done" ? 0 : 1;
  const clawTransitionMs = phase === "idle" ? 150 : PHASE_DURATION[phase] ?? 400;

  return (
    <div className="mx-auto w-full max-w-xl select-none">
      <div className="relative px-2 py-6">
        <svg viewBox="0 0 320 520" className="w-full" style={{ maxHeight: 460 }}>
          <defs>
            <linearGradient id="bodyGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#FFDCEE" />
              <stop offset="45%" stopColor="#FF7DB6" />
              <stop offset="100%" stopColor="#DE1269" />
            </linearGradient>
            <linearGradient id="hoodGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#FFF6FB" />
              <stop offset="55%" stopColor="#FFB8DE" />
              <stop offset="100%" stopColor="#FF7DB6" />
            </linearGradient>
            <linearGradient id="panelGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#FF5EA3" />
              <stop offset="60%" stopColor="#D01167" />
              <stop offset="100%" stopColor="#830C47" />
            </linearGradient>
            <linearGradient id="glassGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F0FDFF" stopOpacity={0.55} />
              <stop offset="100%" stopColor="#FFE3F3" stopOpacity={0.12} />
            </linearGradient>
            <radialGradient id="glossHighlight" cx="30%" cy="18%" r="65%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.55} />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity={0} />
            </radialGradient>
            <radialGradient id="knobGloss" cx="35%" cy="28%" r="70%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.95} />
              <stop offset="100%" stopColor="#FFD6EA" stopOpacity={0} />
            </radialGradient>
            <filter id="floorBlur" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="7" />
            </filter>
            <clipPath id="boxClip">
              <rect x={50} y={BOX_TOP - 14} width={220} height={BOX_BOTTOM - BOX_TOP + 26} rx={26} />
            </clipPath>
          </defs>

          {/* 바닥 그림자 (은은하게 번진 접지 그림자) */}
          <ellipse cx={160} cy={504} rx={112} ry={14} fill="#7A0F45" opacity={0.28} filter="url(#floorBlur)" />

          {/* 본체 — 광택 있는 플라스틱 느낌 */}
          <rect x={25} y={90} width={270} height={385} rx={42} fill="url(#bodyGrad)" />
          <ellipse cx={92} cy={230} rx={52} ry={155} fill="url(#glossHighlight)" />

          {/* 후드 — 알약처럼 둥근 돔 */}
          <rect x={45} y={20} width={230} height={96} rx={48} fill="url(#hoodGrad)" />
          <ellipse cx={100} cy={44} rx={44} ry={22} fill="url(#glossHighlight)" />

          {/* 상단 조명 패널 */}
          <rect x={95} y={36} width={42} height={13} rx={6} fill="#FFFDF6" opacity={0.9} />
          <rect x={183} y={36} width={42} height={13} rx={6} fill="#FFFDF6" opacity={0.9} />

          {/* 유리 진열창 */}
          <rect
            x={50}
            y={BOX_TOP - 14}
            width={220}
            height={BOX_BOTTOM - BOX_TOP + 26}
            rx={26}
            fill="url(#glassGrad)"
            stroke="#FFFFFF"
            strokeOpacity={0.55}
            strokeWidth={2.5}
          />

          {/* 배출 구멍 */}
          <ellipse cx={CHUTE_X} cy={BOX_BOTTOM - 6} rx={16} ry={7} fill="#1a0a12" opacity={0.6} />

          {/* 레일 */}
          <rect x={BOX_LEFT - 6} y={RAIL_Y} width={BOX_RIGHT - BOX_LEFT + 12} height={5} rx={2.5} fill="#7A1F45" />

          {/* 인형 더미 */}
          <g clipPath="url(#boxClip)">
            {pile.map((p, i) => (
              <PlushIcon
                key={i}
                spec={p}
                opacity={isCarrying && heldIndexRef.current === i ? 0 : 1}
              />
            ))}
          </g>

          {/* 옮겨지는 인형 (집게에 붙어서 이동) */}
          {isCarrying && heldIndexRef.current !== null && (
            <PlushIcon
              spec={{
                x: clawX,
                y: clawY + 22,
                scale: pile[heldIndexRef.current]?.scale ?? 1,
                rotate: 0,
                color: pile[heldIndexRef.current]?.color ?? PALETTE[0],
              }}
              opacity={carriedOpacity}
            />
          )}

          {/* 집게 */}
          <g
            style={{
              transform: `translate(${clawX}px, 0px)`,
              transition: `transform ${clawTransitionMs}ms ease-in-out`,
            }}
          >
            <line x1={0} y1={RAIL_Y} x2={0} y2={clawY} stroke="#7A1F45" strokeWidth={4} />
            <g
              style={{
                transform: `translateY(${clawY}px)`,
                transition: `transform ${clawTransitionMs}ms ease-in-out`,
              }}
            >
              <circle cx={0} cy={0} r={9} fill="#FF6FB0" stroke="#7A1F45" strokeWidth={2} />
              {/* 프롱 (집게 손가락) */}
              <g style={{ transition: "transform 250ms ease" }}>
                <line
                  x1={-2}
                  y1={6}
                  x2={clawOpen ? -18 : -7}
                  y2={clawOpen ? 26 : 24}
                  stroke="#FF9CC7"
                  strokeWidth={5}
                  strokeLinecap="round"
                  style={{ transition: "all 250ms ease" }}
                />
                <line
                  x1={2}
                  y1={6}
                  x2={clawOpen ? 18 : 7}
                  y2={clawOpen ? 26 : 24}
                  stroke="#FF9CC7"
                  strokeWidth={5}
                  strokeLinecap="round"
                  style={{ transition: "all 250ms ease" }}
                />
              </g>
            </g>
          </g>

          {/* 유리 전면 반사광 (내용물 위에 살짝 겹치는 유리 하이라이트) */}
          <g clipPath="url(#boxClip)" opacity={0.85}>
            <path d="M68,108 L100,108 L82,190 L52,190 Z" fill="#FFFFFF" opacity={0.14} />
            <path d="M172,108 L204,108 L186,232 L156,232 Z" fill="#FFFFFF" opacity={0.09} />
          </g>

          {/* 컨트롤 패널 */}
          <rect x={25} y={345} width={270} height={140} rx={30} fill="url(#panelGrad)" />
          <rect x={35} y={352} width={250} height={10} rx={5} fill="#FFFFFF" opacity={0.12} />
          <line x1={95} y1={345} x2={95} y2={322} stroke="#FF9CC7" strokeWidth={8} strokeLinecap="round" />
          <circle cx={95} cy={316} r={13} fill="#FFD6EA" stroke="#7A1F45" strokeWidth={2} />
          <circle cx={95} cy={316} r={13} fill="url(#knobGloss)" />
          <circle cx={65} cy={402} r={15} fill="#FFD6EA" stroke="#7A1F45" strokeWidth={2} />
          <circle cx={65} cy={402} r={15} fill="url(#knobGloss)" />
          <circle cx={105} cy={402} r={15} fill="#FFD6EA" stroke="#7A1F45" strokeWidth={2} />
          <circle cx={105} cy={402} r={15} fill="url(#knobGloss)" />
          <rect x={150} y={455} width={110} height={16} rx={8} fill="#1a0a12" opacity={0.55} />

          {/* 받침대 */}
          <ellipse cx={70} cy={478} rx={14} ry={8} fill="#B01463" />
          <ellipse cx={70} cy={475} rx={9} ry={3.5} fill="#FFFFFF" opacity={0.18} />
          <ellipse cx={250} cy={478} rx={14} ry={8} fill="#B01463" />
          <ellipse cx={250} cy={475} rx={9} ry={3.5} fill="#FFFFFF" opacity={0.18} />
        </svg>

        {/* 상태 안내 */}
        <div className="pointer-events-none absolute left-1/2 top-3 -translate-x-1/2 rounded-full border border-pink-300/40 bg-slate-950/80 px-4 py-1.5 text-center text-[11px] text-pink-200 shadow-glow sm:text-xs">
          {PHASE_LABEL[phase]}
        </div>
      </div>

      {/* 컨트롤러 */}
      <div className="mt-4 flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={moveLeft}
          disabled={phase !== "idle"}
          aria-label="집게 왼쪽으로 이동"
          className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-xl text-pink-200 transition hover:bg-white/[0.12] active:scale-95 disabled:opacity-40"
        >
          ◀
        </button>
        <button
          type="button"
          onClick={drop}
          disabled={phase !== "idle"}
          className="rounded-full bg-gradient-to-b from-pink-400 to-fuchsia-600 px-8 py-3.5 text-sm font-extrabold tracking-wide text-white shadow-glow transition active:scale-95 disabled:opacity-60"
        >
          {phase === "idle" ? "내리기" : "두구두구..."}
        </button>
        <button
          type="button"
          onClick={moveRight}
          disabled={phase !== "idle"}
          aria-label="집게 오른쪽으로 이동"
          className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-xl text-pink-200 transition hover:bg-white/[0.12] active:scale-95 disabled:opacity-40"
        >
          ▶
        </button>
      </div>
    </div>
  );
}
