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
  Activity,
  Terminal,
  X,
  AlertTriangle,
  CheckCircle2,
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

const getInitialVideoUrl = (cam: Camera) => {
  if (cam.videoStreamUrl && cam.videoStreamUrl.trim() !== '') {
    let url = cleanDoubleUrl(cam.videoStreamUrl);
    if (url.includes('/live/') && !url.endsWith('.m3u8')) url += '.m3u8';
    return url;
  }
  const key = cam.streamKey || (cam.id ? (cam.id.startsWith('cam-') ? `cam_${cam.id.replace('cam-', '')}` : cam.id) : 'stream');
  return `/live/${key}.m3u8`;
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

  // Diagnostic state for player
  const [playerDiag, setPlayerDiag] = useState<{
    loading: boolean;
    data?: any;
    error?: string;
  } | null>(null);

  const runPlayerDiag = async () => {
    setPlayerDiag({ loading: true });
    try {
      const res = await fetch('/api/cameras/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          protocol: camera.protocol || (camera.rtspUrl ? 'RTSP' : 'RTMP'),
          rtspUrl: camera.protocol === 'RTSP' ? camera.rtspUrl : '',
          rtmpUrl: camera.rtmpUrl || camera.fullRtmpUrl,
          streamKey: camera.streamKey || camera.id,
        }),
      });
      const data = await res.json();
      setPlayerDiag({ loading: false, data });
    } catch (e: any) {
      setPlayerDiag({ loading: false, error: e.message || 'Erro ao realizar diagnóstico' });
    }
  };

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const webcamVideoRef = useRef<HTMLVideoElement | null>(null);
  const loadingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Connect stream
  const connectStream = () => {
    setConnectionState('LOADING');
    if (loadingTimerRef.current) clearTimeout(loadingTimerRef.current);

    if (camera.status === 'OFFLINE') {
      setConnectionState('OFFLINE');
    }
  };

  const handleVideoError = () => {
    if (loadingTimerRef.current) clearTimeout(loadingTimerRef.current);
    setConnectionState('OFFLINE');
  };

  // Video playback and Hls.js initialization
  useEffect(() => {
    if (streamMode !== 'VIDEO' || !videoUrl) return;

    const videoElement = videoRef.current;
    if (!videoElement) return;

    connectStream();

    const isHls = videoUrl.endsWith('.m3u8') || videoUrl.includes('/live/');
    let hlsInstance: any = null;
    let isDestroyed = false;

    if (isHls) {
      videoElement.removeAttribute('src');
      videoElement.load();

      const initHls = () => {
        const HlsClass = (window as any).Hls;
        if (HlsClass && HlsClass.isSupported()) {
          hlsInstance = new HlsClass({
            maxMaxBufferLength: 10,
            liveSyncDurationCount: 3,
            manifestLoadingMaxRetry: 1,
            levelLoadingMaxRetry: 1,
            fragLoadingMaxRetry: 1,
          });
          hlsInstance.loadSource(videoUrl);
          hlsInstance.attachMedia(videoElement);

          hlsInstance.on(HlsClass.Events.MANIFEST_PARSED, () => {
            if (isDestroyed) return;
            videoElement.play().then(() => {
              setConnectionState('ONLINE');
            }).catch(() => {
              setConnectionState('ONLINE');
            });
          });

          hlsInstance.on(HlsClass.Events.ERROR, (_event: any, data: any) => {
            if (isDestroyed) return;
            if (data.fatal) {
              console.warn(`[HLS] Sinal de câmera indisponível/offline em ${videoUrl}`);
              handleVideoError();
              if (hlsInstance) {
                try { hlsInstance.destroy(); } catch (e) {}
                hlsInstance = null;
              }
            }
          });
        } else if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
          videoElement.src = videoUrl;
          videoElement.play().then(() => {
            setConnectionState('ONLINE');
          }).catch(() => {
            handleVideoError();
          });
        } else {
          handleVideoError();
        }
      };

      if (!(window as any).Hls) {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/hls.js@1.5.17/dist/hls.min.js';
        script.async = true;
        script.onload = () => {
          if (!isDestroyed) initHls();
        };
        script.onerror = () => {
          if (!isDestroyed) handleVideoError();
        };
        document.head.appendChild(script);
        return () => {
          isDestroyed = true;
          if (hlsInstance) hlsInstance.destroy();
          if (document.head.contains(script)) document.head.removeChild(script);
        };
      } else {
        initHls();
        return () => {
          isDestroyed = true;
          if (hlsInstance) hlsInstance.destroy();
        };
      }
    } else {
      // Standard MP4 video stream
      videoElement.src = videoUrl;
      videoElement.load();
      videoElement.play().catch(() => handleVideoError());

      const onCanPlay = () => setConnectionState('ONLINE');
      const onError = () => handleVideoError();

      videoElement.addEventListener('canplay', onCanPlay);
      videoElement.addEventListener('error', onError);

      return () => {
        isDestroyed = true;
        videoElement.removeEventListener('canplay', onCanPlay);
        videoElement.removeEventListener('error', onError);
      };
    }
  }, [videoUrl, streamMode, camera.id]);

  // Periodic stream health checker when camera is OFFLINE
  useEffect(() => {
    if (connectionState !== 'OFFLINE' || streamMode !== 'VIDEO' || !videoUrl) return;

    const intervalId = setInterval(async () => {
      try {
        const res = await fetch(videoUrl, { method: 'HEAD', cache: 'no-cache' });
        if (res.ok) {
          console.log(`[Stream Auto-Check] Sinal da câmera ${camera.name} ativado. Reconectando...`);
          setConnectionState('LOADING');
          if (videoRef.current) {
            videoRef.current.load();
          }
        }
      } catch (e) {
        // Stream still offline
      }
    }, 5000);

    return () => clearInterval(intervalId);
  }, [connectionState, streamMode, videoUrl, camera.name]);

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
          onError={handleVideoError}
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

          <div className="flex items-center gap-2">
            <button
              onClick={handleRetryConnection}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-xl font-bold border border-slate-700 transition shadow-lg active:scale-95"
            >
              <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
              <span>Tentar Reconectar</span>
            </button>

            <button
              onClick={runPlayerDiag}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs rounded-xl font-bold border border-emerald-500/40 transition shadow-lg active:scale-95"
            >
              <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>Diagnóstico / Teste</span>
            </button>
          </div>
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
              : camera.protocol === 'RTSP'
              ? 'RTSP HLS AO VIVO'
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
              title={camera.protocol === 'RTSP' ? "Transmitir fluxo RTSP/HLS em tempo real" : "Transmitir vídeo RTMP/HLS em tempo real"}
            >
              {camera.protocol === 'RTSP' ? 'Vídeo RTSP' : 'Vídeo RTMP'}
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

      {/* Diagnostic Player Modal */}
      {playerDiag && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl relative overflow-hidden text-left">
            <button
              onClick={() => setPlayerDiag(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 p-1 rounded-lg bg-slate-800 transition"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <Activity className="w-5 h-5 text-emerald-400 animate-pulse" />
              <div>
                <h3 className="text-sm font-bold text-slate-100">
                  Diagnóstico: {camera.name}
                </h3>
                <p className="text-[10px] text-slate-400">
                  Teste de porta e recepção de vídeo RTSP / RTMP em tempo real
                </p>
              </div>
            </div>

            {playerDiag.loading ? (
              <div className="py-8 text-center space-y-3">
                <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mx-auto" />
                <p className="text-xs font-bold text-slate-300">
                  Tentando handshake com a câmera e analisando fluxo...
                </p>
                <p className="text-[10px] text-slate-500 font-mono">
                  Testando porta e verificação ffprobe/HLS
                </p>
              </div>
            ) : playerDiag.error ? (
              <div className="bg-rose-500/10 border border-rose-500/30 p-4 rounded-xl text-xs space-y-2">
                <div className="flex items-center gap-2 text-rose-400 font-bold">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Erro no Diagnóstico</span>
                </div>
                <p className="text-slate-300">{playerDiag.error}</p>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                <div
                  className={`p-4 rounded-xl border flex items-start gap-3 ${
                    playerDiag.data?.success
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                  }`}
                >
                  {playerDiag.data?.success ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <h4 className="font-bold text-xs mb-1">
                      {playerDiag.data?.success ? 'SINAL CONECTADO COM SUCESSO' : 'SINAL NÃO DETECTADO / OFF-LINE'}
                    </h4>
                    <p className="text-slate-300 text-[11px]">{playerDiag.data?.message}</p>
                  </div>
                </div>

                {playerDiag.data?.details && (
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-[11px] font-mono text-slate-400">
                    <span className="text-slate-200 font-bold block mb-1">Detalhes do Diagnóstico:</span>
                    <p className="text-rose-400 text-[10px] break-all">{playerDiag.data.details}</p>
                  </div>
                )}

                {playerDiag.data?.logs && playerDiag.data.logs.length > 0 && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-300">
                      <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Logs do FFmpeg:</span>
                    </div>
                    <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-[10px] font-mono text-slate-400 max-h-36 overflow-y-auto space-y-1">
                      {playerDiag.data.logs.map((log: string, idx: number) => (
                        <div key={idx} className="truncate">{log}</div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-end pt-2 border-t border-slate-800">
                  <button
                    onClick={() => setPlayerDiag(null)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
