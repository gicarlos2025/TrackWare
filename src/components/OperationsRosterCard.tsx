import React, { useState } from 'react';
import { WarehouseConfig, Vehicle } from '../types/warehouse';
import { soundManager } from '../utils/audio';

interface OperationsRosterCardProps {
  warehouse: WarehouseConfig;
  vehicles: Vehicle[];
  onSelectEntity: (type: 'dock' | 'forklift' | 'truck', id: string | number) => void;
}

export const OperationsRosterCard: React.FC<OperationsRosterCardProps> = ({
  warehouse,
  vehicles,
  onSelectEntity,
}) => {
  const [activeTab, setActiveTab] = useState<'docks' | 'forklifts' | 'trucks'>('docks');

  const trucksOnSite = vehicles.filter((v) => v.type === 'truck');
  const forkliftsOnSite = vehicles.filter((v) => v.type === 'forklift');

  const getStatusBadgeStyle = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes('load') || s.includes('unload')) {
      return 'bg-emerald-50 text-emerald-600 border-emerald-200';
    }
    if (s.includes('dock') || s.includes('route')) {
      return 'bg-sky-50 text-sky-600 border-sky-200';
    }
    if (s.includes('charge')) {
      return 'bg-amber-50 text-amber-600 border-amber-200';
    }
    if (s.includes('avail')) {
      return 'bg-slate-100 text-slate-500 border-slate-200';
    }
    return 'bg-slate-100 text-slate-600 border-slate-200';
  };

  return (
    <div className="absolute bottom-6 right-4 sm:right-6 z-20 pointer-events-auto bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-2xl p-3.5 shadow-lg min-w-[340px] max-w-[420px] select-none animate-fade-in">
      {/* Top Tabs */}
      <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
        <div className="flex items-center gap-1 bg-slate-100/80 p-0.5 rounded-xl text-xs font-semibold">
          <button
            onClick={() => {
              soundManager.playClick();
              setActiveTab('docks');
            }}
            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
              activeTab === 'docks'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Docks ({warehouse.docks.length})
          </button>
          <button
            onClick={() => {
              soundManager.playClick();
              setActiveTab('forklifts');
            }}
            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
              activeTab === 'forklifts'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Forklifts ({warehouse.forklifts.length})
          </button>
          <button
            onClick={() => {
              soundManager.playClick();
              setActiveTab('trucks');
            }}
            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
              activeTab === 'trucks'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Trucks ({warehouse.trucksOnSite})
          </button>
        </div>

        <span className="text-[10px] font-mono text-slate-400 font-medium hidden sm:inline">
          {warehouse.name}
        </span>
      </div>

      {/* Roster Items List */}
      <div className="pt-2 space-y-1.5 max-h-[160px] overflow-y-auto">
        {/* DOCKS LIST */}
        {activeTab === 'docks' &&
          warehouse.docks.map((dock) => (
            <div
              key={dock.id}
              onClick={() => {
                soundManager.playClick();
                onSelectEntity('dock', dock.id);
              }}
              className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition-all cursor-pointer group text-xs"
            >
              <div className="flex items-center gap-2.5">
                <span className="font-mono font-bold text-slate-900">{dock.bayNumber}</span>
                <span className="text-slate-500 text-[11px] truncate max-w-[170px]">
                  {dock.assignedTruckLabel || 'No truck assigned'}
                </span>
              </div>
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getStatusBadgeStyle(
                  dock.statusText || dock.status || 'available'
                )}`}
              >
                {dock.statusText || dock.status}
              </span>
            </div>
          ))}

        {/* FORKLIFTS LIST */}
        {activeTab === 'forklifts' &&
          warehouse.forklifts.map((fl) => (
            <div
              key={fl.id}
              onClick={() => {
                soundManager.playClick();
                onSelectEntity('forklift', fl.id);
              }}
              className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition-all cursor-pointer group text-xs"
            >
              <div className="flex items-center gap-2.5">
                <span className="font-mono font-bold text-slate-900">{fl.id}</span>
                <span className="text-slate-500 text-[11px] truncate max-w-[170px]">
                  {fl.task}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-slate-400">{fl.batteryPercent}%</span>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getStatusBadgeStyle(
                    fl.status
                  )}`}
                >
                  {fl.status === 'loading'
                    ? 'Loading'
                    : fl.status === 'unloading'
                    ? 'Unloading'
                    : fl.status === 'staging'
                    ? 'Staging'
                    : 'Charging'}
                </span>
              </div>
            </div>
          ))}

        {/* TRUCKS LIST */}
        {activeTab === 'trucks' &&
          trucksOnSite.map((trk) => (
            <div
              key={trk.id}
              onClick={() => {
                soundManager.playClick();
                onSelectEntity('truck', trk.id);
              }}
              className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition-all cursor-pointer group text-xs"
            >
              <div className="flex items-center gap-2.5">
                <span className="font-mono font-bold text-slate-900">{trk.id}</span>
                <span className="text-slate-500 text-[11px] truncate max-w-[170px]">
                  {trk.carrier} · Bay {trk.assignedDock || 1}
                </span>
              </div>
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getStatusBadgeStyle(
                  trk.status || 'in_transit'
                )}`}
              >
                {trk.routineStep ? `M0${trk.routineStep} · ${trk.status}` : trk.status}
              </span>
            </div>
          ))}
      </div>
    </div>
  );
};
