import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const { tenantId } = await params;

  const { data: tenant, error } = await supabaseAdmin
    .from("tenants")
    .select("id, name, slug, phone, address, timezone, settings")
    .eq("id", tenantId)
    .single();

  if (error || !tenant) {
    return NextResponse.json({ error: "Tenant não encontrado" }, { status: 404 });
  }

  return NextResponse.json({ tenant });
}
