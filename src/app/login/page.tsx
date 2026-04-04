"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Utensils,
  Mail,
  Lock,
  ArrowRight,
  TrendingUp,
  Sparkles,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [remember, setRemember] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Erro ao fazer login");
        return;
      }

      router.push("/admin/pedidos");
    } catch {
      setError("Erro de conexão");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-[#f8f9fb] font-[Inter,sans-serif]">
      {/* Logo + Title */}
      <div className="flex flex-col items-center mb-10">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 bg-gradient-to-br from-[#a33900] to-[#cc4900]">
          <Utensils className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-[#EA580C]">
          PedAI
        </h1>
        <p className="text-base mt-1 text-[#5a4138]">
          O maestro da sua cozinha inteligente.
        </p>
      </div>

      {/* Card */}
      <Card className="w-full max-w-md border-t-4 border-t-[#cc4900] border-[rgba(226,191,178,0.15)] overflow-hidden">
        <CardContent className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* E-mail */}
            <div>
              <label className="block text-sm font-medium mb-2 text-[#191c1e]">
                E-mail
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-[#EA580C] z-10 pointer-events-none" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="exemplo@restaurante.com"
                  className="pl-12"
                  required
                />
              </div>
            </div>

            {/* Senha */}
            <div>
              <label className="block text-sm font-medium mb-2 text-[#191c1e]">
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-[#EA580C] z-10 pointer-events-none" />
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-12"
                  required
                />
              </div>
            </div>

            {/* Remember + Forgot */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="w-4 h-4 rounded accent-[#a33900]"
                />
                <span className="text-sm text-[#5a4138]">
                  Lembrar de mim
                </span>
              </label>
              <a
                href="#"
                className="text-sm font-semibold text-[#EA580C] hover:opacity-80 transition-colors"
              >
                Esqueci minha senha
              </a>
            </div>

            {/* Error */}
            {error && (
              <Badge variant="danger" className="w-full justify-start px-3 py-2.5 text-sm rounded-xl">
                {error}
              </Badge>
            )}

            {/* Submit */}
            <Button
              type="submit"
              variant="default"
              size="xl"
              disabled={loading}
              className="w-full"
            >
              {loading ? "Entrando..." : "Entrar"}
              {!loading && <ArrowRight className="w-5 h-5" />}
            </Button>
          </form>

          {/* Separator */}
          <div className="my-6 border-t border-[#edeef0]" />

          {/* Sign up */}
          <p className="text-center text-sm text-[#5a4138]">
            Ainda n&atilde;o tem uma conta?{" "}
            <a
              href="#"
              className="font-semibold transition-colors hover:opacity-80 text-[#EA580C]"
            >
              Solicite acesso
            </a>
          </p>
        </CardContent>
      </Card>

      {/* Footer badges */}
      <div className="mt-10 flex flex-col items-center gap-5">
        <div className="flex flex-wrap justify-center gap-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br from-[#a33900] to-[#cc4900]">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#191c1e]">
                Performance
              </p>
              <p className="text-xs text-[#5a4138]">
                Operacao Agil
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br from-[#a33900] to-[#cc4900]">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#191c1e]">
                IA Integrada
              </p>
              <p className="text-xs text-[#5a4138]">
                Gestao Inteligente
              </p>
            </div>
          </div>
        </div>
        <p className="text-xs text-[#5a4138] opacity-60">
          &copy; 2024 PedAI Culinary Systems.
        </p>
      </div>
    </div>
  );
}
