import React from 'react';
import { Truck, Check, Loader2, ArrowRight } from 'lucide-react';
import { ShipmentTrackingData } from '../types/warehouse';

interface ShipmentTrackingCardProps {
  data: ShipmentTrackingData;
}

export const ShipmentTrackingCard: React.FC<ShipmentTrackingCardProps> = ({ data }) => {
  return (
    <div className="absolute bottom-6 left-4 sm:left-6 z-20 pointer-events-auto bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-2xl p-4 shadow-lg min-w-[340px] max-w-[540px] select-none animate-fade-in">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-4 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Truck className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-bold text-slate-900 font-sans">
            Shipment Tracking
          </span>
        </div>

        <div className="text-right">
          <div className="flex items-center justify-end gap-1.5 text-xs font-mono">
            <span className="font-bold text-slate-900">{data.truckId}</span>
            <span className="text-slate-400">·</span>
            <span className="text-blue-600 font-semibold">{data.carrier}</span>
            <span className="text-slate-400">·</span>
            <span className="text-slate-500">{data.shipmentId}</span>
          </div>
          <span className="text-[10px] text-slate-400 font-sans block">
            To: {data.destination} · {data.bayLabel} · {data.timeLeft}
          </span>
        </div>
      </div>

      {/* Horizontal Stepper Timeline matching video */}
      <div className="pt-3 flex items-center justify-between relative">
        {/* Connecting line */}
        <div className="absolute top-[19px] left-6 right-6 h-0.5 bg-slate-100 -z-0" />

        {data.steps.map((step, idx) => {
          const isCompleted = step.status === 'completed';
          const isActive = step.status === 'active';

          return (
            <div key={step.label} className="flex flex-col items-center relative z-10 text-center flex-1">
              {/* Step Icon circle */}
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center transition-all shadow-sm ${
                  isCompleted
                    ? 'bg-emerald-500 text-white'
                    : isActive
                    ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                    : 'bg-white border-2 border-slate-200 text-slate-300'
                }`}
              >
                {isCompleted ? (
                  <Check className="w-3 h-3 stroke-[3]" />
                ) : isActive ? (
                  <Loader2 className="w-3 h-3 animate-spin stroke-[2.5]" />
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                )}
              </div>

              {/* Labels */}
              <span
                className={`text-[10px] font-bold mt-1.5 block leading-tight ${
                  isActive ? 'text-blue-600 font-bold' : isCompleted ? 'text-slate-800' : 'text-slate-400'
                }`}
              >
                {step.label}
              </span>
              <span className="text-[9px] font-mono text-slate-400 block mt-0.5">
                {step.timeOrEta}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
