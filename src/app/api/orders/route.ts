import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getAuthUser } from "@/lib/auth";

export async function GET(request: Request) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { data: orders } = await supabaseAdmin
    .from("orders")
    .select("*, order_items(*)")
    .eq("tenant_id", user.tenant_id)
    .in("status", ["PENDING", "CONFIRMED", "PREPARING", "READY"])
    .order("created_at", { ascending: false });

  return NextResponse.json({ orders: orders || [] });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      tenantId,
      channel,
      type,
      customerName,
      customerPhone,
      address,
      neighborhood,
      complement,
      deliveryFee,
      distanceKm,
      paymentMethod,
      changeFor,
      items,
    } = body;

    if (!tenantId || !items || items.length === 0) {
      return NextResponse.json(
        { error: "tenantId e items são obrigatórios" },
        { status: 400 }
      );
    }

    const subtotal = items.reduce(
      (sum: number, item: { total: number }) => sum + item.total,
      0
    );
    const total = subtotal + (deliveryFee || 0);

    const { count } = await supabaseAdmin
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", tenantId);

    const code = `#PED${String((count || 0) + 1).padStart(6, "0")}`;

    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .insert({
        tenant_id: tenantId,
        code,
        channel: channel || "WHATSAPP",
        type: type || "DELIVERY",
        status: "PENDING",
        customer_name: customerName,
        customer_phone: customerPhone,
        address,
        neighborhood,
        complement,
        delivery_fee: deliveryFee,
        distance_km: distanceKm,
        payment_method: paymentMethod,
        change_for: changeFor,
        subtotal,
        total,
      })
      .select()
      .single();

    if (orderError) {
      console.error("Create order error:", orderError);
      return NextResponse.json({ error: "Erro ao criar pedido" }, { status: 500 });
    }

    const orderItems = items.map((item: { name: string; quantity: number; unitPrice: number; total: number; details?: unknown }) => ({
      order_id: order.id,
      name: item.name,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      total: item.total,
      details: item.details || null,
    }));

    await supabaseAdmin.from("order_items").insert(orderItems);

    const { data: fullOrder } = await supabaseAdmin
      .from("orders")
      .select("*, order_items(*)")
      .eq("id", order.id)
      .single();

    return NextResponse.json({ order: fullOrder }, { status: 201 });
  } catch (error) {
    console.error("Create order error:", error);
    return NextResponse.json(
      { error: "Erro ao criar pedido" },
      { status: 500 }
    );
  }
}
