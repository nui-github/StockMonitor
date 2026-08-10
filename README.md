# StockMonitor

เว็บติดตามราคา **หุ้นรายตัว / ETF / Commodity** แบบ realtime พร้อม **บทวิเคราะห์จาก AI**
ที่สรุปจากแหล่งข่าวน่าเชื่อถือหลายแห่ง + วิเคราะห์กราฟเทคนิค

Stack: Next.js 15 (App Router) · TypeScript · Tailwind CSS v4 · lucide-react · Noto Sans Thai · Postgres + Drizzle · Redis · Claude API

---

## เอกสาร (อ่านตามลำดับ)

| # | ไฟล์ | เนื้อหา |
|---|------|--------|
| 00 | [PRD](docs/00-PRD.md) | ขอบเขตสินค้า, user stories, scope MVP |
| 01 | [Architecture](docs/01-ARCHITECTURE.md) | system design, realtime, caching, jobs |
| 02 | [Project Structure](docs/02-PROJECT-STRUCTURE.md) | โครงโฟลเดอร์ + convention |
| 03 | [Data Sources](docs/03-DATA-SOURCES.md) | ผู้ให้บริการราคา/ข่าว + provider adapter |
| 04 | [API Spec](docs/04-API-SPEC.md) | REST + SSE contract |
| 05 | [AI Pipeline](docs/05-AI-PIPELINE.md) | ingest → RAG → analyze → report schema |
| 06 | [Design System](docs/06-DESIGN-SYSTEM.md) | dark minimal futuristic tokens + components |
| 07 | [Data Model](docs/07-DATA-MODEL.md) | schema ตาราง + index |
| 08 | [Deployment](docs/08-DEPLOYMENT.md) | env, CI/CD, production checklist |
| 09 | [Roadmap](docs/09-ROADMAP.md) | แผนทำงานเป็น phase |
| 10 | [Compliance](docs/10-COMPLIANCE.md) | ลิขสิทธิ์ข่าว, disclaimer, ข้อกฎหมาย |
| 11 | [Deploy Guide](docs/11-DEPLOY-GUIDE.md) | GitHub → Vercel ทีละขั้น (ทำเอง) |

## เริ่มงาน

```bash
npm install
cp .env.example .env.local   # ใส่ API key ตาม docs/03
npm run db:push
npm run dev
```

## คำสั่งหลัก

| คำสั่ง | ทำอะไร |
|-------|--------|
| `npm run dev` | dev server (Turbopack) |
| `npm run build` | production build |
| `npm run lint` / `typecheck` | ESLint / tsc --noEmit |
| `npm run test` | Vitest unit |
| `npm run test:e2e` | Playwright |
| `npm run db:push` / `db:studio` | Drizzle schema / GUI |

## ข้อควรรู้

- เว็บนี้ให้ **ข้อมูลเชิงวิเคราะห์เพื่อการศึกษา ไม่ใช่คำแนะนำการลงทุน** — ดู [docs/10](docs/10-COMPLIANCE.md)
- **บทวิเคราะห์ AI สร้างเมื่อผู้ใช้กดปุ่มเท่านั้น** ไม่มีการสร้างอัตโนมัติ และต้องแสดงค่าใช้จ่ายโดยประมาณให้ผู้ใช้ยืนยันก่อนทุกครั้ง ([docs/05 §7](docs/05-AI-PIPELINE.md))
- ราคาข้อมูลตลาดใช้ free tier ได้ตอน dev แต่ **ต้องตรวจ ToS เรื่อง redistribution** ก่อนเปิดสาธารณะ ([docs/03](docs/03-DATA-SOURCES.md))
