import React, { useState } from 'react';
import {
  Film,
  Lock,
  Unlock,
  Play,
  Pause,
  Download,
  Trash2,
  Calendar,
  Clock,
  HardDrive,
  Sliders,
  Eye,
  ShieldCheck,
  Search,
  Filter,
  Camera as CameraIcon,
  X,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import { CloudRecording, User, Camera } from '../types';

interface CloudRecordingsVaultProps {
  recordings: CloudRecording[];
  cameras?: Camera[];
  activeUser: User;
  onDeleteRecording: (id: string) => void;
  isVaultUnlocked: boolean;
  onUnlockVault: () => void;
}

export const CloudRecordingsVault: React.FC<CloudRecordingsVaultProps> = ({
  recordings,
  cameras = [],
  activeUser,
  onDeleteRecording,
  isVaultUnlocked,
  onUnlockVault,
}) => {
  const [activeRecording, setActiveRecording] = useState<CloudRecording | null>(recordings[0] || null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedStartTime, setSelectedStartTime] = useState<string>('');
  const [selectedEndTime, setSelectedEndTime] = useState<string>('');
  const [selectedCameraId, setSelectedCameraId] = useState<string>('ALL');
  const [storageLimitGB, setStorageLimitGB] = useState<number>(100);
  const [showStorageModal, setShowStorageModal] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [currentTime, setCurrentTime] = useState<number>(120);

  const filteredRecordings = recordings.filter((rec) => {
    if (selectedCameraId !== 'ALL' && rec.cameraId !== selectedCameraId) {
      return false;
    }
    if (selectedDate && !rec.startTime.includes(selectedDate)) {
      return false;
    }
    if (rec.startTime.includes(' ')) {
      const timePart = rec.startTime.split(' ')[1] || '';
      if (selectedStartTime && timePart < selectedStartTime) {
        return false;
      }
      if (selectedEndTime && timePart > selectedEndTime + ':59') {
        return false;
      }
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchCam = rec.cameraName.toLowerCase().includes(q);
      const matchTag = rec.tags.some((t) => t.toLowerCase().includes(q));
      if (!matchCam && !matchTag) return false;
    }
    return true;
  });

  const totalStorageMB = recordings.reduce((acc, r) => acc + (r.fileSizeMB || 0), 0);
  const totalStorageGB = totalStorageMB / 1024;
  const storagePercentage = Math.min(100, Math.round((totalStorageGB / storageLimitGB) * 100));

  const handleFifoPrune = () => {
    if (recordings.length === 0) return;
    const sorted = [...recordings].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    let currentMB = totalStorageMB;
    const maxMB = storageLimitGB * 1024;

    const toDelete: string[] = [];
    for (const r of sorted) {
      if (currentMB > maxMB) {
        toDelete.push(r.id);
        currentMB -= r.fileSizeMB || 0;
      } else {
        break;
      }
    }

    if (toDelete.length > 0) {
      toDelete.forEach((id) => onDeleteRecording(id));
      alert(`Limpeza FIFO executada! ${toDelete.length} gravação(ões) mais antiga(s) foi(ram) excluída(s) para manter o limite de ${storageLimitGB} GB.`);
    } else {
      alert(`O uso de armazenamento (${totalStorageGB.toFixed(2)} GB) está dentro do limite de ${storageLimitGB} GB. Nenhuma ação necessária.`);
    }
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedDate('');
    setSelectedStartTime('');
    setSelectedEndTime('');
    setSelectedCameraId('ALL');
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (seconds >= 300) return '5 min (Completo)';
    return `${mins}m ${secs}s (Parcial / Interrompido)`;
  };

  return (
    <div className="space-y-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 p-4 rounded-2xl shadow-xl">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Film className="w-5 h-5 text-emerald-400" />
            Cofre de Gravações em Nuvem (Fatias de 5 Minutos e E2EE)
          </h2>
          <p className="text-xs text-slate-400">
            Gravação contínua segmentada em blocos de 5 minutos com retenção inteligente e filtro por data/hora
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Storage Meter Button */}
          <button
            type="button"
            onClick={() => setShowStorageModal(true)}
            className="bg-slate-950 border border-slate-800 hover:border-slate-700 px-3 py-1.5 rounded-xl text-xs font-mono text-slate-300 flex items-center gap-2 shadow-sm transition"
            title="Configurar Limite de Armazenamento GB e Limpeza"
          >
            <HardDrive className="w-3.5 h-3.5 text-cyan-400" />
            <span>
              Uso: <strong className="text-emerald-400">{totalStorageGB.toFixed(2)} GB</strong> / {storageLimitGB} GB
            </span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                storagePercentage > 85 ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'
              }`}
            >
              {storagePercentage}%
            </span>
          </button>

          <button
            onClick={onUnlockVault}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 border transition ${
              isVaultUnlocked
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
            }`}
          >
            {isVaultUnlocked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
            <span>{isVaultUnlocked ? 'Cofre Desbloqueado' : 'Desbloquear Cofre'}</span>
          </button>
        </div>
      </div>

      {/* Storage & FIFO Limit Modal */}
      {showStorageModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl max-w-md w-full space-y-4 shadow-2xl relative">
            <button
              onClick={() => setShowStorageModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
                <HardDrive className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Gerenciador de Armazenamento Nuvem</h3>
                <p className="text-xs text-slate-400">Defina a cota em GB e execute a regra de descarte FIFO</p>
              </div>
            </div>

            <div className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs">
              <div className="flex justify-between items-center text-slate-300 font-mono">
                <span>Espaço Utilizado:</span>
                <span className="text-emerald-400 font-bold">{totalStorageGB.toFixed(2)} GB</span>
              </div>
              <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    storagePercentage > 85 ? 'bg-rose-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${storagePercentage}%` }}
                />
              </div>

              <div className="pt-2 space-y-1">
                <label className="block text-slate-300 font-medium">Limite Máximo de Armazenamento (GB):</label>
                <select
                  value={storageLimitGB}
                  onChange={(e) => setStorageLimitGB(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 text-white px-3 py-2 rounded-xl outline-none focus:border-emerald-500 font-mono"
                >
                  <option value={20}>20 GB (Básico)</option>
                  <option value={50}>50 GB (Padrão)</option>
                  <option value={100}>100 GB (Recomendado)</option>
                  <option value={200}>200 GB (Avançado)</option>
                  <option value={500}>500 GB (Corporativo)</option>
                </select>
                <p className="text-[11px] text-slate-500 pt-1">
                  Quando o limite for atingido, o sistema executa a regra de descarte FIFO (First-In, First-Out) excluindo automaticamente os blocos gravados mais antigos.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={handleFifoPrune}
                className="px-3.5 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-xs rounded-xl border border-amber-500/40 flex items-center gap-1.5 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Executar Limpeza FIFO</span>
              </button>

              <button
                type="button"
                onClick={() => setShowStorageModal(false)}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition"
              >
                Salvar Configurações
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Video Player & Search Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Player */}
        <div className="lg:col-span-2 space-y-3">
          {activeRecording ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl space-y-3 p-4">
              <div className="relative aspect-video bg-black rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center">
                <img
                  src={activeRecording.thumbnailUrl}
                  alt={activeRecording.cameraName}
                  className="w-full h-full object-cover"
                />

                {/* E2EE Lock Overlay if locked */}
                {!isVaultUnlocked && (
                  <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center space-y-3 text-center p-6 z-20">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                      <Lock className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-bold text-white">Conteúdo Criptografado E2EE</p>
                    <p className="text-xs text-slate-400 max-w-sm">
                      Forneça a frase secreta do cofre para decodificar e visualizar esta gravação em tempo real.
                    </p>
                    <button
                      onClick={onUnlockVault}
                      className="px-4 py-2 bg-emerald-500 text-slate-950 font-bold text-xs rounded-xl shadow-lg hover:bg-emerald-400 transition"
                    >
                      Digitar Chave Mestra
                    </button>
                  </div>
                )}

                {/* Play/Pause Center Overlay */}
                {isVaultUnlocked && (
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="absolute p-4 bg-slate-950/80 hover:bg-emerald-500 text-white hover:text-slate-950 rounded-full transition shadow-2xl border border-white/20"
                  >
                    {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 fill-current" />}
                  </button>
                )}
              </div>

              {/* Timeline Scrubber Slider */}
              <div className="space-y-2 bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                  <span>00:00</span>
                  <span className="text-emerald-400 font-semibold">
                    00:02:00 / {Math.floor(activeRecording.durationSeconds / 60)}:{(activeRecording.durationSeconds % 60).toString().padStart(2, '0')} (Velocidade: {playbackSpeed}x)
                  </span>
                  <span>{Math.floor(activeRecording.durationSeconds / 60)}:{(activeRecording.durationSeconds % 60).toString().padStart(2, '0')}</span>
                </div>

                <input
                  type="range"
                  min={0}
                  max={activeRecording.durationSeconds}
                  value={currentTime}
                  onChange={(e) => setCurrentTime(parseInt(e.target.value, 10))}
                  className="w-full accent-emerald-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
                />

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] text-slate-400">Velocidade:</span>
                    {[0.5, 1, 2, 4].map((speed) => (
                      <button
                        key={speed}
                        onClick={() => setPlaybackSpeed(speed)}
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition ${
                          playbackSpeed === speed
                            ? 'bg-emerald-500 text-slate-950'
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {speed}x
                      </button>
                    ))}
                  </div>

                  <a
                    href={activeRecording.streamUrl}
                    download
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium rounded-xl flex items-center space-x-1.5 transition"
                  >
                    <Download className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Baixar Clipe MP4</span>
                  </a>
                </div>
              </div>

              {/* Active Recording Information */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-300">
                <div>
                  <h4 className="font-bold text-white text-sm flex items-center gap-2">
                    {activeRecording.cameraName}
                    <span className="text-[10px] bg-slate-800 text-emerald-400 font-mono px-2 py-0.5 rounded border border-slate-700">
                      {formatDuration(activeRecording.durationSeconds)}
                    </span>
                  </h4>
                  <p className="text-slate-400 font-mono text-[11px] pt-0.5">
                    Início: <strong className="text-white">{activeRecording.startTime}</strong> | Fim: <strong className="text-white">{activeRecording.endTime}</strong> | Tamanho: {activeRecording.fileSizeMB} MB
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-1">
                  {activeRecording.tags.map((t, idx) => (
                    <span key={idx} className="bg-emerald-500/10 text-emerald-400 text-[10px] font-mono px-2 py-0.5 rounded border border-emerald-500/20">
                      #{t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl text-slate-500 text-xs">
              Nenhuma gravação encontrada com os filtros selecionados.
            </div>
          )}
        </div>

        {/* Recordings Search & Filter Drawer */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 flex flex-col max-h-[640px]">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5 text-emerald-400" />
              Buscar Gravações Nuvem
            </h3>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono font-bold">
                {filteredRecordings.length} blocos
              </span>
              {(selectedDate || selectedStartTime || selectedEndTime || selectedCameraId !== 'ALL' || searchQuery) && (
                <button
                  onClick={resetFilters}
                  className="text-[10px] text-amber-400 hover:underline flex items-center gap-0.5"
                  title="Limpar Filtros"
                >
                  <RotateCcw className="w-3 h-3" />
                  Limpar
                </button>
              )}
            </div>
          </div>

          {/* Advanced Search & Filter Controls */}
          <div className="space-y-2 bg-slate-950 p-3 rounded-xl border border-slate-800/80 text-xs">
            {/* Camera Selector */}
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                <CameraIcon className="w-3 h-3 text-cyan-400" /> Câmera:
              </label>
              <select
                value={selectedCameraId}
                onChange={(e) => setSelectedCameraId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 text-slate-200 px-2.5 py-1.5 rounded-lg text-xs outline-none focus:border-emerald-500"
              >
                <option value="ALL">Todas as Câmeras Ativas</option>
                {cameras.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Picker */}
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-emerald-400" /> Data da Gravação:
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 text-slate-200 px-2.5 py-1.5 rounded-lg text-xs outline-none focus:border-emerald-500"
              />
            </div>

            {/* Time Range Pickers */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-amber-400" /> Hora Início:
                </label>
                <input
                  type="time"
                  value={selectedStartTime}
                  onChange={(e) => setSelectedStartTime(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 text-slate-200 px-2 py-1 rounded-lg text-xs outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-rose-400" /> Hora Fim:
                </label>
                <input
                  type="time"
                  value={selectedEndTime}
                  onChange={(e) => setSelectedEndTime(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 text-slate-200 px-2 py-1 rounded-lg text-xs outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Keyword Search */}
            <div className="relative pt-1">
              <input
                type="text"
                placeholder="Buscar por tag (ex: #Portaria)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 text-slate-200 pl-3 pr-3 py-1.5 rounded-lg text-xs outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Filtered Segment Cards */}
          <div className="space-y-2 overflow-y-auto pr-1 flex-1">
            {filteredRecordings.length === 0 ? (
              <div className="p-4 text-center text-slate-500 text-xs">
                Nenhum trecho de 5 minutos localizado para estes critérios.
              </div>
            ) : (
              filteredRecordings.map((rec) => {
                const isSelected = activeRecording?.id === rec.id;
                const isPartial = rec.durationSeconds < 300;
                return (
                  <div
                    key={rec.id}
                    onClick={() => setActiveRecording(rec)}
                    className={`p-2.5 rounded-xl border cursor-pointer transition flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300'
                        : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-800/50 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center space-x-3 truncate">
                      <div className="relative shrink-0">
                        <img src={rec.thumbnailUrl} className="w-12 h-12 rounded-lg object-cover border border-slate-800" />
                        {isPartial && (
                          <span
                            className="absolute -bottom-1 -right-1 bg-amber-500 text-slate-950 text-[8px] font-black px-1 rounded border border-slate-950"
                            title="Trecho Parcial / Sinal Interrompido"
                          >
                            PARCIAL
                          </span>
                        )}
                      </div>
                      <div className="truncate space-y-0.5">
                        <p className="text-xs font-bold truncate">{rec.cameraName}</p>
                        <p className="text-[10px] text-slate-400 font-mono truncate">{rec.startTime}</p>
                        <p className="text-[10px] text-emerald-400 font-mono">
                          {formatDuration(rec.durationSeconds)} • {rec.fileSizeMB} MB
                        </p>
                      </div>
                    </div>

                    {activeUser.customPermissions.canDeleteRecordings && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm('Deseja excluir permanentemente esta gravação da nuvem?')) {
                            onDeleteRecording(rec.id);
                          }
                        }}
                        className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition"
                        title="Excluir Gravação"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
