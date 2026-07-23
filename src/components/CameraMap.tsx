import React, { useState } from 'react';
import { MapPin, Camera as CameraIcon, ShieldCheck, Radio, Eye, Lock, Layers } from 'lucide-react';
import { Camera } from '../types';

interface CameraMapProps {
  cameras: Camera[];
  onSelectCamera: (cam: Camera) => void;
}

export const CameraMap: React.FC<CameraMapProps> = ({ cameras, onSelectCamera }) => {
  const [selectedPin, setSelectedPin] = useState<Camera | null>(cameras[0] || null);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  const filteredCameras = cameras.filter((c) => {
    if (filterStatus === 'ALL') return true;
    return c.status === filterStatus;
  });

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 p-4 rounded-2xl">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-400" />
            Mapa Gabriel de Vizinhança Conectada
          </h2>
          <p className="text-xs text-slate-400">
            Rede de totens e câmeras Camaleão monitorando a região em tempo real
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-400">Filtrar:</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-slate-800 text-slate-200 border border-slate-700 text-xs px-3 py-1.5 rounded-xl outline-none focus:border-emerald-500"
          >
            <option value="ALL">Todas as Câmeras ({cameras.length})</option>
            <option value="RECORDING">Em Gravação (Nuvem)</option>
            <option value="ALERT">Com Alerta de Movimento</option>
            <option value="ONLINE">Online</option>
          </select>
        </div>
      </div>

      {/* Map Graphic Canvas Simulation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Interactive Simulated Map Grid */}
        <div className="lg:col-span-2 relative bg-slate-950 border border-slate-800 rounded-2xl min-h-[460px] p-6 overflow-hidden flex flex-col justify-between shadow-2xl">
          {/* Map Grid Pattern background */}
          <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />

          {/* Streets Graphic overlay */}
          <div className="absolute inset-0 pointer-events-none opacity-20">
            <div className="absolute top-1/3 w-full h-8 bg-slate-700/50 -rotate-3" />
            <div className="absolute top-2/3 w-full h-10 bg-slate-700/50 rotate-1" />
            <div className="absolute left-1/3 h-full w-8 bg-slate-700/50 rotate-6" />
            <div className="absolute left-2/3 h-full w-10 bg-slate-700/50 -rotate-2" />
          </div>

          {/* Map Title Tag */}
          <div className="relative z-10 flex items-center justify-between">
            <span className="bg-slate-900/90 text-emerald-400 border border-emerald-500/30 text-xs font-semibold px-3 py-1 rounded-xl shadow-md">
              📍 Bairro Jardins / Cerqueira César, SP
            </span>
            <span className="bg-slate-900/90 text-slate-300 border border-slate-800 text-xs px-3 py-1 rounded-xl">
              Cobertura Gabriel: <strong className="text-emerald-400">98.4%</strong>
            </span>
          </div>

          {/* Map Pins */}
          <div className="relative z-10 my-auto h-72">
            {filteredCameras.map((cam, idx) => {
              // Calculate relative positioning based on mock lat/lng or array index
              const topPositions = ['20%', '65%', '45%', '80%', '30%'];
              const leftPositions = ['25%', '70%', '45%', '30%', '80%'];

              const top = topPositions[idx % topPositions.length];
              const left = leftPositions[idx % leftPositions.length];
              const isSelected = selectedPin?.id === cam.id;

              return (
                <div
                  key={cam.id}
                  className="absolute transition-all duration-300"
                  style={{ top, left }}
                >
                  {/* Pulse Coverage Radius */}
                  <div
                    className={`absolute -inset-6 rounded-full opacity-30 animate-ping pointer-events-none ${
                      cam.status === 'ALERT'
                        ? 'bg-rose-500'
                        : cam.status === 'RECORDING'
                        ? 'bg-emerald-500'
                        : 'bg-cyan-500'
                    }`}
                  />

                  {/* Camera Node Pin */}
                  <button
                    onClick={() => setSelectedPin(cam)}
                    className={`relative p-2.5 rounded-full shadow-2xl transition-all transform hover:scale-125 border ${
                      isSelected
                        ? 'bg-emerald-500 text-slate-950 border-white ring-4 ring-emerald-500/30 font-bold z-20 scale-110'
                        : cam.status === 'ALERT'
                        ? 'bg-rose-600 text-white border-rose-300 animate-bounce'
                        : 'bg-slate-900 text-emerald-400 border-slate-700 hover:border-emerald-400'
                    }`}
                    title={cam.name}
                  >
                    <CameraIcon className="w-5 h-5" />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Map Footer Legend */}
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 pt-4 border-t border-slate-800/80 text-[11px] text-slate-400">
            <div className="flex items-center space-x-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span> Online / Gravação
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span> Alerta de Movimento
              </span>
            </div>
            <span>Clique nos ícones para visualizar a câmera no mapa</span>
          </div>
        </div>

        {/* Camera Pin Preview Inspector */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl flex flex-col justify-between">
          {selectedPin ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-400" />
                  {selectedPin.name}
                </h3>
                <span className="text-[10px] font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full">
                  {selectedPin.status}
                </span>
              </div>

              {/* Video Preview */}
              <div className="relative aspect-video bg-black rounded-xl overflow-hidden border border-slate-800 shadow-md">
                <img src={selectedPin.thumbnailUrl} className="w-full h-full object-cover" />
                <div className="absolute top-2 left-2 bg-slate-950/80 text-[10px] text-emerald-400 font-mono px-2 py-0.5 rounded border border-slate-800 flex items-center gap-1">
                  <Radio className="w-3 h-3 animate-pulse" />
                  AO VIVO
                </div>
              </div>

              <div className="space-y-2 text-xs text-slate-300">
                <p>
                  <strong className="text-slate-400">Endereço:</strong> {selectedPin.location}
                </p>
                <p>
                  <strong className="text-slate-400">Qualidade:</strong> {selectedPin.resolution} @ {selectedPin.fps} FPS
                </p>
                <p>
                  <strong className="text-slate-400">Proteção E2EE:</strong>{' '}
                  <span className="text-emerald-400 font-semibold">Criptografado AES-256</span>
                </p>
              </div>

              <button
                onClick={() => onSelectCamera(selectedPin)}
                className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center space-x-2 transition shadow-lg shadow-emerald-500/20"
              >
                <Eye className="w-4 h-4" />
                <span>Abrir Câmera em Tela Cheia</span>
              </button>
            </div>
          ) : (
            <p className="text-xs text-slate-500 text-center my-auto">Selecione um ponto no mapa para inspecionar</p>
          )}
        </div>
      </div>
    </div>
  );
};
