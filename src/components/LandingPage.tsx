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
} from 'lucide-react';

interface LandingPageProps {
  onOpenLogin: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onOpenLogin }) => {
  const [activeTab, setActiveTab] = useState<'resident' | 'neighborhood' | 'business'>('neighborhood');
  const [selectedDemoSpot, setSelectedDemoSpot] = useState<number>(0);

  const demoLocations = [
    {
      id: 0,
      city: 'Itamaraju - BA',
      name: 'Praça Castelo Branco - Totem Vizinhança Protegida',
      type: 'Câmera Comunitária ao Vivo',
      status: 'TRANSMITINDO (RTMP)',
      img: 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=800&auto=format&fit=crop&q=80',
      lat: '-17.0397',
      lng: '-39.5312',
    },
    {
      id: 1,
      city: 'Salvador - BA',
      name: 'Avenida ACM - Monitoramento Comercial',
      type: 'Gravação em Nuvem 24h',
      status: 'TRANSMITINDO (RTSP)',
      img: 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?w=800&auto=format&fit=crop&q=80',
      lat: '-12.9777',
      lng: '-38.5016',
    },
    {
      id: 2,
      city: 'São Paulo - SP',
      name: 'Alameda Santos - Entrada Condominial VIP',
      type: 'IA Reconhecimento de Placas',
      status: 'TRANSMITINDO (RTMP)',
      img: 'https://images.unsplash.com/photo-1508873696983-2df515122519?w=800&auto=format&fit=crop&q=80',
      lat: '-23.5615',
      lng: '-46.6559',
    },
  ];

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
            <a href="#sobre" className="hover:text-emerald-400 transition">Sobre o Serviço</a>
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
      <section id="inicio" className="relative pt-12 pb-20 md:pt-20 md:pb-32 overflow-hidden">
        {/* Background Ambient Glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
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

            {/* Live Camera Player Mockup */}
            <div className="lg:col-span-5">
              <div className="relative bg-slate-900 border border-slate-800 rounded-3xl p-3 shadow-2xl overflow-hidden group">
                <div className="relative rounded-2xl overflow-hidden aspect-video bg-black">
                  <img
                    src={demoLocations[selectedDemoSpot].img}
                    alt="Câmera ao Vivo ITL"
                    className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition duration-500"
                  />
                  <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-sm border border-emerald-500/40 text-emerald-400 text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>AO VIVO - ITL FIBRA</span>
                  </div>

                  <div className="absolute bottom-3 left-3 right-3 bg-slate-950/85 backdrop-blur-sm border border-slate-800 p-2.5 rounded-xl text-xs space-y-1">
                    <div className="text-white font-bold truncate">{demoLocations[selectedDemoSpot].name}</div>
                    <div className="text-[10px] text-slate-400 flex justify-between items-center">
                      <span>{demoLocations[selectedDemoSpot].city}</span>
                      <span className="text-emerald-400 font-mono">4K Ultra HD • 60 FPS</span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <Shield className="w-4 h-4 text-emerald-400" />
                    <span className="text-slate-300 text-[11px]">Transmissão Protegida por Token E2EE</span>
                  </div>
                  <button
                    onClick={onOpenLogin}
                    className="text-emerald-400 hover:underline text-[11px] font-bold flex items-center space-x-1"
                  >
                    <span>Logar</span>
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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Location selector sidebar */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Pontos de Câmeras em Destaque:
              </h3>
              {demoLocations.map((loc, idx) => (
                <button
                  key={loc.id}
                  onClick={() => setSelectedDemoSpot(idx)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all ${
                    selectedDemoSpot === idx
                      ? 'bg-slate-900 border-emerald-500/60 text-white shadow-lg shadow-emerald-500/10'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-emerald-400">{loc.city}</span>
                    <span className="text-[10px] font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                      {loc.status}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-slate-100">{loc.name}</div>
                  <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-rose-400" />
                    <span>GPS: {loc.lat}, {loc.lng}</span>
                  </div>
                </button>
              ))}

              <div className="p-4 bg-emerald-950/30 border border-emerald-500/30 rounded-2xl text-xs space-y-2">
                <div className="font-bold text-emerald-400 flex items-center gap-1.5">
                  <Users className="w-4 h-4" /> Deseja proteger sua rua ou bairro?
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Contrate o plano **Vizinhança Protegida ITL** e compartilhe o acesso das câmeras com todos os seus vizinhos cadastrados com chave individual de acesso.
                </p>
              </div>
            </div>

            {/* Interactive Map Canvas Simulation */}
            <div className="lg:col-span-2 bg-slate-950 border border-slate-800 rounded-3xl p-4 relative min-h-[380px] flex flex-col justify-between overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-40" />

              {/* Map overlay header */}
              <div className="relative z-10 flex justify-between items-center bg-slate-900/90 border border-slate-800 p-3 rounded-2xl text-xs">
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-emerald-400" />
                  <span className="font-bold text-white">Visualização de Cobertura de Câmeras</span>
                </div>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-mono px-2 py-0.5 rounded">
                  Sinal Estável • Servidor ITL VPS
                </span>
              </div>

              {/* Map Hotspots */}
              <div className="relative z-10 my-auto grid grid-cols-1 md:grid-cols-3 gap-4 py-6">
                {demoLocations.map((loc, i) => (
                  <div
                    key={loc.id}
                    onClick={() => setSelectedDemoSpot(i)}
                    className={`cursor-pointer p-4 rounded-2xl border transition-all ${
                      selectedDemoSpot === i
                        ? 'bg-slate-900 border-emerald-500 scale-105 shadow-xl shadow-emerald-500/20'
                        : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
                      <span className="text-xs font-bold text-white">{loc.city}</span>
                    </div>
                    <p className="text-[11px] text-slate-300 font-medium line-clamp-2">{loc.name}</p>
                    <div className="mt-3 text-[10px] text-emerald-400 font-mono font-bold flex items-center justify-between border-t border-slate-800 pt-2">
                      <span>{loc.type}</span>
                      <ArrowRight className="w-3 h-3" />
                    </div>
                  </div>
                ))}
              </div>

              {/* Map Footer Note */}
              <div className="relative z-10 text-[11px] text-slate-400 text-center bg-slate-900/80 border border-slate-800 p-2.5 rounded-xl">
                O cliente contratante possui credenciais exclusivas para visualizar apenas as câmeras do seu pacote contratado com total sigilo.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Grid Section */}
      <section id="vantagens" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <h2 className="text-2xl sm:text-4xl font-black text-white">
              Por que contratar o Monitoramento em Nuvem ITL?
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm">
              Esqueça sistemas antigos com cabos expostos, DVRs vulneráveis a roubo ou aplicativos lentos que travam na hora da emergência.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-3 hover:border-emerald-500/40 transition">
              <div className="w-10 h-10 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center font-bold">
                <Cloud className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Gravação Contínua em Nuvem</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Mesmo que quebrem ou furtem a câmera física no local, todas as suas gravações ficam salvas de forma segura no servidor em nuvem da ITL Fibra.
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-3 hover:border-emerald-500/40 transition">
              <div className="w-10 h-10 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center font-bold">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Criptografia E2EE (Ponta a Ponta)</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Suas câmeras são protegidas com algoritmos avançados de criptografia AES-256. Apenas usuários autorizados com a chave do cofre têm acesso ao vídeo.
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-3 hover:border-emerald-500/40 transition">
              <div className="w-10 h-10 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center font-bold">
                <Bell className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Alertas de Movimento com IA</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Receba notificações push instantâneas no seu celular ao detectar pessoas ou veículos em áreas restritas durante horários suspeitos.
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-3 hover:border-emerald-500/40 transition">
              <div className="w-10 h-10 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center font-bold">
                <Radio className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Suporte RTSP & RTMP Push</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Compatível com as principais marcas de mercado (Intelbras, Hikvision, Dahua, Yoosee, etc.) enviando streams diretamente sem necessidade de IP fixo.
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-3 hover:border-emerald-500/40 transition">
              <div className="w-10 h-10 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center font-bold">
                <Smartphone className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Acesso Multiusuário e Permissões</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Defina diferentes níveis de acesso para familiares, moradores ou portaria 24h (somente visualização ao vivo, controle PTZ ou exportação de gravações).
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-3 hover:border-emerald-500/40 transition">
              <div className="w-10 h-10 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center font-bold">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Velocidade e Fibra Óptica ITL</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Servidores hospedados diretamente no backbone de fibra de alta performance para reprodução instantânea sem travamentos ou bufferings demorados.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Subscription Plans Section */}
      <section id="planos" className="py-20 bg-slate-900/40 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-emerald-400 text-xs font-bold uppercase tracking-wider bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
              Escolha seu Plano de Monitoramento
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white">
              Planos Flexíveis para Cada Necessidade
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm">
              Contrate câmeras individuais para sua casa ou integre todo o seu condomínio e bairro no modelo Vizinhança Protegida.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Plan 1: Residencial */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 relative flex flex-col justify-between hover:border-slate-700 transition">
              <div className="space-y-4">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Plano Residencial</span>
                <h3 className="text-xl font-black text-white">Residência Protegida</h3>
                <div className="flex items-baseline space-x-1">
                  <span className="text-3xl font-black text-emerald-400">R$ 29,90</span>
                  <span className="text-xs text-slate-400">/mês por câmera</span>
                </div>
                <p className="text-xs text-slate-400">Perfeito para casas, garagens e pequenos comércios.</p>

                <ul className="space-y-3 text-xs text-slate-300 pt-4 border-t border-slate-800">
                  <li className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>Transmissão ao vivo 24h HD</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>7 dias de gravação em nuvem</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>Alertas de movimento no celular</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>Criptografia E2EE AES-256</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={onOpenLogin}
                className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold text-xs rounded-xl transition"
              >
                Contratar / Logar
              </button>
            </div>

            {/* Plan 2: Vizinhança Protegida (POPULAR) */}
            <div className="bg-slate-900 border-2 border-emerald-500 rounded-3xl p-6 space-y-6 relative flex flex-col justify-between shadow-2xl shadow-emerald-500/10">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-emerald-500 text-slate-950 font-black text-[10px] uppercase px-3 py-1 rounded-full tracking-wider">
                Mais Recomendado
              </div>

              <div className="space-y-4">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Plano Coletivo</span>
                <h3 className="text-xl font-black text-white">Vizinhança Protegida ITL</h3>
                <div className="flex items-baseline space-x-1">
                  <span className="text-3xl font-black text-emerald-400">R$ 19,90</span>
                  <span className="text-xs text-slate-400">/mês por morador</span>
                </div>
                <p className="text-xs text-slate-400">Câmeras estrategicamente posicionadas em ruas e esquinas de bairros.</p>

                <ul className="space-y-3 text-xs text-slate-300 pt-4 border-t border-slate-800">
                  <li className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>Acesso compartilhado a todas as câmeras da rua</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>15 dias de histórico de gravações em nuvem</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>Botão de pânico e alerta comunitário</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>Download e exportação simplificada de trechos</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={onOpenLogin}
                className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs rounded-xl transition shadow-lg shadow-emerald-500/20"
              >
                Acessar Vizinhança Protegida
              </button>
            </div>

            {/* Plan 3: Empresarial */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 relative flex flex-col justify-between hover:border-slate-700 transition">
              <div className="space-y-4">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Plano Corporativo</span>
                <h3 className="text-xl font-black text-white">Empresas & Condomínios</h3>
                <div className="flex items-baseline space-x-1">
                  <span className="text-3xl font-black text-emerald-400">R$ 149,90</span>
                  <span className="text-xs text-slate-400">/mês por central</span>
                </div>
                <p className="text-xs text-slate-400">Para portarias 24h, galpões e múltiplas câmeras RTMP/RTSP.</p>

                <ul className="space-y-3 text-xs text-slate-300 pt-4 border-t border-slate-800">
                  <li className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>Usuários ilimitados com controle de perfil</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>30 dias de gravação contínua Full HD / 4K</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>Controle PTZ e Áudio Bidirecional</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>Suporte técnico prioritário ITL Fibra 24h</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={onOpenLogin}
                className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold text-xs rounded-xl transition"
              >
                Solicitar Proposta
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-800 py-12 text-slate-400 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-emerald-500 rounded-xl flex items-center justify-center text-slate-950 font-black">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <span className="font-extrabold text-slate-100 text-sm">CENTRAL ITL</span>
                <p className="text-[11px] text-slate-500">Sistema Profissional de Monitoramento e Câmeras em Nuvem</p>
              </div>
            </div>

            <div className="flex items-center space-x-6 text-slate-400">
              <a href="#inicio" className="hover:text-emerald-400 transition">Início</a>
              <a href="#cobertura" className="hover:text-emerald-400 transition">Mapa de Câmeras</a>
              <a href="#planos" className="hover:text-emerald-400 transition">Planos</a>
              <button onClick={onOpenLogin} className="text-emerald-400 hover:underline font-bold">
                Área de Clientes
              </button>
            </div>
          </div>

          <div className="border-t border-slate-900 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-[11px]">
            <p>© 2026 Central ITL & Unity Automações. Todos os direitos reservados.</p>
            <p className="text-slate-500">Suporte Técnico: suporte@unityautomacoes.com.br</p>
          </div>
        </div>
      </footer>
    </div>
  );
};
