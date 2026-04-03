import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { verifyPassword, signToken } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email e senha são obrigatórios" },
        { status: 400 }
      );
    }

    const { data: user, error: dbError } = await supabaseAdmin
      .from("users")
      .select("*, tenants(*)")
      .eq("email", email)
      .single();

    if (dbError || !user || !user.active) {
      return NextResponse.json(
        { error: "Credenciais inválidas" },
        { status: 401 }
      );
    }

    const valid = await verifyPassword(password, user.password);
    if (!valid) {
      return NextResponse.json(
        { error: "Credenciais inválidas" },
        { status: 401 }
      );
    }

    const token = signToken({
      userId: user.id,
      tenantId: user.tenant_id,
      role: user.role,
    });

    const response = NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        tenant: user.tenants?.name,
      },
    });

    response.cookies.set("pedai_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return response;
  } catch (error) {
    const err = error instanceof Error ? error.message : String(error);
    console.error("Login error:", err);
    return NextResponse.json(
      { error: "Erro interno", detail: err },
      { status: 500 }
    );
  }
}
