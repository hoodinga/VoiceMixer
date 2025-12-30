import React, { useState, useRef } from 'react';

/**
 * 파일 업로드 컴포넌트
 * 드래그 앤 드롭 및 클릭 업로드 지원
 */
export default function FileUploader({
    label,
    accept = 'audio/*',
    onFileSelect,
    file,
    icon = '📁',
    maxSizeMB = 50
}) {
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState(null);
    const inputRef = useRef(null);

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        setError(null);

        const droppedFile = e.dataTransfer.files[0];
        validateAndSetFile(droppedFile);
    };

    const handleClick = () => {
        inputRef.current?.click();
    };

    const handleChange = (e) => {
        setError(null);
        const selectedFile = e.target.files[0];
        validateAndSetFile(selectedFile);
    };

    const validateAndSetFile = (selectedFile) => {
        if (!selectedFile) return;

        // 파일 타입 검증
        if (!selectedFile.type.startsWith('audio/')) {
            setError('오디오 파일만 업로드 가능합니다.');
            return;
        }

        // 파일 크기 검증
        const sizeMB = selectedFile.size / (1024 * 1024);
        if (sizeMB > maxSizeMB) {
            setError(`파일 크기가 ${maxSizeMB}MB를 초과합니다.`);
            return;
        }

        onFileSelect(selectedFile);
    };

    const formatFileSize = (bytes) => {
        const mb = bytes / (1024 * 1024);
        return mb >= 1 ? `${mb.toFixed(2)} MB` : `${(bytes / 1024).toFixed(1)} KB`;
    };

    const getClassName = () => {
        let className = 'upload-zone';
        if (isDragging) className += ' upload-zone--dragging';
        if (file) className += ' upload-zone--has-file';
        return className;
    };

    return (
        <div
            className={getClassName()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && handleClick()}
        >
            <input
                ref={inputRef}
                type="file"
                accept={accept}
                onChange={handleChange}
                style={{ display: 'none' }}
            />

            <div className="upload-zone__icon">{icon}</div>
            <div className="upload-zone__title">{label}</div>

            {file ? (
                <div className="upload-zone__file-info fade-in">
                    <span className="upload-zone__file-name">✓ {file.name}</span>
                    <span className="upload-zone__file-size">{formatFileSize(file.size)}</span>
                </div>
            ) : (
                <div className="upload-zone__subtitle">
                    파일을 드래그하거나 클릭하여 업로드
                </div>
            )}

            {error && (
                <div className="upload-zone__error" style={{
                    color: '#dc3545',
                    fontSize: '0.875rem',
                    marginTop: '0.5rem'
                }}>
                    ⚠️ {error}
                </div>
            )}
        </div>
    );
}
