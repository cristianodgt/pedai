import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { supabaseAdmin } from "./supabase";

const JWT_SECRET = process.env.JWT_SECRET || "pedai-secret-change-me";

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function signToken(payload: { userId: string; tenantId: string; role: string }) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET) as {
      userId: string;
      tenantId: string;
      role: string;
    };
  } catch {
    return null;
  }
}

export async function getAuthUser(request: Request) {
  const cookie = request.headers.get("cookie") || "";
  const match = cookie.match(/pedai_token=([^;]+)/);
  if (!match) return null;

  const decoded = verifyToken(match[1]);
  if (!decoded) return null;

  const { data: user } = await supabaseAdmin
    .from("users")
    .select("*, tenants(*)")
    .eq("id", decoded.userId)
    .single();

  return user;
}
