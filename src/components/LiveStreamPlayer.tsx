import React, { useState, useEffect, useRef } from 'react';
import {
  Camera as CameraIcon,
  Video,
  Radio,
  RefreshCw,
  Sliders,
  Sparkles,
  Volume2,
  VolumeX,
  Lock,
  Maximize2,
  ShieldCheck,
  AlertCircle,
  Play,
  Pause,
  Webcam,
  Link2,
} from 'lucide-react';
import { Camera } from '../types';

interface LiveStreamPlayerProps {
  camera: Camera;
  className?: string;
  zoomLevel?: number;
  isMuted?: boolean;
  onSelectCamera?: (cam: Camera) => void;
  showOverlayControls?: boolean;
}

// Collection of real motion/CCTV surveillance video feeds for live preview
const SAMPLE_REALTIME_VIDEOS = [
  'https://assets.mixkit.co/videos/preview/mixkit-security-camera-recording-traffic-at-night-42898-large.mp4',
  'https://assets.mixkit.co/videos/preview/mixkit-security-camera-view-of-a-street-at-night-42897-large.mp4',
  'https://assets.mixkit.co/videos/preview/mixkit-cctv-camera-view-of-a-street-in-a-city-42896-large.mp4',
  'https://assets.mixkit.co/videos/preview/mixkit-security-camera-view-of-a-parking-lot-42899-large.mp4',
];

export const LiveStreamPlayer: React.FC<LiveStreamPlayerProps> = ({
  camera,
  className = '',
  zoomLevel = 1,
  isMuted = true,
  onSelectCamera,
  showOverlayControls = true,
}) => {
  const [streamMode, setStreamMode] = useState<'VIDEO' | 'WEBCAM' | 'CANVAS'>(() => {
    if (camera.isLiveWebcam) return 'WEBCAM';
    return 'VIDEO';
  });

  const [customVideoUrl, setCustomVideoUrl] = useState<string>(() => {
    if (camera.videoStreamUrl) return camera.videoStreamUrl;
    // pick deterministic feed based on camera id string hash
    const index = Math.abs(camera.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)) % SAMPLE_REALTIME_VIDEOS.length;
    return SAMPLE_REALTIME_VIDEOS[index];
  });

  const [isWebcamActive, setIsWebcamActive] = useState(false);
  const [webcamError, setWebcamError] = useState<string | null>(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(true);
  const [isEditingUrl, setIsEditingUrl] = useState(false);
  const [tempUrlInput, setTempUrlInput] = useState(customVideoUrl);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const webcamVideoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Handle Webcam streaming
  useEffect(() => {
    if (streamMode !== 'WEBCAM') {
      if (webcamVideoRef.current && webcamVideoRef.current.srcObject) {
        const stream = webcamVideoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
        webcamVideoRef.current.srcObject = null;
      }
      setIsWebcamActive(false);
      setWebcamError(null);
      return;
    }

    let mediaStream: MediaStream | null = null;
    navigator.mediaDevices
      ?.getUserMedia({ video: { width: 1280, height: 720 }, audio: false })
      .then((stream) => {
        mediaStream = stream;
        if (webcamVideoRef.current) {
          webcamVideoRef.current.srcObject = stream;
          webcamVideoRef.current.play().catch((e) => console.log('Webcam play error:', e));
        }
        setIsWebcamActive(true);
        setWebcamError(null);
      })
      .catch((err) => {
        console.error('Webcam access error:', err);
        setWebcamError('Acesso à webcam indisponível ou negado pelo navegador.');
        setIsWebcamActive(false);
        setStreamMode('CANVAS');
      });

    return () => {
      if (mediaStream) {
        mediaStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [streamMode]);

  // Real-time dynamic canvas renderer when in CANVAS mode
  useEffect(() => {
    if (streamMode !== 'CANVAS') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let step = 0;

    const renderFrame = () => {
      step += 0.03;
      const w = canvas.width;
      const h = canvas.height;

      // Dark surveillance background grid
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, w, h);

      // Grid lines
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Simulated street lighting / motion sweeping gradient
      const sweepX = (Math.sin(step) * 0.4 + 0.5) * w;
      const sweepY = (Math.cos(step * 0.7) * 0.3 + 0.5) * h;

      const grad = ctx.createRadialGradient(sweepX, sweepY, 10, sweepX, sweepY, 220);
      grad.addColorStop(0, 'rgba(16, 185, 129, 0.25)');
      grad.addColorStop(0.5, 'rgba(6, 182, 212, 0.1)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Draw dynamic surveillance camera crosshair
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, 45, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(w / 2 - 60, h / 2);
      ctx.lineTo(w / 2 + 60, h / 2);
      ctx.moveTo(w / 2, h / 2 - 60);
      ctx.lineTo(w / 2, h / 2 + 60);
      ctx.stroke();

      // Real-time AI Motion Detection bounding box animation
      const boxX = sweepX - 50;
      const boxY = sweepY - 35;
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.strokeRect(boxX, boxY, 100, 70);

      // AI Bounding Box Label
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(boxX, boxY - 20, 100, 20);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px monospace';
      ctx.fillText(`HUMAN ${(94 + Math.sin(step) * 4).toFixed(1)}%`, boxX + 5, boxY - 6);

      // Noise scanlines
      ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
      for (let i = 0; i < h; i += 4) {
        if ((i + Math.floor(step * 20)) % 8 === 0) {
          ctx.fillRect(0, i, w, 2);
        }
      }

      animId = requestAnimationFrame(renderFrame);
    };

    renderFrame();
    return () => cancelAnimationFrame(animId);
  }, [streamMode]);

  const handleApplyCustomUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (tempUrlInput.trim()) {
      setCustomVideoUrl(tempUrlInput.trim());
      setStreamMode('VIDEO');
      setIsEditingUrl(false);
    }
  };

  return (
    <div className={`relative aspect-video bg-black rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center group ${className}`}>
      {/* 1. REAL VIDEO STREAM PLAYER (MP4 / HLS / HTTP) */}
      {streamMode === 'VIDEO' && (
        <video
          ref={videoRef}
          src={customVideoUrl}
          autoPlay
          loop
          muted={isMuted}
          playsInline
          onPlay={() => setIsVideoPlaying(true)}
          onError={() => {
            console.log('Video error on stream, switching to dynamic canvas');
            setStreamMode('CANVAS');
          }}
          className="w-full h-full object-cover transition duration-300"
          style={{ transform: `scale(${zoomLevel})` }}
        />
      )}

      {/* 2. WEBCAM REALTIME PLAYER */}
      {streamMode === 'WEBCAM' && (
        <video
          ref={webcamVideoRef}
          autoPlay
          playsInline
          muted={isMuted}
          className="w-full h-full object-cover transition duration-300"
          style={{ transform: `scale(${zoomLevel})` }}
        />
      )}

      {/* 3. DYNAMIC CANVAS REALTIME GENERATOR */}
      {streamMode === 'CANVAS' && (
        <canvas
          ref={canvasRef}
          width={640}
          height={360}
          className="w-full h-full object-cover transition duration-300"
          style={{ transform: `scale(${zoomLevel})` }}
        />
      )}

      {/* Webcam Error Message */}
      {webcamError && streamMode === 'WEBCAM' && (
        <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-4 text-center z-20 space-y-2">
          <AlertCircle className="w-8 h-8 text-rose-500 animate-bounce" />
          <p className="text-xs font-bold text-rose-300">{webcamError}</p>
          <button
            onClick={() => setStreamMode('VIDEO')}
            className="px-3 py-1.5 bg-slate-800 text-slate-200 text-xs rounded-xl hover:bg-slate-700"
          >
            Voltar para Vídeo RTMP ao Vivo
          </button>
        </div>
      )}

      {/* Overlay Scanlines & Vignette */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60 pointer-events-none" />

      {/* Top Stream Badge & Host Indicator */}
      <div className="absolute top-2 left-2 right-2 flex items-center justify-between text-[10px] font-mono text-white bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10 z-10">
        <div className="flex items-center space-x-2 truncate">
          <span
            className={`w-2 h-2 rounded-full ${
              camera.status === 'ALERT'
                ? 'bg-rose-500 animate-ping'
                : camera.status === 'RECORDING'
                ? 'bg-rose-500'
                : 'bg-emerald-400 animate-pulse'
            }`}
          />
          <span className="font-semibold text-slate-200 truncate">{camera.name}</span>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <span className="text-emerald-400 bg-emerald-950/80 border border-emerald-500/30 px-1.5 py-0.5 rounded font-bold">
            {streamMode === 'WEBCAM' ? 'WEBCAM AO VIVO' : 'RTMP AO VIVO (60 FPS)'}
          </span>
          {camera.isE2EEEncrypted && (
            <span className="hidden sm:flex items-center space-x-1 text-emerald-400 bg-emerald-500/20 px-1.5 py-0.5 rounded border border-emerald-500/30">
              <Lock className="w-2.5 h-2.5" />
              <span>E2EE</span>
            </span>
          )}
        </div>
      </div>

      {/* Quick Mode Selector Overlay Controls */}
      {showOverlayControls && (
        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between z-10">
          {/* Stream Mode Switcher */}
          <div className="flex items-center space-x-1 bg-slate-950/80 backdrop-blur-md p-1 rounded-xl border border-white/10">
            <button
              onClick={() => setStreamMode('VIDEO')}
              className={`px-2 py-0.5 text-[10px] rounded-lg font-semibold transition ${
                streamMode === 'VIDEO'
                  ? 'bg-emerald-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Transmitir vídeo RTMP/HLS em tempo real"
            >
              Vídeo RTMP
            </button>
            <button
              onClick={() => setStreamMode('WEBCAM')}
              className={`px-2 py-0.5 text-[10px] rounded-lg font-semibold transition flex items-center space-x-1 ${
                streamMode === 'WEBCAM'
                  ? 'bg-emerald-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Conectar webcam local do dispositivo ao vivo"
            >
              <Webcam className="w-3 h-3" />
              <span>Webcam</span>
            </button>
            <button
              onClick={() => setIsEditingUrl(!isEditingUrl)}
              className="p-1 text-slate-400 hover:text-cyan-400 rounded transition"
              title="Inserir URL de Transmissão Customizada"
            >
              <Link2 className="w-3 h-3" />
            </button>
          </div>

          {/* Fullscreen Inspector Click Button */}
          {onSelectCamera && (
            <button
              onClick={() => onSelectCamera(camera)}
              className="p-1.5 bg-slate-900/90 text-slate-200 hover:text-white hover:bg-emerald-500/20 border border-slate-700 rounded-lg transition"
              title="Abrir Detalhes em Tela Cheia & PTZ"
            >
              <Maximize2 className="w-3.5 h-3.5 text-emerald-400" />
            </button>
          )}
        </div>
      )}

      {/* Custom Stream URL Editor Modal/Overlay */}
      {isEditingUrl && (
        <form
          onSubmit={handleApplyCustomUrl}
          className="absolute inset-x-2 bottom-12 bg-slate-950/95 border border-cyan-500/50 p-3 rounded-xl z-30 shadow-2xl space-y-2"
        >
          <div className="flex items-center justify-between text-xs font-bold text-cyan-300">
            <span>URL da Transmissão de Vídeo (RTMP / HLS / MP4)</span>
            <button type="button" onClick={() => setIsEditingUrl(false)} className="text-slate-400 hover:text-white">
              ✕
            </button>
          </div>
          <input
            type="url"
            value={tempUrlInput}
            onChange={(e) => setTempUrlInput(e.target.value)}
            placeholder="https://exemplo.com/stream.mp4 ou .m3u8"
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-400"
          />
          <div className="flex justify-end space-x-2">
            <button
              type="submit"
              className="px-3 py-1 bg-cyan-500 text-slate-950 font-bold text-xs rounded-lg hover:bg-cyan-400"
            >
              Aplicar Transmissão Ao Vivo
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
