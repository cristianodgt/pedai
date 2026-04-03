export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Pedidos Hoje", value: "0", color: "text-orange-600" },
          { label: "Faturamento", value: "R$ 0,00", color: "text-green-600" },
          { label: "Ticket Médio", value: "R$ 0,00", color: "text-blue-600" },
          { label: "WhatsApp", value: "0", color: "text-emerald-600" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-lg border border-gray-200 p-6"
          >
            <p className="text-sm text-gray-500">{stat.label}</p>
            <p className={`text-2xl font-bold mt-1 ${stat.color}`}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>
      <p className="text-gray-400 text-sm mt-8 text-center">
        Dashboard completo será implementado na Fase 4
      </p>
    </div>
  );
}
