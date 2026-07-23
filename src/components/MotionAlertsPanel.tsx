import React, { useState } from 'react';
import {
  Bell,
  CheckCircle2,
  ShieldAlert,
  UserCheck,
  Car,
  Volume2,
  Eye,
  Smartphone,
  Play,
  Filter,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { MotionAlert, AlertType, AlertSeverity } from '../types';

interface MotionAlertsPanelProps {
  alerts: MotionAlert[];
  onMarkAsRead: (alertId: string) => void;
  onTriggerTestAlert: (camId: string, eventType?: AlertType, severity?: AlertSeverity) => void;
  onOpenPushSettings: () => void;
}

export const MotionAlertsPanel: React.FC<MotionAlertsPanelProps> = ({
  alerts,
  onMarkAsRead,
  onTriggerTestAlert,
  onOpenPushSettings,
}) => {
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');

  const filteredAlerts = alerts.filter((alert) => {
    if (selectedType !== 'ALL' && alert.eventType !== selectedType) return false;
    if (selectedSeverity !== 'ALL' && alert.severity !== selectedSeverity) return false;
    return true;
  });

  const getEventIcon = (type: AlertType) => {
    switch (type) {
      case 'HUMAN':
        return <UserCheck className="w-4 h-4 text-amber-400" />;
      case 'VEHICLE':
        return <Car className="w-4 h-4 text-cyan-400" />;
      case 'SOUND':
        return <Volume2 className="w-4 h-4 text-indigo-400" />;
      case 'INTRUSION':
        return <ShieldAlert className="w-4 h-4 text-rose-500 animate-pulse" />;
      default:
        return <Bell className="w-4 h-4 text-emerald-400" />;
    }
  };

  const getSeverityBadge = (severity: AlertSeverity) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse';
      case 'HIGH':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'MEDIUM':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Banner & Control Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 p-4 rounded-2xl">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Bell className="w-5 h-5 text-rose-400" />
            Alertas de Movimento & Detecção com IA em Tempo Real
          </h2>
          <p className="text-xs text-slate-400">
            Alertas instantâneos com inteligência artificial para detecção de pessoas, veículos e invasões de perímetro
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => onTriggerTestAlert('cam-02', 'HUMAN', 'HIGH')}
            className="px-3 py-2 bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs rounded-xl flex items-center space-x-1.5 transition shadow-lg shadow-rose-600/20"
          >
            <Sparkles className="w-4 h-4" />
            <span>Simular Alerta de Teste</span>
          </button>

          <button
            onClick={onOpenPushSettings}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold rounded-xl flex items-center space-x-1.5 transition"
          >
            <Smartphone className="w-4 h-4 text-emerald-400" />
            <span>Push Celular</span>
          </button>
        </div>
      </div>

      {/* Filter Options */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950 p-3 rounded-2xl border border-slate-800 text-xs">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1 text-slate-400">
            <Filter className="w-3.5 h-3.5" />
            <span className="font-medium">Filtro por Tipo:</span>
          </div>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-slate-200 rounded-xl px-2.5 py-1 outline-none"
          >
            <option value="ALL">Todos os Eventos</option>
            <option value="HUMAN">Detecção de Humano</option>
            <option value="VEHICLE">Veículos</option>
            <option value="INTRUSION">Invasão Perímetro</option>
            <option value="SOUND">Ruído Suspeito</option>
          </select>
        </div>

        <div className="flex items-center space-x-3">
          <span className="text-slate-400 font-medium">Gravidade:</span>
          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-slate-200 rounded-xl px-2.5 py-1 outline-none"
          >
            <option value="ALL">Todas as Gravidades</option>
            <option value="CRITICAL">Crítico</option>
            <option value="HIGH">Alta</option>
            <option value="MEDIUM">Média</option>
            <option value="LOW">Baixa</option>
          </select>
        </div>
      </div>

      {/* Alerts Timeline Feed */}
      <div className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl text-slate-400 text-xs">
            Nenhum alerta de movimento encontrado com os filtros selecionados.
          </div>
        ) : (
          filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-4 bg-slate-900 border rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition shadow-md ${
                !alert.readStatus
                  ? 'border-emerald-500/40 bg-emerald-950/10'
                  : 'border-slate-800 opacity-80 hover:opacity-100'
              }`}
            >
              {/* Snapshot thumbnail */}
              <div className="flex items-center space-x-4">
                <div className="relative w-24 h-16 bg-black rounded-xl overflow-hidden shrink-0 border border-slate-800 shadow">
                  <img src={alert.snapshotUrl} className="w-full h-full object-cover" />
                  {!alert.readStatus && (
                    <span className="absolute top-1 left-1 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-slate-950 animate-pulse" />
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    {getEventIcon(alert.eventType)}
                    <h4 className="text-xs font-bold text-slate-100">{alert.cameraName}</h4>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getSeverityBadge(
                        alert.severity
                      )}`}
                    >
                      {alert.severity}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300">
                    Evento: <strong className="text-emerald-400">{alert.eventType}</strong> (Confiança IA:{' '}
                    {alert.confidence}%)
                  </p>

                  <div className="flex items-center space-x-3 text-[10px] text-slate-500 font-mono">
                    <span>{alert.timestamp}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-slate-400">
                      <Smartphone className="w-3 h-3 text-emerald-400" />
                      {alert.pushedToMobile ? 'Push enviado para o celular' : 'Aguardando push'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
                {!alert.readStatus && (
                  <button
                    onClick={() => onMarkAsRead(alert.id)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-emerald-500/20 text-slate-300 hover:text-emerald-400 border border-slate-700 hover:border-emerald-500/30 text-xs font-medium rounded-xl flex items-center space-x-1.5 transition"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Marcar Lido</span>
                  </button>
                )}

                {alert.videoClipUrl && (
                  <button
                    onClick={() => alert('Abrindo clipe de gravação associado ao alerta de movimento')}
                    className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl flex items-center space-x-1.5 transition shadow"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Ver Clipe</span>
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
