import React, { useState, useEffect, useRef } from 'react';
import {
  Camera as CameraIcon,
  Mic,
  MicOff,
  Maximize2,
  Lock,
  Radio,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Sliders,
  Sparkles,
  ShieldAlert,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Video,
} from 'lucide-react';
import { Camera, User } from '../types';
import { LiveStreamPlayer } from './LiveStreamPlayer';

interface CameraGridProps {
  cameras: Camera[];
  activeUser: User;
  onSelectCamera: (cam: Camera) => void;
  onTriggerTestAlert: (camId: string) => void;
}

export const CameraGrid: React.FC<CameraGridProps> = ({
  cameras,
  activeUser,
  onSelectCamera,
  onTriggerTestAlert,
}) => {
  const [gridColumns, setGridColumns] = useState<number>(2); // 1, 2, 3 columns
  const [activeMicCameraId, setActiveMicCameraId] = useState<string | null>(null);
  const [mutedCameraIds, setMutedCameraIds] = useState<Record<string, boolean>>({});
  const [liveTimestamps, setLiveTimestamps] = useState<Record<string, string>>({});

  // Audio stream simulator state
  const [audioLevel, setAudioLevel] = useState<number>(0);

  // Update timestamps every second
  useEffect(() => {
    const interval = setInterval(() => {
      const nowStr = new Date().toLocaleString('pt-BR');
      const updated: Record<string, string> = {};
      cameras.forEach((c) => {
        updated[c.id] = nowStr;
      });
      setLiveTimestamps(updated);
    }, 1000);
    return () => clearInterval(interval);
  }, [cameras]);

  // Audio level simulator when 2-way audio mic is active
  useEffect(() => {
    if (!activeMicCameraId) {
      setAudioLevel(0);
      return;
    }
    const interval = setInterval(() => {
      setAudioLevel(Math.floor(Math.random() * 80) + 20);
    }, 120);
    return () => clearInterval(interval);
  }, [activeMicCameraId]);

  const toggleMic = (camId: string) => {
    if (!activeUser.customPermissions.canUseTwoWayAudio) {
      alert('Sua conta não tem permissão para usar Áudio Bidirecional (RTMP). Solicite ao Administrador.');
      return;
    }
    if (activeMicCameraId === camId) {
      setActiveMicCameraId(null);
    } else {
      setActiveMicCameraId(camId);
    }
  };

  const toggleMute = (camId: string) => {
    setMutedCameraIds((prev) => ({ ...prev, [camId]: !prev[camId] }));
  };

  return (
    <div className="space-y-4">
      {/* Header bar controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 p-3 rounded-2xl">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
            Matriz de Monitoramento Central ITL
          </h2>
          <p className="text-xs text-slate-400">
            {cameras.length} Câmeras conectadas via RTSP | Transmissão de áudio bidirecional RTMP
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* Grid Layout Switcher */}
          <span className="text-xs text-slate-400 hidden sm:inline">Visualização:</span>
          <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700">
            <button
              onClick={() => setGridColumns(1)}
              className={`px-2.5 py-1 text-xs rounded-lg font-medium transition ${
                gridColumns === 1 ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              1x1
            </button>
            <button
              onClick={() => setGridColumns(2)}
              className={`px-2.5 py-1 text-xs rounded-lg font-medium transition ${
                gridColumns === 2 ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              2x2
            </button>
            <button
              onClick={() => setGridColumns(3)}
              className={`px-2.5 py-1 text-xs rounded-lg font-medium transition ${
                gridColumns === 3 ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              3x3
            </button>
          </div>
        </div>
      </div>

      {/* Camera Stream Grid */}
      <div
        className={`grid gap-4 ${
          gridColumns === 1
            ? 'grid-cols-1'
            : gridColumns === 2
            ? 'grid-cols-1 md:grid-cols-2'
            : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
        }`}
      >
        {cameras.map((camera) => {
          const isMicActive = activeMicCameraId === camera.id;
          const isMuted = !!mutedCameraIds[camera.id];

          return (
            <div
              key={camera.id}
              className={`group relative bg-slate-900 border rounded-2xl overflow-hidden shadow-lg transition-all ${
                camera.status === 'ALERT'
                  ? 'border-rose-500 ring-2 ring-rose-500/30'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Camera Live Video Player */}
              <div className="relative aspect-video bg-black overflow-hidden flex items-center justify-center">
                <LiveStreamPlayer
                  camera={camera}
                  isMuted={isMuted}
                  onSelectCamera={onSelectCamera}
                  showOverlayControls={true}
                />

                {/* Live 2-Way RTMP Audio Active Bar */}
                {isMicActive && (
                  <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 bg-rose-950/90 border-y border-rose-500/80 py-3 px-4 flex flex-col items-center justify-center space-y-2 backdrop-blur-md z-20">
                    <div className="flex items-center space-x-2 text-rose-300 text-xs font-bold animate-pulse">
                      <Mic className="w-4 h-4 text-rose-400" />
                      <span>TRANSMITINDO ÁUDIO BIDIRECIONAL (RTMP)</span>
                    </div>

                    {/* Audio Waveform Simulator */}
                    <div className="flex items-center space-x-1 h-6">
                      {[...Array(12)].map((_, i) => {
                        const h = Math.max(4, (audioLevel * (i % 3 === 0 ? 1 : 0.6)) / 3);
                        return (
                          <div
                            key={i}
                            className="w-1 bg-rose-400 rounded-full transition-all duration-75"
                            style={{ height: `${h}px` }}
                          />
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Camera Click Overlay to Inspector */}
                <button
                  onClick={() => onSelectCamera(camera)}
                  className="absolute inset-0 w-full h-full opacity-0 hover:opacity-100 bg-slate-950/40 backdrop-blur-[2px] flex items-center justify-center transition duration-200 group"
                  title="Clique para abrir detalhes e controle PTZ completo"
                >
                  <div className="bg-slate-900/90 text-slate-100 border border-slate-700 px-4 py-2 rounded-xl flex items-center space-x-2 font-medium text-xs shadow-xl group-hover:scale-105 transition">
                    <Maximize2 className="w-4 h-4 text-emerald-400" />
                    <span>Abrir Tela Cheia & PTZ</span>
                  </div>
                </button>
              </div>

              {/* Controls Footer */}
              <div className="p-3 bg-slate-900 flex items-center justify-between border-t border-slate-800">
                <div className="truncate pr-2">
                  <p className="text-xs font-semibold text-slate-200 truncate">{camera.location}</p>
                  <p className="text-[10px] text-slate-400 truncate font-mono">
                    {camera.fullRtmpUrl || camera.rtmpUrl || camera.rtspUrl || camera.videoStreamUrl || 'Transmissão Ao Vivo'}
                  </p>
                </div>

                <div className="flex items-center space-x-1 shrink-0">
                  {/* Two-way Audio Microphone Button */}
                  {camera.twoWayAudioEnabled && (
                    <button
                      onClick={() => toggleMic(camera.id)}
                      className={`p-2 rounded-xl text-xs font-semibold flex items-center space-x-1 transition border ${
                        isMicActive
                          ? 'bg-rose-600 text-white border-rose-500 animate-pulse'
                          : 'bg-slate-800 text-slate-300 hover:text-white border-slate-700 hover:bg-slate-700'
                      }`}
                      title={isMicActive ? 'Desativar Microfone' : 'Ativar Áudio Bidirecional (Falar no Alto-Falante da Câmera)'}
                    >
                      {isMicActive ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5 text-slate-400" />}
                    </button>
                  )}

                  {/* Audio Mute Button */}
                  <button
                    onClick={() => toggleMute(camera.id)}
                    className="p-2 rounded-xl text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition"
                    title={isMuted ? 'Ativar Som da Câmera' : 'Silenciar Câmera'}
                  >
                    {isMuted ? <VolumeX className="w-3.5 h-3.5 text-slate-500" /> : <Volume2 className="w-3.5 h-3.5" />}
                  </button>

                  {/* Test Motion Alert Button */}
                  <button
                    onClick={() => onTriggerTestAlert(camera.id)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 border border-slate-700 hover:border-rose-500/40 transition"
                    title="Simular disparo de alerta de movimento agora"
                  >
                    <ShieldAlert className="w-3.5 h-3.5" />
                  </button>

                  {/* Expand Modal */}
                  <button
                    onClick={() => onSelectCamera(camera)}
                    className="p-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition"
                    title="Detalhes da câmera"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
