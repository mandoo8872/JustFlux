/**
 * ObjectPropertyPanel - 선택된 객체의 속성 편집 패널
 * 객체 유형(텍스트/이미지/도형)에 따라 다른 컨트롤 표시
 */

import React, { useState } from 'react';
import {
    Copy,
    Trash,
    CaretUp,
    CaretDown,
    CaretLeft,
    CaretRight,
} from 'phosphor-react';
import type { Annotation, TextAnnotation } from '../../types/annotation';

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
    const isShapeAnnotation = ['rectangle', 'roundedRect', 'ellipse', 'arrow', 'star', 'heart', 'lightning', 'freehand'].includes(selectedAnnotation.type);
    const isClosedShape = ['rectangle', 'roundedRect', 'ellipse'].includes(selectedAnnotation.type);

    const style = selectedAnnotation.style || {};
    const bbox = selectedAnnotation.bbox;

    // Handlers
    const handleColorChange = (color: string) => {
        if (activeColorTab === 'text') {
            onUpdate({ style: { ...style, color: color } });
        } else if (activeColorTab === 'background') {
            onUpdate({ style: { ...style, backgroundColor: color } });
        } else {
            // border
            onUpdate({ style: { ...style, borderColor: color } });
        }
    };

    const handleStrokeWidthChange = (width: number) => {
        onUpdate({ style: { ...style, strokeWidth: width } });
    };

    const handleFontSizeChange = (size: number) => {
        onUpdate({ style: { ...style, fontSize: size } });
    };

    // handleOpacityChange and handleSizeChange are commented out - will be used in future implementation

    const panelStyle: React.CSSProperties = {
        backgroundColor: '#FFFFFF',
        color: '#333333',
        borderRadius: '8px',
        padding: '12px',
        width: '100%',
        fontSize: '13px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        border: '1px solid #E5E5E5',
    };

    const sectionStyle: React.CSSProperties = {
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
    };

    const labelStyle: React.CSSProperties = {
        fontSize: '11px',
        color: '#666666',
        fontWeight: 500,
        marginBottom: '2px',
    };

    const inputStyle: React.CSSProperties = {
        backgroundColor: '#F5F5F5',
        border: '1px solid #D0D0D0',
        borderRadius: '4px',
        padding: '6px 10px',
        color: '#333333',
        fontSize: '12px',
        width: '100%',
        outline: 'none',
    };

    const buttonStyle: React.CSSProperties = {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '4px',
        padding: '6px 10px',
        borderRadius: '6px',
        border: '1px solid #D0D0D0',
        cursor: 'pointer',
        fontWeight: 500,
        fontSize: '12px',
        flex: 1,
        backgroundColor: '#FFFFFF',
        color: '#333333',
    };

    const colorButtonStyle = (color: string, isActive: boolean): React.CSSProperties => ({
        width: '24px',
        height: '24px',
        borderRadius: '4px',
        backgroundColor: color === 'transparent' ? 'transparent' : color,
        backgroundImage: color === 'transparent'
            ? 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)'
            : 'none',
        backgroundSize: color === 'transparent' ? '8px 8px' : 'auto',
        backgroundPosition: color === 'transparent' ? '0 0, 0 4px, 4px -4px, -4px 0px' : 'auto',
        border: isActive ? '2px solid #3B82F6' : '1px solid #D0D0D0',
        cursor: 'pointer',
        position: 'relative' as const,
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
                                        backgroundColor: activeColorTab === tab ? '#3B82F6' : '#E5E5E5',
                                        color: activeColorTab === tab ? 'white' : '#333333',
                                        padding: '6px 12px',
                                    }}
                                    onClick={() => setActiveColorTab(tab)}
                                >
                                    {tab === 'text' ? '텍스트' : tab === 'background' ? '배경' : '테두리'}
                                </button>
                            ))}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '4px' }}>
                            <button
                                key="transparent"
                                style={colorButtonStyle('transparent',
                                    (activeColorTab === 'text' && (style.color === 'transparent' || !style.color)) ||
                                    (activeColorTab === 'background' && (style.backgroundColor === 'transparent' || !style.backgroundColor)) ||
                                    (activeColorTab === 'border' && (style.borderColor === 'transparent' || !style.borderColor))
                                )}
                                onClick={() => handleColorChange('transparent')}
                                title="투명"
                            />
                            {COLORS.slice(0, 11).map((color) => (
                                <button
                                    key={color}
                                    style={colorButtonStyle(color,
                                        (activeColorTab === 'text' && style.color === color) ||
                                        (activeColorTab === 'background' && style.backgroundColor === color) ||
                                        (activeColorTab === 'border' && style.borderColor === color)
                                    )}
                                    onClick={() => handleColorChange(color)}
                                />
                            ))}
                        </div>
                        {/* Opacity Slider */}
                        <div style={{ marginTop: '8px' }}>
                            <div style={{ fontSize: '11px', color: '#666666', marginBottom: '4px' }}>투명도: {Math.round((style.opacity ?? 1) * 100)}%</div>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={Math.round((style.opacity ?? 1) * 100)}
                                onChange={(e) => onUpdate({ style: { ...style, opacity: parseInt(e.target.value) / 100 } })}
                                style={{ width: '100%' }}
                            />
                        </div>
                    </div>

                    {/* Text Style */}
                    <div style={sectionStyle}>
                        <label style={labelStyle}>텍스트 스타일</label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                                style={{
                                    ...buttonStyle,
                                    backgroundColor: style.fontWeight === 'bold' ? '#3B82F6' : '#E5E5E5',
                                    color: style.fontWeight === 'bold' ? 'white' : '#333333',
                                    padding: '8px 16px',
                                }}
                                onClick={() => onUpdate({ style: { ...style, fontWeight: style.fontWeight === 'bold' ? 'normal' : 'bold' } })}
                            >
                                굵게
                            </button>
                            <button
                                style={{
                                    ...buttonStyle,
                                    backgroundColor: style.fontStyle === 'italic' ? '#3B82F6' : '#E5E5E5',
                                    color: style.fontStyle === 'italic' ? 'white' : '#333333',
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
                        {/* Horizontal Alignment */}
                        <div style={{ marginBottom: '8px' }}>
                            <div style={{ fontSize: '11px', color: '#666666', marginBottom: '4px' }}>가로</div>
                            <div style={{ display: 'flex', gap: '4px' }}>
                                <button
                                    style={{
                                        ...buttonStyle,
                                        flex: 1,
                                        backgroundColor: style.textAlign === 'left' ? '#3B82F6' : '#E5E5E5',
                                        color: style.textAlign === 'left' ? 'white' : '#333333',
                                        padding: '6px',
                                    }}
                                    onClick={() => onUpdate({ style: { ...style, textAlign: 'left' } })}
                                >
                                    <CaretLeft size={14} />
                                </button>
                                <button
                                    style={{
                                        ...buttonStyle,
                                        flex: 1,
                                        backgroundColor: style.textAlign === 'center' ? '#3B82F6' : '#E5E5E5',
                                        color: style.textAlign === 'center' ? 'white' : '#333333',
                                        padding: '6px',
                                    }}
                                    onClick={() => onUpdate({ style: { ...style, textAlign: 'center' } })}
                                >
                                    ━
                                </button>
                                <button
                                    style={{
                                        ...buttonStyle,
                                        flex: 1,
                                        backgroundColor: style.textAlign === 'right' ? '#3B82F6' : '#E5E5E5',
                                        color: style.textAlign === 'right' ? 'white' : '#333333',
                                        padding: '6px',
                                    }}
                                    onClick={() => onUpdate({ style: { ...style, textAlign: 'right' } })}
                                >
                                    <CaretRight size={14} />
                                </button>
                            </div>
                        </div>
                        {/* Vertical Alignment */}
                        <div>
                            <div style={{ fontSize: '11px', color: '#666666', marginBottom: '4px' }}>세로</div>
                            <div style={{ display: 'flex', gap: '4px' }}>
                                <button
                                    style={{
                                        ...buttonStyle,
                                        flex: 1,
                                        backgroundColor: style.verticalAlign === 'top' ? '#3B82F6' : '#E5E5E5',
                                        color: style.verticalAlign === 'top' ? 'white' : '#333333',
                                        padding: '6px',
                                    }}
                                    onClick={() => onUpdate({ style: { ...style, verticalAlign: 'top' } })}
                                >
                                    <CaretUp size={14} />
                                </button>
                                <button
                                    style={{
                                        ...buttonStyle,
                                        flex: 1,
                                        backgroundColor: style.verticalAlign === 'middle' || !style.verticalAlign ? '#3B82F6' : '#E5E5E5',
                                        color: style.verticalAlign === 'middle' || !style.verticalAlign ? 'white' : '#333333',
                                        padding: '6px',
                                    }}
                                    onClick={() => onUpdate({ style: { ...style, verticalAlign: 'middle' } })}
                                >
                                    ‖
                                </button>
                                <button
                                    style={{
                                        ...buttonStyle,
                                        flex: 1,
                                        backgroundColor: style.verticalAlign === 'bottom' ? '#3B82F6' : '#E5E5E5',
                                        color: style.verticalAlign === 'bottom' ? 'white' : '#333333',
                                        padding: '6px',
                                    }}
                                    onClick={() => onUpdate({ style: { ...style, verticalAlign: 'bottom' } })}
                                >
                                    <CaretDown size={14} />
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Image-specific controls */}
            {isImageAnnotation && (
                <>
                    {/* Aspect Ratio Lock - 기본값 checked */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                            type="checkbox"
                            id="aspectLock"
                            checked={style.lockAspectRatio !== false}
                            onChange={(e) => onUpdate({ style: { ...style, lockAspectRatio: e.target.checked } })}
                        />
                        <label htmlFor="aspectLock" style={{ fontSize: '13px' }}>비율 유지</label>
                    </div>

                    {/* Opacity Slider - 투명도 (0% = 완전 불투명, 100% = 완전 투명) */}
                    <div style={sectionStyle}>
                        <label style={labelStyle}>투명도</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={Math.round((1 - (style.opacity ?? 1)) * 100)}
                                onChange={(e) => {
                                    const transparency = parseInt(e.target.value);
                                    const opacity = 1 - (transparency / 100);
                                    onUpdate({ style: { ...style, opacity } });
                                }}
                                style={{ flex: 1, cursor: 'pointer' }}
                            />
                            <span style={{ minWidth: '40px', textAlign: 'right' }}>{Math.round((1 - (style.opacity ?? 1)) * 100)}%</span>
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
                            <button
                                key="transparent"
                                style={colorButtonStyle('transparent', style.stroke === 'transparent' || !style.stroke)}
                                onClick={() => onUpdate({ style: { ...style, stroke: 'transparent' } })}
                                title="투명 (선 없음)"
                            />
                            {COLORS.slice(0, 11).map((color) => (
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

                    {/* Fill Color - Only for closed shapes */}
                    {isClosedShape && (
                        <div style={sectionStyle}>
                            <label style={labelStyle}>채우기 색상</label>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '4px' }}>
                                <button
                                    key="fill-transparent"
                                    style={colorButtonStyle('transparent', !style.fill || style.fill === 'transparent')}
                                    onClick={() => onUpdate({ style: { ...style, fill: 'transparent' } })}
                                    title="투명"
                                />
                                {COLORS.slice(0, 11).map((color) => (
                                    <button
                                        key={color}
                                        style={colorButtonStyle(color, style.fill === color)}
                                        onClick={() => onUpdate({ style: { ...style, fill: color } })}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Opacity - Only for closed shapes */}
                    {isClosedShape && (
                        <div style={sectionStyle}>
                            <label style={labelStyle}>채우기 투명도</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={Math.round((style.opacity ?? 1) * 100)}
                                    onChange={(e) => onUpdate({ style: { ...style, opacity: parseInt(e.target.value) / 100 } })}
                                    style={{ flex: 1 }}
                                />
                                <span style={{ minWidth: '40px', textAlign: 'right', fontSize: '12px' }}>
                                    {Math.round((style.opacity ?? 1) * 100)}%
                                </span>
                            </div>
                        </div>
                    )}
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
