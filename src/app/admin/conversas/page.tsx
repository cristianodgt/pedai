"use client";

import { useState, useRef, useEffect } from "react";
import {
  Search,
  Phone,
  Send,
  Bot,
  Hand,
  MapPin,
  Paperclip,
  MoreVertical,
  Package,
  Smile,
  MessageSquare,
  MessageCircle,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface ApiMessage {
  type: string;
  content: string;
  sender: string; // "customer" | "bot" | "ai" | "agent"
  timestamp: string;
}

interface ApiConversation {
  id: string;
  customer_name: string | null;
  customer_phone: string | null;
  channel: string;
  status: string; // "active" | "waiting" | "closed"
  messages: ApiMessage[];
  last_message_at: string;
  session_id: string | null;
}

// UI-friendly shape (superset of both API and mock)
interface UIConversation {
  id: string;
  name: string;
  phone: string;
  avatar: string;
  lastMessage: string;
  time: string;
  status: "ai" | "waiting";
  channel: string;
  online: boolean;
  messages: ApiMessage[];
  address: string;
  lastOrder: string;
  lastOrderStatus: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function initials(name: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

function apiToUI(c: ApiConversation): UIConversation {
  const lastMsg = c.messages[c.messages.length - 1];
  return {
    id: c.id,
    name: c.customer_name ?? "Cliente",
    phone: c.customer_phone ?? "—",
    avatar: initials(c.customer_name),
    lastMessage: lastMsg?.content ?? "Sem mensagens",
    time: c.last_message_at ? formatTime(c.last_message_at) : "",
    status: c.status === "waiting" ? "waiting" : "ai",
    channel: c.channel,
    online: c.status === "active",
    messages: c.messages,
    address: "",
    lastOrder: "",
    lastOrderStatus: "",
  };
}

// WhatsApp SVG path (reusable)
const WA_PATH =
  "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z";

// ── Component ─────────────────────────────────────────────────────────────────

export default function ConversasPage() {
  const [conversations, setConversations] = useState<UIConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [aiActive, setAiActive] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [interventionMsg, setInterventionMsg] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ── Load from API on mount ────────────────────────────────────────────────
  useEffect(() => {
    async function loadConversations() {
      try {
        const res = await fetch("/api/conversations");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: ApiConversation[] = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const mapped = data.map(apiToUI);
          setConversations(mapped);
          setSelectedId(mapped[0].id);
        }
        // If empty array, leave conversations as [] and selectedId as null
      } catch {
        // Network/parse error: leave state empty
      } finally {
        setLoading(false);
      }
    }
    loadConversations();
  }, []);

  // ── Scroll to bottom when conversation changes or messages update ─────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedId, conversations]);

  // ── Derived state ─────────────────────────────────────────────────────────
  const selected = selectedId
    ? conversations.find((c) => c.id === selectedId) ?? null
    : null;

  const filtered = conversations.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ── Send message locally ──────────────────────────────────────────────────
  async function sendMessage() {
    if (!message.trim() || !selected || sending) return;
    setSending(true);

    const newMsg: ApiMessage = {
      type: "text",
      content: message.trim(),
      sender: "agent",
      timestamp: new Date().toISOString(),
    };

    // Try POST to API first; fall back to local-only append
    try {
      const res = await fetch(`/api/conversations/${selected.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newMsg.content, sender: "agent" }),
      });
      if (!res.ok) throw new Error();
    } catch {
      // API unavailable — append locally with note
      newMsg.content = newMsg.content + "\n\n(Enviado localmente)";
    }

    setConversations((prev) =>
      prev.map((c) =>
        c.id === selected.id
          ? { ...c, messages: [...(c.messages ?? []), newMsg] }
          : c
      )
    );
    setMessage("");
    setSending(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  // ── Intervir Agora ────────────────────────────────────────────────────────
  function handleInterveir() {
    setAiActive(false);
    setInterventionMsg("IA desativada para este atendimento");
    setTimeout(() => setInterventionMsg(""), 4000);
  }

  // ── Render helpers ────────────────────────────────────────────────────────
  function renderSenderLabel(sender: string) {
    if (sender === "customer") return "Cliente";
    if (sender === "agent") return "Atendente";
    return "IA PedAI";
  }

  function isRightBubble(sender: string) {
    return sender !== "customer";
  }

  function bubbleStyle(sender: string) {
    if (sender === "customer")
      return "bg-[#edeef0] text-[#191c1e] rounded-2xl rounded-tl-none";
    if (sender === "agent")
      return "bg-[#2563eb] text-white rounded-2xl rounded-tr-none shadow-md";
    return "bg-[#a33900] text-white rounded-2xl rounded-tr-none shadow-md";
  }

  function timeColor(sender: string) {
    return sender === "customer" ? "text-[#5a4138]/50" : "text-white/60";
  }

  return (
    <div className="-m-8 flex h-[calc(100vh-64px)] overflow-hidden">
      {/* ═══════ LEFT PANEL ═══════ */}
      <div className="w-80 shrink-0 flex flex-col bg-[#f3f4f6] border-r border-[#e7e8ea]">
        {/* Header */}
        <div className="px-5 pt-5 pb-3">
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-base font-bold text-[#191c1e]">Conversas Ativas</h2>
            {!loading && (
              <span className="text-[10px] font-bold uppercase tracking-wider bg-[#d4e3ff] text-[#004883] px-2 py-0.5 rounded-full">
                {filtered.length} ativas
              </span>
            )}
          </div>

          {/* Search */}
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5a4138]/60"
            />
            <input
              type="text"
              placeholder="Buscar conversa..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-[#e7e8ea] rounded-xl border-none outline-none placeholder:text-[#5a4138]/50 text-[#191c1e]"
            />
          </div>
        </div>

        {/* Conversation List */}
        <div
          className="flex-1 overflow-y-auto px-3 pb-3 space-y-1.5"
          style={{ scrollbarWidth: "thin", scrollbarColor: "#ccc transparent" }}
        >
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-[#5a4138]/50">
              <div className="w-6 h-6 border-2 border-[#a33900]/30 border-t-[#a33900] rounded-full animate-spin mb-3" />
              <p className="text-xs">Carregando conversas...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <MessageCircle size={32} className="text-[#5a4138]/30 mb-3" />
              <p className="text-sm font-semibold text-[#191c1e]/60">
                {searchQuery ? "Nenhuma conversa encontrada" : "Nenhuma conversa ativa"}
              </p>
              <p className="text-xs text-[#5a4138]/50 mt-1">
                {searchQuery
                  ? "Tente outro termo de busca."
                  : "As conversas do WhatsApp aparecerão aqui automaticamente"}
              </p>
            </div>
          ) : (
            filtered.map((c) => {
              const isActive = c.id === selectedId;
              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedId(c.id)}
                  className={`w-full text-left p-3 rounded-xl transition-all ${
                    isActive
                      ? "bg-white shadow-sm border-b-2 border-[#a33900]/20"
                      : "bg-transparent hover:bg-white/60"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div className="relative shrink-0">
                      <div className="w-12 h-12 rounded-full bg-[#edeef0] flex items-center justify-center text-sm font-bold text-[#5a4138]">
                        {c.avatar}
                      </div>
                      {c.online && (
                        <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-[#191c1e] truncate">
                          {c.name}
                        </p>
                        <span className="text-[11px] text-[#5a4138]/70 shrink-0 ml-2">
                          {c.time}
                        </span>
                      </div>

                      <p className="text-xs text-[#5a4138]/80 truncate mt-0.5">
                        {c.lastMessage}
                      </p>

                      {/* Badges */}
                      <div className="flex items-center gap-1.5 mt-2">
                        {c.status === "ai" ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-[#d4e3ff] text-[#004883] px-2 py-0.5 rounded-full">
                            <Bot size={10} />
                            AI Ativo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-[#e7e8ea] text-[#5a4138] px-2 py-0.5 rounded-full">
                            Aguardando Humano
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                          <svg viewBox="0 0 24 24" className="w-2.5 h-2.5 fill-green-700">
                            <path d={WA_PATH} />
                          </svg>
                          WhatsApp
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ═══════ CENTER PANEL ═══════ */}
      <div className="flex-1 flex flex-col bg-white min-w-0">
        {/* No conversation selected */}
        {!selected && !loading && (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
            <MessageCircle size={48} className="text-[#5a4138]/20 mb-4" />
            <p className="text-base font-semibold text-[#191c1e]/50">Selecione uma conversa</p>
            <p className="text-sm text-[#5a4138]/40 mt-1">
              Escolha uma conversa na lista ao lado para começar a atender
            </p>
          </div>
        )}

        {/* Chat content: only shown when a conversation is selected */}
        {selected && (<>
        {/* Chat Header */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-[#edeef0]">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-[#edeef0] flex items-center justify-center text-sm font-bold text-[#5a4138]">
                {selected.avatar}
              </div>
              {selected.online && (
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-[#191c1e]">{selected.name}</h3>
                <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                  <svg viewBox="0 0 24 24" className="w-3 h-3 fill-green-700">
                    <path d={WA_PATH} />
                  </svg>
                  WhatsApp Business
                </span>
              </div>
              <p className="text-xs text-[#5a4138]/70 flex items-center gap-1">
                <Phone size={11} />
                {selected.phone}
              </p>
            </div>
          </div>
          <button className="p-2 rounded-lg hover:bg-[#f3f4f6] text-[#5a4138] transition">
            <MoreVertical size={18} />
          </button>
        </div>

        {/* Messages Area */}
        <div
          className="flex-1 overflow-y-auto px-6 py-4"
          style={{ scrollbarWidth: "thin", scrollbarColor: "#ddd transparent" }}
        >
          {/* Date Separator */}
          <div className="flex items-center justify-center my-4">
            <span className="text-[11px] font-semibold text-[#5a4138]/70 bg-[#edeef0] px-4 py-1 rounded-full">
              Hoje
            </span>
          </div>

          {/* Messages */}
          <div className="space-y-4">
            {(selected?.messages ?? []).map((msg, idx) => {
              const right = isRightBubble(msg.sender);
              return (
                <div
                  key={idx}
                  className={`flex flex-col ${right ? "items-end" : "items-start"}`}
                >
                  {/* Sender Label */}
                  <div className={`flex items-center gap-1 mb-1 ${right ? "mr-1" : "ml-1"}`}>
                    {(msg.sender === "bot" || msg.sender === "ai") && (
                      <Bot size={12} className="text-[#a33900]/60" />
                    )}
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[#5a4138]/60">
                      {renderSenderLabel(msg.sender)}
                    </span>
                  </div>

                  {/* Bubble */}
                  <div
                    className={`max-w-[65%] px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${bubbleStyle(msg.sender)}`}
                  >
                    {msg.content}
                    <p className={`text-[10px] mt-2 text-right ${timeColor(msg.sender)}`}>
                      {formatTime(msg.timestamp)}
                    </p>
                  </div>
                </div>
              );
            })}

            {/* Typing Indicator */}
            {selected?.status === "ai" && aiActive && (
              <div className="flex items-center gap-2 mt-2">
                <Bot size={14} className="text-[#a33900]/50" />
                <span className="text-xs text-[#5a4138]/60 italic animate-pulse">
                  IA está analisando...
                </span>
              </div>
            )}
          </div>
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="px-4 py-3 border-t border-[#edeef0]">
          <div className="flex items-center gap-2 bg-[#edeef0] rounded-2xl px-3 py-1.5">
            <button className="p-2 rounded-lg hover:bg-[#ddd] text-[#5a4138]/60 transition shrink-0">
              <Paperclip size={18} />
            </button>
            <textarea
              rows={1}
              placeholder="Escreva uma mensagem..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-transparent text-sm text-[#191c1e] placeholder:text-[#5a4138]/40 outline-none resize-none py-2"
            />
            <button className="p-2 rounded-lg hover:bg-[#ddd] text-[#5a4138]/60 transition shrink-0">
              <Smile size={18} />
            </button>
            <button
              onClick={sendMessage}
              disabled={sending || !message.trim()}
              className="p-2.5 bg-[#a33900] text-white rounded-xl hover:bg-[#cc4900] transition shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
        </>)}
      </div>

      {/* ═══════ RIGHT PANEL ═══════ */}
      <div
        className="w-80 shrink-0 flex flex-col border-l border-[#edeef0] bg-[#f3f4f6] overflow-y-auto"
        style={{ scrollbarWidth: "thin", scrollbarColor: "#ccc transparent" }}
      >
        {/* Customer Profile */}
        <div className="flex flex-col items-center pt-8 pb-6 bg-white">
          <div className="relative">
            <div className="w-20 h-20 rounded-3xl bg-[#edeef0] flex items-center justify-center text-2xl font-bold text-[#5a4138]">
              {selected?.avatar ?? "?"}
            </div>
            {selected?.online && (
              <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
            )}
          </div>
          <h3 className="mt-3 text-base font-bold text-[#191c1e]">{selected?.name}</h3>
          <p className="text-sm text-[#5a4138]/70 flex items-center gap-1 mt-0.5">
            <Phone size={12} />
            {selected?.phone}
          </p>
        </div>

        <div className="h-2" />

        {/* Address Card */}
        <div className="bg-white px-5 py-4">
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#5a4138]/70 mb-3">
            Endereço
          </h4>
          <div className="flex items-start gap-2.5 p-3 bg-[#edeef0] rounded-xl">
            <MapPin size={15} className="shrink-0 mt-0.5 text-[#5a4138]/60" />
            <p className="text-xs leading-relaxed text-[#5a4138] whitespace-pre-wrap">
              {selected?.address || "Endereço não cadastrado"}
            </p>
          </div>
        </div>

        <div className="h-2" />

        {/* Last Order Card */}
        <div className="bg-white px-5 py-4">
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#5a4138]/70 mb-3">
            Último Pedido
          </h4>
          {selected?.lastOrder ? (
            <div className="flex items-center justify-between p-3 bg-[#edeef0] rounded-xl">
              <div className="flex items-center gap-2">
                <Package size={14} className="text-[#5a4138]/60" />
                <span className="text-sm font-semibold text-[#191c1e]">
                  {selected.lastOrder}
                </span>
              </div>
              <span className="text-[10px] font-bold uppercase bg-[#cc4900]/15 text-[#cc4900] px-2.5 py-1 rounded-full">
                {selected.lastOrderStatus}
              </span>
            </div>
          ) : (
            <div className="p-3 bg-[#edeef0] rounded-xl">
              <p className="text-xs text-[#5a4138]/60">Nenhum pedido encontrado</p>
            </div>
          )}
        </div>

        <div className="h-2" />

        {/* AI Controls */}
        <div className="bg-white px-5 py-4">
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#5a4138]/70 mb-3">
            Controles IA
          </h4>

          {/* Intervention success message */}
          {interventionMsg && (
            <div className="mb-3 px-3 py-2 bg-green-50 border border-green-200 rounded-xl">
              <p className="text-xs text-green-700 font-medium">{interventionMsg}</p>
            </div>
          )}

          {/* AI Toggle Card */}
          <div className="bg-[#d4e3ff] rounded-xl p-4 mb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot size={18} className="text-[#004883]" />
                <span className="text-sm font-semibold text-[#004883]">
                  Assistente IA
                </span>
              </div>
              <button
                onClick={() => setAiActive((prev) => !prev)}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  aiActive ? "bg-[#004883]" : "bg-[#ccc]"
                }`}
              >
                <span
                  className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${
                    aiActive ? "left-[22px]" : "left-0.5"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Intervene Button */}
          <button
            onClick={handleInterveir}
            className="w-full flex items-center justify-center gap-2 bg-[#a33900] hover:bg-[#cc4900] text-white font-bold text-sm uppercase tracking-wide py-3.5 rounded-2xl transition"
          >
            <Hand size={18} />
            Intervir Agora
          </button>
          <p className="text-[10px] text-center text-[#5a4138]/60 mt-2 leading-relaxed">
            Ao intervir, a IA será desativada temporariamente para este atendimento.
          </p>
        </div>

        <div className="h-2" />

        {/* Customer Satisfaction */}
        <div className="bg-white px-5 py-4">
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#5a4138]/70 mb-3">
            Satisfação Cliente
          </h4>
          <div className="flex items-center gap-4">
            <span className="text-3xl font-bold text-green-600">94%</span>
            <div className="flex-1 flex items-end gap-1 h-10">
              {[65, 78, 85, 70, 90, 94, 88].map((v, i) => (
                <div
                  key={i}
                  className={`flex-1 rounded-sm ${
                    v >= 90
                      ? "bg-green-500"
                      : v >= 75
                      ? "bg-green-400"
                      : "bg-green-300"
                  }`}
                  style={{ height: `${v}%` }}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="h-4" />
      </div>
    </div>
  );
}
