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
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
    <div className="space-y-6 pb-8 bg-[#f8f9fb]">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#191c1e]">
          Configuracoes do Sistema
        </h1>
        <p className="text-sm mt-1 text-[#5a4138]">
          Gerencie os dados vitais e operacionais do seu restaurante.
        </p>
      </div>

      {/* Row 1: Dados do Restaurante + Horarios */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Dados do Restaurante (wider) */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store size={18} className="text-[#a33900]" />
              Dados do Restaurante
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-[#5a4138]">
                Nome de Identificacao (Slug)
              </label>
              <div className="flex">
                <span className="inline-flex items-center px-3 py-2 text-sm bg-[#edeef0] text-[#5a4138] rounded-l-[0.75rem]">
                  pedai.com/
                </span>
                <Input
                  type="text"
                  value={tenant?.slug || ""}
                  disabled
                  className="flex-1 rounded-l-none opacity-60"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 flex items-center gap-1.5 text-[#5a4138]">
                <Phone size={14} className="text-[#5a4138]" />
                WhatsApp Comercial
              </label>
              <Input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(45) 99999-9999"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 flex items-center gap-1.5 text-[#5a4138]">
                <Mail size={14} className="text-[#5a4138]" />
                E-mail de Contato
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contato@restaurante.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 flex items-center gap-1.5 text-[#5a4138]">
                <MapPin size={14} className="text-[#5a4138]" />
                Endereco Completo
              </label>
              <Input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Rua, numero - Bairro - Cidade/UF"
              />
            </div>
          </CardContent>
        </Card>

        {/* Horarios */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock size={18} className="text-[#a33900]" />
              Horarios
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {daysOfWeek.map((d) => {
              const isOpen = !closedDays.includes(d.key);
              return (
                <div key={d.key} className="flex items-center justify-between">
                  <span className="text-sm w-28 text-[#191c1e]">
                    {d.label}
                  </span>
                  <span
                    className={`text-sm ${isOpen ? "text-[#5a4138]" : "text-[#5a4138]/40"}`}
                  >
                    {isOpen ? `${openTime} - ${closeTime}` : "Fechado"}
                  </span>
                  <button
                    onClick={() => toggleClosedDay(d.key)}
                    className="flex-shrink-0"
                  >
                    <div
                      className={`relative w-10 h-5 rounded-full transition-colors ${
                        isOpen
                          ? "bg-gradient-to-br from-[#a33900] to-[#cc4900]"
                          : "bg-[#edeef0]"
                      }`}
                    >
                      <div
                        className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                          isOpen ? "translate-x-5" : "translate-x-0.5"
                        }`}
                      />
                    </div>
                  </button>
                </div>
              );
            })}
            <div className="pt-3 grid grid-cols-2 gap-3 border-t border-[#edeef0]">
              <div>
                <label className="block text-xs mb-1 text-[#5a4138]">
                  Abertura
                </label>
                <Input
                  type="time"
                  value={openTime}
                  onChange={(e) => setOpenTime(e.target.value)}
                  className="h-8 px-2 py-1.5"
                />
              </div>
              <div>
                <label className="block text-xs mb-1 text-[#5a4138]">
                  Fechamento
                </label>
                <Input
                  type="time"
                  value={closeTime}
                  onChange={(e) => setCloseTime(e.target.value)}
                  className="h-8 px-2 py-1.5"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Taxas de Entrega + Integracoes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Taxas de Entrega */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin size={18} className="text-[#a33900]" />
              Taxas de Entrega
            </CardTitle>
          </CardHeader>
          <CardContent>
            {deliveryZones.length === 0 ? (
              <p className="text-sm mb-4 text-[#5a4138]/50">
                Nenhuma zona de entrega configurada
              </p>
            ) : (
              <div className="overflow-x-auto mb-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wider text-[#5a4138]">
                      <th className="pb-3 font-medium">Bairro</th>
                      <th className="pb-3 font-medium text-right">Taxa</th>
                      <th className="pb-3 w-8"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {deliveryZones.map((zone, i) => (
                      <tr
                        key={i}
                        className={i % 2 === 0 ? "bg-transparent" : "bg-[#f8f9fb]"}
                      >
                        <td className="py-2.5">
                          <Input
                            type="text"
                            value={zone.neighborhood}
                            onChange={(e) =>
                              updateDeliveryZone(i, "neighborhood", e.target.value)
                            }
                            placeholder="Nome do bairro"
                            className="h-8 px-2 py-1"
                          />
                        </td>
                        <td className="py-2.5 text-right">
                          {zone.fee === 0 ? (
                            <span className="font-medium text-[#2e7d32]">
                              Gratis
                            </span>
                          ) : (
                            <span className="font-medium text-[#a33900]">
                              R$ {zone.fee.toFixed(0)},00
                            </span>
                          )}
                          <Input
                            type="number"
                            step="0.50"
                            value={zone.fee || ""}
                            onChange={(e) =>
                              updateDeliveryZone(i, "fee", e.target.value)
                            }
                            className="w-20 ml-2 h-8 px-2 py-1 text-right inline-block"
                          />
                        </td>
                        <td className="py-2.5 text-right">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => removeDeliveryZone(i)}
                            className="text-[#5a4138]/40 hover:text-red-700"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <Button variant="link" onClick={addDeliveryZone}>
              <Plus size={16} />
              Adicionar Bairro
            </Button>
          </CardContent>
        </Card>

        {/* Integracoes & API */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link size={18} className="text-[#a33900]" />
              Integracoes & API
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* n8n Webhook */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-[#5a4138]">
                  n8n Webhook
                </label>
                <Badge variant="success">Ativo</Badge>
              </div>
              <div className="flex gap-2">
                <Input
                  type="url"
                  value={whatsappWebhook}
                  onChange={(e) => setWhatsappWebhook(e.target.value)}
                  placeholder="https://n8n.example.com/webhook/..."
                  className="flex-1 text-xs font-mono text-[#5a4138]"
                />
                <Button
                  variant="secondary"
                  size="icon-sm"
                  onClick={() => copyToClipboard(whatsappWebhook || webhookUrl)}
                  title="Copiar URL"
                >
                  <Copy size={16} />
                </Button>
              </div>
            </div>

            {/* API Key */}
            <div>
              <label className="text-sm font-medium mb-2 flex items-center gap-1.5 text-[#5a4138]">
                <Key size={14} className="text-[#5a4138]" />
                Chave de API (Master)
              </label>
              <div className="flex gap-2">
                <div className="flex-1 px-3 py-2 text-sm font-mono flex items-center bg-[#edeef0] rounded-[0.75rem]">
                  {showApiKey ? (
                    <span className="text-xs truncate text-[#5a4138]">
                      {tenant?.id || "pk_live_xxxxxxxxxxxxxxxx"}
                    </span>
                  ) : (
                    <span className="tracking-widest text-[#5a4138]">
                      {"*".repeat(24)}
                    </span>
                  )}
                </div>
                <Button
                  variant="secondary"
                  size="icon-sm"
                  onClick={() => setShowApiKey(!showApiKey)}
                  title={showApiKey ? "Ocultar" : "Mostrar"}
                >
                  {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                </Button>
              </div>
              <Button variant="link" className="mt-2 h-auto p-0 text-xs">
                Regerar Chave
              </Button>
            </div>

            {/* Connect new tool */}
            <Button
              variant="outline"
              className="w-full border-dashed border-[rgba(226,191,178,0.15)] text-[#5a4138] hover:text-[#a33900] hover:border-[rgba(163,57,0,0.3)]"
            >
              <Plus size={16} />
              Conectar nova ferramenta
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Bottom actions */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Button variant="ghost" onClick={handleDiscard}>
          Descartar
        </Button>
        <Button
          variant="default"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
          ) : saved ? (
            <Check size={16} />
          ) : (
            <Save size={16} />
          )}
          {saved ? "Salvo!" : "Salvar Alteracoes"}
        </Button>
      </div>

      {/* Tenant ID info */}
      <div className="text-xs text-center pb-4 text-[#5a4138]/40">
        Tenant ID: {tenant?.id}
      </div>
    </div>
  );
}
