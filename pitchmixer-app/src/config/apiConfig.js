/**
 * PitchMixer API 설정
 * 모델이나 API 제공자가 변경될 경우 이 파일만 수정하면 됩니다.
 */

export const API_CONFIG = {
  // Hugging Face RVC Space URL
  RVC_SPACE_URL: 'Clebersla/RVC_V2_Huggingface_Version',
  
  // 대안 Space URLs (백업용)
  FALLBACK_SPACES: [
    'r3gm/rvc_zero',
    'r3gm/RVC_HFv2'
  ],
  
  // 기본 RVC 파라미터
  DEFAULT_RVC_PARAMS: {
    pitch: 0,           // 피치 조정 (-12 ~ +12 세미톤)
    indexRate: 0.5,     // 인덱스 영향도 (0 ~ 1)
    filterRadius: 3,    // 중앙값 필터 (0 ~ 7)
    rmsMixRate: 0.25,   // 볼륨 믹싱 (0 ~ 1)
    protect: 0.33       // 무성음 보호 (0 ~ 0.5)
  },
  
  // API 요청 설정
  REQUEST_CONFIG: {
    maxRetries: 3,              // 최대 재시도 횟수
    retryDelay: 2000,           // 재시도 간격 (ms)
    requestDelay: 1000,         // 요청 간 대기 시간 (ms)
    timeout: 300000             // 타임아웃 (5분)
  }
};

// 지원되는 오디오 포맷
export const SUPPORTED_AUDIO_FORMATS = [
  'audio/mp3',
  'audio/mpeg',
  'audio/wav',
  'audio/x-wav',
  'audio/ogg',
  'audio/webm',
  'audio/flac'
];

// 파일 크기 제한 (MB)
export const MAX_FILE_SIZE = {
  MUSIC: 50,    // 음악 파일 최대 50MB
  VOICE: 10     // 보이스 파일 최대 10MB
};
