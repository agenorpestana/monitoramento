import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  ShieldCheck,
  Lock,
  Trash2,
  Camera as CameraIcon,
  Check,
  Eye,
  Sliders,
  X
} from 'lucide-react';
import { User, UserRole, CustomPermissions, Camera } from '../types';

interface UserManagementProps {
  users: User[];
  cameras: Camera[];
  activeUser: User;
  onAddUser: (userData: Partial<User>) => void;
  onUpdateUser: (id: string, userData: Partial<User>) => void;
  onDeleteUser: (id: string) => void;
}

export const UserManagement: React.FC<UserManagementProps> = ({
  users,
  cameras,
  activeUser,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCameraAccessUser, setEditingCameraAccessUser] = useState<User | null>(null);

  const [formState, setFormState] = useState({
    name: '',
    email: '',
    role: 'RESIDENT' as UserRole,
    phone: '',
    allowedCameraIds: ['ALL'] as string[],
    customPermissions: {
      canViewLive: true,
      canViewRecordings: true,
      canControlPTZ: false,
      canUseTwoWayAudio: false,
      canManageCameras: false,
      canDeleteRecordings: false,
      canAccessAuditLogs: false,
      canManageUsers: false,
      canExportReports: false,
    } as CustomPermissions,
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeUser.customPermissions.canManageUsers) {
      alert('Sua conta não tem permissão para gerenciar usuários.');
      return;
    }
    if (!formState.name || !formState.email) {
      alert('Nome e Email são obrigatórios');
      return;
    }

    onAddUser({
      ...formState,
      allowedCameraIds: formState.allowedCameraIds.length === 0 ? ['ALL'] : formState.allowedCameraIds,
    });

    setShowAddModal(false);
    setFormState({
      name: '',
      email: '',
      role: 'RESIDENT',
      phone: '',
      allowedCameraIds: ['ALL'],
      customPermissions: {
        canViewLive: true,
        canViewRecordings: true,
        canControlPTZ: false,
        canUseTwoWayAudio: false,
        canManageCameras: false,
        canDeleteRecordings: false,
        canAccessAuditLogs: false,
        canManageUsers: false,
        canExportReports: false,
      },
    });
  };

  const handleTogglePermission = (key: keyof CustomPermissions, targetUser?: User) => {
    if (targetUser) {
      const updatedPermissions = {
        ...targetUser.customPermissions,
        [key]: !targetUser.customPermissions[key],
      };
      onUpdateUser(targetUser.id, { customPermissions: updatedPermissions });
    } else {
      setFormState({
        ...formState,
        customPermissions: {
          ...formState.customPermissions,
          [key]: !formState.customPermissions[key],
        },
      });
    }
  };

  const handleToggleFormCamera = (camId: string) => {
    let current = [...formState.allowedCameraIds];

    if (camId === 'ALL') {
      setFormState({ ...formState, allowedCameraIds: ['ALL'] });
      return;
    }

    // Remove 'ALL' if specific camera selected
    current = current.filter((id) => id !== 'ALL');

    if (current.includes(camId)) {
      current = current.filter((id) => id !== camId);
      if (current.length === 0) current = ['ALL'];
    } else {
      current.push(camId);
    }

    setFormState({ ...formState, allowedCameraIds: current });
  };

  const handleToggleUserCameraAccess = (user: User, camId: string) => {
    let current = [...(user.allowedCameraIds || ['ALL'])];

    if (camId === 'ALL') {
      onUpdateUser(user.id, { allowedCameraIds: ['ALL'] });
      return;
    }

    current = current.filter((id) => id !== 'ALL');

    if (current.includes(camId)) {
      current = current.filter((id) => id !== camId);
      if (current.length === 0) current = ['ALL'];
    } else {
      current.push(camId);
    }

    onUpdateUser(user.id, { allowedCameraIds: current });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 p-4 rounded-2xl">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-400" />
            Acesso Multiusuário com Seleção de Câmeras Autorizadas
          </h2>
          <p className="text-xs text-slate-400">
            Defina perfis, permissões granulares e escolha exatamente quais câmeras cada usuário pode visualizar
          </p>
        </div>

        {activeUser.customPermissions.canManageUsers && (
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl flex items-center space-x-2 transition shadow-lg shadow-emerald-500/20"
          >
            <UserPlus className="w-4 h-4" />
            <span>Novo Usuário</span>
          </button>
        )}
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <form onSubmit={handleCreate} className="bg-slate-900 border border-emerald-500/30 p-6 rounded-2xl space-y-4 shadow-2xl">
          <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2 border-b border-slate-800 pb-2">
            <UserPlus className="w-4 h-4" /> Cadastrar Usuário e Vincular Câmeras
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Nome Completo:</label>
              <input
                type="text"
                placeholder="Ex: João Silva"
                value={formState.name}
                onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 text-slate-100 px-3 py-2 rounded-xl outline-none focus:border-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Email:</label>
              <input
                type="email"
                placeholder="joao@email.com"
                value={formState.email}
                onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 text-slate-100 px-3 py-2 rounded-xl outline-none focus:border-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Perfil de Acesso (Função):</label>
              <select
                value={formState.role}
                onChange={(e) => setFormState({ ...formState, role: e.target.value as UserRole })}
                className="w-full bg-slate-950 border border-slate-800 text-slate-100 px-3 py-2 rounded-xl outline-none focus:border-emerald-500"
              >
                <option value="ADMIN">ADMINISTRADOR (Acesso Total)</option>
                <option value="OPERATOR">OPERADOR (Portaria/Central)</option>
                <option value="GUARD">RONDA / SEGURANÇA</option>
                <option value="RESIDENT">MORADOR / VIZINHO</option>
                <option value="VIEWER">VISUALIZADOR</option>
              </select>
            </div>
          </div>

          {/* Camera Selection Section */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-2">
                <CameraIcon className="w-4 h-4 text-emerald-400" /> Câmeras Autorizadas para este Usuário:
              </span>
              <label className="flex items-center space-x-2 cursor-pointer text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                <input
                  type="checkbox"
                  checked={formState.allowedCameraIds.includes('ALL')}
                  onChange={() => handleToggleFormCamera('ALL')}
                  className="accent-emerald-500 rounded"
                />
                <span>Acesso Total (Todas as Câmeras)</span>
              </label>
            </div>

            {!formState.allowedCameraIds.includes('ALL') && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs pt-1">
                {cameras.map((cam) => {
                  const isChecked = formState.allowedCameraIds.includes(cam.id);
                  return (
                    <label
                      key={cam.id}
                      className={`flex items-center space-x-2 p-2.5 rounded-xl border cursor-pointer transition ${
                        isChecked
                          ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleFormCamera(cam.id)}
                        className="accent-emerald-500 rounded"
                      />
                      <div className="truncate text-xs">
                        <div className="font-bold">{cam.name}</div>
                        <div className="text-[10px] text-slate-500">{cam.location}</div>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* Granular Permission Toggles */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <p className="text-xs font-bold text-slate-200">Matriz de Permissões Granulares:</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs text-slate-300">
              {Object.entries({
                canViewLive: 'Ver Câmeras ao Vivo',
                canViewRecordings: 'Ver Gravações na Nuvem',
                canControlPTZ: 'Controle de Câmeras PTZ',
                canUseTwoWayAudio: 'Áudio Bidirecional (RTMP)',
                canManageCameras: 'Adicionar/Excluir Câmeras',
                canDeleteRecordings: 'Excluir Gravações',
                canAccessAuditLogs: 'Acessar Logs de Auditoria',
                canManageUsers: 'Gerenciar Usuários',
                canExportReports: 'Exportar Relatórios',
              }).map(([key, label]) => (
                <label key={key} className="flex items-center space-x-2 cursor-pointer bg-slate-900 p-2 rounded-lg border border-slate-800">
                  <input
                    type="checkbox"
                    checked={(formState.customPermissions as any)[key]}
                    onChange={() => handleTogglePermission(key as any)}
                    className="accent-emerald-500 rounded"
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="px-4 py-2 bg-slate-800 text-slate-300 text-xs rounded-xl"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-500 text-slate-950 font-bold text-xs rounded-xl shadow-lg hover:bg-emerald-400"
            >
              Salvar Usuário
            </button>
          </div>
        </form>
      )}

      {/* Users List & Permissions Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-200">Usuários Cadastrados ({users.length})</h3>
          <span className="text-[10px] text-slate-400 font-mono">Autenticação Criptografada HTTPS/WSS</span>
        </div>

        <div className="divide-y divide-slate-800">
          {users.map((user) => {
            const isAllCameras = !user.allowedCameraIds || user.allowedCameraIds.includes('ALL');
            const allowedCount = isAllCameras
              ? cameras.length
              : (user.allowedCameraIds || []).filter((id) => cameras.some((c) => c.id === id)).length;

            return (
              <div key={user.id} className="p-4 hover:bg-slate-800/40 transition space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center space-x-3">
                    <img src={user.avatar} className="w-10 h-10 rounded-full object-cover ring-2 ring-emerald-500/30" />
                    <div>
                      <h4 className="text-xs font-bold text-white flex items-center gap-2">
                        {user.name}
                        <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono px-2 py-0.5 rounded-full">
                          {user.role}
                        </span>
                      </h4>
                      <p className="text-[11px] text-slate-400">{user.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 text-[10px] font-mono text-slate-400">
                    <button
                      onClick={() => setEditingCameraAccessUser(editingCameraAccessUser?.id === user.id ? null : user)}
                      className="px-2.5 py-1 bg-slate-950 border border-slate-800 hover:border-emerald-500/50 text-emerald-400 rounded-lg flex items-center space-x-1.5 transition"
                      title="Alterar Câmeras Autorizadas"
                    >
                      <CameraIcon className="w-3 h-3 text-emerald-400" />
                      <span>
                        Câmeras: {isAllCameras ? 'Todas (Acesso Total)' : `${allowedCount} de ${cameras.length}`}
                      </span>
                    </button>

                    <span>Ativo: {user.lastActive}</span>

                    {activeUser.customPermissions.canManageUsers && user.role !== 'ADMIN' && (
                      <button
                        onClick={() => {
                          if (confirm(`Excluir usuário ${user.name}?`)) onDeleteUser(user.id);
                        }}
                        className="p-1.5 text-slate-500 hover:text-rose-400 rounded transition"
                        title="Excluir Usuário"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Individual Camera Access Editor Box */}
                {editingCameraAccessUser?.id === user.id && (
                  <div className="bg-slate-950 p-3.5 rounded-xl border border-emerald-500/30 space-y-2 animate-fadeIn text-xs">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                        <Sliders className="w-3.5 h-3.5" /> Selecionar Câmeras Permitidas para {user.name}:
                      </span>
                      <button
                        onClick={() => handleToggleUserCameraAccess(user, 'ALL')}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded border transition ${
                          isAllCameras
                            ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                            : 'bg-slate-900 border-slate-800 text-slate-400'
                        }`}
                      >
                        Acesso Total
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-1">
                      {cameras.map((cam) => {
                        const isPermitted = isAllCameras || (user.allowedCameraIds || []).includes(cam.id);
                        return (
                          <label
                            key={cam.id}
                            className={`flex items-center space-x-2 p-2 rounded-lg border cursor-pointer transition ${
                              isPermitted
                                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                                : 'bg-slate-900 border-slate-800 text-slate-500'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isPermitted}
                              onChange={() => handleToggleUserCameraAccess(user, cam.id)}
                              className="accent-emerald-500 rounded"
                            />
                            <span className="truncate">{cam.name}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Quick Permission Checkboxes */}
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80 flex flex-wrap gap-2 text-[11px]">
                  {Object.entries({
                    canViewLive: 'Ao Vivo',
                    canViewRecordings: 'Gravações',
                    canControlPTZ: 'PTZ',
                    canUseTwoWayAudio: 'Áudio RTMP',
                    canManageCameras: 'Câmeras',
                    canDeleteRecordings: 'Excluir',
                    canAccessAuditLogs: 'Logs',
                    canManageUsers: 'Usuários',
                  }).map(([key, label]) => {
                    const hasPerm = (user.customPermissions as any)[key];
                    return (
                      <button
                        key={key}
                        onClick={() => activeUser.customPermissions.canManageUsers && handleTogglePermission(key as any, user)}
                        className={`px-2 py-1 rounded-lg border text-[10px] font-medium transition ${
                          hasPerm
                            ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                            : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-400'
                        }`}
                      >
                        {hasPerm ? '✓' : '✕'} {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
