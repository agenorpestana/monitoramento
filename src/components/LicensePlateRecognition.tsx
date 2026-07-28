import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import {
  Car,
  Search,
  Calendar,
  Clock,
  MapPin,
  ShieldAlert,
  AlertTriangle,
  Route,
  Filter,
  RefreshCw,
  Plus,
  Trash2,
  CheckCircle2,
  Eye,
  Camera as CameraIcon,
  Download,
  Printer,
  Sparkles,
  Upload,
  ArrowRight,
  Navigation,
  FileSpreadsheet,
  Zap,
} from 'lucide-react';
import { LicensePlateRecord, Camera } from '../types';

interface LicensePlateRecognitionProps {
  cameras: Camera[];
  onTriggerAlert?: (cameraId: string, eventType: string, severity: 'CRITICAL' | 'HIGH' | 'MEDIUM') => void;
}

export const LicensePlateRecognition: React.FC<LicensePlateRecognitionProps> = ({
  cameras,
  onTriggerAlert,
}) => {
  // Main State
  const [activeSubTab, setActiveSubTab] = useState<'search' | 'route' | 'scan' | 'watchlist'>('search');
  const [records, setRecords] = useState<LicensePlateRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [stolenWatchlist, setStolenWatchlist] = useState<string[]>([]);

  // Search & Filter state
  const [searchPlate, setSearchPlate] = useState<string>('');
  const [filterStartDate, setFilterStartDate] = useState<string>('');
  const [filterEndDate, setFilterEndDate] = useState<string>('');
  const [filterCity, setFilterCity] = useState<string>('ALL');
  const [filterVehicleType, setFilterVehicleType] = useState<string>('ALL');
  const [stolenOnly, setStolenOnly] = useState<boolean>(false);

  // Selected Record & Route state
  const [selectedRecord, setSelectedRecord] = useState<LicensePlateRecord | null>(null);
  const [routePlateInput, setRoutePlateInput] = useState<string>('BRA2E19');
  const [routeSequence, setRouteSequence] = useState<LicensePlateRecord[]>([]);
  const [routeLoading, setRouteLoading] = useState<boolean>(false);

  // Watchlist modal state
  const [newStolenPlate, setNewStolenPlate] = useState<string>('');

  // LPR Scanner state
  const [scanCameraId, setScanCameraId] = useState<string>(cameras[0]?.id || '');
  const [manualPlateInput, setManualPlateInput] = useState<string>('');
  const [manualTypeInput, setManualTypeInput] = useState<'Carro' | 'Moto' | 'Caminhão' | 'SUV' | 'Van' | 'Ônibus' | 'Outro'>('Carro');
  const [manualColorInput, setManualColorInput] = useState<string>('Prata');
  const [scanning, setScanning] = useState<boolean>(false);
  const [scanSuccessMessage, setScanSuccessMessage] = useState<string | null>(null);

  // Leaflet Map Refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  // Fetch license plates list
  const fetchPlates = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchPlate.trim()) params.append('plateNumber', searchPlate.trim());
      if (filterStartDate) params.append('startDate', filterStartDate.replace('T', ' '));
      if (filterEndDate) params.append('endDate', filterEndDate.replace('T', ' '));
      if (filterCity !== 'ALL') params.append('city', filterCity);
      if (stolenOnly) params.append('stolenOnly', 'true');

      const res = await fetch(`/api/license-plates?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setRecords(data);
      }
    } catch (err) {
      console.error('Erro ao buscar placas:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch stolen watchlist
  const fetchWatchlist = async () => {
    try {
      const res = await fetch('/api/license-plates/stolen-watchlist');
      if (res.ok) {
        const data = await res.json();
        setStolenWatchlist(data);
      }
    } catch (err) {
      console.error('Erro ao buscar lista de placas roubadas:', err);
    }
  };

  useEffect(() => {
    fetchPlates();
    fetchWatchlist();
  }, [filterCity, stolenOnly]);

  // Load Route for a given plate
  const handleTraceRoute = async (plateToTrace?: string) => {
    const targetPlate = (plateToTrace || routePlateInput).trim().toUpperCase();
    if (!targetPlate) return;

    setRoutePlateInput(targetPlate);
    setActiveSubTab('route');
    setRouteLoading(true);

    try {
      const res = await fetch(`/api/license-plates/route/${encodeURIComponent(targetPlate)}`);
      if (res.ok) {
        const data = await res.json();
        setRouteSequence(data.routeSequence || []);
      }
    } catch (err) {
      console.error('Erro ao buscar trajeto do veículo:', err);
    } finally {
      setRouteLoading(false);
    }
  };

  // Leaflet Map Rendering for Vehicle Route
  useEffect(() => {
    if (activeSubTab !== 'route' || !mapContainerRef.current) return;

    // Destroy existing map if necessary
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    if (routeSequence.length === 0) return;

    // Filter valid coordinates
    const validPoints = routeSequence.filter(
      (r) => r.lat !== undefined && r.lng !== undefined && !isNaN(Number(r.lat)) && !isNaN(Number(r.lng))
    );

    const centerLat = validPoints.length > 0 ? Number(validPoints[0].lat) : -16.4497;
    const centerLng = validPoints.length > 0 ? Number(validPoints[0].lng) : -39.0647;

    const map = L.map(mapContainerRef.current, {
      center: [centerLat, centerLng],
      zoom: 11,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    const latLngs: [number, number][] = [];

    // Add Markers with Sequence Numbers
    validPoints.forEach((point, idx) => {
      const pLat = Number(point.lat);
      const pLng = Number(point.lng);
      latLngs.push([pLat, pLng]);

      const isStolen = point.isStolenOrWanted;
      const badgeBg = isStolen ? '#ef4444' : '#10b981';

      const customIcon = L.divIcon({
        className: 'custom-lpr-marker',
        html: `<div style="background-color: ${badgeBg}; color: white; border-radius: 9999px; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 3px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.4); font-size: 13px;">${idx + 1}</div>`,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
      });

      const popupContent = `
        <div style="font-family: sans-serif; padding: 6px; width: 220px;">
          <div style="font-weight: bold; font-size: 14px; margin-bottom: 4px; color: #0f172a;">${point.plateNumber}</div>
          <div style="font-size: 11px; color: #64748b; margin-bottom: 6px;">Passagem #${idx + 1}</div>
          <div style="font-size: 12px; color: #334155; margin-bottom: 2px;"><b>Câmera:</b> ${point.cameraName}</div>
          <div style="font-size: 12px; color: #334155; margin-bottom: 2px;"><b>Local:</b> ${point.city || ''} ${point.stateUf || ''}</div>
          <div style="font-size: 12px; color: #334155; margin-bottom: 6px;"><b>Data/Hora:</b> ${point.timestamp}</div>
          ${isStolen ? '<div style="background: #fee2e2; color: #dc2626; padding: 4px 8px; border-radius: 6px; font-weight: bold; font-size: 11px; text-align: center;">🚨 VEÍCULO ROUBADO</div>' : ''}
        </div>
      `;

      L.marker([pLat, pLng], { icon: customIcon }).addTo(map).bindPopup(popupContent);
    });

    // Draw Route Line connecting points
    if (latLngs.length > 1) {
      const polyline = L.polyline(latLngs, {
        color: '#10b981',
        weight: 4,
        opacity: 0.8,
        dashArray: '8, 8',
      }).addTo(map);

      map.fitBounds(polyline.getBounds(), { padding: [40, 40] });
    }

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [activeSubTab, routeSequence]);

  // Handle Add/Remove Stolen Plate Watchlist
  const handleWatchlistAction = async (plate: string, action: 'ADD' | 'REMOVE') => {
    try {
      const res = await fetch('/api/license-plates/stolen-watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plateNumber: plate, action }),
      });
      if (res.ok) {
        fetchWatchlist();
        fetchPlates();
        setNewStolenPlate('');
      }
    } catch (err) {
      console.error('Erro na watchlist:', err);
    }
  };

  // Trigger LPR Simulation / Manual scan
  const handleTriggerLprScan = async () => {
    setScanning(true);
    setScanSuccessMessage(null);
    try {
      const targetCam = cameras.find((c) => c.id === scanCameraId) || cameras[0];
      const payload: any = {
        cameraId: targetCam?.id,
        cameraName: targetCam?.name,
        city: targetCam?.city || 'Porto Seguro',
        stateUf: targetCam?.stateUf || 'BA',
        plateNumber: manualPlateInput.trim() || undefined,
        vehicleType: manualTypeInput,
        vehicleColor: manualColorInput,
      };

      const res = await fetch('/api/license-plates/detect-vision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const newRec = await res.json();
        setScanSuccessMessage(`Placa ${newRec.plateNumber} (${newRec.vehicleType} ${newRec.vehicleColor}) registrada com SUCESSO!`);
        fetchPlates();
        setManualPlateInput('');

        if (newRec.isStolenOrWanted && onTriggerAlert) {
          onTriggerAlert(newRec.cameraId, 'VEHICLE', 'CRITICAL');
        }
      }
    } catch (err) {
      console.error('Erro na leitura LPR:', err);
    } finally {
      setScanning(false);
    }
  };

  // Delete Record
  const handleDeleteRecord = async (id: string) => {
    if (!confirm('Deseja realmente excluir este registro de leitura de placa?')) return;
    try {
      const res = await fetch(`/api/license-plates/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchPlates();
        if (selectedRecord?.id === id) setSelectedRecord(null);
      }
    } catch (err) {
      console.error('Erro ao excluir registro:', err);
    }
  };

  // Get list of unique cities for filter select
  const uniqueCities = Array.from(new Set(records.map((r) => r.city).filter(Boolean)));

  // Calculate Metrics
  const totalDetections = records.length;
  const stolenCount = records.filter((r) => r.isStolenOrWanted).length;
  const avgConfidence = records.length > 0 ? Math.round(records.reduce((acc, r) => acc + (r.confidence || 95), 0) / records.length) : 98;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header & Branding Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
            <Car className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold text-white tracking-tight">Leitura de Placas (LPR / ALPR)</h1>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                Estratégia Gratuita & IA
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Reconhecimento automático de placas de veículos em tempo real, pesquisa histórica e rastreamento de rotas de veículos roubados.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => fetchPlates()}
            className="flex items-center space-x-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium transition border border-slate-700"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
            <span>Atualizar</span>
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center space-x-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium transition border border-slate-700"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimir</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Total de Placas Lidas</p>
            <p className="text-2xl font-bold text-white mt-1">{totalDetections}</p>
          </div>
          <div className="p-3 bg-slate-800 rounded-xl text-emerald-400 border border-slate-700">
            <Car className="w-5 h-5" />
          </div>
        </div>

        <div className={`p-4 rounded-2xl flex items-center justify-between border ${stolenCount > 0 ? 'bg-rose-950/40 border-rose-800/80' : 'bg-slate-900/90 border-slate-800'}`}>
          <div>
            <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Alertas de Veículo Roubado</p>
            <div className="flex items-center space-x-2 mt-1">
              <p className={`text-2xl font-bold ${stolenCount > 0 ? 'text-rose-400 animate-pulse' : 'text-white'}`}>{stolenCount}</p>
              {stolenCount > 0 && <span className="text-[10px] bg-rose-500/20 text-rose-400 px-2 py-0.5 rounded-full font-bold border border-rose-500/30">ATENÇÃO</span>}
            </div>
          </div>
          <div className={`p-3 rounded-xl border ${stolenCount > 0 ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
            <ShieldAlert className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Precisão Média LPR</p>
            <p className="text-2xl font-bold text-white mt-1">{avgConfidence}%</p>
          </div>
          <div className="p-3 bg-slate-800 rounded-xl text-teal-400 border border-slate-700">
            <Zap className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Câmeras LPR Ativas</p>
            <p className="text-2xl font-bold text-white mt-1">{cameras.length}</p>
          </div>
          <div className="p-3 bg-slate-800 rounded-xl text-indigo-400 border border-slate-700">
            <CameraIcon className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveSubTab('search')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-medium text-xs transition-all ${
            activeSubTab === 'search'
              ? 'bg-emerald-500 text-white font-semibold shadow-lg shadow-emerald-500/20'
              : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Search className="w-4 h-4" />
          <span>Pesquisa de Placas</span>
        </button>

        <button
          onClick={() => setActiveSubTab('route')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-medium text-xs transition-all ${
            activeSubTab === 'route'
              ? 'bg-emerald-500 text-white font-semibold shadow-lg shadow-emerald-500/20'
              : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Route className="w-4 h-4" />
          <span>Rastreamento de Rota (Veículo Roubado)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('scan')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-medium text-xs transition-all ${
            activeSubTab === 'scan'
              ? 'bg-emerald-500 text-white font-semibold shadow-lg shadow-emerald-500/20'
              : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Simulação / Leitura Ao Vivo</span>
        </button>

        <button
          onClick={() => setActiveSubTab('watchlist')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-medium text-xs transition-all ${
            activeSubTab === 'watchlist'
              ? 'bg-rose-600 text-white font-semibold shadow-lg shadow-rose-600/20'
              : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Veículos Restritos ({stolenWatchlist.length})</span>
        </button>
      </div>

      {/* SUB-TAB 1: PESQUISA DE PLACAS POR DATA E HORA */}
      {activeSubTab === 'search' && (
        <div className="space-y-6">
          {/* Search Bar & Filters Container */}
          <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2 text-slate-200 text-sm font-semibold">
                <Filter className="w-4 h-4 text-emerald-400" />
                <span>Filtros de Busca por Placa, Data e Hora</span>
              </div>
              <button
                onClick={() => {
                  setSearchPlate('');
                  setFilterStartDate('');
                  setFilterEndDate('');
                  setFilterCity('ALL');
                  setStolenOnly(false);
                  fetchPlates();
                }}
                className="text-xs text-slate-400 hover:text-emerald-400 transition"
              >
                Limpar Filtros
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Input Placa */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Placa do Veículo</label>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Ex: BRA2E19 ou ABC1234"
                    value={searchPlate}
                    onChange={(e) => setSearchPlate(e.target.value.toUpperCase())}
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 uppercase tracking-wider font-mono font-bold"
                  />
                </div>
              </div>

              {/* Data e Hora Inicial */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Data/Hora Inicial</label>
                <input
                  type="datetime-local"
                  value={filterStartDate}
                  onChange={(e) => setFilterStartDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Data e Hora Final */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Data/Hora Final</label>
                <input
                  type="datetime-local"
                  value={filterEndDate}
                  onChange={(e) => setFilterEndDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Filtro Cidade */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Cidade / Região</label>
                <select
                  value={filterCity}
                  onChange={(e) => setFilterCity(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="ALL">Todas as Cidades</option>
                  {uniqueCities.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-800/60">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={stolenOnly}
                  onChange={(e) => setStolenOnly(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-700 text-rose-500 focus:ring-rose-500 bg-slate-950"
                />
                <span className="text-xs text-rose-400 font-medium">Somente Alertas de Veículos Roubados/Restritos</span>
              </label>

              <button
                onClick={() => fetchPlates()}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-emerald-600/20 flex items-center space-x-2 ml-auto"
              >
                <Search className="w-4 h-4" />
                <span>Buscar no Banco de Dados</span>
              </button>
            </div>
          </div>

          {/* Results Grid / Table */}
          {loading ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 space-y-3">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-emerald-400" />
              <p className="text-sm font-medium">Buscando registros de leitura de placas no banco de dados...</p>
            </div>
          ) : records.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 space-y-3">
              <Car className="w-10 h-10 mx-auto text-slate-600" />
              <p className="text-sm font-medium text-slate-300">Nenhum registro de placa encontrado com os filtros aplicados.</p>
              <p className="text-xs text-slate-500">Tente ajustar as datas ou o termo de pesquisa por placa.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {records.map((rec) => {
                const isStolen = rec.isStolenOrWanted;
                return (
                  <div
                    key={rec.id}
                    className={`bg-slate-900 rounded-2xl overflow-hidden border transition-all hover:shadow-xl ${
                      isStolen ? 'border-rose-500/80 ring-1 ring-rose-500/40 bg-rose-950/20' : 'border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {/* Snapshot Image Container */}
                    <div className="relative h-44 bg-slate-950 overflow-hidden group">
                      <img
                        src={rec.snapshotUrl}
                        alt={`Snapshot ${rec.plateNumber}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />

                      {/* Top Plate Badge */}
                      <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700 flex items-center space-x-2">
                        {/* Mercosul Plate Graphic Representation */}
                        <div className="bg-blue-700 text-white text-[9px] font-bold px-1 py-0.5 rounded uppercase">
                          BR
                        </div>
                        <span className="font-mono text-sm font-black text-white tracking-widest">{rec.plateNumber}</span>
                      </div>

                      {/* Top Stolen Badge */}
                      {isStolen && (
                        <div className="absolute top-3 right-3 bg-rose-600 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-md shadow-lg animate-pulse flex items-center space-x-1">
                          <ShieldAlert className="w-3 h-3" />
                          <span>ROUBADO</span>
                        </div>
                      )}

                      {/* Confidence Score */}
                      <div className="absolute bottom-2 right-2 bg-slate-900/90 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-500/30">
                        {rec.confidence}% Precisão
                      </div>
                    </div>

                    {/* Card Content Details */}
                    <div className="p-4 space-y-3">
                      <div className="flex items-center justify-between text-xs text-slate-300">
                        <div className="flex items-center space-x-1.5 font-medium text-white truncate">
                          <CameraIcon className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span className="truncate">{rec.cameraName}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 pt-2 border-t border-slate-800">
                        <div className="flex items-center space-x-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          <span>{rec.timestamp}</span>
                        </div>
                        <div className="flex items-center space-x-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-500" />
                          <span>{rec.city || 'S/ Cidade'} - {rec.stateUf || 'BA'}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                        <div className="text-[11px] text-slate-300">
                          <span className="font-semibold text-white">{rec.vehicleType || 'Carro'}</span> {rec.vehicleColor ? `(${rec.vehicleColor})` : ''}
                        </div>

                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleTraceRoute(rec.plateNumber)}
                            className="p-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg text-xs font-semibold transition border border-emerald-500/30 flex items-center space-x-1"
                            title="Rastrear Trajeto deste veículo"
                          >
                            <Route className="w-3.5 h-3.5" />
                            <span>Rota</span>
                          </button>
                          <button
                            onClick={() => handleDeleteRecord(rec.id)}
                            className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg transition"
                            title="Excluir do histórico"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 2: RASTREAMENTO DE ROTA DO VEÍCULO ROUBADO */}
      {activeSubTab === 'route' && (
        <div className="space-y-6">
          {/* Route Search Header */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white flex items-center space-x-2">
                  <Route className="w-5 h-5 text-emerald-400" />
                  <span>Verificar Rota do Veículo (Investigação & Roubo)</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Exibe a sequência cronológica de câmeras por onde o veículo passou, intervalo de tempo, velocidade estimada e mapa interativo.
                </p>
              </div>

              <button
                onClick={() => handleTraceRoute()}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition flex items-center space-x-2 shadow-lg shadow-emerald-600/20"
              >
                <Search className="w-4 h-4" />
                <span>Rastrear Agora</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <input
                  type="text"
                  placeholder="Digite a placa (ex: BRA2E19)"
                  value={routePlateInput}
                  onChange={(e) => setRoutePlateInput(e.target.value.toUpperCase())}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm font-mono font-bold text-white uppercase tracking-wider focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-xs text-slate-400">Placas para teste rápido:</span>
                <button
                  onClick={() => handleTraceRoute('BRA2E19')}
                  className="px-2.5 py-1 bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-lg text-xs font-mono font-bold hover:bg-rose-500/30 transition"
                >
                  BRA2E19 (Roubado)
                </button>
                <button
                  onClick={() => handleTraceRoute('ABC1D23')}
                  className="px-2.5 py-1 bg-slate-800 text-slate-300 border border-slate-700 rounded-lg text-xs font-mono font-bold hover:bg-slate-700 transition"
                >
                  ABC1D23
                </button>
              </div>
            </div>
          </div>

          {/* Route Loading state */}
          {routeLoading ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 space-y-3">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-emerald-400" />
              <p className="text-sm font-medium">Reconstruindo histórico de passagens e coordenadas da rota...</p>
            </div>
          ) : routeSequence.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 space-y-3">
              <MapPin className="w-10 h-10 mx-auto text-slate-600" />
              <p className="text-sm font-medium text-slate-300">Nenhum registro de passagem encontrado para a placa "{routePlateInput}".</p>
              <p className="text-xs text-slate-500">Verifique se a placa foi digitada corretamente ou faça um teste com "BRA2E19".</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Map Column (2 Cols) */}
              <div className="lg:col-span-2 space-y-4">
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Navigation className="w-4 h-4 text-emerald-400" />
                      <span className="text-sm font-bold text-white">Mapa de Deslocamento do Veículo</span>
                    </div>

                    <span className="text-xs bg-slate-800 text-slate-300 px-3 py-1 rounded-full border border-slate-700">
                      {routeSequence.length} Pontos de Detecção
                    </span>
                  </div>

                  {/* Leaflet Map Box */}
                  <div
                    ref={mapContainerRef}
                    className="w-full h-[420px] rounded-xl overflow-hidden border border-slate-800 bg-slate-950 shadow-inner z-0"
                  />
                </div>
              </div>

              {/* Timeline Sequence Column (1 Col) */}
              <div className="space-y-4">
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <span className="text-sm font-bold text-white">Cronograma de Passagens</span>
                    <span className="text-xs font-mono font-bold px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded">
                      {routePlateInput}
                    </span>
                  </div>

                  <div className="space-y-4 max-h-[460px] overflow-y-auto pr-2">
                    {routeSequence.map((step, idx) => {
                      const isStolen = step.isStolenOrWanted;
                      return (
                        <div key={step.id} className="relative pl-6 pb-4 border-l-2 border-emerald-500/40 last:border-l-0 last:pb-0">
                          {/* Dot Badge */}
                          <div
                            className={`absolute -left-[13px] top-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white border-2 border-slate-900 ${
                              isStolen ? 'bg-rose-500 shadow-md shadow-rose-500/50' : 'bg-emerald-500 shadow-md shadow-emerald-500/50'
                            }`}
                          >
                            {idx + 1}
                          </div>

                          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-semibold text-white">{step.cameraName}</span>
                              <span className="text-[10px] text-slate-400 font-mono">{step.timestamp.split(' ')[1]}</span>
                            </div>

                            <p className="text-[11px] text-slate-400 flex items-center space-x-1">
                              <MapPin className="w-3 h-3 text-emerald-400" />
                              <span>{step.city} - {step.stateUf}</span>
                            </p>

                            {step.notes && (
                              <p className="text-[11px] text-slate-300 italic bg-slate-900 p-2 rounded border border-slate-800/80">
                                "{step.notes}"
                              </p>
                            )}

                            {isStolen && (
                              <div className="text-[10px] font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-1 rounded">
                                🚨 ALERTA POLICIAL DISPARADO
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 3: SIMULAÇÃO / LEITURA LPR AO VIVO */}
      {activeSubTab === 'scan' && (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-6 max-w-2xl mx-auto">
          <div className="flex items-center space-x-3 border-b border-slate-800 pb-4">
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Simulação de Leitura de Placa Ao Vivo</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Simule a captura de uma imagem de câmera ou insira uma placa manualmente para registrar no banco de dados.
              </p>
            </div>
          </div>

          {scanSuccessMessage && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-4 rounded-xl text-xs font-medium flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{scanSuccessMessage}</span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Selecionar Câmera de Captura</label>
              <select
                value={scanCameraId}
                onChange={(e) => setScanCameraId(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                {cameras.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.city || 'S/ Cidade'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Placa Detectada (Opcional - Vazio gera automática)</label>
              <input
                type="text"
                placeholder="Ex: BRA2E19 (deixe vazio para gerar teste)"
                value={manualPlateInput}
                onChange={(e) => setManualPlateInput(e.target.value.toUpperCase())}
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono font-bold text-white uppercase tracking-wider focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Tipo de Veículo</label>
                <select
                  value={manualTypeInput}
                  onChange={(e) => setManualTypeInput(e.target.value as any)}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="Carro">Carro</option>
                  <option value="Moto">Moto</option>
                  <option value="Caminhão">Caminhão</option>
                  <option value="SUV">SUV</option>
                  <option value="Van">Van</option>
                  <option value="Ônibus">Ônibus</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Cor do Veículo</label>
                <input
                  type="text"
                  value={manualColorInput}
                  onChange={(e) => setManualColorInput(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <button
              onClick={handleTriggerLprScan}
              disabled={scanning}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-emerald-600/20 flex items-center justify-center space-x-2"
            >
              <Zap className={`w-4 h-4 ${scanning ? 'animate-bounce' : ''}`} />
              <span>{scanning ? 'Processando LPR...' : 'Executar Captura & Salvar no Banco'}</span>
            </button>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: LISTA DE VEÍCULOS RESTRITOS / ALERTA DE ROUBO */}
      {activeSubTab === 'watchlist' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white flex items-center space-x-2">
                  <ShieldAlert className="w-5 h-5 text-rose-500" />
                  <span>Gerenciar Placas com Alerta de Roubo / Restrição</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Cadastre placas de veículos procurados. Quando detectadas por qualquer câmera da rede, um alerta sonoro e visual crítico será emitido instantaneamente.
                </p>
              </div>
            </div>

            {/* Form Add Stolen Plate */}
            <div className="flex items-center space-x-3 pt-2">
              <input
                type="text"
                placeholder="Cadastrar nova placa roubada (ex: PUX9876)"
                value={newStolenPlate}
                onChange={(e) => setNewStolenPlate(e.target.value.toUpperCase())}
                className="flex-1 px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono font-bold text-white uppercase tracking-wider focus:outline-none focus:border-rose-500"
              />
              <button
                onClick={() => handleWatchlistAction(newStolenPlate, 'ADD')}
                disabled={!newStolenPlate.trim()}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Adicionar à Lista</span>
              </button>
            </div>
          </div>

          {/* Watchlist Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {stolenWatchlist.map((plate) => (
              <div
                key={plate}
                className="bg-slate-900 border border-rose-500/30 p-4 rounded-2xl flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center font-bold">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-mono text-base font-black text-white tracking-widest block">{plate}</span>
                    <span className="text-[10px] text-rose-400 font-semibold">Alerta de Roubo Ativo</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleTraceRoute(plate)}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs transition"
                    title="Ver Rota"
                  >
                    <Route className="w-4 h-4 text-emerald-400" />
                  </button>
                  <button
                    onClick={() => handleWatchlistAction(plate, 'REMOVE')}
                    className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg transition"
                    title="Remover alerta"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
