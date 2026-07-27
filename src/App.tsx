import React, { useState, useEffect } from 'react';
import {
  Grid,
  Map,
  Bell,
  Film,
  PlusCircle,
  Users,
  FileText,
  Database,
  Smartphone,
  Lock,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { CameraGrid } from './components/CameraGrid';
import { CameraMap } from './components/CameraMap';
import { MotionAlertsPanel } from './components/MotionAlertsPanel';
import { CloudRecordingsVault } from './components/CloudRecordingsVault';
import { CameraAdminPanel } from './components/CameraAdminPanel';
import { UserManagement } from './components/UserManagement';
import { ActivityReports } from './components/ActivityReports';
import { BackupManager } from './components/BackupManager';
import { PushNotificationSettings } from './components/PushNotificationSettings';
import { CameraDetailModal } from './components/CameraDetailModal';
import { E2EEVaultModal } from './components/E2EEVaultModal';
import { AdminLoginModal } from './components/AdminLoginModal';
import { LandingPage } from './components/LandingPage';

import {
  Camera,
  MotionAlert,
  CloudRecording,
  User,
  ActivityLog,
  BackupConfig,
  NotificationConfig,
  E2EESettings,
  AlertType,
  AlertSeverity,
} from './types';

import {
  INITIAL_CAMERAS,
  INITIAL_ALERTS,
  INITIAL_RECORDINGS,
  INITIAL_USERS,
  INITIAL_LOGS,
  INITIAL_BACKUP_CONFIG,
  INITIAL_NOTIFICATION_CONFIG,
  INITIAL_E2EE_SETTINGS,
} from './data/mockData';

export default function App() {
  // Authentication State with LocalStorage Persistence
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('itl_logged_in');
      return stored === 'true';
    } catch {
      return false;
    }
  });

  const [activeUser, setActiveUser] = useState<User>(() => {
    try {
      const stored = localStorage.getItem('itl_active_user');
      if (stored) return JSON.parse(stored);
    } catch {}
    return INITIAL_USERS[0];
  });

  // Active Navigation Tab with LocalStorage Persistence
  const [activeTab, setActiveTab] = useState<string>(() => {
    try {
      const stored = localStorage.getItem('itl_active_tab');
      if (stored) return stored;
    } catch {}
    return 'live-grid';
  });

  useEffect(() => {
    try {
      localStorage.setItem('itl_logged_in', isLoggedIn ? 'true' : 'false');
    } catch {}
  }, [isLoggedIn]);

  useEffect(() => {
    try {
      if (activeUser) {
        localStorage.setItem('itl_active_user', JSON.stringify(activeUser));
      }
    } catch {}
  }, [activeUser]);

  useEffect(() => {
    try {
      if (activeTab) {
        localStorage.setItem('itl_active_tab', activeTab);
      }
    } catch {}
  }, [activeTab]);

  // Application Data States
  const [cameras, setCameras] = useState<Camera[]>(INITIAL_CAMERAS);
  const [alerts, setAlerts] = useState<MotionAlert[]>(INITIAL_ALERTS);
  const [recordings, setRecordings] = useState<CloudRecording[]>(INITIAL_RECORDINGS);
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [logs, setLogs] = useState<ActivityLog[]>(INITIAL_LOGS);
  const [backupConfig, setBackupConfig] = useState<BackupConfig>(INITIAL_BACKUP_CONFIG);
  const [notificationConfig, setNotificationConfig] = useState<NotificationConfig>(INITIAL_NOTIFICATION_CONFIG);
  const [e2eeSettings, setE2eesettings] = useState<E2EESettings>(INITIAL_E2EE_SETTINGS);

  // Modal States
  const [inspectingCamera, setInspectingCamera] = useState<Camera | null>(null);
  const [isE2EEModalOpen, setIsE2EEModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Notification Banner State
  const [recentNotification, setRecentNotification] = useState<MotionAlert | null>(null);

  // Fetch initial data from Express backend server if available
  useEffect(() => {
    const fetchBackendData = async () => {
      try {
        const [cRes, aRes, rRes, uRes, lRes, bRes, nRes] = await Promise.all([
          fetch('/api/cameras').then((r) => r.json()),
          fetch('/api/alerts').then((r) => r.json()),
          fetch('/api/recordings').then((r) => r.json()),
          fetch('/api/users').then((r) => r.json()),
          fetch('/api/logs').then((r) => r.json()),
          fetch('/api/backup').then((r) => r.json()),
          fetch('/api/notifications').then((r) => r.json()),
        ]);

        if (Array.isArray(cRes)) setCameras(cRes);
        if (Array.isArray(aRes)) setAlerts(aRes);
        if (Array.isArray(rRes)) setRecordings(rRes);
        if (Array.isArray(uRes) && uRes.length > 0) {
          setUsers(uRes);
        }
        if (Array.isArray(lRes)) setLogs(lRes);
        if (bRes && bRes.schedule) setBackupConfig(bRes);
        if (nRes && nRes.pushEnabled !== undefined) setNotificationConfig(nRes);
      } catch (err) {
        console.log('Servidor backend inicializado.');
      }
    };

    fetchBackendData();
  }, []);

  // Periodic recordings sync
  useEffect(() => {
    if (!isLoggedIn) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/recordings');
        const data = await res.json();
        if (Array.isArray(data)) setRecordings(data);
      } catch (e) {}
    }, 10000);
    return () => clearInterval(interval);
  }, [isLoggedIn]);

  // Periodic motion alert checker when logged in
  useEffect(() => {
    if (!isLoggedIn || cameras.length === 0) return;

    const interval = setInterval(() => {
      if (Math.random() < 0.15) {
        const randomCam = cameras[Math.floor(Math.random() * cameras.length)];
        if (!randomCam) return;

        const types: AlertType[] = ['HUMAN', 'VEHICLE', 'INTRUSION', 'SOUND'];
        const chosenType = types[Math.floor(Math.random() * types.length)];
        const severities: AlertSeverity[] = ['MEDIUM', 'HIGH', 'CRITICAL'];
        const chosenSev = severities[Math.floor(Math.random() * severities.length)];

        triggerMotionAlert(randomCam.id, chosenType, chosenSev);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [isLoggedIn, cameras]);



  // Handlers
  const triggerMotionAlert = async (camId: string, eventType?: AlertType, severity?: AlertSeverity) => {
    try {
      const res = await fetch('/api/alerts/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cameraId: camId, eventType, severity }),
      });
      const data = await res.json();
      if (data && data.id) {
        setAlerts((prev) => [data, ...prev]);
        setRecentNotification(data);
        setTimeout(() => setRecentNotification(null), 6000);
      }
    } catch (e) {
      const cam = cameras.find((c) => c.id === camId) || cameras[0];
      if (!cam) return;
      const fallbackAlert: MotionAlert = {
        id: `alert-${Date.now()}`,
        cameraId: cam.id,
        cameraName: cam.name,
        eventType: eventType || 'HUMAN',
        confidence: 96,
        snapshotUrl: cam.thumbnailUrl || 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=600',
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        severity: severity || 'HIGH',
        readStatus: false,
        pushedToMobile: true,
      };
      setAlerts((prev) => [fallbackAlert, ...prev]);
      setRecentNotification(fallbackAlert);
      setTimeout(() => setRecentNotification(null), 6000);
    }
  };

  const markAlertAsRead = async (alertId: string) => {
    try {
      await fetch(`/api/alerts/${alertId}/read`, { method: 'PATCH' });
    } catch (e) {}
    setAlerts((prev) => prev.map((a) => (a.id === alertId ? { ...a, readStatus: true } : a)));
  };

  const handleAddCamera = async (camData: Partial<Camera>) => {
    try {
      const res = await fetch('/api/cameras', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(camData),
      });
      const newCam = await res.json();
      if (newCam && newCam.id) {
        setCameras((prev) => [newCam, ...prev]);
        try {
          const recRes = await fetch('/api/recordings');
          const recsData = await recRes.json();
          if (Array.isArray(recsData) && recsData.length > 0) {
            setRecordings(recsData);
          }
        } catch (e) {}
      }
    } catch (e) {
      const fallbackCam: Camera = {
        id: `cam-${Date.now()}`,
        name: camData.name || 'Nova Câmera',
        location: camData.location || 'Bairro Centro',
        protocol: camData.protocol || 'RTSP',
        rtspUrl: camData.protocol === 'RTSP' ? (camData.rtspUrl || '') : '',
        status: 'ONLINE',
        isE2EEEncrypted: true,
        fps: 30,
        resolution: '1080p Full HD',
        storageUsedGB: 0.1,
        cloudRecordingsActive: true,
        motionSensitivity: 8,
        aiDetectionEnabled: true,
        twoWayAudioEnabled: true,
        lat: -17.0397,
        lng: -39.5312,
        thumbnailUrl: 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=800',
      };
      setCameras((prev) => [fallbackCam, ...prev]);
    }
  };

  const handleUpdateCamera = async (camId: string, camData: Partial<Camera>) => {
    try {
      const res = await fetch(`/api/cameras/${camId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(camData),
      });
      const updatedCam = await res.json();
      if (updatedCam && updatedCam.id) {
        setCameras((prev) => prev.map((c) => (c.id === camId ? updatedCam : c)));
        if (inspectingCamera && inspectingCamera.id === camId) {
          setInspectingCamera(updatedCam);
        }
        return;
      }
    } catch (e) {}
    setCameras((prev) => prev.map((c) => (c.id === camId ? { ...c, ...camData } : c)));
    if (inspectingCamera && inspectingCamera.id === camId) {
      setInspectingCamera((prev) => (prev ? { ...prev, ...camData } : null));
    }
  };

  const handleDeleteCamera = async (camId: string) => {
    try {
      await fetch(`/api/cameras/${camId}`, { method: 'DELETE' });
    } catch (e) {}
    setCameras((prev) => prev.filter((c) => c.id !== camId));
  };

  const handleDeleteRecording = async (recId: string) => {
    try {
      await fetch(`/api/recordings/${recId}`, { method: 'DELETE' });
    } catch (e) {}
    setRecordings((prev) => prev.filter((r) => r.id !== recId));
  };

  const handleDeleteRecordingsBatch = async (recIds: string[]) => {
    if (!recIds || recIds.length === 0) return;
    try {
      await fetch('/api/recordings/batch-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: recIds }),
      });
    } catch (e) {}
    setRecordings((prev) => prev.filter((r) => !recIds.includes(r.id)));
  };

  const handleAddUser = async (userData: Partial<User>) => {
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      const newUser = await res.json();
      if (newUser && newUser.id) {
        setUsers((prev) => [...prev, newUser]);
      }
    } catch (e) {
      const fallbackUser: User = {
        id: `user-${Date.now()}`,
        name: userData.name || 'Novo Usuário',
        email: userData.email || 'user@itl.security',
        role: userData.role || 'RESIDENT',
        status: 'ACTIVE',
        customPermissions: userData.customPermissions as any,
        lastActive: 'Agora mesmo',
        createdAt: '2026-07-23',
      };
      setUsers((prev) => [...prev, fallbackUser]);
    }
  };

  const handleUpdateUser = async (userId: string, userData: Partial<User>) => {
    try {
      await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
    } catch (e) {}
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, ...userData } : u)));
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await fetch(`/api/users/${userId}`, { method: 'DELETE' });
    } catch (e) {}
    setUsers((prev) => prev.filter((u) => u.id !== userId));
  };

  const unreadAlertsCount = alerts.filter((a) => !a.readStatus).length;

  // Render Public Landing Page for Guests
  if (!isLoggedIn) {
    return (
      <>
        <LandingPage
          onOpenLogin={() => setIsLoginModalOpen(true)}
          cameras={cameras}
          onSelectCamera={(cam) => setInspectingCamera(cam)}
        />

        <AdminLoginModal
          isOpen={isLoginModalOpen}
          onClose={() => setIsLoginModalOpen(false)}
          onLoginSuccess={(loggedInUser) => {
            setActiveUser(loggedInUser);
            setIsLoggedIn(true);
            setActiveTab(loggedInUser.role === 'ADMIN' ? 'live-grid' : 'live-grid');
          }}
          activeUser={activeUser}
        />
      </>
    );
  }

  // Render Authenticated Dashboard
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased selection:bg-emerald-500 selection:text-slate-950">
      {/* Top Navigation */}
      <Navbar
        activeUser={activeUser}
        onSelectUser={setActiveUser}
        allUsers={users}
        unreadAlertsCount={unreadAlertsCount}
        onOpenAlerts={() => setActiveTab('motion-alerts')}
        onOpenE2EEModal={() => setIsE2EEModalOpen(true)}
        onOpenLoginModal={() => setIsLoginModalOpen(true)}
        onLogout={() => {
          setIsLoggedIn(false);
          try {
            localStorage.removeItem('itl_logged_in');
            localStorage.removeItem('itl_active_user');
          } catch (e) {}
        }}
        isVaultUnlocked={e2eeSettings.isVaultUnlocked}
        onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      />

      {/* Mobile Drawer Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden bg-slate-950/80 backdrop-blur-md flex flex-col justify-end">
          <div className="bg-slate-900 border-t border-slate-800 rounded-t-3xl max-h-[85vh] overflow-y-auto p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Menu className="w-5 h-5 text-emerald-400" />
                  Navegação do Sistema
                </h3>
                <p className="text-xs text-slate-400">Acesse qualquer módulo do painel Central ITL</p>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              {[
                { id: 'live-grid', label: 'Câmeras ao Vivo', icon: Grid, badge: cameras.length },
                { id: 'camera-map', label: 'Mapa Vizinhança', icon: Map },
                { id: 'motion-alerts', label: 'Alertas de Movimento', icon: Bell, badge: unreadAlertsCount, alert: unreadAlertsCount > 0 },
                { id: 'cloud-recordings', label: 'Gravações na Nuvem', icon: Film },
                { id: 'camera-admin', label: 'Adicionar / RTSP', icon: PlusCircle },
                { id: 'user-management', label: 'Acesso Multiusuário', icon: Users },
                { id: 'activity-reports', label: 'Relatórios Diários', icon: FileText },
                { id: 'backup-manager', label: 'Backup Automático', icon: Database },
                { id: 'push-notifications', label: 'Notificações Push', icon: Smartphone },
                { id: 'e2ee-vault', label: 'Criptografia E2EE', icon: Lock },
              ].map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-2xl font-medium text-xs transition ${
                      isActive
                        ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/10 text-emerald-400 border border-emerald-500/40 font-bold shadow-md'
                        : 'bg-slate-950/60 text-slate-300 border border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center space-x-3 truncate">
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                      <span className="truncate">{item.label}</span>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      {item.badge !== undefined && item.badge > 0 && (
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            item.alert
                              ? 'bg-rose-500 text-white animate-pulse'
                              : 'bg-slate-800 text-emerald-400 border border-emerald-500/20'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                      <ChevronRight className="w-4 h-4 text-slate-500" />
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      )}

      {/* Floating Push Alert Banner */}
      {recentNotification && (
        <div className="fixed bottom-4 right-4 z-50 bg-rose-950 border-2 border-rose-500 text-white p-4 rounded-2xl shadow-2xl max-w-sm animate-bounce flex items-start space-x-3">
          <img src={recentNotification.snapshotUrl} className="w-12 h-12 rounded-xl object-cover ring-2 ring-rose-400" />
          <div className="text-xs space-y-1">
            <p className="font-bold text-rose-300">🚨 NOVO ALERTA DE MOVIMENTO!</p>
            <p className="text-slate-200">{recentNotification.cameraName}</p>
            <p className="text-[10px] text-slate-400">
              Evento: {recentNotification.eventType} ({recentNotification.confidence}% IA)
            </p>
          </div>
        </div>
      )}

      {/* Main Body Layout */}
      <div className="flex flex-1 max-w-7xl w-full mx-auto">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          unreadAlertsCount={unreadAlertsCount}
          totalCameras={cameras.length}
        />

        {/* Mobile Tab Navigation (Touch-optimized scrollable bar with 'Mais' drawer button) */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 border-t border-slate-800 backdrop-blur-md px-2 py-1.5 flex items-center space-x-1.5 overflow-x-auto text-[10px] text-slate-400 no-scrollbar">
          <button
            onClick={() => setActiveTab('live-grid')}
            className={`px-3 py-2 rounded-xl flex items-center space-x-1.5 shrink-0 transition ${
              activeTab === 'live-grid' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold' : 'bg-slate-800/60 text-slate-300'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            <span>Câmeras ({cameras.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('camera-map')}
            className={`px-3 py-2 rounded-xl flex items-center space-x-1.5 shrink-0 transition ${
              activeTab === 'camera-map' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold' : 'bg-slate-800/60 text-slate-300'
            }`}
          >
            <Map className="w-3.5 h-3.5" />
            <span>Mapa</span>
          </button>

          <button
            onClick={() => setActiveTab('motion-alerts')}
            className={`px-3 py-2 rounded-xl flex items-center space-x-1.5 shrink-0 relative transition ${
              activeTab === 'motion-alerts' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold' : 'bg-slate-800/60 text-slate-300'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Alertas</span>
            {unreadAlertsCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('cloud-recordings')}
            className={`px-3 py-2 rounded-xl flex items-center space-x-1.5 shrink-0 transition ${
              activeTab === 'cloud-recordings' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold' : 'bg-slate-800/60 text-slate-300'
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            <span>Nuvem</span>
          </button>

          <button
            onClick={() => setActiveTab('camera-admin')}
            className={`px-3 py-2 rounded-xl flex items-center space-x-1.5 shrink-0 transition ${
              activeTab === 'camera-admin' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold' : 'bg-slate-800/60 text-slate-300'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Adicionar</span>
          </button>

          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="px-3 py-2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold rounded-xl flex items-center space-x-1.5 shrink-0 transition shadow-lg"
          >
            <Menu className="w-3.5 h-3.5 text-emerald-400" />
            <span>Mais (Menu)</span>
          </button>
        </div>

        {/* Content Area */}
        <main className="flex-1 p-3 sm:p-6 pb-28 md:pb-6 overflow-x-hidden">
          {activeTab === 'live-grid' && (
            <CameraGrid
              cameras={cameras}
              activeUser={activeUser}
              onSelectCamera={setInspectingCamera}
              onTriggerTestAlert={triggerMotionAlert}
              onUpdateCamera={handleUpdateCamera}
            />
          )}

          {activeTab === 'camera-map' && (
            <CameraMap cameras={cameras} onSelectCamera={setInspectingCamera} isLoggedIn={isLoggedIn} currentUser={activeUser} />
          )}

          {activeTab === 'motion-alerts' && (
            <MotionAlertsPanel
              alerts={alerts}
              onMarkAsRead={markAlertAsRead}
              onTriggerTestAlert={triggerMotionAlert}
              onOpenPushSettings={() => setActiveTab('push-notifications')}
            />
          )}

          {activeTab === 'cloud-recordings' && (
            <CloudRecordingsVault
              recordings={recordings}
              cameras={cameras}
              activeUser={activeUser}
              onDeleteRecording={handleDeleteRecording}
              onDeleteRecordingsBatch={handleDeleteRecordingsBatch}
              isVaultUnlocked={e2eeSettings.isVaultUnlocked}
              onUnlockVault={() => setIsE2EEModalOpen(true)}
            />
          )}

          {activeTab === 'camera-admin' && (
            <CameraAdminPanel
              cameras={cameras}
              activeUser={activeUser}
              onAddCamera={handleAddCamera}
              onDeleteCamera={handleDeleteCamera}
              onUpdateCamera={handleUpdateCamera}
            />
          )}

          {activeTab === 'user-management' && (
            <UserManagement
              users={users}
              cameras={cameras}
              activeUser={activeUser}
              onAddUser={handleAddUser}
              onUpdateUser={handleUpdateUser}
              onDeleteUser={handleDeleteUser}
            />
          )}

          {activeTab === 'activity-reports' && (
            <ActivityReports logs={logs} activeUser={activeUser} />
          )}

          {activeTab === 'backup-manager' && (
            <BackupManager
              config={backupConfig}
              activeUser={activeUser}
              onTriggerBackup={() => {
                setBackupConfig((prev) => ({ ...prev, lastBackupDate: new Date().toISOString().replace('T', ' ').substring(0, 19) }));
              }}
              onUpdateConfig={(newCfg) => setBackupConfig((prev) => ({ ...prev, ...newCfg }))}
            />
          )}

          {activeTab === 'push-notifications' && (
            <PushNotificationSettings
              config={notificationConfig}
              activeUser={activeUser}
              onUpdateConfig={(newCfg) => setNotificationConfig((prev) => ({ ...prev, ...newCfg }))}
              onTestPush={() => cameras.length > 0 && triggerMotionAlert(cameras[0].id, 'HUMAN', 'HIGH')}
            />
          )}

          {activeTab === 'e2ee-vault' && (
            <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl mx-auto space-y-4">
              <h2 className="text-base font-bold text-white">Central de Gerenciamento de Criptografia E2EE</h2>
              <p className="text-xs text-slate-400">
                Garantia de total privacidade dos dados dos usuários com chaves de criptografia geradas localmente.
              </p>
              <button
                onClick={() => setIsE2EEModalOpen(true)}
                className="px-4 py-2 bg-emerald-500 text-slate-950 font-bold text-xs rounded-xl shadow hover:bg-emerald-400"
              >
                Abrir Configurações do Cofre
              </button>
            </div>
          )}
        </main>
      </div>

      {/* Camera Inspector Modal */}
      {inspectingCamera && (
        <CameraDetailModal
          camera={inspectingCamera}
          activeUser={activeUser}
          onClose={() => setInspectingCamera(null)}
          onTriggerTestAlert={triggerMotionAlert}
          onUpdateCamera={handleUpdateCamera}
        />
      )}

      {/* E2EE Vault Modal */}
      <E2EEVaultModal
        settings={e2eeSettings}
        isOpen={isE2EEModalOpen}
        onClose={() => setIsE2EEModalOpen(false)}
        onToggleVault={(unlocked) => setE2eesettings((prev) => ({ ...prev, isVaultUnlocked: unlocked }))}
      />

      {/* Admin Login Modal */}
      <AdminLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={(loggedInUser) => {
          setActiveUser(loggedInUser);
          setIsLoggedIn(true);
        }}
        activeUser={activeUser}
      />
    </div>
  );
}
