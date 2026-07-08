/**
 * 당첨자 결정 로직 — 모든 뽑기 게임(다트, 룰렛, ...)이 공통으로 사용한다.
 * 중요: 이 파일은 "연출(애니메이션)"과 완전히 분리되어야 한다.
 * 당첨자는 애니메이션이 시작되기 전에 이미 이 함수로 확정되고,
 * 다트/룰렛 등의 움직임은 그 결과를 향해 수렴하는 시각 효과일 뿐이다.
 */

/** 0 ~ count-1 사이의 당첨 인덱스를 랜덤으로 뽑는다. */
export function pickWinnerIndex(
  count: number,
  rng: () => number = Math.random
): number {
  if (count <= 0) {
    throw new Error("참가자가 없습니다.");
  }
  return Math.floor(rng() * count);
}

/**
 * 재현 가능한 시드 기반 랜덤 (테스트용).
 * mulberry32 알고리즘.
 */
export function seededRng(seed: number): () => number {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
