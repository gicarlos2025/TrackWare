/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  WarehouseId,
  WarehouseConfig,
  DockBay,
  Vehicle,
  VehicleStatus,
  InventoryItem,
  ActivityEvent,
  ViewTab,
  CameraPreset,
} from './types/warehouse';
import {
  INITIAL_WAREHOUSES,
  INITIAL_VEHICLES,
  INITIAL_INVENTORY,
  INITIAL_ACTIVITIES,
} from './data/mockWarehouseData';
import { soundManager } from './utils/audio';
import { Header } from './components/Header';
import { WarehouseCanvas } from './components/ThreeWarehouse/WarehouseCanvas';
import { VehicleInfoPanel } from './components/VehicleInfoPanel';
import { CameraControlsOverlay } from './components/CameraControlsOverlay';
import { InventoryView } from './components/InventoryView';
import { DocksView } from './components/DocksView';
import { FleetView } from './components/FleetView';
import { AnalyticsView } from './components/AnalyticsView';
import { ActivityTicker } from './components/ActivityTicker';
import { MobileBottomNav } from './components/MobileBottomNav';
import { NewDispatchModal } from './components/NewDispatchModal';
import { NewSKUModal } from './components/NewSKUModal';
import { RoutineMonitorModal } from './components/RoutineMonitorModal';

export default function App() {
  // Warehouse Selection State
  const [currentHubId, setCurrentHubId] = useState<WarehouseId>('riverside');
  const [warehouses, setWarehouses] = useState<Record<string, WarehouseConfig>>(INITIAL_WAREHOUSES);
  const currentWarehouse = warehouses[currentHubId] || INITIAL_WAREHOUSES.riverside;

  // View Navigation
  const [activeTab, setActiveTab] = useState<ViewTab>('3d_twin');
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('isometric');

  // Simulation controls
  const [isNightMode, setIsNightMode] = useState<boolean>(false);
  const [simSpeed, setSimSpeed] = useState<number>(1.5);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Entities state
  const [vehicles, setVehicles] = useState<Vehicle[]>(INITIAL_VEHICLES);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(vehicles[0]);
  const [inventory, setInventory] = useState<InventoryItem[]>(INITIAL_INVENTORY);
  const [activities, setActivities] = useState<ActivityEvent[]>(INITIAL_ACTIVITIES);

  // Modals
  const [isNewDispatchOpen, setIsNewDispatchOpen] = useState(false);
  const [isNewSKUOpen, setIsNewSKUOpen] = useState(false);
  const [isRoutineMonitorOpen, setIsRoutineMonitorOpen] = useState(false);

  // Helper to append live activities
  const logActivity = (
    title: string,
    description: string,
    type: ActivityEvent['type'] = 'dock',
    severity: ActivityEvent['severity'] = 'info',
    vehicleId?: string
  ) => {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    const newEvent: ActivityEvent = {
      id: `act-${Date.now()}`,
      timestamp: timeStr,
      type,
      title,
      description,
      severity,
      vehicleId,
    };
    setActivities((prev) => [newEvent, ...prev.slice(0, 19)]);
  };

  // Actions
  const handleSelectWarehouse = (id: WarehouseId) => {
    setCurrentHubId(id);
    logActivity(
      `Hub alternado para ${warehouses[id]?.name}`,
      `A carregar layout digital e telemetria das docas de ${warehouses[id]?.location}.`,
      'dock',
      'info'
    );
  };

  const handleSelectVehicle = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    logActivity(
      `Veículo ${vehicle.id} selecionado`,
      `Estado: ${vehicle.status} | Carga: ${vehicle.cargo}`,
      vehicle.type,
      'info',
      vehicle.id
    );
  };

  const handleVehicleStatusChange = (
    id: string,
    status: VehicleStatus,
    progress: number,
    loc: string,
    routineStep?: number,
    routineStepName?: string,
    routineParameters?: string
  ) => {
    setVehicles((prev) => {
      const existing = prev.find((v) => v.id === id);
      if (
        existing &&
        existing.status === status &&
        existing.progressPercent === progress &&
        existing.loc === loc &&
        existing.routineStep === routineStep
      ) {
        return prev;
      }
      return prev.map((v) => {
        if (v.id === id) {
          return {
            ...v,
            status,
            progressPercent: progress,
            loc,
            ...(routineStep !== undefined ? { routineStep } : {}),
            ...(routineStepName ? { routineStepName } : {}),
            ...(routineParameters ? { routineParameters } : {}),
          };
        }
        return v;
      });
    });

    setSelectedVehicle((curr) => {
      if (
        curr &&
        curr.id === id &&
        (curr.status !== status ||
          curr.progressPercent !== progress ||
          curr.loc !== loc ||
          curr.routineStep !== routineStep)
      ) {
        return {
          ...curr,
          status,
          progressPercent: progress,
          loc,
          ...(routineStep !== undefined ? { routineStep } : {}),
          ...(routineStepName ? { routineStepName } : {}),
          ...(routineParameters ? { routineParameters } : {}),
        };
      }
      return curr;
    });
  };

  const handleAccelerateOperation = (vehicleId: string) => {
    setVehicles((prev) =>
      prev.map((v) => {
        if (v.id === vehicleId) {
          const newProgress = Math.min(100, (v.progressPercent || 0) + 25);
          return {
            ...v,
            progressPercent: newProgress,
            status: newProgress >= 100 ? 'Acoplado' : v.status,
          };
        }
        return v;
      })
    );
    logActivity(
      `Ciclo acelerado para ${vehicleId}`,
      'Prioridade no WMS atualizada com sucesso.',
      'truck',
      'success',
      vehicleId
    );
  };

  const handleAccelerateAll = () => {
    // Acelerar velocidade da simulação e impulsionar progresso de todos os veículos
    setSimSpeed((prev) => (prev < 2 ? 2 : prev < 5 ? 5 : 2));
    setVehicles((prev) =>
      prev.map((v) => {
        const nextProgress = Math.min(100, (v.progressPercent || 0) + 25);
        return {
          ...v,
          progressPercent: nextProgress,
        };
      })
    );
    logActivity(
      'Aceleração Geral da Frota Ativada',
      'Velocidade e despacho acelerados para todos os veículos do CD conforme parâmetros WMS.',
      'truck',
      'warning'
    );
  };

  const handleReleaseDock = (vehicleOrDockId: string | number) => {
    // Release dock & vehicle
    setVehicles((prev) =>
      prev.map((v) => {
        if (v.id === vehicleOrDockId || v.assignedDock === vehicleOrDockId) {
          return {
            ...v,
            status: 'Em trânsito',
            loc: 'Pátio Exterior (Saída Autorizada)',
            progressPercent: 100,
          };
        }
        return v;
      })
    );

    // Update dock state in current warehouse
    setWarehouses((prev) => {
      const hub = prev[currentHubId];
      if (!hub) return prev;
      const updatedDocks = hub.docks.map((d: DockBay) => {
        if (
          d.id === vehicleOrDockId ||
          d.assignedVehicleId === vehicleOrDockId
        ) {
          return {
            ...d,
            status: 'Disponível' as const,
            assignedVehicleId: undefined,
            progressPercent: 0,
            currentCargo: 'Livre',
            totalOperationsToday: (d.totalOperationsToday || 0) + 1,
          };
        }
        return d;
      });
      return {
        ...prev,
        [currentHubId]: {
          ...hub,
          docks: updatedDocks,
        },
      };
    });

    logActivity(
      `Doca liberada com sucesso`,
      `Carga concluída e saída autorizada pelo sistema WareTrack.`,
      'dock',
      'success'
    );
  };

  const handleDockUpdate = (
    dockId: number,
    status: 'Disponível' | 'Em Carga' | 'Em Descarga',
    progress: number,
    truckId?: string
  ) => {
    setWarehouses((prev) => {
      const hub = prev[currentHubId];
      if (!hub) return prev;
      const updatedDocks = hub.docks.map((d: DockBay) => {
        if (d.id === dockId) {
          const wasAvailable = d.status === 'Disponível';
          const isNowAvailable = status === 'Disponível';
          return {
            ...d,
            status,
            statusText: status === 'Disponível' ? 'Livre' : status,
            statusCode: (status === 'Disponível' ? 'available' : status === 'Em Carga' ? 'loading' : 'unloading') as 'available' | 'loading' | 'unloading',
            assignedVehicleId: truckId,
            assignedTruckId: truckId,
            assignedTruckLabel: truckId ? `${truckId} · WMS` : undefined,
            progressPercent: progress,
            totalOperationsToday: !wasAvailable && isNowAvailable ? (d.totalOperationsToday || 0) + 1 : d.totalOperationsToday,
          };
        }
        return d;
      });
      return {
        ...prev,
        [currentHubId]: {
          ...hub,
          docks: updatedDocks,
        },
      };
    });
  };

  const handleAccelerateDock = (dockId: number) => {
    setWarehouses((prev) => {
      const hub = prev[currentHubId];
      if (!hub) return prev;
      const updatedDocks = hub.docks.map((d: DockBay) => {
        if (d.id === dockId) {
          const newP = Math.min(100, (d.progressPercent || 0) + 25);
          return {
            ...d,
            progressPercent: newP,
          };
        }
        return d;
      });
      return {
        ...prev,
        [currentHubId]: { ...hub, docks: updatedDocks },
      };
    });
    logActivity(
      `Operação da Doca 0${dockId} acelerada`,
      'Priorização de empilhadeiras para o setor da doca.',
      'dock',
      'info'
    );
  };

  const handleUpdateStockQuantity = (id: string, delta: number) => {
    setInventory((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const newQty = Math.max(0, item.quantity + delta);
          const minStock = item.minSafetyStock ?? item.safetyStock ?? 50;
          let newStatus = item.status;
          if (newQty <= 0) newStatus = 'critical';
          else if (newQty < minStock) newStatus = 'low_stock';
          else newStatus = 'normal';

          return {
            ...item,
            quantity: newQty,
            status: newStatus,
            lastUpdated: 'Agora mesmo',
          };
        }
        return item;
      })
    );
  };

  const handleAddVehicle = (newVeh: Vehicle) => {
    setVehicles((prev) => [newVeh, ...prev]);
    setSelectedVehicle(newVeh);
    setActiveTab('3d_twin');
    setCameraPreset('isometric');
    logActivity(
      `Novo camião despachado: ${newVeh.id}`,
      `Manifesto: ${newVeh.cargo} (${newVeh.palletsCount} paletes)`,
      'truck',
      'success',
      newVeh.id
    );
  };

  const handleAddSKU = (newItem: InventoryItem) => {
    setInventory((prev) => [newItem, ...prev]);
    logActivity(
      `Novo SKU registado: ${newItem.sku}`,
      `${newItem.name} adicionado ao Corredor A.`,
      'stock',
      'success'
    );
  };

  const handleFocusRackLocation = (location: string) => {
    setActiveTab('3d_twin');
    setCameraPreset('interior');
    logActivity(
      `Localização destacada: ${location}`,
      'Câmara focada nos corredores de armazenamento do armazém.',
      'stock',
      'info'
    );
  };

  return (
    <div className="flex flex-col w-screen h-screen overflow-hidden bg-slate-950 font-sans text-slate-100 select-none">
      {/* 1. Main Navigation Header */}
      <Header
        currentWarehouse={currentWarehouse}
        allWarehouses={warehouses}
        onSelectWarehouse={handleSelectWarehouse}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isNightMode={isNightMode}
        onToggleNightMode={() => setIsNightMode((v) => !v)}
        soundEnabled={soundEnabled}
        onToggleSound={() => {
          const newVal = soundManager.toggleSound();
          setSoundEnabled(newVal);
        }}
        simSpeed={simSpeed}
        onSetSimSpeed={setSimSpeed}
        onOpenNewDispatch={() => setIsNewDispatchOpen(true)}
        onOpenRoutineMonitor={() => setIsRoutineMonitorOpen(true)}
      />

      {/* 2. Main Content Area */}
      <main className="relative flex-1 w-full h-full overflow-hidden">
        {/* 3D Digital Twin View */}
        <div
          className={`absolute inset-0 w-full h-full transition-opacity duration-300 ${
            activeTab === '3d_twin'
              ? 'opacity-100 z-10 pointer-events-auto'
              : 'opacity-0 z-0 pointer-events-none'
          }`}
        >
          {/* 3D WebGL Canvas */}
          <WarehouseCanvas
            vehicles={vehicles}
            selectedVehicleId={selectedVehicle?.id || null}
            onSelectVehicle={handleSelectVehicle}
            isNightMode={isNightMode}
            simSpeed={simSpeed}
            cameraPreset={cameraPreset}
            onVehicleStatusChange={handleVehicleStatusChange}
            onActivityLog={logActivity}
            onDockUpdate={handleDockUpdate}
          />

          {/* Camera controls toolbar overlay */}
          <CameraControlsOverlay
            currentPreset={cameraPreset}
            onSelectPreset={setCameraPreset}
          />

          {/* Interactive Vehicle Telemetry Side Panel (elevating the user's #info-panel) */}
          <VehicleInfoPanel
            vehicle={selectedVehicle}
            onClose={() => setSelectedVehicle(null)}
            onFocusCamera={() => setCameraPreset('follow')}
            onAccelerateOperation={handleAccelerateOperation}
            onReleaseDock={handleReleaseDock}
            onOpenRoutineMonitor={() => setIsRoutineMonitorOpen(true)}
          />
        </div>

        {/* Tab 2: Estoque & SKUs */}
        {activeTab === 'inventory' && (
          <div className="absolute inset-0 z-10">
            <InventoryView
              items={inventory}
              onOpenAddModal={() => setIsNewSKUOpen(true)}
              onUpdateQuantity={handleUpdateStockQuantity}
              onSelectRackLocation={handleFocusRackLocation}
            />
          </div>
        )}

        {/* Tab 3: Operações de Doca */}
        {activeTab === 'docks' && (
          <div className="absolute inset-0 z-10">
            <DocksView
              docks={currentWarehouse.docks}
              vehicles={vehicles}
              onSelectVehicle={(v) => {
                setSelectedVehicle(v);
                setActiveTab('3d_twin');
              }}
              onAccelerateDock={handleAccelerateDock}
              onReleaseDock={handleReleaseDock}
              onFocus3DDock={() => {
                setActiveTab('3d_twin');
                setCameraPreset('dock_focus');
              }}
            />
          </div>
        )}

        {/* Tab 4: Frota & AGVs */}
        {activeTab === 'fleet' && (
          <div className="absolute inset-0 z-10">
            <FleetView
              vehicles={vehicles}
              onSelectVehicle={(v) => {
                setSelectedVehicle(v);
                setActiveTab('3d_twin');
              }}
              onFocus3DVehicle={(v) => {
                setSelectedVehicle(v);
                setActiveTab('3d_twin');
                setCameraPreset('follow');
              }}
            />
          </div>
        )}

        {/* Tab 5: Painel Analítico */}
        {activeTab === 'analytics' && (
          <div className="absolute inset-0 z-10">
            <AnalyticsView warehouse={currentWarehouse} />
          </div>
        )}
      </main>

      {/* 3. Bottom Live Activity Telemetry Ticker (Desktop/Tablet) */}
      <ActivityTicker events={activities} />

      {/* 4. Mobile Bottom Navigation Bar (Phone Screens) */}
      <MobileBottomNav activeTab={activeTab} onTabChange={setActiveTab} />

      {/* 5. Modals */}
      <NewDispatchModal
        isOpen={isNewDispatchOpen}
        onClose={() => setIsNewDispatchOpen(false)}
        onAddVehicle={handleAddVehicle}
      />

      <NewSKUModal
        isOpen={isNewSKUOpen}
        onClose={() => setIsNewSKUOpen(false)}
        onAddItem={handleAddSKU}
      />

      <RoutineMonitorModal
        isOpen={isRoutineMonitorOpen}
        onClose={() => setIsRoutineMonitorOpen(false)}
        vehicles={vehicles}
        onSelectVehicle={handleSelectVehicle}
        onAccelerateAll={handleAccelerateAll}
        simSpeed={simSpeed}
        onSetSimSpeed={setSimSpeed}
      />
    </div>
  );
}
