/**
 * ImageControls — 이미지 주석 편집 UI
 * (비율 유지, 투명도, 크기 표시)
 */

import { CaretUp, CaretDown, CaretLeft, CaretRight } from 'phosphor-react';
import type { Annotation, BBox } from '../../types/annotation';
import { sectionStyle, labelStyle } from './panelStyles';

interface ImageControlsProps {
    style: Record<string, any>;
    bbox: BBox;
    onUpdate: (updates: Partial<Annotation>) => void;
}

export function ImageControls({ style, bbox, onUpdate }: ImageControlsProps) {
    return (
        <>
            {/* Aspect Ratio Lock */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                    type="checkbox"
                    id="aspectLock"
                    checked={style.lockAspectRatio !== false}
                    onChange={(e) => onUpdate({ style: { ...style, lockAspectRatio: e.target.checked } })}
                />
                <label htmlFor="aspectLock" style={{ fontSize: '13px' }}>비율 유지</label>
            </div>

            {/* Opacity Slider */}
            <div style={sectionStyle}>
                <label style={labelStyle}>투명도</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                        type="range" min="0" max="100"
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

            {/* Size Display */}
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
    );
}
