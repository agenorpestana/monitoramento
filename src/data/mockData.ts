import {
  Camera,
  MotionAlert,
  CloudRecording,
  User,
  ActivityLog,
  BackupConfig,
  NotificationConfig,
  E2EESettings,
  StolenVehicle,
  LPRDetection,
  LPRSettings,
  Person,
  FaceDetection,
  FaceSettings,
  AIWorkerJob,
  GPUMetrics,
  LGPDAuditLog,
  ArchitectureConfig,
  StreamInfo,
} from '../types';

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

export const INITIAL_STOLEN_VEHICLES: StolenVehicle[] = [];

export const INITIAL_LPR_DETECTIONS: LPRDetection[] = [];

export const INITIAL_LPR_SETTINGS: LPRSettings = {
  cooldownMinutes: 3, // Ignore same plate on same camera within 3 minutes
  minConfidenceThreshold: 75,
  preferredOcrEngine: 'YOLO+PaddleOCR',
  enableAudioAlerts: true,
  autoNotifyWebhooks: true,
};

export const INITIAL_PERSONS: Person[] = [
  {
    id: 'person-01',
    name: 'Carlos Eduardo Silva',
    document: '123.456.789-00',
    type: 'RESIDENT',
    status: 'ACTIVE',
    photoUrls: [
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
    ],
    consentStatus: 'GRANTED',
    retentionUntil: '2028-12-31',
    notes: 'Morador Bloco A - Ap 302',
    createdAt: '2026-02-10 10:00:00',
    updatedAt: '2026-07-29 12:00:00',
  },
  {
    id: 'person-02',
    name: 'Mariana Oliveira Santos',
    document: '987.654.321-11',
    type: 'EMPLOYEE',
    status: 'ACTIVE',
    photoUrls: [
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80',
    ],
    consentStatus: 'GRANTED',
    retentionUntil: '2027-06-30',
    notes: 'Supervisora de Operações de Fibra ISP',
    createdAt: '2026-03-15 14:30:00',
    updatedAt: '2026-07-29 14:00:00',
  },
  {
    id: 'person-03',
    name: 'Suspeito Monitorado - Alerta Mandado',
    document: 'N/A - Polícia Civil',
    type: 'WATCHLIST',
    status: 'BLOCKED',
    photoUrls: [
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80',
    ],
    consentStatus: 'NOT_REQUIRED',
    notes: 'Inclusão por ordem judicial - Mandado de prisão em aberto (Segurança Pública)',
    createdAt: '2026-07-01 09:15:00',
    updatedAt: '2026-07-29 08:00:00',
  },
];

export const INITIAL_FACE_DETECTIONS: FaceDetection[] = [
  {
    id: 'facedet-101',
    cameraId: 'cam-01',
    cameraName: 'Câmera 01 - Portaria Principal (Fibra)',
    personId: 'person-01',
    personName: 'Carlos Eduardo Silva',
    similarity: 98.4,
    qualityScore: 94.2,
    boundingBox: { x: 220, y: 140, width: 110, height: 130 },
    snapshotUrl: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&auto=format&fit=crop&q=80',
    faceCropUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
    timestamp: '2026-07-29 18:42:10',
    isWatchlistAlert: false,
    decision: 'MATCH',
    location: 'Entrada Pedestres - Bloco A',
  },
  {
    id: 'facedet-102',
    cameraId: 'cam-02',
    cameraName: 'Câmera 02 - Garagem Térreo',
    personId: 'person-03',
    personName: 'Suspeito Monitorado - Alerta Mandado',
    similarity: 92.8,
    qualityScore: 88.5,
    boundingBox: { x: 310, y: 180, width: 95, height: 115 },
    snapshotUrl: 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=800&auto=format&fit=crop&q=80',
    faceCropUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80',
    timestamp: '2026-07-29 19:05:32',
    isWatchlistAlert: true,
    decision: 'MATCH',
    location: 'Estreito Acesso Garagem',
  },
];

export const INITIAL_FACE_SETTINGS: FaceSettings = {
  minFaceSizePx: 80,
  minSimilarityThreshold: 85,
  qualityFilterMinScore: 70,
  enableWatchlistAlerts: true,
  autoPurgeDays: 90,
  preferredDetector: 'SCRFD',
  preferredEmbedder: 'ArcFace',
  vectorEngine: 'pgvector',
};

export const INITIAL_AI_JOBS: AIWorkerJob[] = [
  {
    id: 'job-gpu-01',
    workerName: 'LPR Core Worker (YOLOv11 + PaddleOCR)',
    type: 'LPR_WORKER',
    status: 'RUNNING',
    gpuDeviceId: 0,
    currentFps: 124.5,
    processedFrames: 1845200,
    droppedFrames: 12,
    latencyMs: 8.4,
    vramUsedMB: 3420,
    queueLagMs: 2.1,
    activeCamerasCount: 16,
    lastHeartbeat: '2026-07-29 19:14:30',
  },
  {
    id: 'job-gpu-02',
    workerName: 'Facial Worker (SCRFD + ArcFace 512d)',
    type: 'FACIAL_WORKER',
    status: 'RUNNING',
    gpuDeviceId: 0,
    currentFps: 92.1,
    processedFrames: 1290100,
    droppedFrames: 5,
    latencyMs: 11.2,
    vramUsedMB: 2850,
    queueLagMs: 1.8,
    activeCamerasCount: 12,
    lastHeartbeat: '2026-07-29 19:14:31',
  },
  {
    id: 'job-gpu-03',
    workerName: 'Event Deduplication & Webhook Router (BullMQ)',
    type: 'EVENT_WORKER',
    status: 'RUNNING',
    gpuDeviceId: 0,
    currentFps: 450.0,
    processedFrames: 5410900,
    droppedFrames: 0,
    latencyMs: 0.9,
    vramUsedMB: 210,
    queueLagMs: 0.2,
    activeCamerasCount: 24,
    lastHeartbeat: '2026-07-29 19:14:32',
  },
];

export const INITIAL_GPU_METRICS: GPUMetrics = {
  gpuName: 'NVIDIA RTX 4090 / L40S Datacenter ISP',
  driverVersion: '550.54.14',
  cudaVersion: '12.4',
  utilizationGpuPct: 42,
  utilizationMemoryPct: 38,
  vramTotalMB: 24576,
  vramUsedMB: 9340,
  vramFreeMB: 15236,
  temperatureC: 54,
  powerUsageW: 185,
  powerLimitW: 350,
  activeCudaCores: 16384,
  tensorCoresActive: true,
};

export const INITIAL_LGPD_AUDIT_LOGS: LGPDAuditLog[] = [
  {
    id: 'lgpd-log-1001',
    operatorId: 'user-superadmin-01',
    operatorName: 'Super Admin Unity',
    operatorRole: 'ADMIN',
    action: 'VIEW_BIOMETRIC',
    targetType: 'PERSON_FACE',
    targetId: 'person-01',
    targetDetails: 'Visualização de dados biométricos de Carlos Eduardo Silva',
    justificationLegalBasis: 'SEGURANCA_PUBLICA',
    ipAddress: '187.54.12.98',
    timestamp: '2026-07-29 18:45:00',
  },
  {
    id: 'lgpd-log-1002',
    operatorId: 'user-superadmin-01',
    operatorName: 'Super Admin Unity',
    operatorRole: 'ADMIN',
    action: 'SEARCH',
    targetType: 'LPR_PLATE',
    targetDetails: 'Busca textual de placas no histórico de LPR',
    justificationLegalBasis: 'LEGITIMO_INTERESSE',
    ipAddress: '187.54.12.98',
    timestamp: '2026-07-29 19:00:15',
  },
];

export const INITIAL_ARCHITECTURE_CONFIG: ArchitectureConfig = {
  primaryTopology: 'CENTRAL_GPU',
  centralMediaMtxUrl: 'rtsp://datacenter-isp.internal:8554',
  ffmpegPreset: 'gpu_nvenc',
  gstreamerEnabled: true,
  onvifAutoDiscovery: true,
  redisQueueUrl: 'redis://datacenter-isp.internal:6379/0',
  postgresVectorUrl: 'postgresql://admin:secret@datacenter-isp.internal:5432/vms_pgvector',
  minioStorageUrl: 'https://s3-storage.datacenter-isp.internal',
  edgeNodesCount: 4,
  edgeSyncIntervalSec: 10,
  offlineCacheEnabled: true,
};

export const INITIAL_STREAMS: StreamInfo[] = [
  {
    cameraId: 'cam-01',
    cameraName: 'Câmera 01 - Portaria Principal (Fibra)',
    rtspUrl: 'rtsp://datacenter-isp.internal:8554/cam01_main',
    hlsUrl: 'https://datacenter-isp.internal/hls/cam01/index.m3u8',
    webrtcUrl: 'https://datacenter-isp.internal/webrtc/cam01',
    status: 'ONLINE',
    bitrateKbps: 4096,
    codecs: 'H.265 / AAC',
    ingestGateway: 'MediaMTX-Fiber',
  },
  {
    cameraId: 'cam-02',
    cameraName: 'Câmera 02 - Garagem Térreo',
    rtspUrl: 'rtsp://datacenter-isp.internal:8554/cam02_garage',
    hlsUrl: 'https://datacenter-isp.internal/hls/cam02/index.m3u8',
    webrtcUrl: 'https://datacenter-isp.internal/webrtc/cam02',
    status: 'ONLINE',
    bitrateKbps: 2048,
    codecs: 'H.264 / AAC',
    ingestGateway: 'FFmpeg-NVENC',
  },
];

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


