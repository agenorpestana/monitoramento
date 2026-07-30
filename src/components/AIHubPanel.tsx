import React, { useState } from 'react';
import {
  Cpu,
  Zap,
  Activity,
  RefreshCw,
  Server,
  Play,
  Pause,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  HardDrive,
  Flame,
  Layers,
  Settings2,
  Eye,
  ShieldCheck,
} from 'lucide-react';
import { AIWorkerJob, GPUMetrics, CameraAISettings, Camera } from '../types';

interface AIHubPanelProps {
  aiJobs: AIWorkerJob[];
  gpuMetrics: GPUMetrics;
  cameras: Camera[];
  cameraSettings: CameraAISettings[];
  onRestartJobs: () => Promise<void>;
  onToggleJobStatus: (jobId: string, action: 'start' | 'pause') => Promise<void>;
  onUpdateCameraAISetting: (setting: CameraAISettings) => Promise<void>;
}

export const AIHubPanel: React.FC<AIHubPanelProps> = ({
  aiJobs,
  gpuMetrics,
  cameras,
  cameraSettings,
  onRestartJobs,
  onToggleJobStatus,
  onUpdateCameraAISetting,
}) => {
  const [isRestarting, setIsRestarting] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'workers' | 'camera-settings'>('overview');
  const [selectedCameraId, setSelectedCameraId] = useState<string>('all');

  const handleRestart = async () => {
    setIsRestarting(true);
    await onRestartJobs();
    setTimeout(() => setIsRestarting(false), 1200);
  };

  const activeWorkerCount = aiJobs.filter((j) => j.status === 'RUNNING').length;
  const totalInferenceFps = aiJobs.reduce((acc, j) => acc + (j.status === 'RUNNING' ? j.currentFps : 0), 0);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900/90 to-indigo-950/60 p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Cpu className="w-6 h-6 text-indigo-400" />
            <h1 className="text-xl font-black text-white tracking-tight">Central de Processamento de IA & GPU Datacenter</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              CLUSTER ISP ATIVO
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Inferencia centralizada em cluster de GPUs NVIDIA com aceleração TensorRT para LPR, Reconhecimento Facial e Filas Redis.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleRestart}
            disabled={isRestarting}
            className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-lg disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRestarting ? 'animate-spin' : ''}`} />
            <span>{isRestarting ? 'Reiniciando Pipeline...' : 'Reiniciar Workers GPU'}</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex space-x-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition ${
            activeTab === 'overview'
              ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Zap className="w-4 h-4" />
          <span>Status de Hardware & GPU</span>
        </button>
        <button
          onClick={() => setActiveTab('workers')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition ${
            activeTab === 'workers'
              ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Workers de IA ({activeWorkerCount}/{aiJobs.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('camera-settings')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition ${
            activeTab === 'camera-settings'
              ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Configuração de IA por Câmera</span>
        </button>
      </div>

      {/* TAB 1: GPU Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Top GPU Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-2">
              <div className="flex justify-between items-center text-xs text-slate-400">
                <span>Uso da GPU</span>
                <Cpu className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="text-2xl font-black text-white">{gpuMetrics.utilizationGpuPct}%</span>
                <span className="text-[10px] text-emerald-400 font-semibold">{gpuMetrics.activeCudaCores.toLocaleString()} Cores CUDA</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${gpuMetrics.utilizationGpuPct}%` }}
                />
              </div>
            </div>

            <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-2">
              <div className="flex justify-between items-center text-xs text-slate-400">
                <span>Memória VRAM (NVIDIA)</span>
                <HardDrive className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="text-2xl font-black text-white">{(gpuMetrics.vramUsedMB / 1024).toFixed(1)} GB</span>
                <span className="text-[10px] text-slate-400">de {(gpuMetrics.vramTotalMB / 1024).toFixed(1)} GB</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-cyan-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${(gpuMetrics.vramUsedMB / gpuMetrics.vramTotalMB) * 100}%` }}
                />
              </div>
            </div>

            <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-2">
              <div className="flex justify-between items-center text-xs text-slate-400">
                <span>Temperatura & Energia</span>
                <Flame className="w-4 h-4 text-amber-400" />
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="text-2xl font-black text-white">{gpuMetrics.temperatureC}°C</span>
                <span className="text-[10px] text-amber-400 font-semibold">{gpuMetrics.powerUsageW}W / {gpuMetrics.powerLimitW}W</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-amber-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${(gpuMetrics.temperatureC / 90) * 100}%` }}
                />
              </div>
            </div>

            <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-2">
              <div className="flex justify-between items-center text-xs text-slate-400">
                <span>Vazão Total de Inferência</span>
                <Zap className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="text-2xl font-black text-white">{totalInferenceFps.toFixed(0)} FPS</span>
                <span className="text-[10px] text-emerald-400 font-semibold">Tempo Real Fibra</span>
              </div>
              <p className="text-[10px] text-slate-400">Processamento em lote via TensorRT FP16</p>
            </div>
          </div>

          {/* GPU Hardware Details Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <Server className="w-4 h-4 text-indigo-400" />
                <span>Especificações do Acelerador de Hardware</span>
              </h3>
              <span className="text-xs text-slate-400">Driver NVIDIA: {gpuMetrics.driverVersion} | CUDA: {gpuMetrics.cudaVersion}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-1">
                <span className="text-slate-400">Acelerador Instalado</span>
                <p className="font-bold text-slate-200">{gpuMetrics.gpuName}</p>
              </div>
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-1">
                <span className="text-slate-400">Cores Tensor (Aceleração Matricial)</span>
                <p className="font-bold text-emerald-400 flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Ativos (INT8/FP16 Preciso)</span>
                </p>
              </div>
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-1">
                <span className="text-slate-400">Modo de Decodificação de Vídeo</span>
                <p className="font-bold text-cyan-400">NVDEC Hardware Decoders (H.264/H.265)</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Workers List */}
      {activeTab === 'workers' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {aiJobs.map((job) => (
              <div
                key={job.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-3">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        job.status === 'RUNNING' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                      }`}
                    />
                    <h4 className="font-bold text-sm text-white">{job.workerName}</h4>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
                      {job.type}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Câmeras Ativas: {job.activeCamerasCount} | VRAM: {job.vramUsedMB} MB | Latência: {job.latencyMs} ms
                  </p>
                </div>

                <div className="flex items-center space-x-6 text-xs text-slate-300">
                  <div className="text-right">
                    <p className="font-bold text-emerald-400">{job.currentFps} FPS</p>
                    <p className="text-[10px] text-slate-400">Velocidade Atual</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-200">{job.processedFrames.toLocaleString()}</p>
                    <p className="text-[10px] text-slate-400">Frames Processados</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-200">{job.queueLagMs} ms</p>
                    <p className="text-[10px] text-slate-400">Fila Redis/BullMQ</p>
                  </div>

                  <div className="flex items-center space-x-2">
                    {job.status === 'RUNNING' ? (
                      <button
                        onClick={() => onToggleJobStatus(job.id, 'pause')}
                        className="p-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-xl font-bold transition"
                        title="Pausar Worker"
                      >
                        <Pause className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        onClick={() => onToggleJobStatus(job.id, 'start')}
                        className="p-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl font-bold transition"
                        title="Iniciar Worker"
                      >
                        <Play className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: Per-Camera AI Configuration */}
      {activeTab === 'camera-settings' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-white">Configurações de Inferência por Câmera</h3>
              <p className="text-xs text-slate-400">Habilite ou desabilite LPR e Reconhecimento Facial individualmente por fluxo.</p>
            </div>
            <select
              value={selectedCameraId}
              onChange={(e) => setSelectedCameraId(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-xs text-slate-200 px-3 py-2 rounded-xl focus:outline-none focus:border-indigo-500"
            >
              <option value="all">Todas as Câmeras ({cameraSettings.length})</option>
              {cameras.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                  <th className="py-3 px-3">Câmera</th>
                  <th className="py-3 px-3">Modo Processamento</th>
                  <th className="py-3 px-3">LPR (Placas)</th>
                  <th className="py-3 px-3">Reconhecimento Facial</th>
                  <th className="py-3 px-3">FPS Inferência</th>
                  <th className="py-3 px-3">Limiar Placa (%)</th>
                  <th className="py-3 px-3">Limiar Face (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {cameraSettings
                  .filter((s) => selectedCameraId === 'all' || s.cameraId === selectedCameraId)
                  .map((setting) => (
                    <tr key={setting.cameraId} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-3 font-bold text-slate-100">{setting.cameraName}</td>
                      <td className="py-3 px-3">
                        <select
                          value={setting.processingMode}
                          onChange={(e) =>
                            onUpdateCameraAISetting({
                              ...setting,
                              processingMode: e.target.value as any,
                            })
                          }
                          className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-[11px] text-indigo-300 font-semibold"
                        >
                          <option value="CENTRAL_GPU">Servidor Central GPU</option>
                          <option value="EDGE_JETSON">Edge (Jetson Orin)</option>
                          <option value="HYBRID_SYNC">Híbrido Resiliente</option>
                        </select>
                      </td>
                      <td className="py-3 px-3">
                        <input
                          type="checkbox"
                          checked={setting.lprEnabled}
                          onChange={(e) =>
                            onUpdateCameraAISetting({ ...setting, lprEnabled: e.target.checked })
                          }
                          className="w-4 h-4 rounded accent-indigo-500 cursor-pointer"
                        />
                      </td>
                      <td className="py-3 px-3">
                        <input
                          type="checkbox"
                          checked={setting.facialEnabled}
                          onChange={(e) =>
                            onUpdateCameraAISetting({ ...setting, facialEnabled: e.target.checked })
                          }
                          className="w-4 h-4 rounded accent-indigo-500 cursor-pointer"
                        />
                      </td>
                      <td className="py-3 px-3">
                        <select
                          value={setting.inferenceFps}
                          onChange={(e) =>
                            onUpdateCameraAISetting({ ...setting, inferenceFps: Number(e.target.value) })
                          }
                          className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-[11px] text-slate-200"
                        >
                          <option value={5}>5 FPS</option>
                          <option value={15}>15 FPS</option>
                          <option value={30}>30 FPS (Máxima Precisão)</option>
                        </select>
                      </td>
                      <td className="py-3 px-3 font-semibold text-emerald-400">{setting.minPlateConfidence}%</td>
                      <td className="py-3 px-3 font-semibold text-cyan-400">{setting.minFaceSimilarity}%</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
