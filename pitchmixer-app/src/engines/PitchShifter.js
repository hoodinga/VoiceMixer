/**
 * 피치 시프터 엔진 (Soundtouch.js 기반)
 * 고품질 피치 시프팅 - 포먼트 보존
 */

import { PitchShifter } from 'soundtouchjs';

/**
 * 오디오 버퍼를 특정 세미톤만큼 피치 시프트
 * @param {AudioBuffer} audioBuffer - 원본 오디오
 * @param {number} semitones - 피치 변경량 (세미톤, -12 ~ +12)
 * @param {AudioContext} audioContext - AudioContext
 * @returns {Promise<AudioBuffer>} 피치 시프트된 오디오
 */
export async function pitchShift(audioBuffer, semitones, audioContext) {
    if (semitones === 0) {
        return audioBuffer; // 변경 없음
    }

    // 피치 비율 계산 (세미톤 → 비율)
    const pitchRatio = Math.pow(2, semitones / 12);

    return new Promise((resolve, reject) => {
        try {
            const sampleRate = audioBuffer.sampleRate;
            const numChannels = audioBuffer.numberOfChannels;
            const length = audioBuffer.length;

            // 모노로 변환 (Soundtouch는 모노 처리)
            const monoData = new Float32Array(length);
            if (numChannels === 1) {
                audioBuffer.copyFromChannel(monoData, 0);
            } else {
                const left = audioBuffer.getChannelData(0);
                const right = audioBuffer.getChannelData(1);
                for (let i = 0; i < length; i++) {
                    monoData[i] = (left[i] + right[i]) / 2;
                }
            }

            // Soundtouch 피치 시프터 생성
            const shifter = new PitchShifter(audioContext, monoData, 4096);
            shifter.pitch = pitchRatio;

            // 결과 수집
            const outputChunks = [];

            shifter.on('sourceposition', (pos) => {
                // 진행 상황 (필요시 사용)
            });

            // 오프라인 렌더링
            const offlineContext = new OfflineAudioContext(1, length, sampleRate);
            const source = offlineContext.createBufferSource();

            // 원본 버퍼 생성
            const sourceBuffer = offlineContext.createBuffer(1, length, sampleRate);
            sourceBuffer.copyToChannel(monoData, 0);
            source.buffer = sourceBuffer;

            // Soundtouch 노드 연결
            const scriptNode = offlineContext.createScriptProcessor(4096, 1, 1);

            let inputPosition = 0;
            const outputData = new Float32Array(length);
            let outputPosition = 0;

            scriptNode.onaudioprocess = (e) => {
                const inputBuffer = e.inputBuffer.getChannelData(0);
                const outputBuffer = e.outputBuffer.getChannelData(0);

                // Soundtouch로 피치 시프트 처리
                for (let i = 0; i < inputBuffer.length && inputPosition < length; i++) {
                    shifter.putSample(monoData[inputPosition++]);
                }

                // 출력 가져오기
                const samples = shifter.extract(outputBuffer.length);
                for (let i = 0; i < samples.length && outputPosition < length; i++) {
                    outputData[outputPosition++] = samples[i];
                }

                // 출력 버퍼에 복사
                outputBuffer.set(outputData.slice(outputPosition - outputBuffer.length, outputPosition));
            };

            source.connect(scriptNode);
            scriptNode.connect(offlineContext.destination);
            source.start();

            offlineContext.startRendering().then((renderedBuffer) => {
                resolve(renderedBuffer);
            }).catch(reject);

        } catch (error) {
            reject(error);
        }
    });
}

/**
 * 간단한 피치 시프트 (Web Audio API 기반)
 * Soundtouch가 실패할 경우 폴백
 * @param {Float32Array} samples - 오디오 샘플
 * @param {number} semitones - 피치 변경량
 * @param {number} sampleRate - 샘플레이트
 * @returns {Float32Array} 피치 시프트된 샘플
 */
export function simplePitchShift(samples, semitones, sampleRate) {
    if (semitones === 0) return samples;

    const pitchRatio = Math.pow(2, semitones / 12);
    const newLength = Math.floor(samples.length / pitchRatio);
    const output = new Float32Array(newLength);

    // 선형 보간으로 리샘플링
    for (let i = 0; i < newLength; i++) {
        const srcIndex = i * pitchRatio;
        const index1 = Math.floor(srcIndex);
        const index2 = Math.min(index1 + 1, samples.length - 1);
        const frac = srcIndex - index1;

        output[i] = samples[index1] * (1 - frac) + samples[index2] * frac;
    }

    return output;
}

/**
 * PSOLA 기반 피치 시프트 (고품질)
 * @param {Float32Array} samples - 오디오 샘플
 * @param {number} semitones - 피치 변경량
 * @param {number} sampleRate - 샘플레이트
 * @returns {Float32Array} 피치 시프트된 샘플
 */
export function psolaPitchShift(samples, semitones, sampleRate) {
    if (Math.abs(semitones) < 0.01) return samples;

    const pitchFactor = Math.pow(2, semitones / 12);
    const frameSize = 2048;
    const hopSize = 512;
    const outputHop = Math.round(hopSize / pitchFactor);

    // 윈도우 함수 (Hanning)
    const window = new Float32Array(frameSize);
    for (let i = 0; i < frameSize; i++) {
        window[i] = 0.5 * (1 - Math.cos(2 * Math.PI * i / (frameSize - 1)));
    }

    // 출력 길이 계산
    const numFrames = Math.floor((samples.length - frameSize) / hopSize) + 1;
    const outputLength = (numFrames - 1) * outputHop + frameSize;
    const output = new Float32Array(outputLength);
    const windowSum = new Float32Array(outputLength);

    // 오버랩-애드 처리
    for (let frame = 0; frame < numFrames; frame++) {
        const inputStart = frame * hopSize;
        const outputStart = frame * outputHop;

        for (let i = 0; i < frameSize && inputStart + i < samples.length; i++) {
            const sample = samples[inputStart + i] * window[i];
            if (outputStart + i < outputLength) {
                output[outputStart + i] += sample;
                windowSum[outputStart + i] += window[i];
            }
        }
    }

    // 정규화
    for (let i = 0; i < outputLength; i++) {
        if (windowSum[i] > 0.001) {
            output[i] /= windowSum[i];
        }
    }

    // 원본 길이에 맞춰 리샘플링
    const finalOutput = new Float32Array(samples.length);
    const ratio = outputLength / samples.length;

    for (let i = 0; i < samples.length; i++) {
        const srcIndex = i * ratio;
        const index1 = Math.floor(srcIndex);
        const index2 = Math.min(index1 + 1, outputLength - 1);
        const frac = srcIndex - index1;

        finalOutput[i] = output[index1] * (1 - frac) + output[index2] * frac;
    }

    return finalOutput;
}
