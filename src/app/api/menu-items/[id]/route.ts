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
  const body = await request.json();

  const item = await prisma.menuItem.findFirst({
    where: { id, tenantId: user.tenantId },
  });

  if (!item) {
    return NextResponse.json({ error: "Item não encontrado" }, { status: 404 });
  }

  const updated = await prisma.menuItem.update({
    where: { id },
    data: {
      ...(body.name !== undefined && { name: body.name.trim() }),
      ...(body.description !== undefined && { description: body.description?.trim() || null }),
      ...(body.price !== undefined && { price: body.price }),
      ...(body.available !== undefined && { available: body.available }),
      ...(body.channels !== undefined && { channels: body.channels }),
      ...(body.options !== undefined && { options: body.options }),
      ...(body.categoryId !== undefined && { categoryId: body.categoryId }),
      ...(body.order !== undefined && { order: body.order }),
    },
  });

  return NextResponse.json({ item: updated });
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

  const item = await prisma.menuItem.findFirst({
    where: { id, tenantId: user.tenantId },
  });

  if (!item) {
    return NextResponse.json({ error: "Item não encontrado" }, { status: 404 });
  }

  await prisma.menuItem.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
