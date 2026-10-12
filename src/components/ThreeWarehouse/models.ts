import * as THREE from 'three';
import { Vehicle, PalletEntity } from '../../types/warehouse';

// Palette definitions matching the video aesthetics
export const PALETTE = {
  // Warehouse Building
  warehouseBlue: 0x1d63ed,       // Vibrant Royal Blue corrugated panels
  warehouseDarkBlue: 0x174ebd,
  warehouseRoof: 0xf1f5f9,       // Crisp clean white roof
  hvacSilver: 0x94a3b8,          // Rooftop chiller units
  dockSeal: 0x0f172a,            // Dark dock rubber seals
  dockDoor: 0x64748b,

  // Ground & Road
  groundAsphalt: 0xedf2f7,       // Light diorama concrete/asphalt
  roadSurface: 0xe2e8f0,         // Slightly darker road lanes
  lawnGreen: 0x86efac,           // Soft green grass verge
  treeFoliage: 0x22c55e,         // Stylized green tree canopy
  treeTrunk: 0x78350f,           // Wood trunk
  fenceWhite: 0xf8fafc,

  // Carriers
  wareTrackBlue: 0x2563eb,
  bluepeakNavy: 0x1e3a8a,
  nordlineCyan: 0x06b6d4,
  cargovivaOrange: 0xf97316,

  // Forklifts & Pallets
  forkliftYellow: 0xfacc15,      // Industrial yellow
  forkliftDark: 0x1e293b,
  woodPallet: 0xd4a373,          // Euro pallet wood
  kraftBox: 0xca8a04,            // Cardboard carton
  plasticToteBlue: 0x3b82f6,     // Stackable plastic tote bins

  // Wheels & Details
  tireRubber: 0x1e293b,
  rimSilver: 0x94a3b8,
  windowGlass: 0x0f172a,
};

// Canvas texture for carrier brand liveries on cargo container sides
function createCarrierSideTexture(carrier: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    // Crisp white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 512, 256);

    // Subtle container border line
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 4;
    ctx.strokeRect(8, 8, 496, 240);

    if (carrier === 'Bluepeak') {
      // Bluepeak branding (dark blue logo + peak)
      ctx.fillStyle = '#1e3a8a';
      ctx.beginPath();
      ctx.moveTo(110, 160);
      ctx.lineTo(150, 90);
      ctx.lineTo(190, 160);
      ctx.fill();
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.moveTo(170, 160);
      ctx.lineTo(195, 115);
      ctx.lineTo(220, 160);
      ctx.fill();

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 54px system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText('Bluepeak', 240, 130);
    } else if (carrier === 'Nordline') {
      // Nordline branding (cyan/green arrow + text)
      ctx.fillStyle = '#06b6d4';
      ctx.beginPath();
      ctx.arc(140, 130, 42, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(125, 105);
      ctx.lineTo(165, 130);
      ctx.lineTo(125, 155);
      ctx.fill();

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 54px system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText('Nordline', 205, 130);

      // Green speed stripe
      ctx.fillStyle = '#10b981';
      ctx.fillRect(205, 165, 230, 8);
    } else if (carrier === 'Cargoviva') {
      // Cargoviva branding (orange badge)
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.roundRect(90, 92, 75, 75, 16);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 44px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('CV', 127, 130);

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 50px system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText('Cargoviva', 185, 130);
    } else {
      // WareTrack default (blue cube icon + bold text)
      ctx.fillStyle = '#2563eb';
      ctx.beginPath();
      ctx.roundRect(90, 95, 70, 70, 18);
      ctx.fill();

      // White inner cube lines
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(125, 108);
      ctx.lineTo(145, 120);
      ctx.lineTo(145, 145);
      ctx.lineTo(125, 155);
      ctx.lineTo(105, 145);
      ctx.lineTo(105, 120);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 54px system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText('WareTrack', 180, 130);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 4;
  return texture;
}

// Procedural Cardboard Carton Texture
function createCartonTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#d97706'; // Kraft brown
    ctx.fillRect(0, 0, 128, 128);

    // White shipping label with barcode
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(16, 24, 60, 42);

    ctx.fillStyle = '#1e293b';
    for (let x = 20; x < 70; x += 4) {
      ctx.fillRect(x, 30, (x % 8 === 0 ? 3 : 1.5), 20);
    }

    // Packaging icons
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2;
    ctx.strokeRect(90, 24, 20, 20);

    // Tape across center
    ctx.fillStyle = 'rgba(180, 83, 9, 0.4)';
    ctx.fillRect(0, 60, 128, 8);
  }
  return new THREE.CanvasTexture(canvas);
}

const cartonTexture = createCartonTexture();

/**
 * Creates 3D Floating Pill Label above an entity (truck, dock, forklift, pallet)
 */
export function createFloatingLabelSprite(text: string, bgColor = '#0f172a', textColor = '#ffffff'): THREE.Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = 384;
  canvas.height = 96;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    // Rounded pill background
    ctx.fillStyle = bgColor;
    ctx.beginPath();
    ctx.roundRect(12, 12, 360, 72, 36);
    ctx.fill();

    // Subtle border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Text
    ctx.fillStyle = textColor;
    ctx.font = 'bold 32px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 192, 48);
  }

  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(4.8, 1.2, 1);
  return sprite;
}

/**
 * Creates Official Brazilian CTB (Contran) & NR Safety Signs
 */
export function createTrafficSign(
  type: 'speed_15' | 'speed_5' | 'stop' | 'pedestrians' | 'dock_rules' | 'nr11_warning' | 'blind_corner',
  x: number,
  z: number,
  rotY = 0
): THREE.Group {
  const group = new THREE.Group();
  group.name = `traffic-sign-${type}`;
  group.position.set(x, 0, z);
  group.rotation.y = rotY;

  // Steel Post
  const postGeom = new THREE.CylinderGeometry(0.04, 0.04, 2.7, 8);
  const postMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8, roughness: 0.3 });
  const post = new THREE.Mesh(postGeom, postMat);
  post.position.y = 1.35;
  post.castShadow = true;
  group.add(post);

  // Concrete Base
  const baseGeom = new THREE.CylinderGeometry(0.18, 0.22, 0.08, 8);
  const baseMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.9 });
  const base = new THREE.Mesh(baseGeom, baseMat);
  base.position.y = 0.04;
  group.add(base);

  // High-res canvas for sign face
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    if (type === 'speed_15') {
      // Placa R-19 CTB: Velocidade Máxima 15 km/h
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(128, 128, 120, 0, Math.PI * 2);
      ctx.fill();

      ctx.lineWidth = 26;
      ctx.strokeStyle = '#dc2626';
      ctx.stroke();

      ctx.fillStyle = '#0f172a';
      ctx.font = '900 88px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('15', 128, 102);

      ctx.font = 'bold 30px system-ui, -apple-system, sans-serif';
      ctx.fillText('km/h', 128, 175);
    } else if (type === 'speed_5') {
      // Placa R-19 CTB: Velocidade Máxima 5 km/h (Interior Armazém)
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(128, 128, 120, 0, Math.PI * 2);
      ctx.fill();

      ctx.lineWidth = 26;
      ctx.strokeStyle = '#dc2626';
      ctx.stroke();

      ctx.fillStyle = '#0f172a';
      ctx.font = '900 88px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('5', 128, 102);

      ctx.font = 'bold 28px system-ui, -apple-system, sans-serif';
      ctx.fillText('km/h', 128, 175);
    } else if (type === 'blind_corner') {
      // Placa Advertência NR-11: Cruzamento Cego Pare e Buzine
      ctx.fillStyle = '#facc15';
      ctx.fillRect(8, 8, 240, 240);
      ctx.lineWidth = 10;
      ctx.strokeStyle = '#0f172a';
      ctx.strokeRect(8, 8, 240, 240);

      ctx.fillStyle = '#dc2626';
      ctx.font = '900 24px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('CRUZAMENTO CEGO', 128, 50);

      ctx.fillStyle = '#0f172a';
      ctx.font = '900 38px system-ui, -apple-system, sans-serif';
      ctx.fillText('PARE', 128, 105);

      ctx.font = 'bold 24px system-ui, -apple-system, sans-serif';
      ctx.fillText('& BUZINE', 128, 148);

      ctx.font = 'bold 16px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = '#1e3a8a';
      ctx.fillText('NR-11 OPERACIONAL', 128, 195);
    } else if (type === 'stop') {
      // Placa R-1 CTB: PARE
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      const r = 118;
      const cx = 128, cy = 128;
      for (let i = 0; i < 8; i++) {
        const angle = (i * Math.PI) / 4 + Math.PI / 8;
        const px = cx + r * Math.cos(angle);
        const py = cy + r * Math.sin(angle);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();

      ctx.lineWidth = 8;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = '900 58px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('PARE', 128, 128);
    } else if (type === 'pedestrians') {
      // Placa A-32b CTB: Faixa de Pedestres
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.moveTo(128, 12);
      ctx.lineTo(244, 128);
      ctx.lineTo(128, 244);
      ctx.lineTo(12, 128);
      ctx.closePath();
      ctx.fill();

      ctx.lineWidth = 10;
      ctx.strokeStyle = '#0f172a';
      ctx.stroke();

      ctx.fillStyle = '#0f172a';
      ctx.font = '900 34px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('FAIXA', 128, 105);
      ctx.font = 'bold 24px system-ui, -apple-system, sans-serif';
      ctx.fillText('PEDESTRE', 128, 148);
    } else if (type === 'dock_rules') {
      // Painel Regulamentar de Docas: Calço e Chave
      ctx.fillStyle = '#1e3a8a';
      ctx.fillRect(8, 8, 240, 240);
      ctx.lineWidth = 8;
      ctx.strokeStyle = '#facc15';
      ctx.strokeRect(8, 8, 240, 240);

      ctx.fillStyle = '#facc15';
      ctx.font = 'bold 24px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('ÁREA DE DOCAS', 128, 50);

      ctx.fillStyle = '#ffffff';
      ctx.font = '900 22px system-ui, -apple-system, sans-serif';
      ctx.fillText('CALÇO OBRIGATÓRIO', 128, 105);
      ctx.fillText('CHAVE RETIDA', 128, 145);

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 18px system-ui, -apple-system, sans-serif';
      ctx.fillText('NR-11 · CTB ART. 2º', 128, 195);
    } else if (type === 'nr11_warning') {
      // Painel Advertência NR-11: Máquinas e EPI
      ctx.fillStyle = '#facc15';
      ctx.fillRect(8, 8, 240, 240);
      ctx.lineWidth = 10;
      ctx.strokeStyle = '#0f172a';
      ctx.strokeRect(8, 8, 240, 240);

      ctx.fillStyle = '#0f172a';
      ctx.font = '900 24px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('ATENÇÃO NR-11', 128, 50);

      ctx.font = 'bold 20px system-ui, -apple-system, sans-serif';
      ctx.fillText('MÁQUINAS EM VIA', 128, 95);
      ctx.fillText('EPI OBRIGATÓRIO', 128, 135);

      ctx.font = '900 18px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = '#dc2626';
      ctx.fillText('PROIBIDO CELULAR', 128, 185);
    }
  }

  const signTex = new THREE.CanvasTexture(canvas);
  const signGeom = new THREE.PlaneGeometry(1.05, 1.05);
  const signMat = new THREE.MeshStandardMaterial({
    map: signTex,
    roughness: 0.35,
    metalness: 0.15,
    side: THREE.DoubleSide,
  });
  const signMesh = new THREE.Mesh(signGeom, signMat);
  signMesh.position.set(0, 2.25, 0.035);
  signMesh.castShadow = true;
  group.add(signMesh);

  // Metallic back plate
  const backPlate = new THREE.Mesh(
    new THREE.BoxGeometry(1.08, 1.08, 0.04),
    new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.6, roughness: 0.4 })
  );
  backPlate.position.set(0, 2.25, 0);
  group.add(backPlate);

  return group;
}

/**
 * Creates 3D Industrial Worker with NR-11/NR-26 compliant PPE (Colete Refletivo, Capacete, Botina)
 */
export function createWorkerWithPPE(
  x: number,
  z: number,
  role: 'pedestrian' | 'dock_marshall' | 'forklift_operator' = 'pedestrian',
  rotY = 0
): THREE.Group {
  const worker = new THREE.Group();
  worker.name = `worker-${role}`;
  worker.position.set(x, 0, z);
  worker.rotation.y = rotY;

  // Materials
  const pantsMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 }); // Calça azul-marinho
  const bootsMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.6 }); // Bota biqueira
  const shirtMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.7 });
  const highVisVestMat = new THREE.MeshStandardMaterial({
    color: 0xccff00, // Amarelo Fluorescente de Alta Visibilidade NR-26
    roughness: 0.4,
    emissive: 0x446600,
    emissiveIntensity: 0.35,
  });
  const reflectiveStripeMat = new THREE.MeshStandardMaterial({
    color: 0xf1f5f9, // Faixa refletiva prata
    metalness: 0.8,
    roughness: 0.2,
  });
  const helmetMat = new THREE.MeshStandardMaterial({
    color: role === 'dock_marshall' ? 0xfacc15 : 0xffffff, // Capacete amarelo ou branco
    roughness: 0.3,
  });
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xd4a373, roughness: 0.7 });

  // 1. Boots
  [-0.14, 0.14].forEach((bx) => {
    const boot = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.16, 0.32), bootsMat);
    boot.position.set(bx, 0.08, 0.04);
    boot.castShadow = true;
    worker.add(boot);
  });

  // 2. Legs
  [-0.14, 0.14].forEach((lx) => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.1, 0.76, 8), pantsMat);
    leg.position.set(lx, 0.48, 0);
    leg.castShadow = true;
    worker.add(leg);
  });

  // 3. Torso with High-Visibility Safety Vest
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.68, 0.28), highVisVestMat);
  torso.position.set(0, 1.15, 0);
  torso.castShadow = true;
  worker.add(torso);

  // Reflective Stripes across chest and waist
  [1.02, 1.25].forEach((sy) => {
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.49, 0.06, 0.29), reflectiveStripeMat);
    stripe.position.set(0, sy, 0);
    worker.add(stripe);
  });

  // 4. Arms
  [-0.28, 0.28].forEach((ax, idx) => {
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.06, 0.6, 8), shirtMat);
    if (role === 'dock_marshall' && idx === 1) {
      // Right arm raised holding marshalling wand
      arm.rotation.x = -Math.PI / 3;
      arm.position.set(ax, 1.25, 0.22);
    } else {
      arm.position.set(ax, 1.15, 0);
    }
    arm.castShadow = true;
    worker.add(arm);

    // Hand
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), skinMat);
    if (role === 'dock_marshall' && idx === 1) {
      hand.position.set(ax, 1.45, 0.45);
    } else {
      hand.position.set(ax, 0.82, 0);
    }
    worker.add(hand);
  });

  // Dock Marshall Bastão Luminoso de Sinalização (Traffic Wand)
  if (role === 'dock_marshall') {
    const wandHandle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.025, 0.025, 0.14, 8),
      new THREE.MeshStandardMaterial({ color: 0x0f172a })
    );
    wandHandle.position.set(0.28, 1.46, 0.48);
    worker.add(wandHandle);

    const wandLight = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.03, 0.35, 8),
      new THREE.MeshStandardMaterial({
        color: 0x22c55e, // Bastão verde fluorescente
        emissive: 0x22c55e,
        emissiveIntensity: 0.9,
      })
    );
    wandLight.position.set(0.28, 1.65, 0.48);
    worker.add(wandLight);

    const pointLight = new THREE.PointLight(0x22c55e, 0.6, 4);
    pointLight.position.set(0.28, 1.65, 0.48);
    worker.add(pointLight);
  }

  // 5. Head
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 10), skinMat);
  head.position.set(0, 1.58, 0);
  head.castShadow = true;
  worker.add(head);

  // 6. Safety Hardhat / Capacete de Proteção NR-6
  const helmetDome = new THREE.Mesh(
    new THREE.SphereGeometry(0.16, 12, 10, 0, Math.PI * 2, 0, Math.PI / 2),
    helmetMat
  );
  helmetDome.position.set(0, 1.66, 0);
  helmetDome.castShadow = true;
  worker.add(helmetDome);

  const helmetBrim = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.03, 14), helmetMat);
  helmetBrim.position.set(0, 1.66, 0.04);
  worker.add(helmetBrim);

  // Floating Role Badge
  const badgeText = role === 'dock_marshall' ? 'Sinaleiro · NR-11' : 'Colaborador EPI';
  const roleSprite = createFloatingLabelSprite(badgeText, '#0f172a', '#facc15');
  roleSprite.position.set(0, 2.15, 0);
  roleSprite.scale.set(2.4, 0.6, 1);
  worker.add(roleSprite);

  return worker;
}

/**
 * Creates Industrial Dock Traffic Signal Box (Semáforo de Doca)
 */
export function createDockTrafficLight(bayNumber: number, isGreen = false): THREE.Group {
  const group = new THREE.Group();
  group.name = `dock-traffic-light-${bayNumber}`;

  // Black weather-proof housing box
  const boxGeom = new THREE.BoxGeometry(0.28, 0.72, 0.2);
  const boxMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6 });
  const box = new THREE.Mesh(boxGeom, boxMat);
  group.add(box);

  // Red Lens (Top)
  const redMat = new THREE.MeshStandardMaterial({
    color: isGreen ? 0x450a0a : 0xef4444,
    emissive: isGreen ? 0x000000 : 0xef4444,
    emissiveIntensity: isGreen ? 0 : 0.9,
    roughness: 0.2,
  });
  const redLens = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.04, 16), redMat);
  redLens.rotation.x = Math.PI / 2;
  redLens.position.set(0, 0.17, 0.1);
  group.add(redLens);

  // Green Lens (Bottom)
  const greenMat = new THREE.MeshStandardMaterial({
    color: isGreen ? 0x22c55e : 0x052e16,
    emissive: isGreen ? 0x22c55e : 0x000000,
    emissiveIntensity: isGreen ? 0.9 : 0,
    roughness: 0.2,
  });
  const greenLens = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.04, 16), greenMat);
  greenLens.rotation.x = Math.PI / 2;
  greenLens.position.set(0, -0.17, 0.1);
  group.add(greenLens);

  // Hood visors over each lens
  [-0.17, 0.17].forEach((ly) => {
    const visor = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.1, 0.07, 12, 1, true, 0, Math.PI),
      boxMat
    );
    visor.rotation.z = Math.PI;
    visor.position.set(0, ly + 0.05, 0.13);
    group.add(visor);
  });

  return group;
}

/**
 * Creates NR-12 & NR-26 Fire Safety & Emergency Stop Station (Combate a Incêndio e Parada de Emergência)
 */
export function createFireSafetyStation(x: number, z: number, rotY = 0): THREE.Group {
  const group = new THREE.Group();
  group.name = 'fire-safety-station';
  group.position.set(x, 0, z);
  group.rotation.y = rotY;

  // 1. NR-26 Piso demarcado em Vermelho com borda amarela (Área desobstruída obrigatória)
  const redFloorMat = new THREE.MeshBasicMaterial({ color: 0xdc2626 });
  const redFloor = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.4), redFloorMat);
  redFloor.rotation.x = -Math.PI / 2;
  redFloor.position.set(0, 0.042, 0);
  group.add(redFloor);

  const yellowBorderMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
  [-0.7, 0.7].forEach((bx) => {
    const b = new THREE.Mesh(new THREE.PlaneGeometry(0.08, 1.4), yellowBorderMat);
    b.rotation.x = -Math.PI / 2;
    b.position.set(bx, 0.045, 0);
    group.add(b);
  });

  // 2. Extintor de Incêndio Industrial ABC (Cilindro Vermelho)
  const extGroup = new THREE.Group();
  extGroup.position.set(0, 1.1, -0.45);

  const tankMat = new THREE.MeshStandardMaterial({ color: 0xb91c1c, metalness: 0.3, roughness: 0.3 });
  const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.65, 12), tankMat);
  tank.castShadow = true;
  extGroup.add(tank);

  const tankTop = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 8), tankMat);
  tankTop.position.y = 0.32;
  extGroup.add(tankTop);

  const valveMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.8 });
  const valve = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.12, 8), valveMat);
  valve.position.y = 0.44;
  extGroup.add(valve);

  const hose = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.45, 6), valveMat);
  hose.position.set(0.1, 0.15, 0.05);
  extGroup.add(hose);

  group.add(extGroup);

  // 3. Botão de Parada de Emergência NR-12 (E-Stop Mushroom Button)
  const eStopBox = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, 0.22, 0.1),
    new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.5 })
  );
  eStopBox.position.set(0.42, 1.4, -0.45);
  group.add(eStopBox);

  const eStopMushroom = new THREE.Mesh(
    new THREE.CylinderGeometry(0.065, 0.055, 0.06, 16),
    new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.3, emissive: 0x991b1b, emissiveIntensity: 0.4 })
  );
  eStopMushroom.rotation.x = Math.PI / 2;
  eStopMushroom.position.set(0.42, 1.4, -0.38);
  group.add(eStopMushroom);

  // Placa Indicativa no Alto
  const labelSprite = createFloatingLabelSprite('Extintor · E-Stop NR-12', '#991b1b', '#ffffff');
  labelSprite.position.set(0, 2.3, -0.45);
  labelSprite.scale.set(2.4, 0.6, 1);
  group.add(labelSprite);

  return group;
}

/**
 * Creates Dock Key Retention Lock Box (Cofre de Chaves / Lacre da Portaria)
 * Conforme Protocolo Operacional: Retenção de chaves para evitar movimentação acidental com empilhadeiras no baú
 */
export function createKeyLockBox(x: number, z: number, rotY = 0): THREE.Group {
  const group = new THREE.Group();
  group.name = 'key-lock-box';
  group.position.set(x, 0, z);
  group.rotation.y = rotY;

  // Steel Mounting Post
  const post = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 1.5, 0.08),
    new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.7 })
  );
  post.position.y = 0.75;
  group.add(post);

  // Metal Safety Box
  const boxMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, metalness: 0.5, roughness: 0.4 });
  const box = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.55, 0.22), boxMat);
  box.position.set(0, 1.4, 0);
  box.castShadow = true;
  group.add(box);

  // Glass/Acrylic Viewport showing keys
  const glass = new THREE.Mesh(
    new THREE.PlaneGeometry(0.32, 0.38),
    new THREE.MeshStandardMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.6 })
  );
  glass.position.set(0, 1.4, 0.115);
  group.add(glass);

  // Label Sprite
  const labelSprite = createFloatingLabelSprite('Cofre de Chaves · Doca', '#0f172a', '#facc15');
  labelSprite.position.set(0, 1.9, 0);
  labelSprite.scale.set(2.2, 0.55, 1);
  group.add(labelSprite);

  return group;
}

/**
 * Creates detailed Truck matching the video liveries and styling
 */
export function createDetailedTruck(vehicle: Vehicle): THREE.Group {
  const group = new THREE.Group();
  group.name = `vehicle-${vehicle.id}`;
  group.userData = { ...vehicle, isInteractive: true };

  const carrier = vehicle.carrier || 'WareTrack';

  // Cab color by carrier
  let cabColor = 0xffffff;
  if (carrier === 'Bluepeak') cabColor = 0x1e3a8a; // Dark Navy
  else if (carrier === 'Nordline') cabColor = 0x06b6d4; // Cyan
  else if (carrier === 'Cargoviva') cabColor = 0xffffff; // White with orange trim
  else cabColor = 0xffffff; // WareTrack White

  const cabMat = new THREE.MeshStandardMaterial({ color: cabColor, roughness: 0.3 });
  const glassMat = new THREE.MeshStandardMaterial({ color: PALETTE.windowGlass, roughness: 0.1, metalness: 0.7 });
  const chassisMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.7 });
  const bumperMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8 });

  // 1. Lower Chassis
  const chassis = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.4, 10.5), chassisMat);
  chassis.position.set(0, 0.9, 0);
  chassis.castShadow = true;
  group.add(chassis);

  // 2. Cab (Front)
  const cabGroup = new THREE.Group();
  cabGroup.position.set(0, 0, 3.6);

  // Bumper
  const bumper = new THREE.Mesh(new THREE.BoxGeometry(2.55, 0.7, 1.4), bumperMat);
  bumper.position.set(0, 0.95, 0.6);
  cabGroup.add(bumper);

  // Main Cab Body
  const cabBody = new THREE.Mesh(new THREE.BoxGeometry(2.5, 2.5, 2.2), cabMat);
  cabBody.position.set(0, 2.35, 0);
  cabBody.castShadow = true;
  cabGroup.add(cabBody);

  // Roof Wind Deflector (Aero)
  const deflector = new THREE.Mesh(
    new THREE.BoxGeometry(2.4, 0.5, 1.6),
    cabMat
  );
  deflector.position.set(0, 3.8, -0.2);
  cabGroup.add(deflector);

  // Windshield
  const windshield = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.15, 0.1), glassMat);
  windshield.position.set(0, 2.7, 1.12);
  cabGroup.add(windshield);

  // Side Windows
  [-1, 1].forEach((side) => {
    const sideWin = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.95, 1.2), glassMat);
    sideWin.position.set(side * 1.26, 2.7, 0.2);
    cabGroup.add(sideWin);

    // Mirrors
    const mirror = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.45, 0.2), bumperMat);
    mirror.position.set(side * 1.45, 2.6, 0.95);
    cabGroup.add(mirror);
  });

  // Headlights (LED)
  const lightMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.9 });
  [-1, 1].forEach((side) => {
    const light = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.2, 0.1), lightMat);
    light.position.set(side * 0.95, 0.9, 1.32);
    cabGroup.add(light);
  });

  group.add(cabGroup);

  // 3. Cargo Container with Carrier Branding
  const trailerGroup = new THREE.Group();
  trailerGroup.position.set(0, 0, -1.8);

  const containerMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 });
  const brandedSideMat = new THREE.MeshStandardMaterial({
    map: createCarrierSideTexture(carrier),
    roughness: 0.4,
  });

  // Multi-material box so sides have the crisp carrier brand
  const trailerMaterials = [
    brandedSideMat, // +X right side
    brandedSideMat, // -X left side
    containerMat,   // +Y top
    containerMat,   // -Y bottom
    containerMat,   // +Z front
    containerMat,   // -Z rear doors
  ];

  const trailerBox = new THREE.Mesh(new THREE.BoxGeometry(2.65, 3.5, 7.6), trailerMaterials);
  trailerBox.position.set(0, 2.95, 0);
  trailerBox.castShadow = true;
  trailerGroup.add(trailerBox);

  // Rear doors detail
  const rearFrame = new THREE.Mesh(new THREE.BoxGeometry(2.55, 3.3, 0.08), bumperMat);
  rearFrame.position.set(0, 2.95, -3.82);
  trailerGroup.add(rearFrame);

  // Tail lights (red)
  const tailMat = new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xef4444, emissiveIntensity: 0.8 });
  [-1, 1].forEach((side) => {
    const tail = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.2, 0.08), tailMat);
    tail.position.set(side * 1.0, 1.1, -3.86);
    trailerGroup.add(tail);
  });

  group.add(trailerGroup);

  // 4. Wheels (3 Axles: 1 front steering, 2 rear tandem)
  const wheelGeom = new THREE.CylinderGeometry(0.65, 0.65, 0.45, 18);
  const tireMat = new THREE.MeshStandardMaterial({ color: PALETTE.tireRubber, roughness: 0.8 });
  const rimGeom = new THREE.CylinderGeometry(0.38, 0.38, 0.48, 12);
  const rimMat = new THREE.MeshStandardMaterial({ color: PALETTE.rimSilver, metalness: 0.5 });

  const wheelsGroup = new THREE.Group();
  wheelsGroup.name = 'truck-wheels-group';

  const wheelPositions = [{ z: 3.8 }, { z: -2.6 }, { z: -4.3 }];
  wheelPositions.forEach(({ z }) => {
    [-1, 1].forEach((side) => {
      const wheelG = new THREE.Group();
      wheelG.position.set(side * 1.35, 0.65, z);

      const tire = new THREE.Mesh(wheelGeom, tireMat);
      tire.name = 'tire-roller';
      tire.rotation.z = Math.PI / 2;
      tire.castShadow = true;
      wheelG.add(tire);

      const rim = new THREE.Mesh(rimGeom, rimMat);
      rim.rotation.z = Math.PI / 2;
      wheelG.add(rim);

      wheelsGroup.add(wheelG);
    });
  });
  group.add(wheelsGroup);

  // 5. Floating Label Sprite above Truck (e.g. TRK-2201 · WareTrack)
  const labelSprite = createFloatingLabelSprite(`${vehicle.id} · ${carrier}`);
  labelSprite.name = 'floating-label';
  labelSprite.position.set(0, 5.8, 0);
  group.add(labelSprite);

  // 6. Selection Indicator Ring
  const indicatorRing = new THREE.Mesh(
    new THREE.RingGeometry(2.0, 2.3, 32),
    new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0,
    })
  );
  indicatorRing.name = 'selection-ring';
  indicatorRing.rotation.x = -Math.PI / 2;
  indicatorRing.position.y = 0.05;
  group.add(indicatorRing);

  // 7. Safety Perimeter & Forward LiDAR Radar Sensor
  const lidarGroup = new THREE.Group();
  lidarGroup.name = 'lidar-scanner-group';

  // Ground perimeter contour (3D rounded safety envelope around chassis)
  const safetyEnvelopeGeom = new THREE.RingGeometry(2.6, 2.9, 32);
  const safetyMat = new THREE.MeshBasicMaterial({
    color: 0x10b981,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.35,
  });
  const safetyRing = new THREE.Mesh(safetyEnvelopeGeom, safetyMat);
  safetyRing.name = 'safety-envelope-ring';
  safetyRing.rotation.x = -Math.PI / 2;
  safetyRing.position.y = 0.04;
  lidarGroup.add(safetyRing);

  // Forward radar cone projecting ahead of cab (+Z is forward)
  const radarConeGeom = new THREE.ConeGeometry(3.5, 6.5, 16, 1, true, 0, Math.PI);
  const radarMat = new THREE.MeshBasicMaterial({
    color: 0x06b6d4,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.22,
    wireframe: true,
  });
  const radarMesh = new THREE.Mesh(radarConeGeom, radarMat);
  radarMesh.name = 'radar-cone-mesh';
  radarMesh.rotation.x = -Math.PI / 2;
  radarMesh.rotation.z = Math.PI;
  radarMesh.position.set(0, 0.05, 5.5);
  lidarGroup.add(radarMesh);

  group.add(lidarGroup);

  return group;
}

/**
 * Creates modern Forklift matching the video
 */
export function createDetailedForklift(vehicle: Vehicle): THREE.Group {
  const group = new THREE.Group();
  group.name = `vehicle-${vehicle.id}`;
  group.userData = { ...vehicle, isInteractive: true };

  const bodyMat = new THREE.MeshStandardMaterial({ color: PALETTE.forkliftYellow, roughness: 0.35 });
  const darkMat = new THREE.MeshStandardMaterial({ color: PALETTE.forkliftDark, roughness: 0.6 });
  const woodMat = new THREE.MeshStandardMaterial({ color: PALETTE.woodPallet, roughness: 0.9 });
  const boxMat = new THREE.MeshStandardMaterial({ map: cartonTexture, roughness: 0.8 });

  // 1. Chassis
  const chassis = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.6, 2.2), darkMat);
  chassis.position.set(0, 0.5, -0.2);
  chassis.castShadow = true;
  group.add(chassis);

  // Main yellow body
  const cowl = new THREE.Mesh(new THREE.BoxGeometry(1.46, 0.9, 1.8), bodyMat);
  cowl.position.set(0, 1.0, -0.3);
  cowl.castShadow = true;
  group.add(cowl);

  // Rear rounded counterweight
  const counter = new THREE.Mesh(
    new THREE.CylinderGeometry(0.7, 0.72, 0.9, 14, 1, false, 0, Math.PI),
    bodyMat
  );
  counter.rotation.y = Math.PI / 2;
  counter.position.set(0, 1.0, -1.2);
  group.add(counter);

  // 2. Roll Cage (Cabin)
  const pillarGeom = new THREE.CylinderGeometry(0.04, 0.04, 2.2, 8);
  [
    { x: -0.62, z: 0.5 },
    { x: 0.62, z: 0.5 },
    { x: -0.62, z: -0.8 },
    { x: 0.62, z: -0.8 },
  ].forEach((pos) => {
    const pillar = new THREE.Mesh(pillarGeom, darkMat);
    pillar.position.set(pos.x, 2.0, pos.z);
    group.add(pillar);
  });

  const roof = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.06, 1.4), darkMat);
  roof.position.set(0, 3.1, -0.15);
  group.add(roof);

  // Operator Seat
  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.5, 0.6), darkMat);
  seat.position.set(0, 1.35, -0.3);
  group.add(seat);

  // 3. Hydraulic Mast & Forks
  const mastGroup = new THREE.Group();
  mastGroup.position.set(0, 0, 0.95);

  [-0.45, 0.45].forEach((x) => {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.8, 0.14), darkMat);
    rail.position.set(x, 1.6, 0);
    mastGroup.add(rail);
  });

  // Carriage
  const carriage = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.6, 0.1), darkMat);
  carriage.position.set(0, 0.7, 0.1);
  mastGroup.add(carriage);

  // Steel Forks
  [-0.32, 0.32].forEach((x) => {
    const fork = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.05, 1.6), darkMat);
    fork.position.set(x, 0.28, 0.85);
    mastGroup.add(fork);
  });

  // 4. Pallet & Cardboard Boxes on Forks
  const cargoGroup = new THREE.Group();
  cargoGroup.name = 'forklift-cargo-pallet';
  cargoGroup.position.set(0, 0.32, 0.9);

  // Euro Pallet
  const pallet = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.08, 1.3), woodMat);
  pallet.position.set(0, 0.1, 0);
  pallet.castShadow = true;
  cargoGroup.add(pallet);

  // Stack of 4 Cardboard Cartons
  const boxGeom = new THREE.BoxGeometry(0.55, 0.48, 0.55);
  [
    { x: -0.3, y: 0.38, z: -0.3 },
    { x: 0.3, y: 0.38, z: -0.3 },
    { x: -0.3, y: 0.38, z: 0.3 },
    { x: 0.3, y: 0.38, z: 0.3 },
    { x: 0, y: 0.86, z: 0 },
  ].forEach((p) => {
    const box = new THREE.Mesh(boxGeom, boxMat);
    box.position.set(p.x, p.y, p.z);
    box.castShadow = true;
    cargoGroup.add(box);
  });

  mastGroup.add(cargoGroup);
  group.add(mastGroup);

  // 5. Wheels
  const fWheelGeom = new THREE.CylinderGeometry(0.45, 0.45, 0.32, 14);
  const rWheelGeom = new THREE.CylinderGeometry(0.35, 0.35, 0.28, 14);
  const wheelMat = new THREE.MeshStandardMaterial({ color: PALETTE.tireRubber });

  const wheelsGroup = new THREE.Group();
  wheelsGroup.name = 'forklift-wheels-group';

  [-0.8, 0.8].forEach((x) => {
    const wheel = new THREE.Mesh(fWheelGeom, wheelMat);
    wheel.name = 'tire-roller';
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(x, 0.45, 0.6);
    wheelsGroup.add(wheel);
  });

  [-0.65, 0.65].forEach((x) => {
    const wheel = new THREE.Mesh(rWheelGeom, wheelMat);
    wheel.name = 'tire-roller';
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(x, 0.35, -0.9);
    wheelsGroup.add(wheel);
  });
  group.add(wheelsGroup);

  // 6. Floating Label Sprite (e.g. FL-01 · Loading Bay 1)
  const labelSprite = createFloatingLabelSprite(vehicle.id, '#1e293b');
  labelSprite.name = 'floating-label';
  labelSprite.position.set(0, 4.2, 0);
  labelSprite.scale.set(3.2, 0.8, 1);
  group.add(labelSprite);

  // NR-11: Giroflex Âmbar Rotativo no Teto da Cabine (Sinalização Luminosa Obrigatória)
  const beaconGroup = new THREE.Group();
  beaconGroup.name = 'forklift-safety-beacon';
  beaconGroup.position.set(0, 3.25, -0.15);

  const beaconBase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.14, 0.08, 12),
    new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8 })
  );
  beaconGroup.add(beaconBase);

  const amberLens = new THREE.Mesh(
    new THREE.CylinderGeometry(0.1, 0.1, 0.16, 12),
    new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xf59e0b,
      emissiveIntensity: 0.95,
      roughness: 0.2,
      transparent: true,
      opacity: 0.9,
    })
  );
  amberLens.position.y = 0.1;
  beaconGroup.add(amberLens);

  const amberLight = new THREE.PointLight(0xf59e0b, 0.8, 6);
  amberLight.position.y = 0.15;
  beaconGroup.add(amberLight);
  group.add(beaconGroup);

  // NR-11: Projeção de Luz de Segurança no Piso (Blue Spot Safety Light a 2.5m de distância)
  const blueSpotMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.55,
    side: THREE.DoubleSide,
  });

  // Blue Spot Traseiro (aviso de marcha à ré para pedestres em cruzamentos)
  const rearBlueSpot = new THREE.Mesh(new THREE.CircleGeometry(0.42, 20), blueSpotMat);
  rearBlueSpot.name = 'forklift-blue-spot-rear';
  rearBlueSpot.rotation.x = -Math.PI / 2;
  rearBlueSpot.position.set(0, 0.04, -3.2);
  group.add(rearBlueSpot);

  // Blue Spot Dianteiro (aviso frontal em cruzamentos cegos)
  const frontBlueSpot = new THREE.Mesh(new THREE.CircleGeometry(0.42, 20), blueSpotMat);
  frontBlueSpot.name = 'forklift-blue-spot-front';
  frontBlueSpot.rotation.x = -Math.PI / 2;
  frontBlueSpot.position.set(0, 0.04, 3.2);
  group.add(frontBlueSpot);

  // 7. Selection Ring
  const indicatorRing = new THREE.Mesh(
    new THREE.RingGeometry(1.6, 1.9, 28),
    new THREE.MeshBasicMaterial({
      color: 0xfacc15,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0,
    })
  );
  indicatorRing.name = 'selection-ring';
  indicatorRing.rotation.x = -Math.PI / 2;
  indicatorRing.position.y = 0.05;
  group.add(indicatorRing);

  return group;
}

/**
 * Creates modern autonomous AGV (Automated Guided Vehicle / AMR)
 * with low profile chassis, navigation LiDAR scanner, LED headlights, warning beacons, and cargo tray.
 * Orientated along +Z as natural forward movement.
 */
export function createDetailedAGV(vehicle: Vehicle): THREE.Group {
  const group = new THREE.Group();
  group.name = `vehicle-${vehicle.id}`;
  group.userData = { ...vehicle, isInteractive: true };

  const agvOrange = 0xf97316; // Autonomous safety orange
  const darkChassis = 0x1e293b;
  const steelMetal = 0x64748b;

  const orangeMat = new THREE.MeshStandardMaterial({ color: agvOrange, roughness: 0.35 });
  const darkMat = new THREE.MeshStandardMaterial({ color: darkChassis, roughness: 0.6 });
  const metalMat = new THREE.MeshStandardMaterial({ color: steelMetal, metalness: 0.8, roughness: 0.2 });

  // 1. Lower Chassis (Low-profile industrial AMR base)
  const baseGeom = new THREE.BoxGeometry(1.6, 0.45, 2.2);
  const baseMesh = new THREE.Mesh(baseGeom, orangeMat);
  baseMesh.position.set(0, 0.32, 0);
  baseMesh.castShadow = true;
  group.add(baseMesh);

  // Black side protective bumper skirts
  const skirtGeom = new THREE.BoxGeometry(1.66, 0.15, 2.26);
  const skirt = new THREE.Mesh(skirtGeom, darkMat);
  skirt.position.set(0, 0.15, 0);
  group.add(skirt);

  // 2. Top Scissor / Rotary Lift Platform (Elevator table)
  const topPlate = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.08, 1.8), darkMat);
  topPlate.position.set(0, 0.58, 0);
  group.add(topPlate);

  // 3. Directional Headlights pointing forward (+Z is forward)
  const headlightMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  [-0.6, 0.6].forEach((x) => {
    // Front white headlight beam lens
    const headlight = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.1, 0.05), headlightMat);
    headlight.position.set(x, 0.35, 1.12);
    group.add(headlight);

    // Front light projection cone
    const beam = new THREE.Mesh(
      new THREE.ConeGeometry(0.35, 1.6, 8),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.25 })
    );
    beam.rotation.x = -Math.PI / 2;
    beam.position.set(x, 0.35, 1.9);
    group.add(beam);
  });

  // Rear tail lights (red, -Z is rear)
  const tailLightMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
  [-0.6, 0.6].forEach((x) => {
    const tailLight = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.1, 0.05), tailLightMat);
    tailLight.position.set(x, 0.35, -1.12);
    group.add(tailLight);
  });

  // 4. Autonomous 360 LiDAR Puck Scanner on top
  const lidarGroup = new THREE.Group();
  lidarGroup.name = 'lidar-scanner-group';
  lidarGroup.position.set(0, 0.65, 0.7);

  const lidarPuck = new THREE.Mesh(
    new THREE.CylinderGeometry(0.16, 0.16, 0.2, 16),
    darkMat
  );
  lidarGroup.add(lidarPuck);

  const lidarLens = new THREE.Mesh(
    new THREE.CylinderGeometry(0.14, 0.14, 0.08, 16),
    new THREE.MeshBasicMaterial({ color: 0x10b981 }) // Green laser pulse ring
  );
  lidarLens.position.y = 0.02;
  lidarGroup.add(lidarLens);

  // Forward Safety Cone Laser indicator on ground
  const laserField = new THREE.Mesh(
    new THREE.RingGeometry(0.8, 1.8, 16, 1, 0, Math.PI),
    new THREE.MeshBasicMaterial({ color: 0x10b981, transparent: true, opacity: 0.25, side: THREE.DoubleSide })
  );
  laserField.rotation.x = -Math.PI / 2;
  laserField.rotation.z = -Math.PI / 2;
  laserField.position.set(0, -0.6, 0.8);
  lidarGroup.add(laserField);
  group.add(lidarGroup);

  // 5. Pallet / Plastic Tote payload carried by AGV
  const palletGroup = new THREE.Group();
  palletGroup.name = 'agv-payload';
  palletGroup.position.set(0, 0.62, 0);

  const woodMat = new THREE.MeshStandardMaterial({ color: PALETTE.woodPallet });
  const woodPallet = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.08, 1.2), woodMat);
  woodPallet.position.y = 0.04;
  woodPallet.castShadow = true;
  palletGroup.add(woodPallet);

  // Tote bins on AGV
  const toteMat = new THREE.MeshStandardMaterial({ color: PALETTE.plasticToteBlue, roughness: 0.4 });
  const boxGeom = new THREE.BoxGeometry(0.5, 0.4, 0.5);
  [-0.26, 0.26].forEach((bx) => {
    [-0.26, 0.26].forEach((bz) => {
      const box = new THREE.Mesh(boxGeom, toteMat);
      box.position.set(bx, 0.28, bz);
      box.castShadow = true;
      palletGroup.add(box);
    });
  });
  group.add(palletGroup);

  // 6. Wheels (Embedded drive wheels)
  const wheelGeom = new THREE.CylinderGeometry(0.24, 0.24, 0.16, 14);
  const wheelMat = new THREE.MeshStandardMaterial({ color: PALETTE.tireRubber });
  [-0.82, 0.82].forEach((x) => {
    [-0.55, 0.55].forEach((z) => {
      const wheel = new THREE.Mesh(wheelGeom, wheelMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(x, 0.24, z);
      group.add(wheel);
    });
  });

  // 7. Floating Label
  const labelSprite = createFloatingLabelSprite(vehicle.id, '#0f172a');
  labelSprite.name = 'floating-label';
  labelSprite.position.set(0, 2.4, 0);
  labelSprite.scale.set(3.0, 0.75, 1);
  group.add(labelSprite);

  // 8. Selection Ring
  const indicatorRing = new THREE.Mesh(
    new THREE.RingGeometry(1.4, 1.7, 24),
    new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0,
    })
  );
  indicatorRing.name = 'selection-ring';
  indicatorRing.rotation.x = -Math.PI / 2;
  indicatorRing.position.y = 0.05;
  group.add(indicatorRing);

  return group;
}

/**
 * Creates 3D Location Map Pin floating above staging pallets
 */
export function createMapPinMarker(title: string): THREE.Group {
  const pinGroup = new THREE.Group();
  pinGroup.name = `pin-${title}`;

  // Blue Pin head (sphere)
  const pinHeadMat = new THREE.MeshStandardMaterial({
    color: 0x3b82f6,
    emissive: 0x2563eb,
    emissiveIntensity: 0.6,
    roughness: 0.2,
  });
  const sphere = new THREE.Mesh(new THREE.SphereGeometry(0.65, 16, 16), pinHeadMat);
  sphere.position.y = 2.4;
  pinGroup.add(sphere);

  // Cone tip pointing down
  const cone = new THREE.Mesh(new THREE.ConeGeometry(0.65, 1.2, 16), pinHeadMat);
  cone.rotation.x = Math.PI; // point down
  cone.position.y = 1.6;
  pinGroup.add(cone);

  // White inner dot
  const dot = new THREE.Mesh(new THREE.SphereGeometry(0.25, 12, 12), new THREE.MeshBasicMaterial({ color: 0xffffff }));
  dot.position.set(0, 2.4, 0.45);
  pinGroup.add(dot);

  // Floating Label
  const label = createFloatingLabelSprite(title, '#2563eb');
  label.position.set(0, 3.8, 0);
  label.scale.set(3.6, 0.9, 1);
  pinGroup.add(label);

  // Pulsing base ring on the floor
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.9, 1.2, 24),
    new THREE.MeshBasicMaterial({ color: 0x60a5fa, side: THREE.DoubleSide, transparent: true, opacity: 0.5 })
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.05;
  pinGroup.add(ring);

  return pinGroup;
}

/**
 * Creates Stacks of Blue Plastic Totes or Kraft Boxes in Yard
 */
export function createYardStagingPallet(pallet: PalletEntity): THREE.Group {
  const group = new THREE.Group();
  group.name = `pallet-${pallet.id}`;
  group.userData = { ...pallet, isInteractive: true };
  group.position.set(pallet.x, 0, pallet.z);

  const woodMat = new THREE.MeshStandardMaterial({ color: PALETTE.woodPallet });
  const woodPallet = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.12, 1.8), woodMat);
  woodPallet.position.y = 0.06;
  woodPallet.castShadow = true;
  group.add(woodPallet);

  if (pallet.productName.includes('Plastic') || pallet.productName.includes('Safety Helmet')) {
    // Blue Plastic Tote Bins
    const toteMat = new THREE.MeshStandardMaterial({ color: PALETTE.plasticToteBlue, roughness: 0.4 });
    const toteGeom = new THREE.BoxGeometry(0.95, 0.6, 0.8);
    [
      { x: -0.5, y: 0.42, z: -0.4 },
      { x: 0.5, y: 0.42, z: -0.4 },
      { x: -0.5, y: 0.42, z: 0.4 },
      { x: 0.5, y: 0.42, z: 0.4 },
      { x: -0.5, y: 1.02, z: -0.4 },
      { x: 0.5, y: 1.02, z: -0.4 },
      { x: -0.5, y: 1.02, z: 0.4 },
      { x: 0.5, y: 1.02, z: 0.4 },
    ].forEach((p) => {
      const tote = new THREE.Mesh(toteGeom, toteMat);
      tote.position.set(p.x, p.y, p.z);
      tote.castShadow = true;
      group.add(tote);
    });
  } else {
    // Kraft Cardboard Boxes
    const boxMat = new THREE.MeshStandardMaterial({ map: cartonTexture, roughness: 0.8 });
    const boxGeom = new THREE.BoxGeometry(0.95, 0.75, 0.8);
    [
      { x: -0.5, y: 0.5, z: -0.4 },
      { x: 0.5, y: 0.5, z: -0.4 },
      { x: -0.5, y: 0.5, z: 0.4 },
      { x: 0.5, y: 0.5, z: 0.4 },
      { x: -0.5, y: 1.25, z: 0 },
      { x: 0.5, y: 1.25, z: 0 },
    ].forEach((p) => {
      const box = new THREE.Mesh(boxGeom, boxMat);
      box.position.set(p.x, p.y, p.z);
      box.castShadow = true;
      group.add(box);
    });
  }

  // Map Pin floating above
  const pin = createMapPinMarker(pallet.productName);
  pin.position.y = 1.2;
  group.add(pin);

  return group;
}

/**
 * Creates stylized trees along sidewalk
 */
function createTree(x: number, z: number): THREE.Group {
  const tree = new THREE.Group();
  tree.position.set(x, 0, z);

  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.15, 0.22, 2.2, 8),
    new THREE.MeshStandardMaterial({ color: PALETTE.treeTrunk })
  );
  trunk.position.y = 1.1;
  trunk.castShadow = true;
  tree.add(trunk);

  const foliage = new THREE.Mesh(
    new THREE.SphereGeometry(1.2, 12, 12),
    new THREE.MeshStandardMaterial({ color: PALETTE.treeFoliage, roughness: 0.6 })
  );
  foliage.position.y = 2.8;
  foliage.castShadow = true;
  tree.add(foliage);

  return tree;
}

/**
 * Creates the Modern Warehouse, 4 Dock Bays, Roof Chiller Units, and Yard Environment
 */
export function createWarehouseEnvironment(): THREE.Group {
  const envGroup = new THREE.Group();

  // 1. Ground - Light clean diorama asphalt
  const groundMat = new THREE.MeshStandardMaterial({
    color: PALETTE.groundAsphalt,
    roughness: 0.75,
  });
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(130, 90), groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  envGroup.add(ground);

  // Roadway Asphalt Ribbon
  const roadMat = new THREE.MeshStandardMaterial({
    color: PALETTE.roadSurface,
    roughness: 0.8,
  });
  const road = new THREE.Mesh(new THREE.PlaneGeometry(120, 24), roadMat);
  road.rotation.x = -Math.PI / 2;
  road.position.set(0, 0.02, 22);
  road.receiveShadow = true;
  envGroup.add(road);

  // Road Lane Dividers (White dashed lines)
  const whiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  for (let x = -55; x <= 55; x += 6) {
    const dash = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 0.3), whiteMat);
    dash.rotation.x = -Math.PI / 2;
    dash.position.set(x, 0.03, 22);
    envGroup.add(dash);
  }

  // 2. Green Lawn Verge along southern boundary
  const lawnMat = new THREE.MeshStandardMaterial({
    color: PALETTE.lawnGreen,
    roughness: 0.9,
  });
  const lawn = new THREE.Mesh(new THREE.PlaneGeometry(125, 8), lawnMat);
  lawn.rotation.x = -Math.PI / 2;
  lawn.position.set(0, 0.03, 36);
  lawn.receiveShadow = true;
  envGroup.add(lawn);

  // Stylized Trees on the Lawn Verge
  for (let x = -50; x <= 50; x += 12) {
    envGroup.add(createTree(x, 36));
  }

  // White Perimeter Railing Fence
  const fenceMat = new THREE.MeshStandardMaterial({ color: PALETTE.fenceWhite, roughness: 0.5 });
  const railTop = new THREE.Mesh(new THREE.BoxGeometry(110, 0.1, 0.1), fenceMat);
  railTop.position.set(0, 1.2, 32.5);
  envGroup.add(railTop);

  const railMid = new THREE.Mesh(new THREE.BoxGeometry(110, 0.1, 0.1), fenceMat);
  railMid.position.set(0, 0.6, 32.5);
  envGroup.add(railMid);

  for (let x = -55; x <= 55; x += 5) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.3, 0.12), fenceMat);
    post.position.set(x, 0.65, 32.5);
    envGroup.add(post);
  }

  // 3. Main Warehouse Building (Architectural Cutaway - Teto Aberto para Visualização do Interior)
  const warehouseWidth = 72;
  const warehouseDepth = 36;
  const warehouseHeight = 12;

  const wallMat = new THREE.MeshStandardMaterial({
    color: PALETTE.warehouseBlue,
    roughness: 0.45,
  });
  const steelFrameMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    roughness: 0.6,
    metalness: 0.5,
  });

  // Modern Cutaway Facade: Viga Superior Estrutural (permite visão panorâmica desobstruída do interior)
  const upperLintel = new THREE.Mesh(new THREE.BoxGeometry(warehouseWidth, 1.8, 1.4), wallMat);
  upperLintel.position.set(0, 11.1, -2);
  upperLintel.castShadow = true;
  envGroup.add(upperLintel);

  // Pilares frontais das extremidades
  const leftWall = new THREE.Mesh(new THREE.BoxGeometry(11, 7, 1.4), wallMat);
  leftWall.position.set(-30.5, 3.5, -2);
  envGroup.add(leftWall);

  const rightWall = new THREE.Mesh(new THREE.BoxGeometry(11, 7, 1.4), wallMat);
  rightWall.position.set(30.5, 3.5, -2);
  envGroup.add(rightWall);

  // Paredes Laterais e Traseira (Perímetro do Armazém com visual cutaway)
  const backWall = new THREE.Mesh(new THREE.BoxGeometry(warehouseWidth, warehouseHeight, 1.2), wallMat);
  backWall.position.set(0, 6.0, -36);
  envGroup.add(backWall);

  [-warehouseWidth / 2, warehouseWidth / 2].forEach((x) => {
    const sWall = new THREE.Mesh(new THREE.BoxGeometry(1.2, warehouseHeight, warehouseDepth), wallMat);
    sWall.position.set(x, 6.0, -19);
    envGroup.add(sWall);
  });

  // Vigas Metálicas de Treliça Industrial (Perímetro Superior Aberto - Sem teto fechado)
  const topFrontBeam = new THREE.Mesh(new THREE.BoxGeometry(warehouseWidth, 0.4, 0.4), steelFrameMat);
  topFrontBeam.position.set(0, warehouseHeight, -2);
  envGroup.add(topFrontBeam);

  const topBackBeam = new THREE.Mesh(new THREE.BoxGeometry(warehouseWidth, 0.4, 0.4), steelFrameMat);
  topBackBeam.position.set(0, warehouseHeight, -36);
  envGroup.add(topBackBeam);

  // Treliças transversais superiores discretas (delimitam a estrutura sem obstruir o teto)
  [-24, -12, 0, 12, 24].forEach((tx) => {
    const truss = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.35, warehouseDepth), steelFrameMat);
    truss.position.set(tx, warehouseHeight, -19);
    envGroup.add(truss);
  });

  // =========================================================================
  // INTERIOR DO ARMAZÉM (Piso Epóxi, Ruas, Demarcações e Prateleiras / Racks)
  // =========================================================================

  // 1. Piso Industrial de Alta Resistência (Epóxi Cinza Escuro Polido)
  const interiorFloorMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.35,
    metalness: 0.15,
  });
  const interiorFloor = new THREE.Mesh(new THREE.PlaneGeometry(warehouseWidth - 2, warehouseDepth - 2), interiorFloorMat);
  interiorFloor.rotation.x = -Math.PI / 2;
  interiorFloor.position.set(0, 0.03, -19);
  interiorFloor.receiveShadow = true;
  envGroup.add(interiorFloor);

  // 2. Ruas do Armazém e Demarcações de Segurança (Faixas Amarelas e Faixas de Pedestres)
  const safetyYellowMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
  const laneWhiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

  // Corredor Transversal Central (conecta as docas às ruas internas)
  const crossAisleBorderNorth = new THREE.Mesh(new THREE.PlaneGeometry(64, 0.2), safetyYellowMat);
  crossAisleBorderNorth.rotation.x = -Math.PI / 2;
  crossAisleBorderNorth.position.set(0, 0.04, -4.5);
  envGroup.add(crossAisleBorderNorth);

  const crossAisleBorderSouth = new THREE.Mesh(new THREE.PlaneGeometry(64, 0.2), safetyYellowMat);
  crossAisleBorderSouth.rotation.x = -Math.PI / 2;
  crossAisleBorderSouth.position.set(0, 0.04, -6.5);
  envGroup.add(crossAisleBorderSouth);

  // Ruas Longitudinais (Aisles A, B, C, D)
  const aisleXCoords = [
    { name: 'RUA A', x: -13.5 },
    { name: 'RUA B', x: -3.5 },
    { name: 'RUA C', x: 7.5 },
    { name: 'RUA D', x: 17.5 },
  ];

  aisleXCoords.forEach(({ name, x }) => {
    // Linhas amarelas laterais da rua
    [-2.2, 2.2].forEach((offset) => {
      const line = new THREE.Mesh(new THREE.PlaneGeometry(0.18, 25), safetyYellowMat);
      line.rotation.x = -Math.PI / 2;
      line.position.set(x + offset, 0.04, -19.5);
      envGroup.add(line);
    });

    // Tracejado branco central de sentido de tráfego
    for (let z = -8; z >= -31; z -= 3.5) {
      const dash = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 1.8), laneWhiteMat);
      dash.rotation.x = -Math.PI / 2;
      dash.position.set(x, 0.045, z);
      envGroup.add(dash);
    }

    // Placa Suspensa Indicativa da Rua
    const signSprite = createFloatingLabelSprite(name, '#1e3a8a', '#38bdf8');
    signSprite.position.set(x, 7.8, -7.5);
    signSprite.scale.set(3.2, 0.8, 1);
    envGroup.add(signSprite);

    // Luminária LED High-Bay suspensa no teto do corredor
    const bayLight = new THREE.PointLight(0xf8fafc, 0.65, 18);
    bayLight.position.set(x, 9.5, -19);
    envGroup.add(bayLight);
  });

  // Faixa de Pedestres Industrial (Zebra Crossing) no cruzamento central
  for (let px = -2.5; px <= 2.5; px += 0.8) {
    const zebra = new THREE.Mesh(new THREE.PlaneGeometry(0.45, 1.8), safetyYellowMat);
    zebra.rotation.x = -Math.PI / 2;
    zebra.position.set(px, 0.045, -5.5);
    envGroup.add(zebra);
  }

  // 3. Estruturas Porta-Paletes Industriais (Multi-Tier Heavy-Duty Racks)
  const rackUprightMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, metalness: 0.6, roughness: 0.4 }); // Azul industrial
  const rackBeamMat = new THREE.MeshStandardMaterial({ color: 0xea580c, metalness: 0.3, roughness: 0.5 });    // Laranja segurança
  const palletWoodMat = new THREE.MeshStandardMaterial({ color: PALETTE.woodPallet, roughness: 0.8 });
  const toteBlueMat = new THREE.MeshStandardMaterial({ color: PALETTE.plasticToteBlue, roughness: 0.4 });
  const boxCartonMat = new THREE.MeshStandardMaterial({ color: PALETTE.kraftBox, roughness: 0.7 });

  // Posições das fileiras de prateleiras (intercaladas entre as Ruas A, B, C, D)
  const rackRowXPositions = [-23.0, -8.5, 2.0, 12.5, 25.0];

  rackRowXPositions.forEach((rx) => {
    const rackGroup = new THREE.Group();
    rackGroup.position.set(rx, 0, -21.0);

    const rackLength = 22;
    const rackDepth = 1.8;
    const rackHeight = 8.5;
    const numColumns = 6;
    const colSpacing = rackLength / (numColumns - 1);

    // Colunas Verticais de Aço (Uprights)
    for (let c = 0; c < numColumns; c++) {
      const cz = -rackLength / 2 + c * colSpacing;
      [-rackDepth / 2, rackDepth / 2].forEach((dx) => {
        const upright = new THREE.Mesh(new THREE.BoxGeometry(0.14, rackHeight, 0.14), rackUprightMat);
        upright.position.set(dx, rackHeight / 2, cz);
        upright.castShadow = true;
        rackGroup.add(upright);
      });

      // Travessas diagonais do montante
      const crossBrace = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, rackDepth, 6), rackUprightMat);
      crossBrace.rotation.z = Math.PI / 2;
      crossBrace.position.set(0, 4.2, cz);
      rackGroup.add(crossBrace);
    }

    // Níveis de Prateleira (Vigas Horizontais Laranja)
    const shelfTiers = [1.2, 3.4, 5.6, 7.8];
    shelfTiers.forEach((tierY) => {
      // Duas vigas longitudinais (frente e verso)
      [-rackDepth / 2, rackDepth / 2].forEach((dx) => {
        const beam = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.22, rackLength), rackBeamMat);
        beam.position.set(dx, tierY, 0);
        beam.castShadow = true;
        rackGroup.add(beam);
      });

      // Longarinas transversais de apoio
      for (let s = -rackLength / 2 + 1; s < rackLength / 2; s += 2.2) {
        const crossSupport = new THREE.Mesh(new THREE.BoxGeometry(rackDepth, 0.08, 0.08), rackBeamMat);
        crossSupport.position.set(0, tierY, s);
        rackGroup.add(crossSupport);
      }

      // Paletes Estocados com Cargas Variadas em Cada Nível
      for (let pz = -rackLength / 2 + 1.2; pz <= rackLength / 2 - 1.2; pz += 2.2) {
        // 85% de taxa de ocupação dos racks
        if (Math.sin(rx * 3 + tierY * 5 + pz * 7) > -0.6) {
          const palletMesh = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.12, 1.2), palletWoodMat);
          palletMesh.position.set(0, tierY + 0.08, pz);
          palletMesh.castShadow = true;
          rackGroup.add(palletMesh);

          // Carga sobre o palete: caixas kraft ou bins azuis industriais
          const isTote = (Math.abs(Math.round(rx + pz + tierY)) % 2 === 0);
          if (isTote) {
            const tote = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.8, 1.0), toteBlueMat);
            tote.position.set(0, tierY + 0.54, pz);
            tote.castShadow = true;
            rackGroup.add(tote);
          } else {
            const box = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.9, 1.0), boxCartonMat);
            box.position.set(0, tierY + 0.59, pz);
            box.castShadow = true;
            rackGroup.add(box);
          }
        }
      }
    });

    envGroup.add(rackGroup);
  });

  // 4. Áreas de Staging / Buffer de Paletes em Frente às Docas (Zonas de Transbordo das Empilhadeiras)
  const stagingDockX = [-16.5, -5.5, 5.5, 16.5];
  stagingDockX.forEach((sx) => {
    // Quadrilátero amarelo delimitando o staging buffer no piso
    const stagingBox = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 2.2), safetyYellowMat);
    stagingBox.rotation.x = -Math.PI / 2;
    stagingBox.position.set(sx, 0.04, -3.8);
    envGroup.add(stagingBox);

    const innerFloor = new THREE.Mesh(new THREE.PlaneGeometry(3.3, 1.9), interiorFloorMat);
    innerFloor.rotation.x = -Math.PI / 2;
    innerFloor.position.set(sx, 0.045, -3.8);
    envGroup.add(innerFloor);
  });

  // 4. Loading Docks (4 Bays: Bay 1, Bay 2, Bay 3, Bay 4)
  const dockXCoords = [-16.5, -5.5, 5.5, 16.5];
  const dockSealMat = new THREE.MeshStandardMaterial({ color: PALETTE.dockSeal, roughness: 0.9 });
  const yellowMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });

  dockXCoords.forEach((xPos, idx) => {
    const dockBay = new THREE.Group();
    dockBay.name = `dock-bay-${idx + 1}`;
    dockBay.position.set(xPos, 0, -2);

    // Rubber Dock Shelter / Cushion Seal Frame
    const sealLeft = new THREE.Mesh(new THREE.BoxGeometry(0.5, 6.2, 1.2), dockSealMat);
    sealLeft.position.set(-2.6, 3.1, 0.5);
    dockBay.add(sealLeft);

    const sealRight = new THREE.Mesh(new THREE.BoxGeometry(0.5, 6.2, 1.2), dockSealMat);
    sealRight.position.set(2.6, 3.1, 0.5);
    dockBay.add(sealRight);

    const sealTop = new THREE.Mesh(new THREE.BoxGeometry(5.7, 0.6, 1.2), dockSealMat);
    sealTop.position.set(0, 6.2, 0.5);
    dockBay.add(sealTop);

    // Roll-up Sectional Garage Door (Open showing warm interior)
    const door = new THREE.Mesh(
      new THREE.BoxGeometry(4.6, 1.6, 0.1),
      new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.6 })
    );
    door.position.set(0, 5.2, 0.1);
    dockBay.add(door);

    // Warm Interior Dock Glow
    const interiorLight = new THREE.PointLight(0xfde047, 0.8, 12);
    interiorLight.position.set(0, 3.5, -3);
    dockBay.add(interiorLight);

    // Nivelador Hidráulico de Doca (Hydraulic Dock Leveler Platform Plate)
    const levelerMat = new THREE.MeshStandardMaterial({
      color: 0x334155, // Aço industrial antiderrapante
      metalness: 0.6,
      roughness: 0.4,
    });
    const levelerPlate = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.08, 2.4), levelerMat);
    levelerPlate.name = 'dock-leveler-plate';
    levelerPlate.position.set(0, 1.15, -0.2);
    dockBay.add(levelerPlate);

    // Borda Amarela de Segurança do Nivelador
    const levelerBorderMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
    [-1.3, 1.3].forEach((lx) => {
      const yellowEdge = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.09, 2.4), levelerBorderMat);
      yellowEdge.position.set(lx, 1.16, -0.2);
      dockBay.add(yellowEdge);
    });

    // Calços de Roda de Segurança (Wheel Chocks de Borracha / Cunha Amarela)
    const chockMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.5 });
    [-1.5, 1.5].forEach((cx) => {
      const chock = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.22, 0.5), chockMat);
      chock.name = 'dock-wheel-chock';
      chock.position.set(cx, 0.11, 0.7);
      dockBay.add(chock);
    });

    // Dock Number Sign (Bay 1, Bay 2, Bay 3, Bay 4)
    const baySign = createFloatingLabelSprite(`Bay ${idx + 1}`, '#0f172a', '#facc15');
    baySign.position.set(0, 7.4, 0.65);
    baySign.scale.set(3.2, 0.8, 1);
    dockBay.add(baySign);

    // Yellow Chevron Dock Alignment Guide Markings on Asphalt
    [-2.2, 2.2].forEach((gx) => {
      const guideLine = new THREE.Mesh(new THREE.PlaneGeometry(0.25, 14), yellowMat);
      guideLine.rotation.x = -Math.PI / 2;
      guideLine.position.set(gx, 0.035, 7);
      dockBay.add(guideLine);
    });

    // Yellow Staging Approach Chevrons
    for (let cz = 3; cz <= 11; cz += 2.5) {
      const chevron = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.25), yellowMat);
      chevron.rotation.x = -Math.PI / 2;
      chevron.position.set(0, 0.035, cz);
      dockBay.add(chevron);
    }

    envGroup.add(dockBay);
  });

  // =========================================================================
  // 5. REGULAMENTAÇÃO CTB & NORMAS REGULAMENTADORAS (NR-11, NR-12, NR-26)
  // Sinalização Vertical, Padrão Cromático no Pavimento, EPIs e Segurança
  // =========================================================================

  // A. SINALIZAÇÃO VERTICAL (CTB Art. 51 e 80)
  // 1. Placa R-19 (15 km/h Pátio Externo) na entrada da portaria e no apron
  envGroup.add(createTrafficSign('speed_15', -4.2, 20.8, 0));
  envGroup.add(createTrafficSign('speed_15', 25.5, 17.5, -Math.PI / 2));

  // 2. Placa R-19 (5 km/h Interior do Armazém) na entrada das docas
  envGroup.add(createTrafficSign('speed_5', -21.5, 2.8, 0));

  // 3. Placa R-1 (PARE) na portaria de triagem e entroncamento
  envGroup.add(createTrafficSign('stop', 4.2, 20.8, 0));
  envGroup.add(createTrafficSign('stop', -8.5, 17.0, -Math.PI / 2));

  // 4. Placa A-32b (Faixa de Pedestres)
  envGroup.add(createTrafficSign('pedestrians', -2.8, 17.8, 0));

  // 5. Placas Regulamentares de Docas (Calço e Chave Retida - NR-11)
  envGroup.add(createTrafficSign('dock_rules', -22.5, 10.5, Math.PI / 4));
  envGroup.add(createTrafficSign('dock_rules', 22.5, 10.5, -Math.PI / 4));

  // 6. Placa NR-11 Advertência (Máquinas em via, EPI e Proibido Celular)
  envGroup.add(createTrafficSign('nr11_warning', -24.0, 3.2, 0));

  // 7. Placa Advertência: Cruzamento Cego no interior do armazém (NR-11)
  envGroup.add(createTrafficSign('blind_corner', 0, -5.2, 0));

  // B. SINALIZAÇÃO HORIZONTAL DE SEGURANÇA (NR-26)
  // 1. Faixas Brancas / Cinza: Caminhos e Passarelas Exclusivas de Pedestres
  const walkwayWhiteMat = new THREE.MeshBasicMaterial({ color: 0xf8fafc });
  const walkwayBorderMat = new THREE.MeshBasicMaterial({ color: 0x94a3b8 });

  // Passarela Longitudinal Externa ligando a Portaria ao Armazém
  const walkNorth = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 20), walkwayWhiteMat);
  walkNorth.rotation.x = -Math.PI / 2;
  walkNorth.position.set(-23.5, 0.038, 10);
  envGroup.add(walkNorth);

  // Bordas de demarcação da passarela
  [-24.3, -22.7].forEach((bx) => {
    const border = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 20), walkwayBorderMat);
    border.rotation.x = -Math.PI / 2;
    border.position.set(bx, 0.041, 10);
    envGroup.add(border);
  });

  // Faixa de Pedestres Zebra no Pátio (Travessia de pedestres CTB Art. 29)
  for (let zx = -3.2; zx <= 3.2; zx += 0.8) {
    const zebra = new THREE.Mesh(new THREE.PlaneGeometry(0.48, 2.4), walkwayWhiteMat);
    zebra.rotation.x = -Math.PI / 2;
    zebra.position.set(zx, 0.041, 17.8);
    envGroup.add(zebra);
  }

  // 2. Demarcações Zebradas Amarelo/Preto de Risco de Esmagamento (NR-12)
  const dangerYellowMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
  const dangerBlackMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });

  [-20.5, -9.5, 1.5, 12.5, 23.5].forEach((hx) => {
    const zebraZone = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.4), dangerYellowMat);
    zebraZone.rotation.x = -Math.PI / 2;
    zebraZone.position.set(hx, 0.036, 1.2);
    envGroup.add(zebraZone);

    for (let s = -0.5; s <= 0.5; s += 0.35) {
      const blackStripe = new THREE.Mesh(new THREE.PlaneGeometry(0.14, 1.3), dangerBlackMat);
      blackStripe.rotation.x = -Math.PI / 2;
      blackStripe.rotation.z = Math.PI / 4;
      blackStripe.position.set(hx + s * 0.5, 0.038, 1.2 + s * 0.5);
      envGroup.add(blackStripe);
    }
  });

  // 3. Demarcação Horizontal de Sentido Único e Fluxo Contínuo (CTB Art. 29 & 80)
  // Setas e Linhas de Fluxo no Pavimento para Segregação de Entrada e Saída
  const arrowWhiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const laneYellowMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });

  // Linha Guia Longitudinal da Faixa de Entrada Norte (z = 17.5)
  [-18, -6, 6, 18].forEach((lx) => {
    const dashLine = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 0.22), arrowWhiteMat);
    dashLine.rotation.x = -Math.PI / 2;
    dashLine.position.set(lx, 0.037, 17.5);
    envGroup.add(dashLine);
  });

  // Linha Guia da Faixa de Saída Sul (z = 13.5)
  [-12, 0, 12].forEach((lx) => {
    const exitDash = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 0.22), laneYellowMat);
    exitDash.rotation.x = -Math.PI / 2;
    exitDash.position.set(lx, 0.037, 13.5);
    envGroup.add(exitDash);
  });

  // Setas Direcionais Pintadas no Asfalto (Sentido Obrigatório)
  // Entrada Oeste: x = -10, z = 17.5
  [-11, 11].forEach((ax) => {
    const arrowShaft = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.28), arrowWhiteMat);
    arrowShaft.rotation.x = -Math.PI / 2;
    arrowShaft.position.set(ax, 0.038, 17.5);
    envGroup.add(arrowShaft);

    const arrowHead = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.7, 3), arrowWhiteMat);
    arrowHead.rotation.x = -Math.PI / 2;
    arrowHead.rotation.z = ax < 0 ? Math.PI / 2 : -Math.PI / 2;
    arrowHead.position.set(ax < 0 ? ax - 1.0 : ax + 1.0, 0.038, 17.5);
    envGroup.add(arrowHead);
  });

  // Setas Direcionais de Saída Leste / Oeste (z = 13.5)
  [-15, 15].forEach((ax) => {
    const exitShaft = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.28), laneYellowMat);
    exitShaft.rotation.x = -Math.PI / 2;
    exitShaft.position.set(ax, 0.038, 13.5);
    envGroup.add(exitShaft);

    const exitHead = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.7, 3), laneYellowMat);
    exitHead.rotation.x = -Math.PI / 2;
    exitHead.rotation.z = ax < 0 ? Math.PI / 2 : -Math.PI / 2;
    exitHead.position.set(ax < 0 ? ax - 1.0 : ax + 1.0, 0.038, 13.5);
    envGroup.add(exitHead);
  });

  // C. ESTAÇÕES DE COMBATE A INCÊNDIO & PARADA DE EMERGÊNCIA (NR-26 Vermelho & NR-12 E-Stop)
  envGroup.add(createFireSafetyStation(-29.5, -2.1, 0));
  envGroup.add(createFireSafetyStation(29.5, -2.1, 0));
  envGroup.add(createFireSafetyStation(0, -35.2, Math.PI));

  // D. COFRES DE RETENÇÃO DE CHAVES (Chave no Lacre das Docas - NR-11)
  envGroup.add(createKeyLockBox(-19.8, 1.8, 0));
  envGroup.add(createKeyLockBox(19.8, 1.8, 0));

  // E. AGENTES HUMANOS EM CONFORMIDADE COM NR-11 & NR-26 (EPI Completo)
  // 1. Sinaleiro / Balizador de Doca (Dock Marshall) com Bastão Luminoso orientando ré
  const marshall = createWorkerWithPPE(20.2, 9.8, 'dock_marshall', Math.PI);
  envGroup.add(marshall);

  // 2. Colaborador Pedestre com Colete Amarelo Alta Visibilidade na Passarela Exclusiva
  const walkingCollab = createWorkerWithPPE(-23.5, 8.5, 'pedestrian', 0);
  envGroup.add(walkingCollab);

  return envGroup;
}
