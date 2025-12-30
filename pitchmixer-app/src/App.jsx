import React, { useState } from 'react';
import FileUploader from './components/FileUploader';
import ProcessingStatus from './components/ProcessingStatus';
import AudioPlayer from './components/AudioPlayer';
import { voiceTransformer } from './engines/VoiceTransformer';
import './App.css';

function App() {
  const [musicFile, setMusicFile] = useState(null);
  const [voiceFile, setVoiceFile] = useState(null);
  const [musicVolume, setMusicVolume] = useState(0.3); // 음악 볼륨 (기본 30%)
  const [voiceVolume, setVoiceVolume] = useState(1.0); // 보이스 볼륨 (기본 100%)
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ step: '', percent: 0 });
  const [resultAudio, setResultAudio] = useState(null);
  const [error, setError] = useState(null);

  const handleProcess = async () => {
    if (!musicFile || !voiceFile) {
      setError('음악과 보이스 파일을 모두 업로드해주세요.');
      return;
    }

    setIsProcessing(true);
    setProgress({ step: '초기화 중...', percent: 0 });
    setError(null);
    setResultAudio(null);

    try {
      const result = await voiceTransformer.transform(
        musicFile,
        voiceFile,
        setProgress,
        { musicVolume, voiceVolume }
      );

      setResultAudio(result);
    } catch (err) {
      console.error('처리 오류:', err);
      setError(err.message || '알 수 없는 오류가 발생했습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setMusicFile(null);
    setVoiceFile(null);
    setResultAudio(null);
    setError(null);
    setProgress({ step: '', percent: 0 });
  };

  const canProcess = musicFile && voiceFile && !isProcessing;

  return (
    <div className="app">
      {/* 코너 장식 */}
      <div className="corner-decor corner-decor--top-left" />
      <div className="corner-decor corner-decor--top-right" />
      <div className="corner-decor corner-decor--bottom-left" />
      <div className="corner-decor corner-decor--bottom-right" />

      {/* 헤더 */}
      <header className="app-header">
        <div className="header-left">
          <div className="tech-lines">
            <span className="tech-line tech-line--long" />
            <span className="tech-line tech-line--short" />
            <span className="tech-line tech-line--medium" />
          </div>
          <p className="text-subtitle" style={{ marginTop: '0.5rem' }}>
            AI VOICE MIXER
          </p>
        </div>
        <div className="header-right">
          <div className="tech-bars">
            <span className="tech-bar" style={{ height: '4px' }} />
            <span className="tech-bar" style={{ height: '8px' }} />
            <span className="tech-bar" style={{ height: '12px' }} />
            <span className="tech-bar" style={{ height: '16px' }} />
            <span className="tech-bar" style={{ height: '12px' }} />
            <span className="tech-bar" style={{ height: '8px' }} />
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="app-main">
        {/* 타이틀 */}
        <h1 className="text-hero">PITCH MIXER</h1>
        <p className="text-subtitle" style={{ marginBottom: '3rem', textAlign: 'center' }}>
          AI가 당신의 목소리를 음악에 완벽하게 입힙니다
        </p>

        {/* 홀로그래픽 크리스탈 장식 */}
        <div className="holographic-crystal" style={{ marginBottom: '3rem' }} />

        {/* 파일 업로드 영역 */}
        {!resultAudio && (
          <>
            <div className="upload-grid">
              <FileUploader
                label="음악 파일 (멜로디 추출용)"
                accept="audio/*"
                onFileSelect={setMusicFile}
                file={musicFile}
                icon="🎼"
                maxSizeMB={50}
              />

              <FileUploader
                label="보이스 샘플 (반복될 음성)"
                accept="audio/*"
                onFileSelect={setVoiceFile}
                file={voiceFile}
                icon="🎤"
                maxSizeMB={10}
              />
            </div>

            {/* 볼륨 조절 섹션 */}
            <div className="volume-controls" style={{
              width: '100%',
              maxWidth: '600px',
              margin: '2rem 0',
              padding: '1.5rem',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '1rem',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <label>🎼 원본 배경음악 볼륨</label>
                  <span>{Math.round(musicVolume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={musicVolume}
                  onChange={(e) => setMusicVolume(parseFloat(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <label>🎤 보이스 볼륨</label>
                  <span>{Math.round(voiceVolume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={voiceVolume}
                  onChange={(e) => setVoiceVolume(parseFloat(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            {/* 실행 버튼 */}
            <button
              className={`btn btn--large ${canProcess ? 'btn--holographic' : 'btn--primary'}`}
              onClick={handleProcess}
              disabled={!canProcess}
              style={{ width: '100%', maxWidth: '400px' }}
            >
              {isProcessing ? '🔄 처리 중...' : '✨ PITCH MIX 시작'}
            </button>
          </>
        )}

        {/* 처리 상태 */}
        {isProcessing && (
          <div style={{ marginTop: '2rem', width: '100%', maxWidth: '600px' }}>
            <ProcessingStatus step={progress.step} percent={progress.percent} />
          </div>
        )}

        {/* 에러 메시지 */}
        {error && (
          <div className="error-message fade-in" style={{ marginTop: '2rem' }}>
            ❌ {error}
          </div>
        )}

        {/* 결과 플레이어 */}
        {resultAudio && (
          <div style={{ marginTop: '2rem', width: '100%', maxWidth: '600px' }}>
            <AudioPlayer audioBlob={resultAudio} />

            <button
              className="btn btn--primary"
              onClick={handleReset}
              style={{ width: '100%', marginTop: '1rem' }}
            >
              🔄 새로 시작
            </button>
          </div>
        )}

        {/* 팁 섹션 */}
        {!resultAudio && !isProcessing && (
          <div className="tips">
            <h3 className="tips__title">💡 사용 팁</h3>
            <ul className="tips__list">
              <li className="tips__item">음악은 명확한 멜로디가 있는 곡이 좋습니다</li>
              <li className="tips__item">보이스는 2~10초 정도가 적당합니다</li>
              <li className="tips__item">보이스가 음악 길이만큼 반복되며 멜로디에 맞춰 음높이가 변합니다</li>
              <li className="tips__item">처리 시간: 약 10~30초 (브라우저에서 직접 처리)</li>
            </ul>
          </div>
        )}
      </main>

      {/* 푸터 */}
      <footer style={{
        marginTop: 'auto',
        paddingTop: '2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '0.875rem',
        color: 'var(--color-text-muted)'
      }}>
        <span>Powered by Web Audio & Soundtouch.js • 100% Free</span>
        <span>{new Date().getFullYear()}</span>
      </footer>
    </div>
  );
}

export default App;
