import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Vehicle, CameraPreset, VehicleStatus } from '../../types/warehouse';
import {
  createDetailedTruck,
  createDetailedForklift,
  createDetailedAGV,
  createWarehouseEnvironment,
} from './models';
import { soundManager } from '../../utils/audio';
import { TrafficManager } from '../../utils/trafficManager';
import { ShieldAlert, Radio, Truck, RefreshCw } from 'lucide-react';

interface WarehouseCanvasProps {
  vehicles: Vehicle[];
  selectedVehicleId: string | null;
  onSelectVehicle: (vehicle: Vehicle) => void;
  isNightMode: boolean;
  simSpeed: number; // 0 (pause), 1, 2, 5
  cameraPreset: CameraPreset;
  onVehicleStatusChange?: (
    id: string,
    status: VehicleStatus,
    progress: number,
    loc: string,
    routineStep?: number,
    routineStepName?: string,
    routineParameters?: string
  ) => void;
  onActivityLog?: (title: string, description: string, type: 'truck' | 'forklift' | 'agv' | 'dock', severity?: 'info' | 'success' | 'warning') => void;
  onDockUpdate?: (dockId: number, status: 'Disponível' | 'Em Carga' | 'Em Descarga', progress: number, truckId?: string) => void;
}

type TruckOperation = 'UNLOAD' | 'LOAD';

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

interface TruckMissionState {
  operation: TruckOperation;
  dockId: number;
  dockX: number;
  cargoName: string;
  stage: TruckSimStage;
  targetZ: number;
  operatingTimer: number;
  progressPercent: number;
  exitDirection?: 'left' | 'right';
  dwellTimer: number;
  standbyTimer: number;
  beepTimer: number;
  randomEventName?: string;
  randomEventTriggered: boolean;
  totalPallets: number;
  entryGateSide: 'east' | 'west';
  // Anti-colisão 3D: Desvio de Rota & Lógica de Espera
  detourActive?: boolean;
  detourTarget?: { x: number; z: number };
  detourDirection?: 'left' | 'right';
  detourTimer?: number;
  avoidanceState?: 'clear' | 'waiting' | 'detouring';
  blockedByVehicleId?: string | null;
}

interface ForkliftMissionState {
  assignedDockId: number;
  dockX: number;
  rackX: number;
  rackZ: number;
  stage: 'IDLE' | 'TO_TRUCK' | 'LIFTING' | 'TO_RACK' | 'STORING' | 'RETURN_EMPTY' | 'PARKED';
  hasPallet: boolean;
  actionTimer: number;
  tripCounter: number;
}

interface AGVMissionState {
  waypoints: { x: number; z: number }[];
  currentWpIdx: number;
  pauseTimer: number;
  loopName: string;
  randomSafetyTimer: number;
}

const RANDOM_TRUCK_EVENTS = [
  'Inspeção Amostral de Qualidade (CQ pelo Fiscal do CD)',
  'Termografia & Checagem de Cadeia de Frio',
  'Conferência de Romaneio Digital e Lacre WMS',
  'Ajuste de Paleteira Hidráulica na Carroceria',
  'Amostragem Fitossanitária & Registro de Lote',
];

const CARGO_CATALOG = [
  'Painéis LED 4K UHD 55"',
  'Baterias Modulares Li-Ion 48V',
  'Microcontroladores ARM Cortex-M7',
  'Sensores Ópticos LiDAR 3D 360°',
  'Chassis Metálicos Reforçados R-30',
  'Caixas de Cartão Canelado 60x40',
  'Servomotores Industriais Brushless',
  'Lubrificante Sintético Industrial',
];

const DOCK_X_COORDS = [-16.5, -5.5, 5.5, 16.5]; // Doca 1, 2, 3, 4

export const WarehouseCanvas: React.FC<WarehouseCanvasProps> = ({
  vehicles,
  selectedVehicleId,
  onSelectVehicle,
  isNightMode,
  simSpeed,
  cameraPreset,
  onVehicleStatusChange,
  onActivityLog,
  onDockUpdate,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.OrthographicCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const trafficManagerRef = useRef<TrafficManager>(new TrafficManager());
  const statusCallbackRef = useRef(onVehicleStatusChange);
  statusCallbackRef.current = onVehicleStatusChange;
  const activityLogCallbackRef = useRef(onActivityLog);
  activityLogCallbackRef.current = onActivityLog;
  const dockUpdateCallbackRef = useRef(onDockUpdate);
  dockUpdateCallbackRef.current = onDockUpdate;
  const onSelectVehicleRef = useRef(onSelectVehicle);
  onSelectVehicleRef.current = onSelectVehicle;
  const initializedVehiclesRef = useRef(false);

  // Meshes & Mission controllers
  const truckMeshesRef = useRef<Map<string, { mesh: THREE.Group; data: Vehicle; state: TruckMissionState }>>(new Map());
  const forkliftMeshesRef = useRef<Map<string, { mesh: THREE.Group; data: Vehicle; state: ForkliftMissionState }>>(new Map());
  const agvMeshesRef = useRef<Map<string, { mesh: THREE.Group; data: Vehicle; state: AGVMissionState }>>(new Map());
  const hoveredVehicleRef = useRef<THREE.Group | null>(null);

  const [hoveredVehicleName, setHoveredVehicleName] = useState<string | null>(null);
  const [showLidarFields, setShowLidarFields] = useState<boolean>(true);

  // Initialize Three.js scene
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const bgDay = new THREE.Color(0xf1f5f9);
    scene.background = bgDay;
    scene.fog = new THREE.FogExp2(0xf1f5f9, 0.006);

    // 2. Camera (Isometric Orthographic adapted for mobile portrait & widescreen)
    const aspect = container.clientWidth / container.clientHeight;
    const frustumSize = aspect < 1 ? Math.min(110, 62 / (aspect * 1.15)) : 62;
    const camera = new THREE.OrthographicCamera(
      (-frustumSize * aspect) / 2,
      (frustumSize * aspect) / 2,
      frustumSize / 2,
      -frustumSize / 2,
      1,
      1000
    );
    camera.position.set(48, 48, 48);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;
    container.replaceChildren(renderer.domElement);

    // 4. OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.maxPolarAngle = Math.PI / 2 - 0.05; // Do not go underground
    controls.minZoom = 0.4;
    controls.maxZoom = 2.8;
    controlsRef.current = controls;

    // 5. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.78);
    ambientLight.name = 'ambient-light';
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfffbeb, 1.15);
    sunLight.name = 'sun-light';
    sunLight.position.set(45, 80, 40);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 160;
    const d = 52;
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;
    sunLight.shadow.bias = -0.0005;
    scene.add(sunLight);

    const warehouseLight = new THREE.PointLight(0x93c5fd, 0.6, 60);
    warehouseLight.position.set(0, 10, -18);
    scene.add(warehouseLight);

    const yardFloodLight = new THREE.PointLight(0xffedd5, 0.25, 80);
    yardFloodLight.name = 'yard-flood';
    yardFloodLight.position.set(0, 15, 25);
    scene.add(yardFloodLight);

    // 6. Environment
    const warehouseEnv = createWarehouseEnvironment();
    scene.add(warehouseEnv);

    // 7. Raycasting
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const getIntersectedVehicle = (clientX: number, clientY: number): THREE.Group | null => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);

      const intersects = raycaster.intersectObjects(scene.children, true);
      for (const hit of intersects) {
        let curr: THREE.Object3D | null = hit.object;
        while (curr && curr !== scene) {
          if (curr.userData && (curr.userData.isInteractive || curr.userData.id)) {
            return curr as THREE.Group;
          }
          curr = curr.parent;
        }
      }
      return null;
    };

    const handlePointerMove = (e: MouseEvent) => {
      const found = getIntersectedVehicle(e.clientX, e.clientY);
      if (found) {
        container.style.cursor = 'pointer';
        setHoveredVehicleName(found.userData.name || found.userData.id);
        if (hoveredVehicleRef.current !== found) {
          if (hoveredVehicleRef.current) {
            const oldRing = hoveredVehicleRef.current.getObjectByName('selection-ring') as THREE.Mesh;
            if (oldRing && hoveredVehicleRef.current.userData.id !== selectedVehicleId) {
              (oldRing.material as THREE.MeshBasicMaterial).opacity = 0;
            }
          }
          hoveredVehicleRef.current = found;
          const ring = found.getObjectByName('selection-ring') as THREE.Mesh;
          if (ring) {
            (ring.material as THREE.MeshBasicMaterial).opacity = 0.6;
          }
        }
      } else {
        container.style.cursor = 'default';
        setHoveredVehicleName(null);
        if (hoveredVehicleRef.current) {
          if (hoveredVehicleRef.current.userData.id !== selectedVehicleId) {
            const oldRing = hoveredVehicleRef.current.getObjectByName('selection-ring') as THREE.Mesh;
            if (oldRing) {
              (oldRing.material as THREE.MeshBasicMaterial).opacity = 0;
            }
          }
          hoveredVehicleRef.current = null;
        }
      }
    };

    const handleClick = (e: MouseEvent) => {
      const found = getIntersectedVehicle(e.clientX, e.clientY);
      if (found && found.userData) {
        soundManager.playClick();
        const vId = found.userData.id;
        // Obter os dados dinâmicos mais recentes do loop da simulação
        const liveTruck = truckMeshesRef.current.get(vId)?.data;
        const liveForklift = forkliftMeshesRef.current.get(vId)?.data;
        const liveAgv = agvMeshesRef.current.get(vId)?.data;
        const selectedData = liveTruck || liveForklift || liveAgv || (found.userData as Vehicle);
        onSelectVehicleRef.current?.(selectedData);
      }
    };

    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      const newAspect = w / h;
      const currentFrustum = newAspect < 1 ? Math.min(110, 62 / (newAspect * 1.15)) : 62;
      camera.left = (-currentFrustum * newAspect) / 2;
      camera.right = (currentFrustum * newAspect) / 2;
      camera.top = currentFrustum / 2;
      camera.bottom = -currentFrustum / 2;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);
    renderer.domElement.addEventListener('pointermove', handlePointerMove);
    renderer.domElement.addEventListener('click', handleClick);

    // 8. Main Industrial Logistics Simulation Loop
    let animId = 0;
    const animate = () => {
      animId = requestAnimationFrame(animate);

      const currentSimSpeed = (containerRef.current as unknown as { simSpeedVal?: number })?.simSpeedVal ?? 1;

      if (currentSimSpeed > 0) {
        // Position collector for collision avoidance & monitoring
        const allPositions: { id: string; x: number; z: number }[] = [];
        truckMeshesRef.current.forEach((t) => {
          allPositions.push({ id: t.data.id, x: t.mesh.position.x, z: t.mesh.position.z });
        });
        forkliftMeshesRef.current.forEach((f) => {
          allPositions.push({ id: f.data.id, x: f.mesh.position.x, z: f.mesh.position.z });
        });
        agvMeshesRef.current.forEach((a) => {
          allPositions.push({ id: a.data.id, x: a.mesh.position.x, z: a.mesh.position.z });
        });

        // =========================================================================
        // Helper: Detecção Física de Sobreposição / Colisão Entre Caminhões
        // Modela cada caminhão com 4 discos ao longo da carroceria (10.5m x 2.65m)
        // Raio: 1.45m em cada ponto -> envelope físico contínuo sem frestas
        // =========================================================================
        const getTruckDiscs = (x: number, z: number, rotY: number) => {
          const sin = Math.sin(rotY);
          const cos = Math.cos(rotY);
          return [
            { x: x + 3.75 * sin, z: z + 3.75 * cos, r: 1.45 }, // Cabine frontal e para-choque
            { x: x + 1.25 * sin, z: z + 1.25 * cos, r: 1.45 }, // Chassi dianteiro
            { x: x - 1.25 * sin, z: z - 1.25 * cos, r: 1.45 }, // Centro do baú
            { x: x - 3.75 * sin, z: z - 3.75 * cos, r: 1.45 }, // Traseira do baú e portas
          ];
        };

        // Snapshot dos caminhões ativos no frame atual para anticolisão física
        const activeTruckSnapshots: {
          id: string;
          x: number;
          z: number;
          rotY: number;
          stage: TruckSimStage;
          visible: boolean;
        }[] = [];

        truckMeshesRef.current.forEach((t) => {
          if (
            t.mesh.visible &&
            t.state.stage !== 'STANDBY_HIGHWAY' &&
            t.state.stage !== 'MISSION_COMPLETED'
          ) {
            activeTruckSnapshots.push({
              id: t.data.id,
              x: t.mesh.position.x,
              z: t.mesh.position.z,
              rotY: t.mesh.rotation.y,
              stage: t.state.stage,
              visible: t.mesh.visible,
            });
          }
        });

        const checkTruckCollision = (
          selfId: string,
          candX: number,
          candZ: number,
          candRotY: number,
          safetyBuffer = 0.85
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

          for (const other of activeTruckSnapshots) {
            if (other.id === selfId) continue;
            // Distância euclidiana rápida entre os centros de massa
            const dx = other.x - candX;
            const dz = other.z - candZ;
            const centerDist = Math.hypot(dx, dz);
            if (centerDist > 16.0) continue; // Totalmente seguro, fora da zona crítica

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
                // Verificação física estrita: soma dos raios + margem de segurança
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
            hazard: closestDist < 4.8,
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
                // T1 está aproximando ou esperando: recuar para a linha de espera segura (z = 17.5) para liberar T2
                if (t1.mesh.position.z < 17.5) {
                  t1.mesh.position.z += 0.08 * currentSimSpeed;
                }
                t1.data.status = 'Cedendo Passagem';
                t1.data.loc = `Pátio Central · Cedendo via para saída de ${t2.data.id}`;
              } else if (isT1Departing && !isT2Departing) {
                // T1 está partindo: T2 deve dar passagem
                if (t2.mesh.position.z < 17.5) {
                  t2.mesh.position.z += 0.08 * currentSimSpeed;
                }
                t2.data.status = 'Cedendo Passagem';
                t2.data.loc = `Pátio Central · Cedendo via para saída de ${t1.data.id}`;
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
                  !(t.state.stage === 'EXITING_CD' && t.mesh.position.z >= 22.0)
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
              const arriveSide: 'east' | 'west' = Math.random() > 0.5 ? 'east' : 'west';
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
              state.exitDirection = chosenDock <= 2 ? 'left' : 'right';

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
                // Verificar se a área do pátio para entrar está desobstruída
                const col = checkTruckCollision(data.id, 0, 16.5, 0, 0.90);
                if (!col.collides) {
                  state.stage = 'APPROACH';
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

          // MOMENTO 3 · Aproximação & Pátio (Trânsito ágil pelo pátio central com Desvio de Rota & Espera)
          else if (state.stage === 'APPROACH') {
            data.routineStep = 3;
            data.routineStepName = 'Momento 3 · Aproximação & Pátio';
            data.routineStepDesc = `Deslocamento pelo pátio central em direção à Doca 0${state.dockId}`;
            data.routineParameters = 'Velocidade no Pátio: 32 km/h | Radar Anticolisão Ativo | Desvio Dinâmico';

            // Verificar se outro caminhão já está atracado ou manobrando na mesma doca
            let dockOccupied = false;
            truckMeshesRef.current.forEach((other) => {
              if (
                other.data.id !== data.id &&
                other.state.dockId === state.dockId &&
                other.state.stage !== 'STANDBY_HIGHWAY' &&
                other.state.stage !== 'MISSION_COMPLETED' &&
                !(other.state.stage === 'EXITING_CD' && other.mesh.position.z >= 22.0)
              ) {
                dockOccupied = true;
              }
              // Se houver qualquer caminhão ativamente partindo ou manobrando em frente a esta doca (área de apron)
              if (
                other.data.id !== data.id &&
                other.mesh.visible &&
                (other.state.stage === 'DEPARTING' ||
                  other.state.stage === 'ALIGN_REVERSE' ||
                  other.state.stage === 'REVERSING') &&
                Math.abs(other.mesh.position.x - state.dockX) < 7.5 &&
                other.mesh.position.z < 16.5
              ) {
                dockOccupied = true;
              }
            });

            if (dockOccupied) {
              state.detourActive = false;
              state.stage = 'WAITING_YARD';
              data.status = 'Aguardando Doca Livre';
              data.loc = `Pátio de Espera (Aguardando liberação da Doca 0${state.dockId})`;
              return;
            }

            const primaryGoalX = state.dockX;
            const primaryGoalZ = 14.0;

            // Se um desvio de rota evasivo estiver em andamento:
            if (state.detourActive && state.detourTarget) {
              state.detourTimer = (state.detourTimer ?? 4.0) - 0.045 * currentSimSpeed;
              const dtx = state.detourTarget.x - mesh.position.x;
              const dtz = state.detourTarget.z - mesh.position.z;
              const detourDist = Math.hypot(dtx, dtz);

              // Concluir o desvio caso o waypoint tenha sido alcançado ou tempo expirado
              if (detourDist < 0.65 || state.detourTimer <= 0) {
                const checkDirect = checkTruckCollision(
                  data.id,
                  mesh.position.x,
                  mesh.position.z,
                  Math.atan2(primaryGoalX - mesh.position.x, primaryGoalZ - mesh.position.z),
                  0.90
                );
                if (!checkDirect.collides) {
                  state.detourActive = false;
                  state.detourTarget = undefined;
                  state.avoidanceState = 'clear';
                  state.blockedByVehicleId = null;
                }
              } else {
                // Navegação guiada pelo waypoint de desvio de rota
                const detourAngle = Math.atan2(dtx, dtz);
                let diff = detourAngle - mesh.rotation.y;
                while (diff < -Math.PI) diff += Math.PI * 2;
                while (diff > Math.PI) diff -= Math.PI * 2;
                const maxTurn = 0.065 * currentSimSpeed;
                const nextRotY = mesh.rotation.y + THREE.MathUtils.clamp(diff, -maxTurn, maxTurn);

                const step = Math.min(detourDist, 0.135 * currentSimSpeed);
                const nextX = mesh.position.x + (dtx / detourDist) * step;
                const nextZ = mesh.position.z + (dtz / detourDist) * step;

                const stepCol = checkTruckCollision(data.id, nextX, nextZ, nextRotY, 0.85);
                if (!stepCol.collides) {
                  mesh.rotation.y = nextRotY;
                  mesh.position.x = nextX;
                  mesh.position.z = nextZ;
                  data.speedKmh = 22;
                  data.status = 'Desvio de Rota';
                  state.avoidanceState = 'detouring';
                  data.loc = `Pátio Central · Desvio Lateral Anticolisão (${state.detourDirection === 'right' ? 'Direita' : 'Esquerda'})`;
                  data.routineStepDesc = `Executando desvio de rota planejado (${state.detourDirection === 'right' ? 'à direita' : 'à esquerda'})`;
                  data.routineParameters = 'Radar LiDAR 360° | Desvio Dinâmico de Rota | 22 km/h';
                  return;
                } else {
                  // Se o próprio desvio encontrar bloqueio: LÓGICA DE ESPERA
                  data.speedKmh = 0;
                  state.avoidanceState = 'waiting';
                  state.blockedByVehicleId = stepCol.obstacleId;
                  data.status = 'Aguardando Desvio';
                  data.loc = `Pátio Central · Parada no Desvio (Cedendo passagem a ${stepCol.obstacleId})`;
                  data.routineParameters = 'Parada Preventiva | Distância de Segurança Garantida';
                  return;
                }
              }
            }

            // Movimento normal rumo à doca
            const dx = primaryGoalX - mesh.position.x;
            const dz = primaryGoalZ - mesh.position.z;
            const dist = Math.sqrt(dx * dx + dz * dz);

            if (dist > 0.35) {
              const targetAngle = Math.atan2(dx, dz);
              let diff = targetAngle - mesh.rotation.y;
              while (diff < -Math.PI) diff += Math.PI * 2;
              while (diff > Math.PI) diff -= Math.PI * 2;
              const maxTurn = 0.055 * currentSimSpeed;
              const nextRotY = mesh.rotation.y + THREE.MathUtils.clamp(diff, -maxTurn, maxTurn);

              const step = Math.min(dist, 0.145 * currentSimSpeed);
              const nextX = mesh.position.x + (dx / dist) * step;
              const nextZ = mesh.position.z + (dz / dist) * step;

              // Verificação física estrita de colisão antes do movimento
              const col = checkTruckCollision(data.id, nextX, nextZ, nextRotY, 0.90);
              if (col.collides) {
                // COLISÃO PRESTES A OCORRER: Avaliar Desvio de Rota
                const detourPlan = evaluateRouteDetour(
                  data.id,
                  mesh.position.x,
                  mesh.position.z,
                  mesh.rotation.y,
                  primaryGoalX,
                  primaryGoalZ
                );

                if (detourPlan.canDetour && detourPlan.chosenWaypoint) {
                  // DESVIO DE ROTA ATIVADO COM SUCESSO!
                  state.detourActive = true;
                  state.detourTarget = detourPlan.chosenWaypoint;
                  state.detourDirection = detourPlan.direction;
                  state.detourTimer = 4.5;
                  state.avoidanceState = 'detouring';
                  state.blockedByVehicleId = col.obstacleId;

                  data.speedKmh = 22;
                  data.status = 'Desvio de Rota';
                  data.loc = `Pátio Central · Desvio Lateral Anticolisão (${detourPlan.direction === 'right' ? 'Direita' : 'Esquerda'} de ${col.obstacleId})`;
                  data.routineStepDesc = `Manobra evasiva ativa: desvio à ${detourPlan.direction === 'right' ? 'direita' : 'esquerda'} para contornar ${col.obstacleId}`;
                  data.routineParameters = 'Radar LiDAR 360° | Desvio de Rota em Execução | 22 km/h';

                  activityLogCallbackRef.current?.(
                    'Anticolisão · Desvio de Rota',
                    `${data.id}: Rota desviada à ${detourPlan.direction === 'right' ? 'direita' : 'esquerda'} para contornar ${col.obstacleId}.`,
                    'truck',
                    'warning'
                  );
                  return;
                }

                // Se desvio lateral não for seguro (espaço estreito): LÓGICA DE ESPERA
                data.speedKmh = 0;
                state.avoidanceState = 'waiting';
                state.blockedByVehicleId = col.obstacleId;
                data.status = 'Aguardando Passagem';
                data.loc = `Pátio Central · Parada de Segurança (Cedendo passagem a ${col.obstacleId})`;
                data.routineStepDesc = `Parada preventiva anticolisão: aguardando liberação por ${col.obstacleId}`;
                data.routineParameters = 'Freio de Segurança Ativo | Distância Monitorada | Radar Ativo';
                return;
              }

              // Rota desobstruída: avançar normalmente
              state.avoidanceState = 'clear';
              state.blockedByVehicleId = null;
              mesh.rotation.y = nextRotY;
              mesh.position.x = nextX;
              mesh.position.z = nextZ;
              data.speedKmh = 32;
              data.status = 'Aproximação Pátio';
              data.loc = `Pátio Central · Rumo à Doca 0${state.dockId}`;
            } else {
              state.detourActive = false;
              state.avoidanceState = 'clear';
              state.stage = 'ALIGN_REVERSE';
              data.status = 'A acoplar (Ré)';
              data.loc = `Em frente à Doca 0${state.dockId} (Alinhamento de Ré)`;
              if (statusCallbackRef.current) {
                statusCallbackRef.current(data.id, 'A acoplar (Ré)', 5, data.loc, 4, 'Momento 4 · Alinhamento & Ré', 'Aviso Sonoro Ativo | Alinhamento 0°');
              }
            }
          }

          // MOMENTO 3b · Espera no Pátio (Área de Staging individual em frente à doca)
          else if (state.stage === 'WAITING_YARD') {
            data.routineStep = 3;
            data.routineStepName = 'Momento 3b · Espera no Pátio';
            data.routineStepDesc = `Aguardando desocupação da Doca 0${state.dockId}`;
            data.routineParameters = 'Holding Bay Ativo | Motor em Ponto Morto | Sensor Ativo';

            // Posição de espera individual em frente à doca correspondente (evita sobreposição)
            const holdX = state.dockX;
            const holdZ = 17.5;
            const dx = holdX - mesh.position.x;
            const dz = holdZ - mesh.position.z;
            const dist = Math.sqrt(dx * dx + dz * dz);

            if (dist > 0.4) {
              const step = Math.min(dist, 0.115 * currentSimSpeed);
              const nextX = mesh.position.x + (dx / dist) * step;
              const nextZ = mesh.position.z + (dz / dist) * step;
              const col = checkTruckCollision(data.id, nextX, nextZ, mesh.rotation.y, 0.85);
              if (!col.collides) {
                mesh.position.x = nextX;
                mesh.position.z = nextZ;
                data.speedKmh = 22;
                state.avoidanceState = 'clear';
                state.blockedByVehicleId = null;
              } else {
                data.speedKmh = 0;
                state.avoidanceState = 'waiting';
                state.blockedByVehicleId = col.obstacleId;
              }
            } else {
              data.speedKmh = 0;
              state.avoidanceState = 'waiting';
            }
            data.status = 'Aguardando Doca';
            data.loc = `Pátio de Espera (Aguardando liberação da Doca 0${state.dockId})`;

            let stillOccupied = false;
            truckMeshesRef.current.forEach((other) => {
              if (
                other.data.id !== data.id &&
                other.state.dockId === state.dockId &&
                other.state.stage !== 'STANDBY_HIGHWAY' &&
                other.state.stage !== 'MISSION_COMPLETED' &&
                !(other.state.stage === 'EXITING_CD' && other.mesh.position.z >= 22.0)
              ) {
                stillOccupied = true;
              }
              // Se outro caminhão estiver ativamente partindo ou manobrando em frente a esta doca
              if (
                other.data.id !== data.id &&
                other.mesh.visible &&
                (other.state.stage === 'DEPARTING' ||
                  other.state.stage === 'ALIGN_REVERSE' ||
                  other.state.stage === 'REVERSING') &&
                Math.abs(other.mesh.position.x - state.dockX) < 7.5 &&
                other.mesh.position.z < 16.5
              ) {
                stillOccupied = true;
              }
            });

            if (!stillOccupied) {
              state.stage = 'APPROACH';
            }
          }

          // MOMENTO 4 · Alinhamento de Ré (Posicionamento frontal e aviso sonoro)
          else if (state.stage === 'ALIGN_REVERSE') {
            data.routineStep = 4;
            data.routineStepName = 'Momento 4 · Alinhamento & Ré';
            data.routineStepDesc = 'Alinhamento angular 0° e preparação para engate de ré';
            data.routineParameters = 'Sinal Sonoro Ativo | Velocidade Ré: 14 km/h | Alinhamento 0°';

            const desiredRotY = 0;
            let diff = desiredRotY - mesh.rotation.y;
            while (diff < -Math.PI) diff += Math.PI * 2;
            while (diff > Math.PI) diff -= Math.PI * 2;

            if (Math.abs(diff) > 0.03) {
              const maxAlignTurn = 0.065 * currentSimSpeed;
              mesh.rotation.y += THREE.MathUtils.clamp(diff, -maxAlignTurn, maxAlignTurn);
            } else {
              mesh.rotation.y = desiredRotY;
              state.stage = 'REVERSING';
              state.targetZ = 2.4;
              state.beepTimer = 0;
              soundManager.playBeep();
            }
          }

          // MOMENTO 4b · Manobra de Marcha à Ré (Recuo acelerado com sinalização sonora)
          else if (state.stage === 'REVERSING') {
            data.routineStep = 4;
            data.routineStepName = 'Momento 4 · Manobra de Ré';
            data.routineStepDesc = `Recuo guiado até o batente da Doca 0${state.dockId}`;
            data.routineParameters = 'Sinal Sonoro Intermitente | Velocidade: 14 km/h | Batente de Borracha';

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
              data.loc = `Doca 0${state.dockId} (Manobra de Ré com Sinal Sonoro)`;
              data.speedKmh = 14;

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
              data.loc = `Doca 0${state.dockId} (Calçamento & NFe)`;
              data.speedKmh = 0;
              data.routineStep = 5;
              data.routineStepName = 'Momento 5 · Acoplamento & Vistoria';
              data.routineStepDesc = 'Travamento de calços de roda e abertura de portas';
              data.routineParameters = 'Calços Engatados | Vedação Inflada | NFe Validada';

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
              state.exitDirection = state.dockId <= 2 ? 'left' : 'right';
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
            data.routineParameters = 'Desengate Concluído | Avanço Frontal | Velocidade: 25 km/h';

            const forwardYardZ = 14.8;
            if (mesh.position.z < forwardYardZ) {
              const forwardSpeed = 0.135 * currentSimSpeed;
              const nextZ = mesh.position.z + forwardSpeed;
              const col = checkTruckCollision(data.id, mesh.position.x, nextZ, mesh.rotation.y, 0.85);
              if (!col.collides) {
                mesh.position.z = nextZ;
                data.speedKmh = 25;
                state.avoidanceState = 'clear';
                state.blockedByVehicleId = null;
              } else {
                // PRIORIDADE DE DESOCUPAÇÃO: Se o obstáculo for caminhão aproximante ou em espera, o aproximante deve recuar
                const obstTruck = col.obstacleId ? truckMeshesRef.current.get(col.obstacleId) : null;
                if (obstTruck && (obstTruck.state.stage === 'APPROACH' || obstTruck.state.stage === 'WAITING_YARD')) {
                  obstTruck.mesh.position.z = Math.max(obstTruck.mesh.position.z, 17.5);
                  obstTruck.data.status = 'Cedendo Passagem';
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

                const maxTurn = 0.055 * currentSimSpeed;
                const nextRotY = mesh.rotation.y + THREE.MathUtils.clamp(diff, -maxTurn, maxTurn);

                const nextZ = mesh.position.z + Math.cos(nextRotY) * forwardSpeed;
                const nextX = mesh.position.x + Math.sin(nextRotY) * forwardSpeed;

                const col = checkTruckCollision(data.id, nextX, nextZ, nextRotY, 0.85);
                if (!col.collides) {
                  mesh.rotation.y = nextRotY;
                  mesh.position.z = nextZ;
                  mesh.position.x = nextX;
                  data.speedKmh = 30;
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
                mesh.rotation.y += THREE.MathUtils.clamp(diff, -0.065 * currentSimSpeed, 0.065 * currentSimSpeed);

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
                  data.speedKmh = 18;
                  state.avoidanceState = 'clear';
                  mesh.position.x -= 0.075 * currentSimSpeed;
                } else {
                  // Cruzeiro
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

                const maxTurn = 0.055 * currentSimSpeed;
                const nextRotY = mesh.rotation.y + THREE.MathUtils.clamp(diff, -maxTurn, maxTurn);

                const nextZ = mesh.position.z + Math.cos(nextRotY) * forwardSpeed;
                const nextX = mesh.position.x + Math.sin(nextRotY) * forwardSpeed;

                const col = checkTruckCollision(data.id, nextX, nextZ, nextRotY, 0.85);
                if (!col.collides) {
                  mesh.rotation.y = nextRotY;
                  mesh.position.z = nextZ;
                  mesh.position.x = nextX;
                  data.speedKmh = 30;
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
                mesh.rotation.y += THREE.MathUtils.clamp(diff, -0.065 * currentSimSpeed, 0.065 * currentSimSpeed);

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
                  mesh.position.x += 0.075 * currentSimSpeed;
                } else {
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

        // =========================================================================
        // B. SIMULAÇÃO ACELERADA DAS EMPILHADEIRAS (Transbordo Ágil de Paletes)
        // =========================================================================
        forkliftMeshesRef.current.forEach(({ mesh, data, state }) => {
          // Velocidade acelerada da empilhadeira
          const speed = 0.135 * currentSimSpeed;
          const palletMesh = mesh.getObjectByName('forklift-cargo-pallet') || mesh.getObjectByName('agv-payload');

          let activeTruck: { data: Vehicle; state: TruckMissionState } | null = null;
          truckMeshesRef.current.forEach((t) => {
            const isAssigned = (state.assignedDockId === 1 && (t.state.dockId === 1 || t.state.dockId === 2)) ||
                               (state.assignedDockId === 3 && (t.state.dockId === 3 || t.state.dockId === 4));
            if (isAssigned && ['DOCKED_OPERATING', 'DOCKED_RANDOM_EVENT'].includes(t.state.stage)) {
              activeTruck = t;
            }
          });

          if (activeTruck) {
            const targetTruck = activeTruck as unknown as { data: Vehicle; state: TruckMissionState };
            const dockInsidePos = { x: targetTruck.state.dockX, z: -3.6 };
            const rackInsidePos = { x: state.rackX, z: state.rackZ };

            if (state.stage === 'IDLE' || state.stage === 'PARKED' || state.stage === 'RETURN_EMPTY') {
              const dx = dockInsidePos.x - mesh.position.x;
              const dz = dockInsidePos.z - mesh.position.z;
              const dist = Math.sqrt(dx * dx + dz * dz);

              if (dist > 0.25) {
                const targetAngle = Math.atan2(dx, dz);
                let diff = targetAngle - mesh.rotation.y;
                while (diff < -Math.PI) diff += Math.PI * 2;
                while (diff > Math.PI) diff -= Math.PI * 2;
                mesh.rotation.y += diff * 0.35 * currentSimSpeed;

                mesh.position.x += (dx / dist) * Math.min(dist, speed);
                mesh.position.z += (dz / dist) * Math.min(dist, speed);
                data.status = 'A transportar';
                data.loc = `A caminho da Doca 0${targetTruck.state.dockId} (Coleta)`;
                data.speedKmh = 18;
                if (palletMesh) palletMesh.visible = false;
              } else {
                state.stage = 'LIFTING';
                state.actionTimer = 0.5; // Coleta rápida
                data.status = 'A carregar';
                data.loc = `Doca 0${targetTruck.state.dockId} (Coleta e Pesagem de Palete)`;
                data.speedKmh = 0;
              }
            } else if (state.stage === 'LIFTING') {
              state.actionTimer -= 0.045 * currentSimSpeed;
              if (palletMesh) palletMesh.visible = true;
              if (state.actionTimer <= 0) {
                state.stage = 'TO_RACK';
                state.hasPallet = true;
              }
            } else if (state.stage === 'TO_RACK') {
              const dx = rackInsidePos.x - mesh.position.x;
              const dz = rackInsidePos.z - mesh.position.z;
              const dist = Math.sqrt(dx * dx + dz * dz);

              if (dist > 0.25) {
                const targetAngle = Math.atan2(dx, dz);
                let diff = targetAngle - mesh.rotation.y;
                while (diff < -Math.PI) diff += Math.PI * 2;
                while (diff > Math.PI) diff -= Math.PI * 2;
                mesh.rotation.y += diff * 0.35 * currentSimSpeed;

                mesh.position.x += (dx / dist) * Math.min(dist, speed);
                mesh.position.z += (dz / dist) * Math.min(dist, speed);
                data.status = 'A transportar';
                data.loc = `Transportando Palete para ${state.rackX < 0 ? 'Corredor A' : 'Corredor B'}`;
                data.speedKmh = 18;
                if (palletMesh) palletMesh.visible = true;
              } else {
                state.stage = 'STORING';
                state.actionTimer = 0.6; // Armazenagem rápida
                data.status = 'A descarregar';
                data.loc = 'Rack de Armazenagem (Leitura RFID & Posicionamento)';
                data.speedKmh = 0;
              }
            } else if (state.stage === 'STORING') {
              state.actionTimer -= 0.045 * currentSimSpeed;
              if (state.actionTimer <= 0) {
                if (palletMesh) palletMesh.visible = false;
                state.hasPallet = false;
                state.tripCounter = (state.tripCounter || 0) + 1;
                state.stage = 'RETURN_EMPTY';
              }
            }
          } else {
            const parkPos = { x: state.dockX, z: -7.5 };
            const dx = parkPos.x - mesh.position.x;
            const dz = parkPos.z - mesh.position.z;
            const dist = Math.sqrt(dx * dx + dz * dz);

            if (dist > 0.3) {
              const targetAngle = Math.atan2(dx, dz);
              let diff = targetAngle - mesh.rotation.y;
              while (diff < -Math.PI) diff += Math.PI * 2;
              while (diff > Math.PI) diff -= Math.PI * 2;
              mesh.rotation.y += diff * 0.30 * currentSimSpeed;

              mesh.position.x += (dx / dist) * Math.min(dist, speed * 0.90);
              mesh.position.z += (dz / dist) * Math.min(dist, speed * 0.90);
              data.status = 'Em trânsito';
              data.loc = 'Retornando à Vaga de Estacionamento Interior';
              data.speedKmh = 14;
            } else {
              state.stage = 'PARKED';
              data.status = 'Estacionado';
              data.loc = 'Área de Staging Interior · Aguardando Camião';
              data.speedKmh = 0;
            }
            if (palletMesh) palletMesh.visible = false;
          }

          // Rotação física realista das rodas da empilhadeira
          if (data.speedKmh > 0) {
            const wheelsGroup = mesh.getObjectByName('forklift-wheels-group');
            if (wheelsGroup) {
              const rollAngle = (data.speedKmh * 0.009) * currentSimSpeed;
              wheelsGroup.children.forEach((w) => {
                if (w.name === 'tire-roller') (w as THREE.Mesh).rotation.x += rollAngle;
              });
            }
          }
        });

        // =========================================================================
        // C. SIMULAÇÃO ACELERADA DOS 5 AGVs (Movimento Autônomo Fluido e Veloz)
        // =========================================================================
        agvMeshesRef.current.forEach(({ mesh, data, state }) => {
          // Velocidade acelerada do robô AGV
          const agvSpeed = 0.120 * currentSimSpeed;
          const targetWp = state.waypoints[state.currentWpIdx];
          const dx = targetWp.x - mesh.position.x;
          const dz = targetWp.z - mesh.position.z;
          const dist = Math.sqrt(dx * dx + dz * dz);

          if (state.randomSafetyTimer > 0) {
            state.randomSafetyTimer -= 0.045 * currentSimSpeed;
            data.speedKmh = 0;
            data.status = 'Aguardando Cruzamento';
            data.loc = `${state.loopName} (LiDAR 360° · Parada Preventiva de Segurança)`;
          } else if (state.pauseTimer > 0) {
            state.pauseTimer -= 0.045 * currentSimSpeed;
            data.speedKmh = 0;
            data.status = 'A carregar';
            data.loc = `${state.loopName} (Transferência Automatizada em Esteira)`;
          } else if (dist > 0.3) {
            const targetAngle = Math.atan2(dx, dz);
            let diff = targetAngle - mesh.rotation.y;
            while (diff < -Math.PI) diff += Math.PI * 2;
            while (diff > Math.PI) diff -= Math.PI * 2;
            mesh.rotation.y += diff * 0.30 * currentSimSpeed;

            const step = Math.min(dist, agvSpeed);
            mesh.position.x += (dx / dist) * step;
            mesh.position.z += (dz / dist) * step;
            data.speedKmh = 20;
            data.status = 'A transportar';
            data.loc = `${state.loopName} (Waypoint ${state.currentWpIdx + 1})`;

            if (Math.random() < 0.0006 * currentSimSpeed) {
              state.randomSafetyTimer = 0.8;
            }
          } else {
            state.currentWpIdx = (state.currentWpIdx + 1) % state.waypoints.length;
            if (state.currentWpIdx === 0) {
              state.pauseTimer = 0.6;
            }
          }
        });
        // =========================================================================
        // D. ATUALIZAÇÃO DINÂMICA DE SEGURANÇA DAS DOCAS (Niveladores & Calços de Rodas)
        // =========================================================================
        const physicallyDockedBays = new Set<number>();
        truckMeshesRef.current.forEach((t) => {
          if (
            t.mesh.visible &&
            ['DOCKED_INSPECTION', 'DOCKED_OPERATING', 'DOCKED_RANDOM_EVENT', 'DOCKED_FINISHED'].includes(t.state.stage)
          ) {
            physicallyDockedBays.add(t.state.dockId);
          }
        });

        for (let d = 1; d <= 4; d++) {
          const dockGroup = scene.getObjectByName(`dock-bay-${d}`);
          if (dockGroup) {
            const isDockOccupied = physicallyDockedBays.has(d);
            const leveler = dockGroup.getObjectByName('dock-leveler-plate') as THREE.Mesh;
            if (leveler) {
              // Quando o caminhão está acoplado, nivelador desce e estende a rampa no piso da carroceria
              const targetRotX = isDockOccupied ? 0.08 : 0;
              leveler.rotation.x += (targetRotX - leveler.rotation.x) * 0.15;
            }
            dockGroup.traverse((child) => {
              if (child.name === 'dock-wheel-chock') {
                child.visible = isDockOccupied;
              }
            });
          }
        }
      }

      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('pointermove', handlePointerMove);
      renderer.domElement.removeEventListener('click', handleClick);
      initializedVehiclesRef.current = false;
      renderer.dispose();
    };
  }, []);

  // Sincronizar velocidade da simulação
  useEffect(() => {
    if (containerRef.current) {
      (containerRef.current as unknown as { simSpeedVal?: number }).simSpeedVal = simSpeed;
    }
  }, [simSpeed]);

  // Alternar visibilidade dos campos LiDAR
  useEffect(() => {
    truckMeshesRef.current.forEach(({ mesh }) => {
      const scanner = mesh.getObjectByName('lidar-scanner-group');
      if (scanner) scanner.visible = showLidarFields;
    });
    forkliftMeshesRef.current.forEach(({ mesh }) => {
      const scanner = mesh.getObjectByName('lidar-scanner-group');
      if (scanner) scanner.visible = showLidarFields;
    });
    agvMeshesRef.current.forEach(({ mesh }) => {
      const scanner = mesh.getObjectByName('lidar-scanner-group');
      if (scanner) scanner.visible = showLidarFields;
    });
  }, [showLidarFields]);

  // Modo Dia / Noite
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    const ambientLight = scene.getObjectByName('ambient-light') as THREE.AmbientLight;
    const sunLight = scene.getObjectByName('sun-light') as THREE.DirectionalLight;
    const yardFlood = scene.getObjectByName('yard-flood') as THREE.PointLight;

    if (isNightMode) {
      scene.background = new THREE.Color(0x090d16);
      scene.fog = new THREE.FogExp2(0x090d16, 0.009);
      if (ambientLight) ambientLight.intensity = 0.28;
      if (sunLight) {
        sunLight.intensity = 0.35;
        sunLight.color.setHex(0x38bdf8);
      }
      if (yardFlood) {
        yardFlood.intensity = 2.4;
        yardFlood.color.setHex(0xfef08a);
      }
    } else {
      scene.background = new THREE.Color(0xf1f5f9);
      scene.fog = new THREE.FogExp2(0xf1f5f9, 0.006);
      if (ambientLight) ambientLight.intensity = 0.78;
      if (sunLight) {
        sunLight.intensity = 1.15;
        sunLight.color.setHex(0xfffbeb);
      }
      if (yardFlood) {
        yardFlood.intensity = 0.25;
      }
    }
  }, [isNightMode]);

  // Instanciar os 5 Caminhões, as 2 Empilhadeiras e os 5 AGVs
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    if (initializedVehiclesRef.current) {
      // Se novos caminhões foram despachados pelo utilizador via modal, instanciar apenas os novos
      vehicles.forEach((veh) => {
        if (veh.type === 'truck' && !truckMeshesRef.current.has(veh.id)) {
          const mesh = createDetailedTruck(veh);
          mesh.position.set(45.0, 0, 23.5);
          mesh.rotation.y = -Math.PI / 2;
          scene.add(mesh);
          truckMeshesRef.current.set(veh.id, {
            mesh,
            data: veh,
            state: {
              operation: 'UNLOAD',
              dockId: Math.floor(Math.random() * 4) + 1,
              dockX: DOCK_X_COORDS[0],
              cargoName: veh.cargo,
              stage: 'GATE_IN',
              targetZ: 2.4,
              operatingTimer: 0,
              progressPercent: 0,
              exitDirection: veh.assignedDock && veh.assignedDock <= 2 ? 'left' : 'right',
              dwellTimer: 1.0,
              standbyTimer: 0,
              beepTimer: 0,
              randomEventTriggered: false,
              totalPallets: veh.palletsCount || 20,
              entryGateSide: 'east',
            },
          });
        }
      });
      return;
    }

    initializedVehiclesRef.current = true;

    // Limpar meshes antigas caso seja a primeira montagem
    truckMeshesRef.current.forEach(({ mesh }) => scene.remove(mesh));
    forkliftMeshesRef.current.forEach(({ mesh }) => scene.remove(mesh));
    agvMeshesRef.current.forEach(({ mesh }) => scene.remove(mesh));
    truckMeshesRef.current.clear();
    forkliftMeshesRef.current.clear();
    agvMeshesRef.current.clear();

    // 1. Instanciar 5 Caminhões com Missões Ativas
    const truckConfigs: Array<{
      id: string;
      dockId: number;
      initialStage: TruckSimStage;
      op: TruckOperation;
      initZ: number;
      initX: number;
      rotY: number;
      exitDirection: 'left' | 'right';
      progress: number;
      totalPallets: number;
      standby: number;
      gateSide: 'east' | 'west';
    }> = [
      {
        id: 'TRK-2603',
        dockId: 1,
        initialStage: 'DOCKED_OPERATING',
        op: 'UNLOAD',
        initZ: 2.4,
        initX: -16.5,
        rotY: 0,
        exitDirection: 'left',
        progress: 25,
        totalPallets: 22,
        standby: 0,
        gateSide: 'east',
      },
      {
        id: 'TRK-5012',
        dockId: 2,
        initialStage: 'DOCKED_OPERATING',
        op: 'UNLOAD',
        initZ: 2.4,
        initX: -5.5,
        rotY: 0,
        exitDirection: 'left',
        progress: 55,
        totalPallets: 26,
        standby: 0,
        gateSide: 'west',
      },
      {
        id: 'TRK-4412',
        dockId: 3,
        initialStage: 'DOCKED_OPERATING',
        op: 'LOAD',
        initZ: 2.4,
        initX: 5.5,
        rotY: 0,
        exitDirection: 'right',
        progress: 85,
        totalPallets: 20,
        standby: 0,
        gateSide: 'east',
      },
      {
        id: 'TRK-8821',
        dockId: 4,
        initialStage: 'DEPARTING',
        op: 'LOAD',
        initZ: 5.5,
        initX: 16.5,
        rotY: 0,
        exitDirection: 'right',
        progress: 100,
        totalPallets: 24,
        standby: 0,
        gateSide: 'east',
      },
      {
        id: 'TRK-9150',
        dockId: 1,
        initialStage: 'GATE_IN',
        op: 'UNLOAD',
        initZ: 19.0,
        initX: -42.0,
        rotY: Math.PI / 2,
        exitDirection: 'left',
        progress: 0,
        totalPallets: 22,
        standby: 0,
        gateSide: 'west',
      },
    ];

    truckConfigs.forEach((cfg) => {
      const vehData: Vehicle = vehicles.find((v) => v.id === cfg.id) || {
        id: cfg.id,
        type: 'truck',
        name: `Camião ${cfg.id}`,
        status: cfg.initialStage === 'STANDBY_HIGHWAY' ? 'Programado' : 'Em trânsito',
        cargo: CARGO_CATALOG[cfg.dockId % CARGO_CATALOG.length],
        cargoCategory: 'Geral',
        cargoWeightKg: 14000,
        palletsCount: cfg.totalPallets,
        origin: 'Terminal Logístico',
        destination: `Doca 0${cfg.dockId}`,
        loc: cfg.initialStage === 'STANDBY_HIGHWAY' ? 'Rodovia de Acesso (Chegada em 18s)' : `Doca 0${cfg.dockId}`,
        batteryOrFuelPercent: 85,
        speedKmh: 15,
        driverName: 'Motorista WMS',
        driverType: 'Humano',
      };

      const mesh = createDetailedTruck(vehData);
      mesh.position.set(cfg.initX, 0, cfg.initZ);
      mesh.rotation.y = cfg.rotY;
      if (cfg.initialStage === 'STANDBY_HIGHWAY') {
        mesh.visible = false;
      }
      scene.add(mesh);

      truckMeshesRef.current.set(cfg.id, {
        mesh,
        data: vehData,
        state: {
          operation: cfg.op,
          dockId: cfg.dockId,
          dockX: DOCK_X_COORDS[cfg.dockId - 1],
          cargoName: vehData.cargo,
          stage: cfg.initialStage,
          targetZ: 2.4,
          operatingTimer: 0,
          progressPercent: cfg.progress,
          exitDirection: cfg.exitDirection,
          dwellTimer: 0,
          standbyTimer: cfg.standby,
          beepTimer: 0,
          randomEventTriggered: cfg.progress > 50,
          totalPallets: cfg.totalPallets,
          entryGateSide: cfg.gateSide,
        },
      });
    });

    // 2. Instanciar 2 Empilhadeiras Operacionais (Doca 1-2 e Doca 3-4)
    const forkliftConfigs = [
      { id: 'FL-01', dockId: 1, dockX: -16.5, rackX: -14.0, rackZ: -14.0 },
      { id: 'FL-02', dockId: 3, dockX: 5.5, rackX: 8.0, rackZ: -14.0 },
    ];

    forkliftConfigs.forEach((cfg) => {
      const vehData: Vehicle = vehicles.find((v) => v.id === cfg.id) || {
        id: cfg.id,
        type: 'forklift',
        name: `Empilhadora ${cfg.id}`,
        status: 'A transportar',
        cargo: 'Palete de Carga',
        cargoCategory: 'Industrial',
        cargoWeightKg: 850,
        palletsCount: 1,
        origin: `Doca 0${cfg.dockId}`,
        destination: 'Prateleiras do Galpão',
        loc: 'Interior do Armazém',
        batteryOrFuelPercent: 90,
        speedKmh: 6,
        driverName: 'Operador de Empilhadeira',
        driverType: 'Humano',
      };

      const mesh = createDetailedForklift(vehData);
      mesh.position.set(cfg.dockX, 0, -6.0);
      scene.add(mesh);

      forkliftMeshesRef.current.set(cfg.id, {
        mesh,
        data: vehData,
        state: {
          assignedDockId: cfg.dockId,
          dockX: cfg.dockX,
          rackX: cfg.rackX,
          rackZ: cfg.rackZ,
          stage: 'IDLE',
          hasPallet: false,
          actionTimer: 0,
          tripCounter: 0,
        },
      });
    });

    // 3. Instanciar os 5 Robôs AGV (Sentido natural para frente em circuitos dedicados)
    const agvConfigs = [
      {
        id: 'AGV-01',
        loopName: 'Corredor A (Armazenamento Vertical)',
        waypoints: [
          { x: -16.0, z: -5.0 },
          { x: -16.0, z: -18.0 },
          { x: -11.0, z: -18.0 },
          { x: -11.0, z: -5.0 },
        ],
      },
      {
        id: 'AGV-02',
        loopName: 'Corredor B (Navegação LiDAR 360°)',
        waypoints: [
          { x: -6.0, z: -5.0 },
          { x: -6.0, z: -18.0 },
          { x: -1.0, z: -18.0 },
          { x: -1.0, z: -5.0 },
        ],
      },
      {
        id: 'AGV-03',
        loopName: 'Corredor C (Alimentação Outbound)',
        waypoints: [
          { x: 5.0, z: -5.0 },
          { x: 5.0, z: -18.0 },
          { x: 10.0, z: -18.0 },
          { x: 10.0, z: -5.0 },
        ],
      },
      {
        id: 'AGV-04',
        loopName: 'Corredor D (Área de Paletização)',
        waypoints: [
          { x: 15.0, z: -5.0 },
          { x: 15.0, z: -18.0 },
          { x: 20.0, z: -18.0 },
          { x: 20.0, z: -5.0 },
        ],
      },
      {
        id: 'AGV-05',
        loopName: 'Anel Transversal (Triagem Central)',
        waypoints: [
          { x: -14.0, z: -7.5 },
          { x: 14.0, z: -7.5 },
          { x: 14.0, z: -13.5 },
          { x: -14.0, z: -13.5 },
        ],
      },
    ];

    agvConfigs.forEach((cfg) => {
      const vehData: Vehicle = vehicles.find((v) => v.id === cfg.id) || {
        id: cfg.id,
        type: 'agv',
        name: `Robô ${cfg.id}`,
        status: 'A transportar',
        cargo: 'Totes com Componentes',
        cargoCategory: 'Robótica',
        cargoWeightKg: 720,
        palletsCount: 1,
        origin: 'Estação de Triagem',
        destination: 'Prateleiras Centrais',
        loc: cfg.loopName,
        batteryOrFuelPercent: 92,
        speedKmh: 10,
        driverName: 'FleetMaster AI v4.2',
        driverType: 'Autônomo AGV',
      };

      const mesh = createDetailedAGV(vehData);
      const initWp = cfg.waypoints[0];
      mesh.position.set(initWp.x, 0, initWp.z);
      scene.add(mesh);

      agvMeshesRef.current.set(cfg.id, {
        mesh,
        data: vehData,
        state: {
          waypoints: cfg.waypoints,
          currentWpIdx: 1,
          pauseTimer: 0,
          loopName: cfg.loopName,
          randomSafetyTimer: 0,
        },
      });
    });
  }, [vehicles]);

  // Sincronizar indicador de anel de seleção
  useEffect(() => {
    const updateRing = (mesh: THREE.Group, isSelected: boolean) => {
      const ring = mesh.getObjectByName('selection-ring') as THREE.Mesh;
      if (ring && ring.material) {
        (ring.material as THREE.MeshBasicMaterial).opacity = isSelected ? 0.9 : 0;
      }
    };

    truckMeshesRef.current.forEach(({ mesh, data }) => {
      updateRing(mesh, data.id === selectedVehicleId);
    });
    forkliftMeshesRef.current.forEach(({ mesh, data }) => {
      updateRing(mesh, data.id === selectedVehicleId);
    });
    agvMeshesRef.current.forEach(({ mesh, data }) => {
      updateRing(mesh, data.id === selectedVehicleId);
    });
  }, [selectedVehicleId]);

  // Predefinições de câmara
  useEffect(() => {
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls) return;

    if (cameraPreset === 'isometric') {
      camera.position.set(48, 48, 48);
      controls.target.set(0, 0, 0);
    } else if (cameraPreset === 'top_down') {
      camera.position.set(0, 75, 0.01);
      controls.target.set(0, 0, -2);
    } else if (cameraPreset === 'dock_focus') {
      camera.position.set(0, 22, 28);
      controls.target.set(0, 2, 2);
    } else if (cameraPreset === 'interior') {
      camera.position.set(0, 26, -2);
      controls.target.set(0, 3, -18);
    } else if (cameraPreset === 'follow') {
      const targetId = selectedVehicleId || 'TRK-2603';
      const truck = truckMeshesRef.current.get(targetId);
      const forklift = forkliftMeshesRef.current.get(targetId);
      const agv = agvMeshesRef.current.get(targetId);
      const mesh = truck?.mesh || forklift?.mesh || agv?.mesh;
      if (mesh) {
        controls.target.copy(mesh.position);
        camera.position.set(
          mesh.position.x + 20,
          mesh.position.y + 18,
          mesh.position.z + 20
        );
      }
    }
    camera.lookAt(controls.target);
  }, [cameraPreset, selectedVehicleId]);

  return (
    <div className="relative w-full h-full select-none overflow-hidden">
      <div ref={containerRef} className="w-full h-full" />

      {/* Floating hover badge */}
      {hoveredVehicleName && (
        <div className="absolute top-20 sm:top-24 left-1/2 -translate-x-1/2 z-20 pointer-events-none bg-slate-900/95 backdrop-blur-md px-4 py-1.5 rounded-full border border-sky-500/50 text-xs font-mono text-sky-300 shadow-xl flex items-center gap-2">
          <Truck className="w-3.5 h-3.5 text-sky-400" />
          <span>{hoveredVehicleName} · Clique para ver todas as informações</span>
        </div>
      )}

      {/* LiDAR Fields Toggle Overlay */}
      <div className="absolute bottom-16 sm:bottom-6 left-3 sm:left-6 z-20 flex items-center gap-1.5 sm:gap-2 bg-slate-900/90 backdrop-blur-md px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-800 text-[11px] sm:text-xs font-mono text-slate-300 shadow-lg">
        <Radio className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input
            type="checkbox"
            checked={showLidarFields}
            onChange={(e) => setShowLidarFields(e.target.checked)}
            className="rounded border-slate-700 text-blue-600 focus:ring-0 cursor-pointer"
          />
          <span className="hidden sm:inline">Campos de Segurança LiDAR 3D</span>
          <span className="sm:hidden">Campos LiDAR</span>
        </label>
      </div>
    </div>
  );
};
