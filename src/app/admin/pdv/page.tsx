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
          <div className="bg-white rounded-[0.75rem] p-8 text-center">
            <div className="w-16 h-16 bg-[#edeef0] rounded-full flex items-center justify-center mx-auto mb-4">
              <Check size={32} className="text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-[#191c1e] mb-1">
              Pedido Registrado!
            </h2>
            <p className="text-3xl font-bold text-[#a33900]">{success}</p>
          </div>
        </div>
      )}

      {/* Left: Product grid */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Category tabs - horizontal scrollable pills */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition flex items-center gap-2 ${
                selectedCategory === cat.id
                  ? "text-white"
                  : "bg-[#edeef0] text-[#5a4138] hover:bg-[#e2e3e5]"
              }`}
              style={
                selectedCategory === cat.id
                  ? { background: "linear-gradient(135deg, #a33900, #cc4900)" }
                  : undefined
              }
            >
              <span>{getCategoryEmoji(cat.name)}</span>
              {cat.name}
            </button>
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
                  <div
                    key={item.id}
                    className="bg-white rounded-[0.75rem] text-left transition relative overflow-hidden"
                    style={
                      inCart
                        ? { boxShadow: "inset 0 0 0 2px rgba(226,191,178,0.15)" }
                        : undefined
                    }
                  >
                    {/* Image placeholder */}
                    <div className="relative bg-[#edeef0] rounded-[0.75rem] mx-3 mt-3 h-40 flex items-center justify-center">
                      <Utensils size={40} className="text-[#5a4138] opacity-40" />
                      {/* Cart count badge */}
                      {inCart && (
                        <span
                          className="absolute top-2 right-2 w-7 h-7 text-white rounded-full text-xs flex items-center justify-center font-bold"
                          style={{ background: "linear-gradient(135deg, #a33900, #cc4900)" }}
                        >
                          {inCart.quantity}
                        </span>
                      )}
                    </div>

                    {/* Product info */}
                    <div className="p-3">
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
                        <button
                          onClick={() => addToCart(item)}
                          className="w-9 h-9 rounded-full bg-[#edeef0] text-[#a33900] flex items-center justify-center hover:opacity-80 transition"
                        >
                          <Plus size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right: Cart sidebar */}
      <div className="w-96 bg-white rounded-[0.75rem] flex flex-col">
        {/* Cart header */}
        <div className="p-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart size={20} className="text-[#a33900]" />
            <h2 className="font-bold text-[#191c1e] text-lg">Carrinho</h2>
          </div>
          {cart.length > 0 && (
            <button
              onClick={clearCart}
              className="text-xs font-semibold text-[#a33900] hover:underline uppercase tracking-wide"
              title="Limpar (Esc)"
            >
              Limpar Tudo
            </button>
          )}
        </div>

        {/* Order type - segmented control */}
        <div className="px-5 pt-2 pb-3">
          <div className="flex rounded-[0.75rem] bg-[#edeef0] p-1">
            {orderTypes.map((t) => (
              <button
                key={t.key}
                onClick={() => setOrderType(t.key)}
                className={`flex-1 py-2 text-xs font-semibold tracking-wide transition rounded-[0.5rem] ${
                  orderType === t.key
                    ? "text-white"
                    : "text-[#5a4138] hover:text-[#191c1e]"
                }`}
                style={
                  orderType === t.key
                    ? { background: "linear-gradient(135deg, #a33900, #cc4900)" }
                    : undefined
                }
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Customer name */}
        <div className="px-5 pt-1 pb-2">
          <input
            type="text"
            placeholder="Nome do cliente (opcional)"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="w-full px-3 py-2 bg-[#edeef0] rounded-[0.75rem] text-sm text-[#191c1e] placeholder-[#5a4138] border-none outline-none focus:border-b-2 focus:border-b-[#a33900] transition-all"
            style={{ borderBottom: "2px solid transparent" }}
            onFocus={(e) => (e.target.style.borderBottom = "2px solid #a33900")}
            onBlur={(e) => (e.target.style.borderBottom = "2px solid transparent")}
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
                  <button
                    onClick={() => updateQuantity(item.menuItemId, -1)}
                    className="w-7 h-7 rounded-[0.75rem] bg-[#edeef0] flex items-center justify-center hover:opacity-70 transition text-[#a33900]"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-6 text-center text-sm font-bold text-[#191c1e]">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.menuItemId, 1)}
                    className="w-7 h-7 rounded-[0.75rem] bg-[#edeef0] flex items-center justify-center hover:opacity-70 transition text-[#a33900]"
                  >
                    <Plus size={14} />
                  </button>
                </div>
                {/* Trash */}
                <button
                  onClick={() =>
                    setCart((prev) =>
                      prev.filter((c) => c.menuItemId !== item.menuItemId)
                    )
                  }
                  className="text-[#5a4138] opacity-40 hover:text-red-500 hover:opacity-100 transition"
                >
                  <Trash2 size={16} />
                </button>
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
                <button
                  key={pm.key}
                  onClick={() => setPaymentMethod(pm.key)}
                  className={`flex flex-col items-center gap-1.5 py-3 rounded-[0.75rem] text-xs font-semibold transition ${
                    isSelected
                      ? "text-white"
                      : "bg-[#edeef0] text-[#5a4138] hover:bg-[#e2e3e5]"
                  }`}
                  style={
                    isSelected
                      ? { background: "linear-gradient(135deg, #a33900, #cc4900)" }
                      : undefined
                  }
                >
                  <Icon size={18} />
                  {pm.label}
                </button>
              );
            })}
          </div>

          {/* Submit button */}
          <button
            onClick={submitOrder}
            disabled={cart.length === 0 || submitting}
            className="w-full py-4 text-white rounded-xl font-bold text-base disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
            style={{ background: "linear-gradient(135deg, #a33900, #cc4900)" }}
          >
            {submitting ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
            ) : (
              <>
                <Check size={20} />
                Registrar Pedido (F9)
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
