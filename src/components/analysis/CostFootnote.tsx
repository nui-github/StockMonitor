function formatThb(value: number): string {
  return value.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatTimeTh(ts: number): string {
  return new Intl.DateTimeFormat("th-TH", { timeZone: "Asia/Bangkok", hour: "2-digit", minute: "2-digit" }).format(new Date(ts));
}

export function CostFootnote({ costThb, generatedAt, modelLabel }: { costThb: number; generatedAt: number; modelLabel: string }) {
  return (
    <p className="font-mono text-xs text-fg-subtle">
      ใช้ไป {formatThb(costThb)} ฿ • สร้างเมื่อ {formatTimeTh(generatedAt)} • โมเดล {modelLabel}
    </p>
  );
}
