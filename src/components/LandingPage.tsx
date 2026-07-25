import React, { useState } from 'react';
import {
  Shield,
  Video,
  Lock,
  Cloud,
  Bell,
  CheckCircle2,
  ArrowRight,
  MapPin,
  Smartphone,
  Server,
  Zap,
  Radio,
  Eye,
  LogIn,
  PhoneCall,
  ChevronRight,
  Check,
  ShieldAlert,
  Users,
  Star,
  Maximize2
} from 'lucide-react';
import { Camera } from '../types';
import { LiveStreamPlayer } from './LiveStreamPlayer';
import { CameraMap } from './CameraMap';

interface LandingPageProps {
  onOpenLogin: () => void;
  cameras?: Camera[];
  onSelectCamera?: (cam: Camera) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onOpenLogin,
  cameras = [],
  onSelectCamera,
}) => {
  const [activeTab, setActiveTab] = useState<'resident' | 'neighborhood' | 'business'>('neighborhood');

  // Filter ONLY tasting / demo cameras explicitly marked by admin
  const demoCameras = React.useMemo(() => {
    if (!cameras || !cameras.length) return [];
    return cameras.filter((c) => Boolean(c.isDemo || c.isLiveWebcam));
  }, [cameras]);

  const [selectedDemoIndex, setSelectedDemoIndex] = useState<number>(0);
  const activeDemoCam = demoCameras[selectedDemoIndex] || demoCameras[0];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500 selection:text-slate-950">
      {/* Top Bar Navigation */}
      <nav className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20 text-slate-950 font-black">
              <Shield className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-black text-lg tracking-tight text-white">CENTRAL ITL</span>
                <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                  MONITORAMENTO 24H
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Segurança Inteligente & Câmeras em Nuvem</p>
            </div>
          </div>

          <div className="hidden lg:flex items-center space-x-8 text-xs font-medium text-slate-300">
            <a href="#inicio" className="hover:text-emerald-400 transition">Início</a>
            <a href="#degustacao" className="hover:text-emerald-400 transition flex items-center gap-1 text-amber-400 font-bold">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> Câmeras Degustação
            </a>
            <a href="#cobertura" className="hover:text-emerald-400 transition">Mapa de Câmeras</a>
            <a href="#vantagens" className="hover:text-emerald-400 transition">Vantagens ITL</a>
            <a href="#planos" className="hover:text-emerald-400 transition">Planos</a>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={onOpenLogin}
              className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition flex items-center space-x-2"
            >
              <LogIn className="w-4 h-4" />
              <span>Acessar Minhas Câmeras</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="inicio" className="relative pt-10 pb-16 md:pt-16 md:pb-24 overflow-hidden">
        {/* Background Ambient Glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center space-x-2 px-3 py-1.5 bg-slate-900 border border-emerald-500/30 rounded-full text-emerald-400 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>Tecnologia de Transmissão ITL Fibra - Baixa Latência</span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-black text-white leading-tight">
                Sua Vizinhança e Empresa Protegidas com{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
                  Câmeras ao Vivo em Nuvem
                </span>
              </h1>

              <p className="text-slate-400 text-sm sm:text-base leading-relaxed max-w-2xl">
                Livre-se de gravações perdidas por furto de DVRs. Com a Central ITL, suas câmeras transmitem continuamente em tempo real via protocolo RTMP/RTSP de alta velocidade com criptografia E2EE ponta a ponta e inteligência artificial para detecção de movimento.
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 pt-2">
                <button
                  onClick={onOpenLogin}
                  className="px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm rounded-2xl shadow-xl shadow-emerald-500/25 transition flex items-center justify-center space-x-2"
                >
                  <Eye className="w-5 h-5" />
                  <span>Acessar Painel / Entrar</span>
                </button>

                <a
                  href="#cobertura"
                  className="px-8 py-4 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 font-bold text-sm rounded-2xl transition flex items-center justify-center space-x-2"
                >
                  <MapPin className="w-5 h-5 text-emerald-400" />
                  <span>Ver Mapa de Câmeras</span>
                </a>
              </div>

              {/* Key Trust Stats */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-900">
                <div>
                  <div className="text-xl sm:text-2xl font-black text-white">100%</div>
                  <div className="text-[11px] text-slate-400">Gravação em Nuvem</div>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-black text-emerald-400">AES-256</div>
                  <div className="text-[11px] text-slate-400">Criptografia E2EE</div>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-black text-white">24h / 7d</div>
                  <div className="text-[11px] text-slate-400">Acesso via Web e App</div>
                </div>
              </div>
            </div>

            {/* Live Camera Tasting Player (Arrow target) */}
            <div id="degustacao" className="lg:col-span-5">
              <div className="relative bg-slate-900 border border-emerald-500/30 rounded-3xl p-4 shadow-2xl overflow-hidden group space-y-3">
                {/* Selector Tabs for Tasting Cameras */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center space-x-1.5">
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400 animate-spin" style={{ animationDuration: '6s' }} />
                    <span className="text-xs font-black text-amber-300 tracking-wide uppercase">
                      Degustação ao Vivo
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                    Sinal Aberto
                  </span>
                </div>

                {demoCameras.length > 1 && (
                  <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
                    {demoCameras.map((cam, idx) => (
                      <button
                        key={cam.id}
                        onClick={() => setSelectedDemoIndex(idx)}
                        className={`px-3 py-1.5 text-xs font-bold rounded-xl whitespace-nowrap transition border ${
                          selectedDemoIndex === idx
                            ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-md scale-105'
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                        }`}
                      >
                        {cam.name}
                      </button>
                    ))}
                  </div>
                )}

                {/* Video Player Box */}
                <div className="relative rounded-2xl overflow-hidden aspect-video bg-black shadow-inner border border-slate-800">
                  {activeDemoCam ? (
                    <>
                      <LiveStreamPlayer key={activeDemoCam.id} camera={activeDemoCam} showOverlayControls={true} />
                      <div className="absolute top-3 left-3 bg-slate-950/90 backdrop-blur-sm border border-amber-400/50 text-amber-300 text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center space-x-1.5 shadow-xl z-20 pointer-events-none">
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                        <span>DEGUSTAÇÃO AO VIVO: {activeDemoCam.name}</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full p-6 text-center space-y-2 bg-slate-950">
                      <Star className="w-8 h-8 text-amber-400/50" />
                      <p className="text-xs font-bold text-slate-300">Nenhuma câmera marcada como Degustação</p>
                      <p className="text-[11px] text-slate-500 max-w-xs">
                        Para disponibilizar o sinal aberto na página inicial, acesse o painel e marque a opção "Degustação" na câmera desejada.
                      </p>
                    </div>
                  )}
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <Shield className="w-4 h-4 text-emerald-400" />
                    <span className="text-slate-300 text-[11px]">Transmissão Protegida por Token E2EE</span>
                  </div>
                  <button
                    onClick={onOpenLogin}
                    className="text-emerald-400 hover:underline text-[11px] font-bold flex items-center space-x-1"
                  >
                    <span>Entrar no Painel</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Coverage Map Section */}
      <section id="cobertura" className="py-16 bg-slate-900/50 border-y border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-emerald-400 text-xs font-bold uppercase tracking-wider bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
              Vizinhança Protegida ITL
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white">
              Mapa de Câmeras em Tempo Real
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm">
              Nossos clientes e bairros integrados contam com câmeras estratégicas transmitindo 24h por dia para garantir a segurança da comunidade.
            </p>
          </div>

          <CameraMap
            cameras={cameras}
            onSelectCamera={(cam) => {
              if (onSelectCamera) onSelectCamera(cam);
              onOpenLogin();
            }}
          />
        </div>
      </section>

      {/* Services Section */}
      <section id="sobre" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <h2 className="text-2xl sm:text-4xl font-black text-white">
            Solução Completa em Monitoramento
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm">
            Tudo o que sua residência, condomínio ou empresa precisa para ter tranquilidade
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4 hover:border-emerald-500/40 transition">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Cloud className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">Gravação 100% na Nuvem</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Sem risco de destruição de arquivos ou roubo do DVR. Suas imagens ficam armazenadas com backup redundante no servidor VPS dedicado.
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4 hover:border-emerald-500/40 transition">
            <div className="w-12 h-12 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">Criptografia E2EE Ponta a Ponta</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Cofre digital com senha mestre. Somente você e seus usuários autorizados possuem a chave para decodificar e assistir às streams.
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4 hover:border-emerald-500/40 transition">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">Detecção de Movimento por IA</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Alertas inteligentes com classificação de eventos (pessoas, veículos, invasões) direto no seu celular com snapshot em tempo real.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center space-x-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span className="font-bold text-slate-300">Central ITL Monitoramento 24h</span>
            <span>• Todos os direitos reservados</span>
          </div>
          <div className="flex items-center space-x-6">
            <span>Servidor dedicado RTMP/RTSP</span>
            <span>Tecnologia ITL Fibra</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
