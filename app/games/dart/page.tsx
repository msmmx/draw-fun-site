"use client";

import { useEffect, useRef, useState } from "react";
import ParticipantInput from "@/components/ParticipantInput";
import WinnerModal from "@/components/WinnerModal";
import { pickWinnerIndex } from "@/lib/drawEngine";

type Stage = "input" | "board" | "revealed";
type Point = { x: number; y: number };
type Flight = {
  from: Point;
  control: Point;
  to: Point;
  start: number;
  duration: number;
  angle: number;
};

const BOARD_SIZE = 300;
const CENTER = BOARD_SIZE / 2;
const BOARD_R = 150;
const VIEW_W = BOARD_SIZE;
const VIEW_H = BOARD_SIZE + 150;
const HAND_REST: Point = { x: CENTER, y: BOARD_SIZE + 90 };
const MAX_PULL = 70;
const MIN_DURATION = 650;
const MAX_DURATION = 1650;
const AUTO_RELEASE_MS = 2200;

function angleTo(from: Point, to: Point) {
  return (Math.atan2(to.y - from.y, to.x - from.x) * 180) / Math.PI + 90;
}

function bezier(t: number, p0: Point, p1: Point, p2: Point): Point {
  const mt = 1 - t;
  return {
    x: mt * mt * p0.x + 2 * mt * t * p1.x + t * t * p2.x,
    y: mt * mt * p0.y + 2 * mt * t * p1.y + t * t * p2.y,
  };
}

/** 다트 + 손 아이콘 (재사용) */
function DartHandGraphic({ dartOnly = false }: { dartOnly?: boolean }) {
  return (
    <g>
      {!dartOnly && <ellipse cx={0} cy={18} rx={17} ry={21} fill="#f1c9a0" />}
      <line x1={0} y1={dartOnly ? 8 : -2} x2={0} y2={-42} stroke="#cbd5e1" strokeWidth={3} strokeLinecap="round" />
      <polygon points="0,-50 -6,-36 6,-36" fill="#f97316" />
      <polygon points="-5,4 5,4 0,-8" fill="#fb923c" opacity={0.85} />
      <polygon points="-5,12 5,12 0,0" fill="#ea580c" opacity={0.85} />
    </g>
  );
}

export default function DartGame() {
  const [names, setNames] = useState<string[]>([]);
  const [stage, setStage] = useState<Stage>("input");
  const [winnerIdx, setWinnerIdx] = useState<number | null>(null);
  const [target, setTarget] = useState<Point | null>(null);
  const [landed, setLanded] = useState(false);

  const [dragging, setDragging] = useState(false);
  const [pull, setPull] = useState<Point>({ x: 0, y: 0 });
  const [flight, setFlight] = useState<Flight | null>(null);
  const [flightT, setFlightT] = useState(0);

  const pullRef = useRef<Point>({ x: 0, y: 0 });
  const dragStartRef = useRef<Point | null>(null);
  const autoReleaseTimer = useRef<number | null>(null);

  const start = (list: string[]) => {
    setNames(list);
    setStage("board");
    setWinnerIdx(null);
    setTarget(null);
    setLanded(false);
    setFlight(null);
    setPull({ x: 0, y: 0 });
  };

  const reset = () => {
    setStage("board");
    setWinnerIdx(null);
    setTarget(null);
    setLanded(false);
    setFlight(null);
    setPull({ x: 0, y: 0 });
  };

  const clearAutoRelease = () => {
    if (autoReleaseTimer.current) {
      window.clearTimeout(autoReleaseTimer.current);
      autoReleaseTimer.current = null;
    }
  };

  // 놓는 순간(release) 실행: 당첨자는 여기서 딱 한 번, 연출과 무관하게 랜덤으로 확정된다.
  const release = () => {
    clearAutoRelease();
    if (flight || names.length === 0) {
      setDragging(false);
      return;
    }
    setDragging(false);

    const { x: pdx, y: pdy } = pullRef.current;
    const dist = Math.min(Math.hypot(pdx, pdy), MAX_PULL);
    const power = dist / MAX_PULL; // 0~1: 당긴 정도
    const duration = MAX_DURATION - power * (MAX_DURATION - MIN_DURATION);

    // 1) 당첨자 확정 (공정성의 핵심 — 손맛/파워는 결과에 영향 없음)
    const idx = pickWinnerIndex(names.length);
    setWinnerIdx(idx);

    // 2) 낙하 지점은 당첨 섹터 내부에서 랜덤 (연출용)
    const sectorAngle = 360 / names.length;
    const centerAngle = idx * sectorAngle + sectorAngle / 2;
    const spreadAngle = centerAngle + (Math.random() - 0.5) * sectorAngle * 0.6;
    const radius = 30 + Math.random() * (BOARD_R - 40);
    const rad = ((spreadAngle - 90) * Math.PI) / 180;
    const to: Point = {
      x: CENTER + radius * Math.cos(rad),
      y: CENTER + radius * Math.sin(rad),
    };
    setTarget(to);

    const from: Point = { x: HAND_REST.x + pdx, y: HAND_REST.y + pdy };
    const control: Point = {
      x: (from.x + to.x) / 2,
      y: Math.min(from.y, to.y) - 110 - power * 50,
    };

    setFlight({ from, control, to, start: performance.now(), duration, angle: angleTo(from, to) });
    pullRef.current = { x: 0, y: 0 };
    setPull({ x: 0, y: 0 });
  };

  const onHandPointerDown = (e: React.PointerEvent) => {
    if (stage !== "board" || flight) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    setDragging(true);
    pullRef.current = { x: 0, y: 0 };
    setPull({ x: 0, y: 0 });
    clearAutoRelease();
    autoReleaseTimer.current = window.setTimeout(release, AUTO_RELEASE_MS);
  };

  const onHandPointerMove = (e: React.PointerEvent) => {
    if (!dragging || !dragStartRef.current) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    const dist = Math.hypot(dx, dy);
    const scale = dist > MAX_PULL ? MAX_PULL / dist : 1;
    const next = { x: dx * scale, y: dy * scale };
    pullRef.current = next;
    setPull(next);
  };

  const onHandPointerUp = () => {
    if (!dragging) return;
    release();
  };

  // 비행 애니메이션 루프
  useEffect(() => {
    if (!flight) return;
    let raf: number;
    const step = (now: number) => {
      const t = Math.min((now - flight.start) / flight.duration, 1);
      setFlightT(t);
      if (t < 1) {
        raf = requestAnimationFrame(step);
      } else {
        setLanded(true);
        window.setTimeout(() => {
          setFlight(null);
          setStage("revealed");
        }, 500);
      }
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [flight]);

  useEffect(() => clearAutoRelease, []);

  if (stage === "input") {
    return <ParticipantInput onStart={start} />;
  }

  const sectorAngle = 360 / Math.max(names.length, 1);
  const power = Math.min(Math.hypot(pull.x, pull.y), MAX_PULL) / MAX_PULL;
  const dartPos = flight ? bezier(flightT, flight.from, flight.control, flight.to) : null;
  const handPos: Point = { x: HAND_REST.x + pull.x, y: HAND_REST.y + pull.y };
  const handAngle = angleTo(handPos, { x: CENTER, y: CENTER });
  const powerColor = power < 0.5 ? "#4ade80" : power < 0.8 ? "#facc15" : "#f87171";

  return (
    <div className="mx-auto grid max-w-4xl grid-cols-1 gap-8 px-6 py-12 md:grid-cols-[1fr_220px]">
      <div className="flex flex-col items-center">
        <p className="mb-4 text-center text-sm text-slate-500">
          다트를 눌러서 뒤로 당겼다가 놓아보세요. 과녁판이 멀어서 정확히 조준하긴 어렵지만,
          어디에 꽂히든 그건 순전히 랜덤이에요.
        </p>

        <div className="relative select-none" style={{ width: VIEW_W, height: VIEW_H, touchAction: "none" }}>
          <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} width={VIEW_W} height={VIEW_H}>
            {/* 과녁판 (줌 대상 그룹) */}
            <g
              style={{
                transition: "transform 900ms ease-out",
                transform: stage === "revealed" && target ? "scale(2.4)" : "scale(1)",
                transformOrigin: target ? `${target.x}px ${target.y}px` : `${CENTER}px ${CENTER}px`,
              }}
            >
              <circle cx={CENTER} cy={CENTER} r={BOARD_R} fill="#0f172a" />
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
              <circle cx={CENTER} cy={CENTER} r={BOARD_R} fill="none" stroke="#334155" strokeWidth={4} />

              {landed && target && (
                <g transform={`translate(${target.x}, ${target.y}) rotate(${flight?.angle ?? 0})`}>
                  <DartHandGraphic dartOnly />
                </g>
              )}
            </g>

            {/* 고무줄 */}
            {dragging && (
              <line
                x1={HAND_REST.x}
                y1={HAND_REST.y}
                x2={handPos.x}
                y2={handPos.y}
                stroke="#f97316"
                strokeWidth={2}
                strokeDasharray="4 4"
                opacity={0.7}
              />
            )}

            {/* 대기 중인 손 + 다트 (드래그 가능) */}
            {!flight && stage === "board" && (
              <g
                transform={`translate(${handPos.x}, ${handPos.y}) rotate(${handAngle})`}
                onPointerDown={onHandPointerDown}
                onPointerMove={onHandPointerMove}
                onPointerUp={onHandPointerUp}
                onPointerCancel={onHandPointerUp}
                style={{ cursor: dragging ? "grabbing" : "grab" }}
              >
                <DartHandGraphic />
              </g>
            )}

            {/* 날아가는 다트 */}
            {flight && dartPos && (
              <g transform={`translate(${dartPos.x}, ${dartPos.y}) rotate(${flight.angle})`}>
                <DartHandGraphic dartOnly />
              </g>
            )}

            {/* 파워 게이지 */}
            {dragging && (
              <g>
                <rect x={20} y={VIEW_H - 24} width={BOARD_SIZE - 40} height={10} rx={5} fill="#1e293b" stroke="#334155" />
                <rect x={20} y={VIEW_H - 24} width={(BOARD_SIZE - 40) * power} height={10} rx={5} fill={powerColor} />
              </g>
            )}
          </svg>
        </div>

        <p className="mt-3 text-xs text-slate-600">
          {dragging ? "놓으면 발사! (꾹 오래 잡고 있으면 자동으로 발사돼요)" : "다트를 클릭하고 아래로 당겨보세요"}
        </p>
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
