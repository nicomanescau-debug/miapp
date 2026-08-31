export const CHART_PALETTE = [
  "#aa3bff",
  "#3b82f6",
  "#f59e0b",
  "#14b8a6",
  "#ec4899",
  "#84cc16",
  "#6366f1",
  "#f97316",
];

export function colorForIndex(index: number): string {
  return CHART_PALETTE[index % CHART_PALETTE.length];
}
