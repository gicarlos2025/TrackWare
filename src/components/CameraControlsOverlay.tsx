import React from 'react';
import { CameraPreset } from '../types/warehouse';
import { soundManager } from '../utils/audio';
import { Box, Compass, Eye, Shield, Video } from 'lucide-react';

interface CameraControlsOverlayProps {
  currentPreset: CameraPreset;
  onSelectPreset: (preset: CameraPreset) => void;
}

export const CameraControlsOverlay: React.FC<CameraControlsOverlayProps> = ({
  currentPreset,
  onSelectPreset,
}) => {
  const presets: { id: CameraPreset; label: string; icon: React.ReactNode }[] = [
    { id: 'isometric', label: 'Isométrica', icon: <Box className="w-3.5 h-3.5" /> },
    { id: 'top_down', label: 'Planta 2D', icon: <Compass className="w-3.5 h-3.5" /> },
    { id: 'dock_focus', label: 'Docas', icon: <Shield className="w-3.5 h-3.5" /> },
    { id: 'interior', label: 'Interior Racks', icon: <Eye className="w-3.5 h-3.5" /> },
    { id: 'follow', label: 'Seguir Veículo', icon: <Video className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="absolute top-14 sm:top-20 left-2 sm:left-6 z-20 pointer-events-auto bg-slate-900/90 backdrop-blur-md border border-slate-800 p-1 sm:p-1.5 rounded-xl shadow-xl flex items-center gap-1 text-xs max-w-[calc(100vw-1rem)] overflow-x-auto">
      <span className="text-[10px] font-mono uppercase text-slate-400 px-1.5 hidden md:inline shrink-0">
        Câmara
      </span>
      {presets.map((preset) => {
        const isActive = currentPreset === preset.id;
        return (
          <button
            key={preset.id}
            onClick={() => {
              soundManager.playClick();
              onSelectPreset(preset.id);
            }}
            className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-lg font-medium transition-all cursor-pointer shrink-0 ${
              isActive
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
            title={preset.label}
          >
            {preset.icon}
            <span className="text-[10px] sm:text-[11px] whitespace-nowrap">{preset.label}</span>
          </button>
        );
      })}
    </div>
  );
};
