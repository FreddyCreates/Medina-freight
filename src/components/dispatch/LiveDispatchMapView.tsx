import React, { useState, useEffect, useRef } from 'react';
import { Project, ProposedInvoice } from '../../types';
import { 
  Truck, 
  MapPin, 
  Navigation, 
  Radio, 
  Thermometer, 
  Fuel, 
  Clock, 
  AlertTriangle, 
  Send, 
  FileDown, 
  Share2, 
  CheckCircle2, 
  Search,
  ExternalLink,
  ShieldAlert,
  Settings,
  Zap,
  Key,
  Database,
  Smartphone,
  Layers,
  Compass,
  Maximize2
} from 'lucide-react';
import { generateProjectSummaryPDF } from '../../services/pdfGenerator';
import { 
  subscribeToELDLiveStream, 
  getELDStatus, 
  saveELDConfig, 
  LiveVehicleTelemetry,
  ELDConfig
} from '../../services/eldStreamService';
import L from 'leaflet';

interface LiveDispatchMapViewProps {
  projects: Project[];
  invoices: ProposedInvoice[];
  onOpenPDFSummaryModal: (project: Project) => void;
  onTriggerCheckCall: (project: Project) => void;
}

export const LiveDispatchMapView: React.FC<LiveDispatchMapViewProps> = ({
  projects,
  invoices,
  onOpenPDFSummaryModal,
  onTriggerCheckCall,
}) => {
  const [selectedLoadId, setSelectedLoadId] = useState<string>(projects[0]?.id || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [checkCallSuccess, setCheckCallSuccess] = useState(false);

  // Live Telemetry Stream State
  const [liveTelemetryMap, setLiveTelemetryMap] = useState<Record<string, LiveVehicleTelemetry>>({});
  const [showEldModal, setShowEldModal] = useState(false);
  const [eldConfig, setEldConfig] = useState<ELDConfig>({
    provider: 'samsara',
    apiKey: '',
    refreshIntervalSec: 2,
    status: 'active'
  });
  const [saveEldSuccess, setSaveEldSuccess] = useState(false);

  // REAL PHONE GPS TRACKING STATE (Live Phone Stream)
  const [isPhoneGpsTrackingActive, setIsPhoneGpsTrackingActive] = useState<boolean>(false);
  const [phoneCoords, setPhoneCoords] = useState<{
    lat: number;
    lng: number;
    speedMph: number;
    heading?: number;
    accuracy: number;
    altitude?: number;
    address?: string;
    timestamp: string;
  } | null>(null);
  const [phoneBreadcrumbs, setPhoneBreadcrumbs] = useState<Array<[number, number]>>([]);
  const [mapTileStyle, setMapTileStyle] = useState<'voyager' | 'dark' | 'osm'>('dark');

  // Leaflet Map Refs
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const phoneMarkerRef = useRef<L.CircleMarker | null>(null);
  const phoneAccuracyCircleRef = useRef<L.Circle | null>(null);
  const breadcrumbPolylineRef = useRef<L.Polyline | null>(null);
  const routePolylineRef = useRef<L.Polyline | null>(null);
  const watchPositionIdRef = useRef<number | null>(null);

  // Load initial ELD config
  useEffect(() => {
    getELDStatus().then(res => {
      if (res && res.config) setEldConfig(res.config);
    });
  }, []);

  // Subscribe to Live Server-Sent Events (SSE) ELD Stream
  useEffect(() => {
    const unsubscribe = subscribeToELDLiveStream((telemetry) => {
      setLiveTelemetryMap(prev => ({
        ...prev,
        [telemetry.truckId]: telemetry
      }));
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const selectedProject = projects.find(p => p.id === selectedLoadId) || projects[0];
  const associatedInvoice = invoices.find(i => i.id === selectedProject?.associatedInvoiceId);

  // Merge live streaming ELD telemetry over static project state
  const currentTelemetry = (selectedProject && liveTelemetryMap[selectedProject.truckId])
    ? {
        ...selectedProject.telemetry,
        lat: liveTelemetryMap[selectedProject.truckId].lat,
        lng: liveTelemetryMap[selectedProject.truckId].lng,
        speedMph: liveTelemetryMap[selectedProject.truckId].speedMph,
        reeferTempF: liveTelemetryMap[selectedProject.truckId].reeferTempF,
        fuelLevelPct: liveTelemetryMap[selectedProject.truckId].fuelLevelPct,
        dwellMinutes: liveTelemetryMap[selectedProject.truckId].dwellMinutes || selectedProject.telemetry.dwellMinutes,
        geofenceState: liveTelemetryMap[selectedProject.truckId].geofenceState || selectedProject.telemetry.geofenceState
      }
    : selectedProject?.telemetry;

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return; // already initialized

    const initialLat = currentTelemetry?.lat || 32.7767;
    const initialLng = currentTelemetry?.lng || -96.7970;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 7,
      zoomControl: true,
      attributionControl: false
    });

    const getTileUrl = (style: 'voyager' | 'dark' | 'osm') => {
      if (style === 'dark') {
        return 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
      }
      if (style === 'voyager') {
        return 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
      }
      return 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    };

    const tileLayer = L.tileLayer(getTileUrl(mapTileStyle), {
      maxZoom: 19,
      subdomains: 'abcd'
    }).addTo(map);

    tileLayerRef.current = tileLayer;
    markersLayerRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Tile Style when changed
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    if (tileLayerRef.current) {
      mapInstanceRef.current.removeLayer(tileLayerRef.current);
    }

    const getTileUrl = (style: 'voyager' | 'dark' | 'osm') => {
      if (style === 'dark') {
        return 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
      }
      if (style === 'voyager') {
        return 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
      }
      return 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    };

    const newTile = L.tileLayer(getTileUrl(mapTileStyle), {
      maxZoom: 19,
      subdomains: 'abcd'
    }).addTo(mapInstanceRef.current);

    tileLayerRef.current = newTile;
  }, [mapTileStyle]);

  // Update Truck Markers on Map
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;
    markersLayerRef.current.clearLayers();

    projects.forEach((proj) => {
      const telem = liveTelemetryMap[proj.truckId] || proj.telemetry;
      const isSelected = proj.id === selectedLoadId;
      const lat = telem?.lat || 32.54;
      const lng = telem?.lng || -97.34;

      const iconHtml = `
        <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer;">
          <div style="
            width: ${isSelected ? '34px' : '26px'};
            height: ${isSelected ? '34px' : '26px'};
            border-radius: 50%;
            background-color: ${isSelected ? '#2563eb' : '#0f172a'};
            border: 2px solid ${isSelected ? '#ffffff' : '#38bdf8'};
            box-shadow: 0 4px 12px rgba(0,0,0,0.4);
            display: flex;
            align-items: center;
            justify-content: center;
            color: #ffffff;
            font-size: 13px;
          ">
            🚚
          </div>
          <div style="
            margin-top: 2px;
            padding: 2px 5px;
            border-radius: 4px;
            background-color: rgba(15, 23, 42, 0.9);
            border: 1px solid #334155;
            color: #ffffff;
            font-size: 9px;
            font-family: monospace;
            font-weight: bold;
            white-space: nowrap;
          ">
            ${proj.truckId} · ${telem?.speedMph || 0} MPH
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: iconHtml,
        className: 'custom-truck-pin',
        iconSize: [40, 48],
        iconAnchor: [20, 24]
      });

      const marker = L.marker([lat, lng], { icon: customIcon }).addTo(markersLayerRef.current!);
      marker.bindPopup(`
        <div style="font-family: sans-serif; font-size: 12px; color: #0f172a; line-height: 1.4;">
          <strong>Load #${proj.loadNumber}</strong><br/>
          Driver: ${proj.driverName}<br/>
          Truck: ${proj.truckId} | Trailer: ${proj.trailerId}<br/>
          Corridor: ${proj.originCity} ➔ ${proj.destCity}<br/>
          Speed: <b>${telem?.speedMph} MPH</b> | Temp: <b>${telem?.reeferTempF}°F</b>
        </div>
      `);

      marker.on('click', () => {
        setSelectedLoadId(proj.id);
      });
    });

    if (selectedProject) {
      const telem = liveTelemetryMap[selectedProject.truckId] || selectedProject.telemetry;
      const truckPos: [number, number] = [telem.lat, telem.lng];

      let origCoords: [number, number] = [truckPos[0] - 0.8, truckPos[1] - 1.2];
      let destCoords: [number, number] = [truckPos[0] + 1.2, truckPos[1] + 1.8];

      if (routePolylineRef.current) {
        mapInstanceRef.current.removeLayer(routePolylineRef.current);
      }

      const routeLine = L.polyline([origCoords, truckPos, destCoords], {
        color: '#3b82f6',
        weight: 4,
        opacity: 0.8,
        dashArray: '6, 8'
      }).addTo(mapInstanceRef.current);

      routePolylineRef.current = routeLine;
      mapInstanceRef.current.setView(truckPos, mapInstanceRef.current.getZoom(), { animate: true });
    }
  }, [projects, selectedLoadId, liveTelemetryMap]);

  // LIVE PHONE GPS TRACKING
  const togglePhoneGpsTracking = () => {
    if (isPhoneGpsTrackingActive) {
      if (watchPositionIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchPositionIdRef.current);
        watchPositionIdRef.current = null;
      }
      if (phoneMarkerRef.current && mapInstanceRef.current) {
        mapInstanceRef.current.removeLayer(phoneMarkerRef.current);
        phoneMarkerRef.current = null;
      }
      if (phoneAccuracyCircleRef.current && mapInstanceRef.current) {
        mapInstanceRef.current.removeLayer(phoneAccuracyCircleRef.current);
        phoneAccuracyCircleRef.current = null;
      }
      setIsPhoneGpsTrackingActive(false);
    } else {
      if (!navigator.geolocation) return;

      setIsPhoneGpsTrackingActive(true);

      const watchId = navigator.geolocation.watchPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const speed = position.coords.speed ? Math.round(position.coords.speed * 2.23694) : 0;
          const accuracy = Math.round(position.coords.accuracy);
          const heading = position.coords.heading ?? undefined;
          const altitude = position.coords.altitude ? Math.round(position.coords.altitude * 3.28084) : undefined;
          const time = new Date().toLocaleTimeString();

          let address = undefined;
          try {
            const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
            if (geoRes.ok) {
              const geoData = await geoRes.json();
              address = geoData.display_name?.split(',').slice(0, 3).join(',');
            }
          } catch (e) {}

          setPhoneCoords({
            lat,
            lng,
            speedMph: speed,
            heading,
            accuracy,
            altitude,
            address,
            timestamp: time
          });

          setPhoneBreadcrumbs(prev => [...prev.slice(-40), [lat, lng]]);

          if (mapInstanceRef.current) {
            if (!phoneMarkerRef.current) {
              phoneMarkerRef.current = L.circleMarker([lat, lng], {
                radius: 10,
                color: '#38bdf8',
                fillColor: '#0284c7',
                fillOpacity: 1,
                weight: 3
              }).addTo(mapInstanceRef.current);

              phoneMarkerRef.current.bindPopup(`
                <div style="font-family: sans-serif; font-size: 11px;">
                  <b>📱 Driver Phone GPS Stream</b><br/>
                  Speed: ${speed} MPH<br/>
                  Accuracy: ±${accuracy}m
                </div>
              `);
            } else {
              phoneMarkerRef.current.setLatLng([lat, lng]);
            }

            if (!phoneAccuracyCircleRef.current) {
              phoneAccuracyCircleRef.current = L.circle([lat, lng], {
                radius: accuracy,
                color: '#38bdf8',
                fillColor: '#38bdf8',
                fillOpacity: 0.15,
                weight: 1
              }).addTo(mapInstanceRef.current);
            } else {
              phoneAccuracyCircleRef.current.setLatLng([lat, lng]);
              phoneAccuracyCircleRef.current.setRadius(accuracy);
            }

            if (breadcrumbPolylineRef.current) {
              breadcrumbPolylineRef.current.setLatLngs([...phoneBreadcrumbs, [lat, lng]]);
            } else {
              breadcrumbPolylineRef.current = L.polyline([[lat, lng]], {
                color: '#06b6d4',
                weight: 4,
                opacity: 0.9
              }).addTo(mapInstanceRef.current);
            }

            mapInstanceRef.current.setView([lat, lng], 14, { animate: true });
          }
        },
        (error) => {
          console.warn('Geolocation error:', error);
        },
        { enableHighAccuracy: true, maximumAge: 1000, timeout: 15000 }
      );

      watchPositionIdRef.current = watchId;
    }
  };

  const handleSendCheckCall = () => {
    if (!selectedProject) return;
    onTriggerCheckCall(selectedProject);
    setCheckCallSuccess(true);
    setTimeout(() => setCheckCallSuccess(false), 2500);
  };

  const handleDirectDownloadPDF = () => {
    if (!selectedProject) return;
    generateProjectSummaryPDF(selectedProject, associatedInvoice);
  };

  const handleSaveEldSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveELDConfig(eldConfig);
    setSaveEldSuccess(true);
    setTimeout(() => {
      setSaveEldSuccess(false);
      setShowEldModal(false);
    }, 1200);
  };

  const filteredProjects = projects.filter(p => 
    p.loadNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.driverName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 overflow-y-auto lg:overflow-hidden select-none font-sans">
      {/* Top Bar */}
      <div className="px-3 sm:px-6 py-2.5 sm:py-3.5 border-b border-slate-800 bg-slate-900/90 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shrink-0">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs px-2.5 py-0.5 rounded bg-blue-600/20 text-blue-400 font-mono font-bold border border-blue-500/30 flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
              <span>LIVE TELEMATICS</span>
            </span>
            <h1 className="text-sm sm:text-base font-bold text-white tracking-tight">
              Real Fleet Map & Driver GPS Tracking
            </h1>
          </div>
          <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
            Interactive Leaflet map with OpenStreetMap, Samsara/Motive telemetry stream, and device GPS tracking.
          </p>
        </div>

        {/* Action Toggles */}
        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
          {/* Tile Selector */}
          <div className="flex items-center bg-slate-800 p-0.5 rounded-lg border border-slate-700 text-xs">
            <button
              onClick={() => setMapTileStyle('dark')}
              className={`px-2 py-1 rounded cursor-pointer font-bold ${mapTileStyle === 'dark' ? 'bg-slate-700 text-white' : 'text-slate-400'}`}
            >
              Dark
            </button>
            <button
              onClick={() => setMapTileStyle('voyager')}
              className={`px-2 py-1 rounded cursor-pointer font-bold ${mapTileStyle === 'voyager' ? 'bg-slate-700 text-white' : 'text-slate-400'}`}
            >
              Street
            </button>
            <button
              onClick={() => setMapTileStyle('osm')}
              className={`px-2 py-1 rounded cursor-pointer font-bold ${mapTileStyle === 'osm' ? 'bg-slate-700 text-white' : 'text-slate-400'}`}
            >
              OSM
            </button>
          </div>

          {/* REAL PHONE GPS TOGGLE */}
          <button
            onClick={togglePhoneGpsTracking}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md transition-all ${
              isPhoneGpsTrackingActive
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-400 animate-pulse'
                : 'bg-blue-600 hover:bg-blue-700 text-white border border-blue-500'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>{isPhoneGpsTrackingActive ? 'GPS ON' : 'Track Phone'}</span>
          </button>

          {/* ELD Settings Button */}
          <button
            onClick={() => setShowEldModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-xs font-medium cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5 text-slate-400" />
            <span>ELD Config</span>
          </button>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden">
        {/* Left Column: Monitored In-Transit Loads Sidebar */}
        <div className="w-full lg:w-4/12 border-b lg:border-b-0 lg:border-r border-slate-800 p-3 sm:p-4 overflow-y-auto space-y-3 bg-slate-950 shrink-0 max-h-[350px] lg:max-h-full">
          <div className="flex items-center justify-between text-xs text-slate-400 pb-1">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Active Monitored Loads ({filteredProjects.length})</span>
            <span className="font-mono text-emerald-400 text-[10px]">Stream Active</span>
          </div>

          {/* Search Field */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search load, driver, city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-300 placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Phone GPS Active Info Banner if enabled */}
          {isPhoneGpsTrackingActive && phoneCoords && (
            <div className="p-3 rounded-xl bg-blue-950/80 border border-blue-700 text-xs text-left space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-blue-300 uppercase flex items-center gap-1">
                  <Smartphone className="w-3.5 h-3.5 text-blue-400" />
                  <span>Device GPS Telemetry</span>
                </span>
                <span className="font-mono text-[10px] text-emerald-400 font-bold">±{phoneCoords.accuracy}m</span>
              </div>
              <div className="font-mono font-bold text-white text-xs">
                {phoneCoords.lat.toFixed(5)}° N, {phoneCoords.lng.toFixed(5)}° W
              </div>
              {phoneCoords.address && (
                <div className="text-[11px] text-slate-300 truncate">
                  📍 {phoneCoords.address}
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            {filteredProjects.map((p) => {
              const isSelected = p.id === selectedLoadId;
              const hasDetention = p.telemetry.dwellMinutes > 120;
              const telem = liveTelemetryMap[p.truckId] || p.telemetry;

              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedLoadId(p.id)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer text-left ${
                    isSelected
                      ? 'bg-slate-900 border-blue-500 shadow-md ring-1 ring-blue-500/30'
                      : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="text-xs font-bold text-white font-mono">{p.loadNumber}</span>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded border font-mono ${
                      hasDetention ? 'text-amber-400 bg-amber-950/60 border-amber-800' : 'text-emerald-400 bg-emerald-950/60 border-emerald-800'
                    }`}>
                      {telem?.geofenceState.toUpperCase()}
                    </span>
                  </div>

                  <div className="text-xs font-semibold text-slate-200 truncate mb-1">
                    {p.customerName}
                  </div>

                  <div className="text-[11px] text-slate-400 flex items-center gap-1 mb-1.5">
                    <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                    <span className="truncate">{p.originCity} → {p.destCity}</span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1.5 border-t border-slate-800">
                    <div className="flex items-center gap-1 truncate">
                      <Truck className="w-3 h-3 text-slate-500 shrink-0" />
                      <span className="truncate">{p.driverName.split(' ')[0]} ({p.truckId})</span>
                    </div>
                    <span className="font-mono text-emerald-400 font-bold tabular-nums shrink-0">
                      {telem?.speedMph} MPH
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Real Interactive Leaflet Map & Telemetry HUD */}
        {selectedProject && (
          <div className="w-full lg:w-8/12 p-3 sm:p-5 flex flex-col justify-between overflow-y-auto bg-slate-900/40 space-y-4">
            {/* Real Leaflet Vector Map Canvas */}
            <div className="w-full h-[320px] sm:h-[420px] lg:h-96 rounded-2xl bg-slate-950 border border-slate-800 relative overflow-hidden shadow-2xl flex flex-col shrink-0">
              <div 
                ref={mapContainerRef} 
                className="w-full h-full z-0 min-h-[300px]" 
              />

              {/* Map Overlay Badges */}
              <div className="absolute top-3 left-3 z-10 flex gap-2">
                <div className="px-2.5 py-1 bg-slate-900/90 backdrop-blur-xs border border-slate-700 rounded-xl text-[11px] text-white font-mono flex items-center gap-1.5 shadow-lg">
                  <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
                  <span>
                    {currentTelemetry?.lat.toFixed(4)}° N, {currentTelemetry?.lng.toFixed(4)}° W
                  </span>
                </div>
              </div>

              <div className="absolute bottom-3 right-3 z-10 flex gap-2">
                <a
                  href={selectedProject.trackingUrl || '#'}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1 bg-slate-900/90 backdrop-blur-xs hover:bg-slate-800 border border-slate-700 rounded-xl text-xs text-blue-400 font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-lg"
                >
                  <span>Live Tracking Link</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* IoT Telemetry Gauges Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
              <div className="p-2.5 sm:p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center gap-2.5">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-blue-950 border border-blue-800 flex items-center justify-center text-blue-400 shrink-0">
                  <Thermometer className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block">Reefer Temp</span>
                  <span className="text-xs sm:text-sm font-mono font-bold text-white tabular-nums">
                    {currentTelemetry?.reeferTempF}°F
                  </span>
                </div>
              </div>

              <div className="p-2.5 sm:p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center gap-2.5">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-950 border border-emerald-800 flex items-center justify-center text-emerald-400 shrink-0">
                  <Fuel className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block">Fuel Level</span>
                  <span className="text-xs sm:text-sm font-mono font-bold text-white tabular-nums">
                    {currentTelemetry?.fuelLevelPct}%
                  </span>
                </div>
              </div>

              <div className="p-2.5 sm:p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center gap-2.5">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-amber-950 border border-amber-800 flex items-center justify-center text-amber-400 shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block">Dwell Time</span>
                  <span className="text-xs sm:text-sm font-mono font-bold text-white tabular-nums">
                    {currentTelemetry?.dwellMinutes}m
                  </span>
                </div>
              </div>

              <div className="p-2.5 sm:p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center gap-2.5">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-purple-950 border border-purple-800 flex items-center justify-center text-purple-400 shrink-0">
                  <Navigation className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block">Geofence</span>
                  <span className="text-xs sm:text-sm font-mono font-bold text-emerald-400 uppercase truncate block">
                    {currentTelemetry?.geofenceState}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="p-3 sm:p-4 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-left">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-300 font-bold">Load #{selectedProject.loadNumber}</span>
                <span className="text-xs text-slate-500">·</span>
                <span className="text-xs text-slate-400">{selectedProject.driverName} ({selectedProject.truckId})</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleSendCheckCall}
                  className="flex-1 sm:flex-none px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{checkCallSuccess ? 'Transmitted!' : 'Request Check-Call'}</span>
                </button>

                <button
                  onClick={handleDirectDownloadPDF}
                  className="flex-1 sm:flex-none px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer border border-slate-700 transition-colors"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  <span>Download Trip PDF</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ELD STREAM CONFIGURATION MODAL */}
      {showEldModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 text-left space-y-4">
            <h3 className="text-sm font-extrabold text-white">Live Telematics ELD Configuration</h3>
            <p className="text-xs text-slate-400">
              Configure real-time SSE stream from Samsara, Motive (KeepTruckin), or Geotab.
            </p>

            <form onSubmit={handleSaveEldSettings} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Provider</label>
                <select
                  value={eldConfig.provider}
                  onChange={(e) => setEldConfig({ ...eldConfig, provider: e.target.value as any })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                >
                  <option value="samsara">Samsara API Stream</option>
                  <option value="motive">Motive (KeepTruckin)</option>
                  <option value="geotab">Geotab Fleet</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">API Key / Auth Token</label>
                <input
                  type="password"
                  placeholder="samsara_api_live_..."
                  value={eldConfig.apiKey}
                  onChange={(e) => setEldConfig({ ...eldConfig, apiKey: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEldModal(false)}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg"
                >
                  {saveEldSuccess ? 'Saved!' : 'Save Configuration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
