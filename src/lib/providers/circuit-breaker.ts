// วงจรตัดไฟง่าย ๆ ในหน่วยความจำ: error ติดกัน N ครั้ง → ปิด M วินาที แล้วลองใหม่ (half-open)
// ใช้ต่อ process — บน serverless แต่ละ instance มี state แยกกัน (ยอมรับได้สำหรับ Phase 1)
const FAILURE_THRESHOLD = 5;
const COOLDOWN_MS = 60_000;

interface BreakerState {
  consecutiveFailures: number;
  openUntil: number | null;
}

const state = new Map<string, BreakerState>();

function getState(providerId: string): BreakerState {
  let s = state.get(providerId);
  if (!s) {
    s = { consecutiveFailures: 0, openUntil: null };
    state.set(providerId, s);
  }
  return s;
}

export function isOpen(providerId: string): boolean {
  const s = getState(providerId);
  if (s.openUntil === null) return false;
  if (Date.now() >= s.openUntil) {
    // ครบ cooldown แล้ว → half-open (อนุญาตให้ลองอีกครั้ง)
    s.openUntil = null;
    s.consecutiveFailures = 0;
    return false;
  }
  return true;
}

export function recordSuccess(providerId: string): void {
  const s = getState(providerId);
  s.consecutiveFailures = 0;
  s.openUntil = null;
}

export function recordFailure(providerId: string): void {
  const s = getState(providerId);
  s.consecutiveFailures += 1;
  if (s.consecutiveFailures >= FAILURE_THRESHOLD) {
    s.openUntil = Date.now() + COOLDOWN_MS;
  }
}
