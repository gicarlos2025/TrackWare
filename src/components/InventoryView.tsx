import React, { useState } from 'react';
import {
  Search,
  Filter,
  Plus,
  ArrowUpDown,
  Download,
  AlertTriangle,
  CheckCircle2,
  Package,
  Layers,
  MapPin,
  ExternalLink,
  PlusCircle,
  MinusCircle,
} from 'lucide-react';
import { InventoryItem } from '../types/warehouse';
import { soundManager } from '../utils/audio';

interface InventoryViewProps {
  items: InventoryItem[];
  onOpenAddModal: () => void;
  onUpdateQuantity: (id: string, delta: number) => void;
  onSelectRackLocation: (location: string) => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  items,
  onOpenAddModal,
  onUpdateQuantity,
  onSelectRackLocation,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'quantity' | 'name' | 'value'>('quantity');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Filter items
  const filtered = items.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.location.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === 'all' || item.category === selectedCategory;

    const matchesStatus =
      statusFilter === 'all' || item.status === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'quantity') {
      return sortOrder === 'desc' ? b.quantity - a.quantity : a.quantity - b.quantity;
    }
    if (sortBy === 'value') {
      const valA = a.quantity * a.unitPriceEUR;
      const valB = b.quantity * b.unitPriceEUR;
      return sortOrder === 'desc' ? valB - valA : valA - valB;
    }
    return sortOrder === 'desc'
      ? b.name.localeCompare(a.name)
      : a.name.localeCompare(b.name);
  });

  const totalValue = items.reduce(
    (acc, curr) => acc + curr.quantity * curr.unitPriceEUR,
    0
  );
  const lowStockCount = items.filter(
    (i) => i.status === 'low_stock' || i.status === 'critical'
  ).length;

  const exportCSV = () => {
    soundManager.playClick();
    const headers = 'SKU,Nome,Categoria,Quantidade,Unidade,Localizacao,PrecoUnitEUR,Status\n';
    const rows = items
      .map(
        (i) =>
          `"${i.sku}","${i.name}","${i.category}",${i.quantity},"${i.unit}","${i.location}",${i.unitPriceEUR},"${i.status}"`
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `waretrack-inventario-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  return (
    <div className="w-full h-full pt-16 sm:pt-20 lg:pt-20 pb-20 sm:pb-8 px-3 sm:px-6 overflow-y-auto bg-slate-950 text-slate-100">
      <div className="max-w-[1720px] mx-auto space-y-4 sm:space-y-6">
        {/* Header Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
          <div className="bg-slate-900 border border-slate-800 p-3 sm:p-4 rounded-xl shadow-md">
            <span className="text-[10px] sm:text-xs text-slate-400 font-mono uppercase block truncate">Total de SKUs</span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xl sm:text-2xl font-bold font-mono text-white">{items.length}</span>
              <div className="p-1.5 sm:p-2 bg-blue-500/10 text-blue-400 rounded-lg">
                <Package className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-3 sm:p-4 rounded-xl shadow-md">
            <span className="text-[10px] sm:text-xs text-slate-400 font-mono uppercase block truncate">Valor do Estoque</span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xl sm:text-2xl font-bold font-mono text-emerald-400 truncate">
                € {totalValue.toLocaleString('pt-PT', { maximumFractionDigits: 0 })}
              </span>
              <div className="p-1.5 sm:p-2 bg-emerald-500/10 text-emerald-400 rounded-lg shrink-0">
                <Layers className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-3 sm:p-4 rounded-xl shadow-md">
            <span className="text-[10px] sm:text-xs text-slate-400 font-mono uppercase block truncate">Reposição Urgente</span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xl sm:text-2xl font-bold font-mono text-amber-400">{lowStockCount}</span>
              <div className="p-1.5 sm:p-2 bg-amber-500/10 text-amber-400 rounded-lg">
                <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-3 sm:p-4 rounded-xl shadow-md">
            <span className="text-[10px] sm:text-xs text-slate-400 font-mono uppercase block truncate">Precisão WMS</span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xl sm:text-2xl font-bold font-mono text-sky-400">99.8%</span>
              <div className="p-1.5 sm:p-2 bg-sky-500/10 text-sky-400 rounded-lg">
                <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </div>
          </div>
        </div>

        {/* Toolbar: Search, Filters, Add Button, Export */}
        <div className="bg-slate-900 border border-slate-800 p-3 sm:p-4 rounded-2xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Pesquisar SKU, produto..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all"
              />
            </div>

            {/* Filters Row */}
            <div className="grid grid-cols-2 sm:flex gap-2">
              {/* Category Filter */}
              <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-700/80 px-2.5 py-1.5 rounded-xl text-xs">
                <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="bg-transparent text-slate-200 text-xs focus:outline-none cursor-pointer w-full"
                >
                  <option value="all" className="bg-slate-900">Categorias</option>
                  <option value="Eletrônicos" className="bg-slate-900">Eletrônicos</option>
                  <option value="Componentes" className="bg-slate-900">Componentes</option>
                  <option value="Peças Automotivas" className="bg-slate-900">Automotivas</option>
                  <option value="Químicos" className="bg-slate-900">Químicos</option>
                </select>
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-950 border border-slate-700/80 text-slate-200 text-xs px-2.5 py-1.5 rounded-xl focus:outline-none cursor-pointer w-full"
              >
                <option value="all" className="bg-slate-900">Estados</option>
                <option value="normal" className="bg-slate-900">Normal</option>
                <option value="low_stock" className="bg-slate-900">Baixo</option>
                <option value="critical" className="bg-slate-900">Crítico</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
            <button
              onClick={exportCSV}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3 py-2 rounded-xl border border-slate-700 transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>CSV</span>
            </button>

            <button
              onClick={() => {
                soundManager.playClick();
                onOpenAddModal();
              }}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-500 hover:to-sky-500 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-lg shadow-blue-500/20 border border-blue-400/30 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Novo SKU</span>
            </button>
          </div>
        </div>

        {/* Mobile View: SKU Cards (Phone screens) */}
        <div className="block md:hidden space-y-3">
          {sorted.length === 0 ? (
            <div className="p-8 text-center text-slate-500 bg-slate-900 rounded-2xl border border-slate-800 text-xs">
              Nenhum item encontrado com os filtros aplicados.
            </div>
          ) : (
            sorted.map((item) => {
              const isLow = item.status === 'low_stock' || item.status === 'critical';
              const maxCap = item.maxStock || (item.safetyStock * 3) || 100;
              const fillPercent = Math.min(100, Math.round((item.quantity / maxCap) * 100));

              return (
                <div
                  key={item.id}
                  className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3 shadow-md"
                >
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <span className="font-mono font-bold text-sky-400 text-xs block">
                        {item.sku}
                      </span>
                      <h4 className="font-bold text-white text-sm leading-snug">
                        {item.name}
                      </h4>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        {item.category} · {item.supplier}
                      </span>
                    </div>

                    {item.status === 'normal' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        Adequado
                      </span>
                    )}
                    {item.status === 'low_stock' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30 shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                        Reposição
                      </span>
                    )}
                    {item.status === 'critical' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30 shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                        Crítico
                      </span>
                    )}
                  </div>

                  {/* Stock Bar & Info */}
                  <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80 space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400 font-mono">
                        Qtd: <strong className="text-white font-bold">{item.quantity}</strong> {item.unit}
                      </span>
                      <span className="text-slate-400 font-mono text-[11px]">
                        € {item.unitPriceEUR.toFixed(2)} / un
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          isLow ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${fillPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Location & Quick Adjust */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
                    <button
                      onClick={() => {
                        soundManager.playClick();
                        onSelectRackLocation(item.location);
                      }}
                      className="flex items-center gap-1.5 text-xs text-sky-400 hover:text-white font-mono font-medium"
                    >
                      <MapPin className="w-3.5 h-3.5 text-blue-400" />
                      <span>{item.location}</span>
                      <ExternalLink className="w-3 h-3 text-slate-500" />
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          soundManager.playClick();
                          onUpdateQuantity(item.id, -10);
                        }}
                        className="flex items-center justify-center w-9 h-9 rounded-xl bg-slate-800 active:bg-slate-700 text-rose-400 border border-slate-700 font-mono font-bold text-base cursor-pointer"
                        title="-10 unidades"
                      >
                        -
                      </button>
                      <button
                        onClick={() => {
                          soundManager.playClick();
                          onUpdateQuantity(item.id, 10);
                        }}
                        className="flex items-center justify-center w-9 h-9 rounded-xl bg-slate-800 active:bg-slate-700 text-emerald-400 border border-slate-700 font-mono font-bold text-base cursor-pointer"
                        title="+10 unidades"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Desktop View: Full Data Table */}
        <div className="hidden md:block bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-mono uppercase text-[11px]">
                  <th className="py-3.5 px-4 font-semibold">SKU & Produto</th>
                  <th className="py-3.5 px-4 font-semibold">Categoria</th>
                  <th className="py-3.5 px-4 font-semibold">Localização no Armazém</th>
                  <th className="py-3.5 px-4 font-semibold">
                    <button
                      onClick={() => {
                        setSortBy('quantity');
                        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                      }}
                      className="flex items-center gap-1 hover:text-white"
                    >
                      <span>Qtd em Estoque</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="py-3.5 px-4 font-semibold">Nível Mínimo</th>
                  <th className="py-3.5 px-4 font-semibold">Preço Unit.</th>
                  <th className="py-3.5 px-4 font-semibold">Estado</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Ajuste Rápido</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {sorted.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-500">
                      Nenhum item encontrado com os filtros aplicados.
                    </td>
                  </tr>
                ) : (
                  sorted.map((item) => {
                    const isLow = item.status === 'low_stock' || item.status === 'critical';
                    const maxCap = item.maxStock || (item.safetyStock * 3) || 100;
                    const fillPercent = Math.min(100, Math.round((item.quantity / maxCap) * 100));

                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-slate-800/40 transition-colors group"
                      >
                        {/* SKU & Name */}
                        <td className="py-3 px-4">
                          <span className="font-mono font-bold text-sky-400 block">
                            {item.sku}
                          </span>
                          <span className="font-semibold text-slate-100 group-hover:text-blue-300 transition-colors">
                            {item.name}
                          </span>
                          <span className="text-[10px] text-slate-500 block">
                            Fornecedor: {item.supplier}
                          </span>
                        </td>

                        {/* Category */}
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700 text-[11px] font-medium">
                            {item.category}
                          </span>
                        </td>

                        {/* Location */}
                        <td className="py-3 px-4">
                          <button
                            onClick={() => {
                              soundManager.playClick();
                              onSelectRackLocation(item.location);
                            }}
                            className="flex items-center gap-1.5 text-slate-300 hover:text-sky-300 group-hover:underline text-left cursor-pointer"
                            title="Ver localização no 3D"
                          >
                            <MapPin className="w-3.5 h-3.5 text-blue-400" />
                            <span>{item.location}</span>
                            <ExternalLink className="w-3 h-3 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </button>
                        </td>

                        {/* Quantity */}
                        <td className="py-3 px-4">
                          <div className="space-y-1">
                            <span className="font-mono font-bold text-sm text-slate-100">
                              {item.quantity.toLocaleString()}{' '}
                              <span className="text-[10px] text-slate-400 font-normal">
                                {item.unit}
                              </span>
                            </span>
                            <div className="w-24 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  isLow ? 'bg-amber-500' : 'bg-emerald-500'
                                }`}
                                style={{ width: `${fillPercent}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Min Safety */}
                        <td className="py-3 px-4 font-mono text-slate-400">
                          {item.minSafetyStock.toLocaleString()} {item.unit}
                        </td>

                        {/* Unit Price */}
                        <td className="py-3 px-4 font-mono font-semibold text-slate-200">
                          € {item.unitPriceEUR.toFixed(2)}
                        </td>

                        {/* Status */}
                        <td className="py-3 px-4">
                          {item.status === 'normal' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                              Adequado
                            </span>
                          )}
                          {item.status === 'low_stock' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                              Reposição
                            </span>
                          )}
                          {item.status === 'critical' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                              Crítico
                            </span>
                          )}
                        </td>

                        {/* Fast Adjust (+ / -) */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                soundManager.playClick();
                                onUpdateQuantity(item.id, -10);
                              }}
                              className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
                              title="Subtrair 10 unidades (Picking)"
                            >
                              <MinusCircle className="w-4 h-4 text-rose-400" />
                            </button>
                            <button
                              onClick={() => {
                                soundManager.playClick();
                                onUpdateQuantity(item.id, 10);
                              }}
                              className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
                              title="Adicionar 10 unidades (Recebimento)"
                            >
                              <PlusCircle className="w-4 h-4 text-emerald-400" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
