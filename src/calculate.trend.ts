import { TrendState } from "./interfaces/novel.daily.stats.service.interface.js";

export const calculateTrend = (
  liveTotal: number,
  yestTotal: number | undefined,
  dayBeforeTotal: number | undefined,
) => {
  // 1. Bugünün kazancı (Şu anki canlı veri - Dün geceki kapanış)
  const todayGain = liveTotal - (yestTotal ?? 0);
  // 2. Dünün kazancı (Dün geceki kapanış - Önceki geceki kapanış)
  const prevGain = (yestTotal ?? 0) - (dayBeforeTotal ?? 0);

  let change = 0;
  if (prevGain > 0) {
    change = ((todayGain - prevGain) / prevGain) * 100;
  } else if (todayGain > 0) {
    change = 100;
  }

  return {
    current: liveTotal,
    change: parseFloat(change.toFixed(1)),
    status:
      todayGain > prevGain
        ? TrendState.UP
        : todayGain < prevGain
          ? TrendState.DOWN
          : TrendState.STABLE,
  };
};
