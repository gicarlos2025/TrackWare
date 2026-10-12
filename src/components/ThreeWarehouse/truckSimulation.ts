import * as THREE from 'three';
import { Vehicle, VehicleStatus } from '../../types/warehouse';
import { soundManager } from '../../utils/audio';

export type TruckOperation = 'UNLOAD' | 'LOAD';

export type TruckSimStage =
  | 'STANDBY_HIGHWAY'       // Fora do pátio / na rodovia aguardando horário programado
  | 'GATE_IN'               // Aproximação pela rodovia e vistoria na portaria de acesso
  | 'APPROACH'              // Deslocamento pelo pátio em direção ao alinhamento da doca
  | 'WAITING_YARD'          // Aguardando na área de espera do pátio se doca estiver ocupada
  | 'ALIGN_REVERSE'         // Alinhamento suave em frente à doca
  | 'REVERSING'             // Manobra de marcha à ré até a vedação da doca
  | 'DOCKED_INSPECTION'     // Acoplado: calçamento de rodas, vistoria de lacre e NFe
  | 'DOCKED_OPERATING'      // Operação ativa de carga/descarga com ritmo e pausas realistas
  | 'DOCKED_RANDOM_EVENT'   // Situação do cotidiano (inspeção CQ, termografia, conferência)
  | 'DOCKED_COMPLETED'      // Operação concluída: lacre de saída e liberação documental
  | 'DEPARTING'             // Saída da doca avançando para o pátio
  | 'EXITING_CD'            // Via principal de saída (TRK-8821 segue estritamente pela esquerda)
  | 'MISSION_COMPLETED';    // Fim do ciclo: cruza o perímetro, missão concluída, aguarda intervalo realista

export interface TruckMissionState {
  operation: TruckOperation;
  dockId: number;
  dockX: number;
  cargoName: string;
  stage: TruckSimStage;
  targetZ: number;
  operatingTimer: number;
  progressPercent: number;
  exitDirection: 'left';
  dwellTimer: number;
  standbyTimer: number;
  beepTimer: number;
  randomEventName?: string;
  randomEventTriggered: boolean;
  totalPallets: number;
  entryGateSide: 'east';
  // Anti-colisão 3D: Navegação Estruturada por Corredores & Lógica de Espera
  approachPhase?: 'ENTRY_GATE' | 'YARD_CORRIDOR' | 'DOCK_APRON';
  detourActive?: boolean;
  detourTarget?: { x: number; z: number };
  detourDirection?: 'left' | 'right';
  detourTimer?: number;
  avoidanceState?: 'clear' | 'waiting' | 'detouring';
  blockedByVehicleId?: string | null;
}

export interface TruckAgent {
  mesh: THREE.Group;
  data: Vehicle;
  state: TruckMissionState;
}

const RANDOM_TRUCK_EVENTS = [
  'Inspeção Amostral de Qualidade (CQ pelo Fiscal do CD)',
  'Termografia & Checagem de Cadeia de Frio',
  'Conferência de Romaneio Digital e Lacre WMS',
  'Ajuste de Paleteira Hidráulica na Carroceria',
  'Amostragem Fitossanitária & Registro de Lote',
];

export const CARGO_CATALOG = [
  'Painéis LED 4K UHD 55"',
  'Baterias Modulares Li-Ion 48V',
  'Microcontroladores ARM Cortex-M7',
  'Sensores Ópticos LiDAR 3D 360°',
  'Chassis Metálicos Reforçados R-30',
  'Caixas de Cartão Canelado 60x40',
  'Servomotores Industriais Brushless',
  'Lubrificante Sintético Industrial',
];

export const DOCK_X_COORDS = [-16.5, -5.5, 5.5, 16.5]; // Doca 1, 2, 3, 4
const TRUCK_MIN_TURN_RADIUS = 8.5;
export const TRUCK_ENTRY_GATE_SIDE = 'east' as const;
export const TRUCK_EXIT_DIRECTION = 'left' as const;

export interface TruckSimulationCallbacks {
  onVehicleStatusChange?: (
    id: string,
    status: VehicleStatus,
    progress: number,
    loc: string,
    routineStep?: number,
    routineStepName?: string,
    routineParameters?: string
  ) => void;
  onActivityLog?: (
    title: string,
    description: string,
    type: 'truck' | 'forklift' | 'agv' | 'dock',
    severity?: 'info' | 'success' | 'warning'
  ) => void;
  onDockUpdate?: (
    dockId: number,
    status: 'Disponível' | 'Em Carga' | 'Em Descarga',
    progress: number,
    truckId?: string
  ) => void;
}

export function updateTruckSimulation(
  trucks: Map<string, TruckAgent>,
  currentSimSpeed: number,
  callbacks: TruckSimulationCallbacks
): void {
  const truckMeshesRef = { current: trucks };
  const statusCallbackRef = { current: callbacks.onVehicleStatusChange };
  const activityLogCallbackRef = { current: callbacks.onActivityLog };
  const dockUpdateCallbackRef = { current: callbacks.onDockUpdate };

        // Helper: Detecção Física de Sobreposição / Anticolisão Entre Caminhões
        // Modela cada caminhão com 4 discos calibrados ao longo da carroceria (10.1m x 2.5m)
        // Raio: 1.30m em cada ponto -> envelope físico fiel e preciso sem bolhas fantasmas
        // =========================================================================
        const getTruckDiscs = (x: number, z: number, rotY: number) => {
          const sin = Math.sin(rotY);
          const cos = Math.cos(rotY);
          return [
            { x: x + 3.4 * sin, z: z + 3.4 * cos, r: 1.30 }, // Cabine frontal e para-choque
            { x: x + 1.1 * sin, z: z + 1.1 * cos, r: 1.30 }, // Chassi dianteiro
            { x: x - 1.1 * sin, z: z - 1.1 * cos, r: 1.30 }, // Centro do baú
            { x: x - 3.4 * sin, z: z - 3.4 * cos, r: 1.30 }, // Traseira do baú e portas
          ];
        };

        const checkTruckCollision = (
          selfId: string,
          candX: number,
          candZ: number,
          candRotY: number,
          safetyBuffer = 0.40
        ): {
          collides: boolean;
          hazard: boolean;
          obstacleId: string | null;
          minDist: number;
          obstaclePos?: { x: number; z: number };
        } => {
          const myDiscs = getTruckDiscs(candX, candZ, candRotY);
          let closestDist = Infinity;
          let closestId: string | null = null;
          let closestPos: { x: number; z: number } | undefined = undefined;

          const selfTruck = truckMeshesRef.current.get(selfId);
          const isSelfDeparting =
            selfTruck &&
            (selfTruck.state.stage === 'DEPARTING' || selfTruck.state.stage === 'EXITING_CD');

          for (const otherTruck of truckMeshesRef.current.values()) {
            if (
              otherTruck.data.id === selfId ||
              !otherTruck.mesh.visible ||
              otherTruck.state.stage === 'STANDBY_HIGHWAY' ||
              otherTruck.state.stage === 'MISSION_COMPLETED'
            ) continue;

            const other = {
              id: otherTruck.data.id,
              x: otherTruck.mesh.position.x,
              z: otherTruck.mesh.position.z,
              rotY: otherTruck.mesh.rotation.y,
            };
            // Distância euclidiana rápida entre os centros de massa
            const dx = other.x - candX;
            const dz = other.z - candZ;
            const centerDist = Math.hypot(dx, dz);
            if (centerDist > 16.0) continue; // Totalmente seguro, fora da zona crítica

            // Se o outro veículo estiver atracado na doca (z < 6.0) e não estivermos manobrando na mesma doca
            if (other.z < 6.0 && candZ > 12.0) continue;

            const isOtherYielding =
              otherTruck.state.avoidanceState === 'waiting' &&
              (otherTruck.state.stage === 'APPROACH' ||
                otherTruck.state.stage === 'WAITING_YARD' ||
                otherTruck.state.stage === 'GATE_IN');

            // Regra de Ouro CTB Art. 29: Veículo desocupando doca tem preferência sobre veículo aguardando
            if (isSelfDeparting && isOtherYielding && centerDist > 3.3) {
              continue; // Passagem autorizada com prioridade regulamentar
            }

            const otherDiscs = getTruckDiscs(other.x, other.z, other.rotY);
            for (const d1 of myDiscs) {
              for (const d2 of otherDiscs) {
                const pdx = d1.x - d2.x;
                const pdz = d1.z - d2.z;
                const dist = Math.sqrt(pdx * pdx + pdz * pdz);
                if (dist < closestDist) {
                  closestDist = dist;
                  closestId = other.id;
                  closestPos = { x: other.x, z: other.z };
                }
                // Verificação física calibrada
                const threshold = d1.r + d2.r + safetyBuffer;
                if (dist < threshold) {
                  return {
                    collides: true,
                    hazard: true,
                    obstacleId: other.id,
                    minDist: dist,
                    obstaclePos: { x: other.x, z: other.z },
                  };
                }
              }
            }
          }

          return {
            collides: false,
            hazard: closestDist < 4.0,
            obstacleId: closestId,
            minDist: closestDist,
            obstaclePos: closestPos,
          };
        };

        // =========================================================================
        // Helper: Planejador de Desvio de Rota Evasivo no Pátio 3D
        // Calcula vetor lateral alternativo (direita/esquerda) para contornar obstáculo
        // =========================================================================
        const evaluateRouteDetour = (
          selfId: string,
          currX: number,
          currZ: number,
          currRotY: number,
          goalX: number,
          _goalZ: number
        ): {
          canDetour: boolean;
          chosenWaypoint?: { x: number; z: number };
          direction?: 'left' | 'right';
        } => {
          const perpRight = currRotY + Math.PI / 2;
          const perpLeft = currRotY - Math.PI / 2;
          const lateralOffset = 4.0;
          const forwardOffset = 2.0;

          // Candidato 1: Desvio pela Direita
          const rX = currX + Math.sin(perpRight) * lateralOffset + Math.sin(currRotY) * forwardOffset;
          const rZ = currZ + Math.cos(perpRight) * lateralOffset + Math.cos(currRotY) * forwardOffset;
          const inBoundsR = rX >= -22.0 && rX <= 22.0 && rZ >= 8.0 && rZ <= 17.5;
          const colR = inBoundsR ? checkTruckCollision(selfId, rX, rZ, perpRight, 0.90) : { collides: true, hazard: true, obstacleId: null, minDist: 0 };

          // Candidato 2: Desvio pela Esquerda
          const lX = currX + Math.sin(perpLeft) * lateralOffset + Math.sin(currRotY) * forwardOffset;
          const lZ = currZ + Math.cos(perpLeft) * lateralOffset + Math.cos(currRotY) * forwardOffset;
          const inBoundsL = lX >= -22.0 && lX <= 22.0 && lZ >= 8.0 && lZ <= 17.5;
          const colL = inBoundsL ? checkTruckCollision(selfId, lX, lZ, perpLeft, 0.90) : { collides: true, hazard: true, obstacleId: null, minDist: 0 };

          if (!colR.collides && !colL.collides) {
            // Ambos os lados livres: priorizar o lado mais favorável para a doca de destino
            const distR = Math.abs(rX - goalX);
            const distL = Math.abs(lX - goalX);
            if (distR <= distL) {
              return { canDetour: true, chosenWaypoint: { x: rX, z: rZ }, direction: 'right' };
            } else {
              return { canDetour: true, chosenWaypoint: { x: lX, z: lZ }, direction: 'left' };
            }
          } else if (!colR.collides) {
            return { canDetour: true, chosenWaypoint: { x: rX, z: rZ }, direction: 'right' };
          } else if (!colL.collides) {
            return { canDetour: true, chosenWaypoint: { x: lX, z: lZ }, direction: 'left' };
          }

          return { canDetour: false };
        };

        // Identificar se há algum caminhão na Portaria de Entrada (x em torno de 0, z em 19.0)
        let truckAtGateId: string | null = null;
        truckMeshesRef.current.forEach((t) => {
          if (
            t.mesh.visible &&
            t.state.stage === 'GATE_IN' &&
            Math.abs(t.mesh.position.x) <= 6.5
          ) {
            truckAtGateId = t.data.id;
          }
        });

        // Identificar se há caminhão em manobra de saída no pátio (DEPARTING ou início de EXITING_CD)
        // Regra de Ouro: Somente 1 caminhão pode partir do pátio por vez para evitar saídas simultâneas
        let departingTruckId: string | null = null;
        truckMeshesRef.current.forEach((t) => {
          if (
            t.mesh.visible &&
            (t.state.stage === 'DEPARTING' ||
              (t.state.stage === 'EXITING_CD' && t.mesh.position.z < 24.5))
          ) {
            departingTruckId = t.data.id;
          }
        });

        // =========================================================================
        // YMS TRAFFIC CONTROLLER: RESOLUÇÃO ATIVA DE CONGESTIONAMENTO / DEADLOCK
        // Se dois veículos estiverem em espera mútua ou com caminho bloqueado em frente à doca
        // Aplicação do Art. 29 CTB: Preferência absoluta para quem desocupa a doca
        // =========================================================================
        truckMeshesRef.current.forEach((t1) => {
          if (!t1.mesh.visible || t1.state.avoidanceState !== 'waiting') return;
          const blockerId = t1.state.blockedByVehicleId;
          if (blockerId) {
            const t2 = truckMeshesRef.current.get(blockerId);
            if (t2 && t2.mesh.visible) {
              const isT1Departing = t1.state.stage === 'DEPARTING' || t1.state.stage === 'EXITING_CD';
              const isT2Departing = t2.state.stage === 'DEPARTING' || t2.state.stage === 'EXITING_CD';

              if (isT2Departing && !isT1Departing) {
                // T1 está aproximando ou esperando: recuar para a linha de espera segura (z = 18.5) para liberar T2
                if (t1.mesh.position.z < 18.5) {
                  t1.mesh.position.z += 0.12 * currentSimSpeed;
                }
                // Se estiver exatamente na linha frontal da doca de T2, deslocar lateralmente para dar passagem
                if (Math.abs(t1.mesh.position.x - t2.mesh.position.x) < 4.0) {
                  const shiftDir = t2.mesh.position.x >= 0 ? -1 : 1;
                  t1.mesh.position.x += shiftDir * 0.08 * currentSimSpeed;
                }
                t1.data.status = 'Cedendo Passagem (CTB Art. 29)';
                t1.data.loc = `Pátio Central · Cedendo via com preferência para saída de ${t2.data.id}`;
                // Desbloqueia T2 para retomar movimento imediatamente
                if (t2.state.avoidanceState === 'waiting' && t2.state.blockedByVehicleId === t1.data.id) {
                  t2.state.avoidanceState = 'clear';
                  t2.state.blockedByVehicleId = null;
                }
              } else if (isT1Departing && !isT2Departing) {
                // T1 está partindo: T2 deve dar passagem
                if (t2.mesh.position.z < 18.5) {
                  t2.mesh.position.z += 0.12 * currentSimSpeed;
                }
                if (Math.abs(t2.mesh.position.x - t1.mesh.position.x) < 4.0) {
                  const shiftDir = t1.mesh.position.x >= 0 ? -1 : 1;
                  t2.mesh.position.x += shiftDir * 0.08 * currentSimSpeed;
                }
                t2.data.status = 'Cedendo Passagem (CTB Art. 29)';
                t2.data.loc = `Pátio Central · Cedendo via com preferência para saída de ${t1.data.id}`;
                if (t1.state.avoidanceState === 'waiting' && t1.state.blockedByVehicleId === t2.data.id) {
                  t1.state.avoidanceState = 'clear';
                  t1.state.blockedByVehicleId = null;
                }
              }
            }
          }
        });

        // =========================================================================
        // A. SIMULAÇÃO DOS CAMINHÕES (Fluxo Contínuo Cadenciado & Anticolisão)
        // =========================================================================
        truckMeshesRef.current.forEach(({ mesh, data, state }) => {
          // MOMENTO 1 · Despacho & Rodovia (Chegada programada via Rodovia BR)
          if (state.stage === 'STANDBY_HIGHWAY') {
            mesh.visible = false;
            mesh.position.set(999, -100, 999);
            data.speedKmh = 0;
            data.status = 'Programado';
            data.routineStep = 1;
            data.routineStepName = 'Momento 1 · Despacho & Rodovia';
            data.routineStepDesc = 'Chegada programada via Rodovia BR e telemetria de trânsito externo';
            data.routineParameters = 'Velocidade: ~42 km/h | Rastreio GPS Ativo | Doca Pré-Designada';
            data.loc = `Rodovia BR · Chegada prevista em ${Math.max(1, Math.round(state.standbyTimer))}s`;

            // Intervalo cadenciado de despacho
            state.standbyTimer -= 0.055 * currentSimSpeed;
            if (state.standbyTimer <= 0) {
              // Docas ocupadas no pátio (não despachar para doca ocupada)
              const busyDockIds = new Set<number>();
              truckMeshesRef.current.forEach((t) => {
                if (
                  t.data.id !== data.id &&
                  t.state.stage !== 'STANDBY_HIGHWAY' &&
                  t.state.stage !== 'MISSION_COMPLETED' &&
                  !(t.state.stage === 'EXITING_CD' && t.mesh.position.z >= 24.0)
                ) {
                  busyDockIds.add(t.state.dockId);
                }
              });

              // Escolher próxima doca disponível
              let chosenDock: number | null = null;
              for (let d = 1; d <= 4; d++) {
                if (!busyDockIds.has(d)) {
                  chosenDock = d;
                  break;
                }
              }

              // Se todas as 4 docas estiverem com caminhões, aguardar 2s e tentar novamente
              if (chosenDock === null) {
                state.standbyTimer = 2.0;
                return;
              }

              // Escolher lado de entrada na pista norte (z = 19.0)
              const arriveSide = TRUCK_ENTRY_GATE_SIDE;
              const spawnX = arriveSide === 'east' ? 52.0 : -52.0;

              // Verificar se a área de spawn está desobstruída
              let spawnBlocked = false;
              truckMeshesRef.current.forEach((t) => {
                if (
                  t.mesh.visible &&
                  t.data.id !== data.id &&
                  Math.abs(t.mesh.position.x - spawnX) < 14.0 &&
                  t.mesh.position.z < 21.0
                ) {
                  spawnBlocked = true;
                }
              });

              if (spawnBlocked) {
                state.standbyTimer = 1.8;
                return;
              }

              const newOp: TruckOperation = Math.random() > 0.45 ? 'UNLOAD' : 'LOAD';
              const newCargo = CARGO_CATALOG[Math.floor(Math.random() * CARGO_CATALOG.length)];
              const newPallets = 20 + Math.floor(Math.random() * 8);

              state.dockId = chosenDock;
              state.dockX = DOCK_X_COORDS[chosenDock - 1];
              state.operation = newOp;
              state.cargoName = newCargo;
              state.totalPallets = newPallets;
              state.entryGateSide = arriveSide;
              state.progressPercent = 0;
              state.operatingTimer = 0;
              state.dwellTimer = 1.0;
              state.randomEventTriggered = false;
              state.stage = 'GATE_IN';
              state.exitDirection = TRUCK_EXIT_DIRECTION;

              mesh.visible = true;
              mesh.position.set(spawnX, 0, 19.0); // Faixa Norte (Acesso à Portaria)
              mesh.rotation.y = arriveSide === 'east' ? -Math.PI / 2 : Math.PI / 2;

              data.status = 'Em trânsito · Rodovia';
              data.cargo = newCargo;
              data.palletsCount = newPallets;
              data.destination = `Riverside Hub · Doca 0${chosenDock} (${newOp === 'UNLOAD' ? 'Descarga' : 'Carregamento'})`;
              data.loc = `Rodovia de Acesso (Faixa Norte · Rumo Doca 0${chosenDock})`;
              data.routineStep = 1;
              data.routineStepName = 'Momento 1 · Despacho & Rodovia';
              data.routineStepDesc = `Chegada autorizada para Doca 0${chosenDock} (${newCargo})`;
              data.routineParameters = 'Velocidade: ~42 km/h | Rastreio GPS | Doca Pré-Designada';

              activityLogCallbackRef.current?.(
                'Rotina · Novo Despacho',
                `${data.id}: Momento 1 ativado. Camião em trânsito pela Rodovia Norte rumo à Doca 0${chosenDock}.`,
                'truck',
                'info'
              );
              statusCallbackRef.current?.(data.id, data.status, 0, data.loc, 1, data.routineStepName, data.routineParameters);
            }
          }

          // MOMENTO 2 · Portaria & Triagem (Acesso, balança rodoviária e vistoria de lacre)
          else if (state.stage === 'GATE_IN') {
            const isNearGate = Math.abs(mesh.position.x) <= 5.5;

            data.routineStep = 2;
            data.routineStepName = 'Momento 2 · Portaria & Triagem';
            data.routineStepDesc = 'Vistoria obrigatória na cancela: balança, termografia e lacre';
            data.routineParameters = 'Balança: Validada | Lacre de Entrada: OK | Check-in QR-Code';

            if (!isNearGate) {
              // Movimento pela Faixa Norte (z = 19.0) até a portaria
              const forwardSpeed = 0.165 * currentSimSpeed;
              const nextX = state.entryGateSide === 'east'
                ? mesh.position.x - forwardSpeed
                : mesh.position.x + forwardSpeed;

              // Verificação de distância de segurança longitudinal (Headway) na mesma faixa
              let vehicleAheadBlocking = false;
              let isSevereClose = false;
              let blockerId: string | null = null;

              truckMeshesRef.current.forEach((other) => {
                if (
                  other.data.id !== data.id &&
                  other.mesh.visible &&
                  Math.abs(other.mesh.position.z - 19.0) < 3.5
                ) {
                  if (state.entryGateSide === 'east') {
                    // Nós nos movemos para a esquerda (x decrescente). Outro veículo está à nossa frente se other.x < mesh.x
                    if (other.mesh.position.x < mesh.position.x) {
                      const hDist = mesh.position.x - other.mesh.position.x;
                      if (hDist < 13.0) {
                        vehicleAheadBlocking = true;
                        blockerId = other.data.id;
                        if (hDist < 8.0) isSevereClose = true;
                      }
                    }
                  } else {
                    // Nós nos movemos para a direita (x crescente). Outro veículo está à nossa frente se other.x > mesh.x
                    if (other.mesh.position.x > mesh.position.x) {
                      const hDist = other.mesh.position.x - mesh.position.x;
                      if (hDist < 13.0) {
                        vehicleAheadBlocking = true;
                        blockerId = other.data.id;
                        if (hDist < 8.0) isSevereClose = true;
                      }
                    }
                  }
                }
              });

              // Se outro caminhão estiver na cancela de triagem, frear com segurança antes da portaria
              if (truckAtGateId !== null && truckAtGateId !== data.id && Math.abs(nextX) < 11.5) {
                vehicleAheadBlocking = true;
                isSevereClose = true;
                blockerId = truckAtGateId;
              }

              // Checar colisão no ponto candidato
              const candCol = checkTruckCollision(data.id, nextX, 19.0, state.entryGateSide === 'east' ? -Math.PI / 2 : Math.PI / 2, 0.90);
              if (candCol.collides) {
                vehicleAheadBlocking = true;
                isSevereClose = true;
                blockerId = candCol.obstacleId;
              }

              if (vehicleAheadBlocking) {
                if (isSevereClose) {
                  // LÓGICA DE ESPERA / PARADA TOTAL: NUNCA INVADIR ESPAÇO FÍSICO DO OUTRO VEÍCULO
                  data.speedKmh = 0;
                  state.avoidanceState = 'waiting';
                  state.blockedByVehicleId = blockerId;
                  data.status = 'Aguardando Cancelas';
                  data.loc = `Rodovia Norte · Parada de Segurança (Aguardando ${blockerId || 'veículo à frente'})`;
                  data.routineParameters = 'Parada Preventiva | Headway Anticolisão Ativo | Freios Acionados';
                  return;
                } else {
                  // Redução suave de velocidade mantendo distância segura
                  data.speedKmh = 20;
                  state.avoidanceState = 'clear';
                  mesh.position.x = state.entryGateSide === 'east'
                    ? mesh.position.x - forwardSpeed * 0.45
                    : mesh.position.x + forwardSpeed * 0.45;
                  return;
                }
              }

              state.avoidanceState = 'clear';
              state.blockedByVehicleId = null;
              mesh.position.x = nextX;
              mesh.position.z = 19.0;
              mesh.rotation.y = state.entryGateSide === 'east' ? -Math.PI / 2 : Math.PI / 2;
              data.speedKmh = 42;
              data.status = 'Em trânsito · Rodovia';
              data.loc = 'Rodovia de Acesso (Faixa Norte) · Aproximando-se da Portaria';
            } else {
              // Chegamos na portaria
              // Se outro caminhão já estiver dentro da área da cancela, esperar
              if (truckAtGateId !== null && truckAtGateId !== data.id) {
                data.speedKmh = 0;
                state.avoidanceState = 'waiting';
                data.status = 'Aguardando Portaria';
                data.loc = `Portaria de Entrada (Aguardando liberação por ${truckAtGateId})`;
                return;
              }

              mesh.position.x += (0 - mesh.position.x) * 0.15;
              mesh.position.z = 19.0;
              state.dwellTimer -= 0.055 * currentSimSpeed;
              data.speedKmh = 0;
              state.avoidanceState = 'clear';
              data.status = 'Portaria · Triagem';
              data.loc = 'Portaria de Entrada (Vistoria de Lacre & Termografia)';

              if (state.dwellTimer <= 0) {
                // Verificar se a doca designada já está liberada antes de abrir a cancela
                let targetDockBusy = false;
                let busyVehicleId: string | null = null;
                truckMeshesRef.current.forEach((other) => {
                  if (
                    other.data.id !== data.id &&
                    other.mesh.visible &&
                    other.state.stage !== 'STANDBY_HIGHWAY' &&
                    other.state.stage !== 'MISSION_COMPLETED'
                  ) {
                    if (
                      other.state.dockId === state.dockId &&
                      !(other.state.stage === 'EXITING_CD' && other.mesh.position.z >= 22.0)
                    ) {
                      targetDockBusy = true;
                      busyVehicleId = other.data.id;
                    }
                    // Se algum caminhão estiver partindo pelo pátio na frente das docas, esperar na portaria
                    if (
                      (other.state.stage === 'DEPARTING' ||
                        (other.state.stage === 'EXITING_CD' && other.mesh.position.z < 21.0)) &&
                      Math.abs(other.mesh.position.x - 0) < 12.0
                    ) {
                      targetDockBusy = true;
                      busyVehicleId = other.data.id;
                    }
                  }
                });

                if (targetDockBusy) {
                  data.speedKmh = 0;
                  state.avoidanceState = 'waiting';
                  state.blockedByVehicleId = busyVehicleId;
                  data.status = 'Aguardando Doca Livre';
                  data.loc = `Portaria de Entrada · Aguardando desocupação da Doca 0${state.dockId} por ${busyVehicleId || 'veículo'} (CTB Art. 29)`;
                  data.routineStepDesc = `Aguardando saída e liberação da doca por veículo prioritário`;
                  return;
                }

                // Verificar se a área do pátio para entrar está desobstruída
                const col = checkTruckCollision(data.id, 0, 17.5, Math.PI, 0.40);
                if (!col.collides) {
                  state.stage = 'APPROACH';
                  state.approachPhase = 'ENTRY_GATE';
                  activityLogCallbackRef.current?.(
                    'Rotina · Acesso Autorizado',
                    `${data.id}: Momento 2 concluído. Lacre e balança validados. Entrada no pátio autorizada rumo à Doca 0${state.dockId}.`,
                    'truck',
                    'success'
                  );
                } else {
                  // Pátio temporariamente ocupado: aguardar na cancela
                  data.speedKmh = 0;
                  state.avoidanceState = 'waiting';
                  state.blockedByVehicleId = col.obstacleId;
                  data.status = 'Aguardando Pátio Livre';
                  data.loc = `Portaria · Aguardando desobstrução por ${col.obstacleId}`;
                }
              }
            }
          }

          // MOMENTO 3 · Aproximação & Pátio (Trânsito Estruturado por Corredores & Respeito Estrito à Desocupação)
          else if (state.stage === 'APPROACH') {
            data.routineStep = 3;
            data.routineStepName = 'Momento 3 · Aproximação & Pátio';
            data.routineStepDesc = `Deslocamento pelo corredor de entrada em direção à Doca 0${state.dockId}`;
            data.routineParameters = 'Velocidade no Pátio: 14 km/h | Radar Anticolisão Ativo | Vias Estruturadas';

            if (!state.approachPhase) {
              state.approachPhase = mesh.position.z > 18.0 ? 'ENTRY_GATE' : 'YARD_CORRIDOR';
            }

            // FASE 1: Transição do Portão (z = 19.0) para a Faixa de Entrada Norte (z = 17.5)
            if (state.approachPhase === 'ENTRY_GATE') {
              const targetZ = 17.5;
              const targetAngle = Math.PI; // Rumo sul (entrando no pátio)
              let diff = targetAngle - mesh.rotation.y;
              while (diff < -Math.PI) diff += Math.PI * 2;
              while (diff > Math.PI) diff -= Math.PI * 2;
              const nextRotY = mesh.rotation.y + THREE.MathUtils.clamp(diff, -0.065 * currentSimSpeed, 0.065 * currentSimSpeed);

              const forwardSpeed = 0.135 * currentSimSpeed;
              const nextZ = Math.max(targetZ, mesh.position.z - forwardSpeed);
              const col = checkTruckCollision(data.id, mesh.position.x, nextZ, nextRotY, 0.40);

              if (!col.collides) {
                mesh.rotation.y = nextRotY;
                mesh.position.z = nextZ;
                mesh.position.x += (0 - mesh.position.x) * 0.15;
                data.speedKmh = 14;
                state.avoidanceState = 'clear';
                state.blockedByVehicleId = null;
                data.status = 'Acesso ao Pátio';
                data.loc = 'Portaria · Acesso ao Corredor de Entrada (Limite 15 km/h)';

                if (mesh.position.z <= targetZ + 0.08) {
                  mesh.position.z = targetZ;
                  state.approachPhase = 'YARD_CORRIDOR';
                }
              } else {
                data.speedKmh = 0;
                state.avoidanceState = 'waiting';
                state.blockedByVehicleId = col.obstacleId;
                data.status = 'Aguardando Desobstrução';
                data.loc = `Portaria · Aguardando liberação por ${col.obstacleId}`;
              }
              return;
            }

            // FASE 2: Trânsito Longitudinal no Corredor (z = 17.5) até a Coluna da Doca (x = state.dockX)
            if (state.approachPhase === 'YARD_CORRIDOR') {
              const targetX = state.dockX;
              const xDiff = targetX - mesh.position.x;
              const isMovingEast = xDiff > 0;
              const targetAngle = isMovingEast ? Math.PI / 2 : -Math.PI / 2;

              let diff = targetAngle - mesh.rotation.y;
              while (diff < -Math.PI) diff += Math.PI * 2;
              while (diff > Math.PI) diff -= Math.PI * 2;
              const nextRotY = mesh.rotation.y + THREE.MathUtils.clamp(diff, -0.065 * currentSimSpeed, 0.065 * currentSimSpeed);

              mesh.position.z += (17.5 - mesh.position.z) * 0.15; // Mantém na Faixa de Entrada Norte

              if (Math.abs(xDiff) > 0.4) {
                const step = Math.min(Math.abs(xDiff), 0.145 * currentSimSpeed);
                const nextX = isMovingEast ? mesh.position.x + step : mesh.position.x - step;
                const col = checkTruckCollision(data.id, nextX, 17.5, nextRotY, 0.40);

                if (!col.collides) {
                  mesh.rotation.y = nextRotY;
                  mesh.position.x = nextX;
                  data.speedKmh = 14;
                  state.avoidanceState = 'clear';
                  state.blockedByVehicleId = null;
                  data.status = 'Trânsito no Pátio';
                  data.loc = `Corredor de Entrada · Rumo à Doca 0${state.dockId} (Vel. ≤ 15 km/h)`;
                } else {
                  data.speedKmh = 0;
                  state.avoidanceState = 'waiting';
                  state.blockedByVehicleId = col.obstacleId;
                  data.status = 'Aguardando Passagem';
                  data.loc = `Corredor Central · Parada de Segurança (Aguardando ${col.obstacleId})`;
                }
              } else {
                mesh.position.x = targetX;
                state.approachPhase = 'DOCK_APRON';
              }
              return;
            }

            // FASE 3: Entrada no Apron da Doca (x = state.dockX, avanço para z = 13.5 e alinhamento frontal a 0°)
            if (state.approachPhase === 'DOCK_APRON') {
              // VERIFICAÇÃO CRUCIAL DE DESOCUPAÇÃO: A doca designada está livre de caminhões atracados ou partindo?
              let dockApronBusy = false;
              let busyTruckId: string | null = null;
              truckMeshesRef.current.forEach((other) => {
                if (
                  other.data.id !== data.id &&
                  other.mesh.visible &&
                  other.state.stage !== 'STANDBY_HIGHWAY' &&
                  other.state.stage !== 'MISSION_COMPLETED'
                ) {
                  if (
                    other.state.dockId === state.dockId &&
                    !(other.state.stage === 'EXITING_CD' && other.mesh.position.z >= 22.0)
                  ) {
                    dockApronBusy = true;
                    busyTruckId = other.data.id;
                  }
                  if (
                    Math.abs(other.mesh.position.x - state.dockX) < 4.5 &&
                    other.mesh.position.z < 15.5
                  ) {
                    dockApronBusy = true;
                    busyTruckId = other.data.id;
                  }
                }
              });

              if (dockApronBusy) {
                // Parar com segurança na Faixa de Entrada (z = 17.5) cedendo passagem livre para a saída do outro veículo
                data.speedKmh = 0;
                state.avoidanceState = 'waiting';
                state.blockedByVehicleId = busyTruckId;
                data.status = 'Aguardando Doca Livre';
                data.loc = `Pátio Central · Aguardando liberação da Doca 0${state.dockId} por ${busyTruckId || 'outro veículo'} (CTB Art. 29)`;
                data.routineStepDesc = `Aguardando saída e liberação da Doca 0${state.dockId}`;
                return;
              }

              // Doca 100% desobstruída: alinhar para a doca (rotY = 0) e avançar até z = 13.5
              const targetAngle = 0;
              let diff = targetAngle - mesh.rotation.y;
              while (diff < -Math.PI) diff += Math.PI * 2;
              while (diff > Math.PI) diff -= Math.PI * 2;
              const nextRotY = mesh.rotation.y + THREE.MathUtils.clamp(diff, -0.065 * currentSimSpeed, 0.065 * currentSimSpeed);

              mesh.position.x += (state.dockX - mesh.position.x) * 0.2;

              const targetZ = 13.5;
              if (mesh.position.z > targetZ + 0.1) {
                const forwardSpeed = 0.115 * currentSimSpeed;
                const nextZ = mesh.position.z - forwardSpeed;
                const col = checkTruckCollision(data.id, state.dockX, nextZ, nextRotY, 0.85);

                if (!col.collides) {
                  mesh.rotation.y = nextRotY;
                  mesh.position.z = nextZ;
                  data.speedKmh = 8;
                  state.avoidanceState = 'clear';
                  state.blockedByVehicleId = null;
                  data.status = 'Posicionamento Apron';
                  data.loc = `Apron da Doca 0${state.dockId} · Preparação de Ré`;
                } else {
                  data.speedKmh = 0;
                  state.avoidanceState = 'waiting';
                  state.blockedByVehicleId = col.obstacleId;
                  data.status = 'Aguardando Desobstrução';
                  data.loc = `Em frente à Doca 0${state.dockId} · Aguardando liberação por ${col.obstacleId}`;
                }
              } else {
                mesh.position.z = targetZ;
                mesh.position.x = state.dockX;
                state.avoidanceState = 'clear';
                state.stage = 'ALIGN_REVERSE';
                data.status = 'A acoplar (Ré)';
                data.loc = `Em frente à Doca 0${state.dockId} (Alinhamento de Ré)`;
                if (statusCallbackRef.current) {
                  statusCallbackRef.current(data.id, 'A acoplar (Ré)', 5, data.loc, 4, 'Momento 4 · Alinhamento & Ré', 'Aviso Sonoro Ativo | Alinhamento 0°');
                }
              }
            }
          }

          // MOMENTO 3b · Espera no Pátio (Holding Bay Seguro)
          else if (state.stage === 'WAITING_YARD') {
            data.routineStep = 3;
            data.routineStepName = 'Momento 3b · Espera no Pátio';
            data.routineStepDesc = `Aguardando desocupação da Doca 0${state.dockId}`;
            data.routineParameters = 'Holding Bay Ativo | Motor em Ponto Morto | Sensor Ativo';
            data.speedKmh = 0;
            state.avoidanceState = 'waiting';
            data.status = 'Aguardando Doca';
            data.loc = `Pátio de Espera (Aguardando liberação da Doca 0${state.dockId})`;

            let stillOccupied = false;
            truckMeshesRef.current.forEach((other) => {
              if (
                other.data.id !== data.id &&
                other.state.dockId === state.dockId &&
                other.state.stage !== 'STANDBY_HIGHWAY' &&
                other.state.stage !== 'MISSION_COMPLETED' &&
                !(other.state.stage === 'EXITING_CD' && other.mesh.position.z >= 24.0)
              ) {
                stillOccupied = true;
              }
            });

            if (!stillOccupied) {
              state.stage = 'APPROACH';
              state.approachPhase = 'YARD_CORRIDOR';
            }
          }

          // MOMENTO 4 · Alinhamento de Ré (Posicionamento frontal e aviso sonoro)
          else if (state.stage === 'ALIGN_REVERSE') {
            data.routineStep = 4;
            data.routineStepName = 'Momento 4 · Alinhamento & Ré';
            data.routineStepDesc = 'Alinhamento angular 0° e preparação para engate de ré';
            data.routineParameters = 'Sinal Sonoro Ativo | Velocidade Ré: 5 km/h | Alinhamento 0°';

            state.stage = 'REVERSING';
            state.targetZ = 2.4;
            state.beepTimer = 0;
            soundManager.playBeep();
          }

          // MOMENTO 4b · Manobra de Marcha à Ré (Recuo acelerado com sinalização sonora)
          else if (state.stage === 'REVERSING') {
            data.routineStep = 4;
            data.routineStepName = 'Momento 4 · Manobra de Ré';
            data.routineStepDesc = `Recuo guiado até o batente da Doca 0${state.dockId}`;
            data.routineParameters = 'Alarme Sonoro NR-11 Intermitente | Velocidade: 5 km/h | Sinaleiro com Bastão';

            const targetZ = state.targetZ;

            if (mesh.position.z > targetZ + 0.08) {
              const reverseSpeed = 0.078 * currentSimSpeed;
              const nextZ = mesh.position.z - reverseSpeed;
              const nextX = mesh.position.x + (state.dockX - mesh.position.x) * 0.22;

              // Checar colisão ao recuar
              const col = checkTruckCollision(data.id, nextX, nextZ, mesh.rotation.y, 0.75);
              if (col.collides) {
                data.speedKmh = 0;
                state.avoidanceState = 'waiting';
                state.blockedByVehicleId = col.obstacleId;
                data.status = 'Alerta de Proximidade (Ré)';
                data.loc = `Doca 0${state.dockId} · Sensor de Ré (Obstáculo: ${col.obstacleId})`;
                return;
              }

              state.avoidanceState = 'clear';
              state.blockedByVehicleId = null;
              mesh.position.z = nextZ;
              mesh.position.x = nextX;
              data.status = 'A acoplar (Ré)';
              data.loc = `Doca 0${state.dockId} (Manobra de Ré com Alarme NR-11 e Sinaleiro)`;
              data.speedKmh = 5;

              state.beepTimer += 0.040 * currentSimSpeed;
              if (state.beepTimer > 1.0) {
                soundManager.playBeep();
                state.beepTimer = 0;
              }
            } else {
              mesh.position.z = targetZ;
              mesh.position.x = state.dockX;
              mesh.rotation.y = 0;
              state.stage = 'DOCKED_INSPECTION';
              state.operatingTimer = 0;
              state.dwellTimer = 1.0;
              state.progressPercent = 0;

              data.status = 'Acoplado · Vistoria';
              data.loc = `Doca 0${state.dockId} (Calçamento & Chave no Lacre)`;
              data.speedKmh = 0;
              data.routineStep = 5;
              data.routineStepName = 'Momento 5 · Acoplamento & Vistoria';
              data.routineStepDesc = 'Calçamento físico de rodas (NR-11) e retenção de chaves no lacre (CTB Art. 2º)';
              data.routineParameters = 'Calços Travados | Chave Retida na Portaria | Vedação Inflada | NFe Validada';

              soundManager.playDockSuccess();

              dockUpdateCallbackRef.current?.(
                state.dockId,
                state.operation === 'UNLOAD' ? 'Em Descarga' : 'Em Carga',
                0,
                data.id
              );
              activityLogCallbackRef.current?.(
                'Rotina · Acoplamento Feito',
                `${data.id}: Momento 5 ativado. Acoplado na Doca 0${state.dockId}. Calços de roda travados.`,
                'dock',
                'success'
              );
              statusCallbackRef.current?.(data.id, data.status, 0, data.loc, 5, data.routineStepName, data.routineParameters);
            }
          }

          // MOMENTO 5 · Acoplamento & Vistoria (Calçamento de rodas e abertura de portas)
          else if (state.stage === 'DOCKED_INSPECTION') {
            data.routineStep = 5;
            data.routineStepName = 'Momento 5 · Acoplamento & Vistoria';
            data.routineStepDesc = 'Validação de segurança de engate e romaneio digital';
            data.routineParameters = 'Calços Engatados | Vedação Inflada | NFe Validada';

            state.dwellTimer -= 0.055 * currentSimSpeed;
            data.speedKmh = 0;

            if (state.dwellTimer <= 0) {
              state.stage = 'DOCKED_OPERATING';
              const opStatus: VehicleStatus = state.operation === 'UNLOAD' ? 'A descarregar' : 'A carregar';
              data.status = opStatus;
              data.loc = `Doca 0${state.dockId} (${state.operation === 'UNLOAD' ? 'Descarga Ativa' : 'Carregamento Ativo'})`;
              data.routineStep = 6;
              data.routineStepName = 'Momento 6 · Carga/Descarga Ativa';
              data.routineStepDesc = `Transbordo acelerado de ${state.totalPallets} paletes no galpão`;
              data.routineParameters = 'Empilhadeiras Operando | Leitura Barcode/RFID | Pesagem Unitária';

              activityLogCallbackRef.current?.(
                'Rotina · Operação Ativa',
                `Doca 0${state.dockId}: Momento 6. Transbordo acelerado de paletes iniciado para ${data.id}.`,
                'dock',
                'info'
              );
            }
          }

          // MOMENTO 6 · Carga / Descarga Ativa (Transbordo acelerado com empilhadeiras)
          else if (state.stage === 'DOCKED_OPERATING') {
            state.operatingTimer += 0.025 * currentSimSpeed;
            // Ritmo dinâmico levemente escalonado por doca para evitar término no mesmo segundo
            const staggerRate = (0.20 + ((state.dockId * 3) % 4) * 0.03) * currentSimSpeed;
            state.progressPercent = Math.min(100, state.progressPercent + staggerRate);
            data.progressPercent = Math.round(state.progressPercent);

            const curPallet = Math.min(
              state.totalPallets,
              Math.floor((state.progressPercent / 100) * state.totalPallets) + 1
            );
            data.loc = `Doca 0${state.dockId} (${state.operation === 'UNLOAD' ? 'Descarga' : 'Carga'} · Palete ${curPallet}/${state.totalPallets})`;
            data.status = state.operation === 'UNLOAD' ? 'A descarregar' : 'A carregar';
            data.routineStep = 6;
            data.routineStepName = 'Momento 6 · Carga/Descarga Ativa';
            data.routineStepDesc = `Palete ${curPallet} de ${state.totalPallets} em movimentação acelerada`;
            data.routineParameters = `Palete: ${curPallet}/${state.totalPallets} | RFID Lido | Empilhadeira Ativa`;

            dockUpdateCallbackRef.current?.(
              state.dockId,
              state.operation === 'UNLOAD' ? 'Em Descarga' : 'Em Carga',
              data.progressPercent,
              data.id
            );

            // Ocorrência aleatória diária em percentuais ligeiramente diferentes por doca
            const eventTrigger = 38 + state.dockId * 6;
            if (state.progressPercent >= eventTrigger && !state.randomEventTriggered) {
              state.randomEventTriggered = true;
              const randEvent = RANDOM_TRUCK_EVENTS[Math.floor(Math.random() * RANDOM_TRUCK_EVENTS.length)];
              state.randomEventName = randEvent;
              state.stage = 'DOCKED_RANDOM_EVENT';
              state.dwellTimer = 1.0;

              data.routineStep = 7;
              data.routineStepName = 'Momento 7 · Ocorrência Estocástica';
              data.routineStepDesc = randEvent;
              data.routineParameters = 'Inspeção CQ Regulamentar | Pausa Técnica | Lote Aprovado';

              activityLogCallbackRef.current?.(
                'Rotina · Ocorrência CQ',
                `${data.id}: Momento 7. ${randEvent}. Pausa técnica de amostragem na Doca 0${state.dockId}.`,
                'truck',
                'warning'
              );
            }

            if (state.progressPercent >= 100) {
              state.stage = 'DOCKED_COMPLETED';
              state.dwellTimer = 1.0;
              data.status = 'Carga Concluída';
              data.loc = `Doca 0${state.dockId} (Lacre de Saída & Fechamento de Portas)`;
              data.routineStep = 8;
              data.routineStepName = 'Momento 8 · Lacre de Saída & Documentação';
              data.routineStepDesc = 'Fechamento de portas, lacre inviolável e romaneio assinado';
              data.routineParameters = 'Lacre Verde Aplicado | Portas Travadas | Manifesto Assinado';

              activityLogCallbackRef.current?.(
                'Rotina · Conclusão Física',
                `Doca 0${state.dockId}: Momento 8. ${state.operation === 'UNLOAD' ? 'Descarga' : 'Carregamento'} finalizado. Manifesto assinado para ${data.id}.`,
                'dock',
                'success'
              );
            }
          }

          // MOMENTO 7 · Ocorrência Estocástica (CQ / Amostragem do fiscal / Termografia)
          else if (state.stage === 'DOCKED_RANDOM_EVENT') {
            data.routineStep = 7;
            data.routineStepName = 'Momento 7 · Ocorrência Estocástica';
            data.routineStepDesc = state.randomEventName || 'Inspeção Amostral de Qualidade CQ';
            data.routineParameters = 'Inspeção CQ Regulamentar | Pausa Técnica | Lote Aprovado';

            state.dwellTimer -= 0.055 * currentSimSpeed;
            data.status = 'Inspeção CQ / Conferência';
            data.loc = `Doca 0${state.dockId} · ${state.randomEventName}`;

            if (state.dwellTimer <= 0) {
              state.stage = 'DOCKED_OPERATING';
              activityLogCallbackRef.current?.(
                'Rotina · Inspeção Aprovada',
                `${data.id}: Amostragem regulatória concluída. Retomando movimentação acelerada de paletes.`,
                'truck',
                'info'
              );
            }
          }

          // MOMENTO 8 · Lacre de Saída & Fila de Despacho (Partida Cadenciada e Não Simultânea)
          else if (state.stage === 'DOCKED_COMPLETED') {
            data.routineStep = 8;
            data.routineStepName = 'Momento 8 · Lacre de Saída & Documentação';
            data.routineStepDesc = 'Aplicação de lacre de segurança e liberação documental WMS';
            data.routineParameters = 'Lacre Verde Aplicado | Portas Travadas | Manifesto Assinado';

            state.dwellTimer -= 0.055 * currentSimSpeed;
            if (state.dwellTimer <= 0) {
              // CONTROLE DE SAÍDA: Somente um caminhão pode partir por vez para evitar saídas simultâneas
              if (departingTruckId !== null && departingTruckId !== data.id) {
                // Outro caminhão já está saindo do pátio: aguardar com segurança na doca
                data.status = 'Aguardando Saída';
                data.loc = `Doca 0${state.dockId} · Fila de Saída (Aguardando liberação de via por ${departingTruckId})`;
                data.routineStepDesc = `Aguardando desocupação da pista de saída por ${departingTruckId}`;
                data.speedKmh = 0;
                return;
              }

              // Via de saída liberada! Autorizar partida sequencial
              state.stage = 'DEPARTING';
              departingTruckId = data.id; // Reserva a via de saída
              state.exitDirection = TRUCK_EXIT_DIRECTION;
              data.status = 'Em trânsito';
              data.loc = `Doca 0${state.dockId} (Saída Autorizada)`;
              data.routineStep = 9;
              data.routineStepName = 'Momento 9 · Partida da Doca';
              data.routineStepDesc = 'Descalçamento liberado e arrancada sequencial para o pátio';
              data.routineParameters = 'Desengate Concluído | Janela de Saída Concedida | 25 km/h';

              activityLogCallbackRef.current?.(
                'Rotina · Partida Autorizada',
                `${data.id}: Partida sequencial autorizada pelo Controle de Pátio. Iniciando avanço frontal da Doca 0${state.dockId}.`,
                'truck',
                'info'
              );

              if (statusCallbackRef.current) {
                statusCallbackRef.current(data.id, 'Em trânsito', 100, data.loc, 9, data.routineStepName, data.routineParameters);
              }
            }
          }

          // MOMENTO 9 · Partida da Doca (Arrancada acelerada para a frente saindo da doca)
          else if (state.stage === 'DEPARTING') {
            data.routineStep = 9;
            data.routineStepName = 'Momento 9 · Partida da Doca';
            data.routineStepDesc = 'Avanço frontal da doca para a pista de rolamento do pátio';
            data.routineParameters = 'Desengate Concluído | Avanço Frontal | Velocidade: 14 km/h';

            const forwardYardZ = 13.5;
            if (mesh.position.z < forwardYardZ) {
              const forwardSpeed = 0.135 * currentSimSpeed;
              const nextZ = mesh.position.z + forwardSpeed;
              const col = checkTruckCollision(data.id, mesh.position.x, nextZ, mesh.rotation.y, 0.40);
              if (!col.collides) {
                mesh.position.z = nextZ;
                data.speedKmh = 12;
                state.avoidanceState = 'clear';
                state.blockedByVehicleId = null;
              } else {
                // PRIORIDADE DE DESOCUPAÇÃO: Se o obstáculo for caminhão aproximante ou em espera, o aproximante deve recuar
                const obstTruck = col.obstacleId ? truckMeshesRef.current.get(col.obstacleId) : null;
                if (obstTruck && (obstTruck.state.stage === 'APPROACH' || obstTruck.state.stage === 'WAITING_YARD')) {
                  obstTruck.mesh.position.z = Math.max(obstTruck.mesh.position.z, 18.5);
                  obstTruck.data.status = 'Cedendo Passagem (CTB Art. 29)';
                  obstTruck.data.loc = `Pátio Central · Cedendo via para saída de ${data.id}`;
                  obstTruck.state.avoidanceState = 'waiting';
                }

                data.speedKmh = 0;
                state.avoidanceState = 'waiting';
                state.blockedByVehicleId = col.obstacleId;
                data.status = 'Aguardando Pátio Livre';
                data.loc = `Doca 0${state.dockId} · Aguardando passagem de ${col.obstacleId}`;
                return;
              }
            } else {
              state.avoidanceState = 'clear';
              state.stage = 'EXITING_CD';
              data.routineStep = 10;
              data.routineStepName = 'Momento 10 · Saída Pelo Portão';
              const isLeft = state.exitDirection === 'left';
              data.loc = isLeft
                ? 'Pátio Central · Curva de Saída Oeste'
                : 'Pátio Central · Curva de Saída Leste';
              data.routineStepDesc = isLeft
                ? 'Curva suave para a saída oeste (Faixa Sul da rodovia)'
                : 'Curva para a saída leste (Faixa Sul da rodovia)';
              data.routineParameters = isLeft
                ? 'Pista Oeste | Faixa Sul | 42 km/h'
                : 'Pista Leste | Faixa Sul | 42 km/h';
            }
          }

          // MOMENTO 10 · Saída Pelo Portão (Acesso à Faixa Sul da rodovia z = 25.5 sem sobreposição)
          else if (state.stage === 'EXITING_CD') {
            const isLeftExit = state.exitDirection === 'left';
            const outboundZ = 25.5; // Faixa Sul da rodovia (separada da Faixa Norte z = 19.0)

            data.routineStep = 10;
            data.routineStepName = 'Momento 10 · Saída Pelo Portão';
            data.routineStepDesc = isLeftExit
              ? 'Saída suave pela esquerda da via (rumo oeste na Faixa Sul)'
              : 'Saída pela direita da via (rumo leste na Faixa Sul)';
            data.routineParameters = isLeftExit
              ? 'TRK-8821: Esquerda da Via | Faixa Sul z=25.5 | 42 km/h'
              : 'Pista Leste | Faixa Sul z=25.5 | 42 km/h';

            if (isLeftExit) {
              data.loc = 'Via Principal · Saída Oeste (Faixa Sul)';
              data.status = 'Em trânsito';

              if (mesh.position.z < outboundZ - 0.4) {
                // Curva diagonal suave para a esquerda em direção à Faixa Sul (z = 25.5)
                const forwardSpeed = 0.155 * currentSimSpeed;
                const targetAngle = Math.atan2(-1.25, 1.0); // ~ -51° para avançar em Z e X simultaneamente
                let diff = targetAngle - mesh.rotation.y;
                while (diff < -Math.PI) diff += Math.PI * 2;
                while (diff > Math.PI) diff -= Math.PI * 2;

                const maxTurn = forwardSpeed / TRUCK_MIN_TURN_RADIUS;
                const nextRotY = mesh.rotation.y + THREE.MathUtils.clamp(diff, -maxTurn, maxTurn);

                const nextZ = mesh.position.z + Math.cos(nextRotY) * forwardSpeed;
                const nextX = mesh.position.x + Math.sin(nextRotY) * forwardSpeed;

                const col = checkTruckCollision(data.id, nextX, nextZ, nextRotY, 0.40);
                if (!col.collides) {
                  mesh.rotation.y = nextRotY;
                  mesh.position.z = nextZ;
                  mesh.position.x = nextX;
                  data.speedKmh = 14;
                  state.avoidanceState = 'clear';
                } else {
                  data.speedKmh = 0;
                  state.avoidanceState = 'waiting';
                  state.blockedByVehicleId = col.obstacleId;
                  data.status = 'Aguardando Desobstrução';
                  data.loc = `Pátio Central · Curva Oeste (Aguardando liberação por ${col.obstacleId})`;
                  return;
                }
              } else {
                // Alinhamento final na Faixa Sul da rodovia (z = 25.5)
                const targetAngle = -Math.PI / 2;
                let diff = targetAngle - mesh.rotation.y;
                while (diff < -Math.PI) diff += Math.PI * 2;
                while (diff > Math.PI) diff -= Math.PI * 2;
                const nextRotY = mesh.rotation.y + THREE.MathUtils.clamp(diff, -0.065 * currentSimSpeed, 0.065 * currentSimSpeed);

                // Checagem rigorosa de Headway: identificar líder à nossa frente (oeste: other.x < mesh.x)
                let minHeadway = Infinity;
                let leaderId: string | null = null;
                truckMeshesRef.current.forEach((other) => {
                  if (
                    other.data.id !== data.id &&
                    other.mesh.visible &&
                    Math.abs(other.mesh.position.z - outboundZ) < 3.2 &&
                    other.mesh.position.x < mesh.position.x
                  ) {
                    const hDist = mesh.position.x - other.mesh.position.x;
                    if (hDist < minHeadway) {
                      minHeadway = hDist;
                      leaderId = other.data.id;
                    }
                  }
                });

                if (minHeadway < 7.5) {
                  // PARADA TOTAL / ESPERA: NUNCA INVADIR ENVELOPE FÍSICO DO LÍDER
                  data.speedKmh = 0;
                  state.avoidanceState = 'waiting';
                  state.blockedByVehicleId = leaderId;
                  data.status = 'Aguardando Distância Segura';
                  data.loc = `Via Principal · Parada de Segurança (Aguardando avanço de ${leaderId})`;
                  data.routineParameters = 'Parada Anticolisão | Distância < 7.5m | Radar Ativo';
                } else if (minHeadway < 13.5) {
                  // Controle Adaptativo de Velocidade
                  mesh.rotation.y = nextRotY;
                  data.speedKmh = 18;
                  state.avoidanceState = 'clear';
                  mesh.position.x -= 0.075 * currentSimSpeed;
                } else {
                  // Cruzeiro
                  mesh.rotation.y = nextRotY;
                  const cruiseSpeed = 0.170 * currentSimSpeed;
                  mesh.position.x -= cruiseSpeed;
                  data.speedKmh = 42;
                  state.avoidanceState = 'clear';
                }
                mesh.position.z += (outboundZ - mesh.position.z) * 0.15;

                // MOMENTO 11 · Conclusão de Missão (Portão oeste cruzado!)
                if (mesh.position.x <= -50.0) {
                  state.stage = 'MISSION_COMPLETED';
                  mesh.visible = false;
                  mesh.position.set(999, -100, 999);
                  data.status = 'Missão Concluída';
                  data.speedKmh = 0;
                  data.loc = 'Rodovia Exterior · Rumo ao Destino';
                  data.routineStep = 11;
                  data.routineStepName = 'Momento 11 · Conclusão de Missão';
                  data.routineStepDesc = 'Perímetro cruzado, doca liberada e ciclo finalizado';
                  data.routineParameters = 'Missão Concluída no WMS | Doca 100% Livre | Histórico Gravado';

                  dockUpdateCallbackRef.current?.(state.dockId, 'Disponível', 0, undefined);
                  activityLogCallbackRef.current?.(
                    'Rotina · Missão Concluída',
                    `${data.id}: Momento 11 alcançado. Ciclo finalizado e Doca 0${state.dockId} 100% liberada.`,
                    'truck',
                    'success'
                  );

                  // Intervalo antes da próxima escala para fluxo contínuo (~3-6s)
                  state.standbyTimer = 3.5 + Math.random() * 3.5;
                  state.stage = 'STANDBY_HIGHWAY';

                  if (statusCallbackRef.current) {
                    statusCallbackRef.current(data.id, 'Missão Concluída', 100, data.loc, 11, data.routineStepName, data.routineParameters);
                  }
                }
              }
            } else {
              // Saída pela direita da via (rumo leste na Faixa Sul z = 25.5)
              data.loc = 'Via Principal · Saída Leste (Faixa Sul)';
              data.status = 'Em trânsito';

              if (mesh.position.z < outboundZ - 0.4) {
                // Curva diagonal suave para a direita em direção à Faixa Sul (z = 25.5)
                const forwardSpeed = 0.155 * currentSimSpeed;
                const targetAngle = Math.atan2(1.25, 1.0); // ~ +51° para avançar em Z e X simultaneamente
                let diff = targetAngle - mesh.rotation.y;
                while (diff < -Math.PI) diff += Math.PI * 2;
                while (diff > Math.PI) diff -= Math.PI * 2;

                const maxTurn = forwardSpeed / TRUCK_MIN_TURN_RADIUS;
                const nextRotY = mesh.rotation.y + THREE.MathUtils.clamp(diff, -maxTurn, maxTurn);

                const nextZ = mesh.position.z + Math.cos(nextRotY) * forwardSpeed;
                const nextX = mesh.position.x + Math.sin(nextRotY) * forwardSpeed;

                const col = checkTruckCollision(data.id, nextX, nextZ, nextRotY, 0.40);
                if (!col.collides) {
                  mesh.rotation.y = nextRotY;
                  mesh.position.z = nextZ;
                  mesh.position.x = nextX;
                  data.speedKmh = 14;
                  state.avoidanceState = 'clear';
                } else {
                  data.speedKmh = 0;
                  state.avoidanceState = 'waiting';
                  state.blockedByVehicleId = col.obstacleId;
                  data.status = 'Aguardando Desobstrução';
                  data.loc = `Pátio Central · Curva Leste (Aguardando liberação por ${col.obstacleId})`;
                  return;
                }
              } else {
                const targetAngle = Math.PI / 2;
                let diff = targetAngle - mesh.rotation.y;
                while (diff < -Math.PI) diff += Math.PI * 2;
                while (diff > Math.PI) diff -= Math.PI * 2;
                const nextRotY = mesh.rotation.y + THREE.MathUtils.clamp(diff, -0.065 * currentSimSpeed, 0.065 * currentSimSpeed);

                // Checagem de Headway: líder à nossa frente (leste: other.x > mesh.x)
                let minHeadway = Infinity;
                let leaderId: string | null = null;
                truckMeshesRef.current.forEach((other) => {
                  if (
                    other.data.id !== data.id &&
                    other.mesh.visible &&
                    Math.abs(other.mesh.position.z - outboundZ) < 3.2 &&
                    other.mesh.position.x > mesh.position.x
                  ) {
                    const hDist = other.mesh.position.x - mesh.position.x;
                    if (hDist < minHeadway) {
                      minHeadway = hDist;
                      leaderId = other.data.id;
                    }
                  }
                });

                if (minHeadway < 7.5) {
                  // PARADA TOTAL / ESPERA: NUNCA INVADIR ENVELOPE DO LÍDER
                  data.speedKmh = 0;
                  state.avoidanceState = 'waiting';
                  state.blockedByVehicleId = leaderId;
                  data.status = 'Aguardando Distância Segura';
                  data.loc = `Via Principal · Parada de Segurança (Aguardando avanço de ${leaderId})`;
                  data.routineParameters = 'Parada Anticolisão | Distância < 7.5m | Radar Ativo';
                } else if (minHeadway < 13.5) {
                  data.speedKmh = 18;
                  state.avoidanceState = 'clear';
                  mesh.rotation.y = nextRotY;
                  mesh.position.x += 0.075 * currentSimSpeed;
                } else {
                  mesh.rotation.y = nextRotY;
                  const cruiseSpeed = 0.170 * currentSimSpeed;
                  mesh.position.x += cruiseSpeed;
                  data.speedKmh = 42;
                  state.avoidanceState = 'clear';
                }
                mesh.position.z += (outboundZ - mesh.position.z) * 0.15;

                if (mesh.position.x >= 50.0) {
                  state.stage = 'MISSION_COMPLETED';
                  mesh.visible = false;
                  mesh.position.set(999, -100, 999);
                  data.status = 'Missão Concluída';
                  data.speedKmh = 0;
                  data.loc = 'Rodovia Exterior · Rumo ao Destino';
                  data.routineStep = 11;
                  data.routineStepName = 'Momento 11 · Conclusão de Missão';
                  data.routineStepDesc = 'Perímetro cruzado, doca liberada e ciclo finalizado';
                  data.routineParameters = 'Missão Concluída no WMS | Doca 100% Livre | Histórico Gravado';

                  dockUpdateCallbackRef.current?.(state.dockId, 'Disponível', 0, undefined);
                  activityLogCallbackRef.current?.(
                    'Rotina · Missão Concluída',
                    `${data.id}: Momento 11 alcançado. Trajeto finalizado e saída registrada. Doca 0${state.dockId} liberada.`,
                    'truck',
                    'success'
                  );

                  state.standbyTimer = 3.5 + Math.random() * 3.5;
                  state.stage = 'STANDBY_HIGHWAY';

                  if (statusCallbackRef.current) {
                    statusCallbackRef.current(data.id, 'Missão Concluída', 100, data.loc, 11, data.routineStepName, data.routineParameters);
                  }
                }
              }
            }
          }

          // Atualização Visual Dinâmica do Sensor LiDAR 3D Anticolisão
          const lidarGroup = mesh.getObjectByName('lidar-scanner-group');
          if (lidarGroup) {
            const radarMesh = lidarGroup.getObjectByName('radar-cone-mesh') as THREE.Mesh;
            const safetyRing = lidarGroup.getObjectByName('safety-envelope-ring') as THREE.Mesh;

            if (radarMesh && radarMesh.material) {
              const mat = radarMesh.material as THREE.MeshBasicMaterial;
              if (state.avoidanceState === 'waiting') {
                mat.color.setHex(0xf59e0b); // Âmbar: Parada de Segurança
                mat.opacity = 0.60;
              } else if (state.avoidanceState === 'detouring') {
                mat.color.setHex(0xa855f7); // Roxo: Desvio de Rota Ativo
                mat.opacity = 0.70;
              } else {
                mat.color.setHex(0x06b6d4); // Ciano: Operação normal
                mat.opacity = 0.22;
              }
            }

            if (safetyRing && safetyRing.material) {
              const mat = safetyRing.material as THREE.MeshBasicMaterial;
              if (state.avoidanceState === 'waiting') {
                mat.color.setHex(0xef4444); // Vermelho de Alerta
                mat.opacity = 0.70;
              } else if (state.avoidanceState === 'detouring') {
                mat.color.setHex(0xa855f7); // Roxo de Desvio
                mat.opacity = 0.65;
              } else {
                mat.color.setHex(0x10b981); // Verde Esmeralda seguro
                mat.opacity = 0.35;
              }
            }
          }

          // Rotação física realista das rodas do caminhão ao se movimentar
          if (data.speedKmh > 0) {
            const wheelsGroup = mesh.getObjectByName('truck-wheels-group');
            if (wheelsGroup) {
              const rollDirection = (state.stage === 'REVERSING') ? -1 : 1;
              const rollAngle = rollDirection * (data.speedKmh * 0.0075) * currentSimSpeed;
              wheelsGroup.children.forEach((w) => {
                const tire = w.getObjectByName('tire-roller');
                if (tire) tire.rotation.x += rollAngle;
              });
            }
          }
        });
}
