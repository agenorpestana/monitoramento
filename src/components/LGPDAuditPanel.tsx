import React, { useState } from 'react';
import {
  ShieldAlert,
  FileCheck,
  UserCheck,
  Lock,
  Trash2,
  Download,
  EyeOff,
  Scale,
  Calendar,
  AlertTriangle,
  Database,
  CheckCircle2,
} from 'lucide-react';
import { LGPDAuditLog, User } from '../types';

interface LGPDAuditPanelProps {
  logs: LGPDAuditLog[];
  activeUser: User;
  onPurgeBiometrics: (retentionDays: number) => Promise<{ purgedCount: number }>;
}

export const LGPDAuditPanel: React.FC<LGPDAuditPanelProps> = ({
  logs,
  activeUser,
  onPurgeBiometrics,
}) => {
  const [retentionDays, setRetentionDays] = useState<number>(90);
  const [isPurging, setIsPurging] = useState(false);
  const [purgeStatusMessage, setPurgeStatusMessage] = useState<string | null>(null);
  const [maskSensitiveData, setMaskSensitiveData] = useState<boolean>(true);

  const handleTriggerPurge = async () => {
    setIsPurging(true);
    const res = await onPurgeBiometrics(retentionDays);
    setPurgeStatusMessage(`Exclusão executada com sucesso! ${res.purgedCount} registros e embeddings biométricos antigos foram expurgados de forma irreversível.`);
    setIsPurging(false);
    setTimeout(() => setPurgeStatusMessage(null), 8000);
  };

  const handleExportAuditReport = () => {
    const jsonStr = JSON.stringify(logs, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio_auditoria_lgpd_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/60 p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Scale className="w-6 h-6 text-emerald-400" />
            <h1 className="text-xl font-black text-white tracking-tight">Auditoria & Conformidade LGPD Biométrica</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              LEI 13.709/2018
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Registro imutável de consultas biométricas, base legal, anonimização e expurgo automatizado de dados pessoais.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleExportAuditReport}
            className="flex items-center space-x-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition shadow"
          >
            <Download className="w-4 h-4" />
            <span>Exportar Relatório LGPD</span>
          </button>
        </div>
      </div>

      {/* Compliance Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Base Legal Predominante</span>
            <FileCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-lg font-black text-white">Art. 7º & 11 (Segurança Pública & Consentimento)</p>
          <p className="text-[10px] text-slate-500">Monitoramento patrimonial e prevenção a fraudes</p>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Mascaramento Ativo</span>
            <EyeOff className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-slate-200">
              {maskSensitiveData ? 'Ocultação de CPF/Faces Ativada' : 'Exibição Completa (Admin)'}
            </span>
            <button
              onClick={() => setMaskSensitiveData(!maskSensitiveData)}
              className={`px-3 py-1 rounded-lg text-xs font-bold ${
                maskSensitiveData ? 'bg-cyan-500/20 text-cyan-300' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {maskSensitiveData ? 'Ativo' : 'Desativado'}
            </button>
          </div>
          <p className="text-[10px] text-slate-500">Apenas perfis autorizados visualizam imagens originais</p>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Política de Retenção</span>
            <Calendar className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-lg font-black text-white">{retentionDays} Dias Máximos</p>
          <p className="text-[10px] text-slate-500">Expurgo automático após o período limite</p>
        </div>
      </div>

      {/* Manual Biometric Purge Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Database className="w-4 h-4 text-rose-400" />
              <span>Gerenciador de Exclusão e Expurgos de Dados Biométricos</span>
            </h3>
            <p className="text-xs text-slate-400">
              Execute a limpeza física e remoção de vetores de embeddings com mais de {retentionDays} dias do banco de dados pgvector.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <select
              value={retentionDays}
              onChange={(e) => setRetentionDays(Number(e.target.value))}
              className="bg-slate-950 border border-slate-800 text-xs text-slate-200 px-3 py-2 rounded-xl"
            >
              <option value={30}>30 Dias</option>
              <option value={60}>60 Dias</option>
              <option value={90}>90 Dias (Recomendado LGPD)</option>
              <option value={180}>180 Dias</option>
            </select>

            <button
              onClick={handleTriggerPurge}
              disabled={isPurging}
              className="flex items-center space-x-2 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl transition shadow disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              <span>{isPurging ? 'Expurgando Vetores...' : 'Executar Expurgo Agora'}</span>
            </button>
          </div>
        </div>

        {purgeStatusMessage && (
          <div className="p-3 bg-emerald-950/80 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{purgeStatusMessage}</span>
          </div>
        )}
      </div>

      {/* Audit Log Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-white">Registro de Auditoria de Acesso a Dados Pessoais</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                <th className="py-3 px-3">Operador / Usuário</th>
                <th className="py-3 px-3">Ação Realizada</th>
                <th className="py-3 px-3">Detalhes</th>
                <th className="py-3 px-3">Base Legal LGPD</th>
                <th className="py-3 px-3">Endereço IP</th>
                <th className="py-3 px-3">Data e Hora</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3 px-3 font-bold text-slate-200">
                    {log.operatorName}
                    <span className="block text-[10px] text-slate-500">{log.operatorRole}</span>
                  </td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-300 max-w-xs truncate">{log.targetDetails}</td>
                  <td className="py-3 px-3 font-semibold text-emerald-400">{log.justificationLegalBasis}</td>
                  <td className="py-3 px-3 font-mono text-slate-400 text-[11px]">{log.ipAddress}</td>
                  <td className="py-3 px-3 text-slate-400 text-[11px]">{log.timestamp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
