import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getAuthUser } from "@/lib/auth";

export async function GET(request: Request) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { data: categories } = await supabaseAdmin
    .from("menu_categories")
    .select("*, menu_items(*)")
    .eq("tenant_id", user.tenant_id)
    .order("order", { ascending: true });

  // Sort items within each category
  const result = (categories || []).map((cat) => ({
    ...cat,
    items: (cat.menu_items || []).sort(
      (a: { order: number }, b: { order: number }) => a.order - b.order
    ),
    menu_items: undefined,
  }));

  return NextResponse.json({ categories: result });
}

export async function POST(request: Request) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { name } = await request.json();
  if (!name?.trim()) {
    return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 });
  }

  // Get max order
  const { data: maxRow } = await supabaseAdmin
    .from("menu_categories")
    .select("order")
    .eq("tenant_id", user.tenant_id)
    .order("order", { ascending: false })
    .limit(1)
    .single();

  const nextOrder = (maxRow?.order ?? -1) + 1;

  const { data: category, error } = await supabaseAdmin
    .from("menu_categories")
    .insert({
      tenant_id: user.tenant_id,
      name: name.trim(),
      order: nextOrder,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "Erro ao criar categoria" }, { status: 500 });
  }

  return NextResponse.json({ category }, { status: 201 });
}
