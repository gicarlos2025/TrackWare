import React, { useState } from 'react';
import { X, Package, PlusCircle } from 'lucide-react';
import { InventoryItem } from '../types/warehouse';
import { soundManager } from '../utils/audio';

interface NewSKUModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddItem: (item: InventoryItem) => void;
}

export const NewSKUModal: React.FC<NewSKUModalProps> = ({
  isOpen,
  onClose,
  onAddItem,
}) => {
  const [sku, setSku] = useState(`WT-${Math.floor(100 + Math.random() * 900)}-PRD`);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<'Eletrônicos' | 'Componentes' | 'Alimentos' | 'Peças Automotivas' | 'Químicos'>('Eletrônicos');
  const [quantity, setQuantity] = useState(100);
  const [unit, setUnit] = useState('unid');
  const [location, setLocation] = useState('Corredor A - Prateleira 02 - Nível 2');
  const [minSafetyStock, setMinSafetyStock] = useState(30);
  const [maxStock, setMaxStock] = useState(500);
  const [unitPriceEUR, setUnitPriceEUR] = useState(150.0);
  const [weightKgPerUnit, setWeightKgPerUnit] = useState(4.5);
  const [supplier, setSupplier] = useState('Logistics Direct Iberia');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    soundManager.playDockSuccess();

    const newItem: InventoryItem = {
      id: `inv-${Date.now()}`,
      sku,
      name,
      category,
      quantity,
      unit,
      location,
      rackId: 'rack-custom',
      safetyStock: minSafetyStock,
      minSafetyStock,
      maxStock,
      unitPriceEUR,
      weightKgPerUnit,
      supplier,
      lastUpdated: 'Agora mesmo',
      status: quantity <= minSafetyStock ? 'low_stock' : 'normal',
    };

    onAddItem(newItem);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-2xl p-4 sm:p-6 shadow-2xl text-slate-100 space-y-4 sm:space-y-5">
        <div className="flex justify-between items-center pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">
                Cadastrar Novo SKU de Estoque
              </h3>
              <p className="text-xs text-slate-400">
                Registo de material, unidade de medida e localização física
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
                Código SKU
              </label>
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-slate-400 font-medium block mb-1">
                Categoria
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as unknown as typeof category)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              >
                <option value="Eletrônicos">Eletrônicos</option>
                <option value="Componentes">Componentes</option>
                <option value="Peças Automotivas">Peças Automotivas</option>
                <option value="Alimentos">Alimentos</option>
                <option value="Químicos">Químicos</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-slate-400 font-medium block mb-1">
              Nome do Produto
            </label>
            <input
              type="text"
              placeholder="Ex: Servomotores Brushless 3.5kW"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-slate-400 font-medium block mb-1">
                Quantidade
              </label>
              <input
                type="number"
                min={0}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-slate-400 font-medium block mb-1">
                Unidade
              </label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-slate-400 font-medium block mb-1">
                Preço Unit. (€)
              </label>
              <input
                type="number"
                step="0.01"
                value={unitPriceEUR}
                onChange={(e) => setUnitPriceEUR(Number(e.target.value))}
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-400 font-medium block mb-1">
                Estoque Mínimo de Segurança
              </label>
              <input
                type="number"
                value={minSafetyStock}
                onChange={(e) => setMinSafetyStock(Number(e.target.value))}
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-slate-400 font-medium block mb-1">
                Capacidade Máxima
              </label>
              <input
                type="number"
                value={maxStock}
                onChange={(e) => setMaxStock(Number(e.target.value))}
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="text-slate-400 font-medium block mb-1">
              Localização Física no Armazém
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="text-slate-400 font-medium block mb-1">
              Fornecedor Homologado
            </label>
            <input
              type="text"
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
              required
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
            />
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
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold shadow-lg shadow-emerald-500/20 border border-emerald-400/30 cursor-pointer"
            >
              Registar SKU no WMS
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
