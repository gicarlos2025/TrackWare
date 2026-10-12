import React from 'react';
import {
  TrendingUp,
  Clock,
  ShieldCheck,
  Package,
  Layers,
  BarChart3,
  Truck,
} from 'lucide-react';
import { WarehouseConfig } from '../types/warehouse';

interface AnalyticsViewProps {
  warehouse: WarehouseConfig;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ warehouse }) => {
  const days = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
  const weeklyThroughput = [142, 168, 195, 182, 210, 130, 85]; // pallets moved in thousands
  const maxWeekly = Math.max(...weeklyThroughput);

  return (
    <div className="w-full h-full pt-16 sm:pt-20 lg:pt-20 pb-20 sm:pb-8 px-3 sm:px-6 overflow-y-auto bg-slate-950 text-slate-100">
      <div className="max-w-[1720px] mx-auto space-y-4 sm:space-y-6">
        {/* Banner */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-sky-400" />
              Métricas Operacionais & Inteligência de Estoque
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Auditoria de desempenho WMS (Warehouse Management System) para o polo {warehouse.name}.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-xl">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Dados sincronizados em tempo real</span>
          </div>
        </div>

        {/* Top KPIs Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
            <div className="flex justify-between items-center text-slate-400 text-xs">
              <span>Entregas no Prazo (OTIF)</span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-3xl font-bold font-mono text-emerald-400">
              {warehouse.onTimeDeliveryRate}%
            </div>
            <p className="text-[11px] text-slate-500">
              Meta trimestral: 95.0% (+1.6% acima da meta)
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
            <div className="flex justify-between items-center text-slate-400 text-xs">
              <span>Tempo Médio em Doca</span>
              <Clock className="w-4 h-4 text-sky-400" />
            </div>
            <div className="text-3xl font-bold font-mono text-sky-300">
              {warehouse.averageDockTurnaroundMin} min
            </div>
            <p className="text-[11px] text-slate-500">
              Redução de 6 min após automação AGV
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
            <div className="flex justify-between items-center text-slate-400 text-xs">
              <span>Capacidade Utilizada</span>
              <Layers className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-3xl font-bold font-mono text-amber-400">
              {Math.round(((warehouse.currentOccupiedPallets ?? warehouse.stockOnHand ?? 1200) / (warehouse.totalCapacityPallets ?? warehouse.maxCapacity ?? 1500)) * 100)}%
            </div>
            <p className="text-[11px] text-slate-500">
              {(warehouse.currentOccupiedPallets ?? warehouse.stockOnHand ?? 1200).toLocaleString()} de {(warehouse.totalCapacityPallets ?? warehouse.maxCapacity ?? 1500).toLocaleString()} posições
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
            <div className="flex justify-between items-center text-slate-400 text-xs">
              <span>Área Total Coberta</span>
              <Package className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-3xl font-bold font-mono text-indigo-300">
              {(warehouse.totalAreaSqM ?? 18500).toLocaleString()} m²
            </div>
            <p className="text-[11px] text-slate-500">
              Piso industrial reforçado com guias magnéticas
            </p>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Throughput Bar Chart */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4 shadow-xl">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-white">
                  Movimentação Diária de Paletes (Semana Atual)
                </h3>
                <p className="text-xs text-slate-400">
                  Volume recebido e despachado pelas docas
                </p>
              </div>
              <span className="text-xs font-mono text-blue-400 bg-blue-500/10 px-2 py-1 rounded-md border border-blue-500/20">
                1.112 paletes total
              </span>
            </div>

            <div className="h-56 flex items-end justify-between gap-3 pt-6 pb-2 px-2">
              {days.map((day, idx) => {
                const val = weeklyThroughput[idx];
                const heightPercent = Math.round((val / maxWeekly) * 100);

                return (
                  <div key={day} className="flex-1 flex flex-col items-center gap-2 group">
                    <span className="text-[10px] font-mono text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      {val}
                    </span>
                    <div className="w-full bg-slate-950 rounded-t-lg h-40 flex items-end p-1">
                      <div
                        className="w-full bg-gradient-to-t from-blue-600 to-cyan-400 rounded-t-md transition-all duration-500 group-hover:brightness-125"
                        style={{ height: `${heightPercent}%` }}
                      />
                    </div>
                    <span className="text-xs font-mono text-slate-400 font-semibold">
                      {day}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Operational Efficiency by Dock */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4 shadow-xl">
            <div>
              <h3 className="text-sm font-bold text-white">
                Eficiência e Distribuição por Doca
              </h3>
              <p className="text-xs text-slate-400">
                Turnaround médio e índice de ocupação
              </p>
            </div>

            <div className="space-y-3.5 pt-2">
              {warehouse.docks.map((dock) => {
                const totalOps = dock.totalOperationsToday ?? dock.trucksToday ?? 8;
                const effPercent = Math.min(100, Math.round((totalOps / 20) * 100));

                return (
                  <div key={dock.id} className="space-y-1.5 bg-slate-950/50 p-3 rounded-xl border border-slate-800/80">
                    <div className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-white">
                          {dock.number ?? dock.id}
                        </span>
                        <span className="text-slate-400">{dock.name ?? dock.bayNumber}</span>
                      </div>
                      <span className="font-mono text-slate-300">
                        {totalOps} operações hoje ({effPercent}%)
                      </span>
                    </div>

                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-sky-500 to-blue-600 rounded-full"
                        style={{ width: `${effPercent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
