/**
 * ImageControls — 이미지 주석 편집 UI (Figma 스타일)
 */

import type { Annotation, BBox } from '../../types/annotation';
import { labelStyle, inlineRowStyle, valueDisplayStyle } from './panelStyles';

interface ImageControlsProps {
    style: Record<string, any>;
    bbox: BBox;
    onUpdate: (updates: Partial<Annotation>) => void;
}

export function ImageControls({ style, bbox, onUpdate }: ImageControlsProps) {
    return (
        <>
            {/* Aspect Ratio Lock */}
            <div style={{ ...inlineRowStyle }}>
                <span style={{ fontSize: '12px', color: '#475569' }}>비율 유지</span>
                <label style={{
                    position: 'relative', width: '36px', height: '20px',
                    backgroundColor: style.lockAspectRatio !== false ? '#3B82F6' : '#CBD5E1',
                    borderRadius: '10px', cursor: 'pointer', transition: 'all 0.2s',
                }}>
                    <input
                        type="checkbox"
                        checked={style.lockAspectRatio !== false}
                        onChange={(e) => onUpdate({ style: { ...style, lockAspectRatio: e.target.checked } })}
                        style={{ opacity: 0, width: 0, height: 0 }}
                    />
                    <span style={{
                        position: 'absolute',
                        top: '2px',
                        left: style.lockAspectRatio !== false ? '18px' : '2px',
                        width: '16px', height: '16px',
                        backgroundColor: 'white',
                        borderRadius: '50%',
                        transition: 'left 0.2s',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
                    }} />
                </label>
            </div>

            {/* Opacity */}
            <div style={{ ...inlineRowStyle, marginTop: '4px' }}>
                <span style={{ ...labelStyle, margin: 0 }}>투명도</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1 }}>
                    <input
                        type="range" min="0" max="100"
                        value={Math.round((1 - (style.opacity ?? 1)) * 100)}
                        onChange={(e) => {
                            const opacity = 1 - (parseInt(e.target.value) / 100);
                            onUpdate({ style: { ...style, opacity } });
                        }}
                        style={{ flex: 1, height: '4px', cursor: 'pointer' }}
                    />
                    <span style={{ ...valueDisplayStyle, minWidth: '32px', fontSize: '11px' }}>
                        {Math.round((1 - (style.opacity ?? 1)) * 100)}%
                    </span>
                </div>
            </div>

            {/* Size Display */}
            <div style={{ ...inlineRowStyle, marginTop: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontSize: '11px', color: '#94A3B8' }}>W</span>
                    <span style={valueDisplayStyle}>{Math.round(bbox?.width || 0)}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontSize: '11px', color: '#94A3B8' }}>H</span>
                    <span style={valueDisplayStyle}>{Math.round(bbox?.height || 0)}</span>
                </div>
            </div>
        </>
    );
}
