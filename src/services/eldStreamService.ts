/**
 * Commercial ELD Provider Telemetry & Live Location Stream Service
 * Connects to Samsara API v2, Geotab Cloud, Motive, or Server-Sent Events (SSE) telemetry stream.
 */

export interface ELDConfig {
  provider: 'samsara' | 'geotab' | 'motive' | 'python_physics';
  apiKey: string;
  geotabDatabase?: string;
  geotabUser?: string;
  refreshIntervalSec: number;
  status: string;
}

export interface LiveVehicleTelemetry {
  truckId: string;
  driverName: string;
  lat: number;
  lng: number;
  speedMph: number;
  bearingDegrees: number;
  reeferTempF: number;
  fuelLevelPct: number;
  dwellMinutes: number;
  geofenceState: string;
  hosRemainingHours: number;
  engineStatus: string;
  ignitionOn: boolean;
  odometerMiles: number;
  timestamp: string;
}

export async function getELDStatus(): Promise<{ success: boolean; config: ELDConfig; providerName: string }> {
  try {
    const res = await fetch('/api/eld/status');
    return await res.json();
  } catch (err: any) {
    return {
      success: false,
      config: { provider: 'samsara', apiKey: '', refreshIntervalSec: 2, status: 'offline' },
      providerName: 'SAMSARA'
    };
  }
}

export async function saveELDConfig(config: Partial<ELDConfig>) {
  try {
    const res = await fetch('/api/eld/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

export async function fetchLiveVehicleLocation(truckId: string = 'TRK-402'): Promise<LiveVehicleTelemetry | null> {
  try {
    const res = await fetch(`/api/eld/locations?truckId=${encodeURIComponent(truckId)}`);
    const data = await res.json();
    if (data.success && data.data) {
      return data.data;
    }
  } catch (err: any) {
    console.warn('ELD location fetch error:', err.message);
  }
  return null;
}

/**
 * Opens a real-time Server-Sent Events (SSE) stream for live vehicle telemetry vectors
 */
export function subscribeToELDLiveStream(
  onTelemetryUpdate: (telemetry: LiveVehicleTelemetry) => void,
  onError?: (err: any) => void
): () => void {
  const eventSource = new EventSource('/api/eld/stream');

  eventSource.onmessage = (event) => {
    try {
      const data: LiveVehicleTelemetry = JSON.parse(event.data);
      onTelemetryUpdate(data);
    } catch (e) {
      console.warn('Error parsing SSE event data:', e);
    }
  };

  eventSource.onerror = (err) => {
    if (onError) onError(err);
  };

  return () => {
    eventSource.close();
  };
}
