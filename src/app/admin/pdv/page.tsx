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
  { key: "DINE_IN", label: "Local", icon: Store },
  { key: "PICKUP", label: "Retirada", icon: MapPin },
  { key: "DELIVERY", label: "Entrega", icon: Bike },
] as const;

const paymentMethods = [
  { key: "dinheiro", label: "Dinheiro" },
  { key: "pix", label: "PIX" },
  { key: "cartao_credito", label: "Credito" },
  { key: "cartao_debito", label: "Debito" },
];

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

  const total = cart.reduce((sum, c) => sum + c.unitPrice * c.quantity, 0);

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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600" />
      </div>
    );
  }

  return (
    <div className="flex gap-6 h-[calc(100vh-5rem)]">
      {/* Success overlay */}
      {success && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 text-center shadow-2xl">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check size={32} className="text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Pedido Registrado!</h2>
            <p className="text-3xl font-bold text-orange-600">{success}</p>
          </div>
        </div>
      )}

      {/* Left: Product grid */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Category tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${
                selectedCategory === cat.id
                  ? "bg-orange-600 text-white shadow-md"
                  : "bg-white text-gray-600 hover:bg-orange-50 border border-gray-200"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Products grid */}
        <div className="flex-1 overflow-auto">
          {pdvItems.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-gray-400">
              Nenhum item disponivel nesta categoria
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {pdvItems.map((item) => {
                const inCart = cart.find((c) => c.menuItemId === item.id);
                return (
                  <button
                    key={item.id}
                    onClick={() => addToCart(item)}
                    className={`bg-white rounded-lg border p-4 text-left hover:shadow-md transition relative ${
                      inCart
                        ? "border-orange-400 ring-2 ring-orange-200"
                        : "border-gray-200"
                    }`}
                  >
                    {inCart && (
                      <span className="absolute -top-2 -right-2 w-6 h-6 bg-orange-600 text-white rounded-full text-xs flex items-center justify-center font-bold">
                        {inCart.quantity}
                      </span>
                    )}
                    <h3 className="font-medium text-gray-900 text-sm mb-1 line-clamp-2">
                      {item.name}
                    </h3>
                    {item.description && (
                      <p className="text-xs text-gray-400 mb-2 line-clamp-1">
                        {item.description}
                      </p>
                    )}
                    <p className="text-lg font-bold text-orange-600">
                      R$ {parseFloat(item.price).toFixed(2)}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right: Cart sidebar */}
      <div className="w-80 bg-white rounded-lg border border-gray-200 flex flex-col shadow-sm">
        {/* Cart header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart size={20} className="text-orange-600" />
            <h2 className="font-bold text-gray-900">Carrinho</h2>
            {cart.length > 0 && (
              <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                {cart.reduce((s, c) => s + c.quantity, 0)}
              </span>
            )}
          </div>
          {cart.length > 0 && (
            <button
              onClick={clearCart}
              className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
              title="Limpar (Esc)"
            >
              <Trash2 size={14} />
              Limpar
            </button>
          )}
        </div>

        {/* Order type */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex gap-1">
            {orderTypes.map((t) => (
              <button
                key={t.key}
                onClick={() => setOrderType(t.key)}
                className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-lg text-xs font-medium transition ${
                  orderType === t.key
                    ? "bg-orange-100 text-orange-700 border border-orange-300"
                    : "bg-gray-50 text-gray-500 border border-transparent hover:bg-gray-100"
                }`}
              >
                <t.icon size={16} />
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Customer name */}
        <div className="px-4 pt-3">
          <input
            type="text"
            placeholder="Nome do cliente (opcional)"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>

        {/* Cart items */}
        <div className="flex-1 overflow-auto p-4 space-y-2">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-gray-400 text-sm">
              <ShoppingCart size={32} className="mb-2 opacity-30" />
              Carrinho vazio
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.menuItemId}
                className="flex items-center gap-2 bg-gray-50 rounded-lg p-2"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {item.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    R$ {item.unitPrice.toFixed(2)}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => updateQuantity(item.menuItemId, -1)}
                    className="w-7 h-7 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-red-50 hover:border-red-300 transition"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-8 text-center text-sm font-bold">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.menuItemId, 1)}
                    className="w-7 h-7 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-green-50 hover:border-green-300 transition"
                  >
                    <Plus size={14} />
                  </button>
                </div>
                <span className="text-sm font-bold text-gray-900 w-20 text-right">
                  R$ {(item.unitPrice * item.quantity).toFixed(2)}
                </span>
              </div>
            ))
          )}
        </div>

        {/* Payment method */}
        {cart.length > 0 && (
          <div className="px-4 pb-2">
            <p className="text-xs text-gray-500 mb-1.5">Pagamento</p>
            <div className="grid grid-cols-2 gap-1">
              {paymentMethods.map((pm) => (
                <button
                  key={pm.key}
                  onClick={() => setPaymentMethod(pm.key)}
                  className={`px-2 py-1.5 rounded text-xs font-medium transition ${
                    paymentMethod === pm.key
                      ? "bg-orange-100 text-orange-700 border border-orange-300"
                      : "bg-gray-50 text-gray-500 border border-transparent hover:bg-gray-100"
                  }`}
                >
                  {pm.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Total + submit */}
        <div className="p-4 border-t border-gray-200 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-gray-500 font-medium">Total</span>
            <span className="text-2xl font-bold text-orange-600">
              R$ {total.toFixed(2)}
            </span>
          </div>
          <button
            onClick={submitOrder}
            disabled={cart.length === 0 || submitting}
            className="w-full py-3 bg-orange-600 text-white rounded-lg font-bold text-sm hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
          >
            {submitting ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
            ) : (
              <>
                <Check size={18} />
                Registrar Pedido
                <span className="text-xs opacity-70">(F9)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
