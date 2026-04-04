"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  MapPin,
  Store,
  Bike,
  Check,
  Utensils,
  CreditCard,
  QrCode,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type MenuItem = {
  id: string;
  name: string;
  description: string | null;
  price: string;
  available: boolean;
  channels: string[];
  options: unknown;
};

type Category = {
  id: string;
  name: string;
  active: boolean;
  items: MenuItem[];
};

type CartItem = {
  menuItemId: string;
  name: string;
  unitPrice: number;
  quantity: number;
};

const orderTypes = [
  { key: "DINE_IN", label: "LOCAL", icon: Store },
  { key: "PICKUP", label: "RETIRADA", icon: MapPin },
  { key: "DELIVERY", label: "ENTREGA", icon: Bike },
] as const;

const paymentMethods = [
  { key: "dinheiro", label: "DINHEIRO", icon: QrCode },
  { key: "pix", label: "PIX", icon: QrCode },
  { key: "cartao", label: "CARTAO", icon: CreditCard },
];

const categoryEmojis: Record<string, string> = {
  bebidas: "\uD83E\uDD64",
  lanches: "\uD83C\uDF54",
  pizzas: "\uD83C\uDF55",
  sobremesas: "\uD83C\uDF70",
  pratos: "\uD83C\uDF5B",
  combos: "\uD83C\uDF71",
  acai: "\uD83E\uDED0",
  salgados: "\uD83E\uDD5F",
  doces: "\uD83C\uDF69",
  pasteis: "\uD83E\uDD5F",
  sucos: "\uD83E\uDDC3",
  cervejas: "\uD83C\uDF7A",
  vinhos: "\uD83C\uDF77",
  entradas: "\uD83E\uDD57",
  massas: "\uD83C\uDF5D",
  carnes: "\uD83E\uDD69",
  peixes: "\uD83D\uDC1F",
  saladas: "\uD83E\uDD57",
  cafes: "\u2615",
  promocoes: "\uD83C\uDF1F",
};

function getCategoryEmoji(name: string): string {
  const lower = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  for (const [key, emoji] of Object.entries(categoryEmojis)) {
    if (lower.includes(key)) return emoji;
  }
  return "\uD83C\uDF7D\uFE0F";
}

export default function PDVPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderType, setOrderType] = useState<string>("DINE_IN");
  const [paymentMethod, setPaymentMethod] = useState<string>("dinheiro");
  const [customerName, setCustomerName] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchMenu = useCallback(async () => {
    try {
      const res = await fetch("/api/categories");
      if (res.ok) {
        const data = await res.json();
        const cats: Category[] = (data.categories || []).filter(
          (c: Category) => c.active
        );
        setCategories(cats);
        if (cats.length > 0 && !selectedCategory) {
          setSelectedCategory(cats[0].id);
        }
      }
    } catch (e) {
      console.error("Fetch menu error:", e);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory]);

  useEffect(() => {
    fetchMenu();
  }, [fetchMenu]);

  const currentCategory = categories.find((c) => c.id === selectedCategory);
  const pdvItems = (currentCategory?.items || []).filter(
    (item) => item.available && item.channels?.includes("PDV")
  );

  function addToCart(item: MenuItem) {
    setCart((prev) => {
      const existing = prev.find((c) => c.menuItemId === item.id);
      if (existing) {
        return prev.map((c) =>
          c.menuItemId === item.id ? { ...c, quantity: c.quantity + 1 } : c
        );
      }
      return [
        ...prev,
        {
          menuItemId: item.id,
          name: item.name,
          unitPrice: parseFloat(item.price),
          quantity: 1,
        },
      ];
    });
  }

  function updateQuantity(menuItemId: string, delta: number) {
    setCart((prev) =>
      prev
        .map((c) =>
          c.menuItemId === menuItemId
            ? { ...c, quantity: c.quantity + delta }
            : c
        )
        .filter((c) => c.quantity > 0)
    );
  }

  function clearCart() {
    setCart([]);
    setCustomerName("");
    setPaymentMethod("dinheiro");
    setOrderType("DINE_IN");
  }

  const subtotal = cart.reduce((sum, c) => sum + c.unitPrice * c.quantity, 0);
  const serviceTax = subtotal * 0.1;
  const total = subtotal + serviceTax;

  async function submitOrder() {
    if (cart.length === 0) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/orders/pdv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: orderType,
          paymentMethod,
          customerName: customerName.trim() || null,
          items: cart.map((c) => ({
            name: c.name,
            quantity: c.quantity,
            unitPrice: c.unitPrice,
            total: c.unitPrice * c.quantity,
          })),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setSuccess(data.order?.code || "Pedido criado!");
        clearCart();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        const err = await res.json();
        alert(err.error || "Erro ao criar pedido");
      }
    } catch (e) {
      console.error("Submit order error:", e);
      alert("Erro ao criar pedido");
    } finally {
      setSubmitting(false);
    }
  }

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "F9") {
        e.preventDefault();
        submitOrder();
      }
      if (e.key === "Escape") {
        e.preventDefault();
        clearCart();
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#a33900]" />
      </div>
    );
  }

  return (
    <div className="flex gap-6 h-[calc(100vh-5rem)] bg-[#f8f9fb]">
      {/* Success overlay */}
      {success && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <Card className="p-8 text-center">
            <div className="w-16 h-16 bg-[#edeef0] rounded-full flex items-center justify-center mx-auto mb-4">
              <Check size={32} className="text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-[#191c1e] mb-1">
              Pedido Registrado!
            </h2>
            <p className="text-3xl font-bold text-[#a33900]">{success}</p>
          </Card>
        </div>
      )}

      {/* Left: Product grid */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Category tabs - horizontal scrollable pills */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <Button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              variant={selectedCategory === cat.id ? "default" : "secondary"}
              className="rounded-full whitespace-nowrap flex items-center gap-2"
            >
              <span>{getCategoryEmoji(cat.name)}</span>
              {cat.name}
            </Button>
          ))}
        </div>

        {/* Products grid */}
        <div className="flex-1 overflow-auto">
          {pdvItems.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-[#5a4138]">
              Nenhum item disponivel nesta categoria
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {pdvItems.map((item) => {
                const inCart = cart.find((c) => c.menuItemId === item.id);
                return (
                  <Card
                    key={item.id}
                    className={`text-left transition relative overflow-hidden ${
                      inCart ? "ring-2 ring-[rgba(226,191,178,0.15)]" : ""
                    }`}
                  >
                    {/* Image placeholder */}
                    <div className="relative bg-[#edeef0] rounded-[0.75rem] mx-3 mt-3 h-40 flex items-center justify-center">
                      <Utensils size={40} className="text-[#5a4138] opacity-40" />
                      {/* Cart count badge */}
                      {inCart && (
                        <Badge className="absolute top-2 right-2 w-7 h-7 text-xs font-bold">
                          {inCart.quantity}
                        </Badge>
                      )}
                    </div>

                    {/* Product info */}
                    <CardContent className="p-3">
                      <h3 className="font-bold text-[#191c1e] text-sm mb-0.5 line-clamp-2">
                        {item.name}
                      </h3>
                      {item.description && (
                        <p className="text-xs text-[#5a4138] mb-3 line-clamp-1">
                          {item.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between">
                        <p className="text-base font-bold text-[#a33900]">
                          R$ {parseFloat(item.price).toFixed(2)}
                        </p>
                        <Button
                          onClick={() => addToCart(item)}
                          variant="secondary"
                          size="icon-sm"
                          className="rounded-full text-[#a33900]"
                        >
                          <Plus size={18} />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right: Cart sidebar */}
      <Card className="w-96 flex flex-col">
        {/* Cart header */}
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-2">
            <ShoppingCart size={20} className="text-[#a33900]" />
            <CardTitle className="text-lg font-bold">Carrinho</CardTitle>
          </div>
          {cart.length > 0 && (
            <Button
              onClick={clearCart}
              variant="link"
              size="xs"
              className="uppercase tracking-wide"
              title="Limpar (Esc)"
            >
              Limpar Tudo
            </Button>
          )}
        </CardHeader>

        {/* Order type - segmented control */}
        <div className="px-5 pt-2 pb-3">
          <div className="flex rounded-[0.75rem] bg-[#edeef0] p-1">
            {orderTypes.map((t) => (
              <Button
                key={t.key}
                onClick={() => setOrderType(t.key)}
                variant={orderType === t.key ? "default" : "ghost"}
                className={`flex-1 py-2 text-xs font-semibold tracking-wide rounded-[0.5rem] ${
                  orderType !== t.key ? "hover:bg-transparent hover:text-[#191c1e]" : ""
                }`}
                size="sm"
              >
                {t.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Customer name */}
        <div className="px-5 pt-1 pb-2">
          <Input
            type="text"
            placeholder="Nome do cliente (opcional)"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
          />
        </div>

        {/* Cart items */}
        <div className="flex-1 overflow-auto p-5 space-y-5">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-[#5a4138] text-sm">
              <ShoppingCart size={32} className="mb-2 opacity-30" />
              Carrinho vazio
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.menuItemId}
                className="flex items-center gap-3"
              >
                {/* Small product image placeholder */}
                <div className="w-12 h-12 bg-[#edeef0] rounded-[0.75rem] flex-shrink-0 flex items-center justify-center">
                  <Utensils size={16} className="text-[#5a4138] opacity-40" />
                </div>
                {/* Name + description */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#191c1e] truncate">
                    {item.name}
                  </p>
                  <p className="text-xs text-[#5a4138]">
                    R$ {item.unitPrice.toFixed(2)} un.
                  </p>
                </div>
                {/* Quantity controls */}
                <div className="flex items-center gap-1.5">
                  <Button
                    onClick={() => updateQuantity(item.menuItemId, -1)}
                    variant="secondary"
                    className="w-7 h-7 rounded-[0.75rem] p-0 text-[#a33900]"
                  >
                    <Minus size={14} />
                  </Button>
                  <span className="w-6 text-center text-sm font-bold text-[#191c1e]">
                    {item.quantity}
                  </span>
                  <Button
                    onClick={() => updateQuantity(item.menuItemId, 1)}
                    variant="secondary"
                    className="w-7 h-7 rounded-[0.75rem] p-0 text-[#a33900]"
                  >
                    <Plus size={14} />
                  </Button>
                </div>
                {/* Trash */}
                <Button
                  onClick={() =>
                    setCart((prev) =>
                      prev.filter((c) => c.menuItemId !== item.menuItemId)
                    )
                  }
                  variant="ghost"
                  className="p-0 w-7 h-7 opacity-40 hover:text-red-500 hover:opacity-100"
                >
                  <Trash2 size={16} />
                </Button>
                {/* Price */}
                <span className="text-sm font-bold text-[#191c1e] w-20 text-right">
                  R$ {(item.unitPrice * item.quantity).toFixed(2)}
                </span>
              </div>
            ))
          )}
        </div>

        {/* Subtotal, Service Tax, Total + Payment + Submit */}
        <div className="bg-[#edeef0]/40 px-5 pt-4 pb-5 space-y-3 rounded-b-[0.75rem]">
          {/* Subtotal */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-[#5a4138]">Subtotal</span>
            <span className="text-[#191c1e] font-medium">
              R$ {subtotal.toFixed(2)}
            </span>
          </div>
          {/* Service tax */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-[#5a4138]">Taxa de Servico (10%)</span>
            <span className="text-[#191c1e] font-medium">
              R$ {serviceTax.toFixed(2)}
            </span>
          </div>
          {/* Total */}
          <div className="flex items-center justify-between pt-3">
            <span className="text-base font-bold text-[#191c1e]">Total</span>
            <span className="text-2xl font-bold text-[#a33900]">
              R$ {total.toFixed(2)}
            </span>
          </div>

          {/* Payment method - 3 equal boxes */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            {paymentMethods.map((pm) => {
              const Icon = pm.icon;
              const isSelected = paymentMethod === pm.key;
              return (
                <Button
                  key={pm.key}
                  onClick={() => setPaymentMethod(pm.key)}
                  variant={isSelected ? "default" : "secondary"}
                  className="flex flex-col items-center gap-1.5 py-3 h-auto text-xs font-semibold"
                >
                  <Icon size={18} />
                  {pm.label}
                </Button>
              );
            })}
          </div>

          {/* Submit button */}
          <Button
            onClick={submitOrder}
            disabled={cart.length === 0 || submitting}
            variant="default"
            size="xl"
            className="w-full py-4 h-auto font-bold"
          >
            {submitting ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
            ) : (
              <>
                <Check size={20} />
                Registrar Pedido (F9)
              </>
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
}
