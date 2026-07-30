import React, { useState } from 'react';
import {
  UserCheck,
  Shield,
  Search,
  Plus,
  Trash2,
  AlertOctagon,
  CheckCircle2,
  XCircle,
  FileText,
  Upload,
  UserX,
  Lock,
  Layers,
  Sparkles,
  Eye,
  Settings,
  HelpCircle,
  Filter,
} from 'lucide-react';
import { Person, FaceDetection, FaceSettings, User } from '../types';

interface FacialRecognitionPanelProps {
  persons: Person[];
  faceDetections: FaceDetection[];
  faceSettings: FaceSettings;
  activeUser: User;
  onAddPerson: (person: Omit<Person, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onDeletePerson: (id: string) => Promise<void>;
  onUpdateConsentStatus: (id: string, status: Person['consentStatus']) => Promise<void>;
  onManualReviewDecision: (
    detectionId: string,
    decision: 'MATCH' | 'NO_MATCH',
    personId?: string
  ) => Promise<void>;
  onUpdateFaceSettings: (settings: FaceSettings) => Promise<void>;
}

export const FacialRecognitionPanel: React.FC<FacialRecognitionPanelProps> = ({
  persons,
  faceDetections,
  faceSettings,
  activeUser,
  onAddPerson,
  onDeletePerson,
  onUpdateConsentStatus,
  onManualReviewDecision,
  onUpdateFaceSettings,
}) => {
  const [activeTab, setActiveTab] = useState<'detections' | 'persons' | 'search' | 'settings'>('detections');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');

  // Modal State for New Person Registration
  const [isAddPersonModalOpen, setIsAddPersonModalOpen] = useState(false);
  const [newPersonName, setNewPersonName] = useState('');
  const [newPersonDoc, setNewPersonDoc] = useState('');
  const [newPersonType, setNewPersonType] = useState<Person['type']>('RESIDENT');
  const [newPersonConsent, setNewPersonConsent] = useState<Person['consentStatus']>('GRANTED');
  const [newPersonPhoto, setNewPersonPhoto] = useState<string>('');
  const [newPersonNotes, setNewPersonNotes] = useState('');

  // Vector Search state
  const [vectorSearchPreview, setVectorSearchPreview] = useState<string | null>(null);
  const [vectorSearchResults, setVectorSearchResults] = useState<
    { person: Person; similarity: number }[]
  >([]);
  const [isSearchingVector, setIsSearchingVector] = useState(false);

  const handleCreatePerson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPersonName.trim()) return;

    await onAddPerson({
      name: newPersonName,
      document: newPersonDoc,
      type: newPersonType,
      status: 'ACTIVE',
      photoUrls: [
        newPersonPhoto ||
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
      ],
      consentStatus: newPersonConsent,
      notes: newPersonNotes,
      retentionUntil: '2028-12-31',
    });

    setIsAddPersonModalOpen(false);
    setNewPersonName('');
    setNewPersonDoc('');
    setNewPersonPhoto('');
    setNewPersonNotes('');
  };

  const handleSimulateVectorSearch = (photoUrl: string) => {
    setVectorSearchPreview(photoUrl);
    setIsSearchingVector(true);
    setTimeout(() => {
      // Simulate cosine similarity matching on pgvector embeddings
      const results = persons.map((p, idx) => ({
        person: p,
        similarity: Number((98.5 - idx * 12.2).toFixed(1)),
      }));
      setVectorSearchResults(results.filter((r) => r.similarity > 50));
      setIsSearchingVector(false);
    }, 600);
  };

  const filteredDetections = faceDetections.filter((d) => {
    const matchesSearch =
      d.personName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.cameraName.toLowerCase().includes(searchTerm.toLowerCase());
    if (filterType === 'WATCHLIST') return matchesSearch && d.isWatchlistAlert;
    if (filterType === 'REVIEW') return matchesSearch && d.decision === 'MANUAL_REVIEW';
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950 p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <UserCheck className="w-6 h-6 text-indigo-400" />
            <h1 className="text-xl font-black text-white tracking-tight">Módulo de Reconhecimento Facial & Biometria</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              PGVECTOR 512D
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Detecção SCRFD/RetinaFace, extração ArcFace de 512 dimensões, busca de vizinhos em tempo real e conformidade LGPD.
          </p>
        </div>

        <button
          onClick={() => setIsAddPersonModalOpen(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-lg"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Pessoa com Biometria</span>
        </button>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex space-x-2 border-b border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('detections')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition ${
            activeTab === 'detections'
              ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Eye className="w-4 h-4" />
          <span>Detecções Faciais ({faceDetections.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('persons')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition ${
            activeTab === 'persons'
              ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Diretório de Pessoas ({persons.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('search')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition ${
            activeTab === 'search'
              ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Search className="w-4 h-4" />
          <span>Busca por Vetores de Foto (pgvector)</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition ${
            activeTab === 'settings'
              ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Parâmetros de IA Facial</span>
        </button>
      </div>

      {/* TAB 1: Face Detections Feed */}
      {activeTab === 'detections' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Buscar por nome ou câmera..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 text-xs text-white pl-9 pr-3 py-2 rounded-xl focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setFilterType('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                  filterType === 'ALL' ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400'
                }`}
              >
                Todas
              </button>
              <button
                onClick={() => setFilterType('WATCHLIST')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                  filterType === 'WATCHLIST' ? 'bg-rose-600 text-white' : 'bg-slate-900 text-slate-400'
                }`}
              >
                Alertas Watchlist
              </button>
              <button
                onClick={() => setFilterType('REVIEW')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                  filterType === 'REVIEW' ? 'bg-amber-600 text-white' : 'bg-slate-900 text-slate-400'
                }`}
              >
                Revisão Manual
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredDetections.map((det) => (
              <div
                key={det.id}
                className={`p-4 bg-slate-900 border rounded-2xl space-y-3 shadow-lg transition ${
                  det.isWatchlistAlert
                    ? 'border-rose-500/60 bg-rose-950/20'
                    : 'border-slate-800'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <img
                      src={det.faceCropUrl}
                      alt="Face Crop"
                      className="w-14 h-14 rounded-xl object-cover ring-2 ring-indigo-500/50"
                    />
                    <div>
                      <h4 className="font-bold text-sm text-white">
                        {det.personName || 'Pessoa Desconhecida'}
                      </h4>
                      <p className="text-xs text-slate-400">{det.cameraName}</p>
                      <p className="text-[10px] text-slate-500">{det.timestamp}</p>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      det.isWatchlistAlert
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                        : det.decision === 'MATCH'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}
                  >
                    {det.isWatchlistAlert ? '🚨 ALERTA WATCHLIST' : det.decision}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-[11px] bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 text-center">
                  <div>
                    <span className="text-slate-500 block">Similaridade</span>
                    <span className="font-bold text-indigo-400">{det.similarity || 0}%</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Qualidade Face</span>
                    <span className="font-bold text-cyan-400">{det.qualityScore}%</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Local</span>
                    <span className="font-semibold text-slate-300 truncate block">
                      {det.location || 'Acesso Principal'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <button
                    onClick={() => handleSimulateVectorSearch(det.faceCropUrl)}
                    className="text-[11px] text-indigo-400 font-semibold hover:underline flex items-center space-x-1"
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>Buscar no banco pgvector</span>
                  </button>

                  {det.decision === 'MANUAL_REVIEW' && (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => onManualReviewDecision(det.id, 'MATCH', det.personId)}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold rounded-lg"
                      >
                        Confirmar Match
                      </button>
                      <button
                        onClick={() => onManualReviewDecision(det.id, 'NO_MATCH')}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold rounded-lg"
                      >
                        Rejeitar
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: Person Directory */}
      {activeTab === 'persons' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {persons.map((p) => (
              <div
                key={p.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 relative group"
              >
                <div className="flex items-start space-x-4">
                  <img
                    src={p.photoUrls[0]}
                    alt={p.name}
                    className="w-16 h-16 rounded-2xl object-cover ring-2 ring-indigo-500/40"
                  />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-sm text-white">{p.name}</h4>
                      <button
                        onClick={() => onDeletePerson(p.id)}
                        className="opacity-0 group-hover:opacity-100 transition text-slate-500 hover:text-rose-400 p-1"
                        title="Remover Cadastro"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-xs text-slate-400">{p.document || 'Sem Documento'}</p>
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                        p.type === 'WATCHLIST'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : p.type === 'RESIDENT'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-indigo-500/20 text-indigo-300'
                      }`}
                    >
                      {p.type}
                    </span>
                  </div>
                </div>

                <div className="text-xs space-y-1 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Status Consentimento LGPD:</span>
                    <span
                      className={`font-bold ${
                        p.consentStatus === 'GRANTED'
                          ? 'text-emerald-400'
                          : p.consentStatus === 'REVOKED'
                          ? 'text-rose-400'
                          : 'text-amber-400'
                      }`}
                    >
                      {p.consentStatus}
                    </span>
                  </div>
                  {p.retentionUntil && (
                    <div className="flex justify-between items-center text-[10px] text-slate-400">
                      <span>Retenção até:</span>
                      <span>{p.retentionUntil}</span>
                    </div>
                  )}
                  {p.notes && <p className="text-[11px] text-slate-300 pt-1 italic">"{p.notes}"</p>}
                </div>

                <div className="flex items-center justify-between pt-1">
                  <select
                    value={p.consentStatus}
                    onChange={(e) =>
                      onUpdateConsentStatus(p.id, e.target.value as Person['consentStatus'])
                    }
                    className="bg-slate-950 border border-slate-800 text-[11px] text-slate-300 rounded px-2 py-1 focus:outline-none"
                  >
                    <option value="GRANTED">Consentimento Concedido</option>
                    <option value="REVOKED">Consentimento Revogado</option>
                    <option value="PENDING">Pendente</option>
                    <option value="NOT_REQUIRED">Segurança Pública / Não Requerido</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: Vector Search */}
      {activeTab === 'search' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>Mecanismo de Busca Vetorial por Embeddings (pgvector)</span>
            </h3>
            <p className="text-xs text-slate-400">
              Selecione ou envie a foto de um rosto para gerar o vetor de 512 dimensões via ArcFace e buscar vizinhos mais próximos.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
              <label className="block text-xs font-bold text-slate-300">Escolher Rosto para Comparação:</label>
              <div className="grid grid-cols-3 gap-2">
                {persons.map((p) => (
                  <img
                    key={p.id}
                    src={p.photoUrls[0]}
                    onClick={() => handleSimulateVectorSearch(p.photoUrls[0])}
                    alt={p.name}
                    className={`w-full h-20 object-cover rounded-xl cursor-pointer hover:opacity-80 transition ring-2 ${
                      vectorSearchPreview === p.photoUrls[0] ? 'ring-indigo-500' : 'ring-transparent'
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="md:col-span-2 space-y-3">
              <h4 className="text-xs font-bold text-slate-300">Resultados da Busca Vetorial Cosine:</h4>
              {isSearchingVector ? (
                <div className="p-8 text-center text-xs text-indigo-400 font-semibold animate-pulse">
                  Gerando embedding ArcFace 512d e realizando Cosine Distance no pgvector...
                </div>
              ) : vectorSearchResults.length > 0 ? (
                <div className="space-y-2">
                  {vectorSearchResults.map((res) => (
                    <div
                      key={res.person.id}
                      className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-3">
                        <img
                          src={res.person.photoUrls[0]}
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                        <div>
                          <p className="font-bold text-xs text-white">{res.person.name}</p>
                          <p className="text-[10px] text-slate-400">{res.person.type}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-black text-emerald-400">{res.similarity}%</span>
                        <span className="block text-[10px] text-slate-500">Similaridade Cosine</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">
                  Selecione uma foto à esquerda para simular a busca no banco vetorial.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Facial Settings */}
      {activeTab === 'settings' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 max-w-2xl">
          <h3 className="text-sm font-bold text-white">Parâmetros do Módulo Facial</h3>
          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">Tamanho Mínimo da Face na Imagem (px)</label>
              <input
                type="number"
                value={faceSettings.minFaceSizePx}
                onChange={(e) =>
                  onUpdateFaceSettings({ ...faceSettings, minFaceSizePx: Number(e.target.value) })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-white"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Limiar Mínimo de Similaridade para Match (%)</label>
              <input
                type="number"
                value={faceSettings.minSimilarityThreshold}
                onChange={(e) =>
                  onUpdateFaceSettings({ ...faceSettings, minSimilarityThreshold: Number(e.target.value) })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-white"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Detector Principal</label>
              <select
                value={faceSettings.preferredDetector}
                onChange={(e) =>
                  onUpdateFaceSettings({ ...faceSettings, preferredDetector: e.target.value as any })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-white"
              >
                <option value="SCRFD">SCRFD (Alta Velocidade e Ângulos Oblíquos)</option>
                <option value="RetinaFace">RetinaFace (Alta Precisão ResNet)</option>
                <option value="YOLO-Face">YOLOv8-Face (Aceleração TensorRT)</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Banco Vetorial</label>
              <select
                value={faceSettings.vectorEngine}
                onChange={(e) =>
                  onUpdateFaceSettings({ ...faceSettings, vectorEngine: e.target.value as any })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-white"
              >
                <option value="pgvector">PostgreSQL + extension pgvector (HNSW / IVFFlat Index)</option>
                <option value="Qdrant">Qdrant Vector DB (Cluster Distribuição)</option>
                <option value="Milvus">Milvus Vector Search</option>
                <option value="FAISS">FAISS GPU Indexing</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Add Person Modal */}
      {isAddPersonModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="font-bold text-base text-white">Novo Cadastro Biométrico Facial</h3>

            <form onSubmit={handleCreatePerson} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Nome Completo *</label>
                <input
                  type="text"
                  required
                  value={newPersonName}
                  onChange={(e) => setNewPersonName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                  placeholder="Ex: Ana Clara Souza"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Documento (CPF / RG)</label>
                <input
                  type="text"
                  value={newPersonDoc}
                  onChange={(e) => setNewPersonDoc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                  placeholder="Ex: 000.111.222-33"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Tipo de Perfil</label>
                <select
                  value={newPersonType}
                  onChange={(e) => setNewPersonType(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                >
                  <option value="RESIDENT">Morador / Cliente</option>
                  <option value="EMPLOYEE">Funcionário / Operador ISP</option>
                  <option value="VISITOR">Visitante / Prestador</option>
                  <option value="WATCHLIST">Watchlist / Alerta de Segurança</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Status de Consentimento LGPD</label>
                <select
                  value={newPersonConsent}
                  onChange={(e) => setNewPersonConsent(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                >
                  <option value="GRANTED">Concedido (Termo Assinado)</option>
                  <option value="PENDING">Pendente</option>
                  <option value="REVOKED">Revogado</option>
                  <option value="NOT_REQUIRED">Segurança Pública (Inclusão Judicial)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">URL da Foto do Rosto</label>
                <input
                  type="text"
                  value={newPersonPhoto}
                  onChange={(e) => setNewPersonPhoto(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                  placeholder="https://exemplo.com/foto.jpg"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Observações</label>
                <textarea
                  value={newPersonNotes}
                  onChange={(e) => setNewPersonNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white h-20"
                  placeholder="Notas adicionais..."
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddPersonModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 font-bold rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl"
                >
                  Salvar Cadastro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
