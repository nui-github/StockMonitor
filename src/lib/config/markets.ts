import type { AssetClass, MarketState } from "@/types/market";

// วันหยุดตลาดหุ้นสหรัฐ (NYSE) — ปีปัจจุบัน+ถัดไป อัปเดตมือทุกปลายปี (ไม่มี API ฟรีที่เชื่อถือได้)
const US_MARKET_HOLIDAYS = new Set([
  "2026-01-01",
  "2026-01-19",
  "2026-02-16",
  "2026-04-03",
  "2026-05-25",
  "2026-06-19",
  "2026-07-03",
  "2026-09-07",
  "2026-11-26",
  "2026-12-25",
]);

interface EasternWallClock {
  dateKey: string; // YYYY-MM-DD ตามเวลา New York
  weekday: number; // 0=Sun .. 6=Sat
  minutesSinceMidnight: number;
}

function getEasternWallClock(date: Date): EasternWallClock {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    weekday: "short",
  }).formatToParts(date);

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const year = get("year");
  const month = get("month");
  const day = get("day");
  let hour = Number(get("hour"));
  const minute = Number(get("minute"));
  if (hour === 24) hour = 0; // Intl บาง locale คืน "24" แทน "00"

  const weekdayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

  return {
    dateKey: `${year}-${month}-${day}`,
    weekday: weekdayMap[get("weekday")] ?? 0,
    minutesSinceMidnight: hour * 60 + minute,
  };
}

/** ตลาดหุ้น/ETF สหรัฐ: pre 04:00–09:30, open 09:30–16:00, post 16:00–20:00 (Eastern) */
function getUsEquityMarketState(now: Date): MarketState {
  const wc = getEasternWallClock(now);

  if (wc.weekday === 0 || wc.weekday === 6) return "closed";
  if (US_MARKET_HOLIDAYS.has(wc.dateKey)) return "holiday";

  const PRE_START = 4 * 60;
  const OPEN_START = 9 * 60 + 30;
  const OPEN_END = 16 * 60;
  const POST_END = 20 * 60;

  if (wc.minutesSinceMidnight < PRE_START) return "closed";
  if (wc.minutesSinceMidnight < OPEN_START) return "pre";
  if (wc.minutesSinceMidnight < OPEN_END) return "open";
  if (wc.minutesSinceMidnight < POST_END) return "post";
  return "closed";
}

/** Commodity/FX สปอต: เทรดต่อเนื่อง อาทิตย์ 18:00 ET ถึง ศุกร์ 17:00 ET */
function getCommodityMarketState(now: Date): MarketState {
  const wc = getEasternWallClock(now);
  const SUNDAY_OPEN = 18 * 60;
  const FRIDAY_CLOSE = 17 * 60;

  if (wc.weekday === 6) return "closed"; // เสาร์ทั้งวัน
  if (wc.weekday === 0 && wc.minutesSinceMidnight < SUNDAY_OPEN) return "closed";
  if (wc.weekday === 5 && wc.minutesSinceMidnight >= FRIDAY_CLOSE) return "closed";
  return "open";
}

export function getMarketState(assetClass: AssetClass, now: Date = new Date()): MarketState {
  if (assetClass === "commodity" || assetClass === "fx" || assetClass === "crypto") {
    return getCommodityMarketState(now);
  }
  return getUsEquityMarketState(now);
}
