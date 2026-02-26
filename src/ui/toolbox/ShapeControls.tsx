/**
 * ShapeControls — 도형/직선 주석 편집 UI
 * Figma Inspector 스타일
 */

import { CaretUp, CaretDown } from 'phosphor-react';
import type { Annotation } from '../../types/annotation';
import { COLORS, labelStyle, colorButtonStyle, inlineRowStyle, valueDisplayStyle, iconButtonStyle } from './panelStyles';

interface ShapeControlsProps {
    style: Record<string, any>;
    isClosedShape: boolean;
    onUpdate: (updates: Partial<Annotation>) => void;
}

export function ShapeControls({ style, isClosedShape, onUpdate }: ShapeControlsProps) {
    const strokeWidth = style.strokeWidth || 1;

    return (
        <>
            {/* Stroke Color */}
            <div>
                <div style={labelStyle}>선 색상</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '6px' }}>
                    <button
                        style={colorButtonStyle('transparent', style.stroke === 'transparent' || !style.stroke)}
                        onClick={() => onUpdate({ style: { ...style, stroke: 'transparent' } })}
                        title="투명 (선 없음)"
                    />
                    {COLORS.map((color) => (
                        <button
                            key={`s-${color}`}
                            style={colorButtonStyle(color, style.stroke === color)}
                            onClick={() => onUpdate({ style: { ...style, stroke: color } })}
                        />
                    ))}
                </div>
            </div>

            {/* Stroke Width */}
            <div style={{ ...inlineRowStyle, marginTop: '4px' }}>
                <span style={{ ...labelStyle, margin: 0 }}>선 두께</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <button
                        style={{ ...iconButtonStyle, width: '24px', height: '24px' }}
                        onClick={() => onUpdate({ style: { ...style, strokeWidth: Math.max(0.5, strokeWidth - 0.5) } })}
                    >
                        <CaretDown size={10} />
                    </button>
                    <span style={valueDisplayStyle}>{strokeWidth}px</span>
                    <button
                        style={{ ...iconButtonStyle, width: '24px', height: '24px' }}
                        onClick={() => onUpdate({ style: { ...style, strokeWidth: strokeWidth + 0.5 } })}
                    >
                        <CaretUp size={10} />
                    </button>
                </div>
            </div>

            {/* Line Style */}
            <div style={{ marginTop: '4px' }}>
                <div style={labelStyle}>선 스타일</div>
                <div style={{ display: 'flex', gap: '3px', marginTop: '6px' }}>
                    {[
                        { label: '실선', value: '' },
                        { label: '점선', value: '4 4' },
                        { label: '긴점선', value: '12 4' },
                        { label: '짧은점선', value: '2 2' },
                        { label: '혼합', value: '12 4 2 4' },
                    ].map(({ label, value }) => {
                        const isActive = (style.strokeDasharray || '') === value;
                        return (
                            <button
                                key={value}
                                style={{
                                    ...iconButtonStyle,
                                    flex: 1,
                                    height: '28px',
                                    backgroundColor: isActive ? '#3B82F6' : '#F1F5F9',
                                    borderColor: isActive ? '#2563EB' : '#CBD5E1',
                                }}
                                onClick={() => onUpdate({ style: { ...style, strokeDasharray: value } })}
                                title={label}
                            >
                                <svg width="20" height="3" viewBox="0 0 20 3">
                                    <line
                                        x1="0" y1="1.5" x2="20" y2="1.5"
                                        stroke={isActive ? 'white' : '#475569'}
                                        strokeWidth="2"
                                        strokeDasharray={value || undefined}
                                    />
                                </svg>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Fill Color (closed shapes only) */}
            {isClosedShape && (
                <div style={{ marginTop: '4px' }}>
                    <div style={labelStyle}>채우기</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '6px' }}>
                        <button
                            style={colorButtonStyle('transparent', !style.fill || style.fill === 'transparent')}
                            onClick={() => onUpdate({ style: { ...style, fill: 'transparent' } })}
                            title="투명"
                        />
                        {COLORS.map((color) => (
                            <button
                                key={`f-${color}`}
                                style={colorButtonStyle(color, style.fill === color)}
                                onClick={() => onUpdate({ style: { ...style, fill: color } })}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Fill Opacity (closed shapes only) */}
            {isClosedShape && (
                <div style={{ ...inlineRowStyle, marginTop: '4px' }}>
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
        </>
    );
}
