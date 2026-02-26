/**
 * ObjectPropertyPanel — Figma Inspector 스타일 속성 편집 패널
 *
 * 서브 컴포넌트:
 *  - TextControls: 텍스트 전용
 *  - ShapeControls: 도형/선 편집
 *  - ImageControls: 이미지 편집
 *  - LayerOrderButtons: 레이어 순서
 */

import { useState } from 'react';
import {
    Copy, Trash, CaretRight, CaretDown,
    Rectangle, Circle, ArrowUpRight, Minus,
    TextT, Image as ImageIcon, PencilSimple, StarFour,
    HighlighterCircle,
} from 'phosphor-react';
import type { Annotation, ArrowAnnotation, LineAnnotation } from '../../types/annotation';
import {
    panelStyle, panelHeaderStyle, panelBodyStyle,
    sectionStyle, dividerStyle, labelStyle,
    iconButtonStyle, actionBarStyle, inlineRowStyle, valueDisplayStyle,
} from './panelStyles';
import { TextControls } from './TextControls';
import { ShapeControls } from './ShapeControls';
import { ImageControls } from './ImageControls';
import { LayerOrderButtons } from './LayerOrderButtons';

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

// ── 객체 타입 메타 ─────────────────────────────

const TYPE_META: Record<string, { label: string; icon: React.ElementType }> = {
    text: { label: '텍스트', icon: TextT },
    rectangle: { label: '사각형', icon: Rectangle },
    roundedRect: { label: '둥근 사각형', icon: Rectangle },
    ellipse: { label: '원형', icon: Circle },
    arrow: { label: '화살표', icon: ArrowUpRight },
    line: { label: '직선', icon: Minus },
    star: { label: '별', icon: StarFour },
    image: { label: '이미지', icon: ImageIcon },
    freehand: { label: '펜', icon: PencilSimple },
    highlighter: { label: '형광펜', icon: HighlighterCircle },
    brush: { label: '펜', icon: PencilSimple },
};

// ── 접이식 섹션 컴포넌트 ───────────────────────

function CollapsibleSection({
    title, defaultOpen = true, children,
}: { title: string; defaultOpen?: boolean; children: React.ReactNode }) {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    const CaretIcon = isOpen ? CaretDown : CaretRight;

    return (
        <div>
            <div
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    display: 'flex', alignItems: 'center', gap: '4px',
                    padding: '6px 14px', cursor: 'pointer', userSelect: 'none',
                }}
            >
                <CaretIcon size={10} weight="bold" style={{ color: '#94A3B8' }} />
                <span style={labelStyle}>{title}</span>
            </div>
            {isOpen && (
                <div style={sectionStyle}>
                    {children}
                </div>
            )}
        </div>
    );
}

// ── 메인 패널 ──────────────────────────────────

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
    if (!selectedAnnotation) return null;

    const type = selectedAnnotation.type;
    const meta = TYPE_META[type] || { label: type, icon: Rectangle };
    const TypeIcon = meta.icon;

    const isTextAnnotation = type === 'text';
    const isImageAnnotation = type === 'image';
    const isShapeAnnotation = ['rectangle', 'roundedRect', 'ellipse', 'arrow', 'line', 'star', 'freehand', 'highlighter'].includes(type);
    const isClosedShape = ['rectangle', 'roundedRect', 'ellipse', 'star'].includes(type);
    const isLineOrArrow = type === 'line' || type === 'arrow';

    const style = selectedAnnotation.style || {};
    const bbox = selectedAnnotation.bbox;

    // ── Line/Arrow specific info ──
    let lineLength = 0;
    let lineAngle = 0;

    if (isLineOrArrow) {
        const ann = selectedAnnotation as ArrowAnnotation | LineAnnotation;
        if (ann.startPoint && ann.endPoint) {
            const dx = ann.endPoint.x - ann.startPoint.x;
            const dy = ann.endPoint.y - ann.startPoint.y;
            lineLength = Math.sqrt(dx * dx + dy * dy);
            lineAngle = ((Math.atan2(dy, dx) * 180) / Math.PI + 360) % 360;
        }
    }

    return (
        <div style={panelStyle}>
            {/* ── Header ── */}
            <div style={panelHeaderStyle}>
                <TypeIcon size={16} weight="fill" />
                <span>{meta.label}</span>
                <span style={{
                    marginLeft: 'auto', fontSize: '10px', color: '#94A3B8',
                    fontWeight: 400, fontVariantNumeric: 'tabular-nums',
                }}>
                    {Math.round(bbox?.width || 0)} × {Math.round(bbox?.height || 0)}
                </span>
            </div>

            {/* ── Body ── */}
            <div style={panelBodyStyle}>
                {/* Text Controls */}
                {isTextAnnotation && (
                    <>
                        <CollapsibleSection title="텍스트">
                            <TextControls annotation={selectedAnnotation} style={style} onUpdate={onUpdate} />
                        </CollapsibleSection>
                        <div style={dividerStyle} />
                    </>
                )}

                {/* Image Controls */}
                {isImageAnnotation && (
                    <>
                        <CollapsibleSection title="이미지">
                            <ImageControls style={style} bbox={bbox} onUpdate={onUpdate} />
                        </CollapsibleSection>
                        <div style={dividerStyle} />
                    </>
                )}

                {/* Shape Controls */}
                {isShapeAnnotation && (
                    <>
                        <CollapsibleSection title="스타일">
                            <ShapeControls style={style} isClosedShape={isClosedShape} onUpdate={onUpdate} />
                        </CollapsibleSection>
                        <div style={dividerStyle} />
                    </>
                )}

                {/* Line/Arrow specific controls */}
                {isLineOrArrow && (
                    <>
                        <CollapsibleSection title="직선 설정">
                            {/* Arrow toggle */}
                            <div style={inlineRowStyle}>
                                <span style={{ fontSize: '12px', color: '#475569' }}>화살촉</span>
                                <button
                                    onClick={() => {
                                        const newType = type === 'line' ? 'arrow' : 'line';
                                        onUpdate({ type: newType } as Partial<Annotation>);
                                    }}
                                    style={{
                                        ...iconButtonStyle,
                                        width: 'auto',
                                        padding: '4px 12px',
                                        backgroundColor: type === 'arrow' ? '#3B82F6' : '#F1F5F9',
                                        color: type === 'arrow' ? 'white' : '#64748B',
                                        borderColor: type === 'arrow' ? '#2563EB' : '#CBD5E1',
                                        fontSize: '11px', fontWeight: 600,
                                    }}
                                >
                                    <ArrowUpRight size={14} weight={type === 'arrow' ? 'fill' : 'regular'} />
                                    {type === 'arrow' ? 'ON' : 'OFF'}
                                </button>
                            </div>

                            {/* Length & Angle display */}
                            <div style={{ ...inlineRowStyle, marginTop: '4px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1 }}>
                                    <span style={{ fontSize: '11px', color: '#94A3B8' }}>길이</span>
                                    <span style={valueDisplayStyle}>{Math.round(lineLength)}px</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1 }}>
                                    <span style={{ fontSize: '11px', color: '#94A3B8' }}>각도</span>
                                    <span style={valueDisplayStyle}>{Math.round(lineAngle)}°</span>
                                </div>
                            </div>
                        </CollapsibleSection>
                        <div style={dividerStyle} />
                    </>
                )}

                {/* Layer Order */}
                <CollapsibleSection title="레이어" defaultOpen={false}>
                    <LayerOrderButtons
                        onMoveUp={onMoveUp}
                        onMoveDown={onMoveDown}
                        onMoveToTop={onMoveToTop}
                        onMoveToBottom={onMoveToBottom}
                    />
                </CollapsibleSection>
            </div>

            {/* ── Action Bar ── */}
            <div style={actionBarStyle}>
                <button
                    style={{
                        ...iconButtonStyle,
                        flex: 1,
                        width: 'auto',
                        backgroundColor: '#22C55E',
                        color: 'white',
                        borderColor: '#16A34A',
                        gap: '4px',
                    }}
                    onClick={onCopy}
                    title="복사"
                >
                    <Copy size={14} weight="bold" /> 복사
                </button>
                <button
                    style={{
                        ...iconButtonStyle,
                        flex: 1,
                        width: 'auto',
                        backgroundColor: '#EF4444',
                        color: 'white',
                        borderColor: '#DC2626',
                        gap: '4px',
                    }}
                    onClick={onDelete}
                    title="삭제"
                >
                    <Trash size={14} weight="bold" /> 삭제
                </button>
            </div>
        </div>
    );
}
