import React, { useState } from 'react';
import { X, Truck, Calendar, MapPin, Package, ShieldCheck } from 'lucide-react';
import { Vehicle } from '../types/warehouse';
import { soundManager } from '../utils/audio';

interface NewDispatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddVehicle: (vehicle: Vehicle) => void;
}

export const NewDispatchModal: React.FC<NewDispatchModalProps> = ({
  isOpen,
  onClose,
  onAddVehicle,
}) => {
  const [truckId, setTruckId] = useState(`TRK-${Math.floor(1000 + Math.random() * 9000)}`);
  const [modelName, setModelName] = useState('Volvo FH 500 Globetrotter');
  const [licensePlate, setLicensePlate] = useState(`${Math.floor(10 + Math.random() * 89)}-ZZ-${Math.floor(10 + Math.random() * 89)}`);
  const [driverName, setDriverName] = useState('Rodrigo Antunes');
  const [cargo, setCargo] = useState('Sensores Ópticos & Componentes Eletrônicos');
  const [cargoCategory, setCargoCategory] = useState('Eletrônicos');
  const [palletsCount, setPalletsCount] = useState(24);
  const [origin, setOrigin] = useState('Porto de Leixões');
  const [destination, setDestination] = useState('Riverside Hub - Doca 02');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    soundManager.playDockSuccess();

    const newVeh: Vehicle = {
      id: truckId,
      type: 'truck',
      name: modelName,
      status: 'A acoplar',
      cargo,
      cargoCategory,
      cargoWeightKg: palletsCount * 650,
      palletsCount,
      origin,
      destination,
      loc: 'Pátio Exterior (Chegada Recente)',
      batteryOrFuelPercent: 92,
      speedKmh: 14,
      driverName,
      driverType: 'Humano',
      licensePlate,
      etaMinutes: 1,
      progressPercent: 20,
    };

    onAddVehicle(newVeh);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-2xl p-4 sm:p-6 shadow-2xl text-slate-100 space-y-4 sm:space-y-5">
        <div className="flex justify-between items-center pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
              <Truck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">
                Autorizar Novo Camião & Carga
              </h3>
              <p className="text-xs text-slate-400">
                Registo de entrada no recinto e reserva de doca
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              soundManager.playClick();
              onClose();
            }}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-400 font-medium block mb-1">
                ID do Veículo
              </label>
              <input
                type="text"
                value={truckId}
                onChange={(e) => setTruckId(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-slate-400 font-medium block mb-1">
                Matrícula
              </label>
              <input
                type="text"
                value={licensePlate}
                onChange={(e) => setLicensePlate(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="text-slate-400 font-medium block mb-1">
              Modelo do Camião
            </label>
            <input
              type="text"
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              required
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-400 font-medium block mb-1">
                Motorista
              </label>
              <input
                type="text"
                value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-slate-400 font-medium block mb-1">
                Qtd de Paletes
              </label>
              <input
                type="number"
                min={1}
                max={33}
                value={palletsCount}
                onChange={(e) => setPalletsCount(Number(e.target.value))}
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="text-slate-400 font-medium block mb-1">
              Descrição do Manifesto / Carga
            </label>
            <input
              type="text"
              value={cargo}
              onChange={(e) => setCargo(e.target.value)}
              required
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-400 font-medium block mb-1">
                Origem
              </label>
              <input
                type="text"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-slate-400 font-medium block mb-1">
                Destino Interno
              </label>
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="pt-3 flex justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-500 hover:to-sky-500 text-white font-bold shadow-lg shadow-blue-500/20 border border-blue-400/30 cursor-pointer"
            >
              Despachar para o Pátio
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
