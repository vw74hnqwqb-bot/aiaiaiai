export interface FallEvent {
  id: string;
  pedestrianId: string;
  name: string;
  age: number;
  status: "fall" | "impact_warning" | "normal";
  latitude: number;
  longitude: number;
  heartRate: number;
  battery: number;
  timestamp: string;
  resolved: boolean;
  resolvedAt?: string;
  notes?: string;
}

export interface Pedestrian {
  id: string; // wearable ID
  name: string;
  age: number;
  phone: string;
  notes: string;
}

export type EmergencyLevel = "critical" | "warning" | "stable";
