import { Camera, MotionAlert, CloudRecording, User, ActivityLog, BackupConfig, NotificationConfig, E2EESettings } from '../types';

export const INITIAL_USERS: User[] = [
  {
    id: 'user-superadmin-01',
    name: 'Super Admin Unity',
    email: 'suporte@unityautomacoes.com.br',
    role: 'ADMIN',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    phone: '+55 11 98765-4321',
    stateUf: 'BA',
    city: 'Itamaraju',
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
    allowedCameraIds: ['ALL'],
    lastActive: 'Agora mesmo',
    createdAt: '2026-01-01',
  }
];

export const INITIAL_CAMERAS: Camera[] = [
  {
    id: 'cam-principal-01',
    name: 'Câmera Portaria Principal',
    location: 'Entrada Principal - Itamaraju',
    protocol: 'RTSP',
    rtspUrl: 'rtsp://127.0.0.1:8554/live/portaria',
    rtmpUrl: 'rtmp://127.0.0.1/live/portaria',
    streamKey: 'portaria-key',
    status: 'ONLINE',
    isE2EEEncrypted: true,
    encryptionKeyHash: 'e2ee-hash-portaria-01',
    fps: 30,
    resolution: '1080p',
    storageUsedGB: 1.2,
    cloudRecordingsActive: true,
    motionSensitivity: 8,
    aiDetectionEnabled: true,
    twoWayAudioEnabled: true,
    lat: -17.0397,
    lng: -39.5312,
    thumbnailUrl: 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=800&auto=format&fit=crop&q=80',
    createdAt: '2026-07-01',
  },
  {
    id: 'cam-estacionamento-02',
    name: 'Câmera Estacionamento VIP',
    location: 'Estacionamento Central',
    protocol: 'RTSP',
    rtspUrl: 'rtsp://127.0.0.1:8554/live/estacionamento',
    rtmpUrl: 'rtmp://127.0.0.1/live/estacionamento',
    streamKey: 'estacionamento-key',
    status: 'ONLINE',
    isE2EEEncrypted: true,
    encryptionKeyHash: 'e2ee-hash-estacionamento-02',
    fps: 30,
    resolution: '1080p',
    storageUsedGB: 0.8,
    cloudRecordingsActive: true,
    motionSensitivity: 7,
    aiDetectionEnabled: true,
    twoWayAudioEnabled: false,
    lat: -17.0410,
    lng: -39.5330,
    thumbnailUrl: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=800&auto=format&fit=crop&q=80',
    createdAt: '2026-07-01',
  }
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
  storageLimitGB: 100,
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
