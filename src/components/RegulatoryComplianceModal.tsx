import React, { useState } from 'react';
import {
  ShieldCheck,
  Scale,
  AlertTriangle,
  FileCheck2,
  CheckCircle2,
  X,
  Truck,
  Package,
  HardHat,
  Key,
  Volume2,
  Eye,
  Flame,
  PhoneOff,
  Zap,
  Info,
  BadgeAlert,
} from 'lucide-react';
import { Vehicle } from '../types/warehouse';
import { soundManager } from '../utils/audio';

interface RegulatoryComplianceModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicles: Vehicle[];
}

export const RegulatoryComplianceModal: React.FC<RegulatoryComplianceModalProps> = ({
  isOpen,
  onClose,
  vehicles,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'ctb' | 'nrs' | 'yard_rules' | 'audit'>('overview');
  const [eStopActivated, setEStopActivated] = useState<boolean>(false);
  const [checklistTested, setChecklistTested] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleToggleEStop = () => {
    soundManager.playClick();
    setEStopActivated(!eStopActivated);
  };

  const handleRunAudit = () => {
    soundManager.playClick();
    setChecklistTested(true);
    setTimeout(() => setChecklistTested(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-fade-in pointer-events-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Regulamentação de Trânsito & Segurança Interna
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                  CTB & NRs Ativas
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Centros de Distribuição (CDs), Pátios e Docas Logísticas · Legislação Brasileira
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              soundManager.playClick();
              onClose();
            }}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors"
            title="Fechar Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 p-2 sm:px-5 bg-slate-950/60 border-b border-slate-800 overflow-x-auto text-xs font-medium">
          {[
            { id: 'overview', label: 'Visão Geral & Indicadores', icon: <ShieldCheck className="w-4 h-4" /> },
            { id: 'ctb', label: 'Código de Trânsito (CTB)', icon: <Scale className="w-4 h-4" /> },
            { id: 'nrs', label: 'Normas Regulamentadoras (NRs)', icon: <AlertTriangle className="w-4 h-4" /> },
            { id: 'yard_rules', label: 'Procedimentos de Pátio & Docas', icon: <Key className="w-4 h-4" /> },
            { id: 'audit', label: 'Auditoria de Frota em Tempo Real', icon: <FileCheck2 className="w-4 h-4" /> },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  soundManager.playClick();
                  setActiveTab(tab.id as typeof activeTab);
                }}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white font-semibold shadow-md shadow-blue-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Contents */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 text-xs text-slate-300">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-5">
              {/* Top Banner */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-blue-900/30 via-slate-900 to-emerald-900/20 border border-blue-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Info className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white mb-1">
                      Conformidade Legal Integrada à Simulação 3D
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
                      A operação e circulação no Riverside Hub seguem rigorosamente a combinação do
                      <strong> Código de Trânsito Brasileiro (CTB)</strong>, das <strong>Normas Regulamentadoras do Ministério do Trabalho (NR-11, NR-12, NR-26)</strong> e dos procedimentos operacionais padrão de segurança em docas e pátios.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleRunAudit}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow transition-all cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{checklistTested ? 'Conformidade Verificada!' : 'Auditar Frota'}</span>
                  </button>
                </div>
              </div>

              {/* 4 Pillars Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-[10px] text-sky-400 font-bold uppercase tracking-wider">
                      CTB Art. 2º & 29
                    </span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  </div>
                  <div className="text-sm font-bold text-white mb-1">Trânsito Interno CTB</div>
                  <p className="text-[11px] text-slate-400 leading-snug">
                    Vias privadas equiparadas a vias públicas. Preferência absoluta para pedestres nas faixas e velocidade máx. de 15 km/h no pátio.
                  </p>
                  <div className="mt-2.5 pt-2 border-t border-slate-700/60 text-[10px] text-emerald-400 font-medium">
                    ✓ Sinalização R-1, R-19 e A-32b
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-[10px] text-amber-400 font-bold uppercase tracking-wider">
                      NR-11 (MTE)
                    </span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  </div>
                  <div className="text-sm font-bold text-white mb-1">Máquinas & Materiais</div>
                  <p className="text-[11px] text-slate-400 leading-snug">
                    Crachá e habilitação de operadores com foto e validade, checklist diário pré-operacional, alarme sonoro de ré e giroflex.
                  </p>
                  <div className="mt-2.5 pt-2 border-t border-slate-700/60 text-[10px] text-emerald-400 font-medium">
                    ✓ Sinalização sonora e luminosa ativa
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-[10px] text-rose-400 font-bold uppercase tracking-wider">
                      NR-12 & NR-26
                    </span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  </div>
                  <div className="text-sm font-bold text-white mb-1">Segurança & Cores</div>
                  <p className="text-[11px] text-slate-400 leading-snug">
                    Parada de emergência (E-Stop), zonas de esmagamento. Piso com amarelo (vias/atenção), vermelho (incêndio) e branco (passarelas).
                  </p>
                  <div className="mt-2.5 pt-2 border-t border-slate-700/60 text-[10px] text-emerald-400 font-medium">
                    ✓ Padrão cromático regulamentar
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-[10px] text-purple-400 font-bold uppercase tracking-wider">
                      Docas & Pátio
                    </span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  </div>
                  <div className="text-sm font-bold text-white mb-1">Protocolo Operacional</div>
                  <p className="text-[11px] text-slate-400 leading-snug">
                    Calçamento físico de rodas em docas, chave retida no lacre da portaria, sinaleiro/balizador em ré e proibição estrita de celular.
                  </p>
                  <div className="mt-2.5 pt-2 border-t border-slate-700/60 text-[10px] text-emerald-400 font-medium">
                    ✓ Calço e Chave no Lacre 100%
                  </div>
                </div>
              </div>

              {/* Responsibilities Matrix (As specified by the user brief) */}
              <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-4">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono mb-3">
                  Quadro de Responsabilidades Operacionais
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-700 text-slate-400 text-[11px]">
                        <th className="pb-2 font-semibold">Agente Envolvido</th>
                        <th className="pb-2 font-semibold">Responsabilidade Principal</th>
                        <th className="pb-2 font-semibold">Status no CD</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/70">
                      <tr>
                        <td className="py-2.5 font-bold text-sky-300">Gestão do CD / Empresa</td>
                        <td className="py-2.5 text-slate-300">
                          Fornecer sinalização de piso/placas, criar rotas seguras e segregadas, treinar operadores e fiscalizar o cumprimento das normas.
                        </td>
                        <td className="py-2.5">
                          <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono">
                            Implantado
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2.5 font-bold text-amber-300">Operadores & Motoristas</td>
                        <td className="py-2.5 text-slate-300">
                          Respeitar limites de velocidade (15 km/h pátio / 5 km/h galpão), realizar checklist diário, calçar rodas e dar preferência aos pedestres.
                        </td>
                        <td className="py-2.5">
                          <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono">
                            Treinados (NR-11)
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2.5 font-bold text-purple-300">Pedestres & Colaboradores</td>
                        <td className="py-2.5 text-slate-300">
                          Transitar exclusivamente em vias permitidas (passarelas brancas), usar EPI obrigatório (colete de alta visibilidade, botina) e proibição de celular.
                        </td>
                        <td className="py-2.5">
                          <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono">
                            Segregados
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CTB */}
          {activeTab === 'ctb' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-blue-900/20 border border-blue-500/30">
                <div className="flex items-center gap-2 mb-1.5">
                  <Scale className="w-4 h-4 text-sky-400" />
                  <h3 className="text-sm font-bold text-white">
                    Aplicação do Código de Trânsito Brasileiro (CTB) em Centros de Distribuição
                  </h3>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Diferente do senso comum, as regras do CTB aplicam-se a áreas privadas e vias internas de condomínios logísticos, galpões e pátios empresariais.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Art. 2 */}
                <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 font-mono text-[11px] font-bold">
                      Art. 2º do CTB
                    </span>
                    <span className="text-[10px] text-emerald-400 font-mono font-bold">Jurisdição Ampliada</span>
                  </div>
                  <h4 className="text-xs font-bold text-white">Vias Terrestres Equiparadas</h4>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    O Código de Trânsito prevê expressamente que as <strong>vias internas de uso coletivo, pátios de estacionamento e áreas de manobra de empresas</strong> são equiparadas a vias terrestres abertas à circulação para efeitos de sinalização, segurança, fiscalização e conduta.
                  </p>
                  <div className="pt-2 border-t border-slate-700/60 text-[10px] text-slate-400">
                    Aplicação direta na entrada, vias perimetrais e apron das docas.
                  </div>
                </div>

                {/* Art. 51 e 80 */}
                <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono text-[11px] font-bold">
                      Art. 51 & 80
                    </span>
                    <span className="text-[10px] text-emerald-400 font-mono font-bold">Sinalização Obrigatória</span>
                  </div>
                  <h4 className="text-xs font-bold text-white">Sinalização Vertical & Horizontal</h4>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Cabe ao estabelecimento/proprietário planejar, implantar e manter a sinalização:
                  </p>
                  <ul className="list-disc list-inside text-[11px] text-slate-300 space-y-1">
                    <li><strong>Placas R-19:</strong> Limites de velocidade (15 km/h pátio, 5 km/h interior).</li>
                    <li><strong>Placas R-1:</strong> Parada obrigatória (PARE) na portaria e cruzamentos.</li>
                    <li><strong>Placas A-32b:</strong> Faixas de pedestres e travessias.</li>
                    <li><strong>Demarcação de baia:</strong> Guias amarelas e chevrons de alinhamento.</li>
                  </ul>
                </div>

                {/* Art. 29 */}
                <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[11px] font-bold">
                      Art. 29 do CTB
                    </span>
                    <span className="text-[10px] text-emerald-400 font-mono font-bold">Regras de Conduta</span>
                  </div>
                  <h4 className="text-xs font-bold text-white">Direito de Preferência & Trânsito</h4>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    A circulação obedece às normas gerais:
                  </p>
                  <ul className="list-disc list-inside text-[11px] text-slate-300 space-y-1">
                    <li><strong>Mão de direção:</strong> Trânsito pelo lado direito da via interna.</li>
                    <li><strong>Prioridade absoluta:</strong> Pedestres nas faixas têm preferência sobre veículos.</li>
                    <li><strong>Luzes e setas:</strong> Uso correto de setas indicadoras ao manobrar.</li>
                    <li><strong>Ultrapassagem proibida:</strong> Em curvas, docas e áreas de manobra de risco.</li>
                  </ul>
                </div>
              </div>

              {/* 3D Signboards Preview */}
              <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 flex flex-wrap items-center justify-around gap-4 text-center">
                <div className="flex flex-col items-center gap-1.5">
                  <div className="w-12 h-12 rounded-full border-4 border-red-600 bg-white flex flex-col items-center justify-center font-extrabold text-slate-950 shadow">
                    <span className="text-xs leading-none">15</span>
                    <span className="text-[7px] leading-none">km/h</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-300 font-bold">R-19: Pátio Externo</span>
                </div>

                <div className="flex flex-col items-center gap-1.5">
                  <div className="w-12 h-12 rounded-full border-4 border-red-600 bg-white flex flex-col items-center justify-center font-extrabold text-slate-950 shadow">
                    <span className="text-xs leading-none">5</span>
                    <span className="text-[7px] leading-none">km/h</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-300 font-bold">R-19: Interior Armazém</span>
                </div>

                <div className="flex flex-col items-center gap-1.5">
                  <div className="w-12 h-12 bg-red-600 rounded-md flex items-center justify-center font-black text-white text-xs shadow border-2 border-white">
                    PARE
                  </div>
                  <span className="text-[10px] font-mono text-slate-300 font-bold">R-1: Portaria e Cruzamento</span>
                </div>

                <div className="flex flex-col items-center gap-1.5">
                  <div className="w-12 h-12 rotate-45 bg-amber-400 border-2 border-slate-950 flex items-center justify-center font-black text-slate-950 text-[9px] shadow">
                    <div className="-rotate-45 font-bold">FAIXA</div>
                  </div>
                  <span className="text-[10px] font-mono text-slate-300 font-bold">A-32b: Pedestres</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: NRs */}
          {activeTab === 'nrs' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-amber-900/20 border border-amber-500/30">
                <div className="flex items-center gap-2 mb-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-bold text-white">
                    Normas Regulamentadoras de Segurança e Saúde (MTE)
                  </h3>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Regem a operação de máquinas, movimentação de cargas e a saúde ocupacional dentro dos Centros de Distribuição.
                </p>
              </div>

              <div className="space-y-3">
                {/* NR-11 */}
                <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono text-xs font-bold">
                        NR-11
                      </span>
                      <h4 className="text-xs font-bold text-white">
                        Transporte, Movimentação, Armazenagem e Manuseio de Materiais
                      </h4>
                    </div>
                    <span className="text-[10px] text-emerald-400 font-mono font-bold">100% Conforme</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                    <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
                      <div className="flex items-center gap-1.5 text-amber-400 font-semibold mb-1">
                        <HardHat className="w-3.5 h-3.5" />
                        <span>Habilitação & Treinamento</span>
                      </div>
                      <p className="text-[11px] text-slate-300">
                        Operadores de empilhadeiras e transpaleteiras possuem treinamento específico de 16h com <strong>cartão de identificação interno (crachá com foto e validade anual)</strong>.
                      </p>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
                      <div className="flex items-center gap-1.5 text-sky-400 font-semibold mb-1">
                        <FileCheck2 className="w-3.5 h-3.5" />
                        <span>Inspeção & Manutenção</span>
                      </div>
                      <p className="text-[11px] text-slate-300">
                        Checklist diário obrigatório antes do turno (freios, buzina, garfos, sistema hidráulico) e <strong>capacidade máxima de carga visivelmente fixada na máquina</strong>.
                      </p>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
                      <div className="flex items-center gap-1.5 text-emerald-400 font-semibold mb-1">
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>Sinalização Sonora & Luz</span>
                      </div>
                      <p className="text-[11px] text-slate-300">
                        Alarme sonoro intermitente acoplado à marcha à ré, buzina manual para cruzamentos cegos e <strong>giroflex âmbar rotativo no teto + projeção Blue Spot no piso</strong>.
                      </p>
                    </div>
                  </div>
                </div>

                {/* NR-12 */}
                <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono text-xs font-bold">
                        NR-12
                      </span>
                      <h4 className="text-xs font-bold text-white">
                        Segurança no Trabalho em Máquinas e Equipamentos
                      </h4>
                    </div>
                    <span className="text-[10px] text-emerald-400 font-mono font-bold">Proteções Ativas</span>
                  </div>

                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Exige proteções físicas em componentes móveis, enclausuramento de esteiras, <strong>sistemas de parada de emergência (botões cogumelo tipo E-Stop)</strong>, demarcação de zonas de esmagamento e regras rígidas para manutenção preventiva em áreas de circulação.
                  </p>

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={handleToggleEStop}
                      className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                        eStopActivated
                          ? 'bg-red-600 text-white shadow-lg shadow-red-500/30 animate-pulse'
                          : 'bg-slate-800 hover:bg-slate-700 text-rose-300 border border-rose-500/30'
                      }`}
                    >
                      <Zap className="w-4 h-4 text-rose-400" />
                      <span>{eStopActivated ? 'PARADA DE EMERGÊNCIA ATIVA (E-STOP)' : 'Testar Botão de Parada NR-12'}</span>
                    </button>
                    {eStopActivated && (
                      <span className="text-[11px] text-rose-300 font-mono">
                        Máquinas do setor bloqueadas preventivamente.
                      </span>
                    )}
                  </div>
                </div>

                {/* NR-26 */}
                <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono text-xs font-bold">
                        NR-26
                      </span>
                      <h4 className="text-xs font-bold text-white">
                        Sinalização de Segurança & Padrão Cromático no Pavimento
                      </h4>
                    </div>
                    <span className="text-[10px] text-emerald-400 font-mono font-bold">Padrão MTE</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                    <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="w-3.5 h-3.5 rounded bg-yellow-400 shadow shrink-0" />
                        <span className="font-bold text-yellow-300 text-xs">Amarelo / Zebrado</span>
                      </div>
                      <p className="text-[11px] text-slate-300">
                        Vias de circulação de veículos, corredores de empilhadeiras, guias de alinhamento de docas e <strong>áreas de risco ou perigo de esmagamento</strong>.
                      </p>
                    </div>

                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="w-3.5 h-3.5 rounded bg-red-600 shadow shrink-0" />
                        <span className="font-bold text-red-300 text-xs">Vermelho</span>
                      </div>
                      <p className="text-[11px] text-slate-300">
                        Localização de equipamentos de <strong>combate a incêndio (extintores, hidrantes)</strong> e botoeiras de parada de emergência (E-stop).
                      </p>
                    </div>

                    <div className="p-3 rounded-lg bg-slate-200/10 border border-slate-300/30">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="w-3.5 h-3.5 rounded bg-slate-100 shadow shrink-0" />
                        <span className="font-bold text-white text-xs">Faixas Brancas / Cinza</span>
                      </div>
                      <p className="text-[11px] text-slate-300">
                        Caminhos, faixas e <strong>passarelas exclusivas de pedestres</strong>, garantindo total segregação visual e física do tráfego pesado.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: YARD RULES */}
          {activeTab === 'yard_rules' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-purple-900/20 border border-purple-500/30">
                <div className="flex items-center gap-2 mb-1.5">
                  <Key className="w-4 h-4 text-purple-400" />
                  <h3 className="text-sm font-bold text-white">
                    Regras Práticas de Trânsito e Operação em Pátios e Docas
                  </h3>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Procedimentos operacionais padronizados para garantir tolerância zero a acidentes em áreas de atracamento e transbordo.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* A. Limites de Velocidade */}
                <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-2">
                  <div className="flex items-center gap-2 text-sky-400 font-bold text-xs">
                    <span className="w-5 h-5 rounded-md bg-sky-500/20 flex items-center justify-center font-mono">A</span>
                    <span>Limites Estritos de Velocidade</span>
                  </div>
                  <ul className="space-y-1.5 text-[11px] text-slate-300">
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-400 mt-1 shrink-0" />
                      <span><strong>Pátio Externo (Apron & Rodovia):</strong> Fixado em 10 km/h a 20 km/h (adotado 15 km/h). Respeitado por todos os caminhões em trânsito.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-400 mt-1 shrink-0" />
                      <span><strong>Interior do Galpão (Armazém):</strong> Limitado a 5 km/h a 10 km/h (velocidade do passo de caminhada humana). Aplicado a empilhadeiras e AGVs.</span>
                    </li>
                  </ul>
                </div>

                {/* B. Segregação Pedestres x Veículos */}
                <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-2">
                  <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                    <span className="w-5 h-5 rounded-md bg-amber-500/20 flex items-center justify-center font-mono">B</span>
                    <span>Segregação de Pedestres & Preferência</span>
                  </div>
                  <ul className="space-y-1.5 text-[11px] text-slate-300">
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1 shrink-0" />
                      <span><strong>Passarelas demarcadas:</strong> Pedestres e colaboradores circulam exclusivamente por faixas brancas no piso.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1 shrink-0" />
                      <span><strong>Cruzamentos cegos de corredores:</strong> Empilhadeiras e veículos são obrigados a parar completamente e buzinar antes de avançar.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1 shrink-0" />
                      <span><strong>Preferência absoluta:</strong> Pedestres têm prioridade total sobre qualquer maquinário.</span>
                    </li>
                  </ul>
                </div>

                {/* C. Protocolo de Docas */}
                <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                    <span className="w-5 h-5 rounded-md bg-emerald-500/20 flex items-center justify-center font-mono">C</span>
                    <span>Protocolo de Docas & Estacionamento</span>
                  </div>
                  <ul className="space-y-1.5 text-[11px] text-slate-300">
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1 shrink-0" />
                      <span><strong>Calçamento de Rodas (Calços Físicos):</strong> Veículos atracados têm as rodas travadas por calços mecânicos para impedir deslizamento com empilhadeiras.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1 shrink-0" />
                      <span><strong>Chave no Lacre/Portaria:</strong> Retenção física das chaves do caminhão pelo conferente/portaria para evitar movimentação prematura com a rampa ativada.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1 shrink-0" />
                      <span><strong>Manobras de marcha à ré:</strong> Feitas com espelhos, alarme sonoro contínuo e orientação presencial do <strong>sinaleiro/balizador (Dock Marshall)</strong>.</span>
                    </li>
                  </ul>
                </div>

                {/* D. EPIs & Celular */}
                <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-2">
                  <div className="flex items-center gap-2 text-purple-400 font-bold text-xs">
                    <span className="w-5 h-5 rounded-md bg-purple-500/20 flex items-center justify-center font-mono">D</span>
                    <span>EPIs Obrigatórios & Proibição de Celular</span>
                  </div>
                  <ul className="space-y-1.5 text-[11px] text-slate-300">
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-1 shrink-0" />
                      <span><strong>EPI Obrigatório em Área Operacional:</strong> Colete refletivo de alta visibilidade (NR-26), capacete com jugular, calçado de segurança com biqueira de aço e protetor auricular.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-1 shrink-0" />
                      <span><strong>Tolerância Zero a Celulares (Distração Fatal):</strong> Uso de telefones celulares ou fones de ouvido enquanto se opera veículo, empilhadeira ou caminha nas passarelas é terminantemente proibido.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: AUDIT */}
          {activeTab === 'audit' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <div>
                  <h3 className="text-xs font-bold text-white font-mono uppercase tracking-wider">
                    Auditoria Contínua de Segurança da Frota
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Validação em tempo real dos protocolos CTB e Normas Regulamentadoras para cada veículo ativo.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 text-xs font-mono font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Conformidade Geral: 100%</span>
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/80 text-slate-400 text-[11px] border-b border-slate-800">
                    <tr>
                      <th className="p-3 font-semibold">Veículo</th>
                      <th className="p-3 font-semibold">Tipo</th>
                      <th className="p-3 font-semibold">Operador / Crachá</th>
                      <th className="p-3 font-semibold">Velocidade x Limite</th>
                      <th className="p-3 font-semibold">Calço / Chave Retida</th>
                      <th className="p-3 font-semibold">Checklist NR-11</th>
                      <th className="p-3 font-semibold">Celular Proibido</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 bg-slate-900/60">
                    {vehicles.map((v) => {
                      const isDocked = ['Acoplado', 'A descarregar', 'A carregar'].includes(v.status);
                      const speedLimit = v.type === 'truck' ? '15 km/h' : '8 km/h';

                      return (
                        <tr key={v.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="p-3">
                            <div className="font-bold text-white font-mono flex items-center gap-1.5">
                              {v.type === 'truck' ? (
                                <Truck className="w-3.5 h-3.5 text-sky-400" />
                              ) : (
                                <Package className="w-3.5 h-3.5 text-amber-400" />
                              )}
                              <span>{v.id}</span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono block">
                              {v.licensePlate || 'Frota Interna'}
                            </span>
                          </td>
                          <td className="p-3 capitalize text-slate-300">{v.type}</td>
                          <td className="p-3">
                            <div className="font-medium text-slate-200">{v.driverName}</div>
                            <span className="text-[10px] text-emerald-400 font-mono">
                              Crachá NR-11 Válido
                            </span>
                          </td>
                          <td className="p-3 font-mono">
                            <span className="text-white font-bold">{v.speedKmh} km/h</span>
                            <span className="text-slate-400 text-[10px] block">Limite: {speedLimit}</span>
                          </td>
                          <td className="p-3">
                            {isDocked ? (
                              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono font-bold flex items-center gap-1 w-fit">
                                <Key className="w-3 h-3 text-emerald-400" />
                                <span>Calçado & Chave Retida</span>
                              </span>
                            ) : (
                              <span className="text-[10px] font-mono text-slate-400">
                                Em trânsito seguro
                              </span>
                            )}
                          </td>
                          <td className="p-3">
                            <span className="text-emerald-400 font-mono text-[10px] font-semibold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Aprovado 100%
                            </span>
                          </td>
                          <td className="p-3">
                            <span className="text-emerald-400 font-mono text-[10px] font-semibold flex items-center gap-1">
                              <PhoneOff className="w-3.5 h-3.5" />
                              Bloqueado
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-slate-800 bg-slate-900/90 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-mono">
              Monitoramento Ativo: CTB Art. 2º/51/80/29 · Portaria MTE NR-11/12/26
            </span>
          </div>

          <button
            onClick={() => {
              soundManager.playClick();
              onClose();
            }}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all cursor-pointer"
          >
            Entendido · Voltar à Simulação
          </button>
        </div>
      </div>
    </div>
  );
};
