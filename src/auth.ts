import { randomBytes } from "node:crypto";
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { getDb, schema } from "@/lib/db";
import { env, isAuthConfigured } from "@/lib/config/env";

// NextAuth ต้องมี secret เสมอแม้ยังไม่ตั้งค่า provider ใด ๆ — ถ้าไม่ได้ตั้ง NEXTAUTH_SECRET
// ให้ gen แบบสุ่มตอน process start แทน (login จริงใช้ไม่ได้อยู่แล้วถ้าไม่มี provider — กันแค่ error spam ตอน dev)
const secret = env.NEXTAUTH_SECRET ?? randomBytes(32).toString("hex");

// session แบบ JWT ล้วน (ไม่ใช้ NextAuth DB adapter) — upsert ลง users เองใน signIn callback
// login ผูกกับ POST /api/v1/analysis/[symbol]/generate (CLAUDE.md ข้อ 9) และ /api/v1/watchlist
export const { handlers, auth, signIn, signOut } = NextAuth({
  secret,
  providers: isAuthConfigured()
    ? [Google({ clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET })]
    : [],
  session: { strategy: "jwt" },
  callbacks: {
    async signIn({ user, profile }) {
      const db = getDb();
      const googleId = profile?.sub;
      if (!db || !googleId || !user.email) return true; // ไม่มี DB ก็ยัง login ได้ (เก็บใน JWT อย่างเดียว)

      await db
        .insert(schema.users)
        .values({ id: googleId, email: user.email, name: user.name ?? null, image: user.image ?? null })
        .onConflictDoUpdate({
          target: schema.users.id,
          set: { email: user.email, name: user.name ?? null, image: user.image ?? null },
        });

      return true;
    },
    async jwt({ token, profile }) {
      if (profile?.sub) token.userId = profile.sub;
      return token;
    },
    async session({ session, token }) {
      if (token.userId && typeof token.userId === "string") {
        session.user.id = token.userId;
      }
      return session;
    },
  },
  pages: { signIn: "/login" },
});
