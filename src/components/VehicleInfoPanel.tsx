import React from 'react';
import {
  Truck,
  BatteryCharging,
  Gauge,
  MapPin,
  Package,
  UserCheck,
  CheckCircle2,
  Navigation,
  X,
  Play,
  RotateCcw,
  Sparkles,
  Zap,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { Vehicle, ESTABLISHED_ROUTINE_MOMENTS } from '../types/warehouse';
import { soundManager } from '../utils/audio';

interface VehicleInfoPanelProps {
  vehicle: Vehicle | null;
  onClose: () => void;
  onFocusCamera: () => void;
  onAccelerateOperation: (vehicleId: string) => void;
  onReleaseDock: (vehicleId: string) => void;
  onOpenRoutineMonitor?: () => void;
}

export const VehicleInfoPanel: React.FC<VehicleInfoPanelProps> = ({
  vehicle,
  onClose,
  onFocusCamera,
  onAccelerateOperation,
  onReleaseDock,
  onOpenRoutineMonitor,
}) => {
  if (!vehicle) return null;

  const isTruck = vehicle.type === 'truck';
  const isForklift = vehicle.type === 'forklift';
  const isAgv = vehicle.type === 'agv';

  const routineDef = isTruck
    ? ESTABLISHED_ROUTINE_MOMENTS.find((m) => m.step === (vehicle.routineStep || 1)) || ESTABLISHED_ROUTINE_MOMENTS[0]
    : null;

  const statusColorMap: Record<string, string> = {
    'Acoplado': 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    'A acoplar (Ré)': 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    'A acoplar': 'text-sky-400 bg-sky-500/10 border-sky-500/30',
    'A carregar': 'text-blue-400 bg-blue-500/10 border-blue-500/30',
    'A descarregar': 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30',
    'A transportar': 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    'Em trânsito': 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
    'Estacionado': 'text-slate-400 bg-slate-500/10 border-slate-500/30',
    'A carregar bateria': 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  };

  const statusBadgeClass =
    statusColorMap[vehicle.status] || 'text-blue-400 bg-blue-500/10 border-blue-500/30';

  return (
    <aside
      id="info-panel"
      className="fixed inset-x-2 bottom-16 sm:inset-auto sm:top-20 sm:right-6 sm:bottom-auto w-auto sm:w-96 max-h-[72vh] sm:max-h-[85vh] bg-slate-900/95 text-slate-100 backdrop-blur-xl p-4 sm:p-5 rounded-2xl shadow-2xl z-30 pointer-events-auto border border-slate-700/80 overflow-y-auto transition-all duration-300 animate-fade-in"
    >
      {/* Mobile Grab Handle */}
      <div className="w-10 h-1 bg-slate-700/80 rounded-full mx-auto mb-2.5 sm:hidden" />

      {/* Panel Header */}
      <div className="flex justify-between items-start mb-3 sm:mb-4 pb-2.5 sm:pb-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center border shadow-inner ${
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
              <h2 id="panel-title" className="text-base font-bold font-mono tracking-tight text-white">
                {vehicle.id}
              </h2>
              {vehicle.licensePlate && (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  {vehicle.licensePlate}
                </span>
              )}
            </div>
            <p id="panel-subtitle" className="text-xs text-slate-400 truncate max-w-[210px]">
              {vehicle.name}
            </p>
          </div>
        </div>

        <button
          id="close-panel"
          onClick={() => {
            soundManager.playClick();
            onClose();
          }}
          className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          title="Fechar Painel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Primary Details (matching required IDs panel-status, panel-cargo, panel-location) */}
      <div className="space-y-3 text-xs mb-4">
        {/* Status */}
        <div className="flex justify-between items-center py-1.5 border-b border-slate-800/80">
          <span className="text-slate-400 font-medium">Estado Operacional</span>
          <span
            id="panel-status"
            className={`font-semibold px-2 py-0.5 rounded-full border text-[11px] flex items-center gap-1.5 ${statusBadgeClass}`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
            {vehicle.status}
          </span>
        </div>

        {/* Cargo */}
        <div className="flex justify-between items-start py-1.5 border-b border-slate-800/80">
          <span className="text-slate-400 font-medium">Carga Atual</span>
          <div className="text-right">
            <span id="panel-cargo" className="font-semibold text-slate-200 block text-right max-w-[200px]">
              {vehicle.cargo}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              {vehicle.cargoWeightKg.toLocaleString()} kg ({vehicle.palletsCount} {vehicle.palletsCount === 1 ? 'palete' : 'paletes'})
            </span>
          </div>
        </div>

        {/* Location / Destination */}
        <div className="flex justify-between items-start py-1.5 border-b border-slate-800/80">
          <span className="text-slate-400 font-medium">Destino / Local</span>
          <div className="text-right">
            <span id="panel-location" className="font-medium text-slate-200 block max-w-[200px]">
              {vehicle.loc}
            </span>
            <span className="text-[10px] text-slate-400 flex items-center justify-end gap-1 mt-0.5">
              <MapPin className="w-3 h-3 text-blue-400" />
              {vehicle.destination}
            </span>
          </div>
        </div>

        {/* Operator / Driver */}
        <div className="flex justify-between items-center py-1.5 border-b border-slate-800/80">
          <span className="text-slate-400 font-medium">Condutor / Sistema</span>
          <span className="font-medium text-slate-300 flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5 text-sky-400" />
            {vehicle.driverName}
          </span>
        </div>

        {/* Carrier & Vehicle Model */}
        {(vehicle.carrier || vehicle.modelName) && (
          <div className="flex justify-between items-center py-1.5 border-b border-slate-800/80">
            <span className="text-slate-400 font-medium">Transportadora / Modelo</span>
            <div className="text-right">
              {vehicle.carrier && (
                <span className="font-semibold text-sky-300 block">
                  {vehicle.carrier}
                </span>
              )}
              {vehicle.modelName && (
                <span className="text-[10px] text-slate-400 font-mono block">
                  {vehicle.modelName}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Assigned Dock Bay */}
        {vehicle.assignedDock && (
          <div className="flex justify-between items-center py-1.5 border-b border-slate-800/80">
            <span className="text-slate-400 font-medium">Doca Designada</span>
            <span className="font-mono font-bold text-sky-400 px-2 py-0.5 rounded bg-sky-500/10 border border-sky-500/20 text-[11px]">
              Doca 0{vehicle.assignedDock}
            </span>
          </div>
        )}

        {/* Safety Scanner Protocol */}
        <div className="flex justify-between items-center py-1.5 border-b border-slate-800/80">
          <span className="text-slate-400 font-medium">Protocolo Anti-Colisão</span>
          <span className="font-mono text-[11px] text-emerald-400 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            LiDAR DRR / ISO 3691-4
          </span>
        </div>
      </div>

      {/* Routine Moment Card (Estabelecido conforme parâmetros operacionais) */}
      <div className="mb-4 bg-slate-900/95 border border-sky-500/30 rounded-xl p-3 shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-sky-500/5 rounded-full blur-xl pointer-events-none" />
        
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center">
              <Zap className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-bold text-white font-mono">
              Rotina Operacional
            </span>
          </div>

          {isTruck && (
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
              Momento {vehicle.routineStep || 1}/11
            </span>
          )}
        </div>

        {isTruck && routineDef ? (
          <div>
            <div className="text-xs font-semibold text-sky-300 mb-0.5 flex items-center gap-1">
              <Clock className="w-3 h-3 text-sky-400 shrink-0" />
              <span>{vehicle.routineStepName || routineDef.name}</span>
            </div>
            <p className="text-[11px] text-slate-300 mb-2">
              {vehicle.routineStepDesc || routineDef.description}
            </p>

            {/* Moment Progress bar */}
            <div className="mb-2">
              <div className="flex justify-between text-[9px] font-mono text-slate-400 mb-1">
                <span>Progresso do Ciclo</span>
                <span>{Math.round(((vehicle.routineStep || 1) / 11) * 100)}%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-sky-400 to-emerald-400 rounded-full transition-all duration-300"
                  style={{ width: `${((vehicle.routineStep || 1) / 11) * 100}%` }}
                />
              </div>
            </div>

            {/* Parameters Badges */}
            <div className="flex flex-wrap gap-1 text-[9px] font-mono mb-2">
              {routineDef.parameters.map((param, i) => (
                <span
                  key={i}
                  className="px-1.5 py-0.5 rounded bg-slate-950/80 text-sky-200 border border-slate-700"
                >
                  {param}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-[11px] text-slate-300 space-y-1 mb-2">
            <div className="font-semibold text-amber-300 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-amber-400 shrink-0" />
              <span>
                {isForklift ? 'Rotina de Transbordo Doca <-> Racks' : 'Rotina Autônoma Contínua'}
              </span>
            </div>
            <p className="text-slate-400">
              {isForklift
                ? 'Coleta acelerada na doca, pesagem com balança embarcada e elevação ao rack.'
                : 'Navegação por waypoints ópticos com parada preventiva por escaneamento LiDAR 360°.'}
            </p>
          </div>
        )}

        {onOpenRoutineMonitor && (
          <button
            onClick={() => {
              soundManager.playClick();
              onOpenRoutineMonitor();
            }}
            className="w-full mt-1 py-1.5 px-2.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 text-[11px] font-semibold flex items-center justify-center gap-1.5 border border-sky-500/20 transition-all cursor-pointer"
          >
            <span>Ver Matriz dos 11 Momentos</span>
          </button>
        )}
      </div>

      {/* Telemetry Gauges: Battery / Fuel & Speed */}
      <div className="grid grid-cols-2 gap-2 mb-4 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
        <div>
          <div className="flex justify-between text-[11px] text-slate-400 mb-1">
            <span className="flex items-center gap-1">
              <BatteryCharging className="w-3 h-3 text-emerald-400" />
              Bateria / Célula
            </span>
            <span className="font-mono font-bold text-emerald-400">
              {vehicle.batteryOrFuelPercent}%
            </span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full rounded-full ${
                vehicle.batteryOrFuelPercent > 40
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                  : 'bg-gradient-to-r from-amber-500 to-rose-500'
              }`}
              style={{ width: `${vehicle.batteryOrFuelPercent}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-[11px] text-slate-400 mb-1">
            <span className="flex items-center gap-1">
              <Gauge className="w-3 h-3 text-sky-400" />
              Velocidade
            </span>
            <span className="font-mono font-bold text-sky-300">
              {vehicle.speedKmh} km/h
            </span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="h-full bg-sky-500 rounded-full"
              style={{ width: `${Math.min(100, (vehicle.speedKmh / 25) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Operational Actions */}
      <div className="space-y-2 pt-1">
        <button
          onClick={() => {
            soundManager.playClick();
            onFocusCamera();
          }}
          className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700/80 text-sky-300 border border-slate-700 hover:border-sky-500/50 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer"
        >
          <Navigation className="w-3.5 h-3.5" />
          Focar Câmara 3D no Veículo
        </button>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => {
              soundManager.playClick();
              onAccelerateOperation(vehicle.id);
            }}
            className="flex items-center justify-center gap-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer"
          >
            <Play className="w-3 h-3" />
            Acelerar Ciclo
          </button>

          <button
            onClick={() => {
              soundManager.playDockSuccess();
              onReleaseDock(vehicle.id);
            }}
            className="flex items-center justify-center gap-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer"
          >
            <CheckCircle2 className="w-3 h-3" />
            Concluir Carga
          </button>
        </div>
      </div>
    </aside>
  );
};
