/**
 * Calculate Event Chips based on score rules:
 * - 0점: 0개
 * - 1~9점: 앞자리 1자리 (1~9개)
 * - 10~99점: 제일 앞자리 1자리 (예: 25점 -> 2개, 78점 -> 7개)
 * - 100점 이상: 앞에서부터 2자리 (예: 125점 -> 12개, 340점 -> 34개, 1200점 -> 12개)
 */
export function calculateEventChips(score: number): { chips: number; explanation: string } {
  if (score <= 0) {
    return { chips: 0, explanation: '점수 0점: 이벤트 칩 0개' };
  }

  const scoreStr = Math.floor(score).toString();

  if (score < 10) {
    const chips = parseInt(scoreStr[0], 10);
    return {
      chips,
      explanation: `${score}점: 1자리 점수의 앞자리인 ${chips}개 획득!`,
    };
  }

  if (score < 100) {
    const chips = parseInt(scoreStr[0], 10);
    return {
      chips,
      explanation: `${score}점: 10의 자리 점수의 제일 앞자리인 ${chips}개 획득!`,
    };
  }

  // 100점 이상: 앞에서부터 2자리
  const chips = parseInt(scoreStr.slice(0, 2), 10);
  return {
    chips,
    explanation: `${score}점: 100점 이상 기준 앞에서부터 2자리인 ${chips}개 획득!`,
  };
}
