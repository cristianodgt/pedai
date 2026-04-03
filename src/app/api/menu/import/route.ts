import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getAuthUser } from "@/lib/auth";

type ParsedItem = {
  name: string;
  description: string;
  price: number;
};

type ParsedCategory = {
  name: string;
  items: ParsedItem[];
};

function parseMenuText(text: string): ParsedCategory[] {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const categories: ParsedCategory[] = [];
  let currentCategory: ParsedCategory | null = null;

  for (const line of lines) {
    // Detect category headers:
    // Lines in CAPS, lines ending with ":", lines starting with # or *
    const isCategory =
      line.endsWith(":") ||
      line.startsWith("#") ||
      line.startsWith("*") ||
      line.startsWith("---") ||
      (line === line.toUpperCase() && line.length > 2 && !/\d/.test(line) && !line.includes("R$"));

    if (isCategory) {
      const name = line.replace(/^[#*\-\s]+/, "").replace(/:$/, "").trim();
      if (name) {
        currentCategory = { name, items: [] };
        categories.push(currentCategory);
      }
      continue;
    }

    // Try to extract item with price
    // Patterns: "Item name - R$ 10,00" or "Item name 10.00" or "Item name R$10" or "Item name ... 10,00"
    const priceMatch = line.match(
      /^(.+?)\s*[-–—.]{0,5}\s*R?\$?\s*(\d+[.,]?\d{0,2})\s*$/i
    );

    if (priceMatch) {
      const rawName = priceMatch[1].replace(/[-–—.]+$/, "").trim();
      const price = parseFloat(priceMatch[2].replace(",", "."));

      // Split name and description by " - " or " | "
      const parts = rawName.split(/\s*[-|]\s*/);
      const name = parts[0].replace(/^\d+[.)]\s*/, "").trim();
      const description = parts.slice(1).join(", ").trim();

      if (name && price > 0) {
        if (!currentCategory) {
          currentCategory = { name: "Geral", items: [] };
          categories.push(currentCategory);
        }
        currentCategory.items.push({ name, description, price });
      }
    } else {
      // Line without price - could be a description or item without price
      // Try as item with price 0 if it looks like a product name
      const cleanLine = line.replace(/^\d+[.)]\s*/, "").trim();
      if (cleanLine.length > 2 && cleanLine.length < 60 && !cleanLine.includes("http")) {
        // Check if next meaningful content - skip for now, just descriptions
      }
    }
  }

  return categories.filter((c) => c.items.length > 0);
}

export async function POST(request: Request) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
  }

  const { text, clearExisting, preview } = await request.json();

  if (!text || typeof text !== "string") {
    return NextResponse.json({ error: "Envie o texto do cardapio" }, { status: 400 });
  }

  const parsed = parseMenuText(text);

  if (parsed.length === 0) {
    return NextResponse.json(
      { error: "Nao foi possivel extrair itens do texto. Certifique-se de incluir precos (ex: Hamburguer R$ 25,00)" },
      { status: 400 }
    );
  }

  // Preview mode - just return parsed result
  if (preview) {
    return NextResponse.json({
      categories: parsed,
      totalCategories: parsed.length,
      totalItems: parsed.reduce((s, c) => s + c.items.length, 0),
    });
  }

  const tenantId = user.tenant_id;

  // Optionally clear existing menu
  if (clearExisting) {
    const { data: existingCats } = await supabaseAdmin
      .from("menu_categories")
      .select("id")
      .eq("tenant_id", tenantId);

    if (existingCats && existingCats.length > 0) {
      const catIds = existingCats.map((c) => c.id);
      await supabaseAdmin.from("menu_items").delete().in("category_id", catIds);
      await supabaseAdmin.from("menu_categories").delete().eq("tenant_id", tenantId);
    }
  }

  let totalCategories = 0;
  let totalItems = 0;

  for (let i = 0; i < parsed.length; i++) {
    const cat = parsed[i];
    const { data: newCat, error: catErr } = await supabaseAdmin
      .from("menu_categories")
      .insert({
        tenant_id: tenantId,
        name: cat.name,
        order: i,
        active: true,
      })
      .select()
      .single();

    if (catErr || !newCat) continue;
    totalCategories++;

    const items = cat.items.map((item, j) => ({
      tenant_id: tenantId,
      category_id: newCat.id,
      name: item.name,
      description: item.description || null,
      price: item.price,
      available: true,
      channels: ["WHATSAPP", "PDV"],
      order: j,
    }));

    const { error: itemErr } = await supabaseAdmin.from("menu_items").insert(items);
    if (!itemErr) totalItems += items.length;
  }

  return NextResponse.json({
    message: "Cardapio importado com sucesso",
    categories: totalCategories,
    items: totalItems,
  });
}
