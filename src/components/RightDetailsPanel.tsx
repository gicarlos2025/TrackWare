import React from 'react';
import {
  X,
  Battery,
  Layers,
  Truck,
  Package,
  Building2,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { WarehouseConfig, Vehicle, PalletEntity, DockBayInfo } from '../types/warehouse';
import { soundManager } from '../utils/audio';

export type SelectedEntity =
  | { type: 'site' }
  | { type: 'truck'; data: Vehicle }
  | { type: 'forklift'; data: Vehicle }
  | { type: 'pallet'; data: PalletEntity }
  | { type: 'dock'; data: DockBayInfo };

interface RightDetailsPanelProps {
  currentWarehouse: WarehouseConfig;
  selectedEntity: SelectedEntity;
  onClose: () => void;
  onSelectEntity: (entity: SelectedEntity) => void;
}

export const RightDetailsPanel: React.FC<RightDetailsPanelProps> = ({
  currentWarehouse,
  selectedEntity,
  onClose,
}) => {
  const isSiteView = selectedEntity.type === 'site';

  return (
    <aside className="absolute top-24 right-4 sm:right-6 w-84 sm:w-92 bg-white/95 backdrop-blur-xl border border-slate-200/80 rounded-2xl shadow-xl z-20 pointer-events-auto p-5 select-none animate-fade-in text-slate-800 max-h-[calc(100vh-140px)] overflow-y-auto">
      {/* 1. SITE OVERVIEW (DEFAULT WHEN NO ENTITY CLICKED) */}
      {isSiteView && (
        <div className="space-y-4">
          {/* Header */}
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block">
              {currentWarehouse.type} · {currentWarehouse.code}
            </span>
            <div className="flex items-center justify-between mt-0.5">
              <h2 className="text-lg font-extrabold text-slate-900 tracking-tight font-sans">
                {currentWarehouse.name}
              </h2>
            </div>
            <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 text-[11px] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>{currentWarehouse.statusBadge}</span>
            </div>
          </div>

          {/* Capacity Utilization Progress Bar */}
          <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Capacity utilization</span>
              <span className="font-mono font-bold text-slate-900">
                {currentWarehouse.stockOnHand.toLocaleString()} / {currentWarehouse.maxCapacity.toLocaleString()}
              </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-600 to-sky-400 rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, Math.round((currentWarehouse.stockOnHand / currentWarehouse.maxCapacity) * 100))}%`,
                }}
              />
            </div>
            <span className="text-[10px] text-slate-400 font-mono block text-right">
              {currentWarehouse.runoutDays} days runout
            </span>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-100">
              <span className="text-[10px] text-slate-400 font-mono uppercase block">Outbound today</span>
              <span className="text-base font-bold text-slate-900 font-mono mt-0.5 block">
                {currentWarehouse.outboundTodayCount} <span className="text-xs font-normal text-slate-500">shipments</span>
              </span>
            </div>
            <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-100">
              <span className="text-[10px] text-slate-400 font-mono uppercase block">Put-away today</span>
              <span className="text-base font-bold text-slate-900 font-mono mt-0.5 block">
                {currentWarehouse.putAwayTodayCount} <span className="text-xs font-normal text-slate-500">pallets</span>
              </span>
            </div>
          </div>

          {/* Inventory Table matching video */}
          <div className="space-y-2 pt-1 border-t border-slate-100">
            <span className="text-[11px] font-bold text-slate-900 uppercase font-mono block tracking-wider">
              Inventory
            </span>
            <div className="space-y-1.5 text-xs">
              {currentWarehouse.inventory.map((item) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between p-2 rounded-xl bg-slate-50/60 hover:bg-slate-50 transition-colors"
                >
                  <span className="text-slate-700 font-medium">{item.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-900">{item.quantity.toLocaleString()}</span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.2 rounded-full border ${
                        item.status === 'In Stock'
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                          : 'bg-amber-50 text-amber-600 border-amber-200'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Forklift Fleet Status */}
          <div className="space-y-2 pt-1 border-t border-slate-100">
            <span className="text-[11px] font-bold text-slate-900 uppercase font-mono block tracking-wider">
              Forklift Fleet
            </span>
            <div className="space-y-1.5 text-xs">
              {currentWarehouse.forklifts.map((fl) => (
                <div key={fl.id} className="p-2 rounded-xl bg-slate-50/60 flex items-center justify-between">
                  <div>
                    <span className="font-mono font-bold text-slate-900 mr-2">{fl.id}</span>
                    <span className="text-slate-500 text-[11px]">{fl.task}</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-600 font-bold">{fl.batteryPercent}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 2. TRUCK DETAIL VIEW matching video (00:14, 00:21, 00:53) */}
      {selectedEntity.type === 'truck' && (
        <div className="space-y-4">
          <div className="flex items-start justify-between border-b border-slate-100 pb-3">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block">
                MAINLINE FREIGHT · {selectedEntity.data.carrier}
              </span>
              <h2 className="text-lg font-extrabold text-slate-900 font-sans tracking-tight">
                {selectedEntity.data.id}
              </h2>
              <span className="text-xs text-slate-500 block">{selectedEntity.data.modelName}</span>
            </div>
            <button
              onClick={() => {
                soundManager.playClick();
                onClose();
              }}
              className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Status Pill */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-200 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
            <span>{selectedEntity.data.status}</span>
          </div>

          {/* Data List matching video */}
          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-400">Shipment</span>
              <span className="font-mono font-bold text-blue-600">{selectedEntity.data.shipmentId}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-400">Customer</span>
              <span className="font-semibold text-slate-800">{selectedEntity.data.customer}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-400">Destination</span>
              <span className="font-medium text-slate-800 text-right max-w-[180px]">
                {selectedEntity.data.destination}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-400">ETA</span>
              <span className="font-mono font-bold text-slate-900">{selectedEntity.data.eta}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-400">Bay</span>
              <span className="font-mono font-bold text-slate-900">0{selectedEntity.data.assignedDock} · {currentWarehouse.code}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Cargo</span>
              <span className="font-semibold text-slate-800">{selectedEntity.data.cargo}</span>
            </div>
          </div>
        </div>
      )}

      {/* 3. FORKLIFT DETAIL VIEW matching video (00:02, 00:18, 01:07) */}
      {selectedEntity.type === 'forklift' && (
        <div className="space-y-4">
          <div className="flex items-start justify-between border-b border-slate-100 pb-3">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block">
                FORKLIFT · {currentWarehouse.code}
              </span>
              <h2 className="text-lg font-extrabold text-slate-900 font-sans tracking-tight">
                {selectedEntity.data.id}
              </h2>
              <span className="text-xs text-slate-500 block">{selectedEntity.data.modelName}</span>
            </div>
            <button
              onClick={() => {
                soundManager.playClick();
                onClose();
              }}
              className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Status Pill */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{selectedEntity.data.status}</span>
          </div>

          {/* Data List matching video */}
          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-400">Carrying</span>
              <span className="font-semibold text-slate-800">{selectedEntity.data.carrying || 'Empty'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-400">Moves today</span>
              <span className="font-mono font-bold text-slate-900">{selectedEntity.data.movesToday || 34}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-400">Speed</span>
              <span className="font-mono font-bold text-slate-900">{selectedEntity.data.speedKmh} km/h</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-400">Battery</span>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-emerald-600">{selectedEntity.data.batteryOrFuelPercent}%</span>
                <div className="w-16 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${selectedEntity.data.batteryOrFuelPercent}%` }} />
                </div>
              </div>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Site</span>
              <span className="font-semibold text-slate-800">{currentWarehouse.name}</span>
            </div>
          </div>
        </div>
      )}

      {/* 4. PALLET DETAIL VIEW matching video (00:04, 00:10) */}
      {selectedEntity.type === 'pallet' && (
        <div className="space-y-4">
          <div className="flex items-start justify-between border-b border-slate-100 pb-3">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block">
                PALLET · {selectedEntity.data.category}
              </span>
              <h2 className="text-lg font-extrabold text-slate-900 font-sans tracking-tight">
                {selectedEntity.data.productName}
              </h2>
              <span className="text-xs font-mono text-slate-400 block">{selectedEntity.data.tag}</span>
            </div>
            <button
              onClick={() => {
                soundManager.playClick();
                onClose();
              }}
              className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Status Pill */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{selectedEntity.data.status} · {selectedEntity.data.location}</span>
          </div>

          {/* Data List matching video */}
          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-400">Quantity</span>
              <span className="font-mono font-bold text-slate-900">{selectedEntity.data.quantity} units</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-400">Gross weight</span>
              <span className="font-mono font-bold text-slate-900">{selectedEntity.data.grossWeightKg} kg</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-400">Location</span>
              <span className="font-semibold text-slate-800">{selectedEntity.data.location}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-400">Lot</span>
              <span className="font-mono font-bold text-slate-900">{selectedEntity.data.lot}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-400">Received</span>
              <span className="font-medium text-slate-800">{selectedEntity.data.receivedDate}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Site</span>
              <span className="font-semibold text-slate-800">{currentWarehouse.name}</span>
            </div>
          </div>
        </div>
      )}

      {/* 5. DOCK BAY DETAIL VIEW matching video (00:11, 00:52) */}
      {selectedEntity.type === 'dock' && (
        <div className="space-y-4">
          <div className="flex items-start justify-between border-b border-slate-100 pb-3">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block">
                DOCK BAY · {currentWarehouse.code}
              </span>
              <h2 className="text-lg font-extrabold text-slate-900 font-sans tracking-tight">
                {selectedEntity.data.bayNumber}
              </h2>
            </div>
            <button
              onClick={() => {
                soundManager.playClick();
                onClose();
              }}
              className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Status Pill */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-200 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <span>Dock door open · Seal active</span>
          </div>

          {/* Data List matching video */}
          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-400">Docked</span>
              <span className="font-mono font-bold text-slate-900">{selectedEntity.data.assignedTruckLabel || 'None'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-400">Rear doors</span>
              <span className="font-semibold text-slate-800">{selectedEntity.data.doorState}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-400">Seal active</span>
              <span className="font-mono font-bold text-emerald-600">{selectedEntity.data.sealActive ? 'Yes' : 'No'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-400">Trucks today</span>
              <span className="font-mono font-bold text-slate-900">{selectedEntity.data.trucksToday}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Site</span>
              <span className="font-semibold text-slate-800">{currentWarehouse.name}</span>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
