import React, { useState, useRef, useEffect } from 'react';

/**
 * 오디오 플레이어 컴포넌트
 * 변환된 오디오 재생 및 다운로드
 */
export default function AudioPlayer({ audioBlob, fileName = 'pitchmixer_output' }) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [audioUrl, setAudioUrl] = useState(null);
    const audioRef = useRef(null);

    useEffect(() => {
        // Blob URL 생성
        let url = null;
        if (audioBlob) {
            url = URL.createObjectURL(audioBlob);
            setAudioUrl(url);
        }

        return () => {
            // 컴포넌트 언마운트 시 URL 해제
            if (url) {
                URL.revokeObjectURL(url);
            }
        };
    }, [audioBlob]);

    const handleLoadedMetadata = () => {
        if (audioRef.current) {
            setDuration(audioRef.current.duration);
        }
    };

    const handleTimeUpdate = () => {
        if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
        }
    };

    const handleEnded = () => {
        setIsPlaying(false);
        setCurrentTime(0);
    };

    const handlePlayPause = async () => {
        if (!audioRef.current) return;

        try {
            if (isPlaying) {
                audioRef.current.pause();
                setIsPlaying(false);
            } else {
                // play() returns a Promise
                await audioRef.current.play();
                setIsPlaying(true);
            }
        } catch (error) {
            console.warn('Playback intercepted:', error);
            // AbortError is common when quickly toggling or reloading
            if (error.name !== 'AbortError') {
                setIsPlaying(false);
            }
        }
    };

    const handleDownload = () => {
        if (!audioUrl) return;

        const a = document.createElement('a');
        a.href = audioUrl;
        a.download = `${fileName}_${Date.now()}.wav`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    const formatTime = (seconds) => {
        if (isNaN(seconds) || !isFinite(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

    return (
        <div className="audio-player slide-up">
            <h3 className="audio-player__title">🎉 변환 완료!</h3>

            {/* 숨겨진 오디오 요소 */}
            <audio
                ref={audioRef}
                src={audioUrl}
                onLoadedMetadata={handleLoadedMetadata}
                onTimeUpdate={handleTimeUpdate}
                onEnded={handleEnded}
            />

            {/* 파형 시각화 (간소화) */}
            <div className="audio-player__waveform">
                <div
                    className="audio-player__progress"
                    style={{ width: `${progressPercent}%` }}
                />
            </div>

            {/* 시간 표시 */}
            <div className="audio-player__time">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
            </div>

            {/* 컨트롤 버튼 */}
            <div className="audio-player__controls">
                <button
                    className="btn btn--primary"
                    onClick={handlePlayPause}
                >
                    {isPlaying ? '⏸ 일시정지' : '▶ 재생'}
                </button>

                <button
                    className="btn btn--holographic"
                    onClick={handleDownload}
                >
                    💾 다운로드
                </button>
            </div>
        </div>
    );
}
