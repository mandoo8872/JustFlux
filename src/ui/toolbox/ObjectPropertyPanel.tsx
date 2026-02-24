/**
 * ObjectPropertyPanel - 선택된 객체의 속성 편집 패널
 * 객체 유형(텍스트/이미지/도형)에 따라 다른 컨트롤 표시
 *
 * 서브 컴포넌트:
 *  - TextControls: 텍스트 주석 전용 편집 UI
 *  - ShapeControls: 도형/프리핸드 편집 UI
 *  - ImageControls: 이미지 편집 UI
 *  - LayerOrderButtons: 레이어 순서 조작
 */

import { Copy, Trash } from 'phosphor-react';
import type { Annotation } from '../../types/annotation';
import { panelStyle, buttonStyle } from './panelStyles';
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

    const isTextAnnotation = selectedAnnotation.type === 'text';
    const isImageAnnotation = selectedAnnotation.type === 'image';
    const isShapeAnnotation = ['rectangle', 'roundedRect', 'ellipse', 'arrow', 'star', 'heart', 'lightning', 'freehand'].includes(selectedAnnotation.type);
    const isClosedShape = ['rectangle', 'roundedRect', 'ellipse'].includes(selectedAnnotation.type);

    const style = selectedAnnotation.style || {};
    const bbox = selectedAnnotation.bbox;

    return (
        <div style={panelStyle}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '14px' }}>✏️</span>
                <span style={{ fontWeight: 600 }}>선택된 객체 편집</span>
            </div>

            {/* Type-specific controls */}
            {isTextAnnotation && (
                <TextControls annotation={selectedAnnotation} style={style} onUpdate={onUpdate} />
            )}

            {isImageAnnotation && (
                <ImageControls style={style} bbox={bbox} onUpdate={onUpdate} />
            )}

            {isShapeAnnotation && (
                <ShapeControls style={style} isClosedShape={isClosedShape} onUpdate={onUpdate} />
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
            <LayerOrderButtons
                onMoveUp={onMoveUp}
                onMoveDown={onMoveDown}
                onMoveToTop={onMoveToTop}
                onMoveToBottom={onMoveToBottom}
            />
        </div>
    );
}
