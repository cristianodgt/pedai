"use client";

import { useEffect, useState } from "react";
import { Save, Store, Clock, MapPin, Phone, Globe, Plus, Trash2, Check } from "lucide-react";

type DeliveryZone = {
  neighborhood: string;
  fee: number;
};

type TenantSettings = {
  openTime?: string;
  closeTime?: string;
  closedDays?: number[];
  deliveryZones?: DeliveryZone[];
  minOrderValue?: number;
  estimatedTime?: number;
  whatsappWebhook?: string;
};

type Tenant = {
  id: string;
  name: string;
  slug: string;
  phone: string | null;
  address: string | null;
  timezone: string;
  settings: TenantSettings;
};

const daysOfWeek = [
  { key: 0, label: "Dom" },
  { key: 1, label: "Seg" },
  { key: 2, label: "Ter" },
  { key: 3, label: "Qua" },
  { key: 4, label: "Qui" },
  { key: 5, label: "Sex" },
  { key: 6, label: "Sab" },
];

export default function ConfigPage() {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Form fields
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [timezone, setTimezone] = useState("America/Sao_Paulo");
  const [openTime, setOpenTime] = useState("08:00");
  const [closeTime, setCloseTime] = useState("22:00");
  const [closedDays, setClosedDays] = useState<number[]>([]);
  const [deliveryZones, setDeliveryZones] = useState<DeliveryZone[]>([]);
  const [minOrderValue, setMinOrderValue] = useState("");
  const [estimatedTime, setEstimatedTime] = useState("");
  const [whatsappWebhook, setWhatsappWebhook] = useState("");

  useEffect(() => {
    async function fetchTenant() {
      try {
        const res = await fetch("/api/tenant");
        if (res.ok) {
          const data = await res.json();
          const t: Tenant = data.tenant;
          setTenant(t);
          setName(t.name || "");
          setPhone(t.phone || "");
          setAddress(t.address || "");
          setTimezone(t.timezone || "America/Sao_Paulo");
          const s = t.settings || {};
          setOpenTime(s.openTime || "08:00");
          setCloseTime(s.closeTime || "22:00");
          setClosedDays(s.closedDays || []);
          setDeliveryZones(s.deliveryZones || []);
          setMinOrderValue(s.minOrderValue?.toString() || "");
          setEstimatedTime(s.estimatedTime?.toString() || "");
          setWhatsappWebhook(s.whatsappWebhook || "");
        }
      } catch (e) {
        console.error("Fetch tenant error:", e);
      } finally {
        setLoading(false);
      }
    }
    fetchTenant();
  }, []);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      const settings: TenantSettings = {
        openTime,
        closeTime,
        closedDays,
        deliveryZones,
        minOrderValue: minOrderValue ? parseFloat(minOrderValue) : undefined,
        estimatedTime: estimatedTime ? parseInt(estimatedTime) : undefined,
        whatsappWebhook: whatsappWebhook || undefined,
      };

      const res = await fetch("/api/tenant", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, address, timezone, settings }),
      });

      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        const err = await res.json();
        alert(err.error || "Erro ao salvar");
      }
    } catch (e) {
      console.error("Save error:", e);
      alert("Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  function toggleClosedDay(day: number) {
    setClosedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  }

  function addDeliveryZone() {
    setDeliveryZones((prev) => [...prev, { neighborhood: "", fee: 0 }]);
  }

  function updateDeliveryZone(index: number, field: keyof DeliveryZone, value: string) {
    setDeliveryZones((prev) =>
      prev.map((z, i) =>
        i === index
          ? { ...z, [field]: field === "fee" ? parseFloat(value) || 0 : value }
          : z
      )
    );
  }

  function removeDeliveryZone(index: number) {
    setDeliveryZones((prev) => prev.filter((_, i) => i !== index));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Configuracoes</h1>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg font-medium text-sm hover:bg-orange-700 disabled:opacity-50 transition"
        >
          {saving ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
          ) : saved ? (
            <Check size={16} />
          ) : (
            <Save size={16} />
          )}
          {saved ? "Salvo!" : "Salvar"}
        </button>
      </div>

      {/* Dados do restaurante */}
      <section className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Store size={18} className="text-orange-600" />
          Dados do Restaurante
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
            <input
              type="text"
              value={tenant?.slug || ""}
              disabled
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
              <Phone size={14} /> Telefone / WhatsApp
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(45) 99999-9999"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
              <Globe size={14} /> Fuso horario
            </label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="America/Sao_Paulo">Brasilia (GMT-3)</option>
              <option value="America/Manaus">Manaus (GMT-4)</option>
              <option value="America/Belem">Belem (GMT-3)</option>
              <option value="America/Fortaleza">Fortaleza (GMT-3)</option>
              <option value="America/Cuiaba">Cuiaba (GMT-4)</option>
              <option value="America/Rio_Branco">Rio Branco (GMT-5)</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
              <MapPin size={14} /> Endereco
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Rua, numero - Bairro - Cidade/UF"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>
      </section>

      {/* Horarios */}
      <section className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Clock size={18} className="text-orange-600" />
          Horario de Funcionamento
        </h2>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Abertura</label>
            <input
              type="time"
              value={openTime}
              onChange={(e) => setOpenTime(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fechamento</label>
            <input
              type="time"
              value={closeTime}
              onChange={(e) => setCloseTime(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Dias fechados</label>
          <div className="flex gap-2">
            {daysOfWeek.map((d) => (
              <button
                key={d.key}
                onClick={() => toggleClosedDay(d.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  closedDays.includes(d.key)
                    ? "bg-red-100 text-red-700 border border-red-300"
                    : "bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100"
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-1">Clique para marcar os dias em que o restaurante nao funciona</p>
        </div>
      </section>

      {/* Delivery */}
      <section className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <MapPin size={18} className="text-orange-600" />
          Entrega
        </h2>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pedido minimo (R$)</label>
            <input
              type="number"
              step="0.01"
              value={minOrderValue}
              onChange={(e) => setMinOrderValue(e.target.value)}
              placeholder="0.00"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tempo estimado (min)</label>
            <input
              type="number"
              value={estimatedTime}
              onChange={(e) => setEstimatedTime(e.target.value)}
              placeholder="40"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700">Taxas por bairro</label>
            <button
              onClick={addDeliveryZone}
              className="text-xs text-orange-600 hover:text-orange-700 flex items-center gap-1"
            >
              <Plus size={14} /> Adicionar
            </button>
          </div>
          {deliveryZones.length === 0 ? (
            <p className="text-xs text-gray-400">Nenhuma zona de entrega configurada</p>
          ) : (
            <div className="space-y-2">
              {deliveryZones.map((zone, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={zone.neighborhood}
                    onChange={(e) => updateDeliveryZone(i, "neighborhood", e.target.value)}
                    placeholder="Bairro"
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-sm text-gray-400">R$</span>
                    <input
                      type="number"
                      step="0.50"
                      value={zone.fee || ""}
                      onChange={(e) => updateDeliveryZone(i, "fee", e.target.value)}
                      placeholder="0.00"
                      className="w-24 pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <button
                    onClick={() => removeDeliveryZone(i)}
                    className="text-red-400 hover:text-red-600"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Integracoes */}
      <section className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Globe size={18} className="text-orange-600" />
          Integracoes
        </h2>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Webhook WhatsApp (n8n)</label>
          <input
            type="url"
            value={whatsappWebhook}
            onChange={(e) => setWhatsappWebhook(e.target.value)}
            placeholder="https://n8n.example.com/webhook/..."
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
          <p className="text-xs text-gray-400 mt-1">URL do webhook n8n para enviar notificacoes de pedidos</p>
        </div>
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-xs font-medium text-gray-600 mb-1">API do Cardapio (para n8n)</p>
          <code className="text-xs text-orange-600 break-all">
            GET /api/menu/{tenant?.id}
          </code>
          <p className="text-xs font-medium text-gray-600 mt-2 mb-1">API de Configuracoes (para n8n)</p>
          <code className="text-xs text-orange-600 break-all">
            GET /api/settings/{tenant?.id}
          </code>
        </div>
      </section>

      {/* Tenant ID info */}
      <div className="text-xs text-gray-400 text-center pb-4">
        Tenant ID: {tenant?.id}
      </div>
    </div>
  );
}
