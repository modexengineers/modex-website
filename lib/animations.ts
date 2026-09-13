export const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));

export function rangeOpacity(progress: number, start: number, peakStart: number, peakEnd: number, end: number) {
  if (progress <= start || progress >= end) return 0;
  if (progress < peakStart) return (progress - start) / (peakStart - start);
  if (progress <= peakEnd) return 1;
  return 1 - (progress - peakEnd) / (end - peakEnd);
}
