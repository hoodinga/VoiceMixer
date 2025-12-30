# PitchMixer with RVC - 완전 무료 개발 계획서
## Antigravity + Hugging Face Spaces 기반 구현

---

## 🎯 프로젝트 개요

### 프로젝트명: **PitchMixer** 🎵
음악 파일과 보이스 샘플을 업로드하면, RVC AI가 보이스를 음악의 멜로디에 완벽하게 맞춰 변환하는 웹 애플리케이션

### 핵심 기능
1. 🎼 음악 파일 업로드 (MP3, WAV 등)
2. 🎤 보이스 샘플 업로드 (사용자 목소리)
3. 🤖 **RVC AI로 자동 피치 매칭** 
4. 🔁 보이스가 짧으면 자동 반복
5. ▶️ 결과 재생 및 다운로드

### 왜 RVC인가?
- ✅ **완전 무료** (오픈소스)
- ✅ **자동 피치 보존**: 수동 피치 분석 불필요
- ✅ **고품질 음질**: 원본 음색 유지
- ✅ **Hugging Face Spaces에서 무료 호스팅 가능**
- ✅ **실시간 처리 가능** (지연시간 90-170ms)

---

## 🏗 시스템 아키텍처

### 전체 구조도

```
┌─────────────────────────────────────────────────────────┐
│                   Antigravity Frontend                   │
│                    (React + Tailwind)                    │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│              Hugging Face Spaces API                     │
│         (RVC V2 - 무료 음성 변환 서비스)                │
│   https://huggingface.co/spaces/Clebersla/RVC_V2...     │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│                   처리 결과 반환                         │
│            (변환된 오디오 파일)                          │
└─────────────────────────────────────────────────────────┘
```

### 데이터 플로우

```
[음악 업로드] → [보컬 분리 (선택)] → [RVC 피치 추출]
                                            ↓
[보이스 업로드] → [RVC 변환 API 호출] → [피치 매칭 완료]
                                            ↓
                                  [반복 처리] → [최종 오디오]
                                            ↓
                                  [재생 / 다운로드]
```

---

## 📊 기술 스택 & 비용

### Frontend (Antigravity)
| 기술 | 용도 | 비용 |
|-----|------|------|
| React | UI 프레임워크 | **무료** |
| Tailwind CSS | 스타일링 | **무료** |
| Tone.js | 오디오 재생/믹싱 | **무료** |
| Axios | API 호출 | **무료** |

### Backend (Hugging Face Spaces)
| 서비스 | 용도 | 비용 |
|-------|------|------|
| **RVC V2 Space** | 음성 변환 | **무료 (CPU)** |
| Hugging Face API | 모델 호스팅 | **무료** |
| Gradio Client | API 인터페이스 | **무료** |

### 배포
| 플랫폼 | 용도 | 비용 |
|-------|------|------|
| Claude Antigravity | 프론트엔드 호스팅 | **무료** |
| GitHub Pages (선택) | 퍼블릭 배포 | **무료** |

**💰 총 비용: $0 (완전 무료!)**

---

## 🔧 상세 구현 계획

## PHASE 1: Hugging Face RVC API 연동 (2시간)

### STEP 1.1: RVC API 이해하기 (30분)

#### 사용 가능한 무료 RVC Spaces

| Space 이름 | URL | 특징 | 추천도 |
|-----------|-----|------|--------|
| **RVC V2** | `Clebersla/RVC_V2_Huggingface_Version` | 가장 안정적, 다양한 모델 | ⭐⭐⭐⭐⭐ |
| **RVC⚡ZERO** | `r3gm/rvc_zero` | 빠른 처리, 간단한 인터페이스 | ⭐⭐⭐⭐ |
| **RVC Inference HF** | `r3gm/RVC_HFv2` | 오디오 믹싱 기능 포함 | ⭐⭐⭐⭐ |

**최종 선택: RVC V2** (가장 많은 기능, 커뮤니티 지원)

#### RVC API 작동 원리

```javascript
// Gradio Client로 API 호출
import { client } from "@gradio/client";

const app = await client("Clebersla/RVC_V2_Huggingface_Version");

const result = await app.predict("/run", {
  audio_path: audioFile,        // 입력 오디오
  model_name: "default_model",  // RVC 모델
  pitch: 0,                     // 피치 조정 (-12 ~ +12)
  index_rate: 0.5,              // 인덱스 영향도
  filter_radius: 3,             // 중앙값 필터
  rms_mix_rate: 0.25,           // 볼륨 믹싱
  protect: 0.33                 // 무성음 보호
});

// result.data = 변환된 오디오 URL
```

### STEP 1.2: Gradio Client 설정 (30분)

#### 브라우저에서 Gradio 사용하기

```javascript
// utils/rvcClient.js

/**
 * RVC API 클라이언트 초기화
 */
export class RVCClient {
  constructor() {
    this.spaceUrl = "Clebersla/RVC_V2_Huggingface_Version";
    this.client = null;
  }

  async initialize() {
    if (this.client) return;
    
    try {
      // Gradio Client 동적 로딩
      const { client } = await import("@gradio/client");
      this.client = await client(this.spaceUrl);
      console.log('✓ RVC Client 초기화 완료');
    } catch (error) {
      throw new Error(`RVC Client 초기화 실패: ${error.message}`);
    }
  }

  /**
   * 음성 변환 실행
   * @param {File} audioFile - 입력 오디오 파일
   * @param {Object} options - 변환 옵션
   * @returns {Promise<string>} 변환된 오디오 URL
   */
  async convertVoice(audioFile, options = {}) {
    await this.initialize();

    const {
      modelName = "default_model",
      pitch = 0,
      indexRate = 0.5,
      filterRadius = 3,
      rmsMixRate = 0.25,
      protect = 0.33
    } = options;

    try {
      const result = await this.client.predict("/run", {
        audio_path: audioFile,
        model_name: modelName,
        pitch: pitch,
        index_rate: indexRate,
        filter_radius: filterRadius,
        rms_mix_rate: rmsMixRate,
        protect: protect
      });

      // 결과 URL 반환
      return result.data[0];
      
    } catch (error) {
      throw new Error(`RVC 변환 실패: ${error.message}`);
    }
  }

  /**
   * 사용 가능한 모델 목록 가져오기
   */
  async getAvailableModels() {
    await this.initialize();
    
    try {
      const result = await this.client.predict("/get_models", {});
      return result.data;
    } catch (error) {
      console.warn('모델 목록 가져오기 실패:', error);
      return ["default_model"];
    }
  }
}
```

#### Gradio Client 대안: 직접 API 호출

**Gradio가 작동하지 않을 경우**:

```javascript
// utils/rvcClient.js (REST API 버전)

export class RVCClient {
  constructor() {
    this.apiUrl = "https://clebersla-rvc-v2-huggingface-version.hf.space";
  }

  async convertVoice(audioFile, options = {}) {
    const formData = new FormData();
    formData.append('audio_path', audioFile);
    formData.append('pitch', options.pitch || 0);
    formData.append('index_rate', options.indexRate || 0.5);

    try {
      const response = await fetch(`${this.apiUrl}/api/predict`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`API 오류: ${response.status}`);
      }

      const result = await response.json();
      return result.data[0]; // 오디오 URL
      
    } catch (error) {
      throw new Error(`RVC API 호출 실패: ${error.message}`);
    }
  }
}
```

### STEP 1.3: 테스트 (1시간)

```javascript
// test/rvcTest.js

import { RVCClient } from '../utils/rvcClient';

async function testRVCConnection() {
  console.log('🧪 RVC 연결 테스트 시작...');
  
  const client = new RVCClient();
  
  // 1. 초기화 테스트
  try {
    await client.initialize();
    console.log('✅ 초기화 성공');
  } catch (error) {
    console.error('❌ 초기화 실패:', error);
    return;
  }

  // 2. 모델 목록 테스트
  try {
    const models = await client.getAvailableModels();
    console.log('✅ 사용 가능한 모델:', models);
  } catch (error) {
    console.warn('⚠️ 모델 목록 가져오기 실패:', error);
  }

  // 3. 음성 변환 테스트 (샘플 파일)
  const testAudio = new File(
    [new Blob()], 
    'test.wav', 
    { type: 'audio/wav' }
  );
  
  try {
    const result = await client.convertVoice(testAudio, {
      pitch: 0,
      indexRate: 0.5
    });
    console.log('✅ 변환 성공:', result);
  } catch (error) {
    console.error('❌ 변환 실패:', error);
  }
}

// 실행
testRVCConnection();
```

---

## PHASE 2: 피치 매칭 엔진 개발 (2시간)

### STEP 2.1: 음악 피치 분석 (1시간)

#### RVC는 자동으로 피치를 감지하지만, 음악 멜로디 추출은 필요

```javascript
// engines/MusicAnalyzer.js

import Essentia from 'essentia.js';

export class MusicAnalyzer {
  constructor() {
    this.essentia = null;
  }

  async initialize() {
    if (!this.essentia) {
      this.essentia = new Essentia(EssentiaWASM);
      await this.essentia.initialize();
    }
  }

  /**
   * 음악에서 주 멜로디 추출
   * @param {AudioBuffer} musicBuffer
   * @returns {Array<{time: number, pitch: number}>}
   */
  async extractMelody(musicBuffer) {
    await this.initialize();

    const audioData = this.convertToMono(musicBuffer);
    const sampleRate = musicBuffer.sampleRate;

    // Essentia의 PredominantPitchMelodia 알고리즘
    const melody = this.essentia.PredominantPitchMelodia(
      audioData,
      {
        frameSize: 2048,
        hopSize: 128,
        sampleRate: sampleRate,
        minFrequency: 80,
        maxFrequency: 2000
      }
    );

    // 시간-피치 배열로 변환
    const melodyData = melody.pitch.map((pitch, i) => ({
      time: (i * 128) / sampleRate,
      pitch: pitch,
      confidence: melody.pitchConfidence[i]
    })).filter(p => p.pitch > 0 && p.confidence > 0.8);

    console.log(`✓ 멜로디 추출 완료: ${melodyData.length}개 음표`);
    return melodyData;
  }

  convertToMono(audioBuffer) {
    const channels = audioBuffer.numberOfChannels;
    const length = audioBuffer.length;
    const mono = new Float32Array(length);

    if (channels === 1) {
      return audioBuffer.getChannelData(0);
    }

    for (let i = 0; i < length; i++) {
      let sum = 0;
      for (let ch = 0; ch < channels; ch++) {
        sum += audioBuffer.getChannelData(ch)[i];
      }
      mono[i] = sum / channels;
    }

    return mono;
  }
}
```

### STEP 2.2: 보이스 세그먼트 분할 및 RVC 피치 적용 (1시간)

```javascript
// engines/VoiceMatcher.js

import { RVCClient } from '../utils/rvcClient';
import * as Tone from 'tone';

export class VoiceMatcher {
  constructor() {
    this.rvcClient = new RVCClient();
  }

  async initialize() {
    await this.rvcClient.initialize();
  }

  /**
   * 보이스를 멜로디에 맞춰 변환
   * @param {File} voiceFile - 원본 보이스 파일
   * @param {Array} melodyData - 음악 멜로디 데이터
   * @param {number} musicDuration - 음악 전체 길이
   * @returns {Promise<AudioBuffer>}
   */
  async matchVoiceToMelody(voiceFile, melodyData, musicDuration) {
    await this.initialize();

    // 1. 보이스 로드
    const voiceBuffer = await this.loadAudioFile(voiceFile);
    const voiceDuration = voiceBuffer.duration;

    // 2. 보이스가 짧으면 반복
    const repeatedVoice = this.repeatVoiceIfNeeded(
      voiceBuffer, 
      voiceDuration, 
      musicDuration
    );

    // 3. 멜로디에 따라 피치별로 세그먼트 분할
    const segments = this.createSegmentsByPitch(
      repeatedVoice, 
      melodyData
    );

    // 4. 각 세그먼트를 RVC로 변환
    const processedSegments = await this.processSegmentsWithRVC(
      segments, 
      melodyData
    );

    // 5. 최종 오디오 합성
    return this.concatenateSegments(processedSegments);
  }

  /**
   * 보이스 반복
   */
  repeatVoiceIfNeeded(voiceBuffer, voiceDuration, musicDuration) {
    if (voiceDuration >= musicDuration) {
      return voiceBuffer;
    }

    const repeats = Math.ceil(musicDuration / voiceDuration);
    const audioContext = new AudioContext();
    const totalSamples = Math.ceil(
      musicDuration * voiceBuffer.sampleRate
    );

    const repeatedBuffer = audioContext.createBuffer(
      1,
      totalSamples,
      voiceBuffer.sampleRate
    );

    const outputData = repeatedBuffer.getChannelData(0);
    const sourceData = voiceBuffer.getChannelData(0);

    for (let i = 0; i < repeats; i++) {
      const offset = i * sourceData.length;
      outputData.set(sourceData, offset);
    }

    console.log(`✓ 보이스 ${repeats}회 반복 완료`);
    return repeatedBuffer;
  }

  /**
   * 피치별 세그먼트 분할
   */
  createSegmentsByPitch(voiceBuffer, melodyData) {
    const segments = [];
    const sampleRate = voiceBuffer.sampleRate;
    const audioData = voiceBuffer.getChannelData(0);
    const segmentLength = Math.floor(
      audioData.length / melodyData.length
    );

    for (let i = 0; i < melodyData.length; i++) {
      const start = i * segmentLength;
      const end = Math.min(start + segmentLength, audioData.length);
      
      segments.push({
        data: audioData.slice(start, end),
        targetPitch: melodyData[i].pitch,
        time: melodyData[i].time,
        duration: (end - start) / sampleRate
      });
    }

    return segments;
  }

  /**
   * RVC로 각 세그먼트 변환
   */
  async processSegmentsWithRVC(segments, melodyData) {
    const processed = [];

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      
      // 피치 계산: RVC는 세미톤 단위 (-12 ~ +12)
      const basePitch = 200; // 기본 음성 피치 (Hz)
      const targetPitch = segment.targetPitch;
      const pitchShift = this.calculatePitchShift(basePitch, targetPitch);

      // 세그먼트를 임시 파일로 변환
      const segmentFile = this.audioDataToFile(
        segment.data, 
        44100, 
        `segment_${i}.wav`
      );

      // RVC로 피치 변환
      try {
        const convertedUrl = await this.rvcClient.convertVoice(
          segmentFile,
          {
            pitch: pitchShift,
            indexRate: 0.5,
            protect: 0.33
          }
        );

        // 변환된 오디오 다운로드
        const convertedData = await this.fetchAudioData(convertedUrl);
        
        processed.push({
          data: convertedData,
          duration: segment.duration
        });

        console.log(`✓ 세그먼트 ${i + 1}/${segments.length} 변환 완료`);
        
      } catch (error) {
        console.error(`세그먼트 ${i} 변환 실패:`, error);
        // 실패 시 원본 사용
        processed.push(segment);
      }

      // API 호출 제한 방지 (1초 대기)
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return processed;
  }

  /**
   * 피치 시프트 계산 (세미톤 단위)
   */
  calculatePitchShift(fromPitch, toPitch) {
    const ratio = toPitch / fromPitch;
    const semitones = 12 * Math.log2(ratio);
    return Math.round(semitones);
  }

  /**
   * AudioData를 File 객체로 변환
   */
  audioDataToFile(audioData, sampleRate, filename) {
    // WAV 인코딩
    const wavBuffer = this.encodeWAV(audioData, sampleRate);
    const blob = new Blob([wavBuffer], { type: 'audio/wav' });
    return new File([blob], filename, { type: 'audio/wav' });
  }

  /**
   * WAV 인코딩
   */
  encodeWAV(samples, sampleRate) {
    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buffer);

    const writeString = (offset, string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + samples.length * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, samples.length * 2, true);

    let offset = 44;
    for (let i = 0; i < samples.length; i++) {
      const s = Math.max(-1, Math.min(1, samples[i]));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
      offset += 2;
    }

    return buffer;
  }

  /**
   * URL에서 오디오 데이터 가져오기
   */
  async fetchAudioData(url) {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const audioContext = new AudioContext();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    return audioBuffer.getChannelData(0);
  }

  async loadAudioFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const audioContext = new AudioContext();
          const arrayBuffer = e.target.result;
          const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
          resolve(audioBuffer);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * 세그먼트 합치기
   */
  concatenateSegments(segments) {
    const totalSamples = segments.reduce(
      (sum, seg) => sum + seg.data.length,
      0
    );

    const audioContext = new AudioContext();
    const outputBuffer = audioContext.createBuffer(
      1,
      totalSamples,
      44100
    );

    const outputData = outputBuffer.getChannelData(0);
    let offset = 0;

    for (const segment of segments) {
      outputData.set(segment.data, offset);
      offset += segment.data.length;
    }

    return outputBuffer;
  }
}
```

---

## PHASE 3: UI 구축 (2시간)

### STEP 3.1: 메인 앱 컴포넌트 (1시간)

```jsx
// App.jsx

import React, { useState } from 'react';
import FileUploader from './components/FileUploader';
import ProcessingStatus from './components/ProcessingStatus';
import AudioPlayer from './components/AudioPlayer';
import { MusicAnalyzer } from './engines/MusicAnalyzer';
import { VoiceMatcher } from './engines/VoiceMatcher';

export default function App() {
  const [musicFile, setMusicFile] = useState(null);
  const [voiceFile, setVoiceFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ step: '', percent: 0 });
  const [resultAudio, setResultAudio] = useState(null);
  const [error, setError] = useState(null);

  const handleProcess = async () => {
    if (!musicFile || !voiceFile) {
      setError('음악과 보이스 파일을 모두 업로드해주세요');
      return;
    }

    setIsProcessing(true);
    setProgress({ step: '초기화 중...', percent: 0 });
    setError(null);

    try {
      // 1. 음악 분석
      setProgress({ step: '🎼 음악 멜로디 분석 중...', percent: 20 });
      const analyzer = new MusicAnalyzer();
      await analyzer.initialize();
      
      const musicBuffer = await loadAudioFile(musicFile);
      const melodyData = await analyzer.extractMelody(musicBuffer);

      // 2. 보이스 변환
      setProgress({ step: '🎤 보이스 변환 중... (시간이 걸릴 수 있습니다)', percent: 40 });
      const matcher = new VoiceMatcher();
      await matcher.initialize();

      const result = await matcher.matchVoiceToMelody(
        voiceFile,
        melodyData,
        musicBuffer.duration
      );

      // 3. 완료
      setProgress({ step: '✅ 완료!', percent: 100 });
      setResultAudio(result);

    } catch (err) {
      console.error('처리 실패:', err);
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-900 to-red-900 p-8">
      <div className="max-w-5xl mx-auto">
        {/* 헤더 */}
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold text-white mb-4">
            🎵 PitchMixer
          </h1>
          <p className="text-xl text-purple-200">
            AI가 당신의 목소리를 음악에 완벽하게 입힙니다
          </p>
          <p className="text-sm text-purple-300 mt-2">
            Powered by RVC AI - 100% 무료
          </p>
        </div>

        {/* 파일 업로드 */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <FileUploader
            label="🎼 음악 파일"
            accept="audio/*"
            onFileSelect={setMusicFile}
            file={musicFile}
            icon="🎵"
          />

          <FileUploader
            label="🎤 보이스 샘플"
            accept="audio/*"
            onFileSelect={setVoiceFile}
            file={voiceFile}
            icon="🎙️"
          />
        </div>

        {/* 실행 버튼 */}
        <button
          onClick={handleProcess}
          disabled={isProcessing || !musicFile || !voiceFile}
          className="w-full bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 
                   text-white font-bold py-6 px-8 rounded-xl text-2xl
                   hover:from-pink-600 hover:via-purple-600 hover:to-indigo-600 
                   disabled:opacity-50 disabled:cursor-not-allowed
                   transition-all duration-300 shadow-2xl hover:shadow-pink-500/50
                   transform hover:scale-105 disabled:hover:scale-100"
        >
          {isProcessing ? '🔄 처리 중...' : '✨ PitchMix 시작!'}
        </button>

        {/* 진행 상태 */}
        {isProcessing && (
          <ProcessingStatus 
            step={progress.step} 
            percent={progress.percent} 
          />
        )}

        {/* 에러 */}
        {error && (
          <div className="mt-8 bg-red-500/20 border-2 border-red-500 rounded-xl p-6">
            <p className="text-red-200 text-lg">❌ {error}</p>
          </div>
        )}

        {/* 결과 */}
        {resultAudio && (
          <AudioPlayer audioBuffer={resultAudio} />
        )}

        {/* 안내 */}
        <div className="mt-12 bg-white/10 backdrop-blur-md rounded-xl p-6">
          <h3 className="text-white text-lg font-bold mb-3">💡 사용 팁</h3>
          <ul className="text-purple-200 space-y-2">
            <li>• 음악은 명확한 멜로디가 있는 곡이 좋습니다</li>
            <li>• 보이스는 2-10초 정도가 적당합니다</li>
            <li>• 처리 시간: 약 3-5분 (무료 서비스 사용 시)</li>
            <li>• RVC AI가 자동으로 최적의 피치를 찾아줍니다</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

// 헬퍼 함수
async function loadAudioFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const audioContext = new AudioContext();
        const arrayBuffer = e.target.result;
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        resolve(audioBuffer);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}
```

### STEP 3.2: UI 서브 컴포넌트 (1시간)

```jsx
// components/FileUploader.jsx

import React, { useState } from 'react';

export default function FileUploader({ label, accept, onFileSelect, file, icon }) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type.startsWith('audio/')) {
      onFileSelect(droppedFile);
    }
  };

  const handleChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      onFileSelect(selectedFile);
    }
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={`bg-white/10 backdrop-blur-md rounded-xl p-8 border-2 border-dashed
                  transition-all duration-300 cursor-pointer hover:bg-white/20
                  ${isDragging ? 'border-pink-400 bg-pink-500/20 scale-105' : 'border-purple-400'}`}
    >
      <label className="cursor-pointer block">
        <div className="text-center">
          <div className="text-6xl mb-4">{icon}</div>
          <h3 className="text-white text-xl font-bold mb-2">{label}</h3>
          
          {file ? (
            <div className="bg-green-500/20 rounded-lg p-4 mt-4">
              <p className="text-green-300 font-semibold">✓ {file.name}</p>
              <p className="text-green-400 text-sm mt-1">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          ) : (
            <p className="text-purple-300">
              파일을 드래그하거나 클릭하여 업로드
            </p>
          )}
          
          <input
            type="file"
            accept={accept}
            onChange={handleChange}
            className="hidden"
          />
        </div>
      </label>
    </div>
  );
}
```

```jsx
// components/ProcessingStatus.jsx

import React from 'react';

export default function ProcessingStatus({ step, percent }) {
  return (
    <div className="mt-8 bg-white/10 backdrop-blur-md rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white text-xl font-bold">{step}</h3>
        <span className="text-purple-300 text-lg font-semibold">
          {percent}%
        </span>
      </div>

      <div className="w-full bg-gray-700 rounded-full h-6 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 
                     transition-all duration-500 ease-out flex items-center justify-center"
          ````jsx
          style={{ width: `${percent}%` }}
          ````
        >
          {percent > 10 && (
            <span className="text-white text-xs font-bold">
              {percent}%
            </span>
          )}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-center space-x-2">
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
        <p className="text-purple-200 text-sm">
          잠시만 기다려주세요... RVC AI가 작업 중입니다
        </p>
      </div>
    </div>
  );
}
```

```jsx
// components/AudioPlayer.jsx

import React, { useState, useRef, useEffect } from 'react';
import * as Tone from 'tone';

export default function AudioPlayer({ audioBuffer }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const playerRef = useRef(null);
  const duration = audioBuffer.duration;

  useEffect(() => {
    const toneBuffer = new Tone.ToneAudioBuffer();
    toneBuffer.set(audioBuffer);
    playerRef.current = new Tone.Player(toneBuffer).toDestination();

    // 재생 위치 업데이트
    const interval = setInterval(() => {
      if (isPlaying && playerRef.current) {
        setCurrentTime(prev => Math.min(prev + 0.1, duration));
      }
    }, 100);

    return () => {
      clearInterval(interval);
      if (playerRef.current) {
        playerRef.current.dispose();
      }
    };
  }, [audioBuffer, duration, isPlaying]);

  const handlePlay = async () => {
    if (!playerRef.current) return;

    if (isPlaying) {
      playerRef.current.stop();
      setIsPlaying(false);
    } else {
      await Tone.start();
      playerRef.current.start();
      setIsPlaying(true);
      setCurrentTime(0);
    }
  };

  const handleDownload = () => {
    const wav = audioBufferToWav(audioBuffer);
    const blob = new Blob([wav], { type: 'audio/wav' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `pitchmixer_${Date.now()}.wav`;
    a.click();
    
    URL.revokeObjectURL(url);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="mt-8 bg-gradient-to-r from-green-500/20 to-blue-500/20 backdrop-blur-md 
                    rounded-xl p-8 border-2 border-green-400">
      <h3 className="text-white text-2xl font-bold mb-6 text-center">
        🎉 변환 완료!
      </h3>

      {/* 재생 바 */}
      <div className="mb-6">
        <div className="w-full bg-gray-700 rounded-full h-3 mb-2">
          <div
            className="bg-gradient-to-r from-green-400 to-blue-500 h-3 rounded-full transition-all"
            style={{ width: `${(currentTime / duration) * 100}%` }}
          />
        </div>
        <div className="flex justify-between text-purple-200 text-sm">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* 컨트롤 버튼 */}
      <div className="flex gap-4">
        <button
          onClick={handlePlay}
          className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 
                   hover:from-green-600 hover:to-emerald-600 
                   text-white font-bold py-4 px-6 rounded-lg text-lg
                   transition-all duration-300 shadow-lg hover:shadow-green-500/50
                   transform hover:scale-105"
        >
          {isPlaying ? '⏸ 일시정지' : '▶ 재생'}
        </button>
        
        <button
          onClick={handleDownload}
          className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 
                   hover:from-blue-600 hover:to-cyan-600 
                   text-white font-bold py-4 px-6 rounded-lg text-lg
                   transition-all duration-300 shadow-lg hover:shadow-blue-500/50
                   transform hover:scale-105"
        >
          💾 다운로드
        </button>
      </div>

      <p className="text-center text-purple-200 text-sm mt-4">
        결과가 마음에 드시나요? 다른 설정으로도 시도해보세요!
      </p>
    </div>
  );
}

// WAV 인코딩 헬퍼
function audioBufferToWav(audioBuffer) {
  const numChannels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const format = 1;
  const bitDepth = 16;

  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;

  const data = new Float32Array(audioBuffer.length * numChannels);
  for (let i = 0; i < numChannels; i++) {
    const channel = audioBuffer.getChannelData(i);
    for (let j = 0; j < audioBuffer.length; j++) {
      data[j * numChannels + i] = channel[j];
    }
  }

  const dataLength = data.length * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataLength);
  const view = new DataView(buffer);

  const writeString = (offset, string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

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

  let offset = 44;
  for (let i = 0; i < data.length; i++) {
    const sample = Math.max(-1, Math.min(1, data[i]));
    view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
    offset += 2;
  }

  return buffer;
}
```

---

## PHASE 4: 최적화 및 테스트 (1시간)

### STEP 4.1: API 호출 최적화

```javascript
// utils/apiOptimizer.js

/**
 * RVC API 호출 최적화 관리자
 */
export class APIOptimizer {
  constructor() {
    this.queue = [];
    this.isProcessing = false;
    this.maxRetries = 3;
    this.retryDelay = 2000;
  }

  /**
   * API 호출을 큐에 추가
   */
  async enqueue(apiCall) {
    return new Promise((resolve, reject) => {
      this.queue.push({ apiCall, resolve, reject, retries: 0 });
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
      // 재시도 로직
      if (item.retries < this.maxRetries) {
        item.retries++;
        console.warn(`재시도 ${item.retries}/${this.maxRetries}...`);
        
        await new Promise(resolve => 
          setTimeout(resolve, this.retryDelay)
        );
        
        this.queue.unshift(item);
      } else {
        item.reject(error);
      }
    } finally {
      this.isProcessing = false;
      
      // 다음 항목 처리 (1초 대기)
      if (this.queue.length > 0) {
        setTimeout(() => this.processQueue(), 1000);
      }
    }
  }
}

// 사용 예시
const optimizer = new APIOptimizer();

async function convertWithRetry(rvcClient, file, options) {
  return optimizer.enqueue(() => 
    rvcClient.convertVoice(file, options)
  );
}
```

### STEP 4.2: 에러 핸들링 강화

```javascript
// utils/errorHandler.js

export class PitchMixerError extends Error {
  constructor(message, code, details) {
    super(message);
    this.name = 'PitchMixerError';
    this.code = code;
    this.details = details;
  }
}

export const ErrorCodes = {
  FILE_LOAD_ERROR: 'FILE_LOAD_ERROR',
  API_CONNECTION_ERROR: 'API_CONNECTION_ERROR',
  PITCH_ANALYSIS_ERROR: 'PITCH_ANALYSIS_ERROR',
  VOICE_CONVERSION_ERROR: 'VOICE_CONVERSION_ERROR',
  AUDIO_PROCESSING_ERROR: 'AUDIO_PROCESSING_ERROR'
};

export function handleError(error) {
  console.error('PitchMixer Error:', error);

  let userMessage = '알 수 없는 오류가 발생했습니다.';

  if (error instanceof PitchMixerError) {
    switch (error.code) {
      case ErrorCodes.FILE_LOAD_ERROR:
        userMessage = '파일을 불러올 수 없습니다. 올바른 오디오 파일인지 확인해주세요.';
        break;
      case ErrorCodes.API_CONNECTION_ERROR:
        userMessage = 'RVC 서비스에 연결할 수 없습니다. 인터넷 연결을 확인해주세요.';
        break;
      case ErrorCodes.PITCH_ANALYSIS_ERROR:
        userMessage = '음악 분석에 실패했습니다. 명확한 멜로디가 있는 곡으로 시도해주세요.';
        break;
      case ErrorCodes.VOICE_CONVERSION_ERROR:
        userMessage = '음성 변환에 실패했습니다. 잠시 후 다시 시도해주세요.';
        break;
      default:
        userMessage = error.message;
    }
  }

  return userMessage;
}
```

### STEP 4.3: 테스트 체크리스트

```markdown
## 기능 테스트

### 파일 업로드
- [ ] MP3 파일 (5MB 이하)
- [ ] WAV 파일 (10MB 이하)
- [ ] 긴 음악 파일 (3분 이상)
- [ ] 짧은 보이스 (2-5초)
- [ ] 드래그 앤 드롭

### RVC API 연결
- [ ] 초기화 성공
- [ ] 모델 목록 가져오기
- [ ] 샘플 변환 테스트
- [ ] 에러 핸들링 (타임아웃, 네트워크 오류)
- [ ] 재시도 로직

### 피치 매칭
- [ ] 단순 멜로디 (동요, 민요)
- [ ] 복잡한 멜로디 (팝송)
- [ ] 빠른 템포 곡
- [ ] 느린 템포 곡
- [ ] 보이스 반복 기능

### 최종 출력
- [ ] 재생 가능
- [ ] 다운로드 가능
- [ ] WAV 파일 품질 확인
- [ ] 파일 크기 적절 (< 50MB)

### 성능
- [ ] 전체 처리 시간 (< 5분)
- [ ] 메모리 사용량 확인
- [ ] 브라우저 호환성 (Chrome, Firefox)
```

---

## 📊 예상 개발 시간 및 일정

| Phase | 작업 내용 | 시간 | 누적 |
|-------|----------|------|------|
| Phase 1 | RVC API 연동 | 2시간 | 2시간 |
| Phase 2 | 피치 매칭 엔진 | 2시간 | 4시간 |
| Phase 3 | UI 구축 | 2시간 | 6시간 |
| Phase 4 | 최적화 & 테스트 | 1시간 | 7시간 |

**총 개발 시간: 약 7시간 (1일 작업)**

---

## 🚨 주의사항 및 제한사항

### Hugging Face Spaces 무료 티어 제한
1. **처리 시간**: 세그먼트당 약 10-30초
2. **큐 대기**: 다른 사용자가 많으면 대기 시간 증가
3. **동시 요청 제한**: 한 번에 1-2개 요청만 가능
4. **타임아웃**: 5분 이상 응답 없으면 재시도

### 해결 방법
```javascript
// 병렬 처리 대신 순차 처리
async function processSegmentsSequentially(segments) {
  const results = [];
  
  for (let i = 0; i < segments.length; i++) {
    console.log(`처리 중: ${i + 1}/${segments.length}`);
    
    const result = await processSegmentWithRetry(segments[i]);
    results.push(result);
    
    // API 과부하 방지 (1초 대기)
    await delay(1000);
  }
  
  return results;
}
```

### 음질 고려사항
1. **입력 품질**: 높은 품질의 오디오 파일 사용 (44.1kHz 이상)
2. **보이스 길이**: 너무 짧으면 (<1초) 품질 저하 가능
3. **피치 범위**: 극단적인 피치 변환 (±12 세미톤 초과) 시 왜곡 가능

---

## 🎯 Phase 2로 확장 계획

### 추가 가능한 기능

1. **보컬 분리 통합**
   - Demucs API 추가
   - 배경음과 보컬 분리 처리
   - 예상 추가 시간: 3시간

2. **다중 보이스 레이어**
   - 여러 보이스 동시 변환
   - 하모니 생성
   - 예상 추가 시간: 2시간

3. **실시간 프리뷰**
   - 변환 전 미리듣기
   - 파라미터 조정
   - 예상 추가 시간: 2시간

4. **프리셋 저장**
   - 자주 쓰는 설정 저장
   - 공유 기능
   - 예상 추가 시간: 1시간

---

## ✅ 최종 체크리스트

### 개발 완료 기준
- [ ] RVC API 정상 작동
- [ ] 파일 업로드/다운로드 가능
- [ ] 피치 매칭 정확도 80% 이상
- [ ] 에러 핸들링 완료
- [ ] 모바일 반응형 UI
- [ ] 크로스 브라우저 테스트 완료

### 배포 준비
- [ ] Antigravity 아티팩트 생성
- [ ] README 작성
- [ ] 사용 가이드 영상/문서
- [ ] 테스트 계정 샘플 파일 준비

---

## 💡 성공을 위한 팁

1. **먼저 작은 파일로 테스트**
   - 10초 음악 + 2초 보이스로 프로토타입 검증
   
2. **API 응답 시간 고려**
   - 사용자에게 "3-5분 소요" 명확히 안내
   - 로딩 애니메이션으로 지루함 방지

3. **샘플 제공**
   - 테스트용 음악/보이스 샘플 미리 준비
   - "샘플로 시도해보기" 버튼 추가

4. **피드백 수집**
   - 사용자 만족도 조사
   - 버그 리포트 시스템

---

**이 계획서대로 진행하면 완전 무료로 PitchMixer를 완성할 수 있습니다!** 🚀

바로 시작하시겠어요? Phase 1부터 함께 개발해볼까요? 😊
