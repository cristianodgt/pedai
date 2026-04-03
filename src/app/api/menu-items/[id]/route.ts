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
  const body = await request.json();

  const updateData: Record<string, unknown> = {};
  if (body.name !== undefined) updateData.name = body.name.trim();
  if (body.description !== undefined) updateData.description = body.description?.trim() || null;
  if (body.price !== undefined) updateData.price = body.price;
  if (body.available !== undefined) updateData.available = body.available;
  if (body.channels !== undefined) updateData.channels = body.channels;
  if (body.options !== undefined) updateData.options = body.options;
  if (body.categoryId !== undefined) updateData.category_id = body.categoryId;
  if (body.order !== undefined) updateData.order = body.order;

  const { data: item, error } = await supabaseAdmin
    .from("menu_items")
    .update(updateData)
    .eq("id", id)
    .eq("tenant_id", user.tenant_id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "Item não encontrado" }, { status: 404 });
  }

  return NextResponse.json({ item });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;

  const { error } = await supabaseAdmin
    .from("menu_items")
    .delete()
    .eq("id", id)
    .eq("tenant_id", user.tenant_id);

  if (error) {
    return NextResponse.json({ error: "Erro ao excluir" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
