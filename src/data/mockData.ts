import { Camera, MotionAlert, CloudRecording, User, ActivityLog, BackupConfig, NotificationConfig, E2EESettings } from '../types';

export const INITIAL_USERS: User[] = [
  {
    id: 'user-superadmin-01',
    name: 'Super Admin Unity',
    email: 'suporte@unityautomacoes.com.br',
    role: 'ADMIN',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    phone: '+55 11 98765-4321',
    status: 'ACTIVE',
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
  }
];

export const INITIAL_CAMERAS: Camera[] = [
  {
    id: 'cam-wpg8tz',
    name: 'Prado 11 - Portaria Principal',
    location: 'Prado - BA',
    protocol: 'RTMP',
    rtspUrl: 'rtsp://admin:itl2026@192.168.1.100:554/live/ch0',
    rtmpUrl: 'rtmp://localhost:1935/live/cam_wpg8tz',
    streamKey: 'cam_wpg8tz',
    rtmpServerUrl: 'rtmp://localhost:1935/live',
    fullRtmpUrl: '/live/cam_wpg8tz.m3u8',
    stateUf: 'BA',
    city: 'Prado',
    status: 'ONLINE',
    isE2EEEncrypted: true,
    encryptionKeyHash: 'e2ee-hash-01',
    fps: 30,
    resolution: '1080p Full HD',
    storageUsedGB: 0.5,
    cloudRecordingsActive: true,
    motionSensitivity: 8,
    aiDetectionEnabled: true,
    twoWayAudioEnabled: true,
    lat: -17.0397,
    lng: -39.5312,
    thumbnailUrl: 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=800',
    createdAt: '2026-01-01',
  },
  {
    id: 'cam-jvv51l',
    name: 'Câmera Pátio Central',
    location: 'Itamaraju - BA',
    protocol: 'RTMP',
    rtspUrl: 'rtsp://admin:itl2026@192.168.1.101:554/live/ch0',
    rtmpUrl: 'rtmp://localhost:1935/live/cam_jvv51l',
    streamKey: 'cam_jvv51l',
    rtmpServerUrl: 'rtmp://localhost:1935/live',
    fullRtmpUrl: '/live/cam_jvv51l.m3u8',
    stateUf: 'BA',
    city: 'Itamaraju',
    status: 'ONLINE',
    isE2EEEncrypted: true,
    encryptionKeyHash: 'e2ee-hash-02',
    fps: 30,
    resolution: '1080p Full HD',
    storageUsedGB: 0.8,
    cloudRecordingsActive: true,
    motionSensitivity: 7,
    aiDetectionEnabled: true,
    twoWayAudioEnabled: true,
    lat: -17.0420,
    lng: -39.5350,
    thumbnailUrl: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800',
    createdAt: '2026-01-01',
  },
  {
    id: 'cam-v7w3f8',
    name: 'Câmera Estacionamento Visitantes',
    location: 'Itamaraju - BA',
    protocol: 'RTMP',
    rtspUrl: 'rtsp://admin:itl2026@192.168.1.102:554/live/ch0',
    rtmpUrl: 'rtmp://localhost:1935/live/cam_v7w3f8',
    streamKey: 'cam_v7w3f8',
    rtmpServerUrl: 'rtmp://localhost:1935/live',
    fullRtmpUrl: '/live/cam_v7w3f8.m3u8',
    stateUf: 'BA',
    city: 'Itamaraju',
    status: 'ONLINE',
    isE2EEEncrypted: true,
    encryptionKeyHash: 'e2ee-hash-03',
    fps: 30,
    resolution: '1080p Full HD',
    storageUsedGB: 0.3,
    cloudRecordingsActive: true,
    motionSensitivity: 6,
    aiDetectionEnabled: true,
    twoWayAudioEnabled: true,
    lat: -17.0380,
    lng: -39.5290,
    thumbnailUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b2?w=800',
    createdAt: '2026-01-01',
  },
];

export const INITIAL_ALERTS: MotionAlert[] = [];

export const INITIAL_RECORDINGS: CloudRecording[] = [];

export const INITIAL_LOGS: ActivityLog[] = [
  {
    id: 'log-101',
    userName: 'Super Admin Unity',
    action: 'Banco de dados configurado para Produção',
    category: 'AUTH',
    details: 'Apenas Super Admin cadastrado na instalação limpa',
    ipAddress: '127.0.0.1',
    timestamp: '2026-07-23 00:00:00',
  }
];

export const INITIAL_BACKUP_CONFIG: BackupConfig = {
  schedule: 'WEEKLY_SUNDAY_0200',
  destination: 'LOCAL_VPS',
  retentionDays: 30,
  encryptBackups: true,
  autoBackupEnabled: true,
  lastBackupDate: '2026-07-20 02:00:00',
  nextBackupDate: '2026-07-27 02:00:00',
  status: 'IDLE',
  storagePath: '/var/www/itl-backups/',
};

export const INITIAL_NOTIFICATION_CONFIG: NotificationConfig = {
  pushEnabled: true,
  fcmServerKey: '',
  telegramBotToken: '',
  telegramChatId: '',
  whatsappWebhookUrl: '',
  soundAlerts: true,
  quietHoursEnabled: false,
  quietHoursStart: '23:00',
  quietHoursEnd: '06:00',
  alertSeverities: ['CRITICAL', 'HIGH', 'MEDIUM'],
};

export const INITIAL_E2EE_SETTINGS: E2EESettings = {
  isVaultUnlocked: true,
  passphraseHash: 'e2ee-master-passphrase-itl-sec-2026',
  algorithm: 'AES-256-GCM',
  totalEncryptedStreams: 0,
};
