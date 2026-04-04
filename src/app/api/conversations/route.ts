import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getAuthUser } from "@/lib/auth";

// GET - List conversations for tenant
export async function GET(request: Request) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
  }

  const url = new URL(request.url);
  const status = url.searchParams.get("status") || "";
  const search = url.searchParams.get("search") || "";
  const limit = parseInt(url.searchParams.get("limit") || "50");
  const offset = parseInt(url.searchParams.get("offset") || "0");

  let query = supabaseAdmin
    .from("conversations")
    .select("*", { count: "exact" })
    .eq("tenant_id", user.tenant_id)
    .order("last_message_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) {
    query = query.eq("status", status);
  }

  if (search) {
    query = query.or(
      `customer_name.ilike.%${search}%,customer_phone.ilike.%${search}%`
    );
  }

  const { data, count, error } = await query;

  if (error) {
    // Table might not exist yet
    if (error.message?.includes("relation") && error.message?.includes("does not exist")) {
      return NextResponse.json({ conversations: [], total: 0 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    conversations: data || [],
    total: count || 0,
  });
}

// POST - Log a message (called by n8n workflow)
export async function POST(request: Request) {
  // Auth via API key header OR cookie
  const apiKey = request.headers.get("x-api-key");
  const isApiAuth = apiKey === process.env.PEDAI_API_KEY;

  let tenantId: string;

  if (isApiAuth) {
    const body = await request.json();
    tenantId = body.tenant_id;

    if (!tenantId) {
      return NextResponse.json({ error: "tenant_id obrigatorio" }, { status: 400 });
    }

    const {
      session_id,
      customer_phone,
      customer_name,
      message_type,
      content,
      channel = "WHATSAPP",
    } = body;

    if (!content) {
      return NextResponse.json({ error: "content obrigatorio" }, { status: 400 });
    }

    const newMessage = {
      type: message_type || "text",
      content,
      sender: body.sender || "customer",
      timestamp: new Date().toISOString(),
    };

    // Try to find existing conversation by session_id or phone
    let conversation = null;

    if (session_id) {
      const { data } = await supabaseAdmin
        .from("conversations")
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("session_id", session_id)
        .eq("status", "active")
        .single();
      conversation = data;
    }

    if (!conversation && customer_phone) {
      const { data } = await supabaseAdmin
        .from("conversations")
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("customer_phone", customer_phone)
        .eq("status", "active")
        .order("last_message_at", { ascending: false })
        .limit(1)
        .single();
      conversation = data;
    }

    if (conversation) {
      // Append message to existing conversation
      const messages = [...(conversation.messages || []), newMessage];
      const { error } = await supabaseAdmin
        .from("conversations")
        .update({
          messages,
          customer_name: customer_name || conversation.customer_name,
          last_message_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", conversation.id);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ id: conversation.id, action: "updated" });
    } else {
      // Create new conversation
      const { data, error } = await supabaseAdmin
        .from("conversations")
        .insert({
          tenant_id: tenantId,
          session_id,
          customer_phone,
          customer_name,
          channel,
          messages: [newMessage],
          status: "active",
          last_message_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ id: data.id, action: "created" });
    }
  } else {
    // Cookie auth (admin user)
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }
    return NextResponse.json({ error: "Use x-api-key para logar mensagens" }, { status: 400 });
  }
}
