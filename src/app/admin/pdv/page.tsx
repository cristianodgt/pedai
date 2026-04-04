"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  ShoppingBasket,
  MapPin,
  Store,
  Bike,
  Check,
  Utensils,
  CreditCard,
  QrCode,
  Banknote,
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
  { key: "dinheiro", label: "DINHEIRO", icon: Banknote },
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
    <div className="-m-8 flex flex-1 overflow-hidden" style={{ height: "calc(100vh - 73px)" }}>
      {/* Success overlay */}
      {success && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 text-center shadow-2xl">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check size={32} className="text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-[#191c1e] mb-1">
              Pedido Registrado!
            </h2>
            <p className="text-3xl font-bold text-[#a33900]">{success}</p>
          </div>
        </div>
      )}

      {/* Left Side: Product Selection */}
      <section className="flex-1 p-6 overflow-y-auto">
        {/* Categories Bar */}
        <div className="flex gap-4 mb-8 overflow-x-auto pb-2">
          {categories.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-6 py-3 rounded-full font-bold flex items-center gap-2 whitespace-nowrap transition-colors ${
                  isActive
                    ? "bg-[#a33900] text-white shadow-lg shadow-[#a33900]/20"
                    : "bg-white text-[#5a4138] hover:bg-[#e7e8ea]"
                }`}
              >
                <span>{getCategoryEmoji(cat.name)}</span>
                {cat.name}
              </button>
            );
          })}
        </div>

        {/* Products Grid */}
        {pdvItems.length === 0 ? (
          <div className="flex items-center justify-center h-48 text-[#5a4138]">
            Nenhum item disponivel nesta categoria
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {pdvItems.map((item) => {
              const inCart = cart.find((c) => c.menuItemId === item.id);
              return (
                <div
                  key={item.id}
                  className={`group relative bg-white rounded-xl overflow-hidden flex flex-col border border-transparent transition-all duration-300 ${
                    inCart
                      ? "ring-2 ring-[#a33900] shadow-md"
                      : "hover:shadow-xl hover:border-orange-100"
                  }`}
                >
                  {/* Image */}
                  <div className="relative h-40 overflow-hidden bg-[#edeef0] flex items-center justify-center">
                    <Utensils size={40} className="text-[#5a4138] opacity-40" />
                    {/* Cart count badge */}
                    {inCart && (
                      <div className="absolute top-2 left-2 bg-white/90 backdrop-blur px-2 py-1 rounded-full flex items-center gap-1">
                        <ShoppingCart size={14} className="text-[#a33900]" />
                        <span className="text-xs font-bold text-[#a33900]">
                          {String(inCart.quantity).padStart(2, "0")}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Product info */}
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-[#191c1e] text-lg leading-tight mb-1">
                        {item.name}
                      </h3>
                      {item.description && (
                        <p className="text-xs text-[#5a4138] line-clamp-2 mb-3">
                          {item.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-auto">
                      <span className="text-[#a33900] font-extrabold text-lg">
                        R$ {parseFloat(item.price).toFixed(2)}
                      </span>
                      {inCart ? (
                        <div className="flex items-center gap-2 bg-[#edeef0] rounded-full p-1">
                          <button
                            onClick={() => updateQuantity(item.id, -1)}
                            className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[#5a4138] shadow-sm hover:text-[#a33900] transition-colors"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="text-xs font-bold px-1">{inCart.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, 1)}
                            className="w-8 h-8 rounded-full bg-[#a33900] flex items-center justify-center text-white shadow-sm"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => addToCart(item)}
                          className="w-10 h-10 rounded-full bg-[#edeef0] text-[#a33900] flex items-center justify-center hover:bg-[#a33900] hover:text-white transition-all active:scale-90"
                        >
                          <Plus size={20} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Right Side: Cart Sidebar */}
      <aside className="w-[420px] bg-white border-l border-gray-200/50 flex flex-col shadow-2xl z-10">
        {/* Header Cart */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-black text-[#191c1e] flex items-center gap-2">
              <ShoppingBasket size={22} className="text-[#a33900]" />
              Carrinho
            </h2>
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-xs font-bold text-[#8e7166] uppercase tracking-wider hover:text-red-500 transition-colors"
                title="Limpar (Esc)"
              >
                Limpar Tudo
              </button>
            )}
          </div>

          {/* Order Type Selector */}
          <div className="grid grid-cols-3 gap-2 p-1 bg-[#edeef0] rounded-xl">
            {orderTypes.map((t) => (
              <button
                key={t.key}
                onClick={() => setOrderType(t.key)}
                className={`py-2 px-1 text-[10px] font-black uppercase rounded-lg transition-colors ${
                  orderType === t.key
                    ? "bg-white shadow-sm text-[#a33900]"
                    : "text-zinc-500 hover:bg-white/50"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Customer name */}
        <div className="px-6 py-3 border-b border-gray-100">
          <input
            type="text"
            placeholder="Nome do cliente (opcional)"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="w-full bg-[#edeef0] border-none rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#a33900] outline-none"
          />
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-[#5a4138] text-sm">
              <ShoppingCart size={32} className="mb-2 opacity-30" />
              Carrinho vazio
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.menuItemId}>
                <div className="flex gap-4">
                  {/* Small product image placeholder */}
                  <div className="w-16 h-16 rounded-xl bg-[#edeef0] shrink-0 flex items-center justify-center">
                    <Utensils size={18} className="text-[#5a4138] opacity-40" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold text-sm text-[#191c1e]">
                        {item.name}
                      </h4>
                      <span className="text-sm font-bold text-[#5a4138]">
                        R$ {(item.unitPrice * item.quantity).toFixed(2)}
                      </span>
                    </div>
                    <p className="text-[10px] text-[#5a4138] mb-2">
                      R$ {item.unitPrice.toFixed(2)} un.
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => updateQuantity(item.menuItemId, -1)}
                          className="w-6 h-6 rounded bg-[#edeef0] flex items-center justify-center text-[#5a4138] hover:text-[#a33900] transition-colors"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="text-xs font-bold">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.menuItemId, 1)}
                          className="w-6 h-6 rounded bg-[#edeef0] flex items-center justify-center text-[#5a4138] hover:text-[#a33900] transition-colors"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                      <button
                        onClick={() =>
                          setCart((prev) =>
                            prev.filter((c) => c.menuItemId !== item.menuItemId)
                          )
                        }
                        className="text-zinc-300 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="h-px bg-gray-50 mt-4" />
              </div>
            ))
          )}
        </div>

        {/* Footer Checkout */}
        <div className="p-6 bg-[#f3f4f6]/50 backdrop-blur-md rounded-t-3xl border-t border-gray-100">
          {/* Totals */}
          <div className="space-y-2 mb-6">
            <div className="flex justify-between text-sm">
              <span className="text-[#5a4138]">Subtotal</span>
              <span className="font-medium text-[#191c1e]">
                R$ {subtotal.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#5a4138]">Taxa de Servico (10%)</span>
              <span className="font-medium text-[#191c1e]">
                R$ {serviceTax.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between pt-4 border-t border-gray-200">
              <span className="text-lg font-black text-[#191c1e]">Total</span>
              <span className="text-2xl font-black text-[#a33900]">
                R$ {total.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="flex gap-2 mb-6">
            {paymentMethods.map((pm) => {
              const Icon = pm.icon;
              const isSelected = paymentMethod === pm.key;
              return (
                <button
                  key={pm.key}
                  onClick={() => setPaymentMethod(pm.key)}
                  className={`flex-1 flex flex-col items-center gap-1 p-3 rounded-xl transition-all ${
                    isSelected
                      ? "bg-[#a33900] text-white shadow-lg shadow-[#a33900]/30"
                      : "bg-white border border-gray-200 hover:border-[#a33900] hover:text-[#a33900]"
                  }`}
                >
                  <Icon size={20} />
                  <span className="text-[10px] font-bold uppercase">{pm.label}</span>
                </button>
              );
            })}
          </div>

          {/* Submit Button */}
          <button
            onClick={submitOrder}
            disabled={cart.length === 0 || submitting}
            className="w-full py-5 bg-gradient-to-r from-[#a33900] to-[#cc4900] text-white rounded-2xl font-black text-lg shadow-xl shadow-[#a33900]/40 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
            ) : (
              <>
                <Check size={22} />
                Registrar Pedido (F9)
              </>
            )}
          </button>
        </div>
      </aside>
    </div>
  );
}
