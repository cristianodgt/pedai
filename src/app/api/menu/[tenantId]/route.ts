import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const { tenantId } = await params;

  const { data: categories } = await supabaseAdmin
    .from("menu_categories")
    .select("*, menu_items(*)")
    .eq("tenant_id", tenantId)
    .eq("active", true)
    .order("order", { ascending: true });

  // Filter available items and sort them
  const result = (categories || []).map((cat) => ({
    ...cat,
    menu_items: (cat.menu_items || [])
      .filter((item: { available: boolean }) => item.available)
      .sort((a: { order: number }, b: { order: number }) => a.order - b.order),
  }));

  return NextResponse.json({ categories: result });
}
