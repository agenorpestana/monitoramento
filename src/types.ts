export type CameraStatus = 'ONLINE' | 'OFFLINE' | 'RECORDING' | 'ALERT';

export type AlertType = 'HUMAN' | 'VEHICLE' | 'ANIMAL' | 'INTRUSION' | 'SOUND' | 'MOTION' | 'LPR_STOLEN';

export type AlertSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type UserRole = 'ADMIN' | 'OPERATOR' | 'GUARD' | 'RESIDENT' | 'VIEWER';

export interface CustomPermissions {
  canViewLive: boolean;
  canViewRecordings: boolean;
  canControlPTZ: boolean;
  canUseTwoWayAudio: boolean;
  canManageCameras: boolean;
  canDeleteRecordings: boolean;
  canAccessAuditLogs: boolean;
  canManageUsers: boolean;
  canExportReports: boolean;
  canManageFinancial?: boolean;
}

export type FinancialStatus = 'OK' | 'WARNING' | 'BLOCKED';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
  stateUf?: string;
  city?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  customPermissions: CustomPermissions;
  allowedCameraIds?: string[]; // If empty or contains 'ALL', user has access to all cameras
  lastActive: string;
  createdAt: string;

  // Financial fields
  planId?: string;
  planName?: string;
  monthlyFee?: number;
  chosenDueDay?: 5 | 10 | 15 | 20;
  financialStatus?: FinancialStatus;
  daysOverdue?: number;
}

export interface FinancialPlan {
  id: string;
  name: string;
  monthlyPrice: number;
  camerasIncluded: number;
  cloudRetentionDays: number;
  description: string;
  popular?: boolean;
}

export type InvoiceStatus = 'PAID' | 'PENDING' | 'OVERDUE' | 'CANCELLED';

export interface Invoice {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  planName: string;
  amount: number;
  originalAmount: number;
  dueDate: string; // YYYY-MM-DD
  paymentDate?: string;
  status: InvoiceStatus;
  isProRata: boolean;
  proRataDays?: number;
  pixCode?: string;
  pixQrCodeUrl?: string;
  mercadoPagoPaymentId?: string;
  createdAt: string;
}

export interface MercadoPagoConfig {
  accessToken: string;
  publicKey: string;
  webhookSecret: string;
  isSandbox: boolean;
  autoApproveSimulated: boolean;
}

export interface Camera {
  id: string;
  name: string;
  location: string;
  protocol?: 'RTSP' | 'RTMP';
  rtspUrl: string;
  rtmpUrl?: string;
  streamKey?: string;
  rtmpServerUrl?: string;
  fullRtmpUrl?: string;
  stateUf?: string;
  city?: string;
  status: CameraStatus;
  isE2EEEncrypted: boolean;
  encryptionKeyHash?: string;
  fps: number;
  resolution: string;
  storageUsedGB: number;
  cloudRecordingsActive: boolean;
  motionSensitivity: number; // 1 to 10
  aiDetectionEnabled: boolean;
  twoWayAudioEnabled: boolean;
  lat: number;
  lng: number;
  createdAt?: string;
  thumbnailUrl?: string;
  videoStreamUrl?: string;
  isLiveWebcam?: boolean;
  isDemo?: boolean; // Flagged as tasting / public demo camera for landing page
}

export interface MotionAlert {
  id: string;
  cameraId: string;
  cameraName: string;
  eventType: AlertType;
  confidence: number;
  snapshotUrl: string;
  videoClipUrl?: string;
  timestamp: string;
  severity: AlertSeverity;
  readStatus: boolean;
  pushedToMobile: boolean;
}

export interface CloudRecording {
  id: string;
  cameraId: string;
  cameraName: string;
  startTime: string;
  endTime: string;
  durationSeconds: number;
  fileSizeMB: number;
  thumbnailUrl: string;
  streamUrl: string;
  isE2EELocked: boolean;
  tags: string[];
}

export interface ActivityLog {
  id: string;
  userId?: string;
  userName: string;
  action: string;
  category: 'AUTH' | 'LIVE_VIEW' | 'RECORDING' | 'SYSTEM' | 'BACKUP' | 'PTZ' | 'AUDIO' | 'FINANCIAL' | 'SETTINGS' | 'LPR';
  details?: string;
  ipAddress?: string;
  timestamp: string;
}

export interface BackupConfig {
  schedule: 'DAILY_0200' | 'WEEKLY_SUNDAY_0200' | 'MONTHLY_1ST';
  destination: 'LOCAL_VPS' | 'AWS_S3' | 'WASABI' | 'GOOGLE_DRIVE';
  retentionDays: number;
  encryptBackups: boolean;
  autoBackupEnabled: boolean;
  lastBackupDate: string;
  nextBackupDate: string;
  status: 'IDLE' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  storagePath?: string;
  storageLimitGB?: number;
}

export interface NotificationConfig {
  pushEnabled: boolean;
  fcmServerKey: string;
  telegramBotToken: string;
  telegramChatId: string;
  whatsappWebhookUrl: string;
  soundAlerts: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  alertSeverities: AlertSeverity[];
}

export interface E2EESettings {
  isVaultUnlocked: boolean;
  passphraseHash: string;
  algorithm: string;
  totalEncryptedStreams: number;
}

export interface StolenVehicleDetails {
  ownerName?: string;
  ownerPhone?: string;
  reportedDate?: string;
  alertReason?: string;
  urgencyLevel?: 'CRITICAL' | 'HIGH' | 'MEDIUM';
}

export interface LPRDetection {
  id: string;
  plate: string;
  normalizedPlate: string; // e.g. ABC1D23 or ABC1234
  carImageUrl?: string; // Full car crop / frame
  plateImageUrl?: string; // License plate cropped snippet
  vehicleType: 'Carro' | 'Moto' | 'Caminhão' | 'Ônibus' | 'Utilitário' | 'Desconhecido';
  vehicleColor?: string;
  cameraId: string;
  cameraName: string;
  address: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  confidence: number; // e.g. 98.5
  isStolenAlert: boolean;
  stolenDetails?: StolenVehicleDetails;
  ocrEngine?: 'YOLO+PaddleOCR' | 'YOLO+EasyOCR' | 'GeminiVisionAI';
  ignoredParkedCount?: number;
}

export interface StolenVehicle {
  id: string;
  plate: string;
  normalizedPlate: string;
  vehicleModel: string;
  vehicleColor: string;
  ownerName: string;
  ownerPhone: string;
  reason: string;
  urgencyLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  reportedDate: string;
  status: 'ACTIVE' | 'RECOVERED' | 'CANCELLED';
  notes?: string;
  createdAt: string;
}

export interface LPRSettings {
  cooldownMinutes: number; // Deduplication interval for parked cars
  minConfidenceThreshold: number;
  preferredOcrEngine: 'YOLO+PaddleOCR' | 'YOLO+EasyOCR' | 'GeminiVisionAI';
  enableAudioAlerts: boolean;
  autoNotifyWebhooks: boolean;
  webhookUrl?: string;
  operatingMode?: 'PRODUCTION' | 'TEST';
}

// ----------------------------------------------------------------------
// Facial Recognition Module
// ----------------------------------------------------------------------
export interface Person {
  id: string;
  name: string;
  document?: string;
  type: 'RESIDENT' | 'EMPLOYEE' | 'VISITOR' | 'WATCHLIST' | 'UNKNOWN';
  status: 'ACTIVE' | 'INACTIVE' | 'BLOCKED';
  photoUrls: string[];
  consentStatus: 'GRANTED' | 'REVOKED' | 'NOT_REQUIRED' | 'PENDING';
  retentionUntil?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FaceEmbedding {
  id: string;
  personId: string;
  embeddingVector: number[];
  modelVersion: string; // e.g. 'ArcFace-r100-v2'
  qualityScore: number;
  createdAt: string;
}

export interface FaceDetection {
  id: string;
  cameraId: string;
  cameraName: string;
  personId?: string;
  personName?: string;
  similarity?: number;
  qualityScore: number;
  boundingBox: { x: number; y: number; width: number; height: number };
  snapshotUrl: string;
  faceCropUrl: string;
  timestamp: string;
  isWatchlistAlert: boolean;
  decision: 'MATCH' | 'NO_MATCH' | 'LOW_QUALITY' | 'MANUAL_REVIEW';
  location?: string;
}

export interface FaceSettings {
  minFaceSizePx: number;
  minSimilarityThreshold: number; // 0 to 100
  qualityFilterMinScore: number;
  enableWatchlistAlerts: boolean;
  autoPurgeDays: number;
  preferredDetector: 'SCRFD' | 'RetinaFace' | 'YOLO-Face';
  preferredEmbedder: 'ArcFace' | 'InsightFace' | 'Facenet';
  vectorEngine: 'pgvector' | 'Qdrant' | 'Milvus' | 'FAISS';
}

// ----------------------------------------------------------------------
// Central AI Engine, GPU & Worker Types
// ----------------------------------------------------------------------
export interface AIWorkerJob {
  id: string;
  workerName: string;
  type: 'LPR_WORKER' | 'FACIAL_WORKER' | 'EVENT_WORKER' | 'RECORDING_WORKER';
  status: 'RUNNING' | 'IDLE' | 'PAUSED' | 'ERROR';
  gpuDeviceId: number;
  currentFps: number;
  processedFrames: number;
  droppedFrames: number;
  latencyMs: number;
  vramUsedMB: number;
  queueLagMs: number;
  activeCamerasCount: number;
  lastHeartbeat: string;
}

export interface GPUMetrics {
  gpuName: string;
  driverVersion: string;
  cudaVersion: string;
  utilizationGpuPct: number;
  utilizationMemoryPct: number;
  vramTotalMB: number;
  vramUsedMB: number;
  vramFreeMB: number;
  temperatureC: number;
  powerUsageW: number;
  powerLimitW: number;
  activeCudaCores: number;
  tensorCoresActive: boolean;
}

export interface CameraAISettings {
  cameraId: string;
  cameraName: string;
  lprEnabled: boolean;
  facialEnabled: boolean;
  inferenceFps: number; // e.g. 15 or 30 FPS
  minPlateConfidence: number;
  minFaceSimilarity: number;
  deduplicationWindowSec: number;
  retentionPolicyDays: number;
  processingMode: 'CENTRAL_GPU' | 'EDGE_JETSON' | 'HYBRID_SYNC';
  webhooksEnabled: boolean;
}

// ----------------------------------------------------------------------
// LGPD Audit & Compliance
// ----------------------------------------------------------------------
export interface LGPDAuditLog {
  id: string;
  operatorId: string;
  operatorName: string;
  operatorRole: string;
  action: 'SEARCH' | 'VIEW_BIOMETRIC' | 'EXPORT_EVIDENCE' | 'PURGE_DATA' | 'CONSENT_CHANGE' | 'PLATE_MASK_TOGGLE';
  targetType: 'PERSON_FACE' | 'LPR_PLATE' | 'AUDIT_EXPORT' | 'CONSENT_RECORD';
  targetId?: string;
  targetDetails: string;
  justificationLegalBasis: 'SEGURANCA_PUBLICA' | 'CONSENTIMENTO' | 'LEGITIMO_INTERESSE' | 'CUMPRIMENTO_OBRIGACAO_LEGAL';
  ipAddress: string;
  timestamp: string;
}

// ----------------------------------------------------------------------
// Architecture & Edge Topology Config
// ----------------------------------------------------------------------
export interface ArchitectureConfig {
  primaryTopology: 'CENTRAL_GPU' | 'HYBRID_RESILIENT' | 'DISTRIBUTED_EDGE';
  centralMediaMtxUrl: string;
  ffmpegPreset: 'ultrafast' | 'medium' | 'gpu_nvenc';
  gstreamerEnabled: boolean;
  onvifAutoDiscovery: boolean;
  redisQueueUrl: string;
  postgresVectorUrl: string;
  minioStorageUrl: string;
  edgeNodesCount: number;
  edgeSyncIntervalSec: number;
  offlineCacheEnabled: boolean;
}

export interface StreamInfo {
  cameraId: string;
  cameraName: string;
  rtspUrl: string;
  hlsUrl: string;
  webrtcUrl: string;
  status: 'ONLINE' | 'OFFLINE' | 'DEGRADED';
  bitrateKbps: number;
  codecs: string; // e.g. "H.264 / AAC"
  ingestGateway: 'MediaMTX-Fiber' | 'FFmpeg-NVENC' | 'GStreamer-DeepStream' | 'ONVIF-Direct';
}

