export type OnMyListScoredAnswer = {
  text: string;
  points: number;
  revealed: boolean;
  foundBy: string | null;
};

const BOARD_POINT_POOL = 55;

export function onMyListRankPoints(answerCount: number): number[] {
  if (!Number.isInteger(answerCount) || answerCount < 1) return [];

  const weights = Array.from({ length: answerCount }, (_, index) => answerCount - index);
  const weightTotal = weights.reduce((sum, weight) => sum + weight, 0);
  const raw = weights.map((weight) => (BOARD_POINT_POOL * weight) / weightTotal);
  const points = raw.map(Math.floor);
  const remainder = BOARD_POINT_POOL - points.reduce((sum, value) => sum + value, 0);

  const remainderOrder = raw
    .map((value, index) => ({ index, fraction: value - Math.floor(value) }))
    .sort((a, b) => b.fraction - a.fraction || a.index - b.index);

  for (const item of remainderOrder.slice(0, remainder)) {
    points[item.index] = (points[item.index] ?? 0) + 1;
  }

  return points;
}

export function scoreOnMyListAnswers(texts: string[]): OnMyListScoredAnswer[] {
  const points = onMyListRankPoints(texts.length);
  return texts.map((text, index) => ({
    text,
    points: points[index] ?? 0,
    revealed: false,
    foundBy: null,
  }));
}

export const ON_MY_LIST_BOARD_POINT_POOL = BOARD_POINT_POOL;
