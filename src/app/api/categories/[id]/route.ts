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
  if (body.active !== undefined) updateData.active = body.active;
  if (body.order !== undefined) updateData.order = body.order;

  const { data: category, error } = await supabaseAdmin
    .from("menu_categories")
    .update(updateData)
    .eq("id", id)
    .eq("tenant_id", user.tenant_id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "Categoria não encontrada" }, { status: 404 });
  }

  return NextResponse.json({ category });
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

  // Check for items
  const { count } = await supabaseAdmin
    .from("menu_items")
    .select("*", { count: "exact", head: true })
    .eq("category_id", id);

  if ((count || 0) > 0) {
    return NextResponse.json(
      { error: "Remova os itens da categoria antes de excluí-la" },
      { status: 400 }
    );
  }

  const { error } = await supabaseAdmin
    .from("menu_categories")
    .delete()
    .eq("id", id)
    .eq("tenant_id", user.tenant_id);

  if (error) {
    return NextResponse.json({ error: "Erro ao excluir" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
