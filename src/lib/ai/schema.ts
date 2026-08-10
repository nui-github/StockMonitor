import { z } from "zod";

// ตรงตาม docs/05-AI-PIPELINE.md §4 — ห้ามแก้ shape โดยไม่อัปเดต schemaVersion
export const REPORT_SCHEMA_VERSION = 1;

export const ReportSchema = z.object({
  headline: z.string(),
  summaryTh: z.string(),
  sentiment: z.number().min(-1).max(1),
  sentimentLabel: z.enum(["very_bearish", "bearish", "neutral", "bullish", "very_bullish"]),
  keyDrivers: z
    .array(
      z.object({
        title: z.string(),
        detail: z.string(),
        impact: z.enum(["high", "medium", "low"]),
        direction: z.enum(["positive", "negative", "mixed"]),
        sourceIds: z.array(z.string()).min(1),
      }),
    )
    .max(6),
  bullCase: z.array(z.object({ point: z.string(), sourceIds: z.array(z.string()) })).max(5),
  bearCase: z.array(z.object({ point: z.string(), sourceIds: z.array(z.string()) })).max(5),
  technical: z.object({
    trend: z.enum(["uptrend", "downtrend", "sideways"]),
    momentum: z.enum(["strong", "moderate", "weak"]),
    supports: z.array(z.number()).max(3),
    resistances: z.array(z.number()).max(3),
    signals: z
      .array(
        z.object({
          indicator: z.string(),
          reading: z.string(),
          interpretation: z.string(),
        }),
      )
      .max(8),
    note: z.string(),
  }),
  risks: z.array(z.string()).max(5),
  watchNext: z.array(z.string()).max(5),
  confidence: z.number().min(0).max(1),
  dataGaps: z.array(z.string()),
});

export type Report = z.infer<typeof ReportSchema>;

// JSON Schema เขียนมือให้ตรงกับ ReportSchema ข้างบน — ใช้กับ output_config.format (structured output)
// (ไม่ใช้ zod-to-json-schema helper เพื่อเลี่ยงปัญหาความเข้ากันได้ของเวอร์ชัน zod v4 กับ SDK)
export const REPORT_JSON_SCHEMA = {
  type: "object",
  properties: {
    headline: { type: "string" },
    summaryTh: { type: "string" },
    sentiment: { type: "number" },
    sentimentLabel: { type: "string", enum: ["very_bearish", "bearish", "neutral", "bullish", "very_bullish"] },
    keyDrivers: {
      type: "array",
      maxItems: 6,
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          detail: { type: "string" },
          impact: { type: "string", enum: ["high", "medium", "low"] },
          direction: { type: "string", enum: ["positive", "negative", "mixed"] },
          sourceIds: { type: "array", items: { type: "string" } },
        },
        required: ["title", "detail", "impact", "direction", "sourceIds"],
        additionalProperties: false,
      },
    },
    bullCase: {
      type: "array",
      maxItems: 5,
      items: {
        type: "object",
        properties: { point: { type: "string" }, sourceIds: { type: "array", items: { type: "string" } } },
        required: ["point", "sourceIds"],
        additionalProperties: false,
      },
    },
    bearCase: {
      type: "array",
      maxItems: 5,
      items: {
        type: "object",
        properties: { point: { type: "string" }, sourceIds: { type: "array", items: { type: "string" } } },
        required: ["point", "sourceIds"],
        additionalProperties: false,
      },
    },
    technical: {
      type: "object",
      properties: {
        trend: { type: "string", enum: ["uptrend", "downtrend", "sideways"] },
        momentum: { type: "string", enum: ["strong", "moderate", "weak"] },
        supports: { type: "array", maxItems: 3, items: { type: "number" } },
        resistances: { type: "array", maxItems: 3, items: { type: "number" } },
        signals: {
          type: "array",
          maxItems: 8,
          items: {
            type: "object",
            properties: {
              indicator: { type: "string" },
              reading: { type: "string" },
              interpretation: { type: "string" },
            },
            required: ["indicator", "reading", "interpretation"],
            additionalProperties: false,
          },
        },
        note: { type: "string" },
      },
      required: ["trend", "momentum", "supports", "resistances", "signals", "note"],
      additionalProperties: false,
    },
    risks: { type: "array", maxItems: 5, items: { type: "string" } },
    watchNext: { type: "array", maxItems: 5, items: { type: "string" } },
    confidence: { type: "number" },
    dataGaps: { type: "array", items: { type: "string" } },
  },
  required: [
    "headline",
    "summaryTh",
    "sentiment",
    "sentimentLabel",
    "keyDrivers",
    "bullCase",
    "bearCase",
    "technical",
    "risks",
    "watchNext",
    "confidence",
    "dataGaps",
  ],
  additionalProperties: false,
} as const;
