import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
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
    CONFIRMED: "confirmedAt",
    PREPARING: "confirmedAt",
    DELIVERED: "deliveredAt",
    CANCELLED: "cancelledAt",
    READY: "preparedAt",
  };

  const updateData: Record<string, unknown> = { status };
  const field = timestampField[status];
  if (field) {
    updateData[field] = new Date();
  }

  const order = await prisma.order.update({
    where: { id, tenantId: user.tenantId },
    data: updateData,
  });

  return NextResponse.json({ order });
}
