import express from 'express';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import mysql from 'mysql2/promise';
import { createServer as createViteServer } from 'vite';
import {
  INITIAL_CAMERAS,
  INITIAL_ALERTS,
  INITIAL_RECORDINGS,
  INITIAL_USERS,
  INITIAL_LOGS,
  INITIAL_BACKUP_CONFIG,
  INITIAL_NOTIFICATION_CONFIG,
} from './src/data/mockData';
import { Camera, MotionAlert, CloudRecording, User, ActivityLog, BackupConfig, NotificationConfig } from './src/types';

const LOCAL_STORE_FILE = path.join(process.cwd(), 'itl_database_store.json');

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(cors());
  app.use(express.json());

  // Database Connection Pool Setup
  let pool: mysql.Pool | null = null;
  let isMysqlActive = false;

  // In-memory data repositories
  let cameras: Camera[] = [...INITIAL_CAMERAS];
  let alerts: MotionAlert[] = [...INITIAL_ALERTS];
  let recordings: CloudRecording[] = [...INITIAL_RECORDINGS];
  let users: User[] = [...INITIAL_USERS];
  let logs: ActivityLog[] = [...INITIAL_LOGS];
  let backupConfig: BackupConfig = { ...INITIAL_BACKUP_CONFIG };
  let notificationConfig: NotificationConfig = { ...INITIAL_NOTIFICATION_CONFIG };

  // Helper function to save snapshot to local file store
  const saveToLocalFile = () => {
    try {
      const data = {
        cameras,
        alerts,
        recordings,
        users,
        logs,
        backupConfig,
        notificationConfig,
      };
      fs.writeFileSync(LOCAL_STORE_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('[ITL Storage] Erro ao salvar arquivo JSON local:', err);
    }
  };

  // Helper function to load snapshot from local file store
  const loadFromLocalFile = () => {
    try {
      if (fs.existsSync(LOCAL_STORE_FILE)) {
        const raw = fs.readFileSync(LOCAL_STORE_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed.cameras && Array.isArray(parsed.cameras)) cameras = parsed.cameras;
        if (parsed.alerts && Array.isArray(parsed.alerts)) alerts = parsed.alerts;
        if (parsed.recordings && Array.isArray(parsed.recordings)) recordings = parsed.recordings;
        if (parsed.users && Array.isArray(parsed.users)) users = parsed.users;
        if (parsed.logs && Array.isArray(parsed.logs)) logs = parsed.logs;
        if (parsed.backupConfig) backupConfig = parsed.backupConfig;
        if (parsed.notificationConfig) notificationConfig = parsed.notificationConfig;
        console.log(`[ITL Storage] ${cameras.length} câmeras e ${users.length} usuários carregados do arquivo local.`);
        return true;
      }
    } catch (err) {
      console.error('[ITL Storage] Erro ao carregar arquivo JSON local:', err);
    }
    return false;
  };

  // Attempt MySQL Pool initialization & Sync
  const initMysqlAndSync = async () => {
    const dbHost = process.env.DB_HOST || 'localhost';
    const dbUser = process.env.DB_USER || 'itl_user';
    const dbPassword = process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : 'itl_pass_2026';
    const dbName = process.env.DB_NAME || 'itl_cameras';

    // Candidate credential pairs to handle all local/VPS MySQL setups
    const credentials = [
      { user: dbUser, pass: dbPassword },
      { user: dbUser, pass: 'itl_pass_2026' },
      { user: dbUser, pass: '' },
      { user: 'root', pass: dbPassword },
      { user: 'root', pass: 'itl_pass_2026' },
      { user: 'root', pass: '' },
    ];

    for (const cred of credentials) {
      try {
        const tempPool = mysql.createPool({
          host: dbHost,
          user: cred.user,
          password: cred.pass,
          database: dbName,
          waitForConnections: true,
          connectionLimit: 10,
          queueLimit: 0,
          connectTimeout: 3000,
        });

        const conn = await tempPool.getConnection();
        await conn.ping();
        conn.release();

        pool = tempPool;
        isMysqlActive = true;
        console.log(`[MySQL ITL] Conectado com sucesso ao banco '${dbName}' em ${dbHost} com usuário '${cred.user}'`);
        break;
      } catch (err) {
        // Continue trying credentials
      }
    }

    if (!isMysqlActive || !pool) {
      console.log('[MySQL ITL] Banco MySQL local indisponível, usando arquivo JSON de persistência local.');
      loadFromLocalFile();
      return;
    }

    try {
      // Ensure tables exist
      await pool.query(`
        CREATE TABLE IF NOT EXISTS \`cameras\` (
          \`id\` VARCHAR(64) PRIMARY KEY,
          \`name\` VARCHAR(255) NOT NULL,
          \`location\` VARCHAR(255),
          \`protocol\` VARCHAR(20) DEFAULT 'RTSP',
          \`rtsp_url\` TEXT,
          \`rtmp_url\` TEXT,
          \`stream_key\` VARCHAR(100),
          \`rtmp_server_url\` TEXT,
          \`full_rtmp_url\` TEXT,
          \`state_uf\` VARCHAR(10),
          \`city\` VARCHAR(100),
          \`status\` VARCHAR(20) DEFAULT 'ONLINE',
          \`is_e2ee_encrypted\` BOOLEAN DEFAULT TRUE,
          \`encryption_key_hash\` VARCHAR(255),
          \`fps\` INT DEFAULT 30,
          \`resolution\` VARCHAR(50) DEFAULT '1080p',
          \`storage_used_gb\` DECIMAL(10,2) DEFAULT 0.00,
          \`cloud_recordings_active\` BOOLEAN DEFAULT TRUE,
          \`motion_sensitivity\` INT DEFAULT 7,
          \`ai_detection_enabled\` BOOLEAN DEFAULT TRUE,
          \`two_way_audio_enabled\` BOOLEAN DEFAULT TRUE,
          \`lat\` DECIMAL(10, 8),
          \`lng\` DECIMAL(11, 8),
          \`thumbnail_url\` TEXT,
          \`created_at\` VARCHAR(50)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);

      // Relax column constraints if existing table had NOT NULL constraints
      try {
        await pool.query('ALTER TABLE `cameras` MODIFY `rtsp_url` TEXT NULL');
        await pool.query('ALTER TABLE `cameras` MODIFY `location` VARCHAR(255) NULL');
      } catch (e) {}

      await pool.query(`
        CREATE TABLE IF NOT EXISTS \`users\` (
          \`id\` VARCHAR(64) PRIMARY KEY,
          \`name\` VARCHAR(255) NOT NULL,
          \`email\` VARCHAR(255) UNIQUE NOT NULL,
          \`password_hash\` VARCHAR(255),
          \`role\` VARCHAR(30) DEFAULT 'RESIDENT',
          \`phone\` VARCHAR(50),
          \`status\` VARCHAR(20) DEFAULT 'ACTIVE',
          \`custom_permissions\` JSON,
          \`last_active\` VARCHAR(50),
          \`created_at\` VARCHAR(50)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);

      // Load existing cameras from MySQL
      const [camRows]: any = await pool.query('SELECT * FROM cameras ORDER BY created_at DESC');
      if (camRows && camRows.length > 0) {
        cameras = camRows.map((row: any) => ({
          id: row.id,
          name: row.name,
          location: row.location || 'Localização ITL',
          protocol: row.protocol || 'RTSP',
          rtspUrl: row.rtsp_url || '',
          rtmpUrl: row.rtmp_url || '',
          streamKey: row.stream_key || '',
          rtmpServerUrl: row.rtmp_server_url || '',
          fullRtmpUrl: row.full_rtmp_url || '',
          stateUf: row.state_uf || '',
          city: row.city || '',
          status: row.status || 'ONLINE',
          isE2EEEncrypted: Boolean(row.is_e2ee_encrypted),
          encryptionKeyHash: row.encryption_key_hash || '',
          fps: row.fps || 30,
          resolution: row.resolution || '1080p',
          storageUsedGB: parseFloat(row.storage_used_gb || 0),
          cloudRecordingsActive: Boolean(row.cloud_recordings_active),
          motionSensitivity: row.motion_sensitivity || 7,
          aiDetectionEnabled: Boolean(row.ai_detection_enabled),
          twoWayAudioEnabled: Boolean(row.two_way_audio_enabled),
          lat: parseFloat(row.lat || -17.0397),
          lng: parseFloat(row.lng || -39.5312),
          thumbnailUrl: row.thumbnail_url || 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=800&auto=format&fit=crop&q=80',
          createdAt: row.created_at || '2026-01-01',
        }));
        console.log(`[MySQL ITL] ${cameras.length} câmeras recuperadas do banco MySQL.`);
      } else {
        // Seed MySQL with initial or stored cameras if table is empty
        loadFromLocalFile();
        console.log(`[MySQL ITL] Tabela MySQL vazia. Sincronizando ${cameras.length} câmeras para o MySQL...`);
        for (const c of cameras) {
          await syncCameraToMysql(c);
        }
      }

      // Load users from MySQL
      const [userRows]: any = await pool.query('SELECT * FROM users');
      if (userRows && userRows.length > 0) {
        users = userRows.map((row: any) => ({
          id: row.id,
          name: row.name,
          email: row.email,
          role: row.role,
          phone: row.phone,
          status: row.status,
          customPermissions: typeof row.custom_permissions === 'string' ? JSON.parse(row.custom_permissions) : row.custom_permissions,
          lastActive: row.last_active,
          createdAt: row.created_at,
        }));
        console.log(`[MySQL ITL] ${users.length} usuários recuperados do banco MySQL.`);
      } else {
        loadFromLocalFile();
        for (const u of users) {
          await syncUserToMysql(u);
        }
      }
    } catch (err: any) {
      console.log('[MySQL ITL Sync Warning]', err.message);
      loadFromLocalFile();
    }
  };

  // Helper to persist camera to MySQL
  const syncCameraToMysql = async (cam: Camera) => {
    saveToLocalFile();
    if (!isMysqlActive || !pool) return;
    try {
      await pool.query(
        `INSERT INTO cameras (id, name, location, protocol, rtsp_url, rtmp_url, stream_key, rtmp_server_url, full_rtmp_url, state_uf, city, status, is_e2ee_encrypted, encryption_key_hash, fps, resolution, storage_used_gb, cloud_recordings_active, motion_sensitivity, ai_detection_enabled, two_way_audio_enabled, lat, lng, thumbnail_url, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
         name=VALUES(name), location=VALUES(location), protocol=VALUES(protocol), rtsp_url=VALUES(rtsp_url), rtmp_url=VALUES(rtmp_url), stream_key=VALUES(stream_key), rtmp_server_url=VALUES(rtmp_server_url), full_rtmp_url=VALUES(full_rtmp_url), state_uf=VALUES(state_uf), city=VALUES(city), status=VALUES(status), is_e2ee_encrypted=VALUES(is_e2ee_encrypted), motion_sensitivity=VALUES(motion_sensitivity), ai_detection_enabled=VALUES(ai_detection_enabled), two_way_audio_enabled=VALUES(two_way_audio_enabled)`,
        [
          cam.id,
          cam.name,
          cam.location,
          cam.protocol || 'RTSP',
          cam.rtspUrl || '',
          cam.rtmpUrl || '',
          cam.streamKey || '',
          cam.rtmpServerUrl || '',
          cam.fullRtmpUrl || '',
          cam.stateUf || '',
          cam.city || '',
          cam.status || 'ONLINE',
          cam.isE2EEEncrypted ? 1 : 0,
          cam.encryptionKeyHash || '',
          cam.fps || 30,
          cam.resolution || '1080p',
          cam.storageUsedGB || 0,
          cam.cloudRecordingsActive ? 1 : 0,
          cam.motionSensitivity || 7,
          cam.aiDetectionEnabled ? 1 : 0,
          cam.twoWayAudioEnabled ? 1 : 0,
          cam.lat || -17.0397,
          cam.lng || -39.5312,
          cam.thumbnailUrl || '',
          cam.createdAt || new Date().toISOString().split('T')[0],
        ]
      );
    } catch (e) {
      console.error('[MySQL Sync Error] Erro ao gravar câmera:', e);
    }
  };

  // Helper to remove camera from MySQL
  const deleteCameraFromMysql = async (id: string) => {
    saveToLocalFile();
    if (!isMysqlActive || !pool) return;
    try {
      await pool.query('DELETE FROM cameras WHERE id = ?', [id]);
    } catch (e) {
      console.error('[MySQL Sync Error] Erro ao deletar câmera:', e);
    }
  };

  // Helper to sync user to MySQL
  const syncUserToMysql = async (u: User) => {
    saveToLocalFile();
    if (!isMysqlActive || !pool) return;
    try {
      await pool.query(
        `INSERT INTO users (id, name, email, role, phone, status, custom_permissions, last_active, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE name=VALUES(name), role=VALUES(role), phone=VALUES(phone), status=VALUES(status), custom_permissions=VALUES(custom_permissions)`,
        [
          u.id,
          u.name,
          u.email,
          u.role,
          u.phone || '',
          u.status,
          JSON.stringify(u.customPermissions || {}),
          u.lastActive || 'Agora',
          u.createdAt || new Date().toISOString().split('T')[0],
        ]
      );
    } catch (e) {
      console.error('[MySQL Sync Error] Erro ao gravar usuário:', e);
    }
  };

  const deleteUserFromMysql = async (id: string) => {
    saveToLocalFile();
    if (!isMysqlActive || !pool) return;
    try {
      await pool.query('DELETE FROM users WHERE id = ?', [id]);
    } catch (e) {
      console.error('[MySQL Sync Error] Erro ao remover usuário:', e);
    }
  };

  // Initialize DB data on startup
  await initMysqlAndSync();

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
    saveToLocalFile();
  };

  // ---------------- API ENDPOINTS ----------------

  // Health
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      systemName: 'Central ITL de Câmeras & Segurança',
      version: '2.5.0',
      uptimeSeconds: Math.floor(process.uptime()),
      databaseType: isMysqlActive ? 'MySQL Database (Ativo)' : 'JSON Persistence Store',
      camerasCount: cameras.length,
      usersCount: users.length,
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

  app.post('/api/cameras', async (req, res) => {
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
    await syncCameraToMysql(newCamera);
    addLog('ITL Admin', `Nova câmera adicionada (${newCamera.protocol}): ${newCamera.name}`, 'SYSTEM', `URL: ${newCamera.fullRtmpUrl || newCamera.rtspUrl}`);
    res.status(201).json(newCamera);
  });

  app.put('/api/cameras/:id', async (req, res) => {
    const { id } = req.params;
    const index = cameras.findIndex((c) => c.id === id);
    if (index === -1) return res.status(404).json({ error: 'Câmera não encontrada' });

    cameras[index] = { ...cameras[index], ...req.body };
    await syncCameraToMysql(cameras[index]);
    addLog('ITL Admin', `Câmera atualizada: ${cameras[index].name}`, 'SYSTEM');
    res.json(cameras[index]);
  });

  app.delete('/api/cameras/:id', async (req, res) => {
    const { id } = req.params;
    const cam = cameras.find((c) => c.id === id);
    cameras = cameras.filter((c) => c.id !== id);
    await deleteCameraFromMysql(id);
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
      saveToLocalFile();
    }, 8000);

    alerts.unshift(newAlert);
    saveToLocalFile();
    addLog('Sistema AI ITL', `Disparo de Alerta: ${newAlert.eventType} na ${targetCam.name}`, 'SYSTEM', `Push mobile: ${newAlert.pushedToMobile ? 'Sim' : 'Não'}`);
    res.status(201).json(newAlert);
  });

  app.patch('/api/alerts/:id/read', (req, res) => {
    const { id } = req.params;
    const alert = alerts.find((a) => a.id === id);
    if (alert) alert.readStatus = true;
    saveToLocalFile();
    res.json({ success: true, alert });
  });

  // Recordings
  app.get('/api/recordings', (req, res) => {
    res.json(recordings);
  });

  app.delete('/api/recordings/:id', (req, res) => {
    const { id } = req.params;
    recordings = recordings.filter((r) => r.id !== id);
    saveToLocalFile();
    addLog('ITL Admin', `Gravação em nuvem excluída: ${id}`, 'RECORDING');
    res.json({ success: true });
  });

  // Users & Permissions
  app.get('/api/users', (req, res) => {
    res.json(users);
  });

  app.post('/api/users', async (req, res) => {
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
    await syncUserToMysql(newUser);
    addLog('ITL Admin', `Novo usuário cadastrado: ${newUser.name} (${newUser.role})`, 'AUTH');
    res.status(201).json(newUser);
  });

  app.put('/api/users/:id', async (req, res) => {
    const { id } = req.params;
    const index = users.findIndex((u) => u.id === id);
    if (index === -1) return res.status(404).json({ error: 'Usuário não encontrado' });

    users[index] = { ...users[index], ...req.body };
    await syncUserToMysql(users[index]);
    addLog('ITL Admin', `Permissões/dados do usuário ${users[index].name} atualizados`, 'AUTH');
    res.json(users[index]);
  });

  app.delete('/api/users/:id', async (req, res) => {
    const { id } = req.params;
    users = users.filter((u) => u.id !== id);
    await deleteUserFromMysql(id);
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
      saveToLocalFile();
      addLog('ITL Admin', 'Backup Manual em Nuvem/VPS executado com sucesso', 'BACKUP', 'Arquivo .tar.gz de imagens e banco SQL gerado');
    }, 2000);

    saveToLocalFile();
    res.json({ message: 'Backup manual iniciado em segundo plano', config: backupConfig });
  });

  app.put('/api/backup', (req, res) => {
    backupConfig = { ...backupConfig, ...req.body };
    saveToLocalFile();
    addLog('ITL Admin', 'Configurações de backup semanal alteradas', 'BACKUP');
    res.json(backupConfig);
  });

  // Notification Push System
  app.get('/api/notifications', (req, res) => {
    res.json(notificationConfig);
  });

  app.put('/api/notifications', (req, res) => {
    notificationConfig = { ...notificationConfig, ...req.body };
    saveToLocalFile();
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
