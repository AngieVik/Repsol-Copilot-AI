
export interface GeoCoordinates {
  latitude: number;
  longitude: number;
  speed: number | null; // Speed in meters/second
  heading?: number | null;
}

export type GasStationBrand = 'repsol' | 'moeve' | 'bp' | 'galp' | 'shell' | 'all';

export interface SearchPreferences {
  destination: string; // New: Target destination city/place
  gasStationBrand: GasStationBrand;
  filterRest: boolean;
  
  isHudMode: boolean; // HUD Mode toggle

  monitorTraffic: boolean;
  trafficIntervalMinutes: number;
  
  monitorWeather: boolean;
  weatherIntervalMinutes: number;
}

// Structured Object matching Gemini Response Schema
export interface ScanResult {
  alertTriggered: boolean;
  nearestStation: {
    name: string;
    distance: string; // e.g., "4.5 km"
    locationDetails: string; // e.g., "A-6, Km 42 (Sentido Coruña)"
    isOpen: boolean;
  };
  nextStation: {
    name: string;
    distance: string;
  };
  traffic: {
    status: string; // e.g., "Fluido", "Denso", "Atasco"
    summary: string;
    delayMinutes: number;
  };
  weather: {
    condition: string;
    summary: string;
  };
  poi: {
    restAreas: string;
  };
  groundingUrls: string[];
}

export enum ScanStatus {
  IDLE = 'IDLE',
  SCANNING = 'SCANNING',
  SCANNING_BEYOND = 'SCANNING_BEYOND',
  COOLDOWN = 'COOLDOWN',
  EMERGENCY = 'EMERGENCY', // Emergency mode
}
