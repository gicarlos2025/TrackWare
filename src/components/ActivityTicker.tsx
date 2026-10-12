import React from 'react';
import { ActivityEvent } from '../types/warehouse';
import { Truck, Package, ShieldAlert, CheckCircle2, Info } from 'lucide-react';

interface ActivityTickerProps {
  events: ActivityEvent[];
}

export const ActivityTicker: React.FC<ActivityTickerProps> = ({ events }) => {
  const latestEvent = events[0];

  return (
    <footer className="hidden lg:flex w-full bg-slate-900/90 border-t border-slate-800 px-4 py-2 text-xs items-center justify-between z-20 backdrop-blur-md select-none shrink-0">
      <div className="flex items-center gap-3 overflow-hidden">
        <span className="flex items-center gap-1.5 text-blue-400 font-mono font-semibold uppercase text-[11px] shrink-0">
          <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
          Telemetria WMS:
        </span>

        {latestEvent && (
          <div className="flex items-center gap-2 truncate text-slate-300">
            <span className="font-mono text-slate-500 text-[11px]">
              [{latestEvent.timestamp}]
            </span>
            <span className="font-semibold text-white truncate">
              {latestEvent.title}
            </span>
            <span className="text-slate-400 hidden sm:inline truncate">
              — {latestEvent.description}
            </span>
          </div>
        )}
      </div>

      <div className="hidden md:flex items-center gap-4 font-mono text-[11px] text-slate-400 shrink-0">
        <span>SISTEMA: ONLINE</span>
        <span className="text-slate-600">|</span>
        <span className="text-emerald-400">AGV FLEET: ATIVO</span>
      </div>
    </footer>
  );
};
