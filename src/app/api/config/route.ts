import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getAuthUser } from "@/lib/auth";

export async function GET(request: Request) {
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { data: tenant } = await supabaseAdmin
    .from("tenants")
    .select("id, name, slug, phone, address, timezone, settings")
    .eq("id", user.tenant_id)
    .single();

  return NextResponse.json({ tenant });
}

export async function PUT(request: Request) {
  const user = await getAuthUser(request);
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await request.json();
  const { name, phone, address, settings } = body;

  const updateData: Record<string, unknown> = {};
  if (name !== undefined) updateData.name = name;
  if (phone !== undefined) updateData.phone = phone;
  if (address !== undefined) updateData.address = address;
  if (settings !== undefined) updateData.settings = settings;

  const { data: tenant, error } = await supabaseAdmin
    .from("tenants")
    .update(updateData)
    .eq("id", user.tenant_id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: "Erro ao salvar" }, { status: 500 });

  return NextResponse.json({ tenant });
}
