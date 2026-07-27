import React from 'react';
import { Camera, ShieldCheck, Bell, Lock, UserCheck, LogOut } from 'lucide-react';
import { User } from '../types';

interface NavbarProps {
  activeUser: User;
  onSelectUser: (user: User) => void;
  allUsers: User[];
  unreadAlertsCount: number;
  onOpenAlerts: () => void;
  onOpenE2EEModal: () => void;
  onOpenLoginModal: () => void;
  onLogout: () => void;
  isVaultUnlocked: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeUser,
  onSelectUser,
  allUsers,
  unreadAlertsCount,
  onOpenAlerts,
  onOpenE2EEModal,
  onOpenLoginModal,
  onLogout,
  isVaultUnlocked,
}) => {
  const isSuperAdmin = activeUser.email === 'suporte@unityautomacoes.com.br';

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white px-4 py-3 sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand & System Title */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Camera className="w-6 h-6 text-slate-950 font-bold" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="font-bold text-lg text-slate-100 tracking-tight">CENTRAL ITL</h1>
              <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                ONLINE 24H
              </span>
              {isSuperAdmin && (
                <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  SUPER ADMIN
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">Segurança ITL Fibra & Câmeras em Nuvem</p>
          </div>
        </div>

        {/* Quick Actions & Status Badges */}
        <div className="flex items-center space-x-2 md:space-x-3">
          {/* E2EE Lock Status */}
          <button
            onClick={onOpenE2EEModal}
            className={`hidden sm:flex items-center space-x-2 text-xs px-3 py-1.5 rounded-lg border transition-all ${
              isVaultUnlocked
                ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/30 hover:bg-emerald-900/50'
                : 'bg-amber-950/40 text-amber-300 border-amber-500/30 hover:bg-amber-900/50'
            }`}
            title="Criptografia Ponta a Ponta (E2EE) ativada em todos os fluxos de áudio e vídeo"
          >
            <Lock className="w-3.5 h-3.5" />
            <span className="font-medium">{isVaultUnlocked ? 'E2EE Ativo' : 'E2EE Bloqueado'}</span>
          </button>

          {/* Real-time Alerts Notification Bell */}
          <button
            onClick={onOpenAlerts}
            className="relative p-2 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition border border-slate-700"
            title="Alertas de movimento em tempo real"
          >
            <Bell className="w-5 h-5 text-slate-200" />
            {unreadAlertsCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center animate-bounce shadow-md">
                {unreadAlertsCount}
              </span>
            )}
          </button>

          {/* User Profile Info */}
          <div className="flex items-center space-x-2 bg-slate-800/80 border border-slate-700/80 rounded-xl px-2.5 py-1">
            <img
              src={activeUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
              alt={activeUser.name}
              className="w-7 h-7 rounded-full object-cover ring-1 ring-emerald-500/40"
            />
            <div className="hidden lg:block text-left">
              <p className="text-xs font-semibold text-slate-200 truncate max-w-[120px]">{activeUser.name}</p>
              <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">{activeUser.role}</p>
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={onLogout}
            className="flex items-center space-x-1 text-xs bg-slate-800 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-500/40 px-3 py-1.5 rounded-lg transition"
            title="Sair do sistema e retornar para a página inicial"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline font-medium">Sair</span>
          </button>
        </div>
      </div>
    </header>
  );
};
