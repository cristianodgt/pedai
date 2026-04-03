import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function GET(request: Request) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const categories = await prisma.menuCategory.findMany({
    where: { tenantId: user.tenantId },
    include: {
      items: { orderBy: { order: "asc" } },
    },
    orderBy: { order: "asc" },
  });

  return NextResponse.json({ categories });
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

  const maxOrder = await prisma.menuCategory.aggregate({
    where: { tenantId: user.tenantId },
    _max: { order: true },
  });

  const category = await prisma.menuCategory.create({
    data: {
      tenantId: user.tenantId,
      name: name.trim(),
      order: (maxOrder._max.order ?? -1) + 1,
    },
  });

  return NextResponse.json({ category }, { status: 201 });
}
