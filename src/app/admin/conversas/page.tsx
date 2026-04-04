"use client";

import { useEffect, useState, useRef } from "react";
import {
  MessageCircle,
  Search,
  Phone,
  Clock,
  ArrowLeft,
  XCircle,
  RefreshCw,
  MapPin,
  MoreVertical,
  Send,
  Plus,
  Bot,
  Hand,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

type Message = {
  type: string;
  content: string;
  sender: "customer" | "bot" | "agent";
  timestamp: string;
};

type Conversation = {
  id: string;
  tenant_id: string;
  session_id: string | null;
  customer_phone: string | null;
  customer_name: string | null;
  channel: string;
  messages: Message[];
  status: string;
  last_message_at: string;
  created_at: string;
};

function timeAgo(date: string) {
  const now = new Date();
  const d = new Date(date);
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diff < 60) return "agora";
  if (diff < 3600) return `${Math.floor(diff / 60)}min`;
  if (diff < 86400) {
    return new Date(date).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  if (diff < 172800) return "Ontem";
  return `${Math.floor(diff / 86400)}d`;
}

function formatTime(date: string) {
  return new Date(date).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function isToday(date: string) {
  const d = new Date(date);
  const now = new Date();
  return (
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear()
  );
}

function getInitial(name: string | null) {
  return (name || "?")[0].toUpperCase();
}

export default function ConversasPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [aiActive, setAiActive] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchConversations = async () => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (statusFilter) params.set("status", statusFilter);
    params.set("limit", "50");

    const res = await fetch(`/api/conversations?${params}`);
    if (res.ok) {
      const data = await res.json();
      setConversations(data.conversations || []);
      setTotal(data.total || 0);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 15000);
    return () => clearInterval(interval);
  }, [search, statusFilter]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [selected]);

  const closeConversation = async (id: string) => {
    await fetch(`/api/conversations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "closed" }),
    });
    fetchConversations();
    if (selected?.id === id) setSelected(null);
  };

  const lastMessage = (c: Conversation) => {
    if (!c.messages || c.messages.length === 0) return "Sem mensagens";
    const last = c.messages[c.messages.length - 1];
    const prefix = last.sender === "bot" ? "Bot: " : "";
    const text = last.content || "";
    return prefix + (text.length > 45 ? text.slice(0, 45) + "..." : text);
  };

  const activeCount = conversations.filter(
    (c) => c.status === "active"
  ).length;

  const needsHuman = (c: Conversation) => {
    if (!c.messages || c.messages.length === 0) return false;
    const last = c.messages[c.messages.length - 1];
    return last.sender === "customer" && c.messages.length > 6;
  };

  return (
    <div className="h-[calc(100vh-3rem)] flex overflow-hidden bg-[#f8f9fb] rounded-[0.75rem]">
      {/* ====== LEFT COLUMN - Conversation List ====== */}
      <div
        className={`w-80 flex flex-col shrink-0 bg-white ${
          selected ? "hidden lg:flex" : "flex"
        }`}
      >
        {/* List Header */}
        <div className="px-4 pt-4 pb-2">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-bold tracking-wider uppercase text-[#191c1e]">
                Conversas Ativas
              </h2>
              <Badge variant="success" className="text-[10px] uppercase">
                {activeCount} novas
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => {
                setLoading(true);
                fetchConversations();
              }}
              title="Atualizar"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            </Button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5a4138]"
            />
            <Input
              type="text"
              placeholder="Buscar conversa..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-3 py-2 text-xs h-auto"
            />
          </div>

          {/* Status Filters */}
          <div className="flex gap-1 mt-2">
            {[
              { value: "", label: "Todas" },
              { value: "active", label: "Ativas" },
              { value: "closed", label: "Encerradas" },
            ].map((f) => (
              <Button
                key={f.value}
                variant={statusFilter === f.value ? "default" : "secondary"}
                size="xs"
                onClick={() => setStatusFilter(f.value)}
                className="text-[10px]"
              >
                {f.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto">
          {loading && conversations.length === 0 ? (
            <div className="p-8 text-center text-[#5a4138]">
              <RefreshCw size={20} className="animate-spin mx-auto mb-2" />
              <p className="text-xs">Carregando...</p>
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-8 text-center text-[#5a4138]">
              <MessageCircle
                size={28}
                className="mx-auto mb-2 opacity-30"
              />
              <p className="text-xs">Nenhuma conversa encontrada</p>
            </div>
          ) : (
            conversations.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelected(c)}
                className={`w-full text-left px-4 py-3 transition border-none ${
                  selected?.id === c.id
                    ? "bg-[rgba(204,73,0,0.05)]"
                    : "bg-transparent hover:bg-[rgba(204,73,0,0.03)]"
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className="w-10 h-10 flex items-center justify-center text-sm font-bold shrink-0 rounded-full bg-[#edeef0] text-[#5a4138]">
                    {getInitial(c.customer_name)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold truncate text-[#191c1e]">
                        {c.customer_name || c.customer_phone || "Desconhecido"}
                      </p>
                      <span className="text-[10px] shrink-0 ml-2 text-[#5a4138]">
                        {timeAgo(c.last_message_at)}
                      </span>
                    </div>

                    <p className="text-[11px] truncate mt-0.5 text-[#5a4138]">
                      {lastMessage(c)}
                    </p>

                    {/* Status Badges */}
                    <div className="flex items-center gap-1.5 mt-1.5">
                      {c.status === "active" && !needsHuman(c) && (
                        <Badge variant="success" className="text-[9px] uppercase px-1.5 py-0.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#166534] inline-block" />
                          AI Ativo
                        </Badge>
                      )}
                      {needsHuman(c) && (
                        <Badge variant="warning" className="text-[9px] uppercase px-1.5 py-0.5">
                          Aguardando Humano
                        </Badge>
                      )}
                      <Badge variant="whatsapp" className="text-[9px] px-1.5 py-0.5 font-medium">
                        <svg
                          viewBox="0 0 24 24"
                          className="w-2.5 h-2.5 fill-[#166534]"
                        >
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                        </svg>
                        WhatsApp
                      </Badge>
                    </div>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* ====== CENTER COLUMN - Chat Area ====== */}
      <div
        className={`flex-1 flex flex-col bg-[#f8f9fb] ${
          selected ? "flex" : "hidden lg:flex"
        }`}
      >
        {selected ? (
          <>
            {/* Chat Header */}
            <div className="flex items-center justify-between px-5 py-3 bg-white">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setSelected(null)}
                  className="lg:hidden"
                >
                  <ArrowLeft size={18} />
                </Button>
                <div className="w-9 h-9 flex items-center justify-center font-bold text-sm rounded-full bg-[#edeef0] text-[#5a4138]">
                  {getInitial(selected.customer_name)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm text-[#191c1e]">
                      {selected.customer_name || "Desconhecido"}
                    </p>
                    <Badge variant="whatsapp" className="text-[10px]">
                      <svg
                        viewBox="0 0 24 24"
                        className="w-3 h-3 fill-[#166534]"
                      >
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                      </svg>
                      WhatsApp Business
                    </Badge>
                  </div>
                  <p className="text-xs flex items-center gap-1 text-[#5a4138]">
                    <Phone size={10} />
                    {selected.customer_phone || "Sem telefone"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {selected.status === "active" && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => closeConversation(selected.id)}
                    title="Encerrar conversa"
                  >
                    <XCircle size={14} />
                    Encerrar
                  </Button>
                )}
                <Button variant="ghost" size="icon-sm">
                  <Search size={16} />
                </Button>
                <Button variant="ghost" size="icon-sm">
                  <MoreVertical size={16} />
                </Button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {/* Date Separator */}
              {selected.messages && selected.messages.length > 0 && (
                <div className="flex items-center justify-center my-4">
                  <span className="text-[10px] font-bold px-4 py-1 uppercase tracking-wider text-[#5a4138] bg-[#edeef0] rounded-[0.75rem]">
                    {isToday(
                      selected.messages[0]?.timestamp || selected.created_at
                    )
                      ? "Hoje"
                      : new Date(selected.created_at).toLocaleDateString(
                          "pt-BR"
                        )}
                  </span>
                </div>
              )}

              {!selected.messages || selected.messages.length === 0 ? (
                <p className="text-center text-sm py-8 text-[#5a4138]">
                  Sem mensagens nesta conversa
                </p>
              ) : (
                selected.messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex items-end gap-2 ${
                      msg.sender === "customer"
                        ? "justify-start"
                        : "justify-end"
                    }`}
                  >
                    {/* Customer avatar on left */}
                    {msg.sender === "customer" && (
                      <div className="w-7 h-7 flex items-center justify-center text-[10px] font-bold shrink-0 rounded-full bg-[#edeef0] text-[#5a4138]">
                        {getInitial(selected.customer_name)}
                      </div>
                    )}

                    <div
                      className={`max-w-[70%] px-4 py-3 ${
                        msg.sender === "customer"
                          ? "rounded-[0.25rem_0.75rem_0.75rem_0.75rem] bg-white text-[#191c1e]"
                          : "rounded-[0.75rem_0.25rem_0.75rem_0.75rem] bg-gradient-to-br from-[#a33900] to-[#cc4900] text-white"
                      }`}
                    >
                      {/* Sender Label */}
                      <div className="flex items-center gap-1 mb-1">
                        {msg.sender === "customer" ? (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#5a4138]">
                            Cliente
                          </span>
                        ) : (
                          <>
                            <Bot size={10} className="text-white/70" />
                            <span className="text-[10px] font-bold uppercase tracking-wider text-white/70">
                              {msg.sender === "bot" ? "IA PedAI" : "Atendente"}
                            </span>
                          </>
                        )}
                      </div>

                      <p className="text-sm whitespace-pre-wrap leading-relaxed">
                        {msg.content}
                      </p>

                      <p
                        className={`text-[10px] mt-1.5 text-right ${
                          msg.sender === "customer"
                            ? "text-[#5a4138]"
                            : "text-white/60"
                        }`}
                      >
                        {msg.timestamp ? formatTime(msg.timestamp) : ""}
                      </p>
                    </div>

                    {/* Bot avatar on right */}
                    {msg.sender !== "customer" && (
                      <div className="w-7 h-7 flex items-center justify-center shrink-0 rounded-full bg-gradient-to-br from-[#a33900] to-[#cc4900]">
                        <Bot size={12} className="text-white" />
                      </div>
                    )}
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="px-4 py-3 bg-white">
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="icon"
                  className="rounded-full shrink-0"
                >
                  <Plus size={18} />
                </Button>
                <div className="flex-1">
                  <Input
                    type="text"
                    placeholder="Escreva uma mensagem..."
                    className="text-sm"
                    disabled
                  />
                </div>
                <Button
                  variant="default"
                  size="icon"
                  className="rounded-full shrink-0"
                >
                  <Send size={16} />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-[#5a4138]">
            <div className="text-center">
              <MessageCircle
                size={48}
                className="mx-auto mb-3 opacity-20"
              />
              <p className="text-sm font-medium">
                Selecione uma conversa para visualizar
              </p>
              <p className="text-xs mt-1 text-[#5a4138]/60">
                {total} conversas disponíveis
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ====== RIGHT COLUMN - Customer Details ====== */}
      {selected && (
        <div className="hidden xl:flex w-72 flex-col shrink-0 overflow-y-auto bg-white">
          {/* Customer Profile */}
          <div className="flex flex-col items-center pt-6 pb-4">
            <div className="relative">
              <div className="w-20 h-20 flex items-center justify-center text-2xl font-bold rounded-full bg-[#edeef0] text-[#5a4138]">
                {getInitial(selected.customer_name)}
              </div>
              <div className="absolute bottom-1 right-1 w-4 h-4 bg-[#16a34a] rounded-full border-2 border-white" />
            </div>
            <h3 className="mt-3 font-bold text-sm text-[#191c1e]">
              {selected.customer_name || "Desconhecido"}
            </h3>
            <p className="text-xs flex items-center gap-1 mt-0.5 text-[#5a4138]">
              <Phone size={10} />
              {selected.customer_phone || "Sem telefone"}
            </p>
          </div>

          {/* Spacing separator */}
          <div className="h-2 bg-[#f8f9fb]" />

          {/* Address Section */}
          <Card className="rounded-none">
            <CardHeader className="px-4 py-3 pb-0">
              <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-[#5a4138]">
                Endereco
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 py-3 pt-2">
              <div className="flex items-start gap-2 p-3 bg-[#edeef0] rounded-[0.75rem]">
                <MapPin
                  size={14}
                  className="shrink-0 mt-0.5 text-[#5a4138]"
                />
                <p className="text-xs leading-relaxed text-[#5a4138]">
                  Endereco nao cadastrado
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Spacing separator */}
          <div className="h-2 bg-[#f8f9fb]" />

          {/* Last Order Section */}
          <Card className="rounded-none">
            <CardHeader className="px-4 py-3 pb-0">
              <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-[#5a4138]">
                Ultimo Pedido
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 py-3 pt-2">
              <div className="p-3 bg-[#edeef0] rounded-[0.75rem]">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-[#191c1e]">
                    #{selected.id.slice(0, 8).toUpperCase()}
                  </p>
                  <Badge variant="success" className="text-[9px] uppercase">
                    Em Rota
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Spacing separator */}
          <div className="h-2 bg-[#f8f9fb]" />

          {/* AI Assistant Section */}
          <Card className="rounded-none">
            <CardHeader className="px-4 py-3 pb-0">
              <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-[#5a4138]">
                Assistente IA
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 py-3 pt-2">
              <div className="p-4 bg-gradient-to-br from-[#a33900] to-[#cc4900] rounded-[0.75rem]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bot size={16} className="text-white/70" />
                    <span className="text-sm font-semibold text-white">
                      IA Ativa
                    </span>
                  </div>
                  <button
                    onClick={() => setAiActive(!aiActive)}
                    className="w-10 h-5 transition relative rounded-[0.75rem]"
                    style={{
                      background: aiActive ? "#cc4900" : "rgba(255,255,255,0.3)",
                      border: aiActive
                        ? "2px solid rgba(255,255,255,0.5)"
                        : "2px solid rgba(255,255,255,0.2)",
                    }}
                  >
                    <span
                      className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform"
                      style={{
                        left: aiActive ? "20px" : "2px",
                      }}
                    />
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Spacing separator */}
          <div className="h-2 bg-[#f8f9fb]" />

          {/* Intervene Button */}
          <div className="px-4 py-3">
            <Button
              variant="default"
              size="lg"
              className="w-full uppercase tracking-wide font-bold"
            >
              <Hand size={18} />
              Intervir Agora
            </Button>
            <p className="text-[10px] text-center mt-2 leading-relaxed text-[#5a4138]">
              Ao intervir, a IA sera desativada temporariamente para este
              atendimento.
            </p>
          </div>

          {/* Spacing separator */}
          <div className="h-2 bg-[#f8f9fb]" />

          {/* Customer Satisfaction */}
          <Card className="rounded-none">
            <CardHeader className="px-4 py-3 pb-0">
              <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-[#5a4138]">
                Satisfacao Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 py-3 pt-2">
              <div className="flex items-center gap-3">
                <span className="text-3xl font-bold text-[#16a34a]">
                  94%
                </span>
                <div className="flex-1 flex items-end gap-0.5 h-8">
                  {[65, 78, 85, 70, 90, 94, 88].map((v, i) => (
                    <div
                      key={i}
                      className={`flex-1 rounded-t opacity-80 ${
                        v >= 90
                          ? "bg-[#16a34a]"
                          : v >= 75
                          ? "bg-[#a33900]"
                          : "bg-[#cc4900]"
                      }`}
                      style={{ height: `${v}%` }}
                    />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
