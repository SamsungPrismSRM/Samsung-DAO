import { db } from "./db";

export async function createSession(userId: string): Promise<string> {
  const array = new Uint8Array(32);
  for (let i = 0; i < 32; i++) array[i] = Math.floor(Math.random() * 256);
  const token = Array.from(array).map(b => b.toString(16).padStart(2, "0")).join("");
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await db.session.create({ data: { userId, token, expiresAt } });
  return token;
}

export async function destroySession(token: string) {
  await db.session.delete({ where: { token } }).catch(() => { });
}

export async function getSession() {
  const { cookies } = await import("next/headers");
  const cookieStore = cookies();
  const token = cookieStore.get("session_token")?.value;
  if (!token) return null;
  const session = await db.session.findUnique({
    where: { token }, include: { user: true },
  });
  if (!session || session.expiresAt < new Date()) {
    if (session) await db.session.delete({ where: { id: session.id } }).catch(() => { });
    return null;
  }
  return session.user;
}

export async function requireAuth() {
  const { redirect } = await import("next/navigation");
  const user = await getSession();
  if (!user) redirect("/auth/login");
  return user;
}

export async function requireRole(role: "ADMIN" | "COUNCIL" | "MEMBER") {
  const { redirect } = await import("next/navigation");
  const user = await getSession();
  if (!user || user.role !== role) redirect("/auth/login");
  return user;
}