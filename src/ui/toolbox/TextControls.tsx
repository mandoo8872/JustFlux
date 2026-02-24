/**
 * TextControls — 텍스트 주석 전용 편집 UI
 * (텍스트 입력, 폰트 크기, 색상/투명도 탭, 스타일, 정렬)
 */

import { useState } from 'react';
import { CaretUp, CaretDown, CaretLeft, CaretRight } from 'phosphor-react';
import type { Annotation, TextAnnotation } from '../../types/annotation';
import { COLORS, sectionStyle, labelStyle, inputStyle, buttonStyle, colorButtonStyle } from './panelStyles';

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

    const handleFontSizeChange = (size: number) => {
        onUpdate({ style: { ...style, fontSize: size } });
    };

    return (
        <>
            {/* Text Input */}
            <div style={sectionStyle}>
                <label style={labelStyle}>텍스트</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                        type="text"
                        value={(annotation as TextAnnotation).content || ''}
                        onChange={(e) => onUpdate({ content: e.target.value } as Partial<Annotation>)}
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
                        onClick={() => handleFontSizeChange((style.fontSize || 16) - 1)}
                    >
                        <CaretDown size={14} />
                    </button>
                    <span style={{ flex: 1, textAlign: 'center' }}>{style.fontSize || 16}px</span>
                    <button
                        style={{ ...inputStyle, width: '32px', padding: '6px', textAlign: 'center' }}
                        onClick={() => handleFontSizeChange((style.fontSize || 16) + 1)}
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
                {activeColorTab === 'text' && (
                    <div style={{ marginTop: '8px' }}>
                        <div style={{ fontSize: '11px', color: '#666666', marginBottom: '4px' }}>텍스트 투명도: {Math.round((style.opacity ?? 1) * 100)}%</div>
                        <input
                            type="range" min="0" max="100"
                            value={Math.round((style.opacity ?? 1) * 100)}
                            onChange={(e) => onUpdate({ style: { ...style, opacity: parseInt(e.target.value) / 100 } })}
                            style={{ width: '100%' }}
                        />
                    </div>
                )}
                {activeColorTab === 'background' && (
                    <div style={{ marginTop: '8px' }}>
                        <div style={{ fontSize: '11px', color: '#666666', marginBottom: '4px' }}>배경 투명도: {Math.round((style.backgroundOpacity ?? 1) * 100)}%</div>
                        <input
                            type="range" min="0" max="100"
                            value={Math.round((style.backgroundOpacity ?? 1) * 100)}
                            onChange={(e) => onUpdate({ style: { ...style, backgroundOpacity: parseInt(e.target.value) / 100 } })}
                            style={{ width: '100%' }}
                        />
                    </div>
                )}
                {activeColorTab === 'border' && (
                    <div style={{ marginTop: '8px' }}>
                        <div style={{ fontSize: '11px', color: '#666666', marginBottom: '4px' }}>테두리 굵기: {style.borderWidth ?? 1}px</div>
                        <input
                            type="range" min="0" max="10"
                            value={style.borderWidth ?? 1}
                            onChange={(e) => onUpdate({ style: { ...style, borderWidth: parseInt(e.target.value) } })}
                            style={{ width: '100%' }}
                        />
                    </div>
                )}
            </div>

            {/* Text Style (Bold/Italic) */}
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
                <div style={{ marginBottom: '8px' }}>
                    <div style={{ fontSize: '11px', color: '#666666', marginBottom: '4px' }}>가로</div>
                    <div style={{ display: 'flex', gap: '4px' }}>
                        {(['left', 'center', 'right'] as const).map((align) => (
                            <button
                                key={align}
                                style={{
                                    ...buttonStyle,
                                    flex: 1,
                                    backgroundColor: style.textAlign === align ? '#3B82F6' : '#E5E5E5',
                                    color: style.textAlign === align ? 'white' : '#333333',
                                    padding: '6px',
                                }}
                                onClick={() => onUpdate({ style: { ...style, textAlign: align } })}
                            >
                                {align === 'left' ? <CaretLeft size={14} /> : align === 'right' ? <CaretRight size={14} /> : '━'}
                            </button>
                        ))}
                    </div>
                </div>
                <div>
                    <div style={{ fontSize: '11px', color: '#666666', marginBottom: '4px' }}>세로</div>
                    <div style={{ display: 'flex', gap: '4px' }}>
                        {(['top', 'middle', 'bottom'] as const).map((align) => (
                            <button
                                key={align}
                                style={{
                                    ...buttonStyle,
                                    flex: 1,
                                    backgroundColor: (style.verticalAlign === align || (align === 'middle' && !style.verticalAlign)) ? '#3B82F6' : '#E5E5E5',
                                    color: (style.verticalAlign === align || (align === 'middle' && !style.verticalAlign)) ? 'white' : '#333333',
                                    padding: '6px',
                                }}
                                onClick={() => onUpdate({ style: { ...style, verticalAlign: align } })}
                            >
                                {align === 'top' ? <CaretUp size={14} /> : align === 'bottom' ? <CaretDown size={14} /> : '‖'}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
}
