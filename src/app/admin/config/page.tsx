"use client";

import { useEffect, useState } from "react";
import {
  Save,
  Store,
  Clock,
  MapPin,
  Phone,
  Globe,
  Plus,
  Trash2,
  Check,
  Copy,
  Eye,
  EyeOff,
  Link,
  Key,
  Mail,
} from "lucide-react";

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
  { key: 1, label: "Segunda-feira", short: "Seg" },
  { key: 2, label: "Terca-feira", short: "Ter" },
  { key: 3, label: "Quarta-feira", short: "Qua" },
  { key: 4, label: "Quinta-feira", short: "Qui" },
  { key: 5, label: "Sexta-feira", short: "Sex" },
  { key: 6, label: "Sabado", short: "Sab" },
  { key: 0, label: "Domingo", short: "Dom" },
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

  // API key visibility
  const [showApiKey, setShowApiKey] = useState(false);
  const [email, setEmail] = useState("");

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

  function handleDiscard() {
    if (!tenant) return;
    setName(tenant.name || "");
    setPhone(tenant.phone || "");
    setAddress(tenant.address || "");
    setTimezone(tenant.timezone || "America/Sao_Paulo");
    const s = tenant.settings || {};
    setOpenTime(s.openTime || "08:00");
    setCloseTime(s.closeTime || "22:00");
    setClosedDays(s.closedDays || []);
    setDeliveryZones(s.deliveryZones || []);
    setMinOrderValue(s.minOrderValue?.toString() || "");
    setEstimatedTime(s.estimatedTime?.toString() || "");
    setWhatsappWebhook(s.whatsappWebhook || "");
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

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#A0522D]" />
      </div>
    );
  }

  const webhookUrl = whatsappWebhook || `https://n8n.example.com/webhook/${tenant?.id}`;

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configuracoes do Sistema</h1>
        <p className="text-sm text-gray-500 mt-1">
          Gerencie os dados vitais e operacionais do seu restaurante.
        </p>
      </div>

      {/* Row 1: Dados do Restaurante + Horarios */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Dados do Restaurante (wider) */}
        <div className="lg:col-span-3 bg-white rounded-xl shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 mb-5 flex items-center gap-2">
            <Store size={18} className="text-[#A0522D]" />
            Dados do Restaurante
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome de Identificacao (Slug)
              </label>
              <div className="flex">
                <span className="inline-flex items-center px-3 py-2 bg-gray-50 border border-r-0 border-gray-200 rounded-l-lg text-sm text-gray-500">
                  pedai.com/
                </span>
                <input
                  type="text"
                  value={tenant?.slug || ""}
                  disabled
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-r-lg text-sm bg-gray-50 text-gray-400 focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
                <Phone size={14} className="text-gray-400" />
                WhatsApp Comercial
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(45) 99999-9999"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#A0522D] focus:border-[#A0522D]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
                <Mail size={14} className="text-gray-400" />
                E-mail de Contato
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contato@restaurante.com"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#A0522D] focus:border-[#A0522D]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
                <MapPin size={14} className="text-gray-400" />
                Endereco Completo
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Rua, numero - Bairro - Cidade/UF"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#A0522D] focus:border-[#A0522D]"
              />
            </div>
          </div>
        </div>

        {/* Horarios */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 mb-5 flex items-center gap-2">
            <Clock size={18} className="text-[#A0522D]" />
            Horarios
          </h2>
          <div className="space-y-3">
            {daysOfWeek.map((d) => {
              const isOpen = !closedDays.includes(d.key);
              return (
                <div key={d.key} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 w-28">{d.label}</span>
                  <span className={`text-sm ${isOpen ? "text-gray-600" : "text-gray-300"}`}>
                    {isOpen ? `${openTime} - ${closeTime}` : "Fechado"}
                  </span>
                  <button
                    onClick={() => toggleClosedDay(d.key)}
                    className="flex-shrink-0"
                  >
                    <div className={`relative w-10 h-5 rounded-full transition-colors ${
                      isOpen ? "bg-green-500" : "bg-gray-300"
                    }`}>
                      <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                        isOpen ? "translate-x-5" : "translate-x-0.5"
                      }`} />
                    </div>
                  </button>
                </div>
              );
            })}
            <div className="pt-3 border-t border-gray-100 grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Abertura</label>
                <input
                  type="time"
                  value={openTime}
                  onChange={(e) => setOpenTime(e.target.value)}
                  className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#A0522D]"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Fechamento</label>
                <input
                  type="time"
                  value={closeTime}
                  onChange={(e) => setCloseTime(e.target.value)}
                  className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#A0522D]"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Taxas de Entrega + Integracoes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Taxas de Entrega */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 mb-5 flex items-center gap-2">
            <MapPin size={18} className="text-[#A0522D]" />
            Taxas de Entrega
          </h2>
          {deliveryZones.length === 0 ? (
            <p className="text-sm text-gray-400 mb-4">Nenhuma zona de entrega configurada</p>
          ) : (
            <div className="overflow-x-auto mb-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-400 uppercase tracking-wider border-b border-gray-100">
                    <th className="pb-2 font-medium">Bairro</th>
                    <th className="pb-2 font-medium text-right">Taxa</th>
                    <th className="pb-2 w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {deliveryZones.map((zone, i) => (
                    <tr key={i} className="border-b border-gray-50 last:border-b-0">
                      <td className="py-2.5">
                        <input
                          type="text"
                          value={zone.neighborhood}
                          onChange={(e) => updateDeliveryZone(i, "neighborhood", e.target.value)}
                          placeholder="Nome do bairro"
                          className="w-full px-2 py-1 border border-gray-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#A0522D]"
                        />
                      </td>
                      <td className="py-2.5 text-right">
                        {zone.fee === 0 ? (
                          <span className="text-green-600 font-medium">Gratis</span>
                        ) : (
                          <span className="text-[#A0522D] font-medium">
                            R$ {zone.fee.toFixed(0)},00
                          </span>
                        )}
                        <input
                          type="number"
                          step="0.50"
                          value={zone.fee || ""}
                          onChange={(e) => updateDeliveryZone(i, "fee", e.target.value)}
                          className="w-20 ml-2 px-2 py-1 border border-gray-200 rounded text-sm text-right focus:outline-none focus:ring-1 focus:ring-[#A0522D]"
                        />
                      </td>
                      <td className="py-2.5 text-right">
                        <button
                          onClick={() => removeDeliveryZone(i)}
                          className="text-gray-300 hover:text-red-500 transition"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <button
            onClick={addDeliveryZone}
            className="flex items-center gap-1.5 text-sm text-[#A0522D] hover:text-[#8B4726] font-medium"
          >
            <Plus size={16} />
            Adicionar Bairro
          </button>
        </div>

        {/* Integracoes & API */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 mb-5 flex items-center gap-2">
            <Link size={18} className="text-[#A0522D]" />
            Integracoes & API
          </h2>
          <div className="space-y-5">
            {/* n8n Webhook */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">n8n Webhook</label>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                  Ativo
                </span>
              </div>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={whatsappWebhook}
                  onChange={(e) => setWhatsappWebhook(e.target.value)}
                  placeholder="https://n8n.example.com/webhook/..."
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#A0522D] font-mono text-xs"
                />
                <button
                  onClick={() => copyToClipboard(whatsappWebhook || webhookUrl)}
                  className="px-2.5 py-2 border border-gray-200 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition"
                  title="Copiar URL"
                >
                  <Copy size={16} />
                </button>
              </div>
            </div>

            {/* API Key */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block flex items-center gap-1.5">
                <Key size={14} className="text-gray-400" />
                Chave de API (Master)
              </label>
              <div className="flex gap-2">
                <div className="flex-1 px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-sm font-mono flex items-center">
                  {showApiKey ? (
                    <span className="text-xs text-gray-600 truncate">{tenant?.id || "pk_live_xxxxxxxxxxxxxxxx"}</span>
                  ) : (
                    <span className="text-gray-400 tracking-widest">{"*".repeat(24)}</span>
                  )}
                </div>
                <button
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="px-2.5 py-2 border border-gray-200 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition"
                  title={showApiKey ? "Ocultar" : "Mostrar"}
                >
                  {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <button className="text-xs text-[#A0522D] hover:text-[#8B4726] font-medium mt-2">
                Regerar Chave
              </button>
            </div>

            {/* Connect new tool */}
            <button className="w-full py-2.5 border border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:text-[#A0522D] hover:border-[#A0522D] transition flex items-center justify-center gap-1.5">
              <Plus size={16} />
              Conectar nova ferramenta
            </button>
          </div>
        </div>
      </div>

      {/* Bottom actions */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          onClick={handleDiscard}
          className="px-4 py-2.5 text-sm text-gray-600 hover:text-gray-800 transition"
        >
          Descartar
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 bg-[#A0522D] text-white rounded-xl font-medium text-sm hover:bg-[#8B4726] disabled:opacity-50 transition shadow-sm"
        >
          {saving ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
          ) : saved ? (
            <Check size={16} />
          ) : (
            <Save size={16} />
          )}
          {saved ? "Salvo!" : "Salvar Alteracoes"}
        </button>
      </div>

      {/* Tenant ID info */}
      <div className="text-xs text-gray-400 text-center pb-4">
        Tenant ID: {tenant?.id}
      </div>
    </div>
  );
}
