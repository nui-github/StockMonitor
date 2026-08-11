import { WifiOff } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";

// service worker เสิร์ฟหน้านี้ตอน offline และ navigate ไม่สำเร็จ (ดู public/sw.js)
// ห้ามใส่ data fetching ที่นี่ — หน้านี้ต้อง render ได้โดยไม่พึ่ง network
export default function OfflinePage() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md items-center justify-center px-4">
      <EmptyState
        icon={WifiOff}
        title="ไม่มีการเชื่อมต่ออินเทอร์เน็ต"
        description="ราคาหุ้นและข้อมูลเรียลไทม์ต้องใช้อินเทอร์เน็ต กรุณาเชื่อมต่อแล้วลองใหม่"
      />
    </div>
  );
}
