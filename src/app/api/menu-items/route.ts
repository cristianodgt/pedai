import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function POST(request: Request) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await request.json();
  const { categoryId, name, description, price, channels, options } = body;

  if (!categoryId || !name?.trim() || price === undefined) {
    return NextResponse.json(
      { error: "categoryId, name e price são obrigatórios" },
      { status: 400 }
    );
  }

  const category = await prisma.menuCategory.findFirst({
    where: { id: categoryId, tenantId: user.tenantId },
  });

  if (!category) {
    return NextResponse.json({ error: "Categoria não encontrada" }, { status: 404 });
  }

  const maxOrder = await prisma.menuItem.aggregate({
    where: { categoryId },
    _max: { order: true },
  });

  const item = await prisma.menuItem.create({
    data: {
      tenantId: user.tenantId,
      categoryId,
      name: name.trim(),
      description: description?.trim() || null,
      price,
      channels: channels || ["WHATSAPP", "PDV"],
      options: options || undefined,
      order: (maxOrder._max.order ?? -1) + 1,
    },
  });

  return NextResponse.json({ item }, { status: 201 });
}
