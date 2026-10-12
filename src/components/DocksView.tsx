import React from 'react';
import {
  Truck,
  CheckCircle2,
  Clock,
  ThermometerSnowflake,
  ShieldAlert,
  ArrowRight,
  Play,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { DockBay, Vehicle } from '../types/warehouse';
import { soundManager } from '../utils/audio';

interface DocksViewProps {
  docks: DockBay[];
  vehicles: Vehicle[];
  onSelectVehicle: (vehicle: Vehicle) => void;
  onAccelerateDock: (dockId: number) => void;
  onReleaseDock: (dockId: number) => void;
  onFocus3DDock: (dockId: number) => void;
}

export const DocksView: React.FC<DocksViewProps> = ({
  docks,
  vehicles,
  onSelectVehicle,
  onAccelerateDock,
  onReleaseDock,
  onFocus3DDock,
}) => {
  return (
    <div className="w-full h-full pt-16 sm:pt-20 lg:pt-20 pb-20 sm:pb-8 px-3 sm:px-6 overflow-y-auto bg-slate-950 text-slate-100">
      <div className="max-w-[1720px] mx-auto space-y-4 sm:space-y-6">
        {/* Banner */}
        <div className="bg-gradient-to-r from-blue-900/40 via-slate-900 to-slate-900 border border-blue-500/30 p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <Truck className="w-5 h-5 text-blue-400 shrink-0" />
              Gestão das Docas de Carga & Descarga
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Monitorização em tempo real de portões seccionais, selos de acostagem e ciclos de turnaround.
            </p>
          </div>

          <div className="flex items-center gap-4 sm:gap-6 text-xs font-mono shrink-0">
            <div>
              <span className="text-slate-500 block text-[10px] uppercase">Docas Operacionais</span>
              <span className="text-base sm:text-lg font-bold text-emerald-400">
                {docks.filter((d) => d.status !== 'Manutenção').length} / {docks.length}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase">Ciclos Hoje</span>
              <span className="text-base sm:text-lg font-bold text-sky-400">
                {docks.reduce((acc, d) => acc + d.totalOperationsToday, 0)}
              </span>
            </div>
          </div>
        </div>

        {/* Docks Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
          {docks.map((dock) => {
            const assignedVehicle = vehicles.find((v) => v.id === dock.assignedVehicleId);
            const isOccupied = dock.status !== 'Disponível';

            let statusColor = 'text-slate-400 bg-slate-800 border-slate-700';
            if (dock.status === 'Disponível') {
              statusColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
            } else if (dock.status === 'Em Carga') {
              statusColor = 'text-blue-400 bg-blue-500/10 border-blue-500/30';
            } else if (dock.status === 'Em Descarga') {
              statusColor = 'text-amber-400 bg-amber-500/10 border-amber-500/30';
            }

            return (
              <div
                key={dock.id}
                className={`bg-slate-900 rounded-2xl border transition-all shadow-xl flex flex-col justify-between ${
                  isOccupied
                    ? 'border-slate-700 hover:border-blue-500/60'
                    : 'border-slate-800 hover:border-emerald-500/40'
                }`}
              >
                {/* Header */}
                <div className="p-5 border-b border-slate-800">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-mono font-black text-white">
                        {dock.number}
                      </span>
                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border flex items-center gap-1 ${statusColor}`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                        {dock.status}
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        soundManager.playClick();
                        onFocus3DDock(dock.id);
                      }}
                      className="text-xs text-sky-400 hover:text-white px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
                      title="Ver no 3D"
                    >
                      Ver 3D
                    </button>
                  </div>

                  <p className="text-xs text-slate-400">{dock.name}</p>

                  <div className="flex items-center gap-2 mt-2 text-[11px] font-mono text-slate-400">
                    <ThermometerSnowflake className="w-3.5 h-3.5 text-blue-400" />
                    <span>Zona: {dock.temperatureZone}</span>
                  </div>
                </div>

                {/* Body Content */}
                <div className="p-5 space-y-4 flex-1">
                  {/* Vehicle docked info */}
                  {assignedVehicle ? (
                    <div
                      onClick={() => {
                        soundManager.playClick();
                        onSelectVehicle(assignedVehicle);
                      }}
                      className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 hover:border-blue-500/50 cursor-pointer transition-all group"
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[11px] font-mono font-bold text-sky-400 flex items-center gap-1.5">
                          <Truck className="w-3.5 h-3.5 text-blue-400" />
                          {assignedVehicle.id}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {assignedVehicle.licensePlate}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 font-medium truncate">
                        {assignedVehicle.name}
                      </p>
                      <span className="text-[10px] text-slate-400 block mt-1 truncate">
                        Carga: {assignedVehicle.cargo}
                      </span>
                    </div>
                  ) : (
                    <div className="bg-slate-950/40 p-4 rounded-xl border border-dashed border-slate-800 text-center">
                      <span className="text-xs text-emerald-400 font-medium block">
                        Doca Livre & Desinfetada
                      </span>
                      <span className="text-[10px] text-slate-500 mt-1 block">
                        Próximo agendado: {dock.scheduledNextVehicle || 'Nenhum'}
                      </span>
                    </div>
                  )}

                  {/* Progress bar */}
                  {isOccupied && (
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-slate-400">Progresso do Ciclo</span>
                        <span className="text-blue-400 font-bold">
                          {dock.progressPercent}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 rounded-full transition-all duration-500"
                          style={{ width: `${dock.progressPercent}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Next scheduled info */}
                  <div className="bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/80 text-[11px] flex items-center justify-between text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      Próxima Reserva:
                    </span>
                    <span className="font-mono text-slate-300">
                      {dock.scheduledNextVehicle || 'Livre'}
                    </span>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="p-4 bg-slate-950/60 border-t border-slate-800 flex items-center gap-2">
                  {isOccupied ? (
                    <>
                      <button
                        onClick={() => {
                          soundManager.playClick();
                          onAccelerateDock(dock.id);
                        }}
                        className="flex-1 flex items-center justify-center gap-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                      >
                        <Play className="w-3 h-3" />
                        Acelerar (WMS)
                      </button>
                      <button
                        onClick={() => {
                          soundManager.playDockSuccess();
                          onReleaseDock(dock.id);
                        }}
                        className="flex-1 flex items-center justify-center gap-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        Liberar Doca
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => {
                        soundManager.playClick();
                        onAccelerateDock(dock.id);
                      }}
                      className="w-full flex items-center justify-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                      Acostar Camião da Fila
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
