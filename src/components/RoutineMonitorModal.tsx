import React, { useState } from 'react';
import {
  X,
  Play,
  Zap,
  CheckCircle2,
  Clock,
  Compass,
  FileCheck2,
  Lock,
  ArrowRight,
  ShieldCheck,
  Scale,
  Sparkles,
} from 'lucide-react';
import { Vehicle, ESTABLISHED_ROUTINE_MOMENTS } from '../types/warehouse';
import { soundManager } from '../utils/audio';

interface RoutineMonitorModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicles: Vehicle[];
  onSelectVehicle: (v: Vehicle) => void;
  onAccelerateAll: () => void;
  simSpeed: number;
  onSetSimSpeed: (speed: number) => void;
}

export const RoutineMonitorModal: React.FC<RoutineMonitorModalProps> = ({
  isOpen,
  onClose,
  vehicles,
  onSelectVehicle,
  onAccelerateAll,
  simSpeed,
  onSetSimSpeed,
}) => {
  const [activeTab, setActiveTab] = useState<'vehicles' | 'matrix'>('vehicles');

  if (!isOpen) return null;

  const trucks = vehicles.filter((v) => v.type === 'truck');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-sky-400">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold font-mono text-white tracking-tight">
                  Rotina Operacional dos Momentos
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/10 text-sky-400 border border-blue-500/20">
                  WMS-SOP v4.2
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Parâmetros estabelecidos e monitoramento em tempo real dos 11 momentos de carga e descarga
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              soundManager.playClick();
              onClose();
            }}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub-header Controls & Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-b border-slate-800/80 bg-slate-950/50">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                soundManager.playClick();
                setActiveTab('vehicles');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'vehicles'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              Veículos em Tempo Real ({trucks.length})
            </button>
            <button
              onClick={() => {
                soundManager.playClick();
                setActiveTab('matrix');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'matrix'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              Matriz dos 11 Momentos
            </button>
          </div>

          {/* Speed accelerator toolbar */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
              Velocidade dos Movimentos:
            </span>
            <div className="flex items-center bg-slate-800/90 p-0.5 rounded-xl border border-slate-700 text-xs font-mono">
              {[1, 2, 5].map((spd) => (
                <button
                  key={spd}
                  onClick={() => {
                    soundManager.playClick();
                    onSetSimSpeed(spd);
                  }}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    simSpeed === spd
                      ? 'bg-sky-500 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {spd}x
                </button>
              ))}
            </div>

            <button
              onClick={() => {
                soundManager.playClick();
                onAccelerateAll();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 transition-all cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5" />
              Acelerar Operação
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {activeTab === 'vehicles' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {trucks.map((truck) => {
                const stepNum = truck.routineStep || 3;
                const def = ESTABLISHED_ROUTINE_MOMENTS.find((m) => m.step === stepNum) || ESTABLISHED_ROUTINE_MOMENTS[0];

                return (
                  <div
                    key={truck.id}
                    onClick={() => {
                      soundManager.playClick();
                      onSelectVehicle(truck);
                      onClose();
                    }}
                    className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-sky-500/50 transition-all cursor-pointer group hover:shadow-lg"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2.5">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm text-white group-hover:text-sky-300 transition-colors">
                            {truck.id}
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                            {truck.carrier || 'WMS'}
                          </span>
                          {truck.assignedDock && (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-sky-400 border border-blue-500/20">
                              Doca 0{truck.assignedDock}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 truncate mt-0.5">
                          {truck.name} · {truck.cargo}
                        </p>
                      </div>

                      <span className="shrink-0 text-[11px] font-bold font-mono px-2.5 py-1 rounded-full bg-sky-500/15 text-sky-400 border border-sky-500/30">
                        Momento {stepNum}/11
                      </span>
                    </div>

                    {/* Routine Step Title */}
                    <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800/80 mb-3">
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-200 mb-1">
                        <span className="flex items-center gap-1.5 text-sky-400">
                          <Clock className="w-3.5 h-3.5" />
                          {truck.routineStepName || def.name}
                        </span>
                        <span className="font-mono text-slate-400 text-[11px]">
                          {truck.speedKmh} km/h
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-2">
                        {truck.routineStepDesc || def.description}
                      </p>
                    </div>

                    {/* Progress Bar through 11 moments */}
                    <div className="mb-2.5">
                      <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-1">
                        <span>Progresso na Rotina</span>
                        <span>{Math.round((stepNum / 11) * 100)}%</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-sky-500 to-emerald-400 rounded-full transition-all duration-300"
                          style={{ width: `${(stepNum / 11) * 100}%` }}
                        />
                      </div>
                    </div>

                    {/* Routine Parameter Pills */}
                    <div className="flex flex-wrap gap-1.5 text-[10px] font-mono text-slate-300">
                      {def.parameters.map((p, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800"
                        >
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-2.5">
              {ESTABLISHED_ROUTINE_MOMENTS.map((moment) => (
                <div
                  key={moment.step}
                  className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/90 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/15 border border-blue-500/30 flex items-center justify-center font-mono font-bold text-sky-400 text-xs shrink-0">
                      0{moment.step}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-xs sm:text-sm font-bold text-white">
                          {moment.name}
                        </h3>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                          {moment.phase}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {moment.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 self-end sm:self-center shrink-0">
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Alvo: {moment.targetSpeed > 0 ? `${moment.targetSpeed} km/h` : '0 km/h (Pausa)'}
                    </span>
                    {moment.parameters.slice(0, 2).map((param, i) => (
                      <span
                        key={i}
                        className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800"
                      >
                        {param}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2 font-mono text-[11px]">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Parâmetros validados conforme norma ISO 3691-4 e SOP do WMS</span>
          </div>

          <button
            onClick={() => {
              soundManager.playClick();
              onClose();
            }}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold cursor-pointer transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
