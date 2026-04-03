import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function GET(request: Request) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const orders = await prisma.order.findMany({
    where: {
      tenantId: user.tenantId,
      status: { in: ["PENDING", "CONFIRMED", "PREPARING", "READY"] },
    },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ orders });
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

    const count = await prisma.order.count({ where: { tenantId } });
    const code = `#PED${String(count + 1).padStart(6, "0")}`;

    const order = await prisma.order.create({
      data: {
        tenantId,
        code,
        channel: channel || "WHATSAPP",
        type: type || "DELIVERY",
        status: "PENDING",
        customerName,
        customerPhone,
        address,
        neighborhood,
        complement,
        deliveryFee,
        distanceKm,
        paymentMethod,
        changeFor,
        subtotal,
        total,
        items: {
          create: items.map((item: { name: string; quantity: number; unitPrice: number; total: number; details?: unknown }) => ({
            name: item.name,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.total,
            details: item.details || undefined,
          })),
        },
      },
      include: { items: true },
    });

    return NextResponse.json({ order }, { status: 201 });
  } catch (error) {
    console.error("Create order error:", error);
    return NextResponse.json(
      { error: "Erro ao criar pedido" },
      { status: 500 }
    );
  }
}
