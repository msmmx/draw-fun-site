"use client";

import { useEffect } from "react";
import confetti from "canvas-confetti";

export default function WinnerModal({
  winner,
  onClose,
  onRetry,
}: {
  winner: string;
  onClose: () => void;
  onRetry: () => void;
}) {
  useEffect(() => {
    confetti({
      particleCount: 150,
      spread: 80,
      origin: { y: 0.6 },
      colors: ["#f97316", "#fb923c", "#fde68a", "#ffffff"],
    });
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md">
      <div className="relative animate-pop overflow-hidden rounded-3xl border border-white/10 bg-slate-900/90 px-10 py-12 text-center shadow-glow">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background:
              "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(249,115,22,0.35), transparent)",
          }}
        />
        <div className="relative">
          <div className="mb-3 text-3xl">🏆</div>
          <div className="mb-2 text-sm tracking-wide text-slate-400">당첨자는...</div>
          <div className="mb-8 bg-gradient-to-r from-orange-300 via-brand-400 to-orange-500 bg-clip-text text-4xl font-extrabold text-transparent">
            {winner}
          </div>
          <div className="flex justify-center gap-3">
            <button
              onClick={onRetry}
              className="rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium transition hover:border-white/20 hover:bg-white/10"
            >
              다시 뽑기
            </button>
            <button
              onClick={onClose}
              className="rounded-xl bg-gradient-to-r from-brand-500 to-orange-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:shadow-glow"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
