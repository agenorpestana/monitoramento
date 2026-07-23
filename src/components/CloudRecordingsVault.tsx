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
} from 'lucide-react';
import { CloudRecording, User } from '../types';

interface CloudRecordingsVaultProps {
  recordings: CloudRecording[];
  activeUser: User;
  onDeleteRecording: (id: string) => void;
  isVaultUnlocked: boolean;
  onUnlockVault: () => void;
}

export const CloudRecordingsVault: React.FC<CloudRecordingsVaultProps> = ({
  recordings,
  activeUser,
  onDeleteRecording,
  isVaultUnlocked,
  onUnlockVault,
}) => {
  const [activeRecording, setActiveRecording] = useState<CloudRecording | null>(recordings[0] || null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [currentTime, setCurrentTime] = useState<number>(120);

  const filteredRecordings = recordings.filter((rec) => {
    return (
      rec.cameraName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  const totalStorageMB = recordings.reduce((acc, r) => acc + r.fileSizeMB, 0);

  return (
    <div className="space-y-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 p-4 rounded-2xl">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Film className="w-5 h-5 text-emerald-400" />
            Cofre de Gravações em Nuvem com Criptografia E2EE
          </h2>
          <p className="text-xs text-slate-400">
            Gravação contínua e trechos de eventos armazenados de forma segura e criptografada
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700 text-xs font-mono text-slate-300">
            Uso Total Nuvem: <strong className="text-emerald-400">{(totalStorageMB / 1024).toFixed(2)} GB</strong>
          </div>

          <button
            onClick={onUnlockVault}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 border transition ${
              isVaultUnlocked
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
            }`}
          >
            {isVaultUnlocked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
            <span>{isVaultUnlocked ? 'Cofre E2EE Desbloqueado' : 'Desbloquear Cofre'}</span>
          </button>
        </div>
      </div>

      {/* Main Video Player & Recordings List */}
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
                    00:02:00 / 00:30:00 (Velocidade: {playbackSpeed}x)
                  </span>
                  <span>30:00</span>
                </div>

                <input
                  type="range"
                  min={0}
                  max={1800}
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
              <div className="flex items-center justify-between text-xs text-slate-300">
                <div>
                  <h4 className="font-bold text-white text-sm">{activeRecording.cameraName}</h4>
                  <p className="text-slate-400 font-mono text-[11px]">
                    Início: {activeRecording.startTime} | Duração: {Math.floor(activeRecording.durationSeconds / 60)} min
                  </p>
                </div>

                <div className="flex items-center space-x-1">
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
              Nenhuma gravação selecionada.
            </div>
          )}
        </div>

        {/* Recordings List Drawer */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 flex flex-col max-h-[580px]">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="text-xs font-bold text-slate-200">Lista de Trechos Gravados</h3>
            <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-mono">
              {filteredRecordings.length}
            </span>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar por câmera ou tag..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 pl-8 pr-3 py-1.5 rounded-xl text-xs outline-none focus:border-emerald-500"
            />
          </div>

          {/* List items */}
          <div className="space-y-2 overflow-y-auto pr-1 flex-1">
            {filteredRecordings.map((rec) => {
              const isSelected = activeRecording?.id === rec.id;
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
                    <img src={rec.thumbnailUrl} className="w-12 h-12 rounded-lg object-cover shrink-0 border border-slate-800" />
                    <div className="truncate space-y-0.5">
                      <p className="text-xs font-bold truncate">{rec.cameraName}</p>
                      <p className="text-[10px] text-slate-400 font-mono truncate">{rec.startTime}</p>
                      <p className="text-[10px] text-emerald-400 font-mono">{rec.fileSizeMB} MB</p>
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
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
