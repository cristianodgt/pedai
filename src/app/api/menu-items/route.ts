import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getAuthUser } from "@/lib/auth";

export async function POST(request: Request) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await request.json();
  const { categoryId, name, description, price, channels, options, image } = body;

  if (!categoryId || !name?.trim() || price === undefined) {
    return NextResponse.json(
      { error: "categoryId, name e price são obrigatórios" },
      { status: 400 }
    );
  }

  // Get max order
  const { data: maxRow } = await supabaseAdmin
    .from("menu_items")
    .select("order")
    .eq("category_id", categoryId)
    .order("order", { ascending: false })
    .limit(1)
    .single();

  const nextOrder = (maxRow?.order ?? -1) + 1;

  const { data: item, error } = await supabaseAdmin
    .from("menu_items")
    .insert({
      tenant_id: user.tenant_id,
      category_id: categoryId,
      name: name.trim(),
      description: description?.trim() || null,
      price,
      channels: channels || ["WHATSAPP", "PDV"],
      options: options || null,
      image: image || null,
      order: nextOrder,
    })
    .select()
    .single();

  if (error) {
    console.error("Create item error:", error);
    return NextResponse.json({ error: "Erro ao criar item" }, { status: 500 });
  }

  return NextResponse.json({ item }, { status: 201 });
}
