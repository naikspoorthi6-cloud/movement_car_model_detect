export interface BoundingBox {
  ymin: number;
  xmin: number;
  ymax: number;
  xmax: number;
}

export interface DetectedVehicle {
  id: string;
  make: string;
  model: string;
  yearRange: string;
  colorName: string;
  colorHex: string;
  category: string;
  confidence: number;
  bodyStyle?: string;
  fuelType?: string;
  movementStatus?: string;
  estimatedSpeedState?: string;
  motionVisualCues?: string[];
  distinctiveFeatures: string[];
  locationInImage?: string;
  box2d?: BoundingBox;
  summary?: string;
}

export interface AnalysisResult {
  hasVehicles: boolean;
  sceneDescription: string;
  vehiclesCount: number;
  vehicles: DetectedVehicle[];
  detectionNotes?: string;
}

export interface SampleCarImage {
  id: string;
  title: string;
  subtitle: string;
  url: string;
  badge: string;
}
