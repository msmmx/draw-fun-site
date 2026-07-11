"use client";

import { useState } from "react";

export default function ParticipantInput({
  onStart,
  emoji = "🎯",
  title = "다트 뽑기",
  subtitle = "참가자 이름을 줄바꿈 또는 쉼표로 구분해 입력하세요. (최소 2명)",
  buttonLabel = "다트 던지러 가기",
}: {
  onStart: (names: string[]) => void;
  emoji?: string;
  title?: string;
  subtitle?: string;
  buttonLabel?: string;
}) {
  const [raw, setRaw] = useState("");

  const names = raw
    .split(/[\n,]/)
    .map((n) => n.trim())
    .filter(Boolean);

  const ready = names.length >= 2;

  return (
    <div className="mx-auto max-w-xl animate-fadeUp px-6 py-16">
      <div className="mb-1 inline-flex items-center gap-2">
        <span className="text-2xl">{emoji}</span>
        <h1 className="text-2xl font-bold">{title}</h1>
      </div>
      <p className="mb-6 text-sm text-slate-400">{subtitle}</p>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 shadow-card transition focus-within:border-brand-500/50 focus-within:shadow-glow">
        <textarea
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          rows={7}
          placeholder={"민수\n지은\n하늘\n..."}
          className="w-full resize-none border-none bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-600"
        />

        {names.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5 border-t border-white/5 pt-3">
            {names.map((n, i) => (
              <span
                key={i}
                className="rounded-full bg-white/5 px-2.5 py-1 text-xs text-slate-300"
              >
                {n}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between text-xs">
        <span className={ready ? "text-brand-400" : "text-slate-500"}>
          {names.length}명 입력됨
        </span>
        {!ready && names.length > 0 && (
          <span className="text-slate-600">최소 2명 필요해요</span>
        )}
      </div>

      <button
        disabled={!ready}
        onClick={() => onStart(names)}
        className="mt-5 w-full rounded-xl bg-gradient-to-r from-brand-500 to-orange-600 py-3.5 font-semibold text-white transition-all duration-200 hover:shadow-glow disabled:cursor-not-allowed disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 disabled:opacity-60 disabled:shadow-none"
      >
        {buttonLabel}
      </button>
    </div>
  );
}
