import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-500 to-red-600">
      <div className="text-center text-white">
        <h1 className="text-6xl font-bold mb-4">PedAI</h1>
        <p className="text-xl mb-8 opacity-90">
          PDV + WhatsApp Inteligente para Restaurantes
        </p>
        <Link
          href="/login"
          className="bg-white text-orange-600 px-8 py-3 rounded-lg font-semibold text-lg hover:bg-orange-50 transition"
        >
          Entrar
        </Link>
      </div>
    </div>
  );
}
