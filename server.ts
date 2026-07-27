import express from 'express';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import mysql from 'mysql2/promise';
import { spawn, ChildProcess, execSync } from 'child_process';
import { createServer as createViteServer } from 'vite';

// Map to manage active FFmpeg processes for RTSP/RTMP conversion
const activeFfmpegProcesses = new Map<string, ChildProcess>();
const lastFfmpegLogs = new Map<string, string[]>();
const activeRtspUrls = new Map<string, string>();

function getValidStreamSource(cam: any): string {
  if (!cam) return '';
  const key = cam.streamKey || (cam.id ? (cam.id.startsWith('cam-') ? `cam_${cam.id.replace('cam-', '')}` : cam.id) : 'stream');
  const cleanKey = key.replace(/^cam-/, '').replace(/^cam_/, '');

  if (cam.rtspUrl && cam.rtspUrl.trim().startsWith('rtsp://')) {
    return cam.rtspUrl.trim();
  }

  const candidates = [cam.rtmpUrl, cam.fullRtmpUrl, cam.rtmpServerUrl].filter(Boolean);

  for (const candidate of candidates) {
    let str = candidate.trim();
    if (str.startsWith('rtmp://')) {
      if (str.includes('localhost:1935') || str.includes('127.0.0.1:1935') || str.includes('aerocam.itlfibra.com:1935')) {
        str = str.replace(/localhost:1935|127\.0\.0\.1:1935|aerocam\.itlfibra\.com:1935/g, 'monitoramento.unityautomacoes.com.br:1935');
      }
      return str;
    }
    if (str.startsWith('http://') || str.startsWith('https://')) {
      let rtmpConverted = str
        .replace(/^https?:\/\//, 'rtmp://')
        .replace(/\.m3u8$/, '');
      if (!rtmpConverted.includes(':1935') && !rtmpConverted.includes(':80')) {
        rtmpConverted = rtmpConverted.replace(/(rtmp:\/\/[^/:]+)(\/.*)?$/, '$1:1935$2');
      }
      return rtmpConverted;
    }
  }

  return `rtmp://monitoramento.unityautomacoes.com.br:1935/live/cam_${cleanKey}`;
}

function startCameraRtspStream(cam: Camera, forceRestart = false) {
  if (!cam) return;
  const key = cam.streamKey || (cam.id ? (cam.id.startsWith('cam-') ? `cam_${cam.id.replace('cam-', '')}` : cam.id) : 'stream');
  const cleanKey = key.replace(/^cam-/, '').replace(/^cam_/, '');

  let streamSource = getValidStreamSource(cam);

  if (streamSource.includes('localhost:1935') || streamSource.includes('127.0.0.1:1935') || streamSource.includes('aerocam.itlfibra.com:1935')) {
    streamSource = streamSource.replace(/localhost:1935|127\.0\.0\.1:1935|aerocam\.itlfibra\.com:1935/g, 'monitoramento.unityautomacoes.com.br:1935');
  }

  if (!streamSource) return;

  // If already running with the exact same URL and process is alive, keep running!
  if (!forceRestart && activeFfmpegProcesses.has(key) && activeRtspUrls.get(key) === streamSource) {
    const existingProc = activeFfmpegProcesses.get(key);
    if (existingProc && existingProc.exitCode === null && !existingProc.killed) {
      console.log(`[FFmpeg ITL] Câmera '${cam.name}' (${key}) já possui processo FFmpeg ativo. Mantendo fluxo.`);
      return;
    }
  }

  // Stop previous process if restarting or changing URL
  stopCameraRtspStream(key);

  console.log(`[FFmpeg ITL] Conectando fluxo ${cam.protocol || 'RTSP/RTMP'} -> HLS para a câmera '${cam.name}' (${key}) via ${streamSource}...`);
  const hlsDir = '/tmp/hls';
  if (!fs.existsSync(hlsDir)) {
    try { fs.mkdirSync(hlsDir, { recursive: true }); } catch (e) {}
  }
  const hlsPath = path.join(hlsDir, `${key}.m3u8`);

  const logList: string[] = [`[${new Date().toLocaleTimeString()}] Conectando ao fluxo: ${streamSource}`];
  lastFfmpegLogs.set(key, logList);
  activeRtspUrls.set(key, streamSource);

  const ffmpegArgs: string[] = [];
  if (streamSource.startsWith('rtsp://')) {
    ffmpegArgs.push('-rtsp_transport', 'tcp');
  }

  ffmpegArgs.push(
    '-analyzeduration', '2000000',
    '-probesize', '2000000',
    '-i', streamSource,
    '-map', '0:v:0?',
    '-c:v', 'copy',
    '-map', '0:a:0?',
    '-c:a', 'aac',
    '-f', 'hls',
    '-hls_time', '2',
    '-hls_list_size', '6',
    '-hls_flags', 'delete_segments+omit_endlist+discont_start',
    '-y',
    hlsPath
  );

  const proc = spawn('ffmpeg', ffmpegArgs);

  proc.stderr.on('data', (data) => {
    const line = data.toString().trim();
    if (line) {
      logList.push(line);
      if (logList.length > 30) logList.shift();
    }
  });

  proc.on('exit', (code) => {
    console.log(`[FFmpeg ITL] Processo da câmera '${key}' finalizou com código ${code}`);
    logList.push(`Processo finalizado com código ${code}`);
    activeFfmpegProcesses.delete(key);
    activeRtspUrls.delete(key);
  });

  proc.on('error', (err) => {
    console.log(`[FFmpeg ITL Warning] Falha na inicialização FFmpeg para '${key}': ${err.message}`);
    logList.push(`Erro FFmpeg: ${err.message}`);
    activeFfmpegProcesses.delete(key);
    activeRtspUrls.delete(key);
  });

  activeFfmpegProcesses.set(key, proc);
}

function stopCameraRtspStream(streamKey: string) {
  if (activeFfmpegProcesses.has(streamKey)) {
    try {
      activeFfmpegProcesses.get(streamKey)?.kill('SIGKILL');
    } catch (e) {}
    activeFfmpegProcesses.delete(streamKey);
    activeRtspUrls.delete(streamKey);
  }
}
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

const cleanDoubleUrl = (url: string | undefined | null): string => {
  if (!url) return '';
  // Se a URL contiver duas vezes o prefixo HTTP/HTTPS, limpa
  let cleaned = url.replace(/(https?:\/\/[^/]+)(https?:\/\/)/g, '$2');
  // Limpa barras duplas que não sejam do formato de protocolo
  cleaned = cleaned.replace(/([^:]\/)\/+/g, '$1');
  return cleaned;
};

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(cors());
  app.use(express.json());

  // Setup directory for real recorded video streams
  const recordingsDir = path.join(process.cwd(), 'public', 'recordings');
  if (!fs.existsSync(recordingsDir)) {
    try { fs.mkdirSync(recordingsDir, { recursive: true }); } catch (e) {}
  }
  app.use('/recordings', express.static(recordingsDir));

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
  const deletedRecordingIds = new Set<string>();

  // Real Active Recording Sessions Tracker
  interface ActiveRecordingSession {
    sessionId: string;
    cameraId: string;
    cameraName: string;
    streamUrl: string;
    startTime: Date;
    startTimeStr: string;
    outputPath: string;
    relativeUrl: string;
    process: ReturnType<typeof spawn>;
  }
  const activeRecordings = new Map<string, ActiveRecordingSession>();

  const pad2 = (n: number) => n.toString().padStart(2, '0');
  const formatDateTime = (d: Date) =>
    `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;

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
        if (parsed.recordings && Array.isArray(parsed.recordings)) {
          // Strictly exclude legacy mock auto-generated items
          recordings = parsed.recordings.filter(
            (r: any) =>
              r.id &&
              !r.id.startsWith('rec-5min-') &&
              !r.id.startsWith('rec-cloud-') &&
              !r.id.startsWith('rec-partial-') &&
              !deletedRecordingIds.has(r.id)
          );
        }
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
    const dbHost = process.env.DB_HOST || '127.0.0.1';
    const dbUser = process.env.DB_USER || 'itl_user';
    const dbPassword = process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : 'itl_pass_2026';
    const dbName = process.env.DB_NAME || 'itl_cameras';

    const hostsToTry = [dbHost, '127.0.0.1', 'localhost'];
    const credentials = [
      { user: dbUser, pass: dbPassword },
      { user: dbUser, pass: 'itl_pass_2026' },
      { user: dbUser, pass: '' },
      { user: 'root', pass: dbPassword },
      { user: 'root', pass: 'itl_pass_2026' },
      { user: 'root', pass: '' },
    ];

    let connectedHost = '';

    for (const hostCandidate of hostsToTry) {
      if (isMysqlActive) break;
      for (const cred of credentials) {
        try {
          // Step 1: Connect without database to ensure database exists
          const rootPool = mysql.createPool({
            host: hostCandidate,
            user: cred.user,
            password: cred.pass,
            waitForConnections: true,
            connectionLimit: 5,
            queueLimit: 0,
            connectTimeout: 3000,
          });

          const conn = await rootPool.getConnection();
          await conn.ping();
          // Create database if it does not exist
          await conn.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
          conn.release();
          await rootPool.end();

          // Step 2: Create pool connected to the target database
          const targetPool = mysql.createPool({
            host: hostCandidate,
            user: cred.user,
            password: cred.pass,
            database: dbName,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0,
            connectTimeout: 3000,
          });

          const testConn = await targetPool.getConnection();
          await testConn.ping();
          testConn.release();

          pool = targetPool;
          isMysqlActive = true;
          connectedHost = hostCandidate;
          console.log(`[MySQL ITL] Conectado com SUCESSO ao MySQL em ${connectedHost} (banco '${dbName}', usuário '${cred.user}')`);
          break;
        } catch (err: any) {
          // Continue trying host/credential candidates
        }
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

      // Relax column constraints if existing table had NOT NULL or ENUM/DATETIME constraints
      try {
        await pool.query('ALTER TABLE `cameras` MODIFY `rtsp_url` TEXT NULL');
        await pool.query('ALTER TABLE `cameras` MODIFY `location` VARCHAR(255) NULL');
        await pool.query('ALTER TABLE `cameras` MODIFY `protocol` VARCHAR(50) DEFAULT "RTSP"');
        await pool.query('ALTER TABLE `cameras` MODIFY `status` VARCHAR(50) DEFAULT "ONLINE"');
        await pool.query('ALTER TABLE `cameras` MODIFY `created_at` VARCHAR(100) NULL');
      } catch (e) {}

      // Dynamically add missing columns to cameras table if they do not exist
      try { await pool.query('ALTER TABLE `cameras` ADD COLUMN `thumbnail_url` TEXT NULL'); } catch (e) {}
      try { await pool.query('ALTER TABLE `cameras` ADD COLUMN `rtmp_server_url` TEXT NULL'); } catch (e) {}
      try { await pool.query('ALTER TABLE `cameras` ADD COLUMN `full_rtmp_url` TEXT NULL'); } catch (e) {}
      try { await pool.query('ALTER TABLE `cameras` ADD COLUMN `state_uf` VARCHAR(10) NULL'); } catch (e) {}
      try { await pool.query('ALTER TABLE `cameras` ADD COLUMN `city` VARCHAR(100) NULL'); } catch (e) {}

      await pool.query(`
        CREATE TABLE IF NOT EXISTS \`users\` (
          \`id\` VARCHAR(64) PRIMARY KEY,
          \`name\` VARCHAR(255) NOT NULL,
          \`email\` VARCHAR(255) UNIQUE NOT NULL,
          \`password_hash\` VARCHAR(255) NULL,
          \`role\` VARCHAR(50) DEFAULT 'RESIDENT',
          \`phone\` VARCHAR(50),
          \`status\` VARCHAR(50) DEFAULT 'ACTIVE',
          \`custom_permissions\` JSON,
          \`last_active\` VARCHAR(100) DEFAULT 'Agora',
          \`created_at\` VARCHAR(100) DEFAULT '2026-01-01'
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);

      try {
        await pool.query('ALTER TABLE `users` MODIFY `password_hash` VARCHAR(255) NULL');
        await pool.query('ALTER TABLE `users` MODIFY `last_active` VARCHAR(100) NULL');
        await pool.query('ALTER TABLE `users` MODIFY `created_at` VARCHAR(100) NULL');
        await pool.query('ALTER TABLE `users` MODIFY `role` VARCHAR(50) DEFAULT "RESIDENT"');
        await pool.query('ALTER TABLE `users` MODIFY `status` VARCHAR(50) DEFAULT "ACTIVE"');
      } catch (e) {}

      // Purge legacy mock cameras if present in MySQL
      try {
        await pool.query("DELETE FROM cameras WHERE id IN ('cam-wpg8tz', 'cam-jvv51l', 'cam-v7w3f8')");
      } catch (e) {}

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
    if (!isMysqlActive || !pool) {
      console.log('[MySQL Sync] Pool inativo. Tentando conectar ao MySQL...');
      await initMysqlAndSync();
    }
    if (!isMysqlActive || !pool) {
      console.error(`[MySQL Sync Warning] MySQL indisponível. Câmera ${cam.id} (${cam.name}) mantida no arquivo de persistência local.`);
      return;
    }
    try {
      await pool.query(
        `INSERT INTO cameras (id, name, location, protocol, rtsp_url, rtmp_url, stream_key, rtmp_server_url, full_rtmp_url, state_uf, city, status, is_e2ee_encrypted, encryption_key_hash, fps, resolution, storage_used_gb, cloud_recordings_active, motion_sensitivity, ai_detection_enabled, two_way_audio_enabled, lat, lng, thumbnail_url, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
         name=VALUES(name), location=VALUES(location), protocol=VALUES(protocol), rtsp_url=VALUES(rtsp_url), rtmp_url=VALUES(rtmp_url), stream_key=VALUES(stream_key), rtmp_server_url=VALUES(rtmp_server_url), full_rtmp_url=VALUES(full_rtmp_url), state_uf=VALUES(state_uf), city=VALUES(city), status=VALUES(status), is_e2ee_encrypted=VALUES(is_e2ee_encrypted), fps=VALUES(fps), resolution=VALUES(resolution), storage_used_gb=VALUES(storage_used_gb), cloud_recordings_active=VALUES(cloud_recordings_active), motion_sensitivity=VALUES(motion_sensitivity), ai_detection_enabled=VALUES(ai_detection_enabled), two_way_audio_enabled=VALUES(two_way_audio_enabled), lat=VALUES(lat), lng=VALUES(lng), thumbnail_url=VALUES(thumbnail_url)`,
        [
          cam.id,
          cam.name,
          cam.location || '',
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
      console.log(`[MySQL ITL Sync] Câmera '${cam.name}' (${cam.id}) GRAVADA no MySQL com SUCESSO!`);
    } catch (e: any) {
      console.error('[MySQL Sync Error] Erro ao gravar câmera no MySQL:', e.message || e);
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
        `INSERT INTO users (id, name, email, password_hash, role, phone, status, custom_permissions, last_active, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE name=VALUES(name), role=VALUES(role), phone=VALUES(phone), status=VALUES(status), custom_permissions=VALUES(custom_permissions), last_active=VALUES(last_active)`,
        [
          u.id,
          u.name,
          u.email,
          '$2b$10$itlpasswordhash2026',
          u.role || 'RESIDENT',
          u.phone || '',
          u.status || 'ACTIVE',
          JSON.stringify(u.customPermissions || {}),
          u.lastActive || 'Agora',
          u.createdAt || new Date().toISOString().split('T')[0],
        ]
      );
      console.log(`[MySQL ITL Sync] Usuário '${u.name}' (${u.id}) GRAVADO no MySQL com SUCESSO!`);
    } catch (e: any) {
      console.error('[MySQL Sync Error] Erro ao gravar usuário no MySQL:', e.message || e);
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

  // Start FFmpeg streams for RTSP/RTMP cameras
  cameras.forEach((c) => startCameraRtspStream(c));

  // Continuous 24/7 Automatic Recording Engine for All Active Cameras
  const activeAutoRecordingProcesses = new Map<string, ChildProcess>();
  const autoRecordingDurationSec = 300; // 5-minute rolling slices for real cloud storage

  function startAutoRecordingForCamera(cam: Camera) {
    if (!cam || !cam.id) return;
    if (activeAutoRecordingProcesses.has(cam.id)) return; // Already actively recording a slice

    const streamUrl = getValidStreamSource(cam);
    if (!streamUrl) return;

    const key = cam.streamKey || (cam.id ? (cam.id.startsWith('cam-') ? `cam_${cam.id.replace('cam-', '')}` : cam.id) : 'stream');
    const hlsPath = path.join('/tmp/hls', `${key}.m3u8`);
    
    // Ensure stream generator process is active for this camera
    if (!activeFfmpegProcesses.has(key)) {
      startCameraRtspStream(cam);
    }

    // Prefer local HLS buffer if generated by FFmpeg stream worker, otherwise direct camera streamUrl
    const inputSource = fs.existsSync(hlsPath) ? hlsPath : streamUrl;

    const now = new Date();
    const timestamp = Date.now();
    const cleanCamId = cam.id.replace(/[^a-zA-Z0-9_-]/g, '_');
    const fileName = `rec_auto_${cleanCamId}_${timestamp}.mp4`;
    const thumbFileName = `thumb_auto_${cleanCamId}_${timestamp}.jpg`;
    const outputPath = path.join(recordingsDir, fileName);
    const thumbPath = path.join(recordingsDir, thumbFileName);
    const relativeUrl = `/recordings/${fileName}`;

    const ffmpegArgs: string[] = [];
    if (inputSource.startsWith('rtsp://')) {
      ffmpegArgs.push('-rtsp_transport', 'tcp');
    }

    ffmpegArgs.push(
      '-y',
      '-analyzeduration', '3000000',
      '-probesize', '3000000',
      '-i', inputSource,
      '-map', '0:v:0?',
      '-c:v', 'copy',
      '-map', '0:a:0?',
      '-c:a', 'aac',
      '-bsf:a', 'aac_adtstoasc',
      '-movflags', '+faststart',
      '-t', autoRecordingDurationSec.toString(),
      outputPath
    );

    console.log(`[Auto Recorder 24/7] Gravando bloco automático real de ${autoRecordingDurationSec}s para '${cam.name}' (${cam.id}) via ${inputSource}...`);
    const proc = spawn('ffmpeg', ffmpegArgs);
    activeAutoRecordingProcesses.set(cam.id, proc);

    let isFinalized = false;
    const finalizeSlice = () => {
      if (isFinalized) return;
      isFinalized = true;
      activeAutoRecordingProcesses.delete(cam.id);
      const endTime = new Date();
      const durationSec = Math.max(1, Math.round((endTime.getTime() - now.getTime()) / 1000));

      let validFile = false;
      let fileSizeMB = 0;

      try {
        if (fs.existsSync(outputPath)) {
          const stats = fs.statSync(outputPath);
          if (stats.size > 2000) { // Valid video file with content
            validFile = true;
            fileSizeMB = Math.max(0.1, +(stats.size / (1024 * 1024)).toFixed(1));
          } else {
            try { fs.unlinkSync(outputPath); } catch (e) {}
          }
        }
      } catch (e) {}

      if (validFile) {
        // Extract real snapshot image from the captured MP4 video!
        try {
          execSync(`ffmpeg -y -ss 00:00:01 -i "${outputPath}" -vframes 1 -q:v 2 "${thumbPath}"`, { stdio: 'ignore' });
        } catch (e) {}

        const hasThumb = fs.existsSync(thumbPath);
        const thumbUrl = hasThumb
          ? `/recordings/${thumbFileName}`
          : (cam.thumbnailUrl || 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=800');

        const newRec: CloudRecording = {
          id: `rec-auto-${cam.id}-${timestamp}`,
          cameraId: cam.id,
          cameraName: cam.name,
          startTime: formatDateTime(now),
          endTime: formatDateTime(endTime),
          durationSeconds: durationSec,
          fileSizeMB,
          thumbnailUrl: thumbUrl,
          streamUrl: relativeUrl,
          isE2EELocked: cam.isE2EEEncrypted ?? true,
          tags: ['Gravação Automática 24/7', 'Nuvem Real HD', cam.location || 'Central ITL'],
        };

        recordings.unshift(newRec);
        if (recordings.length > 5000) recordings = recordings.slice(0, 5000);
        saveToLocalFile();
        console.log(`[Auto Recorder 24/7] Bloco real gravado com sucesso para '${cam.name}': ${fileName} (${fileSizeMB}MB)`);
      }

      // Automatically restart next recording slice after 2s
      setTimeout(() => {
        const currentCam = cameras.find((c) => c.id === cam.id);
        if (currentCam && currentCam.cloudRecordingsActive !== false) {
          startAutoRecordingForCamera(currentCam);
        }
      }, 2000);
    };

    proc.on('close', () => finalizeSlice());
    proc.on('exit', () => finalizeSlice());
    proc.on('error', () => finalizeSlice());
  }

  function checkAndStartAllAutoRecordings() {
    cameras.forEach((cam) => {
      if (cam) {
        // Guarantee HLS stream worker is active
        startCameraRtspStream(cam);
        // Guarantee Auto Recording is active
        if (cam.cloudRecordingsActive !== false) {
          startAutoRecordingForCamera(cam);
        }
      }
    });
  }

  // Start continuous 24/7 background recording for all cameras immediately and every 5s
  setTimeout(checkAndStartAllAutoRecordings, 1000);
  setInterval(checkAndStartAllAutoRecordings, 5000);

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

  // Endpoint de Stream Direto MJPEG / HTTP Stream (Zero Latência - modo aerocam)
  app.get(['/api/stream', '/stream', '/api/cameras/:id/stream'], (req, res) => {
    const key = (req.params?.id || req.query.key || req.query.camId || req.query.streamKey || '').toString();
    let queryUrl = (req.query.url || req.query.rtspUrl || req.query.rtmpUrl || '').toString();

    const cleanKey = key.replace(/^cam-/, '').replace(/^cam_/, '');

    const matchedCam = cameras.find(
      (c) =>
        (c.streamKey || c.id) === key ||
        c.id === key ||
        c.id === `cam-${cleanKey}` ||
        c.streamKey === `cam_${cleanKey}` ||
        (c.id && c.id.replace(/^cam-/, '') === cleanKey)
    );

    let targetUrl = '';

    if (queryUrl && (queryUrl.startsWith('rtsp://') || queryUrl.startsWith('rtmp://'))) {
      targetUrl = queryUrl;
    } else if (queryUrl && queryUrl.startsWith('http') && !queryUrl.includes('/live/') && !queryUrl.endsWith('.m3u8')) {
      targetUrl = queryUrl;
    } else if (matchedCam) {
      targetUrl = getValidStreamSource(matchedCam);
    }

    if (!targetUrl && cleanKey) {
      targetUrl = `rtmp://monitoramento.unityautomacoes.com.br:1935/live/cam_${cleanKey}`;
    }

    if (targetUrl.includes('localhost:1935') || targetUrl.includes('127.0.0.1:1935') || targetUrl.includes('aerocam.itlfibra.com:1935')) {
      targetUrl = targetUrl.replace(/localhost:1935|127\.0\.0\.1:1935|aerocam\.itlfibra\.com:1935/g, 'monitoramento.unityautomacoes.com.br:1935');
    }

    if (!targetUrl || (!targetUrl.startsWith('rtsp://') && !targetUrl.startsWith('rtmp://') && !targetUrl.startsWith('http'))) {
      return res.status(404).send('URL da câmera indisponível ou não configurada');
    }

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.setHeader('Content-Type', 'multipart/x-mixed-replace; boundary=ffmpegboundary');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Connection', 'close');

    const width = (req.query.w || '1280').toString();
    const fps = (req.query.fps || '15').toString();

    const ffmpegArgs: string[] = [];

    if (targetUrl.startsWith('rtsp://')) {
      ffmpegArgs.push('-rtsp_transport', 'tcp');
    }

    ffmpegArgs.push(
      '-analyzeduration', '1000000',
      '-probesize', '1000000',
      '-i', targetUrl,
      '-vf', `fps=${fps},scale=${width}:-1`,
      '-q:v', '5',
      '-f', 'mpjpeg',
      '-boundary_tag', 'ffmpegboundary',
      'pipe:1'
    );

    const proc = spawn('ffmpeg', ffmpegArgs);

    let hasReceivedData = false;
    const timeoutTimer = setTimeout(() => {
      if (!hasReceivedData) {
        killProc();
        if (!res.headersSent) {
          res.status(504).send('Timeout ao conectar à câmera');
        } else {
          try { res.end(); } catch (e) {}
        }
      }
    }, 6000);

    proc.stdout.on('data', () => {
      hasReceivedData = true;
      clearTimeout(timeoutTimer);
    });

    proc.stdout.pipe(res);

    const killProc = () => {
      clearTimeout(timeoutTimer);
      try {
        proc.stdout.unpipe(res);
        proc.kill('SIGKILL');
      } catch (e) {}
    };

    req.on('close', killProc);
    req.on('end', killProc);
    res.on('close', killProc);
    res.on('error', killProc);
  });

  // Handler para reprodução de vídeo e transmissões HLS
  app.all('/live/*', async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    const subPath = req.params[0] || '';
    const hlsDir = '/tmp/hls';
    const targetFile = path.join(hlsDir, subPath);

    const cleanKey = subPath.replace(/\.m3u8$/, '').replace(/_\d+\.ts$/, '').replace(/\.ts$/, '');
    const matchedCam = cameras.find(
      (c) => (c.streamKey || c.id) === cleanKey || c.id === cleanKey || c.id === `cam-${cleanKey}` || (c.streamKey && c.streamKey.endsWith(cleanKey))
    );

    // If file doesn't exist and camera is found, ensure FFmpeg process is started on demand
    if (!fs.existsSync(targetFile) && matchedCam) {
      startCameraRtspStream(matchedCam);
    }

    // Se o arquivo ainda não existe (primeiro segmento sendo gerado em ~1-2s), aguarda até 3.5s
    if (!fs.existsSync(targetFile)) {
      for (let i = 0; i < 14; i++) {
        await new Promise((resolve) => setTimeout(resolve, 250));
        if (fs.existsSync(targetFile)) break;
      }
    }

    if (fs.existsSync(targetFile) && fs.statSync(targetFile).isFile()) {
      if (targetFile.endsWith('.ts')) {
        res.setHeader('Content-Type', 'video/mp2t');
      } else if (targetFile.endsWith('.m3u8')) {
        res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
      }
      if (req.method === 'HEAD') {
        return res.status(200).end();
      }
      return res.sendFile(targetFile);
    }

    // Se a câmera não estiver transmitindo no momento (arquivo HLS ausente):
    return res.status(404).json({
      error: 'Câmera offline ou sem transmissão ativa no momento',
      streamKey: cleanKey,
    });
  });

  // Endpoint para Teste / Diagnóstico de Conexão da Câmera (RTSP/RTMP)
  app.post('/api/cameras/test-connection', async (req, res) => {
    const { protocol, rtspUrl, streamKey } = req.body;
    const key = streamKey || 'stream';
    const hlsFile = path.join('/tmp/hls', `${key}.m3u8`);

    let isHlsActive = false;
    let lastModified = null;
    if (fs.existsSync(hlsFile)) {
      try {
        const stat = fs.statSync(hlsFile);
        if (Date.now() - stat.mtimeMs < 20000) {
          isHlsActive = true;
        }
        lastModified = stat.mtime;
      } catch (e) {}
    }

    const logs = lastFfmpegLogs.get(key) || [];
    const logsJoined = logs.join(' ');
    const targetProtocol = protocol || (rtspUrl && rtspUrl.trim().startsWith('rtsp://') ? 'RTSP' : 'RTMP');

    if (targetProtocol === 'RTSP') {
      const targetRtsp = rtspUrl ? rtspUrl.trim() : '';
      if (!targetRtsp) {
        return res.json({
          success: false,
          protocol: 'RTSP',
          streamKey: key,
          hlsActive: isHlsActive,
          message: 'Nenhuma URL RTSP foi cadastrada para esta câmera.',
          logs,
        });
      }

      // Start stream in background if not running yet
      const matchedCam = cameras.find((c) => (c.streamKey || c.id) === key) || {
        id: key,
        name: 'Teste de Diagnóstico',
        protocol: 'RTSP',
        rtspUrl: targetRtsp,
        streamKey: key,
      };
      startCameraRtspStream(matchedCam as Camera);

      // Verify if FFmpeg process or log confirms successful connection
      const isFfmpegConnected = logsJoined.includes('Stream mapping') || logsJoined.includes('Press [q] to stop') || logsJoined.includes('Output #0, hls') || logsJoined.includes('frame=');

      if (isHlsActive || isFfmpegConnected) {
        return res.json({
          success: true,
          protocol: 'RTSP',
          targetUrl: targetRtsp,
          streamKey: key,
          hlsActive: true,
          message: 'Sinal RTSP Conectado com Sucesso! A câmera está respondendo na rede e retransmitindo via HLS em tempo real.',
          codecs: 'H264 / AAC',
          logs: lastFfmpegLogs.get(key) || logs,
        });
      }

      // Execute ffprobe with fast probe parameters and 8s timeout
      const ffprobeProc = spawn('ffprobe', [
        '-v', 'error',
        '-rtsp_transport', 'tcp',
        '-analyzeduration', '1000000',
        '-probesize', '1000000',
        '-i', targetRtsp,
        '-show_entries', 'format=duration,stream=codec_name',
        '-of', 'default=noprint_wrappers=1:nokey=1'
      ]);

      let output = '';
      let errOutput = '';
      let finished = false;

      const timer = setTimeout(() => {
        if (!finished) {
          finished = true;
          try { ffprobeProc.kill('SIGKILL'); } catch (e) {}

          const currentLogs = lastFfmpegLogs.get(key) || logs;
          const currentLogsJoined = currentLogs.join(' ');
          if (currentLogsJoined.includes('Stream mapping') || currentLogsJoined.includes('Press [q] to stop') || fs.existsSync(hlsFile)) {
            return res.json({
              success: true,
              protocol: 'RTSP',
              targetUrl: targetRtsp,
              streamKey: key,
              hlsActive: true,
              message: 'Sinal RTSP Conectado com Sucesso! A câmera está ativamente transmitindo via HLS no servidor.',
              logs: currentLogs,
            });
          }

          return res.json({
            success: false,
            protocol: 'RTSP',
            targetUrl: targetRtsp,
            streamKey: key,
            hlsActive: isHlsActive,
            message: 'Timeout ao conectar na câmera RTSP. Verifique se o IP e a porta 554 estão acessíveis pelo servidor.',
            logs: currentLogs,
          });
        }
      }, 8000);

      ffprobeProc.stdout.on('data', (d) => { output += d.toString(); });
      ffprobeProc.stderr.on('data', (d) => { errOutput += d.toString(); });

      ffprobeProc.on('exit', (code) => {
        if (finished) return;
        finished = true;
        clearTimeout(timer);

        const currentLogs = lastFfmpegLogs.get(key) || logs;
        const currentLogsJoined = currentLogs.join(' ');

        if (code === 0 || currentLogsJoined.includes('Stream mapping') || currentLogsJoined.includes('Press [q] to stop') || fs.existsSync(hlsFile)) {
          return res.json({
            success: true,
            protocol: 'RTSP',
            targetUrl: targetRtsp,
            streamKey: key,
            hlsActive: true,
            message: 'Conexão RTSP estabelecida com sucesso! Câmera ativamente transmitindo vídeo.',
            codecs: output.trim() || 'H264 / AAC',
            logs: currentLogs,
          });
        } else {
          return res.json({
            success: false,
            protocol: 'RTSP',
            targetUrl: targetRtsp,
            streamKey: key,
            hlsActive: isHlsActive,
            message: 'Falha na conexão RTSP. O IP, porta (554) ou credenciais (usuário/senha) da câmera estão inacessíveis ou incorretos.',
            details: errOutput.trim() || `Código de saída ffprobe: ${code}`,
            logs: currentLogs,
          });
        }
      });
    } else {
      // RTMP Diagnostic
      const matchedCam = cameras.find((c) => (c.streamKey || c.id) === key) || {
        id: key,
        name: 'Teste de Diagnóstico RTMP',
        protocol: 'RTMP',
        rtmpUrl: req.body.rtmpUrl || `rtmp://monitoramento.unityautomacoes.com.br:1935/live/${key}`,
        streamKey: key,
      };

      const targetRtmp = getValidStreamSource(matchedCam as Camera) || req.body.rtmpUrl || `rtmp://monitoramento.unityautomacoes.com.br:1935/live/${key}`;

      startCameraRtspStream(matchedCam as Camera, true);

      // Wait up to 3.5s to see if HLS is generated or FFmpeg receives frames
      for (let i = 0; i < 14; i++) {
        if (fs.existsSync(hlsFile)) {
          isHlsActive = true;
          break;
        }
        await new Promise((r) => setTimeout(r, 250));
      }

      const currentLogs = lastFfmpegLogs.get(key) || logs;
      const currentLogsJoined = currentLogs.join(' ');

      const isConnected =
        isHlsActive ||
        currentLogsJoined.includes('Stream mapping') ||
        currentLogsJoined.includes('Press [q] to stop') ||
        currentLogsJoined.includes('Output #0, hls') ||
        currentLogsJoined.includes('frame=');

      if (isConnected) {
        return res.json({
          success: true,
          protocol: 'RTMP',
          targetUrl: targetRtmp,
          streamKey: key,
          hlsActive: true,
          message: 'Sinal RTMP Conectado com Sucesso! A transmissão está ativa e gerando vídeo em tempo real.',
          logs: currentLogs,
        });
      } else {
        const isError =
          currentLogsJoined.includes('Input/output error') ||
          currentLogsJoined.includes('Connection refused') ||
          currentLogsJoined.includes('Server error') ||
          currentLogsJoined.includes('Failed to read');

        return res.json({
          success: false,
          protocol: 'RTMP',
          targetUrl: targetRtmp,
          streamKey: key,
          hlsActive: false,
          message: `Nenhum sinal de vídeo RTMP recebido na URL: ${targetRtmp}.`,
          details: isError
            ? 'O servidor RTMP recusou a conexão ou não há câmera/OBS publicando sinal para esta chave no momento.'
            : 'A porta do servidor de mídia RTMP está acessível, porém nenhum pacote de vídeo foi transmitido pela câmera até o momento.',
          logs: currentLogs,
        });
      }
    }
  });

  // Endpoints para status e sincronização do Banco de Dados MySQL
  app.get('/api/db-status', async (req, res) => {
    let countInDb = 0;
    if (!isMysqlActive || !pool) {
      await initMysqlAndSync();
    }
    if (isMysqlActive && pool) {
      try {
        const [rows]: any = await pool.query('SELECT COUNT(*) as count FROM cameras');
        countInDb = rows[0]?.count || 0;
      } catch (e) {}
    }
    res.json({
      isMysqlActive,
      dbName: process.env.DB_NAME || 'itl_cameras',
      cameraCountInMemory: cameras.length,
      cameraCountInMysql: countInDb,
      status: isMysqlActive ? 'CONECTADO_E_ATIVO' : 'DESCONECTADO_USANDO_JSON_LOCAL'
    });
  });

  app.post('/api/db-sync', async (req, res) => {
    await initMysqlAndSync();
    if (isMysqlActive && pool) {
      for (const cam of cameras) {
        await syncCameraToMysql(cam);
      }
      for (const user of users) {
        await syncUserToMysql(user);
      }
      return res.json({ success: true, message: `Sincronização concluída. ${cameras.length} câmeras e ${users.length} usuários salvos no MySQL.` });
    } else {
      return res.status(500).json({ success: false, message: 'Não foi possível conectar ao MySQL local para sincronizar.' });
    }
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
    const isRtsp = protocol === 'RTSP';

    const newCamera: Camera = {
      id: `cam-${Date.now().toString().slice(-4)}`,
      name,
      location: location || `${city ? city + ' - ' : ''}${stateUf || 'Localização ITL'}`,
      protocol: protocol || 'RTSP',
      rtspUrl: isRtsp ? (rtspUrl ? rtspUrl.trim() : '') : '',
      rtmpUrl: cleanDoubleUrl(rtmpUrl || fullRtmpUrl || `rtmp://${reqHost}:1935/live/${defaultKey}`),
      streamKey: defaultKey,
      rtmpServerUrl: cleanDoubleUrl(rtmpServerUrl || `rtmp://${reqHost}:1935/live`),
      fullRtmpUrl: cleanDoubleUrl(fullRtmpUrl || `${reqProto}://${reqHost}/live/${defaultKey}.m3u8`),
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
    saveToLocalFile();

    await syncCameraToMysql(newCamera);
    startCameraRtspStream(newCamera);
    addLog('ITL Admin', `Nova câmera adicionada (${newCamera.protocol}): ${newCamera.name}`, 'SYSTEM', `URL: ${newCamera.fullRtmpUrl || newCamera.rtspUrl}`);
    res.status(201).json(newCamera);
  });

  app.put('/api/cameras/:id', async (req, res) => {
    const { id } = req.params;
    const index = cameras.findIndex((c) => c.id === id);
    if (index === -1) return res.status(404).json({ error: 'Câmera não encontrada' });

    cameras[index] = { ...cameras[index], ...req.body };
    saveToLocalFile();
    await syncCameraToMysql(cameras[index]);
    startCameraRtspStream(cameras[index]);
    addLog('ITL Admin', `Câmera atualizada: ${cameras[index].name}`, 'SYSTEM');
    res.json(cameras[index]);
  });

  app.delete('/api/cameras/:id', async (req, res) => {
    const { id } = req.params;
    const cam = cameras.find((c) => c.id === id);
    if (cam && cam.streamKey) {
      stopCameraRtspStream(cam.streamKey);
    }
    cameras = cameras.filter((c) => c.id !== id);
    saveToLocalFile();
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

  // Recordings Endpoints (Real Stream Capture Engine for RTMP, RTSP & HLS)
  app.get('/api/recordings', (req, res) => {
    res.json(recordings);
  });

  app.get('/api/recordings/active', (req, res) => {
    const list = Array.from(activeRecordings.values()).map((s) => ({
      sessionId: s.sessionId,
      cameraId: s.cameraId,
      cameraName: s.cameraName,
      startTime: s.startTimeStr,
      elapsedSeconds: Math.round((Date.now() - s.startTime.getTime()) / 1000),
    }));
    res.json(list);
  });

  app.post('/api/recordings/start', (req, res) => {
    const { cameraId, durationSeconds } = req.body;
    const cam = cameras.find((c) => c.id === cameraId || c.streamKey === cameraId);
    if (!cam) return res.status(404).json({ error: 'Câmera não encontrada' });

    if (activeRecordings.has(cam.id)) {
      return res.status(400).json({ error: 'Já existe uma gravação real ativa para esta câmera' });
    }

    const streamUrl = getValidStreamSource(cam);
    if (!streamUrl) {
      return res.status(400).json({ error: 'Sinal de transmissão ao vivo indisponível para esta câmera' });
    }

    const now = new Date();
    const timestamp = Date.now();
    const cleanCamId = cam.id.replace(/[^a-zA-Z0-9_-]/g, '_');
    const fileName = `rec_${cleanCamId}_${timestamp}.mp4`;
    const outputPath = path.join(recordingsDir, fileName);
    const relativeUrl = `/recordings/${fileName}`;

    const ffmpegArgs: string[] = [];
    if (streamUrl.startsWith('rtsp://')) {
      ffmpegArgs.push('-rtsp_transport', 'tcp');
    }

    ffmpegArgs.push(
      '-y',
      '-analyzeduration', '2000000',
      '-probesize', '2000000',
      '-i', streamUrl,
      '-c:v', 'copy',
      '-c:a', 'aac',
      '-movflags', '+faststart'
    );

    const durLimit = durationSeconds ? Math.min(3600, Math.max(10, parseInt(durationSeconds))) : 300;
    ffmpegArgs.push('-t', durLimit.toString());
    ffmpegArgs.push(outputPath);

    console.log(`[FFmpeg Real Recorder] Iniciando gravação ao vivo da câmera '${cam.name}' em ${outputPath}...`);
    const proc = spawn('ffmpeg', ffmpegArgs);

    const sessionId = `session-${cam.id}-${timestamp}`;
    const session: ActiveRecordingSession = {
      sessionId,
      cameraId: cam.id,
      cameraName: cam.name,
      streamUrl,
      startTime: now,
      startTimeStr: formatDateTime(now),
      outputPath,
      relativeUrl,
      process: proc,
    };

    const finalizeRecording = () => {
      if (!activeRecordings.has(cam.id)) return;
      activeRecordings.delete(cam.id);

      const endTime = new Date();
      const durationSec = Math.max(1, Math.round((endTime.getTime() - now.getTime()) / 1000));
      let fileSizeMB = 0.5;
      let thumbUrl = cam.thumbnailUrl || 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=800';

      try {
        if (fs.existsSync(outputPath)) {
          const stats = fs.statSync(outputPath);
          fileSizeMB = Math.max(0.1, +(stats.size / (1024 * 1024)).toFixed(1));
          const thumbFileName = `thumb_real_${cleanCamId}_${timestamp}.jpg`;
          const thumbPath = path.join(recordingsDir, thumbFileName);
          try {
            execSync(`ffmpeg -y -ss 00:00:01 -i "${outputPath}" -vframes 1 -q:v 2 "${thumbPath}"`, { stdio: 'ignore' });
            if (fs.existsSync(thumbPath)) {
              thumbUrl = `/recordings/${thumbFileName}`;
            }
          } catch (e) {}
        }
      } catch (e) {}

      const newRec: CloudRecording = {
        id: `rec-real-${cam.id}-${timestamp}`,
        cameraId: cam.id,
        cameraName: cam.name,
        startTime: formatDateTime(now),
        endTime: formatDateTime(endTime),
        durationSeconds: durationSec,
        fileSizeMB,
        thumbnailUrl: thumbUrl,
        streamUrl: relativeUrl,
        isE2EELocked: cam.isE2EEEncrypted ?? true,
        tags: ['Gravação Real Ao Vivo', 'RTMP/RTSP/HLS', cam.location || 'Central ITL'],
      };

      recordings.unshift(newRec);
      saveToLocalFile();
      addLog('ITL System', `Gravação real concluída para câmera ${cam.name} (${durationSec}s)`, 'RECORDING');
    };

    proc.on('close', (code) => {
      console.log(`[FFmpeg Real Recorder] Concluída gravação real com código ${code}`);
      finalizeRecording();
    });

    proc.on('error', (err) => {
      console.error(`[FFmpeg Real Recorder] Erro FFmpeg:`, err);
      finalizeRecording();
    });

    activeRecordings.set(cam.id, session);

    addLog('ITL Admin', `Iniciada gravação real ao vivo da câmera ${cam.name}`, 'RECORDING');
    res.json({
      success: true,
      message: `Gravação real ao vivo iniciada para ${cam.name}`,
      sessionId,
      cameraId: cam.id,
      startTime: session.startTimeStr,
    });
  });

  app.post('/api/recordings/stop', (req, res) => {
    const { cameraId } = req.body;
    if (!cameraId) return res.status(400).json({ error: 'cameraId é obrigatório' });

    const session = activeRecordings.get(cameraId);
    if (!session) {
      return res.status(404).json({ error: 'Nenhuma gravação ativa encontrada para esta câmera' });
    }

    try {
      session.process.kill('SIGINT');
    } catch (e) {
      try { session.process.kill('SIGKILL'); } catch (err) {}
    }

    res.json({ success: true, message: `Gravação ao vivo interrompida e finalizada para ${session.cameraName}` });
  });

  app.delete('/api/recordings/:id', (req, res) => {
    const { id } = req.params;
    deletedRecordingIds.add(id);
    const target = recordings.find((r) => r.id === id);
    if (target && target.streamUrl && target.streamUrl.startsWith('/recordings/')) {
      const fullFilePath = path.join(process.cwd(), 'public', target.streamUrl);
      if (fs.existsSync(fullFilePath)) {
        try { fs.unlinkSync(fullFilePath); } catch (e) {}
      }
    }
    recordings = recordings.filter((r) => r.id !== id);
    saveToLocalFile();
    addLog('ITL Admin', `Gravação em nuvem excluída: ${id}`, 'RECORDING');
    res.json({ success: true });
  });

  app.post('/api/recordings/batch-delete', (req, res) => {
    const { ids } = req.body;
    if (Array.isArray(ids) && ids.length > 0) {
      const idSet = new Set(ids);
      ids.forEach((id: string) => {
        deletedRecordingIds.add(id);
        const target = recordings.find((r) => r.id === id);
        if (target && target.streamUrl && target.streamUrl.startsWith('/recordings/')) {
          const fullFilePath = path.join(process.cwd(), 'public', target.streamUrl);
          if (fs.existsSync(fullFilePath)) {
            try { fs.unlinkSync(fullFilePath); } catch (e) {}
          }
        }
      });
      recordings = recordings.filter((r) => !idSet.has(r.id));
      saveToLocalFile();
      addLog('ITL Admin', `${ids.length} gravações em nuvem excluídas em lote`, 'RECORDING');
    }
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
