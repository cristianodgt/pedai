import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

// Temporary endpoint to create conversations table
// DELETE THIS AFTER RUNNING ONCE
const prisma = new PrismaClient();

export async function POST(request: Request) {
  const secret = request.headers.get("x-setup-key");
  if (secret !== "pedai-setup-2024") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Check if table already exists
    const exists = await prisma.$queryRawUnsafe<{ exists: boolean }[]>(
      `SELECT EXISTS (SELECT FROM pg_tables WHERE tablename = 'conversations') as exists`
    );

    if (exists[0]?.exists) {
      return NextResponse.json({ message: "Table already exists", status: "ok" });
    }

    // Create conversations table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE conversations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id TEXT NOT NULL,
        session_id TEXT,
        customer_phone TEXT,
        customer_name TEXT,
        channel TEXT DEFAULT 'WHATSAPP',
        messages JSONB DEFAULT '[]'::jsonb,
        status TEXT DEFAULT 'active',
        last_message_at TIMESTAMPTZ DEFAULT now(),
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
      )
    `);

    await prisma.$executeRawUnsafe(`CREATE INDEX idx_conversations_tenant ON conversations(tenant_id)`);
    await prisma.$executeRawUnsafe(`CREATE INDEX idx_conversations_phone ON conversations(customer_phone)`);
    await prisma.$executeRawUnsafe(`CREATE INDEX idx_conversations_last_msg ON conversations(last_message_at DESC)`);

    return NextResponse.json({ message: "Table created successfully", status: "created" });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
