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
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F5F5F0] px-4">
      {/* Logo + Title */}
      <div className="flex flex-col items-center mb-8">
        <div className="w-14 h-14 rounded-xl bg-[#8B2500] flex items-center justify-center mb-4 shadow-md">
          <Utensils className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-[#8B2500] tracking-tight">
          PedAI
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          O maestro da sua cozinha inteligente.
        </p>
      </div>

      {/* Card */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg border-t-4 border-[#A0522D] overflow-hidden">
        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* E-mail */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                E-mail
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#F3F4F6] border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#A0522D] focus:border-transparent outline-none transition"
                  required
                />
              </div>
            </div>

            {/* Senha */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#F3F4F6] border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#A0522D] focus:border-transparent outline-none transition"
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
                  className="w-4 h-4 rounded border-gray-300 text-[#A0522D] focus:ring-[#A0522D]"
                />
                <span className="text-sm text-gray-600">Lembrar de mim</span>
              </label>
              <a
                href="#"
                className="text-sm text-[#8B2500] hover:text-[#A0522D] font-medium transition"
              >
                Esqueci minha senha
              </a>
            </div>

            {/* Error */}
            {error && (
              <p className="text-red-500 text-sm bg-red-50 p-2.5 rounded-lg">
                {error}
              </p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#A0522D] text-white py-2.5 rounded-lg font-semibold hover:bg-[#8B2500] transition disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
            >
              {loading ? "Entrando..." : "Entrar"}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          {/* Separator */}
          <div className="my-6 border-t border-gray-200" />

          {/* Sign up */}
          <p className="text-center text-sm text-gray-500">
            Ainda não tem uma conta?{" "}
            <a
              href="#"
              className="text-[#8B2500] hover:text-[#A0522D] font-medium transition"
            >
              Solicite acesso
            </a>
          </p>
        </div>
      </div>

      {/* Footer badges */}
      <div className="mt-8 flex flex-col items-center gap-4">
        <div className="flex flex-wrap justify-center gap-6">
          <div className="flex items-center gap-2 text-gray-400">
            <TrendingUp className="w-4 h-4" />
            <span className="text-xs uppercase tracking-wider font-medium">
              Performance
            </span>
            <span className="text-xs text-gray-300">/</span>
            <span className="text-xs text-gray-500">Operação Ágil</span>
          </div>
          <div className="flex items-center gap-2 text-gray-400">
            <Sparkles className="w-4 h-4" />
            <span className="text-xs uppercase tracking-wider font-medium">
              IA Integrada
            </span>
            <span className="text-xs text-gray-300">/</span>
            <span className="text-xs text-gray-500">Gestão Inteligente</span>
          </div>
        </div>
        <p className="text-xs text-gray-400">
          &copy; 2024 PedAI Culinary Systems. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
}
