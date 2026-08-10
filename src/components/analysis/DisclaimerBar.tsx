import { Sparkles } from "lucide-react";

// ข้อความตรงตาม docs/10-COMPLIANCE.md §2 — ห้ามแก้เนื้อหาโดยไม่ตรวจ compliance
export function DisclaimerBar() {
  return (
    <div className="flex items-start gap-2 rounded-md border border-border-soft bg-surface-2 p-3">
      <Sparkles size={14} className="mt-0.5 shrink-0 text-accent" aria-hidden="true" />
      <p className="text-xs leading-relaxed text-fg-subtle">
        <span className="font-medium text-fg-muted">สร้างโดย AI</span> — ข้อมูลและบทวิเคราะห์นี้จัดทำโดยระบบอัตโนมัติเพื่อการศึกษาเท่านั้น
        ไม่ถือเป็นคำแนะนำการลงทุน การเสนอขาย หรือการชักชวนให้ซื้อขายหลักทรัพย์ใด ๆ ราคาอาจล่าช้าหรือคลาดเคลื่อน
        ผู้ใช้ควรตรวจสอบข้อมูลจากแหล่งต้นทางและปรึกษาผู้แนะนำการลงทุนที่ได้รับใบอนุญาตก่อนตัดสินใจ
        การลงทุนมีความเสี่ยง ผู้ลงทุนควรศึกษาข้อมูลก่อนตัดสินใจลงทุน
      </p>
    </div>
  );
}
