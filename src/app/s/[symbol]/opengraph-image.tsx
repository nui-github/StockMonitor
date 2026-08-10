import { ImageResponse } from "next/og";
import { getInstrument } from "@/lib/services/instruments";
import { siteConfig } from "@/lib/config/site";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params;
  const instrument = await getInstrument(symbol);
  const upper = symbol.toUpperCase();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          backgroundColor: "#0a0b0f",
          color: "#f5f6f8",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", fontSize: 28, color: "#7c8591", letterSpacing: 2 }}>{siteConfig.name}</div>
        <div style={{ display: "flex", fontSize: 96, fontWeight: 700, marginTop: 24 }}>{upper}</div>
        <div style={{ display: "flex", fontSize: 36, color: "#a3adba", marginTop: 12 }}>
          {instrument?.nameTh ?? instrument?.name ?? "ราคาและบทวิเคราะห์"}
        </div>
        <div style={{ display: "flex", fontSize: 24, color: "#5b6472", marginTop: 48 }}>
          ราคาเรียลไทม์ · กราฟ · บทวิเคราะห์ AI ภาษาไทย
        </div>
      </div>
    ),
    { ...size },
  );
}
