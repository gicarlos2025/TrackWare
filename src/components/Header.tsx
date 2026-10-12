import React, { useState } from 'react';
import {
  Boxes,
  Building2,
  ChevronDown,
  CheckCircle2,
  Layers,
  Truck,
  Sun,
  Moon,
  Volume2,
  VolumeX,
  Play,
  Pause,
  PlusCircle,
  BarChart3,
  Search,
  Eye,
  Zap,
  Scale,
} from 'lucide-react';
import { WarehouseId, WarehouseConfig, ViewTab } from '../types/warehouse';
import { soundManager } from '../utils/audio';

interface HeaderProps {
  currentWarehouse: WarehouseConfig;
  allWarehouses: Record<string, WarehouseConfig>;
  onSelectWarehouse: (id: WarehouseId) => void;
  activeTab?: ViewTab;
  onTabChange?: (tab: ViewTab) => void;
  isNightMode?: boolean;
  onToggleNightMode?: () => void;
  soundEnabled?: boolean;
  onToggleSound?: () => void;
  simSpeed?: number;
  onSetSimSpeed?: (speed: number) => void;
  onOpenNewDispatch?: () => void;
  onOpenRoutineMonitor?: () => void;
  onOpenRegulatory?: () => void;
  onSearchQuery?: (q: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentWarehouse,
  allWarehouses,
  onSelectWarehouse,
  activeTab = '3d_twin',
  onTabChange,
  isNightMode = false,
  onToggleNightMode,
  soundEnabled = true,
  onToggleSound,
  simSpeed = 1,
  onSetSimSpeed,
  onOpenNewDispatch,
  onOpenRoutineMonitor,
  onOpenRegulatory,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  const occupancyRatio = Math.round(
    ((currentWarehouse.stockOnHand || 1200) / (currentWarehouse.maxCapacity || 1500)) * 100
  );

  const tabs: { id: ViewTab; label: string; icon: React.ReactNode }[] = [
    { id: '3d_twin', label: 'Gêmeo 3D', icon: <Eye className="w-3.5 h-3.5" /> },
    { id: 'inventory', label: 'Estoque', icon: <Layers className="w-3.5 h-3.5" /> },
    { id: 'docks', label: 'Docas', icon: <Truck className="w-3.5 h-3.5" /> },
    { id: 'fleet', label: 'Frota & AGVs', icon: <Truck className="w-3.5 h-3.5 text-amber-400" /> },
    { id: 'analytics', label: 'Métricas', icon: <BarChart3 className="w-3.5 h-3.5" /> },
  ];

  const cycleSpeed = () => {
    if (!onSetSimSpeed) return;
    soundManager.playClick();
    const speeds = [1, 1.5, 2, 5, 0];
    const nextIdx = (speeds.indexOf(simSpeed) + 1) % speeds.length;
    onSetSimSpeed(speeds[nextIdx]);
  };

  return (
    <header className="absolute top-0 left-0 right-0 z-30 pointer-events-none p-2 sm:p-4 select-none">
      <div className="max-w-[1920px] mx-auto flex flex-col gap-2">
        {/* Top Bar */}
        <div className="flex items-center justify-between gap-1.5 sm:gap-4">
          {/* Left: Logo & Hub Selector */}
          <div className="flex items-center gap-1.5 sm:gap-3 pointer-events-auto">
            {/* Logo */}
            <div className="flex items-center gap-2 bg-slate-900/90 backdrop-blur-md px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl shadow-lg border border-slate-800 text-white">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-blue-600 flex items-center justify-center shadow-md shadow-blue-500/20 text-white shrink-0">
                <Boxes className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm sm:text-base font-extrabold tracking-tight text-white leading-none">
                  WareTrack
                </span>
                <span className="hidden sm:inline text-[9px] font-mono text-sky-400 tracking-wider">
                  SISTEMA LOGÍSTICO WMS
                </span>
              </div>
            </div>

            {/* Warehouse Hub Selector Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  soundManager.playClick();
                  setIsDropdownOpen(!isDropdownOpen);
                }}
                className="flex items-center gap-1.5 sm:gap-2.5 bg-slate-900/90 backdrop-blur-md px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl border border-slate-800 shadow-lg hover:border-blue-500 transition-all cursor-pointer group text-slate-100"
              >
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                  <Building2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-white max-w-[85px] xs:max-w-[120px] sm:max-w-none truncate block">
                      {currentWarehouse.name}
                    </span>
                    <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-slate-800 text-slate-400 font-semibold border border-slate-700 hidden xs:inline">
                      {currentWarehouse.code}
                    </span>
                  </div>
                  <div className="hidden sm:flex items-center gap-1.5 text-[10px] font-mono text-slate-400">
                    <span>
                      {(currentWarehouse.stockOnHand || 1200).toLocaleString()} /{' '}
                      {(currentWarehouse.maxCapacity || 1500).toLocaleString()}
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>{occupancyRatio}% cap</span>
                  </div>
                </div>
                <ChevronDown
                  className={`w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 transition-transform ${
                    isDropdownOpen ? 'rotate-180 text-blue-400' : ''
                  }`}
                />
              </button>

              {/* Hub Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute top-full mt-2 left-0 w-72 sm:w-80 bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl p-2 z-50 animate-fade-in text-xs font-sans">
                  <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono border-b border-slate-800 mb-1">
                    Centros de Distribuição (CD)
                  </div>
                  {Object.values(allWarehouses).map((hub) => {
                    const isSelected = hub.id === currentWarehouse.id;
                    return (
                      <button
                        key={hub.id}
                        onClick={() => {
                          soundManager.playClick();
                          onSelectWarehouse(hub.id);
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-blue-600/20 text-blue-300 border border-blue-500/40 font-semibold'
                            : 'hover:bg-slate-800 text-slate-300'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-1.5 font-bold">
                            <span>{hub.name}</span>
                            <span className="text-[10px] font-mono text-slate-400 font-normal">
                              {hub.code}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono block">
                            {hub.docksCountActive}
                          </span>
                        </div>
                        {isSelected && (
                          <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Center Navigation Tabs (Desktop only; mobile uses fixed bottom navigation bar) */}
          {onTabChange && (
            <div className="hidden lg:flex items-center gap-1 bg-slate-900/90 backdrop-blur-md p-1.5 rounded-2xl border border-slate-800 shadow-lg pointer-events-auto">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      soundManager.playClick();
                      onTabChange(tab.id);
                    }}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                    }`}
                  >
                    {tab.icon}
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Right: Simulation Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2 pointer-events-auto shrink-0">
            {/* Speed Multiplier: 1-click cycle button on mobile, 4-button group on tablet/desktop */}
            {onSetSimSpeed && (
              <>
                <button
                  onClick={cycleSpeed}
                  className="flex sm:hidden items-center justify-center min-w-[36px] h-8 px-2 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-800 text-[11px] font-mono font-bold text-sky-400 shadow cursor-pointer active:scale-95"
                  title="Alterar Velocidade da Simulação"
                >
                  {simSpeed === 0 ? <Pause className="w-3 h-3 text-amber-400" /> : `${simSpeed}x`}
                </button>

                <div className="hidden sm:flex items-center bg-slate-900/90 backdrop-blur-md p-1 rounded-xl border border-slate-800 shadow text-[11px] font-mono">
                  {[
                    { speed: 0, label: <Pause className="w-3 h-3" /> },
                    { speed: 1, label: '1x' },
                    { speed: 1.5, label: '1.5x' },
                    { speed: 2, label: '2x' },
                    { speed: 5, label: '5x' },
                  ].map((s) => (
                    <button
                      key={s.speed}
                      onClick={() => {
                        soundManager.playClick();
                        onSetSimSpeed(s.speed);
                      }}
                      className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                        simSpeed === s.speed
                          ? 'bg-blue-600 text-white font-bold'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                      title={s.speed === 0 ? 'Pausar Simulação' : `Velocidade ${s.speed}x`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* Night Mode Toggle */}
            {onToggleNightMode && (
              <button
                onClick={() => {
                  soundManager.playClick();
                  onToggleNightMode();
                }}
                className={`w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-xl border transition-all cursor-pointer ${
                  isNightMode
                    ? 'bg-indigo-600/30 border-indigo-500 text-indigo-300'
                    : 'bg-slate-900/90 border-slate-800 text-amber-400 hover:bg-slate-800'
                }`}
                title={isNightMode ? 'Modo Dia' : 'Modo Noite'}
              >
                {isNightMode ? <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
              </button>
            )}

            {/* Sound Toggle */}
            {onToggleSound && (
              <button
                onClick={() => {
                  onToggleSound();
                }}
                className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-xl bg-slate-900/90 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
                title={soundEnabled ? 'Silenciar Áudio' : 'Ativar Sons Industriais'}
              >
                {soundEnabled ? <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" /> : <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-400" />}
              </button>
            )}

            {/* Routine Moments Modal Trigger Button */}
            {onOpenRoutineMonitor && (
              <button
                onClick={() => {
                  soundManager.playClick();
                  onOpenRoutineMonitor();
                }}
                className="flex items-center gap-1.5 bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-500/30 hover:border-sky-500/50 font-bold h-8 sm:h-9 px-2.5 sm:px-3 rounded-xl text-xs transition-all cursor-pointer shadow-sm"
                title="Rotina Operacional dos Momentos (11 Momentos WMS)"
              >
                <Zap className="w-3.5 h-3.5 text-sky-400" />
                <span className="hidden sm:inline">Rotina dos Momentos</span>
              </button>
            )}

            {/* CTB & Regulatory Norms (NRs) Button */}
            {onOpenRegulatory && (
              <button
                onClick={() => {
                  soundManager.playClick();
                  onOpenRegulatory();
                }}
                className="flex items-center gap-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 hover:border-emerald-500/50 font-bold h-8 sm:h-9 px-2.5 sm:px-3 rounded-xl text-xs transition-all cursor-pointer shadow-sm"
                title="Regulamentação CTB (Código de Trânsito) e Normas NR-11/12/26"
              >
                <Scale className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Normas CTB & NRs</span>
              </button>
            )}

            {/* Dispatch Truck Button */}
            {onOpenNewDispatch && (
              <button
                onClick={() => {
                  soundManager.playClick();
                  onOpenNewDispatch();
                }}
                className="flex items-center gap-1.5 bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-white font-bold h-8 sm:h-9 px-2.5 sm:px-3.5 rounded-xl text-xs shadow-lg shadow-blue-500/25 transition-all cursor-pointer"
                title="Despachar Novo Camião"
              >
                <PlusCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden md:inline">Despachar Camião</span>
              </button>
            )}

            {/* Live Indicator (Shown on medium and large screens) */}
            <div className="hidden md:flex items-center gap-2 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 shadow text-xs font-mono font-semibold text-slate-200">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>96.6% Prazo</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
