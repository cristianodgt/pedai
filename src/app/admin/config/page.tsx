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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#a33900]" />
      </div>
    );
  }

  const webhookUrl = whatsappWebhook || `https://n8n.example.com/webhook/${tenant?.id}`;

  return (
    <div className="space-y-6 pb-8" style={{ background: "#f8f9fb" }}>
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "#191c1e" }}>
          Configuracoes do Sistema
        </h1>
        <p className="text-sm mt-1" style={{ color: "#5a4138" }}>
          Gerencie os dados vitais e operacionais do seu restaurante.
        </p>
      </div>

      {/* Row 1: Dados do Restaurante + Horarios */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Dados do Restaurante (wider) */}
        <div
          className="lg:col-span-3 p-6"
          style={{ background: "#ffffff", borderRadius: "0.75rem" }}
        >
          <h2
            className="font-semibold mb-5 flex items-center gap-2"
            style={{ color: "#191c1e" }}
          >
            <Store size={18} style={{ color: "#a33900" }} />
            Dados do Restaurante
          </h2>
          <div className="space-y-4">
            <div>
              <label
                className="block text-sm font-medium mb-1"
                style={{ color: "#5a4138" }}
              >
                Nome de Identificacao (Slug)
              </label>
              <div className="flex">
                <span
                  className="inline-flex items-center px-3 py-2 text-sm"
                  style={{
                    background: "#edeef0",
                    color: "#5a4138",
                    borderRadius: "0.75rem 0 0 0.75rem",
                  }}
                >
                  pedai.com/
                </span>
                <input
                  type="text"
                  value={tenant?.slug || ""}
                  disabled
                  className="flex-1 px-3 py-2 text-sm focus:outline-none"
                  style={{
                    background: "#edeef0",
                    border: "none",
                    borderRadius: "0 0.75rem 0.75rem 0",
                    color: "#5a4138",
                    opacity: 0.6,
                  }}
                />
              </div>
            </div>
            <div>
              <label
                className="block text-sm font-medium mb-1 flex items-center gap-1.5"
                style={{ color: "#5a4138" }}
              >
                <Phone size={14} style={{ color: "#5a4138" }} />
                WhatsApp Comercial
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(45) 99999-9999"
                className="w-full px-3 py-2.5 text-sm focus:outline-none transition-all"
                style={{
                  background: "#edeef0",
                  border: "none",
                  borderBottom: "2px solid transparent",
                  borderRadius: "0.75rem",
                  color: "#191c1e",
                }}
                onFocus={(e) => (e.target.style.borderBottomColor = "#a33900")}
                onBlur={(e) => (e.target.style.borderBottomColor = "transparent")}
              />
            </div>
            <div>
              <label
                className="block text-sm font-medium mb-1 flex items-center gap-1.5"
                style={{ color: "#5a4138" }}
              >
                <Mail size={14} style={{ color: "#5a4138" }} />
                E-mail de Contato
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contato@restaurante.com"
                className="w-full px-3 py-2.5 text-sm focus:outline-none transition-all"
                style={{
                  background: "#edeef0",
                  border: "none",
                  borderBottom: "2px solid transparent",
                  borderRadius: "0.75rem",
                  color: "#191c1e",
                }}
                onFocus={(e) => (e.target.style.borderBottomColor = "#a33900")}
                onBlur={(e) => (e.target.style.borderBottomColor = "transparent")}
              />
            </div>
            <div>
              <label
                className="block text-sm font-medium mb-1 flex items-center gap-1.5"
                style={{ color: "#5a4138" }}
              >
                <MapPin size={14} style={{ color: "#5a4138" }} />
                Endereco Completo
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Rua, numero - Bairro - Cidade/UF"
                className="w-full px-3 py-2.5 text-sm focus:outline-none transition-all"
                style={{
                  background: "#edeef0",
                  border: "none",
                  borderBottom: "2px solid transparent",
                  borderRadius: "0.75rem",
                  color: "#191c1e",
                }}
                onFocus={(e) => (e.target.style.borderBottomColor = "#a33900")}
                onBlur={(e) => (e.target.style.borderBottomColor = "transparent")}
              />
            </div>
          </div>
        </div>

        {/* Horarios */}
        <div
          className="lg:col-span-2 p-6"
          style={{ background: "#ffffff", borderRadius: "0.75rem" }}
        >
          <h2
            className="font-semibold mb-5 flex items-center gap-2"
            style={{ color: "#191c1e" }}
          >
            <Clock size={18} style={{ color: "#a33900" }} />
            Horarios
          </h2>
          <div className="space-y-3">
            {daysOfWeek.map((d) => {
              const isOpen = !closedDays.includes(d.key);
              return (
                <div key={d.key} className="flex items-center justify-between">
                  <span
                    className="text-sm w-28"
                    style={{ color: "#191c1e" }}
                  >
                    {d.label}
                  </span>
                  <span
                    className="text-sm"
                    style={{ color: isOpen ? "#5a4138" : "#5a413866" }}
                  >
                    {isOpen ? `${openTime} - ${closeTime}` : "Fechado"}
                  </span>
                  <button
                    onClick={() => toggleClosedDay(d.key)}
                    className="flex-shrink-0"
                  >
                    <div
                      className="relative w-10 h-5 rounded-full transition-colors"
                      style={{
                        background: isOpen
                          ? "linear-gradient(135deg, #a33900, #cc4900)"
                          : "#edeef0",
                      }}
                    >
                      <div
                        className={`absolute top-0.5 w-4 h-4 rounded-full transition-transform ${
                          isOpen ? "translate-x-5" : "translate-x-0.5"
                        }`}
                        style={{ background: "#ffffff" }}
                      />
                    </div>
                  </button>
                </div>
              );
            })}
            <div
              className="pt-3 grid grid-cols-2 gap-3"
              style={{ borderTop: "1px solid #edeef0" }}
            >
              <div>
                <label
                  className="block text-xs mb-1"
                  style={{ color: "#5a4138" }}
                >
                  Abertura
                </label>
                <input
                  type="time"
                  value={openTime}
                  onChange={(e) => setOpenTime(e.target.value)}
                  className="w-full px-2 py-1.5 text-sm focus:outline-none transition-all"
                  style={{
                    background: "#edeef0",
                    border: "none",
                    borderBottom: "2px solid transparent",
                    borderRadius: "0.75rem",
                    color: "#191c1e",
                  }}
                  onFocus={(e) => (e.target.style.borderBottomColor = "#a33900")}
                  onBlur={(e) => (e.target.style.borderBottomColor = "transparent")}
                />
              </div>
              <div>
                <label
                  className="block text-xs mb-1"
                  style={{ color: "#5a4138" }}
                >
                  Fechamento
                </label>
                <input
                  type="time"
                  value={closeTime}
                  onChange={(e) => setCloseTime(e.target.value)}
                  className="w-full px-2 py-1.5 text-sm focus:outline-none transition-all"
                  style={{
                    background: "#edeef0",
                    border: "none",
                    borderBottom: "2px solid transparent",
                    borderRadius: "0.75rem",
                    color: "#191c1e",
                  }}
                  onFocus={(e) => (e.target.style.borderBottomColor = "#a33900")}
                  onBlur={(e) => (e.target.style.borderBottomColor = "transparent")}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Taxas de Entrega + Integracoes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Taxas de Entrega */}
        <div className="p-6" style={{ background: "#ffffff", borderRadius: "0.75rem" }}>
          <h2
            className="font-semibold mb-5 flex items-center gap-2"
            style={{ color: "#191c1e" }}
          >
            <MapPin size={18} style={{ color: "#a33900" }} />
            Taxas de Entrega
          </h2>
          {deliveryZones.length === 0 ? (
            <p className="text-sm mb-4" style={{ color: "#5a413888" }}>
              Nenhuma zona de entrega configurada
            </p>
          ) : (
            <div className="overflow-x-auto mb-4">
              <table className="w-full text-sm">
                <thead>
                  <tr
                    className="text-left text-xs uppercase tracking-wider"
                    style={{ color: "#5a4138" }}
                  >
                    <th className="pb-3 font-medium">Bairro</th>
                    <th className="pb-3 font-medium text-right">Taxa</th>
                    <th className="pb-3 w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {deliveryZones.map((zone, i) => (
                    <tr
                      key={i}
                      style={{
                        background: i % 2 === 0 ? "transparent" : "#f8f9fb",
                      }}
                    >
                      <td className="py-2.5">
                        <input
                          type="text"
                          value={zone.neighborhood}
                          onChange={(e) =>
                            updateDeliveryZone(i, "neighborhood", e.target.value)
                          }
                          placeholder="Nome do bairro"
                          className="w-full px-2 py-1 text-sm focus:outline-none transition-all"
                          style={{
                            background: "#edeef0",
                            border: "none",
                            borderBottom: "2px solid transparent",
                            borderRadius: "0.75rem",
                            color: "#191c1e",
                          }}
                          onFocus={(e) =>
                            (e.target.style.borderBottomColor = "#a33900")
                          }
                          onBlur={(e) =>
                            (e.target.style.borderBottomColor = "transparent")
                          }
                        />
                      </td>
                      <td className="py-2.5 text-right">
                        {zone.fee === 0 ? (
                          <span className="font-medium" style={{ color: "#2e7d32" }}>
                            Gratis
                          </span>
                        ) : (
                          <span className="font-medium" style={{ color: "#a33900" }}>
                            R$ {zone.fee.toFixed(0)},00
                          </span>
                        )}
                        <input
                          type="number"
                          step="0.50"
                          value={zone.fee || ""}
                          onChange={(e) =>
                            updateDeliveryZone(i, "fee", e.target.value)
                          }
                          className="w-20 ml-2 px-2 py-1 text-sm text-right focus:outline-none transition-all"
                          style={{
                            background: "#edeef0",
                            border: "none",
                            borderBottom: "2px solid transparent",
                            borderRadius: "0.75rem",
                            color: "#191c1e",
                          }}
                          onFocus={(e) =>
                            (e.target.style.borderBottomColor = "#a33900")
                          }
                          onBlur={(e) =>
                            (e.target.style.borderBottomColor = "transparent")
                          }
                        />
                      </td>
                      <td className="py-2.5 text-right">
                        <button
                          onClick={() => removeDeliveryZone(i)}
                          className="transition"
                          style={{ color: "#5a413866" }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.color = "#c62828")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.color = "#5a413866")
                          }
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
            className="flex items-center gap-1.5 text-sm font-medium transition-opacity hover:opacity-80"
            style={{ color: "#a33900" }}
          >
            <Plus size={16} />
            Adicionar Bairro
          </button>
        </div>

        {/* Integracoes & API */}
        <div className="p-6" style={{ background: "#ffffff", borderRadius: "0.75rem" }}>
          <h2
            className="font-semibold mb-5 flex items-center gap-2"
            style={{ color: "#191c1e" }}
          >
            <Link size={18} style={{ color: "#a33900" }} />
            Integracoes & API
          </h2>
          <div className="space-y-5">
            {/* n8n Webhook */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label
                  className="text-sm font-medium"
                  style={{ color: "#5a4138" }}
                >
                  n8n Webhook
                </label>
                <span
                  className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5"
                  style={{
                    borderRadius: "0.75rem",
                    background: "#e8f5e9",
                    color: "#2e7d32",
                  }}
                >
                  Ativo
                </span>
              </div>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={whatsappWebhook}
                  onChange={(e) => setWhatsappWebhook(e.target.value)}
                  placeholder="https://n8n.example.com/webhook/..."
                  className="flex-1 px-3 py-2 text-xs font-mono focus:outline-none transition-all"
                  style={{
                    background: "#edeef0",
                    border: "none",
                    borderBottom: "2px solid transparent",
                    borderRadius: "0.75rem",
                    color: "#5a4138",
                  }}
                  onFocus={(e) => (e.target.style.borderBottomColor = "#a33900")}
                  onBlur={(e) => (e.target.style.borderBottomColor = "transparent")}
                />
                <button
                  onClick={() => copyToClipboard(whatsappWebhook || webhookUrl)}
                  className="px-2.5 py-2 transition-opacity hover:opacity-70"
                  style={{
                    background: "#edeef0",
                    borderRadius: "0.75rem",
                    color: "#5a4138",
                  }}
                  title="Copiar URL"
                >
                  <Copy size={16} />
                </button>
              </div>
            </div>

            {/* API Key */}
            <div>
              <label
                className="text-sm font-medium mb-2 flex items-center gap-1.5"
                style={{ color: "#5a4138" }}
              >
                <Key size={14} style={{ color: "#5a4138" }} />
                Chave de API (Master)
              </label>
              <div className="flex gap-2">
                <div
                  className="flex-1 px-3 py-2 text-sm font-mono flex items-center"
                  style={{
                    background: "#edeef0",
                    borderRadius: "0.75rem",
                  }}
                >
                  {showApiKey ? (
                    <span
                      className="text-xs truncate"
                      style={{ color: "#5a4138" }}
                    >
                      {tenant?.id || "pk_live_xxxxxxxxxxxxxxxx"}
                    </span>
                  ) : (
                    <span
                      className="tracking-widest"
                      style={{ color: "#5a4138" }}
                    >
                      {"*".repeat(24)}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="px-2.5 py-2 transition-opacity hover:opacity-70"
                  style={{
                    background: "#edeef0",
                    borderRadius: "0.75rem",
                    color: "#5a4138",
                  }}
                  title={showApiKey ? "Ocultar" : "Mostrar"}
                >
                  {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <button
                className="text-xs font-medium mt-2 hover:underline"
                style={{
                  color: "#a33900",
                  background: "none",
                  border: "none",
                  textDecoration: "none",
                }}
              >
                Regerar Chave
              </button>
            </div>

            {/* Connect new tool */}
            <button
              className="w-full py-2.5 text-sm transition-opacity hover:opacity-80 flex items-center justify-center gap-1.5"
              style={{
                background: "transparent",
                border: "1px dashed rgba(226,191,178,0.15)",
                borderRadius: "0.75rem",
                color: "#5a4138",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "#a33900";
                e.currentTarget.style.borderColor = "rgba(163,57,0,0.3)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "#5a4138";
                e.currentTarget.style.borderColor = "rgba(226,191,178,0.15)";
              }}
            >
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
          className="px-4 py-2.5 text-sm font-medium transition-opacity hover:opacity-80"
          style={{
            color: "#a33900",
            background: "transparent",
            border: "none",
          }}
        >
          Descartar
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 text-white font-medium text-sm disabled:opacity-50 transition-opacity hover:opacity-90"
          style={{
            background: "linear-gradient(135deg, #a33900, #cc4900)",
            borderRadius: "0.75rem",
            border: "none",
          }}
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
      <div
        className="text-xs text-center pb-4"
        style={{ color: "#5a413866" }}
      >
        Tenant ID: {tenant?.id}
      </div>
    </div>
  );
}
