/**
 * FileDropDialog - 파일 드롭 시 교체/추가 선택 다이얼로그
 * 기존 문서가 열려있을 때 새 파일을 드롭하면 표시됩니다.
 */

import { useState } from 'react';
import { FilePlus, ArrowsOutLineHorizontal, FileArrowDown } from 'phosphor-react';

interface FileDropDialogProps {
    fileName: string;
    /** 기존 페이지와 새 파일의 폭이 다른지 여부 (추가 선택 후 확인) */
    onReplace: () => void;
    onAppend: (matchWidth: boolean) => void;
    onCancel: () => void;
}

export function FileDropDialog({ fileName, onReplace, onAppend, onCancel }: FileDropDialogProps) {
    // 'choose' = 교체/추가 선택 단계, 'size' = 사이즈 옵션 선택 단계
    const [step, setStep] = useState<'choose' | 'size'>('choose');

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9999,
            }}
            onClick={onCancel}
        >
            <div
                style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '12px',
                    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
                    padding: '28px',
                    width: '400px',
                    maxWidth: '90vw',
                }}
                onClick={e => e.stopPropagation()}
            >
                {step === 'choose' ? (
                    <>
                        {/* Title */}
                        <h3 style={{
                            margin: '0 0 8px 0',
                            fontSize: '16px',
                            fontWeight: 600,
                            color: '#1a1a1a',
                        }}>
                            파일 열기
                        </h3>

                        {/* Filename */}
                        <p style={{
                            margin: '0 0 20px 0',
                            fontSize: '13px',
                            color: '#666666',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                        }}>
                            {fileName}
                        </p>

                        {/* Options */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {/* Replace */}
                            <button
                                onClick={onReplace}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    padding: '14px 16px',
                                    border: '1px solid #e0e0e0',
                                    borderRadius: '8px',
                                    backgroundColor: '#FFFFFF',
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                    transition: 'all 0.15s ease',
                                }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.backgroundColor = '#f0f7ff';
                                    e.currentTarget.style.borderColor = '#0078D4';
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.backgroundColor = '#FFFFFF';
                                    e.currentTarget.style.borderColor = '#e0e0e0';
                                }}
                            >
                                <FileArrowDown size={24} weight="duotone" color="#0078D4" />
                                <div>
                                    <div style={{ fontSize: '14px', fontWeight: 500, color: '#1a1a1a' }}>
                                        새 문서로 열기
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#888888', marginTop: '2px' }}>
                                        기존 문서를 닫고 새 파일을 엽니다
                                    </div>
                                </div>
                            </button>

                            {/* Append */}
                            <button
                                onClick={() => setStep('size')}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    padding: '14px 16px',
                                    border: '1px solid #e0e0e0',
                                    borderRadius: '8px',
                                    backgroundColor: '#FFFFFF',
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                    transition: 'all 0.15s ease',
                                }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.backgroundColor = '#f0f7ff';
                                    e.currentTarget.style.borderColor = '#0078D4';
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.backgroundColor = '#FFFFFF';
                                    e.currentTarget.style.borderColor = '#e0e0e0';
                                }}
                            >
                                <FilePlus size={24} weight="duotone" color="#0078D4" />
                                <div>
                                    <div style={{ fontSize: '14px', fontWeight: 500, color: '#1a1a1a' }}>
                                        현재 문서에 추가
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#888888', marginTop: '2px' }}>
                                        마지막 페이지 뒤에 새 파일의 페이지를 붙입니다
                                    </div>
                                </div>
                            </button>
                        </div>

                        {/* Cancel */}
                        <button
                            onClick={onCancel}
                            style={{
                                display: 'block',
                                width: '100%',
                                marginTop: '14px',
                                padding: '10px',
                                border: 'none',
                                borderRadius: '6px',
                                backgroundColor: 'transparent',
                                color: '#888888',
                                fontSize: '13px',
                                cursor: 'pointer',
                            }}
                            onMouseEnter={e => e.currentTarget.style.color = '#333333'}
                            onMouseLeave={e => e.currentTarget.style.color = '#888888'}
                        >
                            취소
                        </button>
                    </>
                ) : (
                    <>
                        {/* Size Step */}
                        <h3 style={{
                            margin: '0 0 8px 0',
                            fontSize: '16px',
                            fontWeight: 600,
                            color: '#1a1a1a',
                        }}>
                            페이지 크기 설정
                        </h3>
                        <p style={{
                            margin: '0 0 20px 0',
                            fontSize: '13px',
                            color: '#666666',
                        }}>
                            추가할 페이지의 크기를 선택하세요
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {/* Match width */}
                            <button
                                onClick={() => onAppend(true)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    padding: '14px 16px',
                                    border: '1px solid #e0e0e0',
                                    borderRadius: '8px',
                                    backgroundColor: '#FFFFFF',
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                    transition: 'all 0.15s ease',
                                }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.backgroundColor = '#f0f7ff';
                                    e.currentTarget.style.borderColor = '#0078D4';
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.backgroundColor = '#FFFFFF';
                                    e.currentTarget.style.borderColor = '#e0e0e0';
                                }}
                            >
                                <ArrowsOutLineHorizontal size={24} weight="duotone" color="#0078D4" />
                                <div>
                                    <div style={{ fontSize: '14px', fontWeight: 500, color: '#1a1a1a' }}>
                                        폭 맞춤
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#888888', marginTop: '2px' }}>
                                        기존 페이지의 폭에 맞춰 크기를 조정합니다
                                    </div>
                                </div>
                            </button>

                            {/* Original size */}
                            <button
                                onClick={() => onAppend(false)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    padding: '14px 16px',
                                    border: '1px solid #e0e0e0',
                                    borderRadius: '8px',
                                    backgroundColor: '#FFFFFF',
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                    transition: 'all 0.15s ease',
                                }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.backgroundColor = '#f0f7ff';
                                    e.currentTarget.style.borderColor = '#0078D4';
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.backgroundColor = '#FFFFFF';
                                    e.currentTarget.style.borderColor = '#e0e0e0';
                                }}
                            >
                                <FilePlus size={24} weight="duotone" color="#0078D4" />
                                <div>
                                    <div style={{ fontSize: '14px', fontWeight: 500, color: '#1a1a1a' }}>
                                        원본 크기 유지
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#888888', marginTop: '2px' }}>
                                        추가 파일의 원본 페이지 크기를 유지합니다
                                    </div>
                                </div>
                            </button>
                        </div>

                        {/* Back */}
                        <button
                            onClick={() => setStep('choose')}
                            style={{
                                display: 'block',
                                width: '100%',
                                marginTop: '14px',
                                padding: '10px',
                                border: 'none',
                                borderRadius: '6px',
                                backgroundColor: 'transparent',
                                color: '#888888',
                                fontSize: '13px',
                                cursor: 'pointer',
                            }}
                            onMouseEnter={e => e.currentTarget.style.color = '#333333'}
                            onMouseLeave={e => e.currentTarget.style.color = '#888888'}
                        >
                            뒤로
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}
