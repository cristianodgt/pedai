import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// Temporary endpoint to create conversations table
// DELETE THIS AFTER RUNNING ONCE
export async function POST(request: Request) {
  const secret = request.headers.get("x-setup-key");
  if (secret !== "pedai-setup-2024") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Use raw SQL via Supabase rpc - if not available, try direct insert to test
  // First check if table exists
  const { error: checkError } = await supabaseAdmin
    .from("conversations")
    .select("id")
    .limit(1);

  if (checkError && checkError.message?.includes("does not exist")) {
    // Table doesn't exist - we need to create it via Supabase Dashboard SQL editor
    return NextResponse.json({
      error: "Table does not exist. Run this SQL in Supabase Dashboard > SQL Editor:",
      sql: `CREATE TABLE conversations (
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
);
CREATE INDEX idx_conversations_tenant ON conversations(tenant_id);
CREATE INDEX idx_conversations_phone ON conversations(customer_phone);
CREATE INDEX idx_conversations_last_msg ON conversations(last_message_at DESC);`,
    });
  }

  return NextResponse.json({ message: "Table already exists", status: "ok" });
}
