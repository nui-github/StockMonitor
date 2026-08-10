import type { Metadata } from "next";
import { auth } from "@/auth";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent } from "@/components/ui/Card";

export const metadata: Metadata = { title: "ข้อจำกัดความรับผิดชอบ" };

export default async function DisclaimerPage() {
  const session = await auth();

  return (
    <AppShell session={session}>
      <div className="mx-auto max-w-2xl">
        <h1 className="text-xl font-semibold text-fg">ข้อจำกัดความรับผิดชอบ</h1>
        <Card className="mt-4">
          <CardContent className="flex flex-col gap-4 pt-5 text-sm leading-relaxed text-fg-muted">
            <p>
              StockMonitor เป็นเครื่องมือรวบรวมข้อมูลและวิเคราะห์เพื่อการศึกษาเท่านั้น
              <strong className="text-fg"> ไม่ใช่ผู้แนะนำการลงทุน</strong> และไม่ได้ขึ้นทะเบียนเป็นผู้ประกอบธุรกิจหลักทรัพย์
              หรือที่ปรึกษาการลงทุนกับสำนักงานคณะกรรมการกำกับหลักทรัพย์และตลาดหลักทรัพย์ (ก.ล.ต.)
            </p>
            <p>
              ข้อมูลและบทวิเคราะห์บนเว็บไซต์นี้จัดทำโดยระบบอัตโนมัติเพื่อการศึกษาเท่านั้น
              ไม่ถือเป็นคำแนะนำการลงทุน การเสนอขาย หรือการชักชวนให้ซื้อขายหลักทรัพย์ใด ๆ
              ราคาอาจล่าช้าหรือคลาดเคลื่อน ผู้ใช้ควรตรวจสอบข้อมูลจากแหล่งต้นทางและ
              ปรึกษาผู้แนะนำการลงทุนที่ได้รับใบอนุญาตก่อนตัดสินใจ
              การลงทุนมีความเสี่ยง ผู้ลงทุนควรศึกษาข้อมูลก่อนตัดสินใจลงทุน
            </p>
            <div>
              <h2 className="text-sm font-medium text-fg">บทวิเคราะห์ที่สร้างโดย AI</h2>
              <p className="mt-1">
                ทุกบทวิเคราะห์มีป้าย &ldquo;สร้างโดย AI&rdquo; พร้อมเวลาที่สร้างกำกับไว้เสมอ
                นำเสนอในรูปแบบมุมมองฝั่งบวก ฝั่งลบ ความเสี่ยง และสิ่งที่ต้องติดตาม — ไม่มีคำแนะนำ &ldquo;ควรซื้อ&rdquo;
                &ldquo;ควรขาย&rdquo; หรือราคาเป้าหมายที่นำเสนอเป็นคำแนะนำ ทุกข้ออ้างอิงมาจากแหล่งข่าวที่ระบุที่มาชัดเจน
                และมีการแสดงระดับความมั่นใจ (confidence) กับช่องว่างของข้อมูล (dataGaps) กำกับไว้
                หากพบบทวิเคราะห์ที่ผิดพลาดร้ายแรง สามารถแจ้งผ่านช่องทางติดต่อด้านล่างเพื่อให้ทีมงานตรวจสอบและถอดออกได้
              </p>
            </div>
            <div>
              <h2 className="text-sm font-medium text-fg">ข้อมูลราคา</h2>
              <p className="mt-1">
                ราคาที่แสดงมาจากผู้ให้บริการข้อมูลภายนอก อาจมีความล่าช้าหรือคลาดเคลื่อนจากราคาจริงในตลาด
                เว็บไซต์นี้ไม่รับผิดชอบต่อความเสียหายใด ๆ ที่เกิดจากการใช้ข้อมูลบนเว็บไซต์นี้ในการตัดสินใจลงทุน
              </p>
            </div>
            <div>
              <h2 className="text-sm font-medium text-fg">ติดต่อ</h2>
              <p className="mt-1">
                พบข้อผิดพลาดหรือมีข้อสงสัย ติดต่อได้ที่{" "}
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
