import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getAuthUser } from "@/lib/auth";

type TemplateItem = {
  name: string;
  description: string;
  price: number;
  channels: string[];
};

type TemplateCategory = {
  name: string;
  items: TemplateItem[];
};

type Template = {
  id: string;
  name: string;
  description: string;
  categories: TemplateCategory[];
};

const WP = ["WHATSAPP", "PDV"];

const templates: Template[] = [
  {
    id: "hamburgueria",
    name: "Hamburgueria",
    description: "Burgers, batatas, bebidas e sobremesas",
    categories: [
      {
        name: "Burgers",
        items: [
          { name: "Smash Burger Simples", description: "Pao, blend 120g, queijo, salada", price: 22, channels: WP },
          { name: "Smash Burger Duplo", description: "Pao, 2x blend 120g, queijo duplo, bacon", price: 32, channels: WP },
          { name: "Cheese Bacon", description: "Pao, blend 150g, queijo cheddar, bacon crocante", price: 28, channels: WP },
          { name: "Frango Crispy", description: "Pao, filé empanado, maionese especial, salada", price: 25, channels: WP },
          { name: "Veggie Burger", description: "Pao, hamburguer de grao de bico, queijo, salada", price: 24, channels: WP },
          { name: "Kids Burger", description: "Pao mini, blend 80g, queijo, ketchup", price: 16, channels: WP },
        ],
      },
      {
        name: "Porcoes",
        items: [
          { name: "Batata Frita P", description: "Porcao 200g", price: 12, channels: WP },
          { name: "Batata Frita G", description: "Porcao 400g", price: 18, channels: WP },
          { name: "Onion Rings", description: "8 unidades", price: 16, channels: WP },
          { name: "Nuggets 10un", description: "Frango empanado", price: 18, channels: WP },
        ],
      },
      {
        name: "Bebidas",
        items: [
          { name: "Coca-Cola 350ml", description: "Lata", price: 6, channels: WP },
          { name: "Coca-Cola 600ml", description: "Garrafa", price: 9, channels: WP },
          { name: "Guarana 350ml", description: "Lata", price: 5, channels: WP },
          { name: "Suco Natural 500ml", description: "Laranja, limao ou maracuja", price: 10, channels: WP },
          { name: "Agua 500ml", description: "Com ou sem gas", price: 4, channels: WP },
          { name: "Milkshake", description: "Chocolate, morango ou baunilha", price: 16, channels: WP },
        ],
      },
      {
        name: "Sobremesas",
        items: [
          { name: "Brownie", description: "Com sorvete de creme", price: 14, channels: WP },
          { name: "Petit Gateau", description: "Com sorvete", price: 18, channels: WP },
        ],
      },
    ],
  },
  {
    id: "pizzaria",
    name: "Pizzaria",
    description: "Pizzas salgadas, doces, bebidas e entradas",
    categories: [
      {
        name: "Pizzas Tradicionais",
        items: [
          { name: "Margherita", description: "Molho, mussarela, tomate, manjericao", price: 45, channels: WP },
          { name: "Calabresa", description: "Molho, mussarela, calabresa, cebola", price: 42, channels: WP },
          { name: "Portuguesa", description: "Molho, mussarela, presunto, ovo, cebola, azeitona", price: 48, channels: WP },
          { name: "Frango com Catupiry", description: "Molho, mussarela, frango desfiado, catupiry", price: 48, channels: WP },
          { name: "4 Queijos", description: "Molho, mussarela, provolone, gorgonzola, parmesao", price: 52, channels: WP },
          { name: "Pepperoni", description: "Molho, mussarela, pepperoni", price: 50, channels: WP },
        ],
      },
      {
        name: "Pizzas Especiais",
        items: [
          { name: "Costela BBQ", description: "Molho bbq, mussarela, costela desfiada, cebola caramelizada", price: 58, channels: WP },
          { name: "Camarao", description: "Molho, mussarela, camarao, catupiry", price: 62, channels: WP },
          { name: "Lombo Canadense", description: "Molho, mussarela, lombo, catupiry, cebola", price: 55, channels: WP },
        ],
      },
      {
        name: "Pizzas Doces",
        items: [
          { name: "Chocolate", description: "Chocolate ao leite, granulado", price: 40, channels: WP },
          { name: "Romeu e Julieta", description: "Mussarela, goiabada", price: 42, channels: WP },
          { name: "Banana com Canela", description: "Banana, acucar, canela, leite condensado", price: 38, channels: WP },
        ],
      },
      {
        name: "Bebidas",
        items: [
          { name: "Coca-Cola 2L", description: "Garrafa", price: 14, channels: WP },
          { name: "Guarana 2L", description: "Garrafa", price: 12, channels: WP },
          { name: "Suco 1L", description: "Laranja, uva ou maracuja", price: 12, channels: WP },
          { name: "Agua 500ml", description: "", price: 4, channels: WP },
        ],
      },
    ],
  },
  {
    id: "acaiteria",
    name: "Acaiteria",
    description: "Acai, bowls, cremes e sucos",
    categories: [
      {
        name: "Acai no Copo",
        items: [
          { name: "Acai 300ml", description: "Puro com granola e banana", price: 14, channels: WP },
          { name: "Acai 500ml", description: "Puro com granola e banana", price: 18, channels: WP },
          { name: "Acai 700ml", description: "Puro com granola e banana", price: 24, channels: WP },
          { name: "Acai 1L", description: "Puro com granola e banana", price: 30, channels: WP },
        ],
      },
      {
        name: "Acrescimos",
        items: [
          { name: "Leite em Po", description: "", price: 3, channels: WP },
          { name: "Leite Condensado", description: "", price: 3, channels: WP },
          { name: "Nutella", description: "", price: 5, channels: WP },
          { name: "Morango", description: "", price: 4, channels: WP },
          { name: "Paçoca", description: "", price: 3, channels: WP },
          { name: "Amendoim", description: "", price: 2, channels: WP },
          { name: "Confete", description: "", price: 3, channels: WP },
        ],
      },
      {
        name: "Cremes",
        items: [
          { name: "Creme de Cupuacu 300ml", description: "", price: 16, channels: WP },
          { name: "Creme de Cupuacu 500ml", description: "", price: 22, channels: WP },
          { name: "Creme de Bacaba 300ml", description: "", price: 16, channels: WP },
        ],
      },
      {
        name: "Sucos Naturais",
        items: [
          { name: "Suco de Laranja 500ml", description: "Natural", price: 10, channels: WP },
          { name: "Suco de Maracuja 500ml", description: "Natural", price: 10, channels: WP },
          { name: "Vitamina de Banana 500ml", description: "Com leite", price: 12, channels: WP },
        ],
      },
    ],
  },
  {
    id: "marmitaria",
    name: "Marmitaria / Restaurante",
    description: "Marmitas, pratos executivos e bebidas",
    categories: [
      {
        name: "Marmitas",
        items: [
          { name: "Marmita P (300g)", description: "Arroz, feijao, salada + 1 proteina", price: 16, channels: WP },
          { name: "Marmita M (450g)", description: "Arroz, feijao, salada + 1 proteina", price: 20, channels: WP },
          { name: "Marmita G (600g)", description: "Arroz, feijao, salada + 1 proteina", price: 26, channels: WP },
          { name: "Marmita Fitness", description: "Arroz integral, legumes, frango grelhado", price: 24, channels: WP },
        ],
      },
      {
        name: "Proteinas",
        items: [
          { name: "Frango Grelhado", description: "File de frango", price: 0, channels: WP },
          { name: "Bife Acebolado", description: "Contra file", price: 4, channels: WP },
          { name: "Strogonoff de Frango", description: "Com batata palha", price: 2, channels: WP },
          { name: "Costela", description: "Assada no bafo", price: 6, channels: WP },
          { name: "Peixe Grelhado", description: "Tilapia", price: 4, channels: WP },
        ],
      },
      {
        name: "Bebidas",
        items: [
          { name: "Refrigerante Lata", description: "Coca, Guarana, Fanta", price: 5, channels: WP },
          { name: "Suco Natural", description: "500ml", price: 8, channels: WP },
          { name: "Agua", description: "500ml", price: 3, channels: WP },
        ],
      },
    ],
  },
  {
    id: "churrascaria",
    name: "Churrascaria / Espetaria",
    description: "Espetos, porcoes, acompanhamentos e bebidas",
    categories: [
      {
        name: "Espetos",
        items: [
          { name: "Picanha", description: "Espeto ~200g", price: 18, channels: WP },
          { name: "Fraldinha", description: "Espeto ~180g", price: 14, channels: WP },
          { name: "Costela", description: "Espeto ~200g", price: 12, channels: WP },
          { name: "Frango", description: "Sobrecoxa temperada", price: 8, channels: WP },
          { name: "Linguica", description: "Toscana", price: 8, channels: WP },
          { name: "Queijo Coalho", description: "3 cubos", price: 10, channels: WP },
          { name: "Abacaxi", description: "Com canela", price: 6, channels: WP },
        ],
      },
      {
        name: "Porcoes",
        items: [
          { name: "Mandioca Frita", description: "Porcao 400g", price: 18, channels: WP },
          { name: "Batata Frita", description: "Porcao 400g", price: 16, channels: WP },
          { name: "Vinagrete", description: "Porcao", price: 6, channels: WP },
          { name: "Farofa Especial", description: "Com bacon e ovo", price: 10, channels: WP },
        ],
      },
      {
        name: "Bebidas",
        items: [
          { name: "Cerveja Long Neck", description: "Original, Heineken ou Brahma", price: 10, channels: WP },
          { name: "Cerveja 600ml", description: "Brahma, Skol", price: 12, channels: WP },
          { name: "Refrigerante 2L", description: "Coca, Guarana", price: 12, channels: WP },
          { name: "Caipirinha", description: "Limao, morango ou maracuja", price: 16, channels: WP },
        ],
      },
    ],
  },
];

export async function GET() {
  const list = templates.map((t) => ({
    id: t.id,
    name: t.name,
    description: t.description,
    categoriesCount: t.categories.length,
    itemsCount: t.categories.reduce((s, c) => s + c.items.length, 0),
  }));
  return NextResponse.json({ templates: list });
}

export async function POST(request: Request) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
  }

  const { templateId, clearExisting } = await request.json();
  const template = templates.find((t) => t.id === templateId);
  if (!template) {
    return NextResponse.json({ error: "Template nao encontrado" }, { status: 404 });
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

  for (let i = 0; i < template.categories.length; i++) {
    const cat = template.categories[i];
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
      channels: item.channels,
      order: j,
    }));

    const { error: itemErr } = await supabaseAdmin.from("menu_items").insert(items);
    if (!itemErr) totalItems += items.length;
  }

  return NextResponse.json({
    message: `Template "${template.name}" aplicado`,
    categories: totalCategories,
    items: totalItems,
  });
}
