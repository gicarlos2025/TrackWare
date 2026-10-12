import { Vehicle } from '../types/warehouse';

export interface TrafficZone {
  id: string;
  name: string;
  center: { x: number; z: number };
  radius: number;
  reservedBy: string | null; // vehicle ID
}

export interface SafetyStatus {
  state: 'clear' | 'warning' | 'stop';
  distanceToObstacle: number;
  obstacleId: string | null;
}

// 4 Critical Intersection / Shared Bottleneck Resource Zones
export const WAREHOUSE_TRAFFIC_ZONES: TrafficZone[] = [
  {
    id: 'zone-docks-approach',
    name: 'Cruzamento Principal das Docas',
    center: { x: -5.5, z: 14 },
    radius: 7.5,
    reservedBy: null,
  },
  {
    id: 'zone-yard-merge',
    name: 'Convergência do Anel Viário Sul',
    center: { x: 18, z: 22 },
    radius: 6.5,
    reservedBy: null,
  },
  {
    id: 'zone-aisle-cross-north',
    name: 'Interseção Interna Corredor A/B',
    center: { x: -8, z: -14 },
    radius: 5.5,
    reservedBy: null,
  },
  {
    id: 'zone-asrs-junction',
    name: 'Entroncamento Automatizado ASRS Leste',
    center: { x: 14, z: -16 },
    radius: 6.0,
    reservedBy: null,
  },
];

export class TrafficManager {
  private zones: TrafficZone[];

  constructor() {
    this.zones = WAREHOUSE_TRAFFIC_ZONES.map((z) => ({ ...z }));
  }

  // Request reservation for a zone if vehicle is within entry threshold
  public requestZone(zoneId: string, vehicleId: string): boolean {
    const zone = this.zones.find((z) => z.id === zoneId);
    if (!zone) return true;
    if (zone.reservedBy === vehicleId) return true;
    if (zone.reservedBy === null) {
      zone.reservedBy = vehicleId;
      return true;
    }
    return false; // Zone is busy
  }

  // Release zone once vehicle has exited radius
  public releaseZone(zoneId: string, vehicleId: string) {
    const zone = this.zones.find((z) => z.id === zoneId);
    if (zone && zone.reservedBy === vehicleId) {
      zone.reservedBy = null;
    }
  }

  public getZoneForPosition(x: number, z: number): TrafficZone | null {
    for (const zone of this.zones) {
      const dx = x - zone.center.x;
      const dz = z - zone.center.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist <= zone.radius) {
        return zone;
      }
    }
    return null;
  }

  public getZones(): TrafficZone[] {
    return this.zones;
  }

  /**
   * Collision Avoidance Sensor Calculation (Virtual LiDAR safety field)
   * Evaluates if any vehicle is ahead within the forward field of view (cone)
   */
  public evaluateSafetyZone(
    vehicleId: string,
    posX: number,
    posZ: number,
    headingYaw: number,
    otherVehicles: { id: string; x: number; z: number }[]
  ): SafetyStatus {
    const criticalStopDist = 4.2; // meters
    const warningSlowDist = 7.5;  // meters
    const fovAngleHalf = Math.PI * 0.38; // ~68 degree forward sensor cone

    let minDistance = Infinity;
    let closestId: string | null = null;

    // Unit forward vector from headingYaw (front is +Z in model space)
    const forwardX = Math.sin(headingYaw);
    const forwardZ = Math.cos(headingYaw);

    for (const other of otherVehicles) {
      if (other.id === vehicleId) continue;

      const dx = other.x - posX;
      const dz = other.z - posZ;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist > warningSlowDist) continue;

      // Project onto forward direction
      const dot = (dx * forwardX + dz * forwardZ) / (dist || 1);
      const angle = Math.acos(Math.max(-1, Math.min(1, dot)));

      // If the obstacle is in front of the vehicle inside the LiDAR field of view
      if (angle <= fovAngleHalf && dot > 0.3) {
        if (dist < minDistance) {
          minDistance = dist;
          closestId = other.id;
        }
      }
    }

    if (minDistance <= criticalStopDist) {
      return {
        state: 'stop',
        distanceToObstacle: minDistance,
        obstacleId: closestId,
      };
    }

    if (minDistance <= warningSlowDist) {
      return {
        state: 'warning',
        distanceToObstacle: minDistance,
        obstacleId: closestId,
      };
    }

    return {
      state: 'clear',
      distanceToObstacle: minDistance === Infinity ? 999 : minDistance,
      obstacleId: null,
    };
  }
}
