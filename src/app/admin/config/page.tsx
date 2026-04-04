"use client";

import { useState } from "react";
import {
  Save,
  Store,
  Clock,
  MapPin,
  Phone,
  MessageSquare,
  Plus,
  Trash2,
  Copy,
  Eye,
  EyeOff,
  Link2,
  Key,
  Bell,
  ShieldCheck,
  Mail,
  Smartphone,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Mock data                                                          */
/* ------------------------------------------------------------------ */

const initialSchedule = [
  { day: "Segunda-feira", open: "08:00", close: "22:00", active: true },
  { day: "Terça-feira", open: "08:00", close: "22:00", active: true },
  { day: "Quarta-feira", open: "08:00", close: "22:00", active: true },
  { day: "Quinta-feira", open: "08:00", close: "22:00", active: true },
  { day: "Sexta-feira", open: "08:00", close: "23:00", active: true },
  { day: "Sábado", open: "10:00", close: "23:00", active: true },
  { day: "Domingo", open: "10:00", close: "20:00", active: false },
];

const initialZones = [
  { neighborhood: "Centro", fee: 0 },
  { neighborhood: "Jardim Paulista", fee: 5 },
  { neighborhood: "Vila Mariana", fee: 7 },
  { neighborhood: "Pinheiros", fee: 8 },
  { neighborhood: "Moema", fee: 10 },
];

const initialNotifications = [
  { id: "new_order", label: "Novos pedidos", description: "Receber alerta a cada novo pedido", active: true },
  { id: "order_cancel", label: "Cancelamentos", description: "Notificar quando um pedido for cancelado", active: true },
  { id: "low_stock", label: "Estoque baixo", description: "Avisar quando ingredientes estiverem acabando", active: false },
  { id: "daily_report", label: "Relatório diário", description: "Resumo de vendas enviado ao final do dia", active: true },
  { id: "customer_review", label: "Avaliações de clientes", description: "Notificar novas avaliações recebidas", active: false },
];

/* ------------------------------------------------------------------ */
/*  Toggle component                                                   */
/* ------------------------------------------------------------------ */

function Toggle({ active, onToggle }: { active: boolean; onToggle: () => void }) {
  return (
    <button type="button" onClick={onToggle} className="flex-shrink-0">
      <div
        className={`relative w-11 h-6 rounded-full transition-colors ${
          active
            ? "bg-gradient-to-br from-[#a33900] to-[#cc4900]"
            : "bg-[#e2bfb2]"
        }`}
      >
        <div
          className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
            active ? "translate-x-[22px]" : "translate-x-0.5"
          }`}
        />
      </div>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Main page                                                          */
/* ------------------------------------------------------------------ */

export default function ConfigPage() {
  // Restaurant info
  const [name, setName] = useState("Sabor & Arte Restaurante");
  const [phone, setPhone] = useState("(11) 98765-4321");
  const [address, setAddress] = useState("Rua das Flores, 123 - Centro - São Paulo/SP");

  // Schedule
  const [schedule, setSchedule] = useState(initialSchedule);

  // Delivery zones
  const [zones, setZones] = useState(initialZones);

  // WhatsApp integration
  const [webhookUrl] = useState("https://n8n.pedai.com.br/webhook/abc123-whatsapp");
  const [apiToken] = useState("pk_live_7f3a9c2d8e1b4a5f6c0d9e8a7b6c5d4e");
  const [showToken, setShowToken] = useState(false);
  const [whatsappConnected] = useState(true);

  // Notifications
  const [notifications, setNotifications] = useState(initialNotifications);

  /* Schedule helpers */
  function toggleScheduleDay(index: number) {
    setSchedule((prev) =>
      prev.map((s, i) => (i === index ? { ...s, active: !s.active } : s))
    );
  }

  function updateScheduleTime(index: number, field: "open" | "close", value: string) {
    setSchedule((prev) =>
      prev.map((s, i) => (i === index ? { ...s, [field]: value } : s))
    );
  }

  /* Zone helpers */
  function addZone() {
    setZones((prev) => [...prev, { neighborhood: "", fee: 0 }]);
  }

  function updateZone(index: number, field: "neighborhood" | "fee", value: string) {
    setZones((prev) =>
      prev.map((z, i) =>
        i === index
          ? { ...z, [field]: field === "fee" ? parseFloat(value) || 0 : value }
          : z
      )
    );
  }

  function removeZone(index: number) {
    setZones((prev) => prev.filter((_, i) => i !== index));
  }

  /* Notification helpers */
  function toggleNotification(id: string) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, active: !n.active } : n))
    );
  }

  /* Clipboard */
  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
  }

  /* Shared input class */
  const inputClass =
    "w-full px-4 py-3 text-sm rounded-xl bg-[#e7e8ea] text-[#191c1e] placeholder-[#8e7166] outline-none focus:ring-2 focus:ring-[#a33900]/30 transition-all";

  return (
    <div className="space-y-8 pb-10">
      {/* ── Page Header ─────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#191c1e]">Configurações</h1>
          <p className="text-sm mt-1 text-[#5a4138]">
            Gerencie as informações, horários e integrações do seu restaurante.
          </p>
        </div>
        <button
          type="button"
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-white font-medium text-sm bg-gradient-to-br from-[#a33900] to-[#cc4900] shadow-md hover:shadow-lg hover:brightness-110 transition-all"
        >
          <Save size={16} />
          Salvar Alterações
        </button>
      </div>

      {/* ── 1. Informações do Restaurante ───────────────── */}
      <section className="bg-white rounded-xl shadow-sm p-6 space-y-5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#ff9971]/20 flex items-center justify-center">
            <Store size={18} className="text-[#a33900]" />
          </div>
          <h2 className="text-base font-semibold text-[#191c1e]">
            Informações do Restaurante
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium mb-1.5 text-[#5a4138]">
              Nome do restaurante
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium mb-1.5 text-[#5a4138]">
              <Phone size={14} />
              Telefone / WhatsApp
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className="flex items-center gap-1.5 text-sm font-medium mb-1.5 text-[#5a4138]">
            <MapPin size={14} />
            Endereço completo
          </label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className={inputClass}
          />
        </div>
      </section>

      {/* ── 2. Horários de Funcionamento ─────────────────── */}
      <section className="bg-white rounded-xl shadow-sm p-6 space-y-5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#d4e3ff] flex items-center justify-center">
            <Clock size={18} className="text-[#005da8]" />
          </div>
          <h2 className="text-base font-semibold text-[#191c1e]">
            Horários de Funcionamento
          </h2>
        </div>

        <div className="space-y-0">
          {/* Header row */}
          <div className="grid grid-cols-[1fr_100px_100px_56px] gap-4 pb-2 border-b border-[#e2bfb2]/40">
            <span className="text-xs font-medium uppercase tracking-wider text-[#8e7166]">
              Dia
            </span>
            <span className="text-xs font-medium uppercase tracking-wider text-[#8e7166] text-center">
              Abertura
            </span>
            <span className="text-xs font-medium uppercase tracking-wider text-[#8e7166] text-center">
              Fechamento
            </span>
            <span className="text-xs font-medium uppercase tracking-wider text-[#8e7166] text-center">
              Ativo
            </span>
          </div>

          {schedule.map((s, i) => (
            <div
              key={s.day}
              className={`grid grid-cols-[1fr_100px_100px_56px] gap-4 items-center py-3 ${
                i < schedule.length - 1 ? "border-b border-[#edeef0]" : ""
              }`}
            >
              <span
                className={`text-sm font-medium ${
                  s.active ? "text-[#191c1e]" : "text-[#8e7166]"
                }`}
              >
                {s.day}
              </span>
              <input
                type="time"
                value={s.open}
                onChange={(e) => updateScheduleTime(i, "open", e.target.value)}
                disabled={!s.active}
                className={`text-sm text-center rounded-lg px-2 py-1.5 outline-none transition-colors ${
                  s.active
                    ? "bg-[#e7e8ea] text-[#191c1e]"
                    : "bg-[#edeef0] text-[#8e7166]/50"
                }`}
              />
              <input
                type="time"
                value={s.close}
                onChange={(e) => updateScheduleTime(i, "close", e.target.value)}
                disabled={!s.active}
                className={`text-sm text-center rounded-lg px-2 py-1.5 outline-none transition-colors ${
                  s.active
                    ? "bg-[#e7e8ea] text-[#191c1e]"
                    : "bg-[#edeef0] text-[#8e7166]/50"
                }`}
              />
              <div className="flex justify-center">
                <Toggle active={s.active} onToggle={() => toggleScheduleDay(i)} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 3. Taxas de Entrega ──────────────────────────── */}
      <section className="bg-white rounded-xl shadow-sm p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#ff9971]/20 flex items-center justify-center">
              <MapPin size={18} className="text-[#a33900]" />
            </div>
            <h2 className="text-base font-semibold text-[#191c1e]">
              Taxas de Entrega
            </h2>
          </div>
          <button
            type="button"
            onClick={addZone}
            className="flex items-center gap-1.5 text-sm font-medium text-[#a33900] hover:text-[#cc4900] transition-colors"
          >
            <Plus size={16} />
            Adicionar bairro
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#e2bfb2]/40">
                <th className="text-left pb-3 text-xs font-medium uppercase tracking-wider text-[#8e7166]">
                  Bairro
                </th>
                <th className="text-right pb-3 text-xs font-medium uppercase tracking-wider text-[#8e7166] w-32">
                  Taxa (R$)
                </th>
                <th className="pb-3 w-10" />
              </tr>
            </thead>
            <tbody>
              {zones.map((zone, i) => (
                <tr
                  key={i}
                  className={`${
                    i < zones.length - 1 ? "border-b border-[#edeef0]" : ""
                  }`}
                >
                  <td className="py-3">
                    <input
                      type="text"
                      value={zone.neighborhood}
                      onChange={(e) => updateZone(i, "neighborhood", e.target.value)}
                      placeholder="Nome do bairro"
                      className="w-full px-3 py-2 text-sm rounded-lg bg-[#e7e8ea] text-[#191c1e] placeholder-[#8e7166] outline-none focus:ring-2 focus:ring-[#a33900]/30"
                    />
                  </td>
                  <td className="py-3">
                    <div className="flex items-center justify-end gap-2">
                      {zone.fee === 0 ? (
                        <span className="text-xs font-medium text-[#005da8] bg-[#d4e3ff] px-2 py-0.5 rounded-full">
                          Grátis
                        </span>
                      ) : null}
                      <input
                        type="number"
                        step="0.50"
                        value={zone.fee}
                        onChange={(e) => updateZone(i, "fee", e.target.value)}
                        className="w-24 px-3 py-2 text-sm text-right rounded-lg bg-[#e7e8ea] text-[#191c1e] outline-none focus:ring-2 focus:ring-[#a33900]/30"
                      />
                    </div>
                  </td>
                  <td className="py-3 text-center">
                    <button
                      type="button"
                      onClick={() => removeZone(i)}
                      className="p-1.5 rounded-lg text-[#8e7166] hover:text-[#ba1a1a] hover:bg-[#ffdad6] transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── 4. Integração WhatsApp ───────────────────────── */}
      <section className="bg-white rounded-xl shadow-sm p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#d4e3ff] flex items-center justify-center">
              <Link2 size={18} className="text-[#005da8]" />
            </div>
            <h2 className="text-base font-semibold text-[#191c1e]">
              Integração WhatsApp
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {whatsappConnected ? (
              <span className="flex items-center gap-1.5 text-xs font-medium text-[#2e7d32] bg-[#e8f5e9] px-3 py-1.5 rounded-full">
                <CheckCircle2 size={13} />
                Conectado
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-xs font-medium text-[#ba1a1a] bg-[#ffdad6] px-3 py-1.5 rounded-full">
                <AlertTriangle size={13} />
                Desconectado
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium mb-1.5 text-[#5a4138]">
              <MessageSquare size={14} />
              Webhook URL (n8n)
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={webhookUrl}
                readOnly
                className={`${inputClass} font-mono text-xs flex-1`}
              />
              <button
                type="button"
                onClick={() => copyToClipboard(webhookUrl)}
                className="px-3 py-2 rounded-xl bg-[#edeef0] text-[#5a4138] hover:bg-[#e7e8ea] transition-colors"
                title="Copiar URL"
              >
                <Copy size={16} />
              </button>
            </div>
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium mb-1.5 text-[#5a4138]">
              <Key size={14} />
              Token de API
            </label>
            <div className="flex gap-2">
              <div className="flex-1 flex items-center px-4 py-3 text-sm rounded-xl bg-[#e7e8ea] font-mono">
                {showToken ? (
                  <span className="text-xs text-[#191c1e] truncate">
                    {apiToken}
                  </span>
                ) : (
                  <span className="tracking-[0.2em] text-[#8e7166]">
                    ••••••••••••••••••••••••
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                className="px-3 py-2 rounded-xl bg-[#edeef0] text-[#5a4138] hover:bg-[#e7e8ea] transition-colors"
                title={showToken ? "Ocultar" : "Mostrar"}
              >
                {showToken ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
              <button
                type="button"
                onClick={() => copyToClipboard(apiToken)}
                className="px-3 py-2 rounded-xl bg-[#edeef0] text-[#5a4138] hover:bg-[#e7e8ea] transition-colors"
                title="Copiar token"
              >
                <Copy size={16} />
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-xl bg-[#d4e3ff]/40">
          <ShieldCheck size={16} className="text-[#005da8] flex-shrink-0" />
          <p className="text-xs text-[#005da8]">
            Seus tokens são criptografados e armazenados de forma segura. Nunca compartilhe suas credenciais.
          </p>
        </div>
      </section>

      {/* ── 5. Notificações ──────────────────────────────── */}
      <section className="bg-white rounded-xl shadow-sm p-6 space-y-5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#ff9971]/20 flex items-center justify-center">
            <Bell size={18} className="text-[#a33900]" />
          </div>
          <h2 className="text-base font-semibold text-[#191c1e]">
            Notificações
          </h2>
        </div>

        <div className="space-y-0">
          {notifications.map((n, i) => (
            <div
              key={n.id}
              className={`flex items-center justify-between py-4 ${
                i < notifications.length - 1 ? "border-b border-[#edeef0]" : ""
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#edeef0] flex items-center justify-center">
                  {n.id === "new_order" && <Smartphone size={15} className="text-[#5a4138]" />}
                  {n.id === "order_cancel" && <AlertTriangle size={15} className="text-[#5a4138]" />}
                  {n.id === "low_stock" && <Store size={15} className="text-[#5a4138]" />}
                  {n.id === "daily_report" && <Mail size={15} className="text-[#5a4138]" />}
                  {n.id === "customer_review" && <MessageSquare size={15} className="text-[#5a4138]" />}
                </div>
                <div>
                  <p className="text-sm font-medium text-[#191c1e]">{n.label}</p>
                  <p className="text-xs text-[#8e7166]">{n.description}</p>
                </div>
              </div>
              <Toggle
                active={n.active}
                onToggle={() => toggleNotification(n.id)}
              />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
