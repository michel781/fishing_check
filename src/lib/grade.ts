/** 낚시지수 등급 (도움말 범례와 동일: 90/70/50/30) */
export type Tone = "best" | "good" | "fair" | "poor" | "bad";

export function scoreGrade(score: number): { label: string; tone: Tone; message: string } {
  if (score >= 90) return { label: "매우 좋음", tone: "best", message: "최고의 낚시 타이밍!" };
  if (score >= 70) return { label: "좋음", tone: "good", message: "낚시하기 좋은 날" };
  if (score >= 50) return { label: "보통", tone: "fair", message: "무난한 수준" };
  if (score >= 30) return { label: "나쁨", tone: "poor", message: "출조를 고민해보세요" };
  return { label: "매우 나쁨", tone: "bad", message: "가급적 출조를 피하세요" };
}

export const GRADE_LEGEND: { range: string; min: number }[] = [
  { range: "90 ~ 100", min: 90 },
  { range: "70 ~ 89", min: 70 },
  { range: "50 ~ 69", min: 50 },
  { range: "30 ~ 49", min: 30 },
  { range: "0 ~ 29", min: 0 },
];
