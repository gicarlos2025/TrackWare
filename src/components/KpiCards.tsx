import React from 'react';
import { Package, Truck, ShieldCheck, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { WarehouseConfig } from '../types/warehouse';

interface KpiCardsProps {
  warehouse: WarehouseConfig;
}

export const KpiCards: React.FC<KpiCardsProps> = ({ warehouse }) => {
  return (
    <div className="absolute top-24 left-4 sm:left-6 z-20 pointer-events-auto flex items-center gap-3 select-none animate-fade-in">
      {/* 1. Stock on Hand */}
      <div className="bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-2xl p-3.5 shadow-sm min-w-[170px] transition-all hover:shadow-md">
        <div className="flex items-center justify-between gap-2 mb-1">
          <div className="flex items-center gap-1.5 text-slate-500 text-xs font-semibold">
            <Package className="w-3.5 h-3.5 text-blue-600" />
            <span>Stock on hand</span>
          </div>
          <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded flex items-center ${
            warehouse.stockChange >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
          }`}>
            {warehouse.stockChange >= 0 ? '+' : ''}{warehouse.stockChange}
          </span>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-extrabold text-slate-900 font-sans tracking-tight">
            {warehouse.stockOnHand.toLocaleString()}
          </span>
        </div>
        <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
          {warehouse.code} · Max {(warehouse.maxCapacity / 1000).toFixed(1)}k
        </span>
      </div>

      {/* 2. Trucks on Site */}
      <div className="bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-2xl p-3.5 shadow-sm min-w-[170px] transition-all hover:shadow-md">
        <div className="flex items-center justify-between gap-2 mb-1">
          <div className="flex items-center gap-1.5 text-slate-500 text-xs font-semibold">
            <Truck className="w-3.5 h-3.5 text-blue-600" />
            <span>Trucks on site</span>
          </div>
          <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-600 flex items-center">
            {warehouse.trucksChange >= 0 ? `+${warehouse.trucksChange}` : warehouse.trucksChange}
          </span>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-extrabold text-slate-900 font-sans tracking-tight">
            {warehouse.trucksOnSite}
          </span>
        </div>
        <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
          {warehouse.dockedCount} docked · {warehouse.queueCount} queue
        </span>
      </div>

      {/* 3. On-time Delivery (OTIF) */}
      <div className="bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-2xl p-3.5 shadow-sm min-w-[170px] transition-all hover:shadow-md hidden lg:block">
        <div className="flex items-center justify-between gap-2 mb-1">
          <div className="flex items-center gap-1.5 text-slate-500 text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            <span>On-time delivery</span>
          </div>
          <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-600 flex items-center">
            +{warehouse.onTimeChange}%
          </span>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-extrabold text-slate-900 font-sans tracking-tight">
            {warehouse.onTimeDeliveryPercent}%
          </span>
        </div>
        <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
          OTIF 30-day avg
        </span>
      </div>
    </div>
  );
};
