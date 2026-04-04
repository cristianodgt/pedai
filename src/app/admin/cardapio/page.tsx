"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  X,
  Upload,
  FileText,
  Utensils,
  Download,
  MoreVertical,
} from "lucide-react";

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  available: boolean;
  channels: string[];
  options: unknown;
  order: number;
}

interface Category {
  id: string;
  name: string;
  active: boolean;
  order: number;
  items: MenuItem[];
}

const categoryEmojis: Record<string, string> = {
  Lanches: "\uD83C\uDF54",
  Bebidas: "\uD83E\uDD64",
  Pizzas: "\uD83C\uDF55",
  Combos: "\uD83C\uDF71",
  Sobremesas: "\uD83C\uDF70",
  Acai: "\uD83E\uDED0",
  Massas: "\uD83C\uDF5D",
  Salgados: "\uD83E\uDD5F",
  Pratos: "\uD83C\uDF5B",
  Marmitas: "\uD83C\uDF71",
  Porções: "\uD83C\uDF5F",
};

function getCategoryEmoji(name: string): string {
  for (const [key, emoji] of Object.entries(categoryEmojis)) {
    if (name.toLowerCase().includes(key.toLowerCase())) return emoji;
  }
  return "\uD83C\uDF7D\uFE0F";
}

export default function CardapioPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [importDropdown, setImportDropdown] = useState(false);

  // Category modal
  const [catModal, setCatModal] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [catName, setCatName] = useState("");

  // Item modal
  const [itemModal, setItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [itemCategoryId, setItemCategoryId] = useState("");
  const [itemName, setItemName] = useState("");
  const [itemDescription, setItemDescription] = useState("");
  const [itemPrice, setItemPrice] = useState("");
  const [itemChannels, setItemChannels] = useState<string[]>(["WHATSAPP", "PDV"]);

  const [saving, setSaving] = useState(false);

  // Import modal
  const [importModal, setImportModal] = useState(false);
  const [importTab, setImportTab] = useState<"templates" | "text">("templates");
  const [importText, setImportText] = useState("");
  const [importing, setImporting] = useState(false);
  const [templates, setTemplates] = useState<{ id: string; name: string; description: string; categoriesCount: number; itemsCount: number }[]>([]);
  const [clearExisting, setClearExisting] = useState(true);

  // Item context menu
  const [itemMenu, setItemMenu] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/categories");
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories);
        // Auto-expand all on first load
        if (expanded.size === 0 && data.categories.length > 0) {
          setExpanded(new Set(data.categories.map((c: Category) => c.id)));
        }
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Category CRUD
  const openNewCategory = () => {
    setEditingCat(null);
    setCatName("");
    setCatModal(true);
  };

  const openEditCategory = (cat: Category) => {
    setEditingCat(cat);
    setCatName(cat.name);
    setCatModal(true);
  };

  const saveCategory = async () => {
    if (!catName.trim()) return;
    setSaving(true);
    try {
      if (editingCat) {
        await fetch(`/api/categories/${editingCat.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: catName }),
        });
      } else {
        await fetch("/api/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: catName }),
        });
      }
      setCatModal(false);
      fetchCategories();
    } finally {
      setSaving(false);
    }
  };

  const toggleCategoryActive = async (cat: Category) => {
    await fetch(`/api/categories/${cat.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !cat.active }),
    });
    fetchCategories();
  };

  const deleteCategory = async (cat: Category) => {
    if (!confirm(`Excluir categoria "${cat.name}"?`)) return;
    const res = await fetch(`/api/categories/${cat.id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      alert(data.error);
      return;
    }
    fetchCategories();
  };

  // Item CRUD
  const openNewItem = (categoryId: string) => {
    setEditingItem(null);
    setItemCategoryId(categoryId);
    setItemName("");
    setItemDescription("");
    setItemPrice("");
    setItemChannels(["WHATSAPP", "PDV"]);
    setItemModal(true);
  };

  const openEditItem = (item: MenuItem, categoryId: string) => {
    setEditingItem(item);
    setItemCategoryId(categoryId);
    setItemName(item.name);
    setItemDescription(item.description || "");
    setItemPrice(String(item.price));
    setItemChannels(item.channels);
    setItemModal(true);
  };

  const saveItem = async () => {
    if (!itemName.trim() || !itemPrice) return;
    setSaving(true);
    try {
      const payload = {
        categoryId: itemCategoryId,
        name: itemName,
        description: itemDescription || null,
        price: parseFloat(itemPrice),
        channels: itemChannels,
      };

      if (editingItem) {
        await fetch(`/api/menu-items/${editingItem.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch("/api/menu-items", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      setItemModal(false);
      fetchCategories();
    } finally {
      setSaving(false);
    }
  };

  const toggleItemAvailable = async (item: MenuItem) => {
    await fetch(`/api/menu-items/${item.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ available: !item.available }),
    });
    fetchCategories();
  };

  const deleteItem = async (item: MenuItem) => {
    if (!confirm(`Excluir "${item.name}"?`)) return;
    await fetch(`/api/menu-items/${item.id}`, { method: "DELETE" });
    fetchCategories();
  };

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleChannel = (ch: string) => {
    setItemChannels((prev) =>
      prev.includes(ch) ? prev.filter((c) => c !== ch) : [...prev, ch]
    );
  };

  const openImport = async () => {
    setImportModal(true);
    setImportDropdown(false);
    setImportTab("templates");
    setImportText("");
    try {
      const res = await fetch("/api/menu/templates");
      if (res.ok) {
        const data = await res.json();
        setTemplates(data.templates || []);
      }
    } catch (e) {
      console.error("Fetch templates error:", e);
    }
  };

  const applyTemplate = async (templateId: string) => {
    setImporting(true);
    try {
      const res = await fetch("/api/menu/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId, clearExisting }),
      });
      if (res.ok) {
        const data = await res.json();
        alert(`${data.message} (${data.categories} categorias, ${data.items} itens)`);
        setImportModal(false);
        fetchCategories();
      } else {
        const err = await res.json();
        alert(err.error || "Erro ao aplicar template");
      }
    } catch (e) {
      console.error("Apply template error:", e);
      alert("Erro ao aplicar template");
    } finally {
      setImporting(false);
    }
  };

  const importFromText = async () => {
    if (!importText.trim()) return;
    setImporting(true);
    try {
      const res = await fetch("/api/menu/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: importText, clearExisting }),
      });
      if (res.ok) {
        const data = await res.json();
        alert(`${data.message} (${data.categories} categorias, ${data.items} itens)`);
        setImportModal(false);
        fetchCategories();
      } else {
        const err = await res.json();
        alert(err.error || "Erro ao importar");
      }
    } catch (e) {
      console.error("Import error:", e);
      alert("Erro ao importar");
    } finally {
      setImporting(false);
    }
  };

  const totalItems = categories.reduce((sum, c) => sum + c.items.length, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div
          className="animate-spin rounded-full h-8 w-8"
          style={{ borderBottom: "2px solid #a33900" }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6" style={{ background: "#f8f9fb" }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#191c1e" }}>
            Gestao de Cardapio
          </h1>
          <p className="text-sm mt-1" style={{ color: "#5a4138" }}>
            Gerencie categorias, itens e canais de venda em tempo real.
          </p>
        </div>
        <div className="flex gap-3">
          {/* Import dropdown button — ghost/tertiary style */}
          <div className="relative">
            <button
              onClick={() => setImportDropdown(!importDropdown)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-[0.75rem] transition text-sm font-medium"
              style={{
                background: "transparent",
                color: "#a33900",
                border: "1px solid rgba(226,191,178,0.15)",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#edeef0")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <Download size={16} />
              Importar
              <ChevronDown size={14} />
            </button>
            {importDropdown && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setImportDropdown(false)} />
                <div
                  className="absolute right-0 mt-2 w-48 rounded-[0.75rem] z-20 py-1"
                  style={{ background: "#ffffff" }}
                >
                  <button
                    onClick={openImport}
                    className="w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 transition"
                    style={{ color: "#191c1e" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#f8f9fb")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <Utensils size={14} />
                    Templates Prontos
                  </button>
                  <button
                    onClick={() => { setImportDropdown(false); setImportModal(true); setImportTab("text"); }}
                    className="w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 transition"
                    style={{ color: "#191c1e" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#f8f9fb")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <FileText size={14} />
                    Colar Texto
                  </button>
                </div>
              </>
            )}
          </div>
          {/* Nova Categoria — gradient bg */}
          <button
            onClick={openNewCategory}
            className="flex items-center gap-2 px-4 py-2.5 text-white rounded-[0.75rem] transition text-sm font-medium"
            style={{ background: "linear-gradient(135deg, #a33900, #cc4900)" }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            <Plus size={16} />
            Nova Categoria
          </button>
        </div>
      </div>

      {categories.length === 0 ? (
        <div
          className="rounded-[0.75rem] p-12 text-center"
          style={{ background: "#ffffff" }}
        >
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: "rgba(163,57,0,0.08)" }}
          >
            <Utensils size={28} style={{ color: "#a33900" }} />
          </div>
          <p className="text-lg mb-4" style={{ color: "#5a4138" }}>
            Nenhuma categoria criada
          </p>
          <button
            onClick={openNewCategory}
            className="font-medium transition"
            style={{ color: "#a33900" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#cc4900")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#a33900")}
          >
            Criar primeira categoria
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className={`rounded-[0.75rem] overflow-hidden ${
                !cat.active ? "opacity-60" : ""
              }`}
              style={{ background: "#ffffff" }}
            >
              {/* Category Header — white bg, no border, tonal separation */}
              <div
                className="flex items-center gap-4 px-5 py-4 cursor-pointer transition"
                style={{ background: "#ffffff" }}
                onClick={() => toggleExpand(cat.id)}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#f8f9fb")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#ffffff")}
              >
                {/* Category emoji in tonal circle */}
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0"
                  style={{ background: "rgba(163,57,0,0.08)" }}
                >
                  {getCategoryEmoji(cat.name)}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-bold" style={{ color: "#191c1e" }}>
                    {cat.name}
                  </h3>
                  <p className="text-xs" style={{ color: "#5a4138" }}>
                    {cat.items.length} {cat.items.length === 1 ? "item" : "itens"}
                  </p>
                </div>

                {/* Channel badges — tonal circles, small */}
                <div className="flex items-center gap-1.5">
                  {cat.items.some(i => i.channels.includes("WHATSAPP")) && (
                    <span
                      className="w-6 h-6 rounded-full text-[10px] font-bold flex items-center justify-center"
                      style={{ background: "rgba(34,197,94,0.12)", color: "#15803d" }}
                      title="WhatsApp"
                    >W</span>
                  )}
                  {cat.items.some(i => i.channels.includes("PDV")) && (
                    <span
                      className="w-6 h-6 rounded-full text-[10px] font-bold flex items-center justify-center"
                      style={{ background: "rgba(59,130,246,0.12)", color: "#1d4ed8" }}
                      title="PDV"
                    >P</span>
                  )}
                  {cat.items.some(i => i.channels.includes("IFOOD")) && (
                    <span
                      className="w-6 h-6 rounded-full text-[10px] font-bold flex items-center justify-center"
                      style={{ background: "rgba(239,68,68,0.12)", color: "#b91c1c" }}
                      title="iFood"
                    >i</span>
                  )}
                </div>

                {/* Edit pencil */}
                <button
                  onClick={(e) => { e.stopPropagation(); openEditCategory(cat); }}
                  className="p-1.5 rounded-[0.75rem] transition"
                  style={{ color: "#5a4138" }}
                  title="Editar categoria"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "#a33900";
                    e.currentTarget.style.background = "rgba(163,57,0,0.08)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "#5a4138";
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  <Pencil size={16} />
                </button>

                {/* Expand/collapse chevron */}
                <div style={{ color: "#5a4138" }}>
                  {expanded.has(cat.id) ? (
                    <ChevronDown size={20} />
                  ) : (
                    <ChevronRight size={20} />
                  )}
                </div>
              </div>

              {/* Items — no divider lines, tonal separation */}
              {expanded.has(cat.id) && (
                <div style={{ background: "#edeef0" }}>
                  {cat.items.length === 0 ? (
                    <div className="px-5 py-8 text-center">
                      <p className="text-sm mb-3" style={{ color: "#5a4138" }}>
                        Nenhum item nesta categoria
                      </p>
                      <button
                        onClick={() => openNewItem(cat.id)}
                        className="text-sm font-medium transition"
                        style={{ color: "#a33900" }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = "#cc4900")}
                        onMouseLeave={(e) => (e.currentTarget.style.color = "#a33900")}
                      >
                        + Adicionar item
                      </button>
                    </div>
                  ) : (
                    <div>
                      {cat.items.map((item, idx) => (
                        <div
                          key={item.id}
                          className={`px-5 py-4 ${
                            !item.available ? "opacity-50" : ""
                          }`}
                          style={{
                            background: idx % 2 === 0 ? "#f8f9fb" : "#ffffff",
                          }}
                        >
                          <div className="flex items-center gap-4">
                            {/* Image placeholder — bg #edeef0, rounded */}
                            <div
                              className="w-[60px] h-[60px] rounded-[0.75rem] flex items-center justify-center flex-shrink-0"
                              style={{ background: "#edeef0" }}
                            >
                              <Utensils size={20} style={{ color: "#5a4138", opacity: 0.4 }} />
                            </div>

                            {/* Name + description */}
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-sm" style={{ color: "#191c1e" }}>
                                {item.name}
                              </p>
                              {item.description && (
                                <p
                                  className="text-xs mt-0.5 truncate"
                                  style={{ color: "#5a4138" }}
                                >
                                  {item.description}
                                </p>
                              )}
                            </div>

                            {/* Price — #191c1e, font-semibold */}
                            <div className="text-right flex-shrink-0">
                              <p
                                className="text-xs uppercase tracking-wide"
                                style={{ color: "#5a4138" }}
                              >
                                Preco unitario
                              </p>
                              <p
                                className="font-semibold text-sm"
                                style={{ color: "#191c1e" }}
                              >
                                R$ {Number(item.price).toFixed(2).replace(".", ",")}
                              </p>
                            </div>

                            {/* Availability toggle — uses #cc4900 when active */}
                            <button
                              onClick={() => toggleItemAvailable(item)}
                              className="flex-shrink-0"
                            >
                              <div
                                className="relative w-12 h-6 rounded-full transition-colors"
                                style={{
                                  background: item.available ? "#cc4900" : "#edeef0",
                                }}
                              >
                                <div
                                  className={`absolute top-0.5 w-5 h-5 rounded-full transition-transform ${
                                    item.available ? "translate-x-6" : "translate-x-0.5"
                                  }`}
                                  style={{ background: "#ffffff" }}
                                />
                              </div>
                              <p
                                className="text-[10px] font-medium mt-1 text-center"
                                style={{
                                  color: item.available ? "#a33900" : "#5a4138",
                                }}
                              >
                                {item.available ? "DISPONIVEL" : "INDISPONIVEL"}
                              </p>
                            </button>

                            {/* Three-dot menu */}
                            <div className="relative flex-shrink-0">
                              <button
                                onClick={() => setItemMenu(itemMenu === item.id ? null : item.id)}
                                className="p-1.5 rounded-[0.75rem] transition"
                                style={{ color: "#5a4138" }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.color = "#191c1e";
                                  e.currentTarget.style.background = "#edeef0";
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.color = "#5a4138";
                                  e.currentTarget.style.background = "transparent";
                                }}
                              >
                                <MoreVertical size={16} />
                              </button>
                              {itemMenu === item.id && (
                                <>
                                  <div className="fixed inset-0 z-10" onClick={() => setItemMenu(null)} />
                                  <div
                                    className="absolute right-0 mt-1 w-36 rounded-[0.75rem] z-20 py-1"
                                    style={{ background: "#ffffff" }}
                                  >
                                    <button
                                      onClick={() => { setItemMenu(null); openEditItem(item, cat.id); }}
                                      className="w-full text-left px-4 py-2 text-sm flex items-center gap-2 transition"
                                      style={{ color: "#191c1e" }}
                                      onMouseEnter={(e) => (e.currentTarget.style.background = "#f8f9fb")}
                                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                                    >
                                      <Pencil size={14} />
                                      Editar
                                    </button>
                                    <button
                                      onClick={() => { setItemMenu(null); toggleCategoryActive(cat); }}
                                      className="w-full text-left px-4 py-2 text-sm flex items-center gap-2 transition"
                                      style={{ color: "#191c1e" }}
                                      onMouseEnter={(e) => (e.currentTarget.style.background = "#f8f9fb")}
                                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                                    >
                                      {cat.active ? <EyeOff size={14} /> : <Eye size={14} />}
                                      {cat.active ? "Desativar" : "Ativar"}
                                    </button>
                                    <button
                                      onClick={() => { setItemMenu(null); deleteItem(item); }}
                                      className="w-full text-left px-4 py-2 text-sm flex items-center gap-2 transition"
                                      style={{ color: "#b91c1c" }}
                                      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(239,68,68,0.06)")}
                                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                                    >
                                      <Trash2 size={14} />
                                      Excluir
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Channel checkmarks */}
                          <div className="flex items-center gap-4 mt-2 ml-[76px]">
                            <span
                              className="text-xs"
                              style={{
                                color: item.channels.includes("WHATSAPP") ? "#15803d" : "rgba(90,65,56,0.35)",
                              }}
                            >
                              {item.channels.includes("WHATSAPP") ? "\u2705" : "\u2B1C"} WhatsApp
                            </span>
                            <span
                              className="text-xs"
                              style={{
                                color: item.channels.includes("PDV") ? "#1d4ed8" : "rgba(90,65,56,0.35)",
                              }}
                            >
                              {item.channels.includes("PDV") ? "\u2705" : "\u2B1C"} PDV
                            </span>
                            <span
                              className="text-xs"
                              style={{
                                color: item.channels.includes("IFOOD") ? "#b91c1c" : "rgba(90,65,56,0.35)",
                              }}
                            >
                              {item.channels.includes("IFOOD") ? "\u2705" : "\u2B1C"} iFood
                            </span>
                          </div>
                        </div>
                      ))}

                      {/* Add item button — dashed using ghost border color */}
                      <button
                        onClick={() => openNewItem(cat.id)}
                        className="w-full px-5 py-3 text-sm font-medium transition flex items-center justify-center gap-1"
                        style={{
                          borderTop: "1px dashed #e2bfb2",
                          color: "#a33900",
                          background: "transparent",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(163,57,0,0.04)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        <Plus size={16} />
                        Adicionar Item
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Category Modal */}
      {catModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div
            className="rounded-[0.75rem] w-full max-w-md mx-4"
            style={{ background: "#ffffff" }}
          >
            <div
              className="flex items-center justify-between px-6 py-4"
              style={{ borderBottom: "1px solid #edeef0" }}
            >
              <h2 className="text-lg font-semibold" style={{ color: "#191c1e" }}>
                {editingCat ? "Editar Categoria" : "Nova Categoria"}
              </h2>
              <button
                onClick={() => setCatModal(false)}
                style={{ color: "#5a4138" }}
                className="transition"
                onMouseEnter={(e) => (e.currentTarget.style.color = "#191c1e")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#5a4138")}
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              <label
                className="block text-sm font-medium mb-1"
                style={{ color: "#5a4138" }}
              >
                Nome da categoria
              </label>
              <input
                type="text"
                value={catName}
                onChange={(e) => setCatName(e.target.value)}
                placeholder="Ex: Marmitas, Bebidas, Combos..."
                className="w-full px-3 py-2.5 rounded-[0.75rem] outline-none text-sm transition"
                style={{
                  background: "#f8f9fb",
                  color: "#191c1e",
                  border: "none",
                }}
                onFocus={(e) => (e.currentTarget.style.boxShadow = "0 0 0 2px #cc4900")}
                onBlur={(e) => (e.currentTarget.style.boxShadow = "none")}
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && saveCategory()}
              />
            </div>

            <div
              className="flex justify-end gap-3 px-6 py-4"
              style={{ borderTop: "1px solid #edeef0" }}
            >
              <button
                onClick={() => setCatModal(false)}
                className="px-4 py-2 text-sm transition"
                style={{ color: "#5a4138" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#191c1e")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#5a4138")}
              >
                Cancelar
              </button>
              <button
                onClick={saveCategory}
                disabled={saving || !catName.trim()}
                className="px-4 py-2 text-white rounded-[0.75rem] disabled:opacity-50 text-sm font-medium transition"
                style={{ background: "linear-gradient(135deg, #a33900, #cc4900)" }}
              >
                {saving ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {importModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div
            className="rounded-[0.75rem] w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col"
            style={{ background: "#ffffff" }}
          >
            <div
              className="flex items-center justify-between px-6 py-4"
              style={{ borderBottom: "1px solid #edeef0" }}
            >
              <h2 className="text-lg font-semibold" style={{ color: "#191c1e" }}>
                Importar Cardapio
              </h2>
              <button
                onClick={() => setImportModal(false)}
                style={{ color: "#5a4138" }}
                className="transition"
                onMouseEnter={(e) => (e.currentTarget.style.color = "#191c1e")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#5a4138")}
              >
                <X size={20} />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex" style={{ borderBottom: "1px solid #edeef0" }}>
              <button
                onClick={() => setImportTab("templates")}
                className="flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition"
                style={{
                  color: importTab === "templates" ? "#a33900" : "#5a4138",
                  borderBottom: importTab === "templates" ? "2px solid #a33900" : "2px solid transparent",
                }}
              >
                <Utensils size={16} />
                Templates Prontos
              </button>
              <button
                onClick={() => setImportTab("text")}
                className="flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition"
                style={{
                  color: importTab === "text" ? "#a33900" : "#5a4138",
                  borderBottom: importTab === "text" ? "2px solid #a33900" : "2px solid transparent",
                }}
              >
                <FileText size={16} />
                Colar Texto
              </button>
            </div>

            <div className="flex-1 overflow-auto p-6">
              {/* Clear existing toggle */}
              <label className="flex items-center gap-2 mb-4 cursor-pointer">
                <input
                  type="checkbox"
                  checked={clearExisting}
                  onChange={(e) => setClearExisting(e.target.checked)}
                  className="rounded"
                  style={{ accentColor: "#cc4900" }}
                />
                <span className="text-sm" style={{ color: "#5a4138" }}>
                  Substituir cardapio existente
                </span>
              </label>

              {importTab === "templates" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {templates.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => applyTemplate(t.id)}
                      disabled={importing}
                      className="text-left rounded-[0.75rem] p-4 transition disabled:opacity-50"
                      style={{
                        background: "#f8f9fb",
                        border: "none",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "#edeef0";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "#f8f9fb";
                      }}
                    >
                      <h3 className="font-semibold" style={{ color: "#191c1e" }}>
                        {t.name}
                      </h3>
                      <p className="text-xs mt-1" style={{ color: "#5a4138" }}>
                        {t.description}
                      </p>
                      <p className="text-xs mt-2 font-medium" style={{ color: "#a33900" }}>
                        {t.categoriesCount} categorias, {t.itemsCount} itens
                      </p>
                    </button>
                  ))}
                </div>
              ) : (
                <div>
                  <p className="text-sm mb-3" style={{ color: "#5a4138" }}>
                    Cole seu cardapio no formato texto. Use linhas em MAIUSCULAS ou com &quot;:&quot; para categorias.
                    Cada item deve ter o preco (ex: R$ 25,00).
                  </p>
                  <textarea
                    value={importText}
                    onChange={(e) => setImportText(e.target.value)}
                    rows={12}
                    placeholder={`LANCHES:\nX-Burger R$ 18,00\nX-Salada R$ 20,00\nX-Bacon R$ 25,00\n\nBEBIDAS:\nCoca-Cola 350ml R$ 6,00\nSuco Natural R$ 8,00\nAgua R$ 4,00`}
                    className="w-full px-3 py-2.5 rounded-[0.75rem] outline-none text-sm font-mono transition"
                    style={{
                      background: "#f8f9fb",
                      color: "#191c1e",
                      border: "none",
                    }}
                    onFocus={(e) => (e.currentTarget.style.boxShadow = "0 0 0 2px #cc4900")}
                    onBlur={(e) => (e.currentTarget.style.boxShadow = "none")}
                  />
                  <button
                    onClick={importFromText}
                    disabled={importing || !importText.trim()}
                    className="mt-3 w-full py-2.5 text-white rounded-[0.75rem] disabled:opacity-50 text-sm font-medium flex items-center justify-center gap-2 transition"
                    style={{ background: "linear-gradient(135deg, #a33900, #cc4900)" }}
                  >
                    {importing ? (
                      <div
                        className="animate-spin rounded-full h-4 w-4"
                        style={{ borderBottom: "2px solid #ffffff" }}
                      />
                    ) : (
                      <Upload size={16} />
                    )}
                    {importing ? "Importando..." : "Importar Cardapio"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Item Modal */}
      {itemModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div
            className="rounded-[0.75rem] w-full max-w-lg mx-4"
            style={{ background: "#ffffff" }}
          >
            <div
              className="flex items-center justify-between px-6 py-4"
              style={{ borderBottom: "1px solid #edeef0" }}
            >
              <h2 className="text-lg font-semibold" style={{ color: "#191c1e" }}>
                {editingItem ? "Editar Item" : "Novo Item"}
              </h2>
              <button
                onClick={() => setItemModal(false)}
                style={{ color: "#5a4138" }}
                className="transition"
                onMouseEnter={(e) => (e.currentTarget.style.color = "#191c1e")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#5a4138")}
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label
                  className="block text-sm font-medium mb-1"
                  style={{ color: "#5a4138" }}
                >
                  Nome
                </label>
                <input
                  type="text"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  placeholder="Ex: Marmita Tradicional"
                  className="w-full px-3 py-2.5 rounded-[0.75rem] outline-none text-sm transition"
                  style={{
                    background: "#f8f9fb",
                    color: "#191c1e",
                    border: "none",
                  }}
                  onFocus={(e) => (e.currentTarget.style.boxShadow = "0 0 0 2px #cc4900")}
                  onBlur={(e) => (e.currentTarget.style.boxShadow = "none")}
                  autoFocus
                />
              </div>

              <div>
                <label
                  className="block text-sm font-medium mb-1"
                  style={{ color: "#5a4138" }}
                >
                  Descricao (opcional)
                </label>
                <input
                  type="text"
                  value={itemDescription}
                  onChange={(e) => setItemDescription(e.target.value)}
                  placeholder="Arroz, feijao, carne..."
                  className="w-full px-3 py-2.5 rounded-[0.75rem] outline-none text-sm transition"
                  style={{
                    background: "#f8f9fb",
                    color: "#191c1e",
                    border: "none",
                  }}
                  onFocus={(e) => (e.currentTarget.style.boxShadow = "0 0 0 2px #cc4900")}
                  onBlur={(e) => (e.currentTarget.style.boxShadow = "none")}
                />
              </div>

              <div>
                <label
                  className="block text-sm font-medium mb-1"
                  style={{ color: "#5a4138" }}
                >
                  Preco (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={itemPrice}
                  onChange={(e) => setItemPrice(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2.5 rounded-[0.75rem] outline-none text-sm transition"
                  style={{
                    background: "#f8f9fb",
                    color: "#191c1e",
                    border: "none",
                  }}
                  onFocus={(e) => (e.currentTarget.style.boxShadow = "0 0 0 2px #cc4900")}
                  onBlur={(e) => (e.currentTarget.style.boxShadow = "none")}
                />
              </div>

              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: "#5a4138" }}
                >
                  Canais
                </label>
                <div className="flex gap-3">
                  {["WHATSAPP", "PDV", "IFOOD"].map((ch) => (
                    <label
                      key={ch}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={itemChannels.includes(ch)}
                        onChange={() => toggleChannel(ch)}
                        className="rounded"
                        style={{ accentColor: "#cc4900" }}
                      />
                      <span
                        className="text-xs font-medium px-2 py-1 rounded-[0.75rem]"
                        style={{
                          background:
                            ch === "WHATSAPP"
                              ? "rgba(34,197,94,0.1)"
                              : ch === "PDV"
                              ? "rgba(59,130,246,0.1)"
                              : "rgba(239,68,68,0.1)",
                          color:
                            ch === "WHATSAPP"
                              ? "#15803d"
                              : ch === "PDV"
                              ? "#1d4ed8"
                              : "#b91c1c",
                        }}
                      >
                        {ch === "IFOOD" ? "iFood" : ch}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {editingItem && (
                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    style={{ color: "#5a4138" }}
                  >
                    Categoria
                  </label>
                  <select
                    value={itemCategoryId}
                    onChange={(e) => setItemCategoryId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-[0.75rem] outline-none text-sm transition"
                    style={{
                      background: "#f8f9fb",
                      color: "#191c1e",
                      border: "none",
                    }}
                    onFocus={(e) => (e.currentTarget.style.boxShadow = "0 0 0 2px #cc4900")}
                    onBlur={(e) => (e.currentTarget.style.boxShadow = "none")}
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div
              className="flex justify-end gap-3 px-6 py-4"
              style={{ borderTop: "1px solid #edeef0" }}
            >
              <button
                onClick={() => setItemModal(false)}
                className="px-4 py-2 text-sm transition"
                style={{ color: "#5a4138" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#191c1e")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#5a4138")}
              >
                Cancelar
              </button>
              <button
                onClick={saveItem}
                disabled={saving || !itemName.trim() || !itemPrice}
                className="px-4 py-2 text-white rounded-[0.75rem] disabled:opacity-50 text-sm font-medium transition"
                style={{ background: "linear-gradient(135deg, #a33900, #cc4900)" }}
              >
                {saving ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
