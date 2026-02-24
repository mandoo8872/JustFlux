/**
 * ExportProgressIndicator — 내보내기 진행률 + 성공 표시
 */

import { Check } from 'phosphor-react';

interface ExportProgressIndicatorProps {
    isExporting: boolean;
    progress: number;
    success: boolean;
}

export function ExportProgressIndicator({ isExporting, progress, success }: ExportProgressIndicatorProps) {
    return (
        <>
            {isExporting && (
                <div style={{
                    backgroundColor: '#F5F5F5',
                    borderRadius: '2px',
                    padding: '8px',
                    marginBottom: '12px',
                }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: '6px',
                        fontSize: '11px',
                        fontWeight: 500,
                        color: '#333333',
                    }}>
                        <span>내보내는 중...</span>
                        <span style={{ color: '#666666' }}>{progress}%</span>
                    </div>
                    <div style={{
                        width: '100%',
                        height: '4px',
                        backgroundColor: '#D0D0D0',
                        borderRadius: '2px',
                        overflow: 'hidden',
                    }}>
                        <div style={{
                            height: '100%',
                            backgroundColor: '#666666',
                            borderRadius: '2px',
                            transition: 'width 0.3s',
                            width: `${progress}%`,
                        }} />
                    </div>
                </div>
            )}

            {success && (
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px',
                    backgroundColor: '#F5F5F5',
                    border: '1px solid #D0D0D0',
                    borderRadius: '2px',
                    marginBottom: '12px',
                }}>
                    <Check size={14} weight="regular" color="#333333" />
                    <p style={{
                        margin: 0,
                        fontSize: '12px',
                        fontWeight: 500,
                        color: '#333333',
                    }}>내보내기 완료!</p>
                </div>
            )}
        </>
    );
}
