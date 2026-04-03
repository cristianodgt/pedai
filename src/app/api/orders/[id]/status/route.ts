import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getAuthUser } from "@/lib/auth";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const { status } = await request.json();

  const validStatuses = ["PENDING", "CONFIRMED", "PREPARING", "READY", "DELIVERED", "CANCELLED"];
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: "Status inválido" }, { status: 400 });
  }

  const timestampField: Record<string, string> = {
    CONFIRMED: "confirmed_at",
    PREPARING: "confirmed_at",
    DELIVERED: "delivered_at",
    CANCELLED: "cancelled_at",
    READY: "prepared_at",
  };

  const updateData: Record<string, unknown> = { status };
  const field = timestampField[status];
  if (field) {
    updateData[field] = new Date().toISOString();
  }

  const { data: order, error } = await supabaseAdmin
    .from("orders")
    .update(updateData)
    .eq("id", id)
    .eq("tenant_id", user.tenant_id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "Erro ao atualizar" }, { status: 500 });
  }

  return NextResponse.json({ order });
}
