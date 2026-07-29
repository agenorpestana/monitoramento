import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import {
  Car,
  Search,
  ShieldAlert,
  AlertTriangle,
  Camera as CameraIcon,
  CheckCircle2,
  Clock,
  MapPin,
  RefreshCw,
  Plus,
  Trash2,
  Sliders,
  Maximize2,
  FileText,
  Volume2,
  VolumeX,
  Upload,
  Sparkles,
  Zap,
  Activity,
  PhoneCall,
  Check,
  X,
  Eye,
  Filter,
  Download,
  ShieldCheck,
  Radio,
  Layers,
} from 'lucide-react';
import { Camera, LPRDetection, StolenVehicle, LPRSettings, User } from '../types';
import { LiveStreamPlayer } from './LiveStreamPlayer';

interface LPRPlateRecognitionProps {
  cameras: Camera[];
  lprDetections: LPRDetection[];
  stolenVehicles: StolenVehicle[];
  lprSettings: LPRSettings;
  activeUser?: User;
  onDetectPlate: (payload: any) => Promise<any>;
  onAddStolenVehicle: (vehicle: Omit<StolenVehicle, 'id' | 'createdAt'>) => Promise<any>;
  onUpdateStolenStatus: (id: string, status: 'ACTIVE' | 'RECOVERED' | 'CANCELLED') => Promise<any>;
  onDeleteStolenVehicle: (id: string) => Promise<any>;
  onUpdateSettings: (settings: LPRSettings) => Promise<any>;
  onClearHistory: () => Promise<any>;
  onDeleteDetection: (id: string) => Promise<any>;
}

export const LPRPlateRecognition: React.FC<LPRPlateRecognitionProps> = ({
  cameras,
  lprDetections,
  stolenVehicles,
  lprSettings,
  activeUser,
  onDetectPlate,
  onAddStolenVehicle,
  onUpdateStolenStatus,
  onDeleteStolenVehicle,
  onUpdateSettings,
  onClearHistory,
  onDeleteDetection,
}) => {
  const [activeTab, setActiveTab] = useState<'scanner' | 'stolen' | 'history' | 'map' | 'settings'>('scanner');
  const [selectedCameraId, setSelectedCameraId] = useState<string>(cameras[0]?.id || 'cam-01');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [autoScanLoop, setAutoScanLoop] = useState<boolean>(false);
  const [soundMuted, setSoundMuted] = useState<boolean>(!lprSettings.enableAudioAlerts);
  const [latestDetection, setLatestDetection] = useState<LPRDetection | null>(lprDetections[0] || null);
  const [isThrottledBanner, setIsThrottledBanner] = useState<boolean>(false);
  const [throttledMessage, setThrottledMessage] = useState<string>('');
  const [stolenAlertModal, setStolenAlertModal] = useState<LPRDetection | null>(null);

  const [manualPlateInput, setManualPlateInput] = useState<string>('');
  const [scanErrorMessage, setScanErrorMessage] = useState<string>('');

  // Form state for Stolen Vehicle registration
  const [showAddStolenModal, setShowAddStolenModal] = useState<boolean>(false);
  const [newStolenPlate, setNewStolenPlate] = useState<string>('');
  const [newStolenModel, setNewStolenModel] = useState<string>('');
  const [newStolenColor, setNewStolenColor] = useState<string>('');
  const [newStolenOwner, setNewStolenOwner] = useState<string>('');
  const [newStolenPhone, setNewStolenPhone] = useState<string>('');
  const [newStolenReason, setNewStolenReason] = useState<string>('');
  const [newStolenUrgency, setNewStolenUrgency] = useState<'CRITICAL' | 'HIGH' | 'MEDIUM'>('CRITICAL');
  const [newStolenNotes, setNewStolenNotes] = useState<string>('');

  // History Filter States
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterCameraId, setFilterCameraId] = useState<string>('ALL');
  const [filterStolenOnly, setFilterStolenOnly] = useState<boolean>(false);

  // Uploaded / Stream Canvas Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<L.Map | null>(null);

  const selectedCam = cameras.find((c) => c.id === selectedCameraId) || cameras[0] || {
    id: 'cam-01',
    name: 'Câmera Principal LPR - Portal Norte',
    location: 'Av. Liberdade, 1200',
    lat: -17.0397,
    lng: -39.5312,
  };

  // Play police siren alert sound
  const playSiren = () => {
    if (soundMuted) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sawtooth';
      gain.gain.setValueAtTime(0.25, audioCtx.currentTime);

      const now = audioCtx.currentTime;
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.linearRampToValueAtTime(1300, now + 0.3);
      osc.frequency.linearRampToValueAtTime(600, now + 0.6);
      osc.frequency.linearRampToValueAtTime(1300, now + 0.9);
      osc.frequency.linearRampToValueAtTime(600, now + 1.2);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(now + 1.3);
    } catch (e) {
      console.warn('[LPR Sound] Sirene audio context error:', e);
    }
  };

  // Trigger plate detection
  const handleRunDetection = async (testPlateHint?: string, imageBase64Data?: string) => {
    setIsScanning(true);
    setIsThrottledBanner(false);
    setScanErrorMessage('');

    try {
      let imagePayload = imageBase64Data;

      // Extract live camera frame from player container if no explicit upload was provided
      if (!imagePayload) {
        const container = document.getElementById('lpr-player-container');
        if (container) {
          const imgEl = container.querySelector<HTMLImageElement>('img');
          const videoEl = container.querySelector<HTMLVideoElement>('video');

          if (imgEl && imgEl.complete && imgEl.naturalWidth > 0) {
            try {
              const canvas = document.createElement('canvas');
              canvas.width = imgEl.naturalWidth;
              canvas.height = imgEl.naturalHeight;
              const ctx = canvas.getContext('2d');
              if (ctx) {
                ctx.drawImage(imgEl, 0, 0);
                imagePayload = canvas.toDataURL('image/jpeg', 0.92);
              }
            } catch (e) {
              console.warn('Canvas capture error from img:', e);
            }
          } else if (videoEl && videoEl.readyState >= 2) {
            try {
              const canvas = document.createElement('canvas');
              canvas.width = videoEl.videoWidth || 1280;
              canvas.height = videoEl.videoHeight || 720;
              const ctx = canvas.getContext('2d');
              if (ctx) {
                ctx.drawImage(videoEl, 0, 0);
                imagePayload = canvas.toDataURL('image/jpeg', 0.92);
              }
            } catch (e) {
              console.warn('Canvas capture error from video:', e);
            }
          }
        }
      }

      const res = await onDetectPlate({
        imageBase64: imagePayload,
        cameraId: selectedCam.id,
        cameraName: selectedCam.name,
        latitude: selectedCam.lat,
        longitude: selectedCam.lng,
        address: selectedCam.location || 'Localização da Câmera',
        testPlateHint: testPlateHint || (manualPlateInput.trim() ? manualPlateInput.trim().toUpperCase() : undefined),
      });

      if (res) {
        if (res.success) {
          setManualPlateInput('');
          if (res.isThrottled) {
            setIsThrottledBanner(true);
            setThrottledMessage(res.message);
          } else if (res.detection) {
            setLatestDetection(res.detection);
            if (res.isStolenAlert) {
              playSiren();
              setStolenAlertModal(res.detection);
            }
          }
        } else {
          setScanErrorMessage(res.message || 'Nenhuma placa legível foi identificada na imagem.');
        }
      }
    } catch (err) {
      console.error('[LPR Scan Error]:', err);
      setScanErrorMessage('Erro ao comunicar com o servidor LPR.');
    } finally {
      setIsScanning(false);
    }
  };

  // Handle image file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      handleRunDetection(undefined, base64);
    };
    reader.readAsDataURL(file);
  };

  // Auto scanner interval simulation loop
  useEffect(() => {
    if (lprDetections && lprDetections.length > 0) {
      setLatestDetection(lprDetections[0]);
    }
  }, [lprDetections]);

  useEffect(() => {
    let interval: any = null;
    if (autoScanLoop) {
      interval = setInterval(() => {
        handleRunDetection();
      }, 5000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoScanLoop, selectedCam]);

  // Leaflet Map Initialization for LPR Locations
  useEffect(() => {
    if (activeTab === 'map' && mapContainerRef.current) {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }

      const map = L.map(mapContainerRef.current).setView(
        [selectedCam.lat || -17.0397, selectedCam.lng || -39.5312],
        14
      );

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);

      // Add Camera Markers
      cameras.forEach((cam) => {
        const hasStolenInCam = lprDetections.some(
          (d) => d.cameraId === cam.id && d.isStolenAlert
        );

        const markerHtml = `
          <div class="relative flex items-center justify-center">
            ${
              hasStolenInCam
                ? '<div class="absolute -inset-2 bg-rose-500/40 rounded-full animate-ping"></div>'
                : ''
            }
            <div class="w-8 h-8 rounded-full ${
              hasStolenInCam ? 'bg-rose-600' : 'bg-emerald-600'
            } text-white flex items-center justify-center shadow-lg border-2 border-white font-bold text-xs">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
            </div>
          </div>
        `;

        const customIcon = L.divIcon({
          html: markerHtml,
          className: 'custom-cam-pin',
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        const m = L.marker([cam.lat || -17.0397, cam.lng || -39.5312], { icon: customIcon }).addTo(map);

        const recentCamDetections = lprDetections.filter((d) => d.cameraId === cam.id).slice(0, 3);

        let popupContent = `
          <div style="font-family: sans-serif; padding: 4px; width: 220px;">
            <div style="font-weight: bold; color: #0f172a; font-size: 13px;">${cam.name}</div>
            <div style="font-size: 11px; color: #64748b; margin-bottom: 6px;">📍 ${cam.location || 'Itamaraju, BA'}</div>
            <div style="font-size: 10px; font-weight: bold; color: #334155; margin-top: 4px;">Últimas Capturas LPR:</div>
            <div style="margin-top: 4px; display: flex; flex-direction: column; gap: 4px;">
        `;

        if (recentCamDetections.length === 0) {
          popupContent += `<div style="font-size: 11px; color: #94a3b8; font-style: italic;">Nenhuma placa detectada recentemente</div>`;
        } else {
          recentCamDetections.forEach((d) => {
            popupContent += `
              <div style="display: flex; justify-content: space-between; align-items: center; background: #f1f5f9; padding: 4px 6px; rounded: 4px;">
                <span style="font-family: monospace; font-weight: bold; color: ${
                  d.isStolenAlert ? '#e11d48' : '#047857'
                };">${d.plate}</span>
                <span style="font-size: 10px; color: #64748b;">${new Date(d.timestamp).toLocaleTimeString()}</span>
              </div>
            `;
          });
        }

        popupContent += `</div></div>`;
        m.bindPopup(popupContent);
      });

      leafletMapRef.current = map;
    }
  }, [activeTab, cameras, lprDetections]);

  // Handle Stolen Vehicle Form Submit
  const handleAddStolenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStolenPlate.trim()) return;

    await onAddStolenVehicle({
      plate: newStolenPlate.toUpperCase().trim(),
      normalizedPlate: newStolenPlate.toUpperCase().replace(/[^A-Z0-9]/g, ''),
      vehicleModel: newStolenModel || 'Modelo não especificado',
      vehicleColor: newStolenColor || 'Indefinida',
      ownerName: newStolenOwner || 'Não informado',
      ownerPhone: newStolenPhone || '',
      reason: newStolenReason || 'Roubo / Furto registrado',
      urgencyLevel: newStolenUrgency,
      reportedDate: new Date().toISOString().split('T')[0],
      status: 'ACTIVE',
      notes: newStolenNotes,
    });

    setNewStolenPlate('');
    setNewStolenModel('');
    setNewStolenColor('');
    setNewStolenOwner('');
    setNewStolenPhone('');
    setNewStolenReason('');
    setNewStolenNotes('');
    setShowAddStolenModal(false);
  };

  // Filtered Detections
  const filteredDetections = lprDetections.filter((d) => {
    const matchesQuery =
      d.plate.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.vehicleType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.vehicleColor && d.vehicleColor.toLowerCase().includes(searchQuery.toLowerCase())) ||
      d.cameraName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCam = filterCameraId === 'ALL' || d.cameraId === filterCameraId;
    const matchesStolen = !filterStolenOnly || d.isStolenAlert;

    return matchesQuery && matchesCam && matchesStolen;
  });

  const totalStolenAlertsCount = lprDetections.filter((d) => d.isStolenAlert).length;
  const totalIgnoredParkedCount = lprDetections.reduce((acc, curr) => acc + (curr.ignoredParkedCount || 0), 0);

  return (
    <div className="flex-1 bg-slate-950 text-slate-100 min-h-screen p-4 md:p-6 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/40 p-5 rounded-2xl border border-slate-800 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Car className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                Reconhecimento de Placas LPR / ALPR
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  YOLO + OCR Ready
                </span>
              </h1>
              <p className="text-xs text-slate-400">
                Detecção automática de veículos, leitura de placas (Mercosul/Clássica), alarme de roubo e filtro de deduplicação para carros parados.
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setSoundMuted(!soundMuted)}
            className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center space-x-2 transition-all ${
              soundMuted
                ? 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                : 'bg-rose-500/20 text-rose-400 border-rose-500/30 hover:bg-rose-500/30 animate-pulse'
            }`}
            title={soundMuted ? 'Ativar Sirene Sonora' : 'Silenciar Alarme'}
          >
            {soundMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            <span className="hidden sm:inline">{soundMuted ? 'Sirene Muda' : 'Sirene Ativa'}</span>
          </button>

          <button
            onClick={() => setShowAddStolenModal(true)}
            className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs flex items-center space-x-2 shadow-lg shadow-rose-600/20 transition-all"
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Cadastrar Veículo Roubado</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center space-x-1 border-b border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('scanner')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 shrink-0 ${
            activeTab === 'scanner'
              ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <CameraIcon className="w-4 h-4" />
          <span>Scanner LPR ao Vivo</span>
        </button>

        <button
          onClick={() => setActiveTab('stolen')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 shrink-0 relative ${
            activeTab === 'stolen'
              ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Veículos Roubados</span>
          {stolenVehicles.filter((s) => s.status === 'ACTIVE').length > 0 && (
            <span className="bg-rose-500 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full ml-1">
              {stolenVehicles.filter((s) => s.status === 'ACTIVE').length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 shrink-0 ${
            activeTab === 'history'
              ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Histórico de Capturas ({lprDetections.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('map')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 shrink-0 ${
            activeTab === 'map'
              ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>Mapa de Ocorrências</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 shrink-0 ${
            activeTab === 'settings'
              ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Configurações LPR</span>
        </button>
      </div>

      {/* TAB 1: LIVE LPR SCANNER */}
      {activeTab === 'scanner' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Camera View & YOLO Bounding Box Overlay */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden relative group">
              {/* Camera Selector Bar */}
              <div className="p-3 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <CameraIcon className="w-4 h-4 text-emerald-400" />
                  {cameras.length > 0 ? (
                    <select
                      value={selectedCameraId}
                      onChange={(e) => setSelectedCameraId(e.target.value)}
                      className="bg-slate-900 text-white text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-700 focus:outline-none focus:border-emerald-500"
                    >
                      {cameras.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.location || 'Localização Geral'})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="text-xs font-semibold text-slate-400">Nenhuma câmera cadastrada</span>
                  )}
                </div>

                <div className="flex items-center space-x-2 text-[11px] text-slate-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>Fluxo LPR Produção</span>
                </div>
              </div>

              {/* Video / Canvas Stage */}
              <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
                {cameras.length > 0 && selectedCam ? (
                  <div id="lpr-player-container" className="w-full h-full relative">
                    <LiveStreamPlayer
                      key={selectedCam.id}
                      camera={selectedCam}
                      isMuted={true}
                      showOverlayControls={false}
                    />

                    {/* YOLO Bounding Box Overlay */}
                    <div className="absolute inset-0 pointer-events-none p-8 flex items-center justify-center">
                      <div className="relative border-2 border-emerald-400/80 rounded-lg w-3/4 h-2/3 flex items-start justify-start p-2 shadow-[0_0_15px_rgba(52,211,153,0.3)]">
                        <span className="bg-emerald-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded shadow uppercase tracking-wide">
                          LPR OCR Produção ({selectedCam.name})
                        </span>

                        {latestDetection && (
                          <div className="absolute bottom-4 right-1/4 border-2 border-yellow-400 rounded bg-black/70 px-3 py-1.5 flex items-center space-x-2 shadow-[0_0_12px_rgba(250,204,21,0.5)]">
                            <span className="bg-yellow-400 text-slate-950 text-[9px] font-bold px-1 rounded">
                              ÚLTIMA PLACA
                            </span>
                            <span className="font-mono font-black text-white text-sm tracking-widest">
                              {latestDetection.plate}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center space-y-3">
                    <CameraIcon className="w-12 h-12 mx-auto text-slate-600" />
                    <h3 className="text-sm font-bold text-white">Nenhuma Câmera Cadastrada</h3>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                      Cadastre suas câmeras na aba &quot;Câmeras ao Vivo&quot; para habilitar o escaneamento de placas em tempo real.
                    </p>
                  </div>
                )}

                {/* Scanning Spinner Overlay */}
                {isScanning && (
                  <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm flex flex-col items-center justify-center space-y-3 z-20">
                    <RefreshCw className="w-10 h-10 text-emerald-400 animate-spin" />
                    <span className="text-xs font-bold text-emerald-300 tracking-wider uppercase animate-pulse">
                      Processando Visão Computacional / OCR...
                    </span>
                  </div>
                )}
              </div>

              {/* Controls Footer */}
              <div className="p-4 bg-slate-900 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleRunDetection()}
                    disabled={isScanning || cameras.length === 0}
                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center space-x-2 shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Processar Frame LPR Agora</span>
                  </button>

                  <button
                    onClick={() => setAutoScanLoop(!autoScanLoop)}
                    disabled={cameras.length === 0}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center space-x-2 border transition-all ${
                      autoScanLoop
                        ? 'bg-teal-500/20 text-teal-300 border-teal-500/40'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                    }`}
                  >
                    <Radio className={`w-3.5 h-3.5 ${autoScanLoop ? 'animate-ping' : ''}`} />
                    <span>Auto-Leitura (5s)</span>
                  </button>

                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-xs flex items-center space-x-2 transition-all"
                  >
                    <Upload className="w-3.5 h-3.5 text-slate-400" />
                    <span>Enviar Foto</span>
                  </button>
                </div>

                <div className="text-[11px] text-slate-400">
                  📍 GPS Câmera: <span className="text-slate-200 font-mono">{selectedCam.lat || -17.0397}, {selectedCam.lng || -39.5312}</span>
                </div>
              </div>
            </div>

            {/* Error Message Banner */}
            {scanErrorMessage && (
              <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-4 flex items-center space-x-3 text-rose-300 animate-fade-in">
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                <span className="text-xs font-medium">{scanErrorMessage}</span>
              </div>
            )}

            {/* Parked Vehicle Throttled / Deduplicated Warning Banner */}
            {isThrottledBanner && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-start space-x-3 text-amber-300 animate-fade-in">
                <Clock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1 text-xs">
                  <div className="font-bold text-amber-200 flex items-center gap-2">
                    Estratégia Anti-Sobrecarga de Banco de Dados Ativa (Carro Parado)
                    <span className="bg-amber-400/20 text-amber-300 text-[10px] px-2 py-0.5 rounded-full font-bold">
                      Deduplicação ON
                    </span>
                  </div>
                  <p className="text-amber-300/90 leading-relaxed">
                    {throttledMessage ||
                      `Placa idêntica detectada no intervalo de ${lprSettings.cooldownMinutes} minutos nesta mesma câmera. A gravação foi ignorada para economizar espaço de armazenamento.`}
                  </p>
                </div>
              </div>
            )}

            {/* Manual Plate Scan / Query Control */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                <span>Entrada / Escaneamento Manual de Placa</span>
                <span className="text-[10px] text-emerald-400 font-semibold">Modo Produção</span>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (manualPlateInput.trim()) {
                    handleRunDetection(manualPlateInput.trim().toUpperCase());
                  }
                }}
                className="flex items-center space-x-2"
              >
                <input
                  type="text"
                  placeholder="Digitar placa para consultar ou escanear (ex: BRA2E19)..."
                  value={manualPlateInput}
                  onChange={(e) => setManualPlateInput(e.target.value)}
                  className="flex-1 bg-slate-950 text-white font-mono uppercase text-xs px-3.5 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-emerald-500 tracking-wider"
                />
                <button
                  type="submit"
                  disabled={isScanning || !manualPlateInput.trim()}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition-all flex items-center space-x-1.5 shrink-0"
                >
                  <Search className="w-4 h-4" />
                  <span>Consultar Placa</span>
                </button>
              </form>
            </div>
          </div>

          {/* Right Column: Latest Detection Result Snippet */}
          <div className="space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <Zap className="w-4 h-4 text-emerald-400" />
                  Última Placa Reconhecida
                </h3>
                {latestDetection?.isStolenAlert && (
                  <span className="bg-rose-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full animate-bounce">
                    🚨 ROUBADO
                  </span>
                )}
              </div>

              {latestDetection ? (
                <div className="space-y-4">
                  {/* Plate Badge Style (Brazilian Mercosul Design) */}
                  <div className="bg-gradient-to-b from-blue-900 to-blue-950 p-3 rounded-2xl border-2 border-blue-500/50 shadow-2xl space-y-2 text-center">
                    <div className="flex items-center justify-between text-[10px] font-black text-blue-200 px-2 uppercase tracking-widest border-b border-blue-800/80 pb-1">
                      <span>BRASIL</span>
                      <span className="text-yellow-400">MERCOSUL</span>
                    </div>
                    <div className="text-2xl sm:text-3xl font-mono font-black text-white tracking-widest py-1 drop-shadow">
                      {latestDetection.plate}
                    </div>
                  </div>

                  {/* Cropped Snippet Image */}
                  <div className="space-y-1">
                    <div className="text-[11px] font-bold text-slate-400 uppercase">Recorte do Veículo / Placa</div>
                    <div className="aspect-video bg-black rounded-xl overflow-hidden border border-slate-800 relative">
                      <img
                        src={latestDetection.plateImageUrl || latestDetection.carImageUrl}
                        alt="Recorte LPR"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-2 right-2 bg-slate-900/90 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-500/30">
                        {latestDetection.confidence}% Confiança
                      </div>
                    </div>
                  </div>

                  {/* Metadata List */}
                  <div className="bg-slate-950/80 rounded-xl p-3 border border-slate-800/80 space-y-2 text-xs">
                    <div className="flex justify-between border-b border-slate-800/60 pb-1.5">
                      <span className="text-slate-400">Tipo de Veículo:</span>
                      <span className="font-semibold text-slate-200">{latestDetection.vehicleType} ({latestDetection.vehicleColor})</span>
                    </div>

                    <div className="flex justify-between border-b border-slate-800/60 pb-1.5">
                      <span className="text-slate-400">Câmera de Captura:</span>
                      <span className="font-semibold text-emerald-400">{latestDetection.cameraName}</span>
                    </div>

                    <div className="flex justify-between border-b border-slate-800/60 pb-1.5">
                      <span className="text-slate-400">Data e Hora:</span>
                      <span className="font-mono text-slate-300">{new Date(latestDetection.timestamp).toLocaleString()}</span>
                    </div>

                    <div className="flex justify-between border-b border-slate-800/60 pb-1.5">
                      <span className="text-slate-400">Latitude / Longitude:</span>
                      <span className="font-mono text-slate-300">{latestDetection.latitude}, {latestDetection.longitude}</span>
                    </div>

                    <div className="flex justify-between pt-0.5">
                      <span className="text-slate-400">Deduplicações Repetidas:</span>
                      <span className="font-bold text-amber-400">{latestDetection.ignoredParkedCount || 0} leituras ignoradas</span>
                    </div>
                  </div>

                  {/* Stolen Vehicle Details if matched */}
                  {latestDetection.isStolenAlert && latestDetection.stolenDetails && (
                    <div className="bg-rose-950/50 border border-rose-800/80 rounded-xl p-3 space-y-2 text-xs text-rose-200">
                      <div className="font-bold text-rose-300 flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4 text-rose-400" />
                        Detalhes do Veículo Roubado
                      </div>
                      <div>
                        Proprietário: <strong className="text-white">{latestDetection.stolenDetails.ownerName}</strong>
                      </div>
                      <div>
                        Contato: <strong className="text-white">{latestDetection.stolenDetails.ownerPhone}</strong>
                      </div>
                      <div>
                        Motivo: <span className="text-rose-300">{latestDetection.stolenDetails.alertReason}</span>
                      </div>
                      <div className="pt-2 flex gap-2">
                        <a
                          href="tel:190"
                          className="flex-1 bg-rose-600 hover:bg-rose-500 text-white font-bold py-1.5 rounded-lg text-center text-[11px] transition-all flex items-center justify-center gap-1"
                        >
                          <PhoneCall className="w-3.5 h-3.5" />
                          Ligar 190
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-12 text-center text-slate-500 text-xs space-y-2">
                  <Car className="w-8 h-8 mx-auto text-slate-600" />
                  <div>Nenhuma leitura realizada ainda.</div>
                </div>
              )}
            </div>

            {/* Quick Stats Summary */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 grid grid-cols-2 gap-3 text-center">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div className="text-lg font-black text-rose-400">{totalStolenAlertsCount}</div>
                <div className="text-[10px] text-slate-400">Veículos Roubados</div>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div className="text-lg font-black text-amber-400">{totalIgnoredParkedCount}</div>
                <div className="text-[10px] text-slate-400">Repetições Ignoradas</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: STOLEN VEHICLES REGISTRY */}
      {activeTab === 'stolen' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Cadastro de Veículos Roubados & Procurados
                <span className="bg-rose-500/20 text-rose-400 text-xs px-2 py-0.5 rounded-full font-semibold border border-rose-500/30">
                  {stolenVehicles.filter((s) => s.status === 'ACTIVE').length} Ativos
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Cadastre placas informadas por clientes. Quando detectadas por qualquer câmera, o sistema dispara alertas imediatos.
              </p>
            </div>

            <button
              onClick={() => setShowAddStolenModal(true)}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center space-x-2 shadow-lg shadow-rose-600/20 transition-all shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Nova Placa Roubada</span>
            </button>
          </div>

          {/* Stolen Vehicles Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase font-semibold text-[10px] tracking-wider">
                  <tr>
                    <th className="p-3.5">Placa do Veículo</th>
                    <th className="p-3.5">Modelo & Cor</th>
                    <th className="p-3.5">Proprietário / Telefone</th>
                    <th className="p-3.5">Motivo / B.O.</th>
                    <th className="p-3.5">Urgência</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {stolenVehicles.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-slate-500">
                        Nenhum veículo roubado cadastrado no sistema.
                      </td>
                    </tr>
                  ) : (
                    stolenVehicles.map((sv) => (
                      <tr key={sv.id} className="hover:bg-slate-800/50 transition-colors">
                        <td className="p-3.5 font-mono font-bold text-slate-100">
                          <span className="bg-slate-950 px-2.5 py-1 rounded-md border border-slate-800 text-rose-400 font-mono text-sm tracking-wider">
                            {sv.plate}
                          </span>
                        </td>
                        <td className="p-3.5 text-slate-300 font-medium">
                          {sv.vehicleModel} ({sv.vehicleColor})
                        </td>
                        <td className="p-3.5 text-slate-300">
                          <div className="font-semibold text-slate-200">{sv.ownerName}</div>
                          <div className="text-[11px] text-slate-400">{sv.ownerPhone || 'S/ Telefone'}</div>
                        </td>
                        <td className="p-3.5 text-slate-400 max-w-xs truncate">
                          {sv.reason}
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              sv.urgencyLevel === 'CRITICAL'
                                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            }`}
                          >
                            {sv.urgencyLevel}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                              sv.status === 'ACTIVE'
                                ? 'bg-rose-600 text-white animate-pulse'
                                : sv.status === 'RECOVERED'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {sv.status === 'ACTIVE'
                              ? '🔴 EM BUSCA'
                              : sv.status === 'RECOVERED'
                              ? '🟢 RECUPERADO'
                              : '⚪ CANCELADO'}
                          </span>
                        </td>
                        <td className="p-3.5 text-right space-x-2">
                          {sv.status === 'ACTIVE' && (
                            <button
                              onClick={() => onUpdateStolenStatus(sv.id, 'RECOVERED')}
                              className="px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded-lg text-[11px] font-semibold transition-all"
                            >
                              Marcar Recuperado
                            </button>
                          )}
                          <button
                            onClick={() => onDeleteStolenVehicle(sv.id)}
                            className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-all"
                            title="Remover Registro"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: HISTORY & DEDUPLICATION */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="flex flex-1 items-center space-x-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2">
              <Search className="w-4 h-4 text-slate-500 shrink-0" />
              <input
                type="text"
                placeholder="Buscar por placa, câmera ou modelo..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent text-white text-xs w-full focus:outline-none"
              />
            </div>

            <div className="flex items-center space-x-2 overflow-x-auto">
              <select
                value={filterCameraId}
                onChange={(e) => setFilterCameraId(e.target.value)}
                className="bg-slate-950 text-slate-200 text-xs px-3 py-2 rounded-xl border border-slate-800 focus:outline-none"
              >
                <option value="ALL">Todas as Câmeras</option>
                {cameras.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              <button
                onClick={() => setFilterStolenOnly(!filterStolenOnly)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all shrink-0 ${
                  filterStolenOnly
                    ? 'bg-rose-600 text-white border-rose-500'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                Somente Roubados
              </button>

              <button
                onClick={onClearHistory}
                className="px-3 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-rose-400 border border-slate-800 text-xs font-semibold transition-all shrink-0"
              >
                Limpar Histórico
              </button>
            </div>
          </div>

          {/* Detections Data Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase font-semibold text-[10px] tracking-wider">
                  <tr>
                    <th className="p-3.5">Placa LPR</th>
                    <th className="p-3.5">Recorte do Veículo</th>
                    <th className="p-3.5">Tipo / Cor</th>
                    <th className="p-3.5">Câmera & Localização</th>
                    <th className="p-3.5">Data & Hora</th>
                    <th className="p-3.5">Confiança OCR</th>
                    <th className="p-3.5">Status Alerta</th>
                    <th className="p-3.5 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {filteredDetections.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-10 text-slate-500">
                        Nenhuma captura de placa encontrada no histórico.
                      </td>
                    </tr>
                  ) : (
                    filteredDetections.map((det) => (
                      <tr key={det.id} className="hover:bg-slate-800/50 transition-colors">
                        <td className="p-3.5 font-mono font-bold text-slate-100">
                          <span className={`px-2.5 py-1 rounded border font-mono text-xs ${
                            det.isStolenAlert
                              ? 'bg-rose-950/80 border-rose-500 text-rose-300 font-bold'
                              : 'bg-slate-950 border-slate-800 text-emerald-400 font-bold'
                          }`}>
                            {det.plate}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <div className="w-16 h-10 bg-black rounded overflow-hidden border border-slate-800">
                            <img
                              src={det.plateImageUrl || det.carImageUrl}
                              alt="Recorte"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </td>
                        <td className="p-3.5 text-slate-300">
                          {det.vehicleType} ({det.vehicleColor || 'S/ Cor'})
                        </td>
                        <td className="p-3.5">
                          <div className="font-semibold text-slate-200">{det.cameraName}</div>
                          <div className="text-[11px] text-slate-400">{det.address}</div>
                        </td>
                        <td className="p-3.5 text-slate-300 font-mono text-[11px]">
                          {new Date(det.timestamp).toLocaleString()}
                        </td>
                        <td className="p-3.5 font-bold text-emerald-400">
                          {det.confidence}%
                        </td>
                        <td className="p-3.5">
                          {det.isStolenAlert ? (
                            <span className="bg-rose-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse">
                              🚨 ROUBADO
                            </span>
                          ) : (
                            <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-emerald-500/30">
                              🟢 Normal
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => onDeleteDetection(det.id)}
                            className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-all"
                            title="Deletar da Tabela"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: LEAFLET OCCURRENCE MAP */}
      {activeTab === 'map' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex justify-between items-center">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                Mapa Georreferenciado de Leitura LPR
              </h2>
              <p className="text-xs text-slate-400">
                Pinos verdes indicam câmeras ativas. Pinos vermelhos pulsantes indicam que um veículo roubado passou na câmera.
              </p>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl h-[550px] relative">
            <div ref={mapContainerRef} className="w-full h-full z-0" />
          </div>
        </div>
      )}

      {/* TAB 5: LPR MODULE CONFIGURATION */}
      {activeTab === 'settings' && (
        <div className="max-w-3xl space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Sliders className="w-5 h-5 text-emerald-400" />
                Configurações do Filtro de Cooldown & OCR
              </h2>
              <p className="text-xs text-slate-400">
                Ajuste a tolerância para deduplicação de carros parados para evitar inchar o banco de dados.
              </p>
            </div>

            {/* Cooldown Slider for Parked Vehicles */}
            <div className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div className="flex justify-between items-center text-xs">
                <label className="font-bold text-slate-200">
                  Tempo Limite para Carros Parados (Cooldown Minutos):
                </label>
                <span className="font-mono text-emerald-400 font-bold bg-emerald-500/20 px-2 py-0.5 rounded">
                  {lprSettings.cooldownMinutes} minuto(s)
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="30"
                value={lprSettings.cooldownMinutes}
                onChange={(e) =>
                  onUpdateSettings({ ...lprSettings, cooldownMinutes: parseInt(e.target.value) })
                }
                className="w-full accent-emerald-500 cursor-pointer"
              />
              <p className="text-[11px] text-slate-400">
                Caso a mesma placa passe pela mesma câmera dentro de <strong>{lprSettings.cooldownMinutes} minuto(s)</strong>, a leitura é considerada de um veículo estacionado e o registro é ignorado para preservar a performance do banco de dados.
              </p>
            </div>

            {/* OCR Engine Selection */}
            <div className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
              <label className="text-xs font-bold text-slate-200 block">
                Motor de OCR / Leitura Escolhido:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { id: 'YOLO+PaddleOCR', label: 'PaddleOCR (Grátis)', desc: 'Ultrarrápido em CPU' },
                  { id: 'YOLO+EasyOCR', label: 'EasyOCR (Grátis)', desc: 'Leitura leve e estável' },
                  { id: 'GeminiVisionAI', label: 'Gemini Vision AI', desc: 'IA de Alta Resolução' },
                ].map((ocr) => (
                  <button
                    key={ocr.id}
                    onClick={() =>
                      onUpdateSettings({
                        ...lprSettings,
                        preferredOcrEngine: ocr.id as any,
                      })
                    }
                    className={`p-3 rounded-xl border text-left space-y-1 transition-all ${
                      lprSettings.preferredOcrEngine === ocr.id
                        ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 font-semibold'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="text-xs font-bold">{ocr.label}</div>
                    <div className="text-[10px] text-slate-500">{ocr.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Webhook Alert Options */}
            <div className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-200">
                  Notificação Automática via Webhook / Polícia:
                </label>
                <input
                  type="checkbox"
                  checked={lprSettings.autoNotifyWebhooks}
                  onChange={(e) =>
                    onUpdateSettings({ ...lprSettings, autoNotifyWebhooks: e.target.checked })
                  }
                  className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                />
              </div>

              {lprSettings.autoNotifyWebhooks && (
                <input
                  type="url"
                  placeholder="https://api.seguranca.gov.br/v1/alertas-roubo"
                  value={lprSettings.webhookUrl || ''}
                  onChange={(e) =>
                    onUpdateSettings({ ...lprSettings, webhookUrl: e.target.value })
                  }
                  className="bg-slate-900 border border-slate-800 text-xs text-white p-2.5 rounded-xl w-full focus:outline-none focus:border-emerald-500"
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD STOLEN VEHICLE */}
      {showAddStolenModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl animate-fade-in">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-500" />
                Cadastrar Veículo Roubado / Procurado
              </h3>
              <button
                onClick={() => setShowAddStolenModal(false)}
                className="text-slate-500 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddStolenSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  Placa do Veículo (Mercosul ou Antiga) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: BRA2E19 ou ABC-1234"
                  value={newStolenPlate}
                  onChange={(e) => setNewStolenPlate(e.target.value.toUpperCase())}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono font-bold tracking-wider uppercase focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Modelo do Veículo</label>
                  <input
                    type="text"
                    placeholder="Ex: Corolla Cross"
                    value={newStolenModel}
                    onChange={(e) => setNewStolenModel(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Cor</label>
                  <input
                    type="text"
                    placeholder="Ex: Prata"
                    value={newStolenColor}
                    onChange={(e) => setNewStolenColor(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Nome do Proprietário</label>
                  <input
                    type="text"
                    placeholder="Nome do cliente"
                    value={newStolenOwner}
                    onChange={(e) => setNewStolenOwner(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Telefone de Contato</label>
                  <input
                    type="text"
                    placeholder="+55 73 99999-9999"
                    value={newStolenPhone}
                    onChange={(e) => setNewStolenPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Motivo do Alerta / B.O. *</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Ex: Roubo à mão armada em via pública - B.O. 10452/2026"
                  value={newStolenReason}
                  onChange={(e) => setNewStolenReason(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Nível de Urgência</label>
                <select
                  value={newStolenUrgency}
                  onChange={(e) => setNewStolenUrgency(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none"
                >
                  <option value="CRITICAL">🔴 CRÍTICA (Fuga/Criminosos Armados)</option>
                  <option value="HIGH">🟠 ALTA (Furto Recente)</option>
                  <option value="MEDIUM">🟡 MÉDIA (Busca Judicial/Busca Apreensão)</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddStolenModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold shadow-lg shadow-rose-600/20"
                >
                  Confirmar Cadastro de Roubo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: INSTANT STOLEN DETECTED ALERT POPUP */}
      {stolenAlertModal && (
        <div className="fixed inset-0 bg-rose-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-rose-500 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl text-center relative animate-pulse">
            <div className="w-16 h-16 bg-rose-600/30 rounded-full flex items-center justify-center mx-auto text-rose-500 border border-rose-500/50">
              <ShieldAlert className="w-10 h-10 animate-bounce" />
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-black text-white uppercase tracking-wider">
                🚨 ALERTA DE VEÍCULO ROUBADO!
              </h2>
              <p className="text-xs text-rose-300">
                Uma placa cadastrada como ROUBADA foi identificada na rede de câmeras!
              </p>
            </div>

            {/* License Plate Display */}
            <div className="bg-gradient-to-r from-rose-950 to-slate-950 border-2 border-rose-500 rounded-xl p-3">
              <div className="text-3xl font-mono font-black text-rose-400 tracking-widest">
                {stolenAlertModal.plate}
              </div>
            </div>

            <div className="text-xs text-left bg-slate-950 p-3 rounded-xl space-y-1 border border-slate-800 text-slate-300">
              <div>📍 Câmera: <strong className="text-white">{stolenAlertModal.cameraName}</strong></div>
              <div>🕒 Horário: <strong className="text-white">{new Date(stolenAlertModal.timestamp).toLocaleTimeString()}</strong></div>
              {stolenAlertModal.stolenDetails && (
                <>
                  <div>👤 Proprietário: <strong className="text-white">{stolenAlertModal.stolenDetails.ownerName}</strong></div>
                  <div>📞 Contato: <strong className="text-white">{stolenAlertModal.stolenDetails.ownerPhone}</strong></div>
                  <div>📝 Motivo: <span className="text-rose-300">{stolenAlertModal.stolenDetails.alertReason}</span></div>
                </>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <a
                href="tel:190"
                className="flex-1 bg-rose-600 hover:bg-rose-500 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30"
              >
                <PhoneCall className="w-4 h-4" />
                Ligar Polícia (190)
              </a>

              <button
                onClick={() => setStolenAlertModal(null)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl"
              >
                Atendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
