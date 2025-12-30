/**
 * 보이스 멜로디 믹서 엔진
 * 보이스를 음악의 멜로디에 맞춰 피치 시프트 + 반복
 */

import { loadAudioFile, extractMelody, calculatePitchShift } from './MusicAnalyzer';
import { psolaPitchShift } from './PitchShifter';

/**
 * VoiceMelodyMixer 클래스
 * 보이스 샘플을 음악 멜로디에 맞춰 피치 조정하며 반복
 */
export class VoiceMelodyMixer {
    constructor() {
        this.audioContext = null;
    }

    /**
     * AudioContext 초기화
     */
    getAudioContext() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        return this.audioContext;
    }

    /**
     * 보이스를 음악 멜로디에 맞춰 변환
     * @param {File} musicFile - 음악 파일 (멜로디 추출용)
     * @param {File} voiceFile - 보이스 파일 (변환할 음성)
     * @param {Function} onProgress - 진행 상황 콜백
     * @param {Object} options - 옵션 { musicVolume, voiceVolume }
     * @returns {Promise<Blob>} 변환된 오디오
     */
    async transform(musicFile, voiceFile, onProgress = () => { }, options = {}) {
        const audioContext = this.getAudioContext();
        const { musicVolume = 0.3, voiceVolume = 1.0 } = options;

        try {
            // 1단계: 음악 분석 - 멜로디 추출
            onProgress({ step: '🎼 음악 멜로디 분석 중...', percent: 10 });
            const musicBuffer = await loadAudioFile(musicFile);

            // 음악이 너무 길면 자를까요? 일단은 그대로 둡니다.

            const melody = extractMelody(musicBuffer, {
                hopSize: 1024,  // 더 상세한 분석
                minFrequency: 80,
                maxFrequency: 800
            });

            if (melody.length === 0) {
                throw new Error('멜로디를 추출할 수 없습니다. 다른 음악 파일을 시도해주세요.');
            }

            console.log(`🎼 멜로디 추출 완료: ${melody.length}개 피치 포인트`);

            // 2단계: 보이스 로드
            onProgress({ step: '🎤 보이스 샘플 로딩 중...', percent: 20 });
            const voiceBuffer = await loadAudioFile(voiceFile);

            // 모노로 변환
            const voiceSamples = this.bufferToMono(voiceBuffer);
            const sampleRate = voiceBuffer.sampleRate;
            const voiceDuration = voiceBuffer.duration;
            const musicDuration = musicBuffer.duration;

            console.log(`🎤 보이스: ${voiceDuration.toFixed(2)}초, 음악: ${musicDuration.toFixed(2)}초`);

            // 3단계: 보이스 기본 피치 추정
            onProgress({ step: '🔬 보이스 피치 분석 중...', percent: 30 });
            const voiceMelody = extractMelody(voiceBuffer, {
                hopSize: 2048,
                minFrequency: 80,
                maxFrequency: 500
            });

            const voiceBasePitch = this.calculateMedianPitch(voiceMelody) || 200;
            console.log(`🎤 보이스 기본 피치: ${voiceBasePitch.toFixed(1)}Hz`);

            // 4단계: 세그먼트별 피치 시프트 및 조합
            onProgress({ step: '🎵 멜로디에 맞춰 변환 중...', percent: 40 });

            // 출력 버퍼 (음악 길이만큼)
            const outputLength = Math.floor(musicDuration * sampleRate);
            const outputSamples = new Float32Array(outputLength);

            // 세그먼트 크기 (100ms 단위로 피치 변경)
            const segmentDuration = 0.1; // 100ms
            const segmentSamples = Math.floor(segmentDuration * sampleRate);
            const numSegments = Math.ceil(musicDuration / segmentDuration);

            // 보이스 현재 위치 (루프용)
            let voicePosition = 0;

            for (let i = 0; i < numSegments; i++) {
                // 진행률 업데이트
                if (i % 20 === 0) {
                    const percent = 40 + Math.floor((i / numSegments) * 50);
                    onProgress({ step: `🎵 변환 중... (${Math.floor(i / numSegments * 100)}%)`, percent });
                }

                const segmentStart = i * segmentSamples;
                const segmentEnd = Math.min(segmentStart + segmentSamples, outputLength);
                const currentTime = i * segmentDuration;

                // 현재 시간의 멜로디 피치 찾기
                const targetPitch = this.getMelodyPitchAt(melody, currentTime);

                if (targetPitch === 0) {
                    // 피치가 없으면 (무음) 건너뛰기
                    continue;
                }

                // 피치 시프트 계산 (세미톤)
                const semitones = calculatePitchShift(voiceBasePitch, targetPitch);

                // 보이스에서 현재 세그먼트 추출 (루프)
                const voiceSegment = this.extractVoiceSegment(
                    voiceSamples,
                    voicePosition,
                    segmentSamples
                );

                // 피치 시프트 적용
                const shiftedSegment = psolaPitchShift(voiceSegment, semitones, sampleRate);

                // 출력에 추가 (크로스페이드)
                this.mixSegmentWithCrossfade(
                    outputSamples,
                    shiftedSegment,
                    segmentStart,
                    segmentEnd - segmentStart
                );

                // 보이스 위치 업데이트 (루프)
                voicePosition = (voicePosition + segmentSamples) % voiceSamples.length;
            }

            // 5단계: 최종 믹싱 (음악 + 보이스)
            onProgress({ step: '✨ 최종 믹싱 중...', percent: 90 });

            // 음악 채널 수에 맞춰 최종 출력 버퍼 생성
            const numChannels = musicBuffer.numberOfChannels;
            const finalBuffer = audioContext.createBuffer(numChannels, outputLength, sampleRate);

            for (let channel = 0; channel < numChannels; channel++) {
                const musicData = musicBuffer.getChannelData(channel);
                const outputData = finalBuffer.getChannelData(channel);

                // 음악(배경) + 변환된 보이스(전경) 믹싱

                for (let i = 0; i < outputLength; i++) {
                    const musicSample = i < musicData.length ? musicData[i] : 0;
                    const voiceSample = outputSamples[i]; // 모노 보이스를 각 채널에 동일하게 믹스

                    // 볼륨 적용하여 합산
                    outputData[i] = (musicSample * musicVolume) + (voiceSample * voiceVolume);
                }

                // 채널별 정규화 (클리핑 방지)
                this.normalizeAudio(outputData);
            }

            // 6단계: AudioBuffer → Blob 변환 (WAV)
            const resultBlob = this.audioBufferToWav(finalBuffer);

            onProgress({ step: '✅ 변환 완료!', percent: 100 });
            return resultBlob;

        } catch (error) {
            console.error('VoiceMelodyMixer 오류:', error);
            throw error;
        }
    }

    /**
     * AudioBuffer를 모노 Float32Array로 변환
     */
    bufferToMono(audioBuffer) {
        const length = audioBuffer.length;
        const mono = new Float32Array(length);

        if (audioBuffer.numberOfChannels === 1) {
            audioBuffer.copyFromChannel(mono, 0);
        } else {
            const left = audioBuffer.getChannelData(0);
            const right = audioBuffer.getChannelData(1);
            for (let i = 0; i < length; i++) {
                mono[i] = (left[i] + right[i]) / 2;
            }
        }

        return mono;
    }

    /**
     * 멜로디 배열에서 특정 시간의 피치 찾기
     */
    getMelodyPitchAt(melody, time) {
        // 가장 가까운 멜로디 포인트 찾기
        let closest = melody[0];
        let minDiff = Infinity;

        for (const point of melody) {
            const diff = Math.abs(point.time - time);
            if (diff < minDiff) {
                minDiff = diff;
                closest = point;
            }
            if (point.time > time + 0.2) break; // 최적화
        }

        return closest?.pitch || 0;
    }

    /**
     * 보이스에서 세그먼트 추출 (루프 지원)
     */
    extractVoiceSegment(voiceSamples, startPos, length) {
        const segment = new Float32Array(length);
        const voiceLength = voiceSamples.length;

        for (let i = 0; i < length; i++) {
            const pos = (startPos + i) % voiceLength;
            segment[i] = voiceSamples[pos];
        }

        return segment;
    }

    /**
     * 세그먼트를 출력에 믹스 (크로스페이드)
     */
    mixSegmentWithCrossfade(output, segment, startPos, length) {
        const fadeLength = Math.min(256, length / 4);

        for (let i = 0; i < length && startPos + i < output.length; i++) {
            // 페이드 인/아웃 계수
            let fadeFactor = 1;
            if (i < fadeLength) {
                fadeFactor = i / fadeLength;
            } else if (i > length - fadeLength) {
                fadeFactor = (length - i) / fadeLength;
            }

            const sampleIndex = Math.min(i, segment.length - 1);
            output[startPos + i] += segment[sampleIndex] * fadeFactor;
        }
    }

    /**
     * 멜로디의 중앙값 피치 계산
     */
    calculateMedianPitch(melody) {
        if (melody.length === 0) return 200;

        const pitches = melody
            .filter(m => m.pitch > 0 && m.confidence > 0.01)
            .map(m => m.pitch)
            .sort((a, b) => a - b);

        if (pitches.length === 0) return 200;

        const mid = Math.floor(pitches.length / 2);
        return pitches[mid];
    }

    /**
     * 오디오 정규화
     */
    normalizeAudio(samples) {
        let maxAbs = 0;
        for (let i = 0; i < samples.length; i++) {
            maxAbs = Math.max(maxAbs, Math.abs(samples[i]));
        }

        if (maxAbs > 0.001) {
            const normalizeRatio = 0.9 / maxAbs;
            for (let i = 0; i < samples.length; i++) {
                samples[i] *= normalizeRatio;
            }
        }
    }

    /**
     * AudioBuffer를 WAV Blob으로 변환
     */
    audioBufferToWav(audioBuffer) {
        const numChannels = audioBuffer.numberOfChannels;
        const sampleRate = audioBuffer.sampleRate;
        const format = 1; // PCM
        const bitDepth = 16;

        const bytesPerSample = bitDepth / 8;
        const blockAlign = numChannels * bytesPerSample;

        const length = audioBuffer.length;
        const dataLength = length * numChannels * bytesPerSample; // 채널 수 반영
        const buffer = new ArrayBuffer(44 + dataLength);
        const view = new DataView(buffer);

        const writeString = (offset, string) => {
            for (let i = 0; i < string.length; i++) {
                view.setUint8(offset + i, string.charCodeAt(i));
            }
        };

        // WAV 헤더
        writeString(0, 'RIFF');
        view.setUint32(4, 36 + dataLength, true);
        writeString(8, 'WAVE');
        writeString(12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, format, true);
        view.setUint16(22, numChannels, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * blockAlign, true);
        view.setUint16(32, blockAlign, true);
        view.setUint16(34, bitDepth, true);
        writeString(36, 'data');
        view.setUint32(40, dataLength, true);

        // 오디오 데이터 (인터리빙)
        const channels = [];
        for (let i = 0; i < numChannels; i++) {
            channels.push(audioBuffer.getChannelData(i));
        }

        let offset = 44;
        for (let i = 0; i < length; i++) {
            for (let ch = 0; ch < numChannels; ch++) {
                const sample = Math.max(-1, Math.min(1, channels[ch][i]));
                view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
                offset += 2;
            }
        }

        return new Blob([buffer], { type: 'audio/wav' });
    }
}

// 싱글톤 인스턴스
export const voiceMelodyMixer = new VoiceMelodyMixer();

// 호환성을 위한 별칭
export const voiceTransformer = voiceMelodyMixer;
