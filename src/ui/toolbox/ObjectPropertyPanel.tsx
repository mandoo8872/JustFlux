/**
 * ObjectPropertyPanel - 선택된 객체의 속성 편집 패널
 * 객체 유형(텍스트/이미지/도형)에 따라 다른 컨트롤 표시
 */

import React, { useState, useCallback } from 'react';
import {
    Copy,
    Trash,
    CaretUp,
    CaretDown,
    CaretLeft,
    CaretRight,
} from 'phosphor-react';
import type { Annotation, TextAnnotation, FreehandAnnotation } from '../../types/annotation';

// Color palette
const COLORS = [
    '#000000', '#FFFFFF', '#CCCCCC', '#FF0000', '#FFA500', '#FFFF00',
    '#00FF00', '#0000FF', '#4B0082', '#FF00FF', '#00FFFF', '#FFD700',
];

interface ObjectPropertyPanelProps {
    selectedAnnotation: Annotation | null;
    onUpdate: (updates: Partial<Annotation>) => void;
    onDelete: () => void;
    onCopy: () => void;
    onMoveUp: () => void;
    onMoveDown: () => void;
    onMoveToTop: () => void;
    onMoveToBottom: () => void;
}

export function ObjectPropertyPanel({
    selectedAnnotation,
    onUpdate,
    onDelete,
    onCopy,
    onMoveUp,
    onMoveDown,
    onMoveToTop,
    onMoveToBottom,
}: ObjectPropertyPanelProps) {
    const [activeColorTab, setActiveColorTab] = useState<'text' | 'background' | 'border'>('text');

    if (!selectedAnnotation) {
        return null;
    }

    const isTextAnnotation = selectedAnnotation.type === 'text';
    const isImageAnnotation = selectedAnnotation.type === 'image';
    const isShapeAnnotation = ['rectangle', 'ellipse', 'arrow', 'star', 'heart', 'lightning', 'freehand'].includes(selectedAnnotation.type);

    const style = selectedAnnotation.style || {};
    const bbox = selectedAnnotation.bbox;

    // Handlers
    const handleColorChange = (color: string) => {
        if (activeColorTab === 'text') {
            onUpdate({ style: { ...style, fill: color } });
        } else if (activeColorTab === 'background') {
            onUpdate({ style: { ...style, backgroundColor: color } });
        } else {
            onUpdate({ style: { ...style, stroke: color } });
        }
    };

    const handleStrokeWidthChange = (width: number) => {
        onUpdate({ style: { ...style, strokeWidth: width } });
    };

    const handleFontSizeChange = (size: number) => {
        onUpdate({ style: { ...style, fontSize: size } });
    };

    const handleOpacityChange = (opacity: number) => {
        onUpdate({ style: { ...style, opacity: opacity / 100 } });
    };

    const handleSizeChange = (dimension: 'width' | 'height', value: number) => {
        if (bbox) {
            const aspectRatio = bbox.width / bbox.height;
            const newBbox = { ...bbox };

            if (dimension === 'width') {
                newBbox.width = value;
                // If aspect ratio locked, update height
                // newBbox.height = value / aspectRatio;
            } else {
                newBbox.height = value;
                // If aspect ratio locked, update width
                // newBbox.width = value * aspectRatio;
            }
            onUpdate({ bbox: newBbox });
        }
    };

    const panelStyle: React.CSSProperties = {
        backgroundColor: '#1E293B',
        color: 'white',
        borderRadius: '12px',
        padding: '16px',
        width: '280px',
        fontSize: '13px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
    };

    const sectionStyle: React.CSSProperties = {
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
    };

    const labelStyle: React.CSSProperties = {
        fontSize: '12px',
        color: '#94A3B8',
        marginBottom: '4px',
    };

    const inputStyle: React.CSSProperties = {
        backgroundColor: '#334155',
        border: '1px solid #475569',
        borderRadius: '6px',
        padding: '8px 12px',
        color: 'white',
        fontSize: '13px',
        width: '100%',
        outline: 'none',
    };

    const buttonStyle: React.CSSProperties = {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        padding: '10px 16px',
        borderRadius: '8px',
        border: 'none',
        cursor: 'pointer',
        fontWeight: 500,
        fontSize: '13px',
        flex: 1,
    };

    const colorButtonStyle = (color: string, isActive: boolean): React.CSSProperties => ({
        width: '28px',
        height: '28px',
        borderRadius: '4px',
        backgroundColor: color,
        border: isActive ? '2px solid #3B82F6' : '1px solid #475569',
        cursor: 'pointer',
    });

    return (
        <div style={panelStyle}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '14px' }}>✏️</span>
                <span style={{ fontWeight: 600 }}>선택된 객체 편집</span>
            </div>

            {/* Text-specific controls */}
            {isTextAnnotation && (
                <>
                    {/* Text Input */}
                    <div style={sectionStyle}>
                        <label style={labelStyle}>텍스트</label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <input
                                type="text"
                                value={(selectedAnnotation as TextAnnotation).content || ''}
                                onChange={(e) => onUpdate({ content: e.target.value } as any)}
                                style={{ ...inputStyle, flex: 1 }}
                                placeholder="텍스트 입력"
                            />
                            <button
                                style={{ ...buttonStyle, backgroundColor: '#3B82F6', color: 'white', flex: 'none', width: '60px' }}
                                onClick={() => { }}
                            >
                                입력
                            </button>
                        </div>
                    </div>

                    {/* Font Size */}
                    <div style={sectionStyle}>
                        <label style={labelStyle}>폰트 크기</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <button
                                style={{ ...inputStyle, width: '32px', padding: '6px', textAlign: 'center' }}
                                onClick={() => handleFontSizeChange((style.fontSize || 16) - 2)}
                            >
                                <CaretDown size={14} />
                            </button>
                            <span style={{ flex: 1, textAlign: 'center' }}>{style.fontSize || 16}px</span>
                            <button
                                style={{ ...inputStyle, width: '32px', padding: '6px', textAlign: 'center' }}
                                onClick={() => handleFontSizeChange((style.fontSize || 16) + 2)}
                            >
                                <CaretUp size={14} />
                            </button>
                        </div>
                    </div>

                    {/* Color Tabs */}
                    <div style={sectionStyle}>
                        <label style={labelStyle}>색상</label>
                        <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
                            {(['text', 'background', 'border'] as const).map((tab) => (
                                <button
                                    key={tab}
                                    style={{
                                        ...buttonStyle,
                                        backgroundColor: activeColorTab === tab ? '#3B82F6' : '#334155',
                                        color: 'white',
                                        padding: '6px 12px',
                                    }}
                                    onClick={() => setActiveColorTab(tab)}
                                >
                                    {tab === 'text' ? '텍스트' : tab === 'background' ? '배경' : '테두리'}
                                </button>
                            ))}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '4px' }}>
                            {COLORS.map((color) => (
                                <button
                                    key={color}
                                    style={colorButtonStyle(color, false)}
                                    onClick={() => handleColorChange(color)}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Text Style */}
                    <div style={sectionStyle}>
                        <label style={labelStyle}>텍스트 스타일</label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                                style={{
                                    ...buttonStyle,
                                    backgroundColor: style.fontWeight === 'bold' ? '#3B82F6' : '#334155',
                                    color: 'white',
                                    padding: '8px 16px',
                                }}
                                onClick={() => onUpdate({ style: { ...style, fontWeight: style.fontWeight === 'bold' ? 'normal' : 'bold' } })}
                            >
                                굵게
                            </button>
                            <button
                                style={{
                                    ...buttonStyle,
                                    backgroundColor: style.fontStyle === 'italic' ? '#3B82F6' : '#334155',
                                    color: 'white',
                                    padding: '8px 16px',
                                }}
                                onClick={() => onUpdate({ style: { ...style, fontStyle: style.fontStyle === 'italic' ? 'normal' : 'italic' } })}
                            >
                                기울임
                            </button>
                        </div>
                    </div>

                    {/* Text Alignment */}
                    <div style={sectionStyle}>
                        <label style={labelStyle}>텍스트 정렬</label>
                        <div style={{ marginBottom: '8px' }}>
                            <div style={{ fontSize: '11px', color: '#64748B', marginBottom: '4px' }}>가로</div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <CaretLeft size={16} color="#64748B" />
                                <input
                                    type="range"
                                    min="0"
                                    max="2"
                                    value={style.textAlign === 'left' ? 0 : style.textAlign === 'right' ? 2 : 1}
                                    onChange={(e) => {
                                        const align = ['left', 'center', 'right'][parseInt(e.target.value)];
                                        onUpdate({ style: { ...style, textAlign: align as any } });
                                    }}
                                    style={{ flex: 1, margin: '0 8px' }}
                                />
                                <CaretRight size={16} color="#64748B" />
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Image-specific controls */}
            {isImageAnnotation && (
                <>
                    {/* Aspect Ratio Lock */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input type="checkbox" id="aspectLock" defaultChecked />
                        <label htmlFor="aspectLock" style={{ fontSize: '13px' }}>비율 유지</label>
                    </div>

                    {/* Opacity */}
                    <div style={sectionStyle}>
                        <label style={labelStyle}>불투명도</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <CaretDown size={14} />
                            <span style={{ flex: 1, textAlign: 'center' }}>{Math.round((style.opacity || 1) * 100)}%</span>
                            <CaretUp size={14} />
                        </div>
                    </div>

                    {/* Size */}
                    <div style={sectionStyle}>
                        <label style={labelStyle}>크기</label>
                        <div style={{ display: 'flex', gap: '16px' }}>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '11px', color: '#3B82F6', marginBottom: '4px' }}>너비</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <CaretLeft size={12} />
                                    <span>{Math.round(bbox?.width || 0)}</span>
                                    <CaretRight size={12} />
                                </div>
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '11px', color: '#3B82F6', marginBottom: '4px' }}>높이</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <CaretUp size={12} />
                                    <span>{Math.round(bbox?.height || 0)}</span>
                                    <CaretDown size={12} />
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Shape/Freehand controls */}
            {isShapeAnnotation && (
                <>
                    {/* Stroke Color */}
                    <div style={sectionStyle}>
                        <label style={labelStyle}>선 색상</label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '4px' }}>
                            {COLORS.map((color) => (
                                <button
                                    key={color}
                                    style={colorButtonStyle(color, style.stroke === color)}
                                    onClick={() => onUpdate({ style: { ...style, stroke: color } })}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Stroke Width */}
                    <div style={sectionStyle}>
                        <label style={labelStyle}>선 두께</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <CaretDown size={14} style={{ cursor: 'pointer' }} onClick={() => handleStrokeWidthChange(Math.max(1, (style.strokeWidth || 2) - 1))} />
                            <span style={{ flex: 1, textAlign: 'center' }}>{style.strokeWidth || 2}px</span>
                            <CaretUp size={14} style={{ cursor: 'pointer' }} onClick={() => handleStrokeWidthChange((style.strokeWidth || 2) + 1)} />
                        </div>
                    </div>
                </>
            )}

            {/* Common Actions */}
            <div style={{ display: 'flex', gap: '8px' }}>
                <button
                    style={{ ...buttonStyle, backgroundColor: '#22C55E', color: 'white' }}
                    onClick={onCopy}
                >
                    <Copy size={16} />
                    복사
                </button>
                <button
                    style={{ ...buttonStyle, backgroundColor: '#EF4444', color: 'white' }}
                    onClick={onDelete}
                >
                    <Trash size={16} />
                    삭제
                </button>
            </div>

            {/* Layer Order */}
            <div style={sectionStyle}>
                <label style={labelStyle}>레이어 순서</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                        style={{ ...buttonStyle, backgroundColor: '#6366F1', color: 'white', padding: '8px' }}
                        onClick={onMoveToTop}
                        title="맨 앞으로"
                    >
                        <CaretUp size={16} weight="bold" />
                        <CaretUp size={16} weight="bold" style={{ marginLeft: '-8px' }} />
                    </button>
                    <button
                        style={{ ...buttonStyle, backgroundColor: '#6366F1', color: 'white', padding: '8px' }}
                        onClick={onMoveUp}
                        title="앞으로"
                    >
                        <CaretUp size={16} />
                    </button>
                    <button
                        style={{ ...buttonStyle, backgroundColor: '#6366F1', color: 'white', padding: '8px' }}
                        onClick={onMoveDown}
                        title="뒤로"
                    >
                        <CaretDown size={16} />
                    </button>
                    <button
                        style={{ ...buttonStyle, backgroundColor: '#6366F1', color: 'white', padding: '8px' }}
                        onClick={onMoveToBottom}
                        title="맨 뒤로"
                    >
                        <CaretDown size={16} weight="bold" />
                        <CaretDown size={16} weight="bold" style={{ marginLeft: '-8px' }} />
                    </button>
                </div>
            </div>
        </div>
    );
}
