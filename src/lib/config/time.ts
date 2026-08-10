// ข้อยกเว้นเดียวของกฎ "เก็บ UTC เสมอ" — โควตารายวันอิงตามวันของผู้ใช้ (Asia/Bangkok) ไม่ใช่ UTC (docs/07)
const BANGKOK_DAY_FORMATTER = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok" });

export function bangkokDayKey(date: Date = new Date()): string {
  return BANGKOK_DAY_FORMATTER.format(date); // 'YYYY-MM-DD'
}

/** เวลา (epoch ms) ที่โควตาจะรีเซ็ตครั้งถัดไป คือเที่ยงคืนของวันถัดไปตามเวลาไทย */
export function nextBangkokMidnightMs(date: Date = new Date()): number {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  // เที่ยงคืน Asia/Bangkok (UTC+7) ของวันถัดไป = 17:00 UTC ของวันปัจจุบัน
  const utcMs = Date.UTC(get("year"), get("month") - 1, get("day"), 17, 0, 0);
  return utcMs > date.getTime() ? utcMs : utcMs + 24 * 60 * 60 * 1000;
}
