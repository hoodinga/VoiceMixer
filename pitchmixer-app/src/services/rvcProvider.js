/**
 * RVC API 제공자 (Provider-Agnostic Layer)
 * 
 * 이 레이어는 실제 RVC API 구현을 추상화합니다.
 * 모델이나 제공자가 변경되면 이 파일만 수정하면 됩니다.
 */

import { Client } from '@gradio/client';
import { API_CONFIG } from '../config/apiConfig';

/**
 * RVC 제공자 기본 클래스 (인터페이스 역할)
 */
class RVCProvider {
    async initialize() {
        throw new Error('initialize() must be implemented');
    }

    async convertVoice(audioFile, options) {
        throw new Error('convertVoice() must be implemented');
    }

    async getAvailableModels() {
        throw new Error('getAvailableModels() must be implemented');
    }
}

/**
 * Hugging Face Gradio 기반 RVC 제공자
 */
export class HuggingFaceGradioProvider extends RVCProvider {
    constructor() {
        super();
        this.spaceUrl = API_CONFIG.RVC_SPACE_URL;
        this.fallbackSpaces = API_CONFIG.FALLBACK_SPACES;
        this.client = null;
        this.isInitialized = false;
        this.currentSpaceIndex = 0;
        this.currentSpaceName = '';
    }

    /**
     * Gradio 클라이언트 초기화
     */
    async initialize() {
        if (this.isInitialized) return;

        const allSpaces = [this.spaceUrl, ...this.fallbackSpaces];

        for (let i = 0; i < allSpaces.length; i++) {
            try {
                console.log(`🔌 RVC Space 연결 시도: ${allSpaces[i]}`);
                this.client = await Client.connect(allSpaces[i]);
                this.currentSpaceIndex = i;
                this.currentSpaceName = allSpaces[i];
                this.isInitialized = true;
                console.log(`✅ RVC 클라이언트 초기화 완료: ${allSpaces[i]}`);
                return;
            } catch (error) {
                console.warn(`⚠️ Space 연결 실패 (${allSpaces[i]}):`, error.message);
                if (i === allSpaces.length - 1) {
                    throw new Error(`모든 RVC Space 연결 실패. 인터넷 연결을 확인해주세요.`);
                }
            }
        }
    }

    /**
     * Space별 API 엔드포인트 및 파라미터 가져오기
     */
    getSpaceConfig() {
        // 각 Space별 API 구조 정의
        const configs = {
            'Clebersla/RVC_V2_Huggingface_Version': {
                endpoint: '/run',
                buildParams: (file, params) => ({
                    audio_path: file,
                    pitch: params.pitch,
                    index_rate: params.indexRate,
                    filter_radius: params.filterRadius,
                    rms_mix_rate: params.rmsMixRate,
                    protect: params.protect
                })
            },
            'r3gm/rvc_zero': {
                // API endpoint: /run (dependency id: 4)
                // 13 parameters required based on Space config
                endpoint: '/run',
                buildParams: (file, params) => ([
                    [file],                         // audio_files (id: 17) - array of files
                    params.modelFile || null,       // file_m (id: 28) - model file (.pth)
                    "rmvpe+",                       // pitch_alg (id: 31) - pitch algorithm
                    params.pitch,                   // pitch_lvl (id: 32) - pitch level (-24 to 24)
                    params.indexFile || null,       // file_index (id: 29) - index file (.index)
                    params.indexRate,               // index_inf (id: 33) - index influence (0-1)
                    params.filterRadius,            // r_m_f (id: 34) - respiration median filtering (0-7)
                    params.rmsMixRate,              // e_r (id: 35) - envelope ratio (0-1)
                    params.protect,                 // c_b_p (id: 36) - consonant breath protection (0-0.5)
                    false,                          // denoise (id: 42)
                    false,                          // reverb (id: 43)
                    "wav",                          // format (id: 38) - output format
                    1                               // steps (id: 37)
                ]),
                useArray: true  // Flag to indicate this uses array-style params
            },
            'r3gm/RVC_HFv2': {
                endpoint: '/run_inference',
                buildParams: (file, params) => ({
                    audio: file,
                    f0_change: params.pitch,
                    f0_method: "rmvpe",
                    index_rate: params.indexRate,
                    protect: params.protect
                })
            }
        };

        return configs[this.currentSpaceName] || configs['r3gm/rvc_zero'];
    }

    /**
     * 음성 변환 실행
     * @param {File} audioFile - 입력 오디오 파일
     * @param {Object} options - 변환 옵션
     * @returns {Promise<Blob>} 변환된 오디오 Blob
     */
    async convertVoice(audioFile, options = {}) {
        await this.initialize();

        const params = {
            ...API_CONFIG.DEFAULT_RVC_PARAMS,
            ...options
        };

        const { maxRetries, retryDelay } = API_CONFIG.REQUEST_CONFIG;
        const spaceConfig = this.getSpaceConfig();

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`🎤 RVC 변환 시도 ${attempt}/${maxRetries}... (${this.currentSpaceName})`);
                console.log(`📡 엔드포인트: ${spaceConfig.endpoint}`);

                const apiParams = spaceConfig.buildParams(audioFile, params);

                // 배열 스타일 vs 객체 스타일 파라미터
                if (spaceConfig.useArray) {
                    console.log('📦 API 파라미터 (배열):', apiParams.length, '개');
                } else {
                    console.log('📦 API 파라미터:', Object.keys(apiParams));
                }

                const result = await this.client.predict(spaceConfig.endpoint, apiParams);

                // 결과에서 오디오 URL 추출 (여러 형식 지원)
                let audioUrl = null;
                if (result.data) {
                    // 배열인 경우
                    if (Array.isArray(result.data)) {
                        audioUrl = result.data[0]?.url || result.data[0];
                    } else if (typeof result.data === 'object') {
                        audioUrl = result.data.url || result.data;
                    } else {
                        audioUrl = result.data;
                    }
                }

                console.log('📥 결과:', result);

                if (!audioUrl) {
                    throw new Error('변환 결과가 비어있습니다.');
                }

                // URL이 객체인 경우 url 속성 추출
                if (typeof audioUrl === 'object' && audioUrl.url) {
                    audioUrl = audioUrl.url;
                }

                // URL에서 오디오 데이터 다운로드
                const response = await fetch(audioUrl);
                if (!response.ok) {
                    throw new Error(`오디오 다운로드 실패: ${response.status}`);
                }

                const audioBlob = await response.blob();
                console.log('✅ RVC 변환 완료');
                return audioBlob;

            } catch (error) {
                console.error(`❌ 변환 시도 ${attempt} 실패:`, error.message);

                if (attempt === maxRetries) {
                    throw new Error(`RVC 변환 실패 (${maxRetries}회 시도 후): ${error.message}`);
                }

                // 재시도 전 대기
                console.log(`⏳ ${retryDelay / 1000}초 후 재시도...`);
                await this.delay(retryDelay);
            }
        }
    }

    /**
     * 사용 가능한 모델 목록 조회
     */
    async getAvailableModels() {
        await this.initialize();

        try {
            const result = await this.client.predict('/get_models', {});
            return result.data || ['default_model'];
        } catch (error) {
            console.warn('모델 목록 조회 실패:', error);
            return ['default_model'];
        }
    }

    /**
     * 지연 함수
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

/**
 * API 최적화 관리자
 * 요청 큐잉 및 재시도 로직 관리
 */
export class APIOptimizer {
    constructor() {
        this.queue = [];
        this.isProcessing = false;
        this.config = API_CONFIG.REQUEST_CONFIG;
    }

    /**
     * API 호출을 큐에 추가
     */
    async enqueue(apiCall, onProgress) {
        return new Promise((resolve, reject) => {
            this.queue.push({
                apiCall,
                resolve,
                reject,
                retries: 0,
                onProgress
            });
            this.processQueue();
        });
    }

    /**
     * 큐 처리
     */
    async processQueue() {
        if (this.isProcessing || this.queue.length === 0) return;

        this.isProcessing = true;
        const item = this.queue.shift();

        try {
            const result = await item.apiCall();
            item.resolve(result);
        } catch (error) {
            if (item.retries < this.config.maxRetries) {
                item.retries++;
                console.warn(`재시도 ${item.retries}/${this.config.maxRetries}...`);

                await this.delay(this.config.retryDelay);
                this.queue.unshift(item);
            } else {
                item.reject(error);
            }
        } finally {
            this.isProcessing = false;

            if (this.queue.length > 0) {
                await this.delay(this.config.requestDelay);
                this.processQueue();
            }
        }
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// 싱글톤 인스턴스 내보내기
export const rvcProvider = new HuggingFaceGradioProvider();
export const apiOptimizer = new APIOptimizer();
