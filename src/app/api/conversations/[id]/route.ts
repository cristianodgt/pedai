import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getAuthUser } from "@/lib/auth";

// GET - Single conversation with messages
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
  }

  const { id } = await params;

  const { data, error } = await supabaseAdmin
    .from("conversations")
    .select("*")
    .eq("id", id)
    .eq("tenant_id", user.tenant_id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Conversa nao encontrada" }, { status: 404 });
  }

  return NextResponse.json(data);
}

// PATCH - Update conversation (close, change name, etc.)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();

  const allowed = ["status", "customer_name"];
  const updates: Record<string, string> = {};
  for (const key of allowed) {
    if (body[key] !== undefined) {
      updates[key] = body[key];
    }
  }
  updates.updated_at = new Date().toISOString();

  const { error } = await supabaseAdmin
    .from("conversations")
    .update(updates)
    .eq("id", id)
    .eq("tenant_id", user.tenant_id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
