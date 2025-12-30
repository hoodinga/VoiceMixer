/**
 * 음악 분석 엔진
 * Web Audio API 기반 피치 감지 (Essentia.js 대신 자체 구현)
 */

/**
 * 오디오 파일을 AudioBuffer로 로드
 * @param {File} file - 오디오 파일
 * @returns {Promise<AudioBuffer>}
 */
export async function loadAudioFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = async (e) => {
            try {
                const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                const arrayBuffer = e.target.result;
                const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
                audioContext.close();
                resolve(audioBuffer);
            } catch (error) {
                reject(new Error(`오디오 디코딩 실패: ${error.message}`));
            }
        };

        reader.onerror = () => reject(new Error('파일 읽기 실패'));
        reader.readAsArrayBuffer(file);
    });
}

/**
 * AudioBuffer를 모노로 변환
 * @param {AudioBuffer} audioBuffer
 * @returns {Float32Array}
 */
export function convertToMono(audioBuffer) {
    const channels = audioBuffer.numberOfChannels;
    const length = audioBuffer.length;

    if (channels === 1) {
        return audioBuffer.getChannelData(0);
    }

    const mono = new Float32Array(length);

    for (let i = 0; i < length; i++) {
        let sum = 0;
        for (let ch = 0; ch < channels; ch++) {
            sum += audioBuffer.getChannelData(ch)[i];
        }
        mono[i] = sum / channels;
    }

    return mono;
}

/**
 * 간단한 피치 감지 (자동상관 알고리즘)
 * @param {Float32Array} buffer - 오디오 샘플
 * @param {number} sampleRate - 샘플레이트
 * @returns {number} 감지된 주파수 (Hz)
 */
function detectPitch(buffer, sampleRate) {
    const SIZE = buffer.length;
    const MAX_SAMPLES = Math.floor(SIZE / 2);
    let bestOffset = -1;
    let bestCorrelation = 0;
    let foundGoodCorrelation = false;

    // 자동상관 계산
    for (let offset = 20; offset < MAX_SAMPLES; offset++) {
        let correlation = 0;

        for (let i = 0; i < MAX_SAMPLES; i++) {
            correlation += Math.abs(buffer[i] - buffer[i + offset]);
        }

        correlation = 1 - (correlation / MAX_SAMPLES);

        if (correlation > 0.9 && correlation > bestCorrelation) {
            bestCorrelation = correlation;
            bestOffset = offset;
            foundGoodCorrelation = true;
        } else if (foundGoodCorrelation) {
            break;
        }
    }

    if (bestOffset === -1) {
        return -1; // 피치 감지 실패
    }

    return sampleRate / bestOffset;
}

/**
 * 멜로디 추출 (시간별 피치 데이터)
 * @param {AudioBuffer} audioBuffer
 * @param {Object} options
 * @returns {Array<{time: number, pitch: number, confidence: number}>}
 */
export function extractMelody(audioBuffer, options = {}) {
    const {
        frameSize = 2048,
        hopSize = 512,
        minFrequency = 80,
        maxFrequency = 2000
    } = options;

    const monoData = convertToMono(audioBuffer);
    const sampleRate = audioBuffer.sampleRate;
    const melody = [];

    const numFrames = Math.floor((monoData.length - frameSize) / hopSize);

    for (let i = 0; i < numFrames; i++) {
        const start = i * hopSize;
        const frame = monoData.slice(start, start + frameSize);

        // RMS (볼륨) 계산
        let rms = 0;
        for (let j = 0; j < frame.length; j++) {
            rms += frame[j] * frame[j];
        }
        rms = Math.sqrt(rms / frame.length);

        // 볼륨이 너무 낮으면 스킵
        if (rms < 0.01) continue;

        const pitch = detectPitch(frame, sampleRate);

        if (pitch > minFrequency && pitch < maxFrequency) {
            melody.push({
                time: start / sampleRate,
                pitch: pitch,
                confidence: rms
            });
        }
    }

    console.log(`🎼 멜로디 추출 완료: ${melody.length}개 음표 감지`);
    return melody;
}

/**
 * 피치 시프트 계산 (세미톤 단위)
 * @param {number} fromPitch - 원본 피치 (Hz)
 * @param {number} toPitch - 목표 피치 (Hz)
 * @returns {number} 세미톤 차이
 */
export function calculatePitchShift(fromPitch, toPitch) {
    const ratio = toPitch / fromPitch;
    const semitones = 12 * Math.log2(ratio);
    return Math.round(Math.min(12, Math.max(-12, semitones)));
}

/**
 * Hz를 음계 이름으로 변환
 * @param {number} frequency
 * @returns {string}
 */
export function frequencyToNote(frequency) {
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const A4 = 440;
    const C0 = A4 * Math.pow(2, -4.75);

    if (frequency < 20) return '-';

    const halfSteps = Math.round(12 * Math.log2(frequency / C0));
    const octave = Math.floor(halfSteps / 12);
    const noteIndex = halfSteps % 12;

    return notes[noteIndex] + octave;
}
