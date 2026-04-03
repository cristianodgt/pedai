import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getAuthUser } from "@/lib/auth";

export async function GET(request: Request) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
  }

  const { data: tenant, error } = await supabaseAdmin
    .from("tenants")
    .select("*")
    .eq("id", user.tenant_id)
    .single();

  if (error || !tenant) {
    return NextResponse.json({ error: "Tenant nao encontrado" }, { status: 404 });
  }

  return NextResponse.json({ tenant });
}

export async function PUT(request: Request) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
  }

  const body = await request.json();

  const updateData: Record<string, unknown> = {};
  if (body.name !== undefined) updateData.name = body.name.trim();
  if (body.phone !== undefined) updateData.phone = body.phone?.trim() || null;
  if (body.address !== undefined) updateData.address = body.address?.trim() || null;
  if (body.timezone !== undefined) updateData.timezone = body.timezone;
  if (body.settings !== undefined) updateData.settings = body.settings;

  const { data: tenant, error } = await supabaseAdmin
    .from("tenants")
    .update(updateData)
    .eq("id", user.tenant_id)
    .select()
    .single();

  if (error) {
    console.error("Update tenant error:", error);
    return NextResponse.json({ error: "Erro ao atualizar" }, { status: 500 });
  }

  return NextResponse.json({ tenant });
}
