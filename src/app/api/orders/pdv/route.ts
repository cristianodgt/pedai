import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getAuthUser } from "@/lib/auth";

export async function POST(request: Request) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
  }

  try {
    const { type, paymentMethod, customerName, items } = await request.json();

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: "Adicione itens ao pedido" },
        { status: 400 }
      );
    }

    const subtotal = items.reduce(
      (sum: number, item: { total: number }) => sum + item.total,
      0
    );

    // Generate order code
    const { count } = await supabaseAdmin
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", user.tenant_id);

    const code = `#PED${String((count || 0) + 1).padStart(6, "0")}`;

    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .insert({
        tenant_id: user.tenant_id,
        code,
        channel: "PDV",
        type: type || "DINE_IN",
        status: "PENDING",
        customer_name: customerName || null,
        payment_method: paymentMethod || null,
        subtotal,
        total: subtotal,
        operator_id: user.id,
      })
      .select()
      .single();

    if (orderError) {
      console.error("PDV create order error:", orderError);
      return NextResponse.json({ error: "Erro ao criar pedido" }, { status: 500 });
    }

    const orderItems = items.map(
      (item: { name: string; quantity: number; unitPrice: number; total: number }) => ({
        order_id: order.id,
        name: item.name,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        total: item.total,
      })
    );

    await supabaseAdmin.from("order_items").insert(orderItems);

    const { data: fullOrder } = await supabaseAdmin
      .from("orders")
      .select("*, order_items(*)")
      .eq("id", order.id)
      .single();

    return NextResponse.json({ order: fullOrder }, { status: 201 });
  } catch (error) {
    console.error("PDV order error:", error);
    return NextResponse.json({ error: "Erro ao criar pedido" }, { status: 500 });
  }
}
