"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  X,
  Upload,
  FileText,
  Utensils,
  Download,
  MoreVertical,
  LayoutGrid,
  FileEdit,
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
  image: string | null;
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
  const [itemImage, setItemImage] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);

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
    setItemImage("");
    setUploadingImage(false);
    setItemModal(true);
  };

  const openEditItem = (item: MenuItem, categoryId: string) => {
    setEditingItem(item);
    setItemCategoryId(categoryId);
    setItemName(item.name);
    setItemDescription(item.description || "");
    setItemPrice(String(item.price));
    setItemChannels(item.channels);
    setItemImage(item.image || "");
    setUploadingImage(false);
    setItemModal(true);
  };

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (res.ok) {
        const { url } = await res.json();
        setItemImage(url);
      }
    } finally {
      setUploadingImage(false);
    }
  }

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
        image: itemImage || null,
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#a33900]" />
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-[#191c1e]">
            Gestao de Cardapio
          </h2>
          <p className="text-zinc-500 text-sm mt-1">
            Gerencie categorias, itens e canais de venda em tempo real.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Import Dropdown Trigger */}
          <div className="relative group">
            <button
              className="flex items-center gap-2 px-5 py-2.5 bg-white text-[#a33900] font-bold rounded-full hover:bg-[#edeef0] transition-all"
              onClick={() => setImportDropdown(!importDropdown)}
            >
              <Upload size={18} />
              Importar
              <ChevronDown size={14} />
            </button>
            {importDropdown && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setImportDropdown(false)} />
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 z-50">
                  <div className="p-2">
                    <button
                      onClick={openImport}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-[#f3f4f6] rounded-lg transition-colors flex items-center gap-2 text-[#191c1e]"
                    >
                      <LayoutGrid size={16} />
                      Templates
                    </button>
                    <button
                      onClick={() => { setImportDropdown(false); setImportModal(true); setImportTab("text"); }}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-[#f3f4f6] rounded-lg transition-colors flex items-center gap-2 text-[#191c1e]"
                    >
                      <FileEdit size={16} />
                      Texto Livre
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
          {/* Nova Categoria */}
          <button
            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-br from-[#a33900] to-[#cc4900] text-white font-bold rounded-full hover:opacity-90 transition-all shadow-md"
            onClick={openNewCategory}
          >
            <Plus size={18} />
            Nova Categoria
          </button>
        </div>
      </div>

      {categories.length === 0 ? (
        /* Empty State */
        <div className="bg-white rounded-[1.5rem] p-12 text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-orange-50">
            <Utensils size={28} className="text-[#a33900]" />
          </div>
          <p className="text-lg font-bold mb-2 text-[#191c1e]">
            Nenhuma categoria criada
          </p>
          <p className="text-sm text-zinc-500 mb-4">
            Comece adicionando sua primeira categoria de cardapio.
          </p>
          <button
            className="text-[#a33900] font-bold hover:underline"
            onClick={openNewCategory}
          >
            Criar primeira categoria
          </button>
        </div>
      ) : (
        /* Categories Grid */
        <div className="grid grid-cols-1 gap-6">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className={`bg-white rounded-[1.5rem] overflow-hidden ${
                !cat.active ? "opacity-60" : ""
              } ${
                !expanded.has(cat.id) ? "border border-transparent hover:border-[rgba(163,57,0,0.2)]" : ""
              } transition-all`}
            >
              {/* Category Header */}
              <div
                className={`p-6 flex items-center justify-between cursor-pointer ${
                  expanded.has(cat.id) ? "border-b border-[#f3f4f6]" : ""
                }`}
                onClick={() => toggleExpand(cat.id)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-2xl">
                    {getCategoryEmoji(cat.name)}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-[#191c1e]">
                      {cat.name}
                    </h3>
                    <p className="text-xs text-zinc-500">
                      {cat.items.length} {cat.items.length === 1 ? "item" : "itens"}{" "}
                      {cat.items.filter((i) => i.available).length > 0
                        ? `disponíveis`
                        : ""}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {/* Channel badge stack */}
                  <div className="flex -space-x-2">
                    {cat.items.some((i) => i.channels.includes("WHATSAPP")) && (
                      <span
                        className="w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center border-2 border-white text-[10px] font-bold"
                        title="WhatsApp"
                      >
                        W
                      </span>
                    )}
                    {cat.items.some((i) => i.channels.includes("PDV")) && (
                      <span
                        className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center border-2 border-white text-[10px] font-bold"
                        title="PDV"
                      >
                        P
                      </span>
                    )}
                    {cat.items.some((i) => i.channels.includes("IFOOD")) && (
                      <span
                        className="w-8 h-8 rounded-full bg-red-100 text-red-700 flex items-center justify-center border-2 border-white text-[10px] font-bold"
                        title="iFood"
                      >
                        i
                      </span>
                    )}
                  </div>

                  {/* Edit button */}
                  <button
                    className="p-2 hover:bg-[#edeef0] rounded-lg transition-colors text-[#5a4138]"
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditCategory(cat);
                    }}
                    title="Editar categoria"
                  >
                    <Pencil size={18} />
                  </button>

                  {/* Expand/collapse */}
                  <button className="p-2 hover:bg-[#edeef0] rounded-lg transition-colors text-[#5a4138]">
                    {expanded.has(cat.id) ? (
                      <ChevronUp size={20} />
                    ) : (
                      <ChevronDown size={20} />
                    )}
                  </button>
                </div>
              </div>

              {/* Items List */}
              {expanded.has(cat.id) && (
                <>
                  <div className="divide-y divide-[#f3f4f6]">
                    {cat.items.length === 0 ? (
                      <div className="p-8 text-center">
                        <p className="text-sm text-zinc-500 mb-3">
                          Nenhum item nesta categoria
                        </p>
                        <button
                          className="text-[#a33900] font-bold text-sm hover:underline"
                          onClick={() => openNewItem(cat.id)}
                        >
                          + Adicionar item
                        </button>
                      </div>
                    ) : (
                      cat.items.map((item) => (
                        <div
                          key={item.id}
                          className={`p-6 flex items-center justify-between hover:bg-[#f8f9fb]/50 transition-colors ${
                            !item.available ? "opacity-50" : ""
                          }`}
                        >
                          <div className="flex items-center gap-5 flex-1">
                            {/* Item image */}
                            <div className="w-16 h-16 rounded-xl bg-[#edeef0] overflow-hidden shrink-0 flex items-center justify-center">
                              {item.image ? (
                                <img
                                  src={item.image}
                                  alt={item.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <Utensils size={22} className="text-[#5a4138] opacity-40" />
                              )}
                            </div>

                            <div className="space-y-1">
                              <h4 className="font-bold text-[#191c1e]">
                                {item.name}
                              </h4>
                              {item.description && (
                                <p className="text-sm text-zinc-500 leading-relaxed max-w-md">
                                  {item.description}
                                </p>
                              )}
                              {/* Channel checkboxes inline */}
                              <div className="flex items-center gap-4 pt-1">
                                <label className="flex items-center gap-1.5 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={item.channels.includes("WHATSAPP")}
                                    readOnly
                                    className="rounded-md border-gray-300 text-[#a33900] focus:ring-[#a33900] h-4 w-4"
                                  />
                                  <span
                                    className={`text-xs font-medium ${
                                      item.channels.includes("WHATSAPP")
                                        ? "text-zinc-600"
                                        : "text-zinc-400"
                                    }`}
                                  >
                                    WhatsApp
                                  </span>
                                </label>
                                <label className="flex items-center gap-1.5 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={item.channels.includes("PDV")}
                                    readOnly
                                    className="rounded-md border-gray-300 text-[#a33900] focus:ring-[#a33900] h-4 w-4"
                                  />
                                  <span
                                    className={`text-xs font-medium ${
                                      item.channels.includes("PDV")
                                        ? "text-zinc-600"
                                        : "text-zinc-400"
                                    }`}
                                  >
                                    PDV
                                  </span>
                                </label>
                                <label className="flex items-center gap-1.5 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={item.channels.includes("IFOOD")}
                                    readOnly
                                    className="rounded-md border-gray-300 text-[#a33900] focus:ring-[#a33900] h-4 w-4"
                                  />
                                  <span
                                    className={`text-xs font-medium ${
                                      item.channels.includes("IFOOD")
                                        ? "text-zinc-600"
                                        : "text-zinc-400"
                                    }`}
                                  >
                                    iFood
                                  </span>
                                </label>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-12">
                            {/* Price */}
                            <div className="text-right">
                              <p className="text-lg font-black text-[#191c1e]">
                                R$ {Number(item.price).toFixed(2).replace(".", ",")}
                              </p>
                              <p className="text-[10px] text-zinc-400 uppercase tracking-wider font-bold">
                                Preco Unitario
                              </p>
                            </div>

                            <div className="flex items-center gap-6">
                              {/* Availability toggle */}
                              <div className="flex flex-col items-center">
                                <button
                                  onClick={() => toggleItemAvailable(item)}
                                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                    item.available ? "bg-green-500" : "bg-zinc-300"
                                  }`}
                                >
                                  <span
                                    className={`${
                                      item.available ? "translate-x-5" : "translate-x-0"
                                    } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                                  />
                                </button>
                                <span
                                  className={`text-[10px] mt-1 font-bold uppercase ${
                                    item.available ? "text-green-600" : "text-zinc-400"
                                  }`}
                                >
                                  {item.available ? "Disponivel" : "Indisponivel"}
                                </span>
                              </div>

                              {/* Three-dot menu */}
                              <div className="relative">
                                <button
                                  className="p-2 text-zinc-400 hover:text-[#a33900] transition-colors"
                                  onClick={() =>
                                    setItemMenu(itemMenu === item.id ? null : item.id)
                                  }
                                >
                                  <MoreVertical size={18} />
                                </button>
                                {itemMenu === item.id && (
                                  <>
                                    <div
                                      className="fixed inset-0 z-10"
                                      onClick={() => setItemMenu(null)}
                                    />
                                    <div className="absolute right-0 mt-1 w-40 bg-white rounded-xl shadow-xl border border-gray-100 z-20">
                                      <div className="p-2">
                                        <button
                                          onClick={() => {
                                            setItemMenu(null);
                                            openEditItem(item, cat.id);
                                          }}
                                          className="w-full text-left px-4 py-2 text-sm hover:bg-[#f3f4f6] rounded-lg transition-colors flex items-center gap-2 text-[#191c1e]"
                                        >
                                          <Pencil size={14} />
                                          Editar
                                        </button>
                                        <button
                                          onClick={() => {
                                            setItemMenu(null);
                                            toggleCategoryActive(cat);
                                          }}
                                          className="w-full text-left px-4 py-2 text-sm hover:bg-[#f3f4f6] rounded-lg transition-colors flex items-center gap-2 text-[#191c1e]"
                                        >
                                          {cat.active ? (
                                            <EyeOff size={14} />
                                          ) : (
                                            <Eye size={14} />
                                          )}
                                          {cat.active ? "Desativar" : "Ativar"}
                                        </button>
                                        <button
                                          onClick={() => {
                                            setItemMenu(null);
                                            deleteItem(item);
                                          }}
                                          className="w-full text-left px-4 py-2 text-sm hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2 text-[#ba1a1a]"
                                        >
                                          <Trash2 size={14} />
                                          Excluir
                                        </button>
                                      </div>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Add Item Button */}
                  {cat.items.length > 0 && (
                    <div className="p-4 bg-[#edeef0]/30 border-t border-[#f3f4f6]">
                      <button
                        className="w-full py-3 flex items-center justify-center gap-2 text-[#a33900] font-bold hover:bg-[#f3f4f6] transition-all rounded-xl border-2 border-dashed border-[rgba(163,57,0,0.2)]"
                        onClick={() => openNewItem(cat.id)}
                      >
                        <Plus size={18} />
                        Adicionar Item
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Category Modal */}
      {catModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="w-full max-w-md mx-4 bg-white rounded-[1.5rem] overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#f3f4f6]">
              <h2 className="text-xl font-bold text-[#191c1e]">
                {editingCat ? "Editar Categoria" : "Nova Categoria"}
              </h2>
              <button
                className="p-2 hover:bg-[#edeef0] rounded-lg transition-colors text-[#5a4138]"
                onClick={() => setCatModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              <label className="block text-sm font-medium mb-2 text-[#5a4138]">
                Nome da categoria
              </label>
              <input
                type="text"
                value={catName}
                onChange={(e) => setCatName(e.target.value)}
                placeholder="Ex: Marmitas, Bebidas, Combos..."
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && saveCategory()}
                className="w-full h-12 px-4 rounded-xl outline-none text-sm transition bg-[#e7e8ea] text-[#191c1e] border-b-2 border-b-transparent focus:border-b-[#a33900] placeholder:text-zinc-400"
              />
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 border-t border-[#f3f4f6]">
              <button
                className="px-5 py-2.5 text-[#5a4138] font-medium hover:bg-[#edeef0] rounded-full transition-colors"
                onClick={() => setCatModal(false)}
              >
                Cancelar
              </button>
              <button
                className="px-6 py-2.5 bg-gradient-to-br from-[#a33900] to-[#cc4900] text-white font-bold rounded-full hover:opacity-90 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={saveCategory}
                disabled={saving || !catName.trim()}
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
          <div className="w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col bg-white rounded-[1.5rem] overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#f3f4f6]">
              <h2 className="text-xl font-bold text-[#191c1e]">
                Importar Cardapio
              </h2>
              <button
                className="p-2 hover:bg-[#edeef0] rounded-lg transition-colors text-[#5a4138]"
                onClick={() => setImportModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-[#f3f4f6]">
              <button
                onClick={() => setImportTab("templates")}
                className={`flex-1 py-3.5 text-sm font-bold flex items-center justify-center gap-2 transition border-b-2 ${
                  importTab === "templates"
                    ? "text-[#a33900] border-b-[#a33900]"
                    : "text-zinc-500 border-b-transparent hover:text-[#191c1e]"
                }`}
              >
                <Utensils size={16} />
                Templates Prontos
              </button>
              <button
                onClick={() => setImportTab("text")}
                className={`flex-1 py-3.5 text-sm font-bold flex items-center justify-center gap-2 transition border-b-2 ${
                  importTab === "text"
                    ? "text-[#a33900] border-b-[#a33900]"
                    : "text-zinc-500 border-b-transparent hover:text-[#191c1e]"
                }`}
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
                  className="rounded-md border-gray-300 text-[#a33900] focus:ring-[#a33900] h-4 w-4"
                />
                <span className="text-sm text-zinc-500">
                  Substituir cardapio existente
                </span>
              </label>

              {importTab === "templates" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {templates.map((t) => (
                    <div
                      key={t.id}
                      className="cursor-pointer transition bg-[#f3f4f6] hover:bg-[#edeef0] rounded-xl p-4 disabled:opacity-50"
                      onClick={() => !importing && applyTemplate(t.id)}
                    >
                      <h3 className="font-bold text-[#191c1e]">
                        {t.name}
                      </h3>
                      <p className="text-xs mt-1 text-zinc-500">
                        {t.description}
                      </p>
                      <p className="text-xs mt-2 font-bold text-[#a33900]">
                        {t.categoriesCount} categorias, {t.itemsCount} itens
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div>
                  <p className="text-sm mb-3 text-zinc-500">
                    Cole seu cardapio no formato texto. Use linhas em MAIUSCULAS ou com &quot;:&quot; para categorias.
                    Cada item deve ter o preco (ex: R$ 25,00).
                  </p>
                  <textarea
                    value={importText}
                    onChange={(e) => setImportText(e.target.value)}
                    rows={12}
                    placeholder={`LANCHES:\nX-Burger R$ 18,00\nX-Salada R$ 20,00\nX-Bacon R$ 25,00\n\nBEBIDAS:\nCoca-Cola 350ml R$ 6,00\nSuco Natural R$ 8,00\nAgua R$ 4,00`}
                    className="w-full px-4 py-3 rounded-xl outline-none text-sm font-mono transition bg-[#e7e8ea] text-[#191c1e] border-b-2 border-b-transparent focus:border-b-[#a33900] placeholder:text-zinc-400"
                  />
                  <button
                    className="mt-3 w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-br from-[#a33900] to-[#cc4900] text-white font-bold rounded-full hover:opacity-90 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={importFromText}
                    disabled={importing || !importText.trim()}
                  >
                    {importing ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
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
          <div className="w-full max-w-lg mx-4 bg-white rounded-[1.5rem] overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#f3f4f6]">
              <h2 className="text-xl font-bold text-[#191c1e]">
                {editingItem ? "Editar Item" : "Novo Item"}
              </h2>
              <button
                className="p-2 hover:bg-[#edeef0] rounded-lg transition-colors text-[#5a4138]"
                onClick={() => setItemModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-[#5a4138]">
                  Nome
                </label>
                <input
                  type="text"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  placeholder="Ex: Marmita Tradicional"
                  autoFocus
                  className="w-full h-12 px-4 rounded-xl outline-none text-sm transition bg-[#e7e8ea] text-[#191c1e] border-b-2 border-b-transparent focus:border-b-[#a33900] placeholder:text-zinc-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-[#5a4138]">
                  Descricao (opcional)
                </label>
                <input
                  type="text"
                  value={itemDescription}
                  onChange={(e) => setItemDescription(e.target.value)}
                  placeholder="Arroz, feijao, carne..."
                  className="w-full h-12 px-4 rounded-xl outline-none text-sm transition bg-[#e7e8ea] text-[#191c1e] border-b-2 border-b-transparent focus:border-b-[#a33900] placeholder:text-zinc-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-[#5a4138]">
                  Preco (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={itemPrice}
                  onChange={(e) => setItemPrice(e.target.value)}
                  placeholder="0.00"
                  className="w-full h-12 px-4 rounded-xl outline-none text-sm transition bg-[#e7e8ea] text-[#191c1e] border-b-2 border-b-transparent focus:border-b-[#a33900] placeholder:text-zinc-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-[#5a4138]">
                  Imagem
                </label>
                <div className="border-2 border-dashed border-[#e2bfb2] rounded-xl p-4 text-center cursor-pointer hover:border-[#a33900] transition-colors">
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" id="image-upload" />
                  <label htmlFor="image-upload" className="cursor-pointer flex flex-col items-center gap-2">
                    {uploadingImage ? (
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#a33900]" />
                    ) : itemImage ? (
                      <img src={itemImage} className="w-20 h-20 object-cover rounded-xl" alt="Preview" />
                    ) : (
                      <>
                        <Upload size={24} className="text-[#5a4138] opacity-50" />
                        <span className="text-sm text-[#5a4138]">Clique para enviar foto</span>
                        <span className="text-xs text-zinc-400">JPG, PNG, WebP — máx 5MB</span>
                      </>
                    )}
                  </label>
                  {itemImage && (
                    <button onClick={() => setItemImage("")} className="mt-2 text-xs text-[#ba1a1a] hover:underline">Remover imagem</button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-[#5a4138]">
                  Canais
                </label>
                <div className="flex gap-4">
                  {["WHATSAPP", "PDV", "IFOOD"].map((ch) => (
                    <label
                      key={ch}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={itemChannels.includes(ch)}
                        onChange={() => toggleChannel(ch)}
                        className="rounded-md border-gray-300 text-[#a33900] focus:ring-[#a33900] h-4 w-4"
                      />
                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                          ch === "WHATSAPP"
                            ? "bg-green-100 text-green-700"
                            : ch === "PDV"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {ch === "IFOOD" ? "iFood" : ch}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {editingItem && (
                <div>
                  <label className="block text-sm font-medium mb-2 text-[#5a4138]">
                    Categoria
                  </label>
                  <select
                    value={itemCategoryId}
                    onChange={(e) => setItemCategoryId(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl outline-none text-sm transition bg-[#e7e8ea] text-[#191c1e] border-b-2 border-b-transparent focus:border-b-[#a33900]"
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

            <div className="flex justify-end gap-3 px-6 py-4 border-t border-[#f3f4f6]">
              <button
                className="px-5 py-2.5 text-[#5a4138] font-medium hover:bg-[#edeef0] rounded-full transition-colors"
                onClick={() => setItemModal(false)}
              >
                Cancelar
              </button>
              <button
                className="px-6 py-2.5 bg-gradient-to-br from-[#a33900] to-[#cc4900] text-white font-bold rounded-full hover:opacity-90 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={saveItem}
                disabled={saving || !itemName.trim() || !itemPrice}
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
