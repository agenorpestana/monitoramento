import React, { useState, useEffect, Component, ErrorInfo, ReactNode } from 'react';
import {
  MapPin,
  Camera as CameraIcon,
  Radio,
  Eye,
  Layers,
  Key,
  CheckCircle2,
  AlertTriangle,
  Compass,
  Settings,
  X,
  Maximize2,
  Trash2,
  RefreshCw,
  Lock
} from 'lucide-react';
import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow } from '@vis.gl/react-google-maps';
import { Camera } from '../types';
import { LiveStreamPlayer } from './LiveStreamPlayer';

interface MapErrorBoundaryProps {
  children: ReactNode;
  fallback: ReactNode;
}

interface MapErrorBoundaryState {
  hasError: boolean;
}

class MapErrorBoundary extends React.Component<MapErrorBoundaryProps, MapErrorBoundaryState> {
  props: MapErrorBoundaryProps;
  state: MapErrorBoundaryState;

  constructor(props: MapErrorBoundaryProps) {
    super(props);
    this.props = props;
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): MapErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Google Maps render error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

interface CameraMapProps {
  cameras: Camera[];
  onSelectCamera: (cam: Camera) => void;
  googleMapsApiKey?: string;
  onSaveApiKey?: (key: string) => void;
}

export const CameraMap: React.FC<CameraMapProps> = ({
  cameras,
  onSelectCamera,
  googleMapsApiKey = '',
  onSaveApiKey,
}) => {
  const [selectedPin, setSelectedPin] = useState<Camera | null>(cameras[0] || null);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [tempKey, setTempKey] = useState(googleMapsApiKey);

  // Sync selectedPin when cameras prop changes or is filtered
  useEffect(() => {
    if (!selectedPin && cameras.length > 0) {
      const defaultDemo = cameras.find((c) => c.isDemo || c.isLiveWebcam) || cameras[0];
      setSelectedPin(defaultDemo);
    } else if (selectedPin && !cameras.some((c) => c.id === selectedPin.id)) {
      const defaultDemo = cameras.find((c) => c.isDemo || c.isLiveWebcam) || cameras[0] || null;
      setSelectedPin(defaultDemo);
    }
  }, [cameras]);

  // Try to find API key from process.env or prop or localStorage
  const envKey =
    process.env.GOOGLE_MAPS_PLATFORM_KEY ||
    (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
    googleMapsApiKey ||
    (typeof window !== 'undefined' ? localStorage.getItem('GOOGLE_MAPS_KEY') || '' : '');

  const hasValidKey = Boolean(envKey) && envKey.trim().length > 10;

  const filteredCameras = cameras.filter((c) => {
    if (filterStatus === 'ALL') return true;
    if (filterStatus === 'DEMO') return c.isDemo || c.isLiveWebcam;
    return c.status === filterStatus;
  });

  // Calculate map center default based on cameras lat/lng
  const center = React.useMemo(() => {
    if (!cameras.length) return { lat: -17.0397, lng: -39.5312 };
    const validCams = cameras.filter((c) => c.lat && c.lng);
    if (!validCams.length) return { lat: -17.0397, lng: -39.5312 };

    const avgLat = validCams.reduce((acc, c) => acc + Number(c.lat), 0) / validCams.length;
    const avgLng = validCams.reduce((acc, c) => acc + Number(c.lng), 0) / validCams.length;
    return { lat: avgLat, lng: avgLng };
  }, [cameras]);

  const handleSaveKeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof window !== 'undefined') {
      localStorage.setItem('GOOGLE_MAPS_KEY', tempKey.trim());
    }
    if (onSaveApiKey) {
      onSaveApiKey(tempKey.trim());
    }
    setShowKeyModal(false);
  };

  const handleClearKey = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('GOOGLE_MAPS_KEY');
    }
    setTempKey('');
    if (onSaveApiKey) {
      onSaveApiKey('');
    }
    setShowKeyModal(false);
    window.location.reload();
  };

  const renderInteractiveMapFallback = () => (
    <div className="relative w-full h-full bg-slate-950 flex flex-col justify-between p-4 overflow-hidden">
      {/* Background Grid Pattern simulating vector tiles */}
      <div className="absolute inset-0 bg-[radial-gradient(#334155_1.5px,transparent_1.5px)] [background-size:28px_28px] opacity-40 pointer-events-none" />

      {/* Simulated Map Streets & Water Body */}
      <div className="absolute inset-0 pointer-events-none opacity-25">
        <div className="absolute top-1/4 w-full h-12 bg-slate-700 -rotate-2" />
        <div className="absolute top-3/4 w-full h-10 bg-slate-700 rotate-1" />
        <div className="absolute left-1/3 h-full w-12 bg-slate-700 rotate-12" />
        <div className="absolute left-2/3 h-full w-10 bg-slate-700 -rotate-6" />
        <div className="absolute top-10 right-10 w-48 h-48 rounded-full bg-cyan-900/30 blur-xl" />
      </div>

      {/* Map Top Badge */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        <span className="bg-slate-900/90 text-emerald-400 border border-emerald-500/30 text-xs font-bold px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-1.5">
          <Compass className="w-4 h-4 text-emerald-400" />
          Mapa Interativo Central ITL (Bahia - Brasil)
        </span>
        <button
          onClick={() => setShowKeyModal(true)}
          className="pointer-events-auto bg-slate-900/90 hover:bg-slate-800 text-amber-400 border border-amber-500/30 text-xs px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-1.5"
        >
          <Key className="w-3.5 h-3.5" />
          <span>{hasValidKey ? 'Editar / Limpar Chave Google Maps' : 'Ativar Google Maps Satélite'}</span>
        </button>
      </div>

      {/* Pins Container */}
      <div className="relative z-10 my-auto h-80">
        {filteredCameras.map((cam, idx) => {
          const topPositions = ['25%', '60%', '40%', '75%', '35%', '80%'];
          const leftPositions = ['20%', '65%', '45%', '28%', '78%', '50%'];

          const top = topPositions[idx % topPositions.length];
          const left = leftPositions[idx % leftPositions.length];
          const isSelected = selectedPin?.id === cam.id;

          return (
            <div
              key={cam.id}
              className="absolute transition-all duration-300"
              style={{ top, left }}
            >
              {/* Pulse coverage halo */}
              <div
                className={`absolute -inset-5 rounded-full opacity-35 animate-ping pointer-events-none ${
                  cam.status === 'ALERT'
                    ? 'bg-rose-500'
                    : cam.isDemo
                    ? 'bg-amber-400'
                    : 'bg-emerald-500'
                }`}
              />

              {/* Camera Map Pin */}
              <button
                onClick={() => setSelectedPin(cam)}
                className={`relative p-3 rounded-full shadow-2xl transition-all transform hover:scale-125 border ${
                  isSelected
                    ? 'bg-emerald-500 text-slate-950 border-white ring-4 ring-emerald-500/40 z-20 scale-125'
                    : cam.status === 'ALERT'
                    ? 'bg-rose-600 text-white border-rose-300 animate-bounce'
                    : cam.isDemo
                    ? 'bg-amber-500 text-slate-950 border-amber-200'
                    : 'bg-slate-900 text-emerald-400 border-slate-700 hover:border-emerald-400'
                }`}
                title={`${cam.name} (${cam.location})`}
              >
                <CameraIcon className="w-5 h-5" />
                {cam.isDemo && (
                  <span className="absolute -top-1 -right-1 bg-amber-400 text-slate-950 text-[9px] font-black px-1 rounded-full border border-slate-950">
                    ★
                  </span>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Footer Legend */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 bg-slate-950/80 backdrop-blur-sm p-2 rounded-xl">
        <div className="flex items-center space-x-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> Online
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Câmera Degustação
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" /> Alerta
          </span>
        </div>
        <span>Clique em um marcador para inspecionar a transmissão ao vivo</span>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 p-4 rounded-2xl shadow-xl">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-400" />
            Mapa Interativo das Câmeras de Vizinhança e Cidade
          </h2>
          <p className="text-xs text-slate-400">
            Geolocalização em tempo real de todas as câmeras de segurança e totens instalados
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowKeyModal(true)}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl border border-slate-700 flex items-center space-x-1.5 transition"
            title="Configurar Chave da API Google Maps"
          >
            <Key className={`w-3.5 h-3.5 ${hasValidKey ? 'text-emerald-400' : 'text-amber-400'}`} />
            <span>{hasValidKey ? 'Google Maps Ativo' : 'Configurar Google Maps API'}</span>
          </button>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-slate-800 text-slate-200 border border-slate-700 text-xs px-3 py-1.5 rounded-xl outline-none focus:border-emerald-500"
          >
            <option value="ALL">Todas as Câmeras ({cameras.length})</option>
            <option value="DEMO">⭐ Câmeras de Degustação</option>
            <option value="ONLINE">Online / Ativas</option>
            <option value="RECORDING">Em Gravação Nuvem</option>
            <option value="ALERT">Com Alerta de Movimento</option>
          </select>
        </div>
      </div>

      {/* API Key Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveKeySubmit}
            className="bg-slate-900 border border-emerald-500/40 p-6 rounded-2xl max-w-md w-full space-y-4 shadow-2xl relative"
          >
            <button
              type="button"
              onClick={() => setShowKeyModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Chave da API do Google Maps</h3>
                <p className="text-xs text-slate-400">Insira ou altere sua chave de API</p>
              </div>
            </div>

            <div className="space-y-1 text-xs">
              <label className="block text-slate-300 font-medium">Chave API (GOOGLE_MAPS_PLATFORM_KEY):</label>
              <input
                type="text"
                value={tempKey}
                onChange={(e) => setTempKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full bg-slate-950 border border-slate-800 text-emerald-400 font-mono px-3 py-2.5 rounded-xl outline-none focus:border-emerald-500"
              />
              <p className="text-[11px] text-slate-500 pt-1">
                Se a chave digitada estiver incorreta ou sem acesso, clique em &quot;Limpar Chave&quot; para restaurar a interface do aplicativo.
              </p>
            </div>

            <div className="flex items-center justify-between gap-2 pt-2">
              <button
                type="button"
                onClick={handleClearKey}
                className="px-3.5 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-bold text-xs rounded-xl border border-rose-500/40 flex items-center gap-1.5 transition"
                title="Remover Chave e Restaurar Painel"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span>Limpar Chave</span>
              </button>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setShowKeyModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 text-xs rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-500 text-slate-950 font-bold text-xs rounded-xl hover:bg-emerald-400 shadow-lg"
                >
                  Salvar
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Main Map + Inspector Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map View Box */}
        <div className="lg:col-span-2 relative bg-slate-950 border border-slate-800 rounded-2xl min-h-[480px] h-[520px] overflow-hidden shadow-2xl flex flex-col">
          {hasValidKey ? (
            /* Google Maps with Error Boundary catch */
            <MapErrorBoundary fallback={renderInteractiveMapFallback()}>
              <APIProvider apiKey={envKey} version="weekly">
                <Map
                  defaultCenter={center}
                  defaultZoom={13}
                  mapId="ITL_SECURITY_MAP"
                  internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                  style={{ width: '100%', height: '100%' }}
                  colorScheme="DARK"
                >
                  {filteredCameras.map((cam) => (
                    <AdvancedMarker
                      key={cam.id}
                      position={{ lat: Number(cam.lat) || center.lat, lng: Number(cam.lng) || center.lng }}
                      onClick={() => setSelectedPin(cam)}
                      title={cam.name}
                    >
                      <Pin
                        background={cam.status === 'ALERT' ? '#e11d48' : cam.isDemo ? '#f59e0b' : '#10b981'}
                        borderColor="#ffffff"
                        glyphColor="#020617"
                      />
                    </AdvancedMarker>
                  ))}
                </Map>
              </APIProvider>
            </MapErrorBoundary>
          ) : (
            renderInteractiveMapFallback()
          )}
        </div>

        {/* Selected Camera Inspector Drawer */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between space-y-4">
          {selectedPin ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-emerald-400" />
                    {selectedPin.name}
                  </h3>
                  <p className="text-xs text-slate-400">{selectedPin.location}</p>
                </div>
                <span
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                    selectedPin.isDemo
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  }`}
                >
                  {selectedPin.isDemo ? '★ DEGUSTAÇÃO' : selectedPin.status}
                </span>
              </div>

              {/* Live Player / Video Preview */}
              <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-black aspect-video shadow-lg">
                {selectedPin.isDemo || selectedPin.isLiveWebcam ? (
                  <LiveStreamPlayer key={selectedPin.id} camera={selectedPin} />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full p-5 text-center space-y-3 bg-slate-950 text-slate-300">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center shadow-lg">
                      <Lock className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-white">Transmissão Restrita a Moradores</h4>
                      <p className="text-[11px] text-slate-400 max-w-xs leading-relaxed">
                        Esta câmera faz parte do circuito fechado de segurança. Apenas câmeras com o selo de <strong className="text-amber-300">Degustação</strong> possuem transmissão aberta ao público.
                      </p>
                    </div>
                    <button
                      onClick={() => onSelectCamera(selectedPin)}
                      className="py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[11px] rounded-xl transition shadow-lg shadow-emerald-500/20 flex items-center space-x-2"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Acessar Painel para Visualizar</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Details & Specs */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5 text-xs text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-400">Coordenadas:</span>
                  <span className="font-mono text-emerald-400">
                    {selectedPin.lat}, {selectedPin.lng}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Protocolo:</span>
                  <span className="font-mono font-bold text-slate-200">{selectedPin.protocol || 'RTMP'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Qualidade:</span>
                  <span className="text-slate-200">{selectedPin.resolution} @ {selectedPin.fps} FPS</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Criptografia:</span>
                  <span className="text-emerald-400 font-semibold">AES-256 E2EE Ponta a Ponta</span>
                </div>
              </div>

              <button
                onClick={() => onSelectCamera(selectedPin)}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center space-x-2 transition shadow-lg shadow-emerald-500/20"
              >
                <Maximize2 className="w-4 h-4" />
                <span>Abrir Câmera em Modo Mosaico</span>
              </button>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500 space-y-2 my-auto">
              <CameraIcon className="w-10 h-10 mx-auto text-slate-700" />
              <p className="text-xs">Selecione uma câmera no mapa para ver a transmissão ao vivo</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
