/**
 * AnnotationRendererMap — 주석 타입별 렌더링 컴포넌트 매핑
 *
 * AnnotationLayer의 거대한 if-else 체인을 제거하고,
 * Record<type, renderer> 기반 조회로 대체.
 *
 * 새로운 주석 타입 추가 시:
 *   1. 렌더링 컴포넌트를 만들고
 *   2. ANNOTATION_RENDERERS에 등록하면 끝!
 */

import type { Annotation } from '../../core/model/types';
import type {
    TextAnnotation,
    HighlightAnnotation,
    RectangleAnnotation,
    EllipseAnnotation,
    RoundedRectAnnotation,
    StarAnnotation,
    HeartAnnotation,

    ImageAnnotation as ImageAnnotationType,
    FreehandAnnotation,
} from '../../types/annotation';

// Shape 컴포넌트가 받는 유니온 타입
type ShapeAnnotationType = RectangleAnnotation | RoundedRectAnnotation | EllipseAnnotation;
import { TextAnnotationComponent } from './annotations/TextAnnotation';
import { HighlightAnnotationComponent } from './annotations/HighlightAnnotation';
import { ShapeAnnotationComponent } from './annotations/ShapeAnnotation';
import { StarAnnotationComponent } from './annotations/StarAnnotation';
import { HeartAnnotationComponent } from './annotations/HeartAnnotation';

import { ImageAnnotationComponent } from './annotations/ImageAnnotation';
import { FreehandAnnotationComponent } from './annotations/FreehandAnnotation';

// ── 공통 콜백 인터페이스 ─────────────────────

export interface AnnotationCallbacks {
    onSelect: (annotationId: string | null, multi?: boolean) => void;
    onUpdate: (annotationId: string, updates: Partial<Annotation>) => void;
    onDelete: (annotationId: string) => void;
    onHover: (annotationId: string | null) => void;
    onDragStart: (annotation: Annotation, startPos: { x: number; y: number }) => void;
}

interface RenderContext {
    annotation: Annotation;
    isSelected: boolean;
    isHovered: boolean;
    isDragging: boolean;
    scale: number;
    callbacks: AnnotationCallbacks;
}

type AnnotationRenderer = (ctx: RenderContext) => React.ReactNode;

// ── 렌더러 레지스트리 ────────────────────────

const ANNOTATION_RENDERERS: Record<string, AnnotationRenderer> = {
    text: ({ annotation, isSelected, isHovered, scale, isDragging, callbacks }) => (
        <div key={annotation.id} style={{ position: 'relative' }}>
            <TextAnnotationComponent
                annotation={annotation as TextAnnotation}
                isSelected={isSelected}
                isHovered={isHovered}
                scale={scale}
                onSelect={() => callbacks.onSelect(annotation.id)}
                onUpdate={(updates) => callbacks.onUpdate(annotation.id, updates)}
                onDelete={() => callbacks.onDelete(annotation.id)}
                onHover={() => callbacks.onHover(annotation.id)}
                onHoverEnd={() => callbacks.onHover(null)}
                onDragStart={callbacks.onDragStart}
                isDragging={isDragging}
            />
        </div>
    ),

    highlight: ({ annotation, isSelected, scale, callbacks }) => (
        <div key={annotation.id} style={{ position: 'relative' }}>
            <HighlightAnnotationComponent
                annotation={annotation as HighlightAnnotation}
                isSelected={isSelected}
                scale={scale}
                onSelect={() => callbacks.onSelect(annotation.id)}
                onUpdate={(updates) => callbacks.onUpdate(annotation.id, updates)}
                onDelete={() => callbacks.onDelete(annotation.id)}
            />
        </div>
    ),

    // Rectangle, Ellipse, Arrow는 ShapeAnnotationComponent를 공유
    rectangle: shapeRenderer,
    ellipse: shapeRenderer,
    arrow: shapeRenderer,

    star: ({ annotation, isSelected, scale, callbacks }) => (
        <div key={annotation.id} style={{ position: 'relative' }}>
            <StarAnnotationComponent
                annotation={annotation as StarAnnotation}
                isSelected={isSelected}
                scale={scale}
                onSelect={() => callbacks.onSelect(annotation.id)}
                onUpdate={(updates) => callbacks.onUpdate(annotation.id, updates)}
                onDelete={() => callbacks.onDelete(annotation.id)}
            />
        </div>
    ),

    heart: ({ annotation, isSelected, scale, callbacks }) => (
        <div key={annotation.id} style={{ position: 'relative' }}>
            <HeartAnnotationComponent
                annotation={annotation as HeartAnnotation}
                isSelected={isSelected}
                scale={scale}
                onSelect={() => callbacks.onSelect(annotation.id)}
                onUpdate={(updates) => callbacks.onUpdate(annotation.id, updates)}
                onDelete={() => callbacks.onDelete(annotation.id)}
            />
        </div>
    ),



    image: ({ annotation, isSelected, isHovered, scale, callbacks }) => (
        <div key={annotation.id} style={{ position: 'relative' }}>
            <ImageAnnotationComponent
                annotation={annotation as ImageAnnotationType}
                isSelected={isSelected}
                isHovered={isHovered}
                scale={scale}
                onSelect={() => callbacks.onSelect(annotation.id)}
                onUpdate={(updates) => callbacks.onUpdate(annotation.id, updates)}
                onDelete={() => callbacks.onDelete(annotation.id)}
                onHover={() => callbacks.onHover(annotation.id)}
                onHoverEnd={() => callbacks.onHover(null)}
                onDragStart={callbacks.onDragStart}
            />
        </div>
    ),

    freehand: ({ annotation, isSelected, isHovered, scale, callbacks }) => (
        <FreehandAnnotationComponent
            key={annotation.id}
            annotation={annotation as FreehandAnnotation}
            isSelected={isSelected}
            isHovered={isHovered}
            scale={scale}
            onSelect={() => callbacks.onSelect(annotation.id)}
            onUpdate={(updates) => callbacks.onUpdate(annotation.id, updates)}
            onDelete={() => callbacks.onDelete(annotation.id)}
            onHover={() => callbacks.onHover(annotation.id)}
            onHoverEnd={() => callbacks.onHover(null)}
            onPointerDown={(e) => {
                e.stopPropagation();
                callbacks.onSelect(annotation.id);
                callbacks.onDragStart(annotation, { x: e.clientX, y: e.clientY });
            }}
        />
    ),
};

// ── Shape 공통 렌더러 ────────────────────────

function shapeRenderer({ annotation, isSelected, scale, callbacks }: RenderContext): React.ReactNode {
    return (
        <div key={annotation.id} style={{ position: 'relative' }}>
            <ShapeAnnotationComponent
                annotation={annotation as ShapeAnnotationType}
                isSelected={isSelected}
                scale={scale}
                onSelect={() => callbacks.onSelect(annotation.id)}
                onUpdate={(updates) => callbacks.onUpdate(annotation.id, updates)}
                onDelete={() => callbacks.onDelete(annotation.id)}
            />
            {/* Selection border for shapes */}
            {isSelected && (
                <div
                    style={{
                        position: 'absolute',
                        left: annotation.bbox.x * scale,
                        top: annotation.bbox.y * scale,
                        width: annotation.bbox.width * scale,
                        height: annotation.bbox.height * scale,
                        border: '2px solid #3B82F6',
                        borderRadius: annotation.type === 'ellipse' ? '50%' : '4px',
                        pointerEvents: 'none',
                        zIndex: 10,
                    }}
                />
            )}
        </div>
    );
}

// ── 공개 API ─────────────────────────────────

/**
 * 주석 타입에 맞는 렌더러를 찾아 렌더링한다.
 * 등록되지 않은 타입이면 null을 반환.
 */
export function renderAnnotation(ctx: RenderContext): React.ReactNode {
    const renderer = ANNOTATION_RENDERERS[ctx.annotation.type];
    if (!renderer) return null;
    return renderer(ctx);
}

/**
 * 외부에서 커스텀 렌더러를 등록 (확장용)
 */
export function registerAnnotationRenderer(
    type: string,
    renderer: AnnotationRenderer
): void {
    ANNOTATION_RENDERERS[type] = renderer;
}
