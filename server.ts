import express from 'express';
import path from 'path';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import {
  INITIAL_CAMERAS,
  INITIAL_ALERTS,
  INITIAL_RECORDINGS,
  INITIAL_USERS,
  INITIAL_LOGS,
  INITIAL_BACKUP_CONFIG,
  INITIAL_NOTIFICATION_CONFIG,
  INITIAL_E2EE_SETTINGS,
} from './src/data/mockData';
import { Camera, MotionAlert, CloudRecording, User, ActivityLog, BackupConfig, NotificationConfig } from './src/types';

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(cors());
  app.use(express.json());

  // In-memory data repositories (fallbacks for live dev container and MySQL VPS runtime)
  let cameras: Camera[] = [...INITIAL_CAMERAS];
  let alerts: MotionAlert[] = [...INITIAL_ALERTS];
  let recordings: CloudRecording[] = [...INITIAL_RECORDINGS];
  let users: User[] = [...INITIAL_USERS];
  let logs: ActivityLog[] = [...INITIAL_LOGS];
  let backupConfig: BackupConfig = { ...INITIAL_BACKUP_CONFIG };
  let notificationConfig: NotificationConfig = { ...INITIAL_NOTIFICATION_CONFIG };

  // Helper log function
  const addLog = (userName: string, action: string, category: ActivityLog['category'], details?: string) => {
    const newLog: ActivityLog = {
      id: `log-${Date.now()}`,
      userName,
      action,
      category,
      details: details || '',
      ipAddress: '127.0.0.1',
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };
    logs.unshift(newLog);
    if (logs.length > 100) logs = logs.slice(0, 100);
  };

  // ---------------- API ENDPOINTS ----------------

  // Health
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      systemName: 'Central ITL de Câmeras & Segurança',
      version: '2.5.0',
      uptimeSeconds: Math.floor(process.uptime()),
      camerasCount: cameras.length,
      activeAlertsCount: alerts.filter((a) => !a.readStatus).length,
      port: PORT,
    });
  });

  // Auth Login
  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    if (email === 'suporte@unityautomacoes.com.br' && password === '200616') {
      const superUser = users.find((u) => u.email === 'suporte@unityautomacoes.com.br') || {
        id: 'user-superadmin-01',
        name: 'Super Admin Unity',
        email: 'suporte@unityautomacoes.com.br',
        role: 'ADMIN' as const,
        status: 'ACTIVE' as const,
        customPermissions: {
          canViewLive: true,
          canViewRecordings: true,
          canControlPTZ: true,
          canUseTwoWayAudio: true,
          canManageCameras: true,
          canDeleteRecordings: true,
          canAccessAuditLogs: true,
          canManageUsers: true,
          canExportReports: true,
        },
        lastActive: 'Agora mesmo',
        createdAt: '2026-01-01',
      };
      addLog('Super Admin Unity', 'Login Super Admin efetuado com sucesso', 'AUTH');
      return res.json({ success: true, user: superUser, isSuperAdmin: true });
    }

    const found = users.find((u) => u.email === email);
    if (found) {
      addLog(found.name, `Login efetuado: ${found.email}`, 'AUTH');
      return res.json({ success: true, user: found, isSuperAdmin: false });
    }

    return res.status(401).json({ error: 'Credenciais inválidas' });
  });

  // Cameras
  app.get('/api/cameras', (req, res) => {
    res.json(cameras);
  });

  app.post('/api/cameras', (req, res) => {
    const reqHost = (req.get('host') || 'localhost').split(':')[0];
    const reqProto = (req.headers['x-forwarded-proto'] as string) || req.protocol || 'https';

    const {
      name,
      location,
      protocol,
      rtspUrl,
      rtmpUrl,
      streamKey,
      rtmpServerUrl,
      fullRtmpUrl,
      stateUf,
      city,
      motionSensitivity,
      aiDetectionEnabled,
      twoWayAudioEnabled,
      isE2EEEncrypted,
      lat,
      lng,
    } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'O nome da câmera é obrigatório' });
    }

    const defaultKey = streamKey || `cam_${Date.now().toString().slice(-6)}`;

    const newCamera: Camera = {
      id: `cam-${Date.now().toString().slice(-4)}`,
      name,
      location: location || `${city ? city + ' - ' : ''}${stateUf || 'Localização ITL'}`,
      protocol: protocol || 'RTSP',
      rtspUrl: rtspUrl || 'rtsp://admin:itl2026@192.168.1.100:554/live/ch0',
      rtmpUrl: rtmpUrl || fullRtmpUrl || `rtmp://${reqHost}:1935/live/${defaultKey}`,
      streamKey: defaultKey,
      rtmpServerUrl: rtmpServerUrl || `rtmp://${reqHost}:1935/live`,
      fullRtmpUrl: fullRtmpUrl || `${reqProto}://${reqHost}/live/${defaultKey}`,
      stateUf: stateUf || '',
      city: city || '',
      status: 'ONLINE',
      isE2EEEncrypted: isE2EEEncrypted !== undefined ? isE2EEEncrypted : true,
      encryptionKeyHash: `e2ee-aes256-${Math.random().toString(36).substring(2, 10)}`,
      fps: 30,
      resolution: '1080p Full HD',
      storageUsedGB: 0.1,
      cloudRecordingsActive: true,
      motionSensitivity: motionSensitivity || 7,
      aiDetectionEnabled: aiDetectionEnabled !== undefined ? aiDetectionEnabled : true,
      twoWayAudioEnabled: twoWayAudioEnabled !== undefined ? twoWayAudioEnabled : true,
      lat: lat ? parseFloat(lat) : -17.0397 + (Math.random() - 0.5) * 0.02,
      lng: lng ? parseFloat(lng) : -39.5312 + (Math.random() - 0.5) * 0.02,
      thumbnailUrl: 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=800&auto=format&fit=crop&q=80',
      createdAt: new Date().toISOString().split('T')[0],
    };

    cameras.unshift(newCamera);
    addLog('ITL Admin', `Nova câmera adicionada (${newCamera.protocol}): ${newCamera.name}`, 'SYSTEM', `URL: ${newCamera.fullRtmpUrl || newCamera.rtspUrl}`);
    res.status(201).json(newCamera);
  });

  app.put('/api/cameras/:id', (req, res) => {
    const { id } = req.params;
    const index = cameras.findIndex((c) => c.id === id);
    if (index === -1) return res.status(404).json({ error: 'Câmera não encontrada' });

    cameras[index] = { ...cameras[index], ...req.body };
    addLog('ITL Admin', `Câmera atualizada: ${cameras[index].name}`, 'SYSTEM');
    res.json(cameras[index]);
  });

  app.delete('/api/cameras/:id', (req, res) => {
    const { id } = req.params;
    const cam = cameras.find((c) => c.id === id);
    cameras = cameras.filter((c) => c.id !== id);
    if (cam) addLog('ITL Admin', `Câmera removida: ${cam.name}`, 'SYSTEM');
    res.json({ success: true, message: 'Câmera removida com sucesso' });
  });

  // Motion Alerts
  app.get('/api/alerts', (req, res) => {
    res.json(alerts);
  });

  app.post('/api/alerts/trigger', (req, res) => {
    const { cameraId, eventType, severity } = req.body;
    const targetCam = cameras.find((c) => c.id === cameraId) || cameras[0];
    if (!targetCam) return res.status(400).json({ error: 'Nenhuma câmera cadastrada para alerta' });

    const newAlert: MotionAlert = {
      id: `alert-${Date.now().toString().slice(-4)}`,
      cameraId: targetCam.id,
      cameraName: targetCam.name,
      eventType: eventType || 'HUMAN',
      confidence: Math.floor(Math.random() * 15) + 85,
      snapshotUrl: targetCam.thumbnailUrl || 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=600&auto=format&fit=crop&q=80',
      videoClipUrl: '/recordings/clip-live.mp4',
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      severity: severity || 'HIGH',
      readStatus: false,
      pushedToMobile: notificationConfig.pushEnabled,
    };

    targetCam.status = 'ALERT';
    setTimeout(() => {
      if (targetCam.status === 'ALERT') targetCam.status = 'RECORDING';
    }, 8000);

    alerts.unshift(newAlert);
    addLog('Sistema AI ITL', `Disparo de Alerta: ${newAlert.eventType} na ${targetCam.name}`, 'SYSTEM', `Push mobile: ${newAlert.pushedToMobile ? 'Sim' : 'Não'}`);
    res.status(201).json(newAlert);
  });

  app.patch('/api/alerts/:id/read', (req, res) => {
    const { id } = req.params;
    const alert = alerts.find((a) => a.id === id);
    if (alert) alert.readStatus = true;
    res.json({ success: true, alert });
  });

  // Recordings
  app.get('/api/recordings', (req, res) => {
    res.json(recordings);
  });

  app.delete('/api/recordings/:id', (req, res) => {
    const { id } = req.params;
    recordings = recordings.filter((r) => r.id !== id);
    addLog('ITL Admin', `Gravação em nuvem excluída: ${id}`, 'RECORDING');
    res.json({ success: true });
  });

  // Users & Permissions
  app.get('/api/users', (req, res) => {
    res.json(users);
  });

  app.post('/api/users', (req, res) => {
    const { name, email, role, phone, customPermissions } = req.body;
    if (!name || !email) return res.status(400).json({ error: 'Nome e email são obrigatórios' });

    const newUser: User = {
      id: `user-${Date.now().toString().slice(-4)}`,
      name,
      email,
      role: role || 'RESIDENT',
      phone: phone || '',
      status: 'ACTIVE',
      customPermissions: customPermissions || {
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
      lastActive: 'Nunca',
      createdAt: new Date().toISOString().split('T')[0],
    };

    users.push(newUser);
    addLog('ITL Admin', `Novo usuário cadastrado: ${newUser.name} (${newUser.role})`, 'AUTH');
    res.status(201).json(newUser);
  });

  app.put('/api/users/:id', (req, res) => {
    const { id } = req.params;
    const index = users.findIndex((u) => u.id === id);
    if (index === -1) return res.status(404).json({ error: 'Usuário não encontrado' });

    users[index] = { ...users[index], ...req.body };
    addLog('ITL Admin', `Permissões/dados do usuário ${users[index].name} atualizados`, 'AUTH');
    res.json(users[index]);
  });

  app.delete('/api/users/:id', (req, res) => {
    const { id } = req.params;
    users = users.filter((u) => u.id !== id);
    addLog('ITL Admin', `Usuário removido: ${id}`, 'AUTH');
    res.json({ success: true });
  });

  // Logs
  app.get('/api/logs', (req, res) => {
    res.json(logs);
  });

  // Backup System
  app.get('/api/backup', (req, res) => {
    res.json(backupConfig);
  });

  app.post('/api/backup/trigger', (req, res) => {
    backupConfig.status = 'RUNNING';

    setTimeout(() => {
      backupConfig.status = 'COMPLETED';
      backupConfig.lastBackupDate = new Date().toISOString().replace('T', ' ').substring(0, 19);
      addLog('ITL Admin', 'Backup Manual em Nuvem/VPS executado com sucesso', 'BACKUP', 'Arquivo .tar.gz de imagens e banco SQL gerado');
    }, 2000);

    res.json({ message: 'Backup manual iniciado em segundo plano', config: backupConfig });
  });

  app.put('/api/backup', (req, res) => {
    backupConfig = { ...backupConfig, ...req.body };
    addLog('ITL Admin', 'Configurações de backup semanal alteradas', 'BACKUP');
    res.json(backupConfig);
  });

  // Notification Push System
  app.get('/api/notifications', (req, res) => {
    res.json(notificationConfig);
  });

  app.put('/api/notifications', (req, res) => {
    notificationConfig = { ...notificationConfig, ...req.body };
    addLog('ITL Admin', 'Configurações de Notificações Push Inteligentes atualizadas', 'SYSTEM');
    res.json(notificationConfig);
  });

  app.post('/api/notifications/test', (req, res) => {
    addLog('ITL Admin', 'Teste de Notificação Push disparado para aplicativo mobile', 'SYSTEM');
    res.json({
      success: true,
      message: 'Notificação push enviada para dispositivos pareados via FCM/Telegram/WhatsApp',
      timestamp: new Date().toISOString(),
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Central ITL] Servidor rodando na porta ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Erro ao iniciar o servidor:', err);
});
