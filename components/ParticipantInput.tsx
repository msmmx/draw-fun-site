"use client";

import { useState } from "react";

export default function ParticipantInput({
  onStart,
}: {
  onStart: (names: string[]) => void;
}) {
  const [raw, setRaw] = useState("");

  const names = raw
    .split(/[\n,]/)
    .map((n) => n.trim())
    .filter(Boolean);

  return (
    <div className="mx-auto max-w-xl px-6 py-16">
      <h1 className="text-2xl font-bold mb-1">🎯 다트 뽑기</h1>
      <p className="text-slate-400 mb-6 text-sm">
        참가자 이름을 줄바꿈 또는 쉼표로 구분해 입력하세요. (최소 2명)
      </p>
      <textarea
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
        rows={8}
        placeholder={"민수\n지은\n하늘\n..."}
        className="w-full rounded-xl border border-slate-700 bg-slate-900 p-4 text-sm outline-none focus:border-brand-500 resize-none"
      />
      <div className="mt-3 text-xs text-slate-500">{names.length}명 입력됨</div>
      <button
        disabled={names.length < 2}
        onClick={() => onStart(names)}
        className="mt-6 w-full rounded-xl bg-brand-600 py-3 font-semibold transition hover:bg-brand-500 disabled:cursor-not-allowed disabled:opacity-30"
      >
        다트 던지러 가기
      </button>
    </div>
  );
}
