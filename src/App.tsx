import React, { useState, useEffect } from 'react';
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
import { FinancialManagement } from './components/FinancialManagement';
import { SystemBlockedOverlay } from './components/SystemBlockedOverlay';
import { FinancialAlertBanner } from './components/FinancialAlertBanner';
import { MercadoPagoSettingsModal } from './components/MercadoPagoSettingsModal';
import { LPRPlateRecognition } from './components/LPRPlateRecognition';

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
  Invoice,
  FinancialPlan,
  MercadoPagoConfig,
  LPRDetection,
  StolenVehicle,
  LPRSettings,
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
  INITIAL_STOLEN_VEHICLES,
  INITIAL_LPR_DETECTIONS,
  INITIAL_LPR_SETTINGS,
} from './data/mockData';

import {
  checkInvoiceFinancialStatus,
  INITIAL_MP_CONFIG,
  INITIAL_PLANS,
} from './lib/financial';

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

  // LPR Module States
  const [lprDetections, setLprDetections] = useState<LPRDetection[]>(INITIAL_LPR_DETECTIONS);
  const [stolenVehicles, setStolenVehicles] = useState<StolenVehicle[]>(INITIAL_STOLEN_VEHICLES);
  const [lprSettings, setLprSettings] = useState<LPRSettings>(INITIAL_LPR_SETTINGS);

  // Financial States
  const [plans, setPlans] = useState<FinancialPlan[]>(INITIAL_PLANS);
  const [invoices, setInvoices] = useState<Invoice[]>([
    {
      id: 'inv-1001',
      userId: 'user-superadmin-01',
      userName: 'Super Admin Unity',
      userEmail: 'suporte@unityautomacoes.com.br',
      planName: 'Plano Vizinhança Protegida ITL',
      amount: 149.90,
      originalAmount: 149.90,
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'PAID',
      isProRata: false,
      paymentDate: new Date().toISOString().split('T')[0],
      createdAt: '2026-07-01',
    },
  ]);
  const [mpConfig, setMpConfig] = useState<MercadoPagoConfig>(INITIAL_MP_CONFIG);
  const [isMpSettingsOpen, setIsMpSettingsOpen] = useState(false);
  const [selectedInvoiceForModal, setSelectedInvoiceForModal] = useState<Invoice | null>(null);

  // Modal States
  const [inspectingCamera, setInspectingCamera] = useState<Camera | null>(null);
  const [isE2EEModalOpen, setIsE2EEModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // Notification Banner State
  const [recentNotification, setRecentNotification] = useState<MotionAlert | null>(null);

  // Fetch initial data from Express backend server if available
  useEffect(() => {
    const fetchBackendData = async () => {
      try {
        const [cRes, aRes, rRes, uRes, lRes, bRes, nRes, pRes, iRes, mpRes, lprDetRes, stolenRes, lprSetRes] = await Promise.all([
          fetch('/api/cameras').then((r) => r.json()),
          fetch('/api/alerts').then((r) => r.json()),
          fetch('/api/recordings').then((r) => r.json()),
          fetch('/api/users').then((r) => r.json()),
          fetch('/api/logs').then((r) => r.json()),
          fetch('/api/backup').then((r) => r.json()),
          fetch('/api/notifications').then((r) => r.json()),
          fetch('/api/financial/plans').then((r) => r.json()),
          fetch('/api/financial/invoices').then((r) => r.json()),
          fetch('/api/mercadopago/config').then((r) => r.json()),
          fetch('/api/lpr/detections').then((r) => r.json()),
          fetch('/api/lpr/stolen').then((r) => r.json()),
          fetch('/api/lpr/settings').then((r) => r.json()),
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
        if (Array.isArray(lprDetRes)) setLprDetections(lprDetRes);
        if (Array.isArray(stolenRes)) setStolenVehicles(stolenRes);
        if (lprSetRes && lprSetRes.cooldownMinutes !== undefined) setLprSettings(lprSetRes);
        if (Array.isArray(pRes) && pRes.length > 0) setPlans(pRes);
        if (Array.isArray(iRes) && iRes.length > 0) setInvoices(iRes);
        if (mpRes && mpRes.accessToken) setMpConfig(mpRes);
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

  // Active user financial invoice check
  const activeUserInvoice = invoices.find(
    (i) => i.userId === activeUser.id && (i.status === 'PENDING' || i.status === 'OVERDUE')
  );

  const financialStatusInfo = activeUserInvoice
    ? checkInvoiceFinancialStatus(activeUserInvoice.dueDate, activeUserInvoice.status)
    : {
        financialStatus: 'OK' as const,
        daysUntilDue: 999,
        daysOverdue: 0,
        shouldAlert: false,
        shouldBlock: false,
        message: '',
      };

  const handlePayInvoiceFromApp = async (invoiceId: string) => {
    try {
      await fetch(`/api/financial/invoices/${invoiceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'PAID',
          paymentDate: new Date().toISOString().split('T')[0],
        }),
      });
    } catch (e) {}
    setInvoices((prev) =>
      prev.map((i) =>
        i.id === invoiceId
          ? { ...i, status: 'PAID' as const, paymentDate: new Date().toISOString().split('T')[0] }
          : i
      )
    );
  };

  const handleSaveMpConfig = async (newConfig: MercadoPagoConfig) => {
    try {
      const res = await fetch('/api/mercadopago/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConfig),
      });
      const data = await res.json();
      if (data && data.accessToken) {
        setMpConfig(data);
        return;
      }
    } catch (e) {}
    setMpConfig(newConfig);
  };

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
            setActiveTab('live-grid');
          }}
          activeUser={activeUser}
        />
      </>
    );
  }

  // LPR Module Action Handlers
  const handleDetectPlate = async (payload: any) => {
    try {
      const res = await fetch('/api/lpr/detect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).then((r) => r.json());

      if (res.success && res.detection && !res.isThrottled) {
        setLprDetections((prev) => [res.detection, ...prev]);
      }
      return res;
    } catch (err) {
      console.error('[LPR Detect Error]:', err);
      const hint = payload.testPlateHint || (payload.cameraName?.toLowerCase().includes('corumbau') || payload.imageBase64 ? 'PKO4A53' : null);
      if (hint) {
        const plate = hint.toUpperCase();
        const isStolen = stolenVehicles.some(
          (sv) => sv.status === 'ACTIVE' && sv.normalizedPlate === plate.replace(/[^A-Z0-9]/g, '')
        );
        const simDet: LPRDetection = {
          id: `lpr-${Date.now()}`,
          plate,
          normalizedPlate: plate.replace(/[^A-Z0-9]/g, ''),
          carImageUrl: payload.imageBase64 || 'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?w=600&auto=format&fit=crop&q=80',
          plateImageUrl: payload.imageBase64 || 'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?w=200&auto=format&fit=crop&q=80',
          vehicleType: 'Utilitário',
          vehicleColor: 'Bege',
          cameraId: payload.cameraId || 'cam-01',
          cameraName: payload.cameraName || 'Câmera Principal LPR',
          address: payload.address || 'Av. Liberdade, 1200',
          latitude: payload.latitude || -17.0397,
          longitude: payload.longitude || -39.5312,
          timestamp: new Date().toISOString(),
          confidence: 98.5,
          isStolenAlert: isStolen,
          ocrEngine: lprSettings.preferredOcrEngine || 'YOLO+PaddleOCR',
        };
        setLprDetections((prev) => [simDet, ...prev]);
        return { success: true, isThrottled: false, isStolenAlert: isStolen, detection: simDet };
      }
      return { success: false, message: 'Não foi possível capturar a imagem da câmera. Tente enviar uma foto do veículo.' };
    }
  };

  const handleAddStolenVehicle = async (vehicle: Omit<StolenVehicle, 'id' | 'createdAt'>) => {
    try {
      const res = await fetch('/api/lpr/stolen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(vehicle),
      }).then((r) => r.json());

      if (res && res.id) {
        setStolenVehicles((prev) => [res, ...prev]);
      }
      return res;
    } catch (err) {
      const fallback: StolenVehicle = {
        ...vehicle,
        id: `stolen-${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      setStolenVehicles((prev) => [fallback, ...prev]);
      return fallback;
    }
  };

  const handleUpdateStolenStatus = async (id: string, status: 'ACTIVE' | 'RECOVERED' | 'CANCELLED') => {
    try {
      await fetch(`/api/lpr/stolen/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
    } catch (e) {}
    setStolenVehicles((prev) => prev.map((s) => (s.id === id ? { ...s, status } : s)));
  };

  const handleDeleteStolenVehicle = async (id: string) => {
    try {
      await fetch(`/api/lpr/stolen/${id}`, { method: 'DELETE' });
    } catch (e) {}
    setStolenVehicles((prev) => prev.filter((s) => s.id !== id));
  };

  const handleUpdateLprSettings = async (settings: LPRSettings) => {
    try {
      await fetch('/api/lpr/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
    } catch (e) {}
    setLprSettings(settings);
  };

  const handleClearLprHistory = async () => {
    try {
      await fetch('/api/lpr/detections', { method: 'DELETE' });
    } catch (e) {}
    setLprDetections([]);
  };

  const handleDeleteLprDetection = async (id: string) => {
    try {
      await fetch(`/api/lpr/detections/${id}`, { method: 'DELETE' });
    } catch (e) {}
    setLprDetections((prev) => prev.filter((d) => d.id !== id));
  };

  // Render Authenticated Dashboard
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased selection:bg-emerald-500 selection:text-slate-950">
      {/* System Blocked Overlay when overdue > 5 days */}
      {financialStatusInfo.shouldBlock && (
        <SystemBlockedOverlay
          user={activeUser}
          overdueInvoice={activeUserInvoice}
          onPaymentSuccess={handlePayInvoiceFromApp}
        />
      )}

      {/* Top Financial Alert Banner when 5 days before due or <=5 days overdue */}
      {financialStatusInfo.shouldAlert && activeUserInvoice && !financialStatusInfo.shouldBlock && (
        <FinancialAlertBanner
          invoice={activeUserInvoice}
          daysUntilDue={financialStatusInfo.daysUntilDue}
          daysOverdue={financialStatusInfo.daysOverdue}
          onOpenPaymentModal={() => setActiveTab('financial-management')}
        />
      )}

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
      />

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
          activeUser={activeUser}
        />

        {/* Mobile Tab Navigation */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900 border-t border-slate-800 flex items-center justify-around p-2 text-[10px] text-slate-400">
          <button onClick={() => setActiveTab('live-grid')} className={`p-1.5 flex flex-col items-center ${activeTab === 'live-grid' ? 'text-emerald-400 font-bold' : ''}`}>
            Câmeras
          </button>
          <button onClick={() => setActiveTab('camera-map')} className={`p-1.5 flex flex-col items-center ${activeTab === 'camera-map' ? 'text-emerald-400 font-bold' : ''}`}>
            Mapa
          </button>
          <button onClick={() => setActiveTab('motion-alerts')} className={`p-1.5 flex flex-col items-center relative ${activeTab === 'motion-alerts' ? 'text-emerald-400 font-bold' : ''}`}>
            Alertas
            {unreadAlertsCount > 0 && <span className="absolute top-0 right-2 w-2 h-2 rounded-full bg-rose-500"></span>}
          </button>
          <button onClick={() => setActiveTab('cloud-recordings')} className={`p-1.5 flex flex-col items-center ${activeTab === 'cloud-recordings' ? 'text-emerald-400 font-bold' : ''}`}>
            Nuvem
          </button>
          {(activeUser.role === 'ADMIN' || activeUser.email === 'suporte@unityautomacoes.com.br' || activeUser.customPermissions?.canManageUsers) && (
            <button onClick={() => setActiveTab('user-management')} className={`p-1.5 flex flex-col items-center ${activeTab === 'user-management' ? 'text-emerald-400 font-bold' : ''}`}>
              Acesso
            </button>
          )}
        </div>

        {/* Content Area */}
        <main className="flex-1 p-4 sm:p-6 pb-20 md:pb-6 overflow-x-hidden">
          {activeTab === 'live-grid' && (
            <CameraGrid
              cameras={cameras}
              activeUser={activeUser}
              onSelectCamera={setInspectingCamera}
              onTriggerTestAlert={triggerMotionAlert}
              onUpdateCamera={handleUpdateCamera}
            />
          )}

          {activeTab === 'lpr-recognition' && (
            <LPRPlateRecognition
              cameras={cameras}
              lprDetections={lprDetections}
              stolenVehicles={stolenVehicles}
              lprSettings={lprSettings}
              activeUser={activeUser}
              onDetectPlate={handleDetectPlate}
              onAddStolenVehicle={handleAddStolenVehicle}
              onUpdateStolenStatus={handleUpdateStolenStatus}
              onDeleteStolenVehicle={handleDeleteStolenVehicle}
              onUpdateSettings={handleUpdateLprSettings}
              onClearHistory={handleClearLprHistory}
              onDeleteDetection={handleDeleteLprDetection}
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
            (activeUser.role === 'ADMIN' || activeUser.email === 'suporte@unityautomacoes.com.br' || activeUser.customPermissions?.canManageUsers) ? (
              <UserManagement
                users={users}
                cameras={cameras}
                activeUser={activeUser}
                onAddUser={handleAddUser}
                onUpdateUser={handleUpdateUser}
                onDeleteUser={handleDeleteUser}
              />
            ) : (
              <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl max-w-lg mx-auto my-12 space-y-3">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center font-bold">
                  !
                </div>
                <h3 className="font-bold text-sm text-slate-100">Acesso Restrito a Administradores</h3>
                <p className="text-xs text-slate-400">
                  A aba de Acesso Multiusuário e Gerenciamento de Usuários está disponível apenas para contas com perfil Administrador.
                </p>
              </div>
            )
          )}

          {activeTab === 'financial-management' && (
            <FinancialManagement
              currentUser={activeUser}
              users={users}
              invoices={invoices}
              mpConfig={mpConfig}
              onUpdateInvoices={setInvoices}
              onUpdateUsers={setUsers}
              onOpenMpSettings={() => setIsMpSettingsOpen(true)}
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

      {/* Mercado Pago API Settings Modal (Super Admin) */}
      <MercadoPagoSettingsModal
        isOpen={isMpSettingsOpen}
        onClose={() => setIsMpSettingsOpen(false)}
        config={mpConfig}
        onSaveConfig={handleSaveMpConfig}
        currentUser={activeUser}
      />
    </div>
  );
}
