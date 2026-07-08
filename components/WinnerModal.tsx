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
    confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="animate-pop rounded-2xl border border-slate-700 bg-slate-900 px-10 py-12 text-center">
        <div className="mb-2 text-sm text-slate-400">당첨자는...</div>
        <div className="mb-8 text-4xl font-extrabold text-brand-500">{winner}</div>
        <div className="flex justify-center gap-3">
          <button
            onClick={onRetry}
            className="rounded-lg border border-slate-600 px-4 py-2 text-sm hover:bg-slate-800"
          >
            다시 뽑기
          </button>
          <button
            onClick={onClose}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm hover:bg-brand-500"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
