import { defineConfig, devices } from "@playwright/test";

// พอร์ตเฉพาะโปรเจกต์นี้ ไม่ใช้ 3000 — `reuseExistingServer` ทำให้ Playwright ยึดเซิร์ฟเวอร์ที่ฟังพอร์ตนั้นอยู่แล้ว
// ถ้าใช้พอร์ตยอดนิยมอย่าง 3000 แล้วบังเอิญมีโปรเจกต์อื่นรันค้างไว้ เทสจะไปยิงใส่เว็บผิดตัวเงียบ ๆ แล้ว fail
// แบบงง ๆ (หรือแย่กว่านั้นคือ "ผ่าน" ทั้งที่ไม่ได้เทสโค้ดเรา) — เจอมาแล้วตอนพอร์ต 3000 ถูก dev server อื่นถือ
const PORT = Number(process.env.E2E_PORT ?? 4317);
const BASE_URL = `http://localhost:${PORT}`;

// build ลงโฟลเดอร์แยกจาก .next ที่ dev server ใช้อยู่ — ไม่งั้น `next build` เขียนทับไฟล์ใต้เท้า dev server
// ที่รันค้างอยู่ ทำให้ dev พังด้วย ENOENT รัว ๆ ต้อง restart กู้ (คนละเรื่องกับพอร์ตชน แต่เจอพร้อมกันได้)
const DIST_DIR = ".next-e2e";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `NEXT_DIST_DIR=${DIST_DIR} npm run build && NEXT_DIST_DIR=${DIST_DIR} npm run start -- --port ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
