import React, { useState, useEffect } from 'react';
import {
  Database,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Server,
  Zap,
  Terminal,
  ShieldAlert,
  ArrowRight,
  HardDrive,
  Copy,
  Check
} from 'lucide-react';

export const DatabaseSyncPanel: React.FC = () => {
  const [host, setHost] = useState('45.183.218.118');
  const [port, setPort] = useState('3306');
  const [user, setUser] = useState('root');
  const [password, setPassword] = useState('itl_pass_2026');
  const [database, setDatabase] = useState('itl_cameras');

  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [syncStatus, setSyncStatus] = useState<any>(null);
  const [copiedCmd, setCopiedCmd] = useState(false);

  // Fetch status on load
  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/db-status');
      const data = await res.json();
      setSyncStatus(data);
    } catch (e) {}
  };

  useEffect(() => {
    fetchStatus();
    // Pre-fill config from server if available
    fetch('/api/db/config')
      .then((res) => res.json())
      .then((data) => {
        if (data.config) {
          if (data.config.host) setHost(data.config.host);
          if (data.config.port) setPort(String(data.config.port));
          if (data.config.user) setUser(data.config.user);
          if (data.config.database) setDatabase(data.config.database);
        }
      })
      .catch(() => {});
  }, []);

  const handleTestConnection = async () => {
    setIsLoading(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/db/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ host, port: Number(port), user, password, database }),
      });
      const data = await res.json();
      setTestResult(data);
      await fetchStatus();
    } catch (err: any) {
      setTestResult({
        success: false,
        message: `Falha na requisição: ${err.message}`,
        guide: 'Verifique se o servidor backend está online e respondo a requisições HTTP.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnectAndSync = async () => {
    setIsLoading(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/db/connect-and-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ host, port: Number(port), user, password, database }),
      });
      const data = await res.json();
      setTestResult(data);
      await fetchStatus();
    } catch (err: any) {
      setTestResult({
        success: false,
        message: `Erro na sincronização: ${err.message}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForcePushCameras = async () => {
    setIsLoading(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/db/force-push-cameras', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      setTestResult(data);
      await fetchStatus();
    } catch (err: any) {
      setTestResult({
        success: false,
        message: `Erro ao forçar envio: ${err.message}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const grantCommand = `CREATE USER IF NOT EXISTS '${user || 'root'}'@'%' IDENTIFIED BY '${password}';\nGRANT ALL PRIVILEGES ON \`${database || 'itl_cameras'}\`.* TO '${user || 'root'}'@'%';\nFLUSH PRIVILEGES;`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Database className="w-6 h-6 text-emerald-400" />
            <h2 className="text-lg font-bold text-slate-100">
              Diagnóstico & Sincronização com Banco MySQL Remoto
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Conecte o sistema diretamente ao MySQL da sua VPS (<code className="text-emerald-400 font-mono">45.183.218.118</code>) e grave as 11 câmeras cadastradas na tabela <code className="text-emerald-300 font-mono">cameras</code>.
          </p>
        </div>

        {/* Live status badge */}
        <div className="flex items-center space-x-3 bg-slate-950 px-4 py-2.5 rounded-xl border border-slate-800 shrink-0">
          <Server className="w-5 h-5 text-emerald-400" />
          <div className="text-xs">
            <p className="text-slate-400 text-[10px] font-semibold uppercase">Status Atual do BD</p>
            {syncStatus?.isMysqlActive ? (
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> MySQL Remoto Ativo
              </span>
            ) : (
              <span className="text-amber-400 font-bold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> SQLite / JSON Local
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Comparison Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center space-x-3 shadow-lg">
          <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-400">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400">Câmeras em Memória / JSON</p>
            <p className="text-xl font-black text-slate-100">
              {syncStatus?.memoryCounts?.cameras || 11} Câmeras
            </p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center space-x-3 shadow-lg">
          <div className="p-3 bg-cyan-500/10 rounded-xl border border-cyan-500/20 text-cyan-400">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400">Câmeras na Tabela MySQL</p>
            <p className="text-xl font-black text-cyan-400">
              {syncStatus?.mysqlCounts?.cameras || 0} Registros
            </p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center space-x-3 shadow-lg">
          <div className="p-3 bg-purple-500/10 rounded-xl border border-purple-500/20 text-purple-400">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400">Servidor MySQL Alvo</p>
            <p className="text-xs font-mono font-bold text-slate-200 truncate max-w-[150px]">
              {host}:{port}
            </p>
          </div>
        </div>
      </div>

      {/* Form Configuration and Actions */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Credentials Form */}
        <div className="md:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
          <h3 className="text-sm font-bold text-slate-200 flex items-center space-x-2">
            <Server className="w-4 h-4 text-emerald-400" />
            <span>Parâmetros de Conexão MySQL (Servidor Remoto / VPS)</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Host / IP do Servidor
              </label>
              <input
                type="text"
                value={host}
                onChange={(e) => setHost(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono focus:border-emerald-500 focus:outline-none"
                placeholder="45.183.218.118"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Porta MySQL
              </label>
              <input
                type="text"
                value={port}
                onChange={(e) => setPort(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono focus:border-emerald-500 focus:outline-none"
                placeholder="3306"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Usuário MySQL
              </label>
              <input
                type="text"
                value={user}
                onChange={(e) => setUser(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono focus:border-emerald-500 focus:outline-none"
                placeholder="root"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Senha do Usuário
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono focus:border-emerald-500 focus:outline-none"
                placeholder="Senha do banco MySQL"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Nome do Banco de Dados
              </label>
              <input
                type="text"
                value={database}
                onChange={(e) => setDatabase(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono focus:border-emerald-500 focus:outline-none"
                placeholder="itl_cameras"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-wrap gap-2">
            <button
              onClick={handleTestConnection}
              disabled={isLoading}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center space-x-2 transition border border-slate-700 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Testar Conexão</span>
            </button>

            <button
              onClick={handleConnectAndSync}
              disabled={isLoading}
              className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-bold flex items-center space-x-2 transition shadow-lg shadow-emerald-500/20 disabled:opacity-50"
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>Conectar & Sincronizar Tudo</span>
            </button>

            <button
              onClick={handleForcePushCameras}
              disabled={isLoading}
              className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold flex items-center space-x-2 transition shadow-lg shadow-cyan-600/20 disabled:opacity-50"
            >
              <ArrowRight className="w-3.5 h-3.5" />
              <span>Forçar Gravação das 11 Câmeras</span>
            </button>
          </div>
        </div>

        {/* Diagnostic Guide & Troubleshooting Box */}
        <div className="md:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-200 flex items-center space-x-2">
              <Terminal className="w-4 h-4 text-cyan-400" />
              <span>Comando SQL para Liberar Conexão na VPS</span>
            </h3>

            <p className="text-xs text-slate-400 mt-2">
              Caso você receba erro de permissão no terminal SSH (<code className="text-emerald-400 font-mono">Bitvise</code>), cole este comando dentro do MySQL do seu servidor:
            </p>

            <div className="mt-3 relative bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-[11px] text-emerald-400 overflow-x-auto leading-relaxed">
              <pre>{grantCommand}</pre>
              <button
                onClick={() => copyToClipboard(grantCommand)}
                className="absolute top-2 right-2 p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
                title="Copiar comando SQL"
              >
                {copiedCmd ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-xs text-slate-400 space-y-1 mt-4">
            <p className="font-bold text-slate-300">Dica de Firewall na VPS Linux:</p>
            <p className="text-[11px]">
              Liberar porta 3306: <code className="text-cyan-400 font-mono">sudo ufw allow 3306/tcp</code>
            </p>
            <p className="text-[11px]">
              Liberar escuta remota em <code className="text-slate-300">/etc/mysql/mysql.conf.d/mysqld.cnf</code>:
            </p>
            <code className="text-[10px] text-amber-300 font-mono block bg-slate-900 px-2 py-1 rounded">
              bind-address = 0.0.0.0
            </code>
          </div>
        </div>
      </div>

      {/* Output / Result Log Box */}
      {testResult && (
        <div
          className={`border p-5 rounded-2xl shadow-xl transition-all ${
            testResult.success
              ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200'
              : 'bg-rose-950/80 border-rose-500 text-rose-200'
          }`}
        >
          <div className="flex items-start space-x-3">
            {testResult.success ? (
              <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <XCircle className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />
            )}

            <div className="space-y-2 flex-1">
              <p className="font-bold text-sm">{testResult.message}</p>

              {testResult.details && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono bg-slate-950/60 p-3 rounded-xl border border-white/10">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Host:</span>
                    <span className="font-bold text-slate-200">{testResult.details.host}:{testResult.details.port}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Usuário:</span>
                    <span className="font-bold text-slate-200">{testResult.details.user}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Banco Existent:</span>
                    <span className="font-bold text-slate-200">{testResult.details.dbExists ? 'SIM' : 'NÃO'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Câmeras no MySQL:</span>
                    <span className="font-bold text-emerald-400">{testResult.details.camerasInMysql ?? testResult.syncedCount ?? 0}</span>
                  </div>
                </div>
              )}

              {testResult.guide && (
                <div className="bg-slate-950/90 p-3.5 rounded-xl border border-amber-500/30 text-amber-300 text-xs font-mono whitespace-pre-wrap leading-relaxed">
                  <p className="font-bold text-amber-200 flex items-center gap-1.5 mb-1">
                    <ShieldAlert className="w-4 h-4" /> Passo a Passo para Resolução:
                  </p>
                  {testResult.guide}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
