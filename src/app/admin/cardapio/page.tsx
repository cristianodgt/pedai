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
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#a33900]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-[#f8f9fb]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#191c1e]">
            Gestao de Cardapio
          </h1>
          <p className="text-sm mt-1 text-[#5a4138]">
            Gerencie categorias, itens e canais de venda em tempo real.
          </p>
        </div>
        <div className="flex gap-3">
          {/* Import dropdown button */}
          <div className="relative">
            <Button
              variant="outline"
              onClick={() => setImportDropdown(!importDropdown)}
            >
              <Download size={16} />
              Importar
              <ChevronDown size={14} />
            </Button>
            {importDropdown && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setImportDropdown(false)} />
                <div className="absolute right-0 mt-2 w-48 rounded-[0.75rem] z-20 py-1 bg-white">
                  <button
                    onClick={openImport}
                    className="w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 transition text-[#191c1e] hover:bg-[#f8f9fb]"
                  >
                    <Utensils size={14} />
                    Templates Prontos
                  </button>
                  <button
                    onClick={() => { setImportDropdown(false); setImportModal(true); setImportTab("text"); }}
                    className="w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 transition text-[#191c1e] hover:bg-[#f8f9fb]"
                  >
                    <FileText size={14} />
                    Colar Texto
                  </button>
                </div>
              </>
            )}
          </div>
          {/* Nova Categoria */}
          <Button variant="default" onClick={openNewCategory}>
            <Plus size={16} />
            Nova Categoria
          </Button>
        </div>
      </div>

      {categories.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-[rgba(163,57,0,0.08)]">
            <Utensils size={28} className="text-[#a33900]" />
          </div>
          <p className="text-lg mb-4 text-[#5a4138]">
            Nenhuma categoria criada
          </p>
          <Button variant="link" onClick={openNewCategory}>
            Criar primeira categoria
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {categories.map((cat) => (
            <Card
              key={cat.id}
              className={`overflow-hidden ${!cat.active ? "opacity-60" : ""}`}
            >
              {/* Category Header */}
              <div
                className="flex items-center gap-4 px-5 py-4 cursor-pointer transition bg-white hover:bg-[#f8f9fb]"
                onClick={() => toggleExpand(cat.id)}
              >
                {/* Category emoji in tonal circle */}
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0 bg-[rgba(163,57,0,0.08)]">
                  {getCategoryEmoji(cat.name)}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-[#191c1e]">
                    {cat.name}
                  </h3>
                  <p className="text-xs text-[#5a4138]">
                    {cat.items.length} {cat.items.length === 1 ? "item" : "itens"}
                  </p>
                </div>

                {/* Channel badges */}
                <div className="flex items-center gap-1.5">
                  {cat.items.some(i => i.channels.includes("WHATSAPP")) && (
                    <Badge variant="whatsapp" title="WhatsApp" className="w-6 h-6 rounded-full text-[10px] px-0">
                      W
                    </Badge>
                  )}
                  {cat.items.some(i => i.channels.includes("PDV")) && (
                    <Badge variant="pdv" title="PDV" className="w-6 h-6 rounded-full text-[10px] px-0">
                      P
                    </Badge>
                  )}
                  {cat.items.some(i => i.channels.includes("IFOOD")) && (
                    <Badge variant="ifood" title="iFood" className="w-6 h-6 rounded-full text-[10px] px-0">
                      i
                    </Badge>
                  )}
                </div>

                {/* Edit pencil */}
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={(e) => { e.stopPropagation(); openEditCategory(cat); }}
                  title="Editar categoria"
                >
                  <Pencil size={16} />
                </Button>

                {/* Expand/collapse chevron */}
                <div className="text-[#5a4138]">
                  {expanded.has(cat.id) ? (
                    <ChevronDown size={20} />
                  ) : (
                    <ChevronRight size={20} />
                  )}
                </div>
              </div>

              {/* Items */}
              {expanded.has(cat.id) && (
                <div className="bg-[#edeef0]">
                  {cat.items.length === 0 ? (
                    <div className="px-5 py-8 text-center">
                      <p className="text-sm mb-3 text-[#5a4138]">
                        Nenhum item nesta categoria
                      </p>
                      <Button variant="link" onClick={() => openNewItem(cat.id)}>
                        + Adicionar item
                      </Button>
                    </div>
                  ) : (
                    <div>
                      {cat.items.map((item, idx) => (
                        <div
                          key={item.id}
                          className={`px-5 py-4 ${
                            !item.available ? "opacity-50" : ""
                          } ${idx % 2 === 0 ? "bg-[#f8f9fb]" : "bg-white"}`}
                        >
                          <div className="flex items-center gap-4">
                            {/* Image placeholder */}
                            <div className="w-[60px] h-[60px] rounded-[0.75rem] flex items-center justify-center flex-shrink-0 bg-[#edeef0]">
                              <Utensils size={20} className="text-[#5a4138] opacity-40" />
                            </div>

                            {/* Name + description */}
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-sm text-[#191c1e]">
                                {item.name}
                              </p>
                              {item.description && (
                                <p className="text-xs mt-0.5 truncate text-[#5a4138]">
                                  {item.description}
                                </p>
                              )}
                            </div>

                            {/* Price */}
                            <div className="text-right flex-shrink-0">
                              <p className="text-xs uppercase tracking-wide text-[#5a4138]">
                                Preco unitario
                              </p>
                              <p className="font-semibold text-sm text-[#191c1e]">
                                R$ {Number(item.price).toFixed(2).replace(".", ",")}
                              </p>
                            </div>

                            {/* Availability toggle */}
                            <button
                              onClick={() => toggleItemAvailable(item)}
                              className="flex-shrink-0"
                            >
                              <div
                                className={`relative w-12 h-6 rounded-full transition-colors ${
                                  item.available ? "bg-[#cc4900]" : "bg-[#edeef0]"
                                }`}
                              >
                                <div
                                  className={`absolute top-0.5 w-5 h-5 rounded-full transition-transform bg-white ${
                                    item.available ? "translate-x-6" : "translate-x-0.5"
                                  }`}
                                />
                              </div>
                              <p
                                className={`text-[10px] font-medium mt-1 text-center ${
                                  item.available ? "text-[#a33900]" : "text-[#5a4138]"
                                }`}
                              >
                                {item.available ? "DISPONIVEL" : "INDISPONIVEL"}
                              </p>
                            </button>

                            {/* Three-dot menu */}
                            <div className="relative flex-shrink-0">
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => setItemMenu(itemMenu === item.id ? null : item.id)}
                              >
                                <MoreVertical size={16} />
                              </Button>
                              {itemMenu === item.id && (
                                <>
                                  <div className="fixed inset-0 z-10" onClick={() => setItemMenu(null)} />
                                  <div className="absolute right-0 mt-1 w-36 rounded-[0.75rem] z-20 py-1 bg-white">
                                    <button
                                      onClick={() => { setItemMenu(null); openEditItem(item, cat.id); }}
                                      className="w-full text-left px-4 py-2 text-sm flex items-center gap-2 transition text-[#191c1e] hover:bg-[#f8f9fb]"
                                    >
                                      <Pencil size={14} />
                                      Editar
                                    </button>
                                    <button
                                      onClick={() => { setItemMenu(null); toggleCategoryActive(cat); }}
                                      className="w-full text-left px-4 py-2 text-sm flex items-center gap-2 transition text-[#191c1e] hover:bg-[#f8f9fb]"
                                    >
                                      {cat.active ? <EyeOff size={14} /> : <Eye size={14} />}
                                      {cat.active ? "Desativar" : "Ativar"}
                                    </button>
                                    <button
                                      onClick={() => { setItemMenu(null); deleteItem(item); }}
                                      className="w-full text-left px-4 py-2 text-sm flex items-center gap-2 transition text-red-700 hover:bg-red-50"
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
                              className={`text-xs ${
                                item.channels.includes("WHATSAPP") ? "text-[#15803d]" : "text-[rgba(90,65,56,0.35)]"
                              }`}
                            >
                              {item.channels.includes("WHATSAPP") ? "\u2705" : "\u2B1C"} WhatsApp
                            </span>
                            <span
                              className={`text-xs ${
                                item.channels.includes("PDV") ? "text-[#1d4ed8]" : "text-[rgba(90,65,56,0.35)]"
                              }`}
                            >
                              {item.channels.includes("PDV") ? "\u2705" : "\u2B1C"} PDV
                            </span>
                            <span
                              className={`text-xs ${
                                item.channels.includes("IFOOD") ? "text-[#b91c1c]" : "text-[rgba(90,65,56,0.35)]"
                              }`}
                            >
                              {item.channels.includes("IFOOD") ? "\u2705" : "\u2B1C"} iFood
                            </span>
                          </div>
                        </div>
                      ))}

                      {/* Add item button */}
                      <Button
                        variant="link"
                        onClick={() => openNewItem(cat.id)}
                        className="w-full py-3 flex items-center justify-center gap-1 rounded-none border-t border-dashed border-[#e2bfb2]"
                      >
                        <Plus size={16} />
                        Adicionar Item
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Category Modal */}
      {catModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#edeef0]">
              <h2 className="text-lg font-semibold text-[#191c1e]">
                {editingCat ? "Editar Categoria" : "Nova Categoria"}
              </h2>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setCatModal(false)}
              >
                <X size={20} />
              </Button>
            </div>

            <div className="p-6">
              <label className="block text-sm font-medium mb-1 text-[#5a4138]">
                Nome da categoria
              </label>
              <Input
                type="text"
                value={catName}
                onChange={(e) => setCatName(e.target.value)}
                placeholder="Ex: Marmitas, Bebidas, Combos..."
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && saveCategory()}
              />
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 border-t border-[#edeef0]">
              <Button variant="ghost" onClick={() => setCatModal(false)}>
                Cancelar
              </Button>
              <Button
                variant="default"
                onClick={saveCategory}
                disabled={saving || !catName.trim()}
              >
                {saving ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Import Modal */}
      {importModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#edeef0]">
              <h2 className="text-lg font-semibold text-[#191c1e]">
                Importar Cardapio
              </h2>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setImportModal(false)}
              >
                <X size={20} />
              </Button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-[#edeef0]">
              <button
                onClick={() => setImportTab("templates")}
                className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition border-b-2 ${
                  importTab === "templates"
                    ? "text-[#a33900] border-b-[#a33900]"
                    : "text-[#5a4138] border-b-transparent"
                }`}
              >
                <Utensils size={16} />
                Templates Prontos
              </button>
              <button
                onClick={() => setImportTab("text")}
                className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition border-b-2 ${
                  importTab === "text"
                    ? "text-[#a33900] border-b-[#a33900]"
                    : "text-[#5a4138] border-b-transparent"
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
                  className="rounded accent-[#cc4900]"
                />
                <span className="text-sm text-[#5a4138]">
                  Substituir cardapio existente
                </span>
              </label>

              {importTab === "templates" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {templates.map((t) => (
                    <Card
                      key={t.id}
                      className="cursor-pointer transition hover:bg-[#edeef0] bg-[#f8f9fb] disabled:opacity-50"
                      onClick={() => !importing && applyTemplate(t.id)}
                    >
                      <CardContent className="p-4 pt-4">
                        <h3 className="font-semibold text-[#191c1e]">
                          {t.name}
                        </h3>
                        <p className="text-xs mt-1 text-[#5a4138]">
                          {t.description}
                        </p>
                        <p className="text-xs mt-2 font-medium text-[#a33900]">
                          {t.categoriesCount} categorias, {t.itemsCount} itens
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div>
                  <p className="text-sm mb-3 text-[#5a4138]">
                    Cole seu cardapio no formato texto. Use linhas em MAIUSCULAS ou com &quot;:&quot; para categorias.
                    Cada item deve ter o preco (ex: R$ 25,00).
                  </p>
                  <textarea
                    value={importText}
                    onChange={(e) => setImportText(e.target.value)}
                    rows={12}
                    placeholder={`LANCHES:\nX-Burger R$ 18,00\nX-Salada R$ 20,00\nX-Bacon R$ 25,00\n\nBEBIDAS:\nCoca-Cola 350ml R$ 6,00\nSuco Natural R$ 8,00\nAgua R$ 4,00`}
                    className="w-full px-3 py-2.5 rounded-[0.75rem] outline-none text-sm font-mono transition bg-[#edeef0] text-[#191c1e] border-b-2 border-b-transparent focus:border-b-[#EA580C]"
                  />
                  <Button
                    variant="default"
                    onClick={importFromText}
                    disabled={importing || !importText.trim()}
                    className="mt-3 w-full"
                  >
                    {importing ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    ) : (
                      <Upload size={16} />
                    )}
                    {importing ? "Importando..." : "Importar Cardapio"}
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Item Modal */}
      {itemModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-lg mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#edeef0]">
              <h2 className="text-lg font-semibold text-[#191c1e]">
                {editingItem ? "Editar Item" : "Novo Item"}
              </h2>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setItemModal(false)}
              >
                <X size={20} />
              </Button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-[#5a4138]">
                  Nome
                </label>
                <Input
                  type="text"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  placeholder="Ex: Marmita Tradicional"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-[#5a4138]">
                  Descricao (opcional)
                </label>
                <Input
                  type="text"
                  value={itemDescription}
                  onChange={(e) => setItemDescription(e.target.value)}
                  placeholder="Arroz, feijao, carne..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-[#5a4138]">
                  Preco (R$)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={itemPrice}
                  onChange={(e) => setItemPrice(e.target.value)}
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-[#5a4138]">
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
                        className="rounded accent-[#cc4900]"
                      />
                      <Badge
                        variant={
                          ch === "WHATSAPP"
                            ? "whatsapp"
                            : ch === "PDV"
                            ? "pdv"
                            : "ifood"
                        }
                      >
                        {ch === "IFOOD" ? "iFood" : ch}
                      </Badge>
                    </label>
                  ))}
                </div>
              </div>

              {editingItem && (
                <div>
                  <label className="block text-sm font-medium mb-1 text-[#5a4138]">
                    Categoria
                  </label>
                  <select
                    value={itemCategoryId}
                    onChange={(e) => setItemCategoryId(e.target.value)}
                    className="w-full h-10 px-3.5 py-2 rounded-[0.75rem] outline-none text-sm transition bg-[#edeef0] text-[#191c1e] border-b-2 border-b-transparent focus:border-b-[#EA580C]"
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

            <div className="flex justify-end gap-3 px-6 py-4 border-t border-[#edeef0]">
              <Button variant="ghost" onClick={() => setItemModal(false)}>
                Cancelar
              </Button>
              <Button
                variant="default"
                onClick={saveItem}
                disabled={saving || !itemName.trim() || !itemPrice}
              >
                {saving ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
