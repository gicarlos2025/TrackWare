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
import { CARGO_CATALOG, DOCK_X_COORDS, TRUCK_ENTRY_GATE_SIDE, TRUCK_EXIT_DIRECTION, TruckAgent, TruckMissionState, TruckOperation, TruckSimStage, updateTruckSimulation } from './truckSimulation';
import { ShieldAlert, Radio, Truck, RefreshCw, Scale, ShieldCheck, CheckCircle2 } from 'lucide-react';

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
  onOpenRegulatory?: () => void;
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
  onOpenRegulatory,
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
  const truckMeshesRef = useRef<Map<string, TruckAgent>>(new Map());
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
    let lastFrameTimestamp: number | null = null;
    const animate = (timestamp: number) => {
      animId = requestAnimationFrame(animate);

      const elapsedSeconds = lastFrameTimestamp === null
        ? 1 / 60
        : Math.min(Math.max((timestamp - lastFrameTimestamp) / 1000, 0), 0.05);
      lastFrameTimestamp = timestamp;
      const requestedSimSpeed = (containerRef.current as unknown as { simSpeedVal?: number })?.simSpeedVal ?? 1;
      const currentSimSpeed = requestedSimSpeed * elapsedSeconds * 60;

      if (currentSimSpeed > 0) {
        // =========================================================================
        updateTruckSimulation(truckMeshesRef.current, currentSimSpeed, {
          onVehicleStatusChange: statusCallbackRef.current,
          onActivityLog: activityLogCallbackRef.current,
          onDockUpdate: dockUpdateCallbackRef.current,
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
                data.loc = Math.abs(mesh.position.z - (-5.5)) < 0.8
                  ? 'Cruzamento Cego Central (Parada & Buzina NR-11)'
                  : `A caminho da Doca 0${targetTruck.state.dockId} (Coleta)`;
                data.speedKmh = 7;
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
                data.loc = Math.abs(mesh.position.z - (-5.5)) < 0.8
                  ? 'Cruzamento Cego Central (Parada & Buzina NR-11)'
                  : `Transportando Palete para ${state.rackX < 0 ? 'Corredor A' : 'Corredor B'}`;
                data.speedKmh = 7;
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
              data.speedKmh = 6;
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
            data.speedKmh = 5;
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
            ['DOCKED_INSPECTION', 'DOCKED_OPERATING', 'DOCKED_RANDOM_EVENT', 'DOCKED_COMPLETED', 'DOCKED_FINISHED'].includes(t.state.stage)
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

    animId = requestAnimationFrame(animate);

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
              exitDirection: TRUCK_EXIT_DIRECTION,
              dwellTimer: 1.0,
              standbyTimer: 0,
              beepTimer: 0,
              randomEventTriggered: false,
              totalPallets: veh.palletsCount || 20,
              entryGateSide: TRUCK_ENTRY_GATE_SIDE,
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
      progress: number;
      totalPallets: number;
      standby: number;
    }> = [
      {
        id: 'TRK-2603',
        dockId: 1,
        initialStage: 'DOCKED_OPERATING',
        op: 'UNLOAD',
        initZ: 2.4,
        initX: -16.5,
        rotY: 0,
        progress: 25,
        totalPallets: 22,
        standby: 0,
      },
      {
        id: 'TRK-5012',
        dockId: 2,
        initialStage: 'DOCKED_OPERATING',
        op: 'UNLOAD',
        initZ: 2.4,
        initX: -5.5,
        rotY: 0,
        progress: 55,
        totalPallets: 26,
        standby: 0,
      },
      {
        id: 'TRK-4412',
        dockId: 3,
        initialStage: 'DOCKED_OPERATING',
        op: 'LOAD',
        initZ: 2.4,
        initX: 5.5,
        rotY: 0,
        progress: 45,
        totalPallets: 20,
        standby: 0,
      },
      {
        id: 'TRK-8821',
        dockId: 4,
        initialStage: 'DEPARTING',
        op: 'LOAD',
        initZ: 5.5,
        initX: 16.5,
        rotY: 0,
        progress: 100,
        totalPallets: 24,
        standby: 0,
      },
      {
        id: 'TRK-9150',
        dockId: 4,
        initialStage: 'STANDBY_HIGHWAY',
        op: 'UNLOAD',
        initZ: 19.0,
        initX: -52.0,
        rotY: Math.PI / 2,
        progress: 0,
        totalPallets: 22,
        standby: 8.5,
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
          exitDirection: TRUCK_EXIT_DIRECTION,
          dwellTimer: 0,
          standbyTimer: cfg.standby,
          beepTimer: 0,
          randomEventTriggered: cfg.progress > 50,
          totalPallets: cfg.totalPallets,
          entryGateSide: TRUCK_ENTRY_GATE_SIDE,
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

      {/* LiDAR Fields Toggle Overlay & Regulatory Compliance Trigger */}
      <div className="absolute bottom-16 sm:bottom-6 left-3 sm:left-6 z-20 flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-900/90 backdrop-blur-md px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-800 text-[11px] sm:text-xs font-mono text-slate-300 shadow-lg">
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

        {onOpenRegulatory && (
          <button
            onClick={() => {
              soundManager.playClick();
              onOpenRegulatory();
            }}
            className="flex items-center gap-1.5 sm:gap-2 bg-emerald-950/80 hover:bg-emerald-900/80 backdrop-blur-md px-2.5 sm:px-3 py-1.5 rounded-xl border border-emerald-500/40 text-[11px] sm:text-xs font-mono text-emerald-300 shadow-lg transition-all cursor-pointer group"
            title="Abrir Central de Conformidade Regulatória (CTB e NRs)"
          >
            <Scale className="w-3.5 h-3.5 text-emerald-400 shrink-0 group-hover:scale-110 transition-transform" />
            <span className="font-semibold">Regras CTB & NRs</span>
            <span className="hidden md:inline px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-200 text-[10px] font-bold border border-emerald-500/30">
              100% Conforme
            </span>
          </button>
        )}
      </div>

      <div className="absolute bottom-16 sm:bottom-6 right-3 sm:right-6 z-20 pointer-events-none rounded-md border border-slate-700/70 bg-slate-950/75 px-2.5 py-1.5 text-right font-mono shadow-lg backdrop-blur-sm">
        <span className="block text-[9px] uppercase text-slate-400">Simulação por</span>
        <span className="block text-[11px] font-semibold text-slate-200">Gian Silva</span>
      </div>
    </div>
  );
};
