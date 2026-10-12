import React from 'react';
import { Eye, Layers, Truck, BarChart3, Bot } from 'lucide-react';
import { ViewTab } from '../types/warehouse';
import { soundManager } from '../utils/audio';

interface MobileBottomNavProps {
  activeTab: ViewTab;
  onTabChange: (tab: ViewTab) => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onTabChange,
}) => {
  const tabs: { id: ViewTab; label: string; icon: React.ReactNode }[] = [
    { id: '3d_twin', label: 'Gêmeo 3D', icon: <Eye className="w-5 h-5" /> },
    { id: 'inventory', label: 'Estoque', icon: <Layers className="w-5 h-5" /> },
    { id: 'docks', label: 'Docas', icon: <Truck className="w-5 h-5" /> },
    { id: 'fleet', label: 'Frota', icon: <Bot className="w-5 h-5" /> },
    { id: 'analytics', label: 'Métricas', icon: <BarChart3 className="w-5 h-5" /> },
  ];

  return (
    <nav
      aria-label="Navegação Principal Mobile"
      className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-slate-950/95 backdrop-blur-xl border-t border-slate-800/90 flex items-center justify-around px-1 py-1.5 shadow-2xl select-none"
      style={{ paddingBottom: 'max(0.375rem, env(safe-area-inset-bottom))' }}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => {
              soundManager.playClick();
              onTabChange(tab.id);
            }}
            className={`flex flex-col items-center justify-center min-w-[56px] min-h-[48px] py-1 px-2 rounded-xl transition-all cursor-pointer ${
              isActive
                ? 'text-sky-400 font-bold bg-blue-500/10'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className={`transition-transform ${isActive ? 'scale-110 text-sky-400' : 'text-slate-400'}`}>
              {tab.icon}
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight font-medium leading-none">
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
