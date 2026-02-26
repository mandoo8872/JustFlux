/**
 * MultiSelectPanel — 다중 선택 시 표시되는 편집 패널
 * 정렬, 분포, 공통 스타일 변경
 */

import {
    AlignLeft, AlignCenterHorizontal, AlignRight,
    AlignTop, AlignCenterVertical, AlignBottom,
    Rows, Columns,
    Trash, Copy, LinkSimple, LinkBreak,
} from 'phosphor-react';
import type { Annotation } from '../../types/annotation';
import { useAnnotationStore } from '../../state/stores/AnnotationStore';
import {
    panelStyle, panelHeaderStyle, panelBodyStyle,
    sectionStyle, dividerStyle, labelStyle,
    iconButtonStyle, actionBarStyle, COLORS, colorButtonStyle,
} from './panelStyles';

interface MultiSelectPanelProps {
    selectedAnnotations: Annotation[];
    onDeleteAll: () => void;
    onCopyAll: () => void;
}

export function MultiSelectPanel({
    selectedAnnotations,
    onDeleteAll,
    onCopyAll,
}: MultiSelectPanelProps) {
    const { alignAnnotations, distributeAnnotations, updateAnnotation, groupAnnotations, ungroupAnnotations } = useAnnotationStore();
    const ids = selectedAnnotations.map(a => a.id);
    const count = selectedAnnotations.length;

    // Check if already grouped
    const isGrouped = selectedAnnotations.every(a => a.groupId && a.groupId === selectedAnnotations[0]?.groupId);

    const handleAlign = (alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => {
        alignAnnotations(ids, alignment);
    };

    const handleDistribute = (direction: 'horizontal' | 'vertical') => {
        distributeAnnotations(ids, direction);
    };

    // Common stroke color change
    const handleStrokeColorChange = (color: string) => {
        for (const a of selectedAnnotations) {
            updateAnnotation(a.id, { style: { ...a.style, stroke: color } });
        }
    };

    return (
        <div style={panelStyle}>
            {/* Header */}
            <div style={panelHeaderStyle}>
                <span style={{ fontSize: '14px' }}>⬡</span>
                <span>{count}개 객체 선택됨</span>
            </div>

            <div style={panelBodyStyle}>
                {/* Alignment */}
                <div style={sectionStyle}>
                    <div style={labelStyle}>정렬</div>
                    <div style={{ display: 'flex', gap: '3px', marginTop: '4px' }}>
                        {[
                            { icon: AlignLeft, align: 'left' as const, tip: '왼쪽 맞춤' },
                            { icon: AlignCenterHorizontal, align: 'center' as const, tip: '가운데 맞춤' },
                            { icon: AlignRight, align: 'right' as const, tip: '오른쪽 맞춤' },
                            { icon: AlignTop, align: 'top' as const, tip: '위쪽 맞춤' },
                            { icon: AlignCenterVertical, align: 'middle' as const, tip: '중간 맞춤' },
                            { icon: AlignBottom, align: 'bottom' as const, tip: '아래쪽 맞춤' },
                        ].map(({ icon: Icon, align, tip }) => (
                            <button
                                key={align}
                                style={{ ...iconButtonStyle, flex: 1 }}
                                onClick={() => handleAlign(align)}
                                title={tip}
                            >
                                <Icon size={14} />
                            </button>
                        ))}
                    </div>
                </div>

                {/* Distribution (3+ objects) */}
                {count >= 3 && (
                    <>
                        <div style={dividerStyle} />
                        <div style={sectionStyle}>
                            <div style={labelStyle}>분포</div>
                            <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                                <button
                                    style={{ ...iconButtonStyle, flex: 1, gap: '4px', width: 'auto' }}
                                    onClick={() => handleDistribute('horizontal')}
                                    title="가로 균등 분포"
                                >
                                    <Columns size={14} /> 가로
                                </button>
                                <button
                                    style={{ ...iconButtonStyle, flex: 1, gap: '4px', width: 'auto' }}
                                    onClick={() => handleDistribute('vertical')}
                                    title="세로 균등 분포"
                                >
                                    <Rows size={14} /> 세로
                                </button>
                            </div>
                        </div>
                    </>
                )}

                {/* Common stroke color */}
                <div style={dividerStyle} />
                <div style={sectionStyle}>
                    <div style={labelStyle}>공통 선 색상</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                        {COLORS.map((color) => (
                            <button
                                key={color}
                                style={colorButtonStyle(color, false)}
                                onClick={() => handleStrokeColorChange(color)}
                            />
                        ))}
                    </div>
                </div>

                {/* Group / Ungroup */}
                <div style={dividerStyle} />
                <div style={sectionStyle}>
                    <div style={labelStyle}>그룹</div>
                    <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                        <button
                            style={{
                                ...iconButtonStyle,
                                flex: 1, width: 'auto', gap: '4px',
                                backgroundColor: isGrouped ? '#E0F2FE' : '#F1F5F9',
                                borderColor: isGrouped ? '#3B82F6' : '#CBD5E1',
                                color: isGrouped ? '#1D4ED8' : '#475569',
                            }}
                            onClick={() => groupAnnotations(ids)}
                            title="그룹화 (Ctrl+G)"
                        >
                            <LinkSimple size={14} weight="bold" />
                            {isGrouped ? '그룹됨' : '그룹'}
                        </button>
                        <button
                            style={{
                                ...iconButtonStyle,
                                flex: 1, width: 'auto', gap: '4px',
                            }}
                            onClick={() => ungroupAnnotations(ids)}
                            title="그룹 해제 (Ctrl+Shift+G)"
                            disabled={!isGrouped}
                        >
                            <LinkBreak size={14} /> 해제
                        </button>
                    </div>
                </div>
            </div>

            {/* Action bar */}
            <div style={actionBarStyle}>
                <button
                    style={{
                        ...iconButtonStyle,
                        flex: 1, width: 'auto',
                        backgroundColor: '#22C55E', color: 'white', borderColor: '#16A34A',
                        gap: '4px',
                    }}
                    onClick={onCopyAll}
                    title="전체 복사"
                >
                    <Copy size={14} weight="bold" /> 복사
                </button>
                <button
                    style={{
                        ...iconButtonStyle,
                        flex: 1, width: 'auto',
                        backgroundColor: '#EF4444', color: 'white', borderColor: '#DC2626',
                        gap: '4px',
                    }}
                    onClick={onDeleteAll}
                    title="전체 삭제"
                >
                    <Trash size={14} weight="bold" /> 삭제
                </button>
            </div>
        </div>
    );
}
