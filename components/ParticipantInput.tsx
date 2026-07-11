"use client";

import { useEffect, useRef, useState } from "react";

export default function ParticipantInput({
  onStart,
  emoji = "🎯",
  title = "다트 뽑기",
  subtitle = "참가자 이름을 한 명씩 입력하세요. (최소 2명)",
  buttonLabel = "다트 던지러 가기",
}: {
  onStart: (names: string[]) => void;
  emoji?: string;
  title?: string;
  subtitle?: string;
  buttonLabel?: string;
}) {
  const [names, setNames] = useState<string[]>(["", "", ""]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const pendingFocus = useRef<number | null>(null);

  const filled = names.map((n) => n.trim()).filter(Boolean);
  const ready = filled.length >= 2;

  useEffect(() => {
    if (pendingFocus.current !== null) {
      inputRefs.current[pendingFocus.current]?.focus();
      pendingFocus.current = null;
    }
  }, [names.length]);

  const updateName = (i: number, value: string) => {
    setNames((prev) => prev.map((n, idx) => (idx === i ? value : n)));
  };

  const addSlot = () => {
    setNames((prev) => {
      pendingFocus.current = prev.length;
      return [...prev, ""];
    });
  };

  const removeSlot = (i: number) => {
    setNames((prev) => (prev.length <= 1 ? prev : prev.filter((_, idx) => idx !== i)));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, i: number) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    if (i === names.length - 1) {
      addSlot();
    } else {
      inputRefs.current[i + 1]?.focus();
    }
  };

  return (
    <div className="mx-auto max-w-xl animate-fadeUp px-6 py-16">
      <div className="mb-1 inline-flex items-center gap-2">
        <span className="text-2xl">{emoji}</span>
        <h1 className="text-2xl font-bold text-white">{title}</h1>
      </div>
      <p className="mb-6 text-sm text-slate-300">{subtitle}</p>

      <div className="space-y-2">
        {names.map((n, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-6 shrink-0 text-right text-xs text-slate-500">{i + 1}</span>
            <input
              ref={(el) => {
                inputRefs.current[i] = el;
              }}
              value={n}
              onChange={(e) => updateName(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, i)}
              placeholder={`참가자 ${i + 1} 이름`}
              className="flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white outline-none transition focus:border-brand-500/60 focus:bg-white/[0.07] placeholder:text-slate-500"
            />
            <button
              type="button"
              onClick={() => removeSlot(i)}
              disabled={names.length <= 1}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-white/5 hover:text-red-400 disabled:opacity-0"
              aria-label="참가자 삭제"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addSlot}
        className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-white/15 py-2.5 text-sm text-slate-300 transition hover:border-brand-500/50 hover:text-brand-400"
      >
        <span className="text-base leading-none">＋</span> 참가자 추가
      </button>

      <div className="mt-4 flex items-center justify-between text-xs">
        <span className={ready ? "font-medium text-brand-400" : "text-slate-400"}>
          {filled.length}명 입력됨
        </span>
        {!ready && <span className="text-slate-500">최소 2명 필요해요</span>}
      </div>

      <button
        disabled={!ready}
        onClick={() => onStart(filled)}
        className="mt-5 w-full rounded-xl bg-gradient-to-r from-brand-500 to-orange-600 py-3.5 font-semibold text-white transition-all duration-200 hover:shadow-glow disabled:cursor-not-allowed disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 disabled:opacity-60 disabled:shadow-none"
      >
        {buttonLabel}
      </button>
    </div>
  );
}
