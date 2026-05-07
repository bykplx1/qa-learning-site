export interface DailyActivityRow {
  day: string | Date;
}

export interface StreakResult {
  current: number;
  longest: number;
}

function toEpochDay(d: string | Date): number {
  if (typeof d === 'string') {
    const [y, m, day] = d.split('-').map(Number);
    return Math.floor(Date.UTC(y, m - 1, day) / 86400000);
  }
  return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000);
}

export function streakOf(rows: DailyActivityRow[], today: Date): StreakResult {
  if (rows.length === 0) return { current: 0, longest: 0 };

  const days = Array.from(new Set(rows.map((r) => toEpochDay(r.day)))).sort((a, b) => a - b);

  let longest = 1;
  let run = 1;
  for (let i = 1; i < days.length; i++) {
    run = days[i] === days[i - 1] + 1 ? run + 1 : 1;
    if (run > longest) longest = run;
  }

  const todayEpoch = toEpochDay(today);
  const last = days[days.length - 1];
  let current = 0;
  if (last === todayEpoch || last === todayEpoch - 1) {
    current = 1;
    for (let i = days.length - 2; i >= 0; i--) {
      if (days[i] === days[i + 1] - 1) current++;
      else break;
    }
  }
  return { current, longest };
}
