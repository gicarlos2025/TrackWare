import React, { useState } from 'react';
import {
  Truck,
  BatteryCharging,
  Gauge,
  MapPin,
  UserCheck,
  Package,
  Sparkles,
  Search,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { Vehicle } from '../types/warehouse';
import { soundManager } from '../utils/audio';

interface FleetViewProps {
  vehicles: Vehicle[];
  onSelectVehicle: (vehicle: Vehicle) => void;
  onFocus3DVehicle: (vehicle: Vehicle) => void;
}

export const FleetView: React.FC<FleetViewProps> = ({
  vehicles,
  onSelectVehicle,
  onFocus3DVehicle,
}) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const isAgv = (v: Vehicle) => v.type === 'agv' || v.id.startsWith('AGV');
  const isTruck = (v: Vehicle) => v.type === 'truck';

  const filtered = vehicles.filter((v) => {
    let matchesType = true;
    if (filterType === 'truck') matchesType = isTruck(v);
    else if (filterType === 'agv') matchesType = isAgv(v);
    else if (filterType === 'forklift') matchesType = v.type === 'forklift';

    const matchesSearch =
      v.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.cargo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (v.driverName || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  return (
    <div className="w-full h-full pt-16 sm:pt-20 lg:pt-20 pb-20 sm:pb-8 px-3 sm:px-6 overflow-y-auto bg-slate-950 text-slate-100">
      <div className="max-w-[1720px] mx-auto space-y-4 sm:space-y-6">
        {/* Banner */}
        <div className="bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <Truck className="w-5 h-5 text-sky-400 shrink-0" />
              Frota de Transporte & Movimentação Interna
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Telemetria telemática de camiões rodoviários, empilhadoras elétricas e robôs autônomos AGV.
            </p>
          </div>

          <div className="flex items-center gap-2 max-w-full overflow-x-auto pb-1 sm:pb-0">
            {/* Filter buttons */}
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs shrink-0">
              <button
                onClick={() => setFilterType('all')}
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                  filterType === 'all'
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Todos ({vehicles.length})
              </button>
              <button
                onClick={() => setFilterType('truck')}
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                  filterType === 'truck'
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Camiões ({vehicles.filter(isTruck).length})
              </button>
              <button
                onClick={() => setFilterType('agv')}
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                  filterType === 'agv'
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                AGVs ({vehicles.filter(isAgv).length})
              </button>
              <button
                onClick={() => setFilterType('forklift')}
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                  filterType === 'forklift'
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Empilhadoras ({vehicles.filter((v) => v.type === 'forklift').length})
              </button>
            </div>
          </div>
        </div>

        {/* Vehicles Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
          {filtered.map((veh) => {
            const isTruck = veh.type === 'truck';
            const isForklift = veh.type === 'forklift';

            return (
              <div
                key={veh.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-xl transition-all space-y-4 group"
              >
                {/* Header */}
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center border ${
                        isTruck
                          ? 'bg-sky-500/15 border-sky-500/30 text-sky-400'
                          : isForklift
                          ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                          : 'bg-indigo-500/15 border-indigo-500/30 text-indigo-400'
                      }`}
                    >
                      {isTruck ? (
                        <Truck className="w-5 h-5" />
                      ) : isForklift ? (
                        <Package className="w-5 h-5" />
                      ) : (
                        <Sparkles className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-base text-white">
                          {veh.id}
                        </span>
                        <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                          {veh.type}
                        </span>
                      </div>
                      <span className="text-xs text-slate-400 truncate max-w-[200px] block">
                        {veh.name}
                      </span>
                    </div>
                  </div>

                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full border border-blue-500/30 text-blue-400 bg-blue-500/10">
                    {veh.status}
                  </span>
                </div>

                {/* Details */}
                <div className="space-y-2 text-xs bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Carga:</span>
                    <span className="font-semibold text-slate-200 truncate max-w-[200px]">
                      {veh.cargo}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Peso Total:</span>
                    <span className="font-mono text-slate-300">
                      {veh.cargoWeightKg.toLocaleString()} kg ({veh.palletsCount} {veh.palletsCount === 1 ? 'palete' : 'paletes'})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Local Atual:</span>
                    <span className="text-slate-300 truncate max-w-[200px]">
                      {veh.loc}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Condutor / Sistema:</span>
                    <span className="font-medium text-slate-300 flex items-center gap-1">
                      <UserCheck className="w-3.5 h-3.5 text-sky-400" />
                      {veh.driverName}
                    </span>
                  </div>
                </div>

                {/* Telemetry bar */}
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                    <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                      <span>Bateria / Comb.</span>
                      <span className="text-emerald-400 font-bold">{veh.batteryOrFuelPercent}%</span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${veh.batteryOrFuelPercent}%` }}
                      />
                    </div>
                  </div>

                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                    <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                      <span>Velocidade</span>
                      <span className="text-sky-400 font-bold">{veh.speedKmh} km/h</span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-sky-500 rounded-full"
                        style={{ width: `${Math.min(100, (veh.speedKmh / 25) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => {
                      soundManager.playClick();
                      onSelectVehicle(veh);
                    }}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 py-2 rounded-xl text-xs font-semibold border border-slate-700 transition-all cursor-pointer"
                  >
                    Abrir Painel
                  </button>

                  <button
                    onClick={() => {
                      soundManager.playClick();
                      onFocus3DVehicle(veh);
                    }}
                    className="flex items-center justify-center gap-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/40 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                    title="Focar na visualização 3D"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Ver no 3D</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
