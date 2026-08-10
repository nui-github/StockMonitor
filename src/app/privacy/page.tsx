import type { Metadata } from "next";
import { auth } from "@/auth";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent } from "@/components/ui/Card";

export const metadata: Metadata = { title: "นโยบายความเป็นส่วนตัว" };

export default async function PrivacyPage() {
  const session = await auth();

  return (
    <AppShell session={session}>
      <div className="mx-auto max-w-2xl">
        <h1 className="text-xl font-semibold text-fg">นโยบายความเป็นส่วนตัว</h1>
        <Card className="mt-4">
          <CardContent className="flex flex-col gap-4 pt-5 text-sm leading-relaxed text-fg-muted">
            <div>
              <h2 className="text-sm font-medium text-fg">ข้อมูลที่เก็บ</h2>
              <p className="mt-1">
                เมื่อเข้าสู่ระบบด้วย Google เราเก็บเฉพาะ อีเมล ชื่อแสดงผล และรูปโปรไฟล์ที่ Google ให้มา
                รวมถึงรายการติดตาม (watchlist) และประวัติการใช้งานบทวิเคราะห์ AI ของบัญชีคุณ
                เราไม่เก็บเลขบัญชีธนาคาร ข้อมูลโบรกเกอร์ หรือยอดพอร์ตการลงทุนจริงของคุณ
              </p>
            </div>
            <div>
              <h2 className="text-sm font-medium text-fg">ใช้ข้อมูลไปทำอะไร</h2>
              <p className="mt-1">
                ใช้เพื่อผูกรายการติดตามและประวัติการใช้งานกับบัญชีของคุณ, จำกัดโควตาการสร้างบทวิเคราะห์ AI ต่อผู้ใช้
                (กันการใช้เกินและควบคุมต้นทุน), และแสดงผลสรุปการใช้งาน/ค่าใช้จ่ายที่หน้า &ldquo;การใช้งาน AI&rdquo;
                ข้อมูลบัญชีผู้ใช้จะไม่ถูกส่งเข้า prompt ของ AI โดยไม่จำเป็น
              </p>
            </div>
            <div>
              <h2 className="text-sm font-medium text-fg">แชร์กับใคร</h2>
              <p className="mt-1">
                เนื้อหาสัญลักษณ์ที่คุณขอบทวิเคราะห์ (ไม่รวมข้อมูลระบุตัวตน) ถูกส่งไปยัง Anthropic (ผู้ให้บริการ Claude API)
                เพื่อประมวลผล เราไม่ขายหรือแชร์ข้อมูลส่วนบุคคลของคุณให้บุคคลที่สามเพื่อการตลาด
              </p>
            </div>
            <div>
              <h2 className="text-sm font-medium text-fg">เก็บนานเท่าไร</h2>
              <p className="mt-1">
                ข้อมูลบัญชีและรายการติดตามเก็บไว้ตราบเท่าที่บัญชียังใช้งานอยู่ ประวัติการใช้งาน AI เก็บไว้เพื่อ
                ตรวจสอบย้อนหลังและควบคุมโควตา
              </p>
            </div>
            <div>
              <h2 className="text-sm font-medium text-fg">คุกกี้</h2>
              <p className="mt-1">
                ใช้คุกกี้เท่าที่จำเป็นสำหรับ session การเข้าสู่ระบบเท่านั้น ไม่มีคุกกี้ติดตามเพื่อการโฆษณา
              </p>
            </div>
            <div>
              <h2 className="text-sm font-medium text-fg">สิทธิของคุณ</h2>
              <p className="mt-1">
                คุณสามารถขอลบบัญชีและข้อมูลที่เกี่ยวข้องทั้งหมดได้ทุกเมื่อ โดยข้อมูลจะถูกลบจริงภายใน 30 วันหลังได้รับคำขอ
                ติดต่อขอลบบัญชีหรือสอบถามสิทธิของเจ้าของข้อมูลได้ที่{" "}
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
