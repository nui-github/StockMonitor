import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import importPlugin from "eslint-plugin-import";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

// กฎ layer จาก CLAUDE.md ข้อ 1:
//   app/ , components/ , hooks/  →  lib/services/  →  lib/providers/  →  vendor
//   - component ห้าม import lib/providers/* หรือ lib/db/* ตรง ๆ
//   - lib/providers/* ห้าม import React
const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    plugins: { import: importPlugin },
    rules: {
      "import/no-restricted-paths": [
        "error",
        {
          zones: [
            {
              target: ["./src/app/**", "./src/components/**", "./src/hooks/**"],
              from: ["./src/lib/providers/**", "./src/lib/db/**"],
              message:
                "ห้าม import lib/providers/* หรือ lib/db/* ตรง ๆ จาก UI — ให้ผ่าน lib/services/* เท่านั้น (CLAUDE.md ข้อ 1)",
            },
            {
              target: ["./src/lib/providers/**"],
              from: ["./src/components/**", "react", "react-dom"],
              message: "lib/providers/* ห้าม import React (CLAUDE.md ข้อ 1)",
            },
          ],
        },
      ],
    },
  },
  {
    ignores: [".next/**", "out/**", "build/**", "next-env.d.ts"],
  },
];

export default eslintConfig;
