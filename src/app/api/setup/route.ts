import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// Temporary endpoint to check if conversations table exists
export async function POST(request: Request) {
  const secret = request.headers.get("x-setup-key");
  if (secret !== "pedai-setup-2024") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { error } = await supabaseAdmin
    .from("conversations")
    .select("id")
    .limit(1);

  if (error) {
    return NextResponse.json({
      exists: false,
      error: error.message,
    });
  }

  return NextResponse.json({ exists: true, status: "ok" });
}
