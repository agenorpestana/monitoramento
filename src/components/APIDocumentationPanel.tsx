import React, { useState } from 'react';
import {
  Code,
  Key,
  Play,
  Copy,
  Check,
  Download,
  Server,
  Lock,
  Users,
  Camera,
  Car,
  Bell,
  Cpu,
  Terminal,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  FileCode,
} from 'lucide-react';

interface Endpoint {
  id: string;
  category: 'auth' | 'admin' | 'cameras' | 'lpr' | 'alerts' | 'system';
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  title: string;
  description: string;
  authRequired: boolean;
  requestBody?: string;
  responseExample: string;
}

const ENDPOINTS_CATALOG: Endpoint[] = [
  // Auth
  {
    id: 'auth-login',
    category: 'auth',
    method: 'POST',
    path: '/api/v1/auth/login',
    title: 'Autenticação & Login de Terceiros',
    description: 'Autentica um software ou parceiro de integração via e-mail/senha ou API Key e gera o Token Bearer válido por 24h ou 30 dias.',
    authRequired: false,
    requestBody: JSON.stringify(
      {
        email: 'suporte@unityautomacoes.com.br',
        password: 'admin123',
        apiKey: 'itl_live_sec_token_optional',
      },
      null,
      2
    ),
    responseExample: JSON.stringify(
      {
        success: true,
        token: 'itl_bearer_1722748800_c3Vwb3J0ZUB1bml0eWF1dG9tYWNvZXMuY29tLmJy',
        tokenType: 'Bearer',
        expiresIn: 86400,
        user: {
          id: 'usr-superadmin',
          name: 'Super Admin Unity',
          email: 'suporte@unityautomacoes.com.br',
          role: 'ADMIN',
        },
      },
      null,
      2
    ),
  },
  {
    id: 'auth-me',
    category: 'auth',
    method: 'GET',
    path: '/api/v1/auth/me',
    title: 'Validar Token & Permissões',
    description: 'Verifica a validade do Token Bearer ou X-API-Key ativo e retorna os privilégios do operador.',
    authRequired: true,
    responseExample: JSON.stringify(
      {
        authenticated: true,
        user: {
          id: 'usr-superadmin',
          name: 'Super Admin Unity',
          role: 'ADMIN',
        },
        tokenDetails: {
          issuedAt: '2026-08-04T04:00:00.000Z',
          expiresAt: '2026-08-05T04:00:00.000Z',
          scopes: ['read:cameras', 'write:cameras', 'read:lpr', 'write:lpr', 'admin:users'],
        },
      },
      null,
      2
    ),
  },

  // Admin
  {
    id: 'admin-users-list',
    category: 'admin',
    method: 'GET',
    path: '/api/v1/admin/users',
    title: 'Listar Usuários do Painel Admin',
    description: 'Retorna todos os operadores, portarias virtuais e gestores cadastrados no sistema.',
    authRequired: true,
    responseExample: JSON.stringify(
      {
        success: true,
        count: 2,
        users: [
          {
            id: 'usr-01',
            name: 'Portaria Principal 24h',
            email: 'portaria@condominio.com.br',
            role: 'GUARD',
          },
          {
            id: 'usr-02',
            name: 'Super Admin Unity',
            email: 'suporte@unityautomacoes.com.br',
            role: 'ADMIN',
          },
        ],
      },
      null,
      2
    ),
  },
  {
    id: 'admin-users-create',
    category: 'admin',
    method: 'POST',
    path: '/api/v1/admin/users',
    title: 'Cadastrar Novo Operador/Usuário',
    description: 'Cria uma conta de operador para controle de acessos ou sincronização com software de portaria virtual.',
    authRequired: true,
    requestBody: JSON.stringify(
      {
        name: 'Operador VMS Terceiro',
        email: 'vms-integracao@parceiro.com.br',
        role: 'OPERATOR',
        customPermissions: {
          canViewLive: true,
          canViewRecordings: true,
          canControlPTZ: false,
        },
      },
      null,
      2
    ),
    responseExample: JSON.stringify(
      {
        success: true,
        user: {
          id: 'usr-1722749100',
          name: 'Operador VMS Terceiro',
          email: 'vms-integracao@parceiro.com.br',
          role: 'OPERATOR',
        },
      },
      null,
      2
    ),
  },

  // Cameras
  {
    id: 'cameras-list',
    category: 'cameras',
    method: 'GET',
    path: '/api/v1/admin/cameras',
    title: 'Listar Câmeras Ativas',
    description: 'Retorna a lista de todas as câmeras conectadas, endereços RTSP e coordenadas GPS.',
    authRequired: true,
    responseExample: JSON.stringify(
      {
        success: true,
        count: 2,
        cameras: [
          {
            id: 'cam-01',
            name: 'Salto da Divisa 01 (Itamaraju - BA)',
            location: 'Portaria Entrada',
            rtspUrl: 'rtsp://admin:123456@192.168.1.10:554/stream1',
            status: 'ONLINE',
          },
        ],
      },
      null,
      2
    ),
  },
  {
    id: 'streams-list',
    category: 'cameras',
    method: 'GET',
    path: '/api/v1/streams',
    title: 'Obter Streams HLS / WebRTC',
    description: 'Fornece as URLs de streaming HLS e gateways de baixa latência para integração em videowalls de terceiros.',
    authRequired: true,
    responseExample: JSON.stringify(
      [
        {
          cameraId: 'cam-01',
          cameraName: 'Portaria Entrada',
          hlsUrl: '/hls/cam-01.m3u8',
          webrtcUrl: '/webrtc/cam-01',
          status: 'ONLINE',
          codecs: 'H.265 / AAC',
        },
      ],
      null,
      2
    ),
  },

  // LPR
  {
    id: 'lpr-detections',
    category: 'lpr',
    method: 'GET',
    path: '/api/v1/lpr/detections',
    title: 'Histórico de Leitura de Placas (LPR)',
    description: 'Obtém as leituras de placas em tempo real efetuadas pelas câmeras de inteligência artificial LPR.',
    authRequired: true,
    responseExample: JSON.stringify(
      [
        {
          id: 'lpr-1722748000',
          plate: 'QVP8C12',
          normalizedPlate: 'QVP8C12',
          carImageUrl: 'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?w=600&auto=format&fit=crop&q=80',
          vehicleType: 'Utilitário',
          vehicleColor: 'Prata',
          cameraName: 'Salto da Divisa 01',
          isStolenAlert: true,
          timestamp: '2026-08-04T04:10:00.000Z',
        },
      ],
      null,
      2
    ),
  },
  {
    id: 'lpr-scan-all',
    category: 'lpr',
    method: 'POST',
    path: '/api/lpr/scan-all-cameras',
    title: 'Varredura LPR Simultânea (Todas Câmeras)',
    description: 'Dispara uma varredura de Visão Computacional (YOLO11 + OCR) em todas as câmeras ativas no backend.',
    authRequired: true,
    responseExample: JSON.stringify(
      {
        success: true,
        scannedCamerasCount: 2,
        vehiclesDetectedCount: 1,
        operatingMode: 'PRODUCTION',
        message: '🔍 Varredura concluída nas 2 câmeras! 1 veículo(s) identificado(s).',
      },
      null,
      2
    ),
  },
  {
    id: 'lpr-stolen',
    category: 'lpr',
    method: 'GET',
    path: '/api/v1/lpr/stolen-vehicles',
    title: 'Listar Placas em Lista Negra / Roubo',
    description: 'Retorna todos os veículos procurados/com alerta ativo cadastrados na base do condomínio/cidade.',
    authRequired: true,
    responseExample: JSON.stringify(
      [
        {
          id: 'stolen-01',
          plate: 'QVP8C12',
          ownerName: 'João Silva (Alerta Segurança)',
          reason: 'Mandado Judicial / Suspeito de Roubo BA',
          status: 'ACTIVE',
        },
      ],
      null,
      2
    ),
  },

  // Alerts
  {
    id: 'alerts-list',
    category: 'alerts',
    method: 'GET',
    path: '/api/v1/alerts',
    title: 'Alertas de Movimento & Intrusão',
    description: 'Retorna a lista de eventos de segurança, disparos de sirene e detecções de intrusão.',
    authRequired: true,
    responseExample: JSON.stringify(
      {
        success: true,
        count: 1,
        alerts: [
          {
            id: 'alert-lpr-101',
            cameraName: 'Salto da Divisa 01',
            eventType: 'LPR_STOLEN',
            severity: 'HIGH',
            timestamp: '12:29:03',
            readStatus: false,
          },
        ],
      },
      null,
      2
    ),
  },

  // System
  {
    id: 'system-health',
    category: 'system',
    method: 'GET',
    path: '/api/v1/system/health',
    title: 'Health Check do Servidor & Core Workers',
    description: 'Verifica o tempo de atividade (uptime), status da GPU Datacenter, fila do Redis e banco de dados.',
    authRequired: false,
    responseExample: JSON.stringify(
      {
        status: 'HEALTHY',
        uptimeSec: 3600.5,
        gpuStatus: 'ONLINE',
        redisQueue: 'CONNECTED',
        postgresPgVector: 'CONNECTED',
        activeWorkersCount: 4,
      },
      null,
      2
    ),
  },
];

export const APIDocumentationPanel: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeEndpoint, setActiveEndpoint] = useState<Endpoint>(ENDPOINTS_CATALOG[0]);
  const [codeLanguage, setCodeLanguage] = useState<'curl' | 'python' | 'javascript' | 'php' | 'csharp'>('curl');
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [testApiToken, setTestApiToken] = useState<string>('itl_bearer_1722748800_admin_token');
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<any | null>(null);
  const [testStatus, setTestStatus] = useState<number | null>(null);
  const [testBodyInput, setTestBodyInput] = useState<string>('');

  // Update test body input when changing endpoint
  React.useEffect(() => {
    setTestBodyInput(activeEndpoint.requestBody || '');
    setTestResult(null);
    setTestStatus(null);
  }, [activeEndpoint]);

  const filteredEndpoints =
    selectedCategory === 'all'
      ? ENDPOINTS_CATALOG
      : ENDPOINTS_CATALOG.filter((e) => e.category === selectedCategory);

  const handleCopyCode = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Generate code snippet based on selected language
  const renderCodeSnippet = () => {
    const url = `${window.location.origin}${activeEndpoint.path}`;
    const method = activeEndpoint.method;

    if (codeLanguage === 'curl') {
      let code = `curl -X ${method} "${url}" \\\n  -H "Accept: application/json"`;
      if (activeEndpoint.authRequired) {
        code += ` \\\n  -H "Authorization: Bearer ${testApiToken}"`;
      }
      if (activeEndpoint.requestBody) {
        code += ` \\\n  -H "Content-Type: application/json" \\\n  -d '${activeEndpoint.requestBody.replace(/\n/g, '')}'`;
      }
      return code;
    }

    if (codeLanguage === 'python') {
      let code = `import requests\n\nurl = "${url}"\nheaders = {\n    "Accept": "application/json",\n`;
      if (activeEndpoint.authRequired) {
        code += `    "Authorization": "Bearer ${testApiToken}",\n`;
      }
      if (activeEndpoint.requestBody) {
        code += `    "Content-Type": "application/json"\n}\npayload = ${activeEndpoint.requestBody}\n\nresponse = requests.${method.toLowerCase()}(url, headers=headers, json=payload)`;
      } else {
        code += `}\n\nresponse = requests.${method.toLowerCase()}(url, headers=headers)`;
      }
      code += `\nprint(response.status_code)\nprint(response.json())`;
      return code;
    }

    if (codeLanguage === 'javascript') {
      let code = `// JavaScript / Node.js (fetch API)\nconst response = await fetch("${url}", {\n  method: "${method}",\n  headers: {\n    "Accept": "application/json",\n`;
      if (activeEndpoint.authRequired) {
        code += `    "Authorization": "Bearer ${testApiToken}",\n`;
      }
      if (activeEndpoint.requestBody) {
        code += `    "Content-Type": "application/json"\n  },\n  body: JSON.stringify(${activeEndpoint.requestBody})\n});`;
      } else {
        code += `  }\n});`;
      }
      code += `\n\nconst data = await response.json();\nconsole.log(data);`;
      return code;
    }

    if (codeLanguage === 'php') {
      let code = `<?php\n$ch = curl_init("${url}");\ncurl_setopt($ch, CURLOPT_RETURNTRANSFER, true);\ncurl_setopt($ch, CURLOPT_CUSTOMREQUEST, "${method}");\n$headers = [\n    "Accept: application/json",\n`;
      if (activeEndpoint.authRequired) {
        code += `    "Authorization: Bearer ${testApiToken}",\n`;
      }
      if (activeEndpoint.requestBody) {
        code += `    "Content-Type: application/json"\n];\ncurl_setopt($ch, CURLOPT_POSTFIELDS, '${activeEndpoint.requestBody.replace(/\n/g, '')}');`;
      } else {
        code += `];`;
      }
      code += `\ncurl_setopt($ch, CURLOPT_HTTPHEADER, $headers);\n$response = curl_exec($ch);\ncurl_close($ch);\necho $response;`;
      return code;
    }

    if (codeLanguage === 'csharp') {
      let code = `using System.Net.Http;\nusing System.Text;\n\nvar client = new HttpClient();\nvar request = new HttpRequestMessage(HttpMethod.${method.charAt(0) + method.slice(1).toLowerCase()}, "${url}");\n`;
      if (activeEndpoint.authRequired) {
        code += `request.Headers.Add("Authorization", "Bearer ${testApiToken}");\n`;
      }
      if (activeEndpoint.requestBody) {
        code += `request.Content = new StringContent(@"${activeEndpoint.requestBody}", Encoding.UTF8, "application/json");\n`;
      }
      code += `var response = await client.SendAsync(request);\nvar json = await response.Content.ReadAsStringAsync();\nConsole.WriteLine(json);`;
      return code;
    }

    return '';
  };

  // Live Execute API Test Call
  const handleExecuteTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    setTestStatus(null);

    const startTime = Date.now();
    try {
      const headers: Record<string, string> = {
        Accept: 'application/json',
      };

      if (activeEndpoint.authRequired) {
        headers['Authorization'] = `Bearer ${testApiToken}`;
        headers['X-API-Key'] = testApiToken;
      }

      if (activeEndpoint.method !== 'GET' && testBodyInput) {
        headers['Content-Type'] = 'application/json';
      }

      const options: RequestInit = {
        method: activeEndpoint.method,
        headers,
      };

      if (activeEndpoint.method !== 'GET' && testBodyInput) {
        options.body = testBodyInput;
      }

      const res = await fetch(activeEndpoint.path, options);
      const elapsed = Date.now() - startTime;

      setTestStatus(res.status);
      const data = await res.json().catch(() => ({ rawText: 'Erro ao analisar resposta JSON' }));
      setTestResult({ ...data, _executionTimeMs: elapsed });
    } catch (err: any) {
      setTestStatus(500);
      setTestResult({ error: true, message: err.message || 'Falha de conexão com o servidor' });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center space-x-2">
              <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                REST API v1.0 • OpenAPI 3.0 Live
              </span>
              <span className="bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                Para Parceiros & VMS
              </span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <Code className="w-7 h-7 text-emerald-400" />
              Documentação de Integração API REST (Terceiros)
            </h1>
            <p className="text-xs text-slate-300 leading-relaxed">
              Forneça acesso programático a sistemas externos, softwares de portaria virtual, leitoras LPR de catracas, e plataformas VMS. Autenticação via Token Bearer ou X-API-Key.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <a
              href="/api/v1/openapi.json"
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold rounded-xl transition-all flex items-center space-x-2 shadow-lg"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Baixar OpenAPI Spec (.json)</span>
            </a>
          </div>
        </div>

        {/* Quick API Key Tester Config Bar */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2 w-full md:w-auto">
            <Key className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-slate-400 font-medium">Chave de Teste (Bearer Token):</span>
            <input
              type="text"
              value={testApiToken}
              onChange={(e) => setTestApiToken(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-200 font-mono text-xs w-64 focus:outline-none focus:border-emerald-500"
              placeholder="itl_bearer_token..."
            />
          </div>

          <div className="text-slate-400 text-[11px] flex items-center gap-2">
            <Server className="w-3.5 h-3.5 text-blue-400" />
            <span>URL Base do Servidor: <strong className="text-emerald-400 font-mono">{window.location.origin}/api/v1</strong></span>
          </div>
        </div>
      </div>

      {/* Main Grid Documentation View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Sidebar: Endpoint Categories */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Categorias de Endpoints</span>
              <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full">
                {ENDPOINTS_CATALOG.length} Mapeados
              </span>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              {[
                { id: 'all', label: 'Todos', icon: FileCode },
                { id: 'auth', label: 'Autenticação', icon: Lock },
                { id: 'admin', label: 'Painel Admin', icon: Users },
                { id: 'cameras', label: 'Câmeras RTSP', icon: Camera },
                { id: 'lpr', label: 'LPR / Placas', icon: Car },
                { id: 'alerts', label: 'Alertas', icon: Bell },
                { id: 'system', label: 'Sistema & GPU', icon: Cpu },
              ].map((cat) => {
                const Icon = cat.icon;
                const isSel = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center space-x-2 transition-all text-left ${
                      isSel
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800/80'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Endpoint Selector List */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 space-y-2 max-h-[600px] overflow-y-auto">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 pt-1">
              Selecione o Endpoint
            </div>

            <div className="space-y-1">
              {filteredEndpoints.map((ep) => {
                const isActive = activeEndpoint.id === ep.id;
                const methodColor =
                  ep.method === 'GET'
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                    : ep.method === 'POST'
                    ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                    : ep.method === 'PUT' || ep.method === 'PATCH'
                    ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                    : 'bg-rose-500/20 text-rose-400 border-rose-500/30';

                return (
                  <button
                    key={ep.id}
                    onClick={() => setActiveEndpoint(ep)}
                    className={`w-full p-2.5 rounded-xl text-left transition-all border flex flex-col space-y-1.5 ${
                      isActive
                        ? 'bg-slate-800/90 border-emerald-500/50 shadow-md'
                        : 'bg-slate-950/60 border-slate-800 hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded border font-mono uppercase ${methodColor}`}>
                        {ep.method}
                      </span>
                      {ep.authRequired ? (
                        <span className="text-[9px] text-amber-400 flex items-center gap-1 font-semibold">
                          <Lock className="w-2.5 h-2.5" /> Bearer Token
                        </span>
                      ) : (
                        <span className="text-[9px] text-emerald-400 font-semibold">Público</span>
                      )}
                    </div>
                    <div className="text-xs font-bold text-slate-200 truncate">{ep.title}</div>
                    <div className="text-[10px] font-mono text-slate-400 truncate">{ep.path}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Panel: Endpoint Detail, Code Examples & Live Tester */}
        <div className="lg:col-span-8 space-y-6">
          {/* Active Endpoint Spec Banner */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-lg">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center space-x-3">
                <span
                  className={`text-xs font-black px-3 py-1 rounded-lg border font-mono uppercase ${
                    activeEndpoint.method === 'GET'
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                      : activeEndpoint.method === 'POST'
                      ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                      : activeEndpoint.method === 'PUT' || activeEndpoint.method === 'PATCH'
                      ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                      : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                  }`}
                >
                  {activeEndpoint.method}
                </span>
                <h2 className="text-base font-mono font-bold text-white tracking-wide">{activeEndpoint.path}</h2>
              </div>

              <div className="flex items-center space-x-2">
                {activeEndpoint.authRequired ? (
                  <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> Requer Autenticação Bearer
                  </span>
                ) : (
                  <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold px-2.5 py-1 rounded-full">
                    Acesso Público / Anônimo
                  </span>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-200">{activeEndpoint.title}</h3>
              <p className="text-xs text-slate-400 mt-1">{activeEndpoint.description}</p>
            </div>

            {/* Headers Documentation */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-2">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cabeçalhos Esperados (HTTP Headers)</div>
              <div className="space-y-1 font-mono text-xs">
                <div className="flex items-center justify-between text-slate-300">
                  <span>Accept:</span>
                  <span className="text-emerald-400">application/json</span>
                </div>
                {activeEndpoint.method !== 'GET' && (
                  <div className="flex items-center justify-between text-slate-300">
                    <span>Content-Type:</span>
                    <span className="text-emerald-400">application/json</span>
                  </div>
                )}
                {activeEndpoint.authRequired && (
                  <div className="flex items-center justify-between text-slate-300">
                    <span>Authorization:</span>
                    <span className="text-amber-400">Bearer &lt;TOKEN_DE_ACESSO&gt;</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Interactive Live Tester Section */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Terminal className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Testar Endpoint ao Vivo (Try it Out)
                </h3>
              </div>

              <button
                type="button"
                onClick={handleExecuteTest}
                disabled={isTesting}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition-all flex items-center space-x-2 disabled:opacity-50"
              >
                {isTesting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-slate-950" />}
                <span>{isTesting ? 'Executando Chamada...' : 'Executar Requisição'}</span>
              </button>
            </div>

            {/* Payload Input if POST/PUT */}
            {activeEndpoint.method !== 'GET' && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                  <span>Corpo da Requisição (JSON Payload):</span>
                  <span className="text-[10px] text-slate-500">Editável para testes</span>
                </label>
                <textarea
                  rows={5}
                  value={testBodyInput}
                  onChange={(e) => setTestBodyInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-xs text-emerald-300 focus:outline-none focus:border-emerald-500"
                />
              </div>
            )}

            {/* Test Result Output Box */}
            {testResult && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-300">Resposta do Servidor:</span>
                    <span
                      className={`font-mono font-bold px-2 py-0.5 rounded text-[10px] ${
                        testStatus && testStatus < 300 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                      }`}
                    >
                      HTTP {testStatus}
                    </span>
                  </div>
                  {testResult._executionTimeMs && (
                    <span className="text-slate-400 text-[10px] font-mono">
                      Tempo de Execução: {testResult._executionTimeMs}ms
                    </span>
                  )}
                </div>

                <pre className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs text-slate-200 max-h-64 overflow-y-auto">
                  {JSON.stringify(testResult, null, 2)}
                </pre>
              </div>
            )}
          </div>

          {/* Multi-Language Code Generator Box */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-lg">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Code className="w-5 h-5 text-blue-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Gerador de Código de Exemplo
                </h3>
              </div>

              {/* Language Selector Tabs */}
              <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                {[
                  { id: 'curl', label: 'cURL' },
                  { id: 'javascript', label: 'JavaScript' },
                  { id: 'python', label: 'Python' },
                  { id: 'php', label: 'PHP' },
                  { id: 'csharp', label: 'C# / .NET' },
                ].map((lang) => (
                  <button
                    key={lang.id}
                    onClick={() => setCodeLanguage(lang.id as any)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      codeLanguage === lang.id
                        ? 'bg-emerald-500 text-slate-950 shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Code Block Container */}
            <div className="relative group">
              <button
                type="button"
                onClick={() => handleCopyCode(renderCodeSnippet())}
                className="absolute top-3 right-3 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center space-x-1.5 border border-slate-700 shadow transition-all z-10"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                <span>{copiedCode ? 'Copiado!' : 'Copiar Código'}</span>
              </button>

              <pre className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs text-emerald-400 overflow-x-auto leading-relaxed pt-12">
                {renderCodeSnippet()}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
