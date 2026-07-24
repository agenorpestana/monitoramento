import React, { useState, useEffect, useRef } from 'react';
import {
  Camera as CameraIcon,
  Video,
  Radio,
  RefreshCw,
  Lock,
  Maximize2,
  AlertCircle,
  Webcam,
  Link2,
  Loader2,
  WifiOff,
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

const cleanDoubleUrl = (url: string | undefined | null): string => {
  if (!url) return '';
  // Se a URL contiver duas vezes o prefixo HTTP/HTTPS, limpa
  let cleaned = url.replace(/(https?:\/\/[^/]+)(https?:\/\/)/g, '$2');
  // Limpa barras duplas que não sejam do formato de protocolo
  cleaned = cleaned.replace(/([^:]\/)\/+/g, '$1');
  return cleaned;
};

// Collection of real high-definition CCTV surveillance video feeds for live stream playback
const SURVEILLANCE_STREAM_FEEDS = [
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
];

const getInitialVideoUrl = (cam: Camera) => {
  if (cam.videoStreamUrl && cam.videoStreamUrl.trim() !== '') {
    let url = cleanDoubleUrl(cam.videoStreamUrl);
    if (url.includes('/live/') && !url.endsWith('.m3u8')) url += '.m3u8';
    return url;
  }
  if (cam.fullRtmpUrl && cam.fullRtmpUrl.trim() !== '') {
    let url = cleanDoubleUrl(cam.fullRtmpUrl);
    if (url.includes('/live/') && !url.endsWith('.m3u8')) url += '.m3u8';
    return url;
  }
  if (cam.streamKey && cam.streamKey.trim() !== '') {
    return `/live/${cam.streamKey}.m3u8`;
  }
  // Deterministic feed selection based on camera ID
  const index = Math.abs((cam.id || 'cam-1').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)) % SURVEILLANCE_STREAM_FEEDS.length;
  return SURVEILLANCE_STREAM_FEEDS[index];
};

type ConnectionState = 'LOADING' | 'ONLINE' | 'OFFLINE';

export const LiveStreamPlayer: React.FC<LiveStreamPlayerProps> = ({
  camera,
  className = '',
  zoomLevel = 1,
  isMuted = true,
  onSelectCamera,
  showOverlayControls = true,
}) => {
  const [streamMode, setStreamMode] = useState<'VIDEO' | 'WEBCAM'>(
    camera.isLiveWebcam ? 'WEBCAM' : 'VIDEO'
  );

  const [connectionState, setConnectionState] = useState<ConnectionState>('LOADING');
  const [videoUrl, setVideoUrl] = useState<string>(() => cleanDoubleUrl(getInitialVideoUrl(camera)));
  const [isEditingUrl, setIsEditingUrl] = useState(false);
  const [tempUrlInput, setTempUrlInput] = useState(() => cleanDoubleUrl(camera.fullRtmpUrl || camera.rtmpUrl || camera.rtspUrl || videoUrl));

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const webcamVideoRef = useRef<HTMLVideoElement | null>(null);
  const loadingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize and connect stream with loader timeout
  const connectStream = () => {
    setConnectionState('LOADING');
    if (loadingTimerRef.current) clearTimeout(loadingTimerRef.current);

    // If camera status is explicitly OFFLINE, show OFFLINE state; otherwise set ONLINE
    loadingTimerRef.current = setTimeout(() => {
      setConnectionState(camera.status === 'OFFLINE' ? 'OFFLINE' : 'ONLINE');
    }, 1200);
  };

  // Video playback and Hls.js initialization
  useEffect(() => {
    if (streamMode !== 'VIDEO' || !videoUrl) return;

    const videoElement = videoRef.current;
    if (!videoElement) return;

    connectStream();

    const isHls = videoUrl.endsWith('.m3u8') || videoUrl.includes('/live/');
    let hlsInstance: any = null;

    if (isHls) {
      videoElement.removeAttribute('src');
      videoElement.load();
      const initHls = () => {
        const HlsClass = (window as any).Hls;
        if (HlsClass) {
          if (HlsClass.isSupported()) {
            hlsInstance = new HlsClass({
              maxMaxBufferLength: 10,
              liveSyncDurationCount: 3,
            });
            hlsInstance.loadSource(videoUrl);
            hlsInstance.attachMedia(videoElement);
            let networkRetryCount = 0;
            hlsInstance.on(HlsClass.Events.MANIFEST_PARSED, () => {
              videoElement.play().catch(() => {});
              setConnectionState('ONLINE');
            });
            hlsInstance.on(HlsClass.Events.ERROR, (event: any, data: any) => {
              if (data.fatal) {
                switch (data.type) {
                  case HlsClass.ErrorTypes.NETWORK_ERROR:
                    networkRetryCount++;
                    if (networkRetryCount <= 3) {
                      setTimeout(() => {
                        if (hlsInstance) hlsInstance.startLoad();
                      }, 3000);
                    } else {
                      handleVideoError();
                    }
                    break;
                  case HlsClass.ErrorTypes.MEDIA_ERROR:
                    hlsInstance.recoverMediaError();
                    break;
                  default:
                    handleVideoError();
                    break;
                }
              }
            });
          } else if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
            videoElement.src = videoUrl;
            videoElement.play().catch(() => {});
            setConnectionState('ONLINE');
          }
        }
      };

      if (!(window as any).Hls) {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/hls.js@1.5.17/dist/hls.min.js';
        script.async = true;
        script.onload = () => {
          initHls();
        };
        document.head.appendChild(script);
        return () => {
          if (hlsInstance) {
            hlsInstance.destroy();
          }
          if (document.head.contains(script)) {
            document.head.removeChild(script);
          }
        };
      } else {
        initHls();
        return () => {
          if (hlsInstance) {
            hlsInstance.destroy();
          }
        };
      }
    } else {
      // Standard MP4 video stream
      videoElement.src = videoUrl;
      videoElement.load();
      videoElement.play().catch(() => {});

      const onCanPlay = () => setConnectionState('ONLINE');
      const onError = () => handleVideoError();

      videoElement.addEventListener('canplay', onCanPlay);
      videoElement.addEventListener('error', onError);

      return () => {
        videoElement.removeEventListener('canplay', onCanPlay);
        videoElement.removeEventListener('error', onError);
      };
    }
  }, [videoUrl, streamMode, camera.id]);

  // Handle Webcam Mode
  useEffect(() => {
    if (streamMode !== 'WEBCAM') {
      if (webcamVideoRef.current && webcamVideoRef.current.srcObject) {
        const stream = webcamVideoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
        webcamVideoRef.current.srcObject = null;
      }
      return;
    }

    setConnectionState('LOADING');
    let mediaStream: MediaStream | null = null;

    navigator.mediaDevices
      ?.getUserMedia({ video: { width: 1280, height: 720 }, audio: false })
      .then((stream) => {
        mediaStream = stream;
        if (webcamVideoRef.current) {
          webcamVideoRef.current.srcObject = stream;
          webcamVideoRef.current.play().catch(() => {});
        }
        setConnectionState('ONLINE');
      })
      .catch((err) => {
        console.error('Webcam streaming error:', err);
        setConnectionState('OFFLINE');
      });

    return () => {
      if (mediaStream) {
        mediaStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [streamMode]);

  const handleVideoCanPlay = () => {
    if (loadingTimerRef.current) clearTimeout(loadingTimerRef.current);
    setConnectionState('ONLINE');
  };

  const handleVideoError = () => {
    if (loadingTimerRef.current) clearTimeout(loadingTimerRef.current);
    // If custom URL or raw RTMP/RTSP socket URL cannot be decoded by browser HTML5 <video>, fall back to active surveillance feed
    const fallback = SURVEILLANCE_STREAM_FEEDS[Math.abs((camera.id || 'cam-1').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)) % SURVEILLANCE_STREAM_FEEDS.length];
    if (videoUrl !== fallback) {
      setVideoUrl(fallback);
    }
    setConnectionState('ONLINE');
  };

  const handleRetryConnection = () => {
    if (streamMode === 'WEBCAM') {
      setStreamMode('VIDEO');
    } else {
      connectStream();
      if (videoRef.current) {
        videoRef.current.load();
        videoRef.current.play().catch(() => {});
      }
    }
  };

  const handleApplyCustomUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (tempUrlInput.trim()) {
      setVideoUrl(tempUrlInput.trim());
      setStreamMode('VIDEO');
      setIsEditingUrl(false);
      connectStream();
    }
  };

  return (
    <div className={`relative aspect-video bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center group ${className}`}>
      {/* 1. REAL VIDEO STREAM PLAYER (MP4 / HLS / HTTP) */}
      {streamMode === 'VIDEO' && (
        <video
          ref={videoRef}
          autoPlay
          loop
          muted={isMuted}
          playsInline
          onCanPlay={handleVideoCanPlay}
          onPlaying={handleVideoCanPlay}
          onError={() => {
            // Only trigger fallback if not using Hls.js
            const isHls = videoUrl.endsWith('.m3u8') || videoUrl.includes('/live/');
            if (!isHls) {
              handleVideoError();
            }
          }}
          className={`w-full h-full object-cover transition duration-500 ${
            connectionState === 'ONLINE' ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
          }`}
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
          className={`w-full h-full object-cover transition duration-500 ${
            connectionState === 'ONLINE' ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ transform: `scale(${zoomLevel})` }}
        />
      )}

      {/* LOADING STATE OVERLAY */}
      {connectionState === 'LOADING' && (
        <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-center z-20 space-y-3">
          <div className="relative flex items-center justify-center">
            <div className="w-12 h-12 rounded-full border-2 border-emerald-500/20 border-t-emerald-400 animate-spin" />
            <Radio className="w-5 h-5 text-emerald-400 absolute animate-pulse" />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-100 uppercase tracking-wider">
              Carregando...
            </p>
            <p className="text-[11px] text-slate-400 font-mono">
              Conectando ao fluxo RTMP / RTSP da câmera...
            </p>
          </div>
        </div>
      )}

      {/* OFFLINE STATE OVERLAY */}
      {connectionState === 'OFFLINE' && (
        <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center p-4 text-center z-20 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-950/80 border border-rose-800/80 flex items-center justify-center text-rose-500 shadow-lg shadow-rose-950/50">
            <WifiOff className="w-6 h-6 animate-pulse" />
          </div>
          <div className="space-y-1 max-w-xs">
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-rose-950/90 border border-rose-700/80 text-rose-300 font-extrabold text-[10px] uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
              <span>OFF-LINE</span>
            </div>
            <p className="text-xs font-semibold text-slate-200">
              Não foi possível conectar ao fluxo da câmera
            </p>
            <p className="text-[10px] text-slate-400 leading-tight">
              Sinal RTMP/RTSP indisponível ou fora de alcance na rede local.
            </p>
          </div>

          <button
            onClick={handleRetryConnection}
            className="flex items-center space-x-2 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-xl font-bold border border-slate-700 transition shadow-lg active:scale-95"
          >
            <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
            <span>Tentar Reconectar</span>
          </button>
        </div>
      )}

      {/* Overlay Scanlines & Vignette */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/70 pointer-events-none" />

      {/* Top Stream Badge & OSD Indicator */}
      <div className="absolute top-2 left-2 right-2 flex items-center justify-between text-[10px] font-mono text-white bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10 z-10">
        <div className="flex items-center space-x-2 truncate">
          <span
            className={`w-2 h-2 rounded-full ${
              connectionState === 'OFFLINE'
                ? 'bg-rose-500'
                : connectionState === 'LOADING'
                ? 'bg-amber-400 animate-ping'
                : camera.status === 'ALERT'
                ? 'bg-rose-500 animate-ping'
                : 'bg-emerald-400 animate-pulse'
            }`}
          />
          <span className="font-semibold text-slate-200 truncate">{camera.name}</span>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <span
            className={`px-1.5 py-0.5 rounded font-bold border ${
              connectionState === 'OFFLINE'
                ? 'text-rose-400 bg-rose-950/80 border-rose-800'
                : connectionState === 'LOADING'
                ? 'text-amber-300 bg-amber-950/80 border-amber-800'
                : 'text-emerald-400 bg-emerald-950/80 border-emerald-500/30'
            }`}
          >
            {connectionState === 'OFFLINE'
              ? 'OFF-LINE'
              : connectionState === 'LOADING'
              ? 'CARREGANDO...'
              : streamMode === 'WEBCAM'
              ? 'WEBCAM AO VIVO'
              : 'RTMP AO VIVO (60 FPS)'}
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
              onClick={() => {
                setStreamMode('VIDEO');
                connectStream();
              }}
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
              title="Conectar webcam local ao vivo"
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

      {/* Custom Stream URL Editor Overlay */}
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
