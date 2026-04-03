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

export default function CardapioPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cardapio</h1>
          <p className="text-sm text-gray-500 mt-1">
            {categories.length} categorias, {totalItems} itens
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={openImport}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-orange-300 text-orange-600 rounded-lg hover:bg-orange-50 transition text-sm font-medium"
          >
            <Upload size={18} />
            Importar
          </button>
          <button
            onClick={openNewCategory}
            className="flex items-center gap-2 px-4 py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition text-sm font-medium"
          >
            <Plus size={18} />
            Nova Categoria
          </button>
        </div>
      </div>

      {categories.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <p className="text-gray-400 text-lg mb-4">Nenhuma categoria criada</p>
          <button
            onClick={openNewCategory}
            className="text-orange-600 hover:text-orange-700 font-medium"
          >
            Criar primeira categoria
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className={`bg-white rounded-lg border ${
                cat.active ? "border-gray-200" : "border-gray-100 opacity-60"
              }`}
            >
              {/* Category Header */}
              <div className="flex items-center gap-3 px-4 py-3">
                <button
                  onClick={() => toggleExpand(cat.id)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  {expanded.has(cat.id) ? (
                    <ChevronDown size={20} />
                  ) : (
                    <ChevronRight size={20} />
                  )}
                </button>

                <div className="flex-1">
                  <span className="font-semibold text-gray-900">{cat.name}</span>
                  <span className="text-xs text-gray-400 ml-2">
                    {cat.items.length} {cat.items.length === 1 ? "item" : "itens"}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openNewItem(cat.id)}
                    className="p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded"
                    title="Adicionar item"
                  >
                    <Plus size={16} />
                  </button>
                  <button
                    onClick={() => toggleCategoryActive(cat)}
                    className={`p-1.5 rounded ${
                      cat.active
                        ? "text-gray-400 hover:text-yellow-600 hover:bg-yellow-50"
                        : "text-yellow-600 hover:text-green-600 hover:bg-green-50"
                    }`}
                    title={cat.active ? "Desativar" : "Ativar"}
                  >
                    {cat.active ? <Eye size={16} /> : <EyeOff size={16} />}
                  </button>
                  <button
                    onClick={() => openEditCategory(cat)}
                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                    title="Editar"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => deleteCategory(cat)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                    title="Excluir"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* Items */}
              {expanded.has(cat.id) && (
                <div className="border-t border-gray-100">
                  {cat.items.length === 0 ? (
                    <div className="px-4 py-6 text-center">
                      <p className="text-sm text-gray-400 mb-2">Nenhum item nesta categoria</p>
                      <button
                        onClick={() => openNewItem(cat.id)}
                        className="text-sm text-orange-600 hover:text-orange-700 font-medium"
                      >
                        Adicionar item
                      </button>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-50">
                      {cat.items.map((item) => (
                        <div
                          key={item.id}
                          className={`flex items-center gap-4 px-4 py-3 pl-12 ${
                            !item.available ? "opacity-50" : ""
                          }`}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-800 text-sm">
                                {item.name}
                              </span>
                              <div className="flex gap-1">
                                {item.channels.map((ch) => (
                                  <span
                                    key={ch}
                                    className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                                      ch === "WHATSAPP"
                                        ? "bg-green-100 text-green-700"
                                        : ch === "PDV"
                                        ? "bg-blue-100 text-blue-700"
                                        : "bg-purple-100 text-purple-700"
                                    }`}
                                  >
                                    {ch}
                                  </span>
                                ))}
                              </div>
                            </div>
                            {item.description && (
                              <p className="text-xs text-gray-400 mt-0.5 truncate">
                                {item.description}
                              </p>
                            )}
                          </div>

                          <span className="font-semibold text-gray-900 text-sm whitespace-nowrap">
                            R$ {Number(item.price).toFixed(2)}
                          </span>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => toggleItemAvailable(item)}
                              className={`p-1.5 rounded ${
                                item.available
                                  ? "text-gray-400 hover:text-yellow-600 hover:bg-yellow-50"
                                  : "text-yellow-600 hover:text-green-600 hover:bg-green-50"
                              }`}
                              title={item.available ? "Indisponibilizar" : "Disponibilizar"}
                            >
                              {item.available ? <Eye size={14} /> : <EyeOff size={14} />}
                            </button>
                            <button
                              onClick={() => openEditItem(item, cat.id)}
                              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                              title="Editar"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              onClick={() => deleteItem(item)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                              title="Excluir"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
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
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingCat ? "Editar Categoria" : "Nova Categoria"}
              </h2>
              <button
                onClick={() => setCatModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome da categoria
              </label>
              <input
                type="text"
                value={catName}
                onChange={(e) => setCatName(e.target.value)}
                placeholder="Ex: Marmitas, Bebidas, Combos..."
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none text-sm"
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && saveCategory()}
              />
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
              <button
                onClick={() => setCatModal(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                Cancelar
              </button>
              <button
                onClick={saveCategory}
                disabled={saving || !catName.trim()}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 text-sm font-medium"
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
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Importar Cardapio</h2>
              <button onClick={() => setImportModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-100">
              <button
                onClick={() => setImportTab("templates")}
                className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition ${
                  importTab === "templates"
                    ? "text-orange-600 border-b-2 border-orange-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <Utensils size={16} />
                Templates Prontos
              </button>
              <button
                onClick={() => setImportTab("text")}
                className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition ${
                  importTab === "text"
                    ? "text-orange-600 border-b-2 border-orange-600"
                    : "text-gray-500 hover:text-gray-700"
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
                  className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                />
                <span className="text-sm text-gray-600">Substituir cardapio existente</span>
              </label>

              {importTab === "templates" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {templates.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => applyTemplate(t.id)}
                      disabled={importing}
                      className="text-left border border-gray-200 rounded-lg p-4 hover:border-orange-400 hover:shadow-md transition disabled:opacity-50"
                    >
                      <h3 className="font-semibold text-gray-900">{t.name}</h3>
                      <p className="text-xs text-gray-500 mt-1">{t.description}</p>
                      <p className="text-xs text-orange-600 mt-2 font-medium">
                        {t.categoriesCount} categorias, {t.itemsCount} itens
                      </p>
                    </button>
                  ))}
                </div>
              ) : (
                <div>
                  <p className="text-sm text-gray-500 mb-3">
                    Cole seu cardapio no formato texto. Use linhas em MAIUSCULAS ou com ":" para categorias.
                    Cada item deve ter o preco (ex: R$ 25,00).
                  </p>
                  <textarea
                    value={importText}
                    onChange={(e) => setImportText(e.target.value)}
                    rows={12}
                    placeholder={`LANCHES:\nX-Burger R$ 18,00\nX-Salada R$ 20,00\nX-Bacon R$ 25,00\n\nBEBIDAS:\nCoca-Cola 350ml R$ 6,00\nSuco Natural R$ 8,00\nAgua R$ 4,00`}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none text-sm font-mono"
                  />
                  <button
                    onClick={importFromText}
                    disabled={importing || !importText.trim()}
                    className="mt-3 w-full py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 text-sm font-medium flex items-center justify-center gap-2"
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
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingItem ? "Editar Item" : "Novo Item"}
              </h2>
              <button
                onClick={() => setItemModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome
                </label>
                <input
                  type="text"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  placeholder="Ex: Marmita Tradicional"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none text-sm"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descricao (opcional)
                </label>
                <input
                  type="text"
                  value={itemDescription}
                  onChange={(e) => setItemDescription(e.target.value)}
                  placeholder="Arroz, feijao, carne..."
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Preco (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={itemPrice}
                  onChange={(e) => setItemPrice(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
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
                        className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                      />
                      <span
                        className={`text-xs font-medium px-2 py-1 rounded ${
                          ch === "WHATSAPP"
                            ? "bg-green-100 text-green-700"
                            : ch === "PDV"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-purple-100 text-purple-700"
                        }`}
                      >
                        {ch}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {editingItem && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Categoria
                  </label>
                  <select
                    value={itemCategoryId}
                    onChange={(e) => setItemCategoryId(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none text-sm"
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

            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
              <button
                onClick={() => setItemModal(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                Cancelar
              </button>
              <button
                onClick={saveItem}
                disabled={saving || !itemName.trim() || !itemPrice}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 text-sm font-medium"
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
