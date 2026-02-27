/**
 * TextControls — 텍스트 주석 편집 UI (Figma Inspector 스타일)
 */

import { useState } from 'react';
import { CaretUp, CaretDown } from 'phosphor-react';
import type { Annotation, TextAnnotation } from '../../types/annotation';
import {
    COLORS, labelStyle, inputStyle, colorButtonStyle,
    inlineRowStyle, valueDisplayStyle, iconButtonStyle, buttonStyle,
} from './panelStyles';

interface TextControlsProps {
    annotation: Annotation;
    style: Record<string, any>;
    onUpdate: (updates: Partial<Annotation>) => void;
}

export function TextControls({ annotation, style, onUpdate }: TextControlsProps) {
    const [activeColorTab, setActiveColorTab] = useState<'text' | 'background' | 'border'>('text');

    const handleColorChange = (color: string) => {
        if (activeColorTab === 'text') {
            onUpdate({ style: { ...style, color } });
        } else if (activeColorTab === 'background') {
            onUpdate({ style: { ...style, backgroundColor: color } });
        } else {
            onUpdate({ style: { ...style, borderColor: color } });
        }
    };

    const fontSize = style.fontSize || 16;

    return (
        <>
            {/* Text Input */}
            <div>
                <input
                    type="text"
                    value={(annotation as TextAnnotation).content || ''}
                    onChange={(e) => onUpdate({ content: e.target.value } as Partial<Annotation>)}
                    style={inputStyle}
                    placeholder="텍스트 입력..."
                />
            </div>

            {/* Font Size */}
            <div style={{ ...inlineRowStyle, marginTop: '4px' }}>
                <span style={{ ...labelStyle, margin: 0 }}>크기</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <button
                        style={{ ...iconButtonStyle, width: '24px', height: '24px' }}
                        onClick={() => onUpdate({ style: { ...style, fontSize: Math.max(8, fontSize - 1) } })}
                    >
                        <CaretDown size={10} />
                    </button>
                    <span style={valueDisplayStyle}>{fontSize}px</span>
                    <button
                        style={{ ...iconButtonStyle, width: '24px', height: '24px' }}
                        onClick={() => onUpdate({ style: { ...style, fontSize: fontSize + 1 } })}
                    >
                        <CaretUp size={10} />
                    </button>
                </div>
            </div>

            {/* Text Style (Bold/Italic) */}
            <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                <button
                    style={{
                        ...iconButtonStyle,
                        flex: 1,
                        height: '28px',
                        fontWeight: 'bold',
                        backgroundColor: style.fontWeight === 'bold' ? '#3B82F6' : '#F1F5F9',
                        color: style.fontWeight === 'bold' ? 'white' : '#475569',
                        borderColor: style.fontWeight === 'bold' ? '#2563EB' : '#CBD5E1',
                        fontSize: '12px',
                    }}
                    onClick={() => onUpdate({ style: { ...style, fontWeight: style.fontWeight === 'bold' ? 'normal' : 'bold' } })}
                >
                    B
                </button>
                <button
                    style={{
                        ...iconButtonStyle,
                        flex: 1,
                        height: '28px',
                        fontStyle: 'italic',
                        backgroundColor: style.fontStyle === 'italic' ? '#3B82F6' : '#F1F5F9',
                        color: style.fontStyle === 'italic' ? 'white' : '#475569',
                        borderColor: style.fontStyle === 'italic' ? '#2563EB' : '#CBD5E1',
                        fontSize: '12px',
                    }}
                    onClick={() => onUpdate({ style: { ...style, fontStyle: style.fontStyle === 'italic' ? 'normal' : 'italic' } })}
                >
                    I
                </button>
            </div>

            {/* Text Alignment */}
            <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                {(['left', 'center', 'right'] as const).map((align) => (
                    <button
                        key={align}
                        style={{
                            ...iconButtonStyle,
                            flex: 1,
                            height: '28px',
                            backgroundColor: style.textAlign === align ? '#3B82F6' : '#F1F5F9',
                            color: style.textAlign === align ? 'white' : '#475569',
                            borderColor: style.textAlign === align ? '#2563EB' : '#CBD5E1',
                        }}
                        onClick={() => onUpdate({ style: { ...style, textAlign: align } })}
                    >
                        <svg width="14" height="10" viewBox="0 0 14 10">
                            {align === 'left' ? (
                                <>
                                    <rect x="0" y="0" width="14" height="2" fill="currentColor" rx="1" />
                                    <rect x="0" y="4" width="10" height="2" fill="currentColor" rx="1" />
                                    <rect x="0" y="8" width="12" height="2" fill="currentColor" rx="1" />
                                </>
                            ) : align === 'center' ? (
                                <>
                                    <rect x="0" y="0" width="14" height="2" fill="currentColor" rx="1" />
                                    <rect x="2" y="4" width="10" height="2" fill="currentColor" rx="1" />
                                    <rect x="1" y="8" width="12" height="2" fill="currentColor" rx="1" />
                                </>
                            ) : (
                                <>
                                    <rect x="0" y="0" width="14" height="2" fill="currentColor" rx="1" />
                                    <rect x="4" y="4" width="10" height="2" fill="currentColor" rx="1" />
                                    <rect x="2" y="8" width="12" height="2" fill="currentColor" rx="1" />
                                </>
                            )}
                        </svg>
                    </button>
                ))}
            </div>

            {/* Color Tabs */}
            <div style={{ marginTop: '4px' }}>
                <div style={{ display: 'flex', gap: '2px', marginBottom: '6px' }}>
                    {(['text', 'background', 'border'] as const).map((tab) => (
                        <button
                            key={tab}
                            style={{
                                ...buttonStyle,
                                padding: '4px 8px',
                                fontSize: '10px',
                                backgroundColor: activeColorTab === tab ? '#3B82F6' : '#F1F5F9',
                                color: activeColorTab === tab ? 'white' : '#64748B',
                                borderColor: activeColorTab === tab ? '#2563EB' : '#CBD5E1',
                            }}
                            onClick={() => setActiveColorTab(tab)}
                        >
                            {tab === 'text' ? '글자' : tab === 'background' ? '배경' : '테두리'}
                        </button>
                    ))}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    <button
                        style={colorButtonStyle('transparent',
                            (activeColorTab === 'text' && (style.color === 'transparent' || !style.color)) ||
                            (activeColorTab === 'background' && (style.backgroundColor === 'transparent' || !style.backgroundColor)) ||
                            (activeColorTab === 'border' && (style.borderColor === 'transparent' || !style.borderColor))
                        )}
                        onClick={() => handleColorChange('transparent')}
                        title="투명"
                    />
                    {COLORS.map((color) => (
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

                {/* Sub-controls per tab */}
                {activeColorTab === 'text' && (
                    <div style={{ ...inlineRowStyle, marginTop: '6px' }}>
                        <span style={{ ...labelStyle, margin: 0 }}>투명도</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1 }}>
                            <input
                                type="range" min="0" max="100"
                                value={Math.round((style.opacity ?? 1) * 100)}
                                onChange={(e) => onUpdate({ style: { ...style, opacity: parseInt(e.target.value) / 100 } })}
                                style={{ flex: 1, height: '4px', cursor: 'pointer' }}
                            />
                            <span style={{ ...valueDisplayStyle, minWidth: '32px', fontSize: '11px' }}>
                                {Math.round((style.opacity ?? 1) * 100)}%
                            </span>
                        </div>
                    </div>
                )}
                {activeColorTab === 'background' && (
                    <div style={{ ...inlineRowStyle, marginTop: '6px' }}>
                        <span style={{ ...labelStyle, margin: 0 }}>투명도</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1 }}>
                            <input
                                type="range" min="0" max="100"
                                value={Math.round((style.backgroundOpacity ?? 1) * 100)}
                                onChange={(e) => onUpdate({ style: { ...style, backgroundOpacity: parseInt(e.target.value) / 100 } })}
                                style={{ flex: 1, height: '4px', cursor: 'pointer' }}
                            />
                            <span style={{ ...valueDisplayStyle, minWidth: '32px', fontSize: '11px' }}>
                                {Math.round((style.backgroundOpacity ?? 1) * 100)}%
                            </span>
                        </div>
                    </div>
                )}
                {activeColorTab === 'border' && (
                    <div style={{ ...inlineRowStyle, marginTop: '6px' }}>
                        <span style={{ ...labelStyle, margin: 0 }}>두께</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <button
                                style={{ ...iconButtonStyle, width: '24px', height: '24px' }}
                                onClick={() => onUpdate({ style: { ...style, borderWidth: Math.max(0, (style.borderWidth || 1) - 0.5) } })}
                            >
                                <CaretDown size={10} />
                            </button>
                            <span style={valueDisplayStyle}>{style.borderWidth || 1}px</span>
                            <button
                                style={{ ...iconButtonStyle, width: '24px', height: '24px' }}
                                onClick={() => onUpdate({ style: { ...style, borderWidth: (style.borderWidth || 1) + 0.5 } })}
                            >
                                <CaretUp size={10} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
