import React, { useState, useEffect, useRef } from 'react';
import {
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  Camera as CameraIcon,
  Video,
  Shield,
  Layers,
  Clock,
  Play,
  RotateCw,
  Compass,
  Radio,
  Eye,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Zap,
} from 'lucide-react';
import { Camera, User } from '../types';

interface DvrMatrixViewProps {
  cameras: Camera[];
  activeUser?: User;
  onSelectCamera?: (camera: Camera) => void;
  onTriggerTestAlert?: (camId: string) => void;
}

type GridSize = '1x1' | '2x2' | '3x3' | '4x4' | 'AUTO';

export const DvrMatrixView: React.FC<DvrMatrixViewProps> = ({
  cameras,
  activeUser,
  onSelectCamera,
  onTriggerTestAlert,
}) => {
  // Filter cameras if user has custom permission allowed_camera_ids
  const userAllowedCamIds = activeUser?.allowedCameraIds || ['ALL'];
  const allowedCameras = userAllowedCamIds.includes('ALL')
    ? cameras
    : cameras.filter((c) => userAllowedCamIds.includes(c.id));

  // Layout Grid state
  const [gridSize, setGridSize] = useState<GridSize>('2x2');
  const [activePage, setActivePage] = useState<number>(0);

  // Fullscreen state
  const [fullscreenCam, setFullscreenCam] = useState<Camera | null>(null);

  // Muted states for individual cameras
  const [mutedCams, setMutedCams] = useState<Record<string, boolean>>({});

  // Active recording states per camera
  const [recordingCams, setRecordingCams] = useState<Record<string, boolean>>({});

  // Auto-Tour / Ronda Automática state
  const [isAutoTour, setIsAutoTour] = useState<boolean>(false);

  // Location filter
  const [selectedCityFilter, setSelectedCityFilter] = useState<string>('ALL');

  // Real-time Clock
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleDateString('pt-BR') + ' ' + now.toLocaleTimeString('pt-BR')
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Cities list for filter
  const availableCities = Array.from(
    new Set(allowedCameras.map((c) => c.city || 'Geral').filter(Boolean))
  );

  const filteredCameras = allowedCameras.filter((c) => {
    if (selectedCityFilter === 'ALL') return true;
    return (c.city || 'Geral') === selectedCityFilter;
  });

  // Calculate items per page based on grid size
  const getGridSlots = (): number => {
    switch (gridSize) {
      case '1x1':
        return 1;
      case '2x2':
        return 4;
      case '3x3':
        return 9;
      case '4x4':
        return 16;
      case 'AUTO':
        if (filteredCameras.length <= 1) return 1;
        if (filteredCameras.length <= 4) return 4;
        if (filteredCameras.length <= 9) return 9;
        return 16;
      default:
        return 4;
    }
  };

  const slotsPerPage = getGridSlots();
  const totalPages = Math.ceil(filteredCameras.length / slotsPerPage) || 1;

  // Auto Tour Timer
  useEffect(() => {
    if (!isAutoTour || totalPages <= 1) return;
    const tourInterval = setInterval(() => {
      setActivePage((prev) => (prev + 1) % totalPages);
    }, 8000);
    return () => clearInterval(tourInterval);
  }, [isAutoTour, totalPages]);

  // Current visible cameras on screen
  const visibleCameras = filteredCameras.slice(
    activePage * slotsPerPage,
    (activePage + 1) * slotsPerPage
  );

  // Fill array up to slotsPerPage with dummy placeholder slots if needed
  const displaySlots = Array.from({ length: slotsPerPage }, (_, i) => visibleCameras[i] || null);

  const toggleMute = (camId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setMutedCams((prev) => ({ ...prev, [camId]: !prev[camId] }));
  };

  const toggleRecording = (camId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRecordingCams((prev) => ({ ...prev, [camId]: !prev[camId] }));
  };

  const handleSnapshot = (camName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    alert(`📸 Snapshot em Alta Definição capturado com sucesso para a câmera '${camName}'!`);
  };

  // Determine grid CSS class based on slot count
  const getGridColsClass = () => {
    switch (slotsPerPage) {
      case 1:
        return 'grid-cols-1';
      case 4:
        return 'grid-cols-1 sm:grid-cols-2';
      case 9:
        return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3';
      case 16:
        return 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4';
      default:
        return 'grid-cols-2';
    }
  };

  return (
    <div className="space-y-4">
      {/* Top DVR Control Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-lg shadow-emerald-500/20 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Radio className="w-5 h-5 text-emerald-400 animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base font-bold text-white tracking-wide">
                Monitoramento Matriz DVR CFTV
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                LIVE REALTIME
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Visualização simultânea de alta performance com zoom, áudio e tela cheia instantânea.
            </p>
          </div>
        </div>

        {/* Realtime Clock & Controls */}
        <div className="flex items-center space-x-3 text-xs">
          <div className="bg-slate-950 border border-slate-800 px-3 py-2 rounded-xl text-emerald-400 font-mono font-bold flex items-center space-x-2">
            <Clock className="w-4 h-4 text-emerald-500" />
            <span>{currentTime || 'Sincronizando...'}</span>
          </div>

          {/* Location Filter */}
          {availableCities.length > 0 && (
            <select
              value={selectedCityFilter}
              onChange={(e) => {
                setSelectedCityFilter(e.target.value);
                setActivePage(0);
              }}
              className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="ALL">🌆 Todas Cidades ({allowedCameras.length})</option>
              {availableCities.map((city) => (
                <option key={city} value={city}>
                  📍 {city}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Grid Selector & DVR Actions Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Layout Buttons */}
        <div className="flex items-center space-x-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
          <span className="text-[11px] font-bold text-slate-400 px-2 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            Matriz:
          </span>

          {(['1x1', '2x2', '3x3', '4x4', 'AUTO'] as GridSize[]).map((mode) => (
            <button
              key={mode}
              onClick={() => {
                setGridSize(mode);
                setActivePage(0);
              }}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                gridSize === mode
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {mode === '1x1' && '1 Câmera (1x1)'}
              {mode === '2x2' && '4 Câmeras (2x2)'}
              {mode === '3x3' && '9 Câmeras (3x3)'}
              {mode === '4x4' && '16 Câmeras (4x4)'}
              {mode === 'AUTO' && 'Ajuste Automático'}
            </button>
          ))}
        </div>

        {/* Auto Tour & Pagination */}
        <div className="flex items-center space-x-2">
          {/* Auto Tour Button */}
          <button
            onClick={() => setIsAutoTour(!isAutoTour)}
            className={`px-3 py-1.5 rounded-xl font-bold flex items-center space-x-1.5 transition-all ${
              isAutoTour
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <RotateCw className={`w-3.5 h-3.5 ${isAutoTour ? 'animate-spin' : ''}`} />
            <span>Ronda Automática (8s)</span>
          </button>

          {/* Page Navigator */}
          {totalPages > 1 && (
            <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-slate-300 font-bold">
              <button
                disabled={activePage === 0}
                onClick={() => setActivePage((prev) => Math.max(0, prev - 1))}
                className="p-1 rounded-lg hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2 text-[11px] text-emerald-400">
                Pág {activePage + 1} de {totalPages}
              </span>
              <button
                disabled={activePage >= totalPages - 1}
                onClick={() => setActivePage((prev) => Math.min(totalPages - 1, prev + 1))}
                className="p-1 rounded-lg hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Camera Matrix Grid Container */}
      <div className={`grid ${getGridColsClass()} gap-3`}>
        {displaySlots.map((cam, index) => {
          if (!cam) {
            return (
              <div
                key={`empty-slot-${index}`}
                className="bg-slate-950 border border-slate-800/60 rounded-2xl p-6 min-h-[220px] sm:min-h-[280px] flex flex-col items-center justify-center text-slate-600 space-y-2 select-none"
              >
                <Radio className="w-8 h-8 opacity-20" />
                <span className="text-xs font-semibold opacity-40">Canal Livre DVR #{index + 1}</span>
              </div>
            );
          }

          const isMuted = mutedCams[cam.id] ?? true;
          const isRecording = recordingCams[cam.id] ?? true;

          return (
            <div
              key={cam.id}
              onClick={() => setFullscreenCam(cam)}
              className="group relative bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl min-h-[220px] sm:min-h-[280px] flex flex-col justify-between cursor-pointer hover:border-emerald-500/50 transition-all duration-300"
            >
              {/* Stream Video Poster Background */}
              <div className="absolute inset-0 z-0 bg-slate-900">
                <img
                  src={
                    cam.thumbnailUrl ||
                    'https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=800&auto=format&fit=crop&q=80'
                  }
                  alt={cam.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-slate-950/60 pointer-events-none" />
              </div>

              {/* Tile Top Bar: Camera Info & Badges */}
              <div className="relative z-10 p-3 flex items-start justify-between text-white pointer-events-none">
                <div className="space-y-1">
                  <div className="flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span className="font-extrabold text-xs tracking-wide drop-shadow text-white bg-slate-950/70 px-2 py-0.5 rounded-lg border border-slate-800">
                      {cam.name}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-300 drop-shadow font-medium pl-3">
                    📍 {cam.location || cam.city || 'Central ITL'}
                  </p>
                </div>

                <div className="flex items-center space-x-1 text-[10px] font-bold">
                  {/* REC Badge */}
                  {isRecording && (
                    <span className="bg-rose-600/90 text-white px-2 py-0.5 rounded-md flex items-center space-x-1 animate-pulse border border-rose-400/40">
                      <span className="w-1.5 h-1.5 rounded-full bg-white" />
                      <span>REC</span>
                    </span>
                  )}

                  {/* E2EE Shield */}
                  {cam.isE2EEEncrypted && (
                    <span className="bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 px-1.5 py-0.5 rounded-md flex items-center space-x-1">
                      <Shield className="w-3 h-3 text-emerald-400" />
                      <span>E2EE</span>
                    </span>
                  )}

                  {/* FPS & Protocol Badge */}
                  <span className="bg-slate-900/80 border border-slate-700/80 text-slate-300 px-1.5 py-0.5 rounded-md">
                    {cam.fps || 30} FPS
                  </span>
                </div>
              </div>

              {/* Hover Fullscreen Prompt Center Overlay */}
              <div className="relative z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center p-4 text-center pointer-events-none">
                <div className="w-12 h-12 rounded-full bg-emerald-500/80 backdrop-blur text-slate-950 flex items-center justify-center shadow-xl transform scale-90 group-hover:scale-100 transition-transform">
                  <Maximize2 className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold text-white mt-2 bg-slate-950/80 px-2.5 py-1 rounded-lg border border-slate-800 shadow">
                  Clique para Tela Cheia
                </span>
              </div>

              {/* Tile Bottom Controls Bar */}
              <div className="relative z-10 p-3 flex items-center justify-between text-slate-200 bg-slate-950/80 backdrop-blur-sm border-t border-slate-800/80">
                <div className="flex items-center space-x-2 text-[10px] font-mono text-slate-400">
                  <span className="text-emerald-400 font-bold">{cam.protocol || 'RTSP'}</span>
                  <span>•</span>
                  <span>{cam.resolution || '1080p HD'}</span>
                </div>

                {/* Quick Action Buttons */}
                <div className="flex items-center space-x-1.5" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={(e) => toggleMute(cam.id, e)}
                    title={isMuted ? 'Ativar Áudio' : 'Desativar Áudio'}
                    className={`p-1.5 rounded-lg border transition-all ${
                      !isMuted
                        ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-bold'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    {!isMuted ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                  </button>

                  <button
                    onClick={(e) => handleSnapshot(cam.name, e)}
                    title="Capturar Foto Snapshot"
                    className="p-1.5 rounded-lg bg-slate-900 text-slate-400 border border-slate-800 hover:text-white hover:bg-slate-800 transition-all"
                  >
                    <CameraIcon className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={(e) => toggleRecording(cam.id, e)}
                    title={isRecording ? 'Pausar Gravação' : 'Iniciar Gravação Nuvem'}
                    className={`p-1.5 rounded-lg border transition-all ${
                      isRecording
                        ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    <Video className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => setFullscreenCam(cam)}
                    title="Expandir em Tela Cheia"
                    className="p-1.5 rounded-lg bg-emerald-500 text-slate-950 font-bold hover:bg-emerald-400 transition-all"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* FULLSCREEN CAMERA MODAL VIEW */}
      {fullscreenCam && (
        <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex flex-col justify-between p-4 sm:p-6 animate-fade-in select-none">
          {/* Top Fullscreen Header */}
          <div className="flex items-center justify-between bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-2xl z-10">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
              <div>
                <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                  <span>{fullscreenCam.name}</span>
                  <span className="text-xs font-normal text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-md">
                    AO VIVO TELA CHEIA
                  </span>
                </h2>
                <p className="text-xs text-slate-400">
                  📍 {fullscreenCam.location || fullscreenCam.city || 'Central ITL Fibra'} • Protocolo:{' '}
                  {fullscreenCam.protocol || 'RTSP'} • IP/RTSP Encaminhado
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <div className="hidden sm:flex items-center space-x-2 text-xs font-mono bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl text-emerald-400">
                <Clock className="w-4 h-4 text-emerald-500" />
                <span>{currentTime}</span>
              </div>

              <button
                onClick={() => setFullscreenCam(null)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-lg flex items-center space-x-2 transition-all"
              >
                <Minimize2 className="w-4 h-4" />
                <span>Sair da Tela Cheia</span>
              </button>
            </div>
          </div>

          {/* Fullscreen Video Stream Container */}
          <div className="relative flex-1 my-4 bg-slate-950 border border-slate-800/80 rounded-3xl overflow-hidden shadow-2xl flex items-center justify-center">
            <img
              src={
                fullscreenCam.thumbnailUrl ||
                'https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=1200&auto=format&fit=crop&q=80'
              }
              alt={fullscreenCam.name}
              className="w-full h-full object-cover"
            />

            {/* Live Camera Overlay HUD Controls */}
            <div className="absolute top-4 left-4 bg-slate-950/80 backdrop-blur-md border border-slate-800 p-3 rounded-2xl text-xs space-y-1.5 text-white">
              <div className="flex items-center space-x-2 font-bold text-emerald-400">
                <Radio className="w-4 h-4 animate-pulse" />
                <span>QUALIDADE TRANSMISSÃO: 1080p ULTRA HD</span>
              </div>
              <div className="flex items-center space-x-3 text-[11px] text-slate-300">
                <span>FPS: {fullscreenCam.fps || 30}</span>
                <span>•</span>
                <span>Sensibilidade IA: {fullscreenCam.motionSensitivity || 7}/10</span>
                <span>•</span>
                <span>E2EE: AES-256</span>
              </div>
            </div>

            {/* PTZ Virtual Control Overlay */}
            <div className="absolute bottom-6 right-6 bg-slate-950/85 backdrop-blur-md border border-slate-800 p-4 rounded-3xl space-y-2 text-center text-white shadow-2xl">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Controle PTZ Simulado
              </span>
              <div className="grid grid-cols-3 gap-1 w-28 h-28 mx-auto items-center justify-center">
                <div />
                <button
                  onClick={() => alert('▲ Movendo Câmera para Cima')}
                  className="p-2 bg-slate-900 hover:bg-emerald-500 hover:text-slate-950 rounded-xl text-slate-300 font-bold border border-slate-800"
                >
                  ▲
                </button>
                <div />
                <button
                  onClick={() => alert('◄ Movendo Câmera para Esquerda')}
                  className="p-2 bg-slate-900 hover:bg-emerald-500 hover:text-slate-950 rounded-xl text-slate-300 font-bold border border-slate-800"
                >
                  ◄
                </button>
                <button
                  onClick={() => alert('◉ Posição Central Restaurada')}
                  className="p-2 bg-emerald-500 text-slate-950 font-bold rounded-xl text-xs"
                >
                  OK
                </button>
                <button
                  onClick={() => alert('► Movendo Câmera para Direita')}
                  className="p-2 bg-slate-900 hover:bg-emerald-500 hover:text-slate-950 rounded-xl text-slate-300 font-bold border border-slate-800"
                >
                  ►
                </button>
                <div />
                <button
                  onClick={() => alert('▼ Movendo Câmera para Baixo')}
                  className="p-2 bg-slate-900 hover:bg-emerald-500 hover:text-slate-950 rounded-xl text-slate-300 font-bold border border-slate-800"
                >
                  ▼
                </button>
                <div />
              </div>
            </div>
          </div>

          {/* Bottom Fullscreen Controls Bar */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-3">
              <button
                onClick={(e) => toggleMute(fullscreenCam.id, e)}
                className="px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 font-bold text-white hover:bg-slate-700 flex items-center space-x-2"
              >
                {!mutedCams[fullscreenCam.id] ? (
                  <>
                    <Volume2 className="w-4 h-4 text-emerald-400" />
                    <span>Áudio Ativo</span>
                  </>
                ) : (
                  <>
                    <VolumeX className="w-4 h-4 text-slate-400" />
                    <span>Ativar Áudio</span>
                  </>
                )}
              </button>

              <button
                onClick={(e) => handleSnapshot(fullscreenCam.name, e)}
                className="px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 font-bold text-white hover:bg-slate-700 flex items-center space-x-2"
              >
                <CameraIcon className="w-4 h-4 text-emerald-400" />
                <span>Capturar Foto HQ</span>
              </button>

              {onTriggerTestAlert && (
                <button
                  onClick={() => {
                    onTriggerTestAlert(fullscreenCam.id);
                    alert('🚨 Disparando Alerta de Teste de Movimento!');
                  }}
                  className="px-4 py-2 rounded-xl bg-rose-600/20 text-rose-300 border border-rose-500/40 font-bold hover:bg-rose-600/30 flex items-center space-x-2"
                >
                  <Zap className="w-4 h-4 text-rose-400" />
                  <span>Simular Alerta IA</span>
                </button>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-slate-400 font-medium">Trocar Câmera:</span>
              <div className="flex space-x-1">
                {allowedCameras.map((c, i) => (
                  <button
                    key={c.id}
                    onClick={() => setFullscreenCam(c)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      fullscreenCam.id === c.id
                        ? 'bg-emerald-500 text-slate-950'
                        : 'bg-slate-950 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    Cam {i + 1}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
