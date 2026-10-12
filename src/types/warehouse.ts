export type WarehouseId = 'riverside' | 'northgate' | 'eastport' | 'southfield' | 'westgate';

export type VehicleType = 'truck' | 'forklift' | 'agv';

export type TruckCarrier = 'WareTrack' | 'Bluepeak' | 'Nordline' | 'Cargoviva';

export type TruckStage = 'APPROACH' | 'REVERSING' | 'DOCKED' | 'DEPARTING' | 'EN_ROUTE';

export type VehicleStatus =
  | 'Em trânsito'
  | 'A acoplar'
  | 'A acoplar (Ré)'
  | 'Acoplado'
  | 'A descarregar'
  | 'A carregar'
  | 'A transportar'
  | 'Estacionado'
  | 'Em carregamento'
  | string;

export type CameraPreset = 'isometric' | 'top_down' | 'dock_focus' | 'interior' | 'follow';

export type ViewTab = '3d_twin' | 'inventory' | 'docks' | 'fleet' | 'analytics';

export interface Vehicle {
  id: string;
  type: VehicleType;
  name: string;
  carrier?: TruckCarrier;
  modelName?: string;
  licensePlate?: string;
  status: VehicleStatus;
  statusCode?: string;
  cargo: string;
  cargoCategory?: string;
  cargoWeightKg: number;
  palletsCount: number;
  shipmentId?: string;
  customer?: string;
  origin: string;
  destination: string;
  assignedDock?: number;
  eta?: string;
  etaMinutes?: number;
  batteryOrFuelPercent: number;
  speedKmh: number;
  driverName?: string;
  driverType?: 'Humano' | 'Autônomo AGV';
  movesToday?: number;
  carrying?: string;
  site?: string;
  loc?: string;
  progressPercent?: number;
  routineStep?: number;
  routineStepName?: string;
  routineStepDesc?: string;
  routineParameters?: string;
  compliance?: VehicleSafetyCompliance;
}

export interface VehicleSafetyCompliance {
  ctbCompliant: boolean;
  speedLimitKmh: number; // 15 km/h pátio, 8 km/h galpão
  pedestrianPriorityRespected: boolean;
  nr11ChecklistValid: boolean;
  nr11OperatorBadge: {
    operatorName: string;
    operatorRole: string;
    cnhNumber: string;
    cnhCategory: string;
    nr11CourseValidUntil: string;
    trainingHours: number;
    badgeStatus: 'Válido' | 'Expirado' | 'Em Renovação';
  };
  dailyChecklist12Items: {
    item: string;
    status: 'Conforme' | 'Não Conforme';
    inspectedAt: string;
  }[];
  nr12SafetyProtection: {
    ropsFopsCabin: boolean;
    emergencyStopButton: boolean;
    presenceSensorActive: boolean;
  };
  dockProtocol: {
    wheelChocksEngaged: boolean;
    ignitionKeyRetainedInOffice: boolean;
    dockSafetyTrafficLight: 'Vermelho (Bloqueado)' | 'Verde (Liberado)';
    dockMarshallAssigned: boolean;
    safetySealNumber?: string;
  };
  ppeAudit: {
    reflectiveVest: boolean;
    safetyHelmet: boolean;
    steelToeBoots: boolean;
    earProtection: boolean;
    noCellphoneRuleCompliant: boolean;
  };
}

export interface RoutineMomentDefinition {
  step: number;
  name: string;
  phase: string;
  description: string;
  targetSpeed: number;
  parameters: string[];
}

export const ESTABLISHED_ROUTINE_MOMENTS: RoutineMomentDefinition[] = [
  {
    step: 1,
    name: 'Despacho & Rodovia',
    phase: 'STANDBY_HIGHWAY',
    description: 'Chegada programada via Rodovia BR e telemetria de trânsito externo.',
    targetSpeed: 38,
    parameters: ['Velocidade: ~38 km/h', 'Rastreio GPS Ativo', 'Doca Pré-Designada'],
  },
  {
    step: 2,
    name: 'Portaria & Triagem',
    phase: 'GATE_IN',
    description: 'Vistoria obrigatória na cancela: balança rodoviária, termografia e lacre.',
    targetSpeed: 0,
    parameters: ['Balança: Validada', 'Lacre de Entrada: OK', 'Check-in QR-Code'],
  },
  {
    step: 3,
    name: 'Aproximação & Pátio',
    phase: 'APPROACH',
    description: 'Deslocamento ágil pelo pátio central em direção ao alinhamento da doca.',
    targetSpeed: 28,
    parameters: ['Velocidade no Pátio: 28 km/h', 'Verificação de Doca Livre', 'Raio de Curva Suave'],
  },
  {
    step: 4,
    name: 'Alinhamento & Ré',
    phase: 'REVERSING',
    description: 'Manobra de ré com aviso sonoro contínuo e alinhamento milimétrico.',
    targetSpeed: 12,
    parameters: ['Sinal Sonoro Ativo', 'Velocidade de Ré: 12 km/h', 'Alinhamento Angular 0°'],
  },
  {
    step: 5,
    name: 'Acoplamento & Vistoria',
    phase: 'DOCKED_INSPECTION',
    description: 'Encosto na vedação, travamento de calços de roda e conferência NFe.',
    targetSpeed: 0,
    parameters: ['Calços Engatados', 'Vedação Pneumática Inflada', 'NFe Validada'],
  },
  {
    step: 6,
    name: 'Carga/Descarga Ativa',
    phase: 'DOCKED_OPERATING',
    description: 'Transbordo acelerado de paletes com empilhadeiras em ritmo dinâmico.',
    targetSpeed: 0,
    parameters: ['Empilhadeiras em Operação', 'Leitura Barcode/RFID', 'Pesagem Unitária'],
  },
  {
    step: 7,
    name: 'Ocorrência Estocástica',
    phase: 'DOCKED_RANDOM_EVENT',
    description: 'Amostragem de controle de qualidade (CQ) ou teste de temperatura do fiscal.',
    targetSpeed: 0,
    parameters: ['Inspeção CQ Regulamentar', 'Pausa Técnica Controlada', 'Lote Aprovado'],
  },
  {
    step: 8,
    name: 'Lacre de Saída & Documentos',
    phase: 'DOCKED_COMPLETED',
    description: 'Fechamento de portas, aplicação de lacre inviolável e romaneio assinado.',
    targetSpeed: 0,
    parameters: ['Lacre Verde Aplicado', 'Portas Travadas', 'Manifesto Assinado'],
  },
  {
    step: 9,
    name: 'Partida da Doca',
    phase: 'DEPARTING',
    description: 'Desengate seguro e arrancada frontal da doca para o pátio.',
    targetSpeed: 22,
    parameters: ['Descalçamento Liberado', 'Avanço Frontal', 'Velocidade: 22 km/h'],
  },
  {
    step: 10,
    name: 'Saída Pelo Portão',
    phase: 'EXITING_CD',
    description: 'Circuito de saída (TRK-8821 pela faixa esquerda oeste; outros via leste).',
    targetSpeed: 40,
    parameters: ['TRK-8821: Esquerda da Via', 'Sem Giro Brusco', 'Velocidade na Pista: 40 km/h'],
  },
  {
    step: 11,
    name: 'Conclusão de Missão',
    phase: 'MISSION_COMPLETED',
    description: 'Perímetro cruzado, liberação imediata da doca e novo agendamento.',
    targetSpeed: 0,
    parameters: ['Missão Concluída', 'Doca 100% Livre', 'Registro Histórico WMS'],
  },
];

export type ItemStockStatus =
  | 'normal'
  | 'low_stock'
  | 'critical'
  | 'In Stock'
  | 'Low Stock'
  | 'Critical'
  | string;

export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  quantity: number;
  safetyStock: number;
  minSafetyStock: number;
  maxStock?: number;
  unit: string;
  unitPriceEUR: number;
  weightKgPerUnit?: number;
  supplier?: string;
  location: string;
  rackId: string;
  status: ItemStockStatus;
  lastUpdated?: string;
}

export interface PalletEntity {
  id: string;
  tag: string;
  productName: string;
  category: 'PPE' | 'Packaging' | 'Electronics' | 'Automotive' | 'Refrigerated';
  quantity: number;
  grossWeightKg: number;
  location: string;
  lot: string;
  receivedDate: string;
  site: string;
  status: 'Staged' | 'In Rack' | 'Loading' | 'Moving';
  x: number;
  z: number;
}

export interface DockBay {
  id: number;
  bayNumber: string;
  number?: number;
  name?: string;
  status: 'Disponível' | 'Em Carga' | 'Em Descarga' | 'Manutenção' | string;
  statusText?: string;
  statusCode?: 'docked' | 'loading' | 'unloading' | 'docking' | 'available' | 'en_route';
  assignedVehicleId?: string;
  assignedTruckId?: string;
  assignedTruckLabel?: string;
  doorState?: 'Open 180°' | 'Closed' | 'Opening' | string;
  sealActive?: boolean;
  trucksToday?: number;
  totalOperationsToday: number;
  temperature?: string;
  temperatureZone?: string;
  progressPercent?: number;
  currentCargo?: string;
  scheduledNextVehicle?: string;
  handlingTimeAvgMinutes?: number;
}

export type DockBayInfo = DockBay;

export interface ShipmentStep {
  label: string;
  timeOrEta: string;
  status: 'completed' | 'active' | 'pending';
}

export interface ShipmentTrackingData {
  shipmentId: string;
  truckId: string;
  carrier: TruckCarrier;
  destination: string;
  bayLabel: string;
  timeLeft: string;
  currentStepIndex: number;
  steps: ShipmentStep[];
}

export interface WarehouseConfig {
  id: WarehouseId;
  code: string;
  name: string;
  subtitle?: string;
  location?: string;
  type: string;
  statusBadge: string;
  stockOnHand: number;
  maxCapacity: number;
  stockChange: number;
  trucksOnSite: number;
  trucksChange: number;
  dockedCount: number;
  queueCount: number;
  onTimeDeliveryPercent: number;
  onTimeDeliveryRate?: number;
  averageDockTurnaroundMin?: number;
  onTimeChange: number;
  runoutDays: number;
  outboundTodayCount: number;
  putAwayTodayCount: number;
  docksCountActive: string;
  currentOccupiedPallets?: number;
  totalCapacityPallets?: number;
  totalAreaSqM?: number;
  inventory: InventoryItem[];
  docks: DockBay[];
  forklifts: {
    id: string;
    model: string;
    task: string;
    status: 'loading' | 'unloading' | 'staging' | 'charging';
    batteryPercent: number;
  }[];
}

export interface ActivityEvent {
  id: string;
  timestamp: string;
  type: 'truck' | 'forklift' | 'agv' | 'dock' | 'stock' | 'alert';
  title: string;
  description: string;
  severity: 'info' | 'success' | 'warning' | 'alert';
  vehicleId?: string;
}
