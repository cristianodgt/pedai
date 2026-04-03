import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getAuthUser } from "@/lib/auth";

export async function GET(request: Request) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
  }

  const tenantId = user.tenant_id;
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay()).toISOString();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  // All orders today
  const { data: todayOrders } = await supabaseAdmin
    .from("orders")
    .select("id, channel, status, total, created_at, payment_method")
    .eq("tenant_id", tenantId)
    .gte("created_at", todayStart);

  // All orders this week
  const { data: weekOrders } = await supabaseAdmin
    .from("orders")
    .select("id, total, created_at")
    .eq("tenant_id", tenantId)
    .gte("created_at", weekStart)
    .not("status", "eq", "CANCELLED");

  // All orders this month
  const { data: monthOrders } = await supabaseAdmin
    .from("orders")
    .select("id, total, created_at")
    .eq("tenant_id", tenantId)
    .gte("created_at", monthStart)
    .not("status", "eq", "CANCELLED");

  // Top selling items this month
  const { data: monthItems } = await supabaseAdmin
    .from("order_items")
    .select("name, quantity, total, orders!inner(tenant_id, created_at, status)")
    .eq("orders.tenant_id", tenantId)
    .gte("orders.created_at", monthStart)
    .not("orders.status", "eq", "CANCELLED");

  // Aggregate today stats
  const today = todayOrders || [];
  const todayActive = today.filter((o) => o.status !== "CANCELLED");
  const todayRevenue = todayActive.reduce((s, o) => s + parseFloat(o.total || "0"), 0);
  const todayByChannel = {
    WHATSAPP: today.filter((o) => o.channel === "WHATSAPP").length,
    PDV: today.filter((o) => o.channel === "PDV").length,
    IFOOD: today.filter((o) => o.channel === "IFOOD").length,
  };
  const todayByStatus = {
    PENDING: today.filter((o) => o.status === "PENDING").length,
    PREPARING: today.filter((o) => o.status === "PREPARING").length,
    READY: today.filter((o) => o.status === "READY").length,
    DELIVERED: today.filter((o) => o.status === "DELIVERED").length,
    CANCELLED: today.filter((o) => o.status === "CANCELLED").length,
  };
  const todayByPayment: Record<string, number> = {};
  todayActive.forEach((o) => {
    const pm = o.payment_method || "nao_informado";
    todayByPayment[pm] = (todayByPayment[pm] || 0) + 1;
  });

  // Week/month revenue
  const weekRevenue = (weekOrders || []).reduce((s, o) => s + parseFloat(o.total || "0"), 0);
  const monthRevenue = (monthOrders || []).reduce((s, o) => s + parseFloat(o.total || "0"), 0);

  // Ticket medio
  const ticketMedio = todayActive.length > 0 ? todayRevenue / todayActive.length : 0;

  // Orders by hour (today)
  const ordersByHour: number[] = new Array(24).fill(0);
  today.forEach((o) => {
    const hour = new Date(o.created_at).getHours();
    ordersByHour[hour]++;
  });

  // Top products
  const productMap: Record<string, { name: string; qty: number; revenue: number }> = {};
  (monthItems || []).forEach((item) => {
    const key = item.name;
    if (!productMap[key]) {
      productMap[key] = { name: key, qty: 0, revenue: 0 };
    }
    productMap[key].qty += item.quantity;
    productMap[key].revenue += parseFloat(item.total || "0");
  });
  const topProducts = Object.values(productMap)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 10);

  return NextResponse.json({
    today: {
      total: today.length,
      active: todayActive.length,
      revenue: todayRevenue,
      ticketMedio,
      byChannel: todayByChannel,
      byStatus: todayByStatus,
      byPayment: todayByPayment,
      byHour: ordersByHour,
    },
    week: {
      total: (weekOrders || []).length,
      revenue: weekRevenue,
    },
    month: {
      total: (monthOrders || []).length,
      revenue: monthRevenue,
    },
    topProducts,
  });
}
