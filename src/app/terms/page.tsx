import type { Metadata } from "next";
import { auth } from "@/auth";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent } from "@/components/ui/Card";

export const metadata: Metadata = { title: "ข้อกำหนดการใช้งาน" };

export default async function TermsPage() {
  const session = await auth();

  return (
    <AppShell session={session}>
      <div className="mx-auto max-w-2xl">
        <h1 className="text-xl font-semibold text-fg">ข้อกำหนดการใช้งาน</h1>
        <Card className="mt-4">
          <CardContent className="flex flex-col gap-4 pt-5 text-sm leading-relaxed text-fg-muted">
            <div>
              <h2 className="text-sm font-medium text-fg">1. การยอมรับข้อกำหนด</h2>
              <p className="mt-1">
                การเข้าใช้งาน StockMonitor ถือว่าคุณยอมรับข้อกำหนดการใช้งานนี้ รวมถึง{" "}
                <a href="/disclaimer" className="text-accent hover:underline">ข้อจำกัดความรับผิดชอบ</a> และ{" "}
                <a href="/privacy" className="text-accent hover:underline">นโยบายความเป็นส่วนตัว</a>
              </p>
            </div>
            <div>
              <h2 className="text-sm font-medium text-fg">2. ลักษณะบริการ</h2>
              <p className="mt-1">
                บริการนี้ให้ข้อมูลราคาและบทวิเคราะห์เพื่อการศึกษาเท่านั้น ไม่ใช่บริการให้คำแนะนำการลงทุน
                และไม่รับประกันความถูกต้อง ความสมบูรณ์ หรือความทันเวลาของข้อมูล
              </p>
            </div>
            <div>
              <h2 className="text-sm font-medium text-fg">3. บัญชีผู้ใช้และการสร้างบทวิเคราะห์ AI</h2>
              <p className="mt-1">
                การสร้างบทวิเคราะห์ AI ต้องเข้าสู่ระบบและมีค่าใช้จ่ายตามที่แสดงให้ยืนยันก่อนสร้างทุกครั้ง
                มีการจำกัดจำนวนครั้งต่อผู้ใช้ต่อชั่วโมง/วัน ห้ามพยายามหลีกเลี่ยงข้อจำกัดโควตาหรือใช้บริการในทางที่ผิด
                (เช่น เรียก API ซ้ำ ๆ เกินจำเป็น หรือพยายามเข้าถึงข้อมูลของผู้ใช้อื่น)
              </p>
            </div>
            <div>
              <h2 className="text-sm font-medium text-fg">4. ลิขสิทธิ์เนื้อหา</h2>
              <p className="mt-1">
                ข่าวที่แสดงเป็นการสรุปโดยระบบพร้อมลิงก์ไปยังต้นฉบับ ไม่ใช่การคัดลอกเนื้อหาเต็ม
                ห้ามคัดลอก ทำซ้ำ หรือดึงข้อมูล (scrape) จากเว็บไซต์นี้ไปใช้ในเชิงพาณิชย์โดยไม่ได้รับอนุญาต
              </p>
            </div>
            <div>
              <h2 className="text-sm font-medium text-fg">5. การจำกัดความรับผิด</h2>
              <p className="mt-1">
                เราไม่รับผิดชอบต่อความเสียหายทางการเงินหรืออื่นใดที่เกิดจากการใช้ข้อมูลหรือบทวิเคราะห์บนเว็บไซต์นี้
                ในการตัดสินใจลงทุน ผู้ใช้เป็นผู้รับความเสี่ยงเองทั้งหมด
              </p>
            </div>
            <div>
              <h2 className="text-sm font-medium text-fg">6. การเปลี่ยนแปลง</h2>
              <p className="mt-1">
                ข้อกำหนดนี้อาจปรับปรุงได้เป็นครั้งคราว การใช้งานต่อหลังการปรับปรุงถือว่ายอมรับข้อกำหนดฉบับใหม่
              </p>
            </div>
            <div>
              <h2 className="text-sm font-medium text-fg">ติดต่อ</h2>
              <p className="mt-1">
                <a href="mailto:nuifolio@gmail.com" className="text-accent hover:underline">
                  nuifolio@gmail.com
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
