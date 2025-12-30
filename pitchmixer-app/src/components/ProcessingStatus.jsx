import React from 'react';

/**
 * 처리 진행 상태 표시 컴포넌트
 */
export default function ProcessingStatus({ step, percent }) {
    return (
        <div className="processing-status slide-up">
            <div className="processing-status__header">
                <span className="processing-status__step">{step}</span>
                <span className="processing-status__percent">{percent}%</span>
            </div>

            <div className="progress-bar">
                <div
                    className="progress-bar__fill"
                    style={{ width: `${percent}%` }}
                />
            </div>

            <div className="processing-status__info">
                <div className="spinner" />
                <span>RVC AI가 작업 중입니다. 잠시만 기다려주세요...</span>
            </div>
        </div>
    );
}
