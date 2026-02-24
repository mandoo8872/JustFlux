/**
 * ShapeControls — 도형/프리핸드 주석 편집 UI
 * (선 색상, 선 두께, 선 스타일, 채우기 색상/투명도)
 */

import { CaretUp, CaretDown } from 'phosphor-react';
import type { Annotation } from '../../types/annotation';
import { COLORS, sectionStyle, labelStyle, buttonStyle, colorButtonStyle } from './panelStyles';

interface ShapeControlsProps {
    style: Record<string, any>;
    isClosedShape: boolean;
    onUpdate: (updates: Partial<Annotation>) => void;
}

export function ShapeControls({ style, isClosedShape, onUpdate }: ShapeControlsProps) {
    const handleStrokeWidthChange = (width: number) => {
        onUpdate({ style: { ...style, strokeWidth: width } });
    };

    return (
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
                    <CaretDown size={14} style={{ cursor: 'pointer' }} onClick={() => handleStrokeWidthChange(Math.max(0.5, (style.strokeWidth || 1) - 0.5))} />
                    <span style={{ flex: 1, textAlign: 'center' }}>{style.strokeWidth || 1}px</span>
                    <CaretUp size={14} style={{ cursor: 'pointer' }} onClick={() => handleStrokeWidthChange((style.strokeWidth || 1) + 0.5)} />
                </div>
            </div>

            {/* Line Style */}
            <div style={sectionStyle}>
                <label style={labelStyle}>선 스타일</label>
                <div style={{ display: 'flex', gap: '4px' }}>
                    {[
                        { label: '실선', value: '', preview: 'none' },
                        { label: '점선', value: '4 4', preview: '4 4' },
                        { label: '긴 점선', value: '12 4', preview: '12 4' },
                        { label: '짧은 점선', value: '2 2', preview: '2 2' },
                        { label: '혼합', value: '12 4 2 4', preview: '12 4 2 4' },
                    ].map(({ label, value, preview }) => {
                        const isActive = (style.strokeDasharray || '') === value;
                        return (
                            <button
                                key={value}
                                style={{
                                    ...buttonStyle,
                                    flex: 1,
                                    padding: '6px 4px',
                                    backgroundColor: isActive ? '#3B82F6' : '#E5E5E5',
                                    color: isActive ? 'white' : '#333333',
                                    flexDirection: 'column',
                                    gap: '2px',
                                }}
                                onClick={() => onUpdate({ style: { ...style, strokeDasharray: value } })}
                                title={label}
                            >
                                <svg width="24" height="4" viewBox="0 0 24 4">
                                    <line
                                        x1="0" y1="2" x2="24" y2="2"
                                        stroke={isActive ? 'white' : '#333'}
                                        strokeWidth="2"
                                        strokeDasharray={preview === 'none' ? undefined : preview}
                                    />
                                </svg>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Fill Color - Closed shapes only */}
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

            {/* Fill Opacity - Closed shapes only */}
            {isClosedShape && (
                <div style={sectionStyle}>
                    <label style={labelStyle}>채우기 투명도</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                            type="range" min="0" max="100"
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
    );
}
