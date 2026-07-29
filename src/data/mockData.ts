import { Camera, MotionAlert, CloudRecording, User, ActivityLog, BackupConfig, NotificationConfig, E2EESettings, StolenVehicle, LPRDetection, LPRSettings } from '../types';

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

export const INITIAL_CAMERAS: Camera[] = [];

export const INITIAL_ALERTS: MotionAlert[] = [];

export const INITIAL_RECORDINGS: CloudRecording[] = [];

export const INITIAL_STOLEN_VEHICLES: StolenVehicle[] = [
  {
    id: 'stolen-001',
    plate: 'BRA2E19',
    normalizedPlate: 'BRA2E19',
    vehicleModel: 'Toyota Corolla Cross Prata',
    vehicleColor: 'Prata',
    ownerName: 'Carlos Eduardo Silva',
    ownerPhone: '+55 73 99881-2233',
    reason: 'Roubo à mão armada em via pública - B.O. 10452/2026',
    urgencyLevel: 'CRITICAL',
    reportedDate: '2026-07-28',
    status: 'ACTIVE',
    notes: 'Suspeitos armados em fuga sentido BR-101. Notificar Polícia imediatamente.',
    createdAt: '2026-07-28T14:30:00Z',
  },
  {
    id: 'stolen-002',
    plate: 'KLU-4812',
    normalizedPlate: 'KLU4812',
    vehicleModel: 'Honda Civic Preto 2021',
    vehicleColor: 'Preto',
    ownerName: 'Mariana Mendonça',
    ownerPhone: '+55 73 98112-9988',
    reason: 'Furto noturno em garagem residencial',
    urgencyLevel: 'HIGH',
    reportedDate: '2026-07-25',
    status: 'ACTIVE',
    notes: 'Possível uso de placa clonada.',
    createdAt: '2026-07-25T09:15:00Z',
  }
];

export const INITIAL_LPR_DETECTIONS: LPRDetection[] = [
  {
    id: 'lpr-1001',
    plate: 'BRA2E19',
    normalizedPlate: 'BRA2E19',
    carImageUrl: 'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?w=600&auto=format&fit=crop&q=80',
    plateImageUrl: 'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?w=200&auto=format&fit=crop&q=80',
    vehicleType: 'Carro',
    vehicleColor: 'Prata',
    cameraId: 'cam-01',
    cameraName: 'Câmera Entrada Norte - Portal',
    address: 'Av. Liberdade, 1200 - Centro',
    latitude: -17.0397,
    longitude: -39.5312,
    timestamp: '2026-07-29T08:15:22.000Z',
    confidence: 98.8,
    isStolenAlert: true,
    stolenDetails: {
      ownerName: 'Carlos Eduardo Silva',
      ownerPhone: '+55 73 99881-2233',
      reportedDate: '2026-07-28',
      alertReason: 'Roubo à mão armada em via pública - B.O. 10452/2026',
      urgencyLevel: 'CRITICAL',
    },
    ocrEngine: 'YOLO+PaddleOCR',
    ignoredParkedCount: 0,
  },
  {
    id: 'lpr-1002',
    plate: 'RTA8F92',
    normalizedPlate: 'RTA8F92',
    carImageUrl: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=600&auto=format&fit=crop&q=80',
    plateImageUrl: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=200&auto=format&fit=crop&q=80',
    vehicleType: 'Carro',
    vehicleColor: 'Azul',
    cameraId: 'cam-02',
    cameraName: 'Câmera Cruzamento Sul',
    address: 'Rua Santos Dumont, 450 - Bairro Novo',
    latitude: -17.0450,
    longitude: -39.5280,
    timestamp: '2026-07-29T08:10:05.000Z',
    confidence: 96.4,
    isStolenAlert: false,
    ocrEngine: 'YOLO+EasyOCR',
    ignoredParkedCount: 4, // 4 repeated readings of parked car ignored by cooldown filter
  },
];

export const INITIAL_LPR_SETTINGS: LPRSettings = {
  cooldownMinutes: 3, // Ignore same plate on same camera within 3 minutes
  minConfidenceThreshold: 75,
  preferredOcrEngine: 'YOLO+PaddleOCR',
  enableAudioAlerts: true,
  autoNotifyWebhooks: true,
};

export const INITIAL_LOGS: ActivityLog[] = [
  {
    id: 'log-101',
    userName: 'Super Admin Unity',
    action: 'Módulo LPR Reconhecimento de Placas e Cadastro de Roubos Ativo',
    category: 'LPR',
    details: 'Filtro de deduplicação de carros parados ajustado para 3 minutos',
    ipAddress: '127.0.0.1',
    timestamp: '2026-07-29 05:00:00',
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

