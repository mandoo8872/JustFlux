/**
 * AnnotationLayer Component - 벡터 주석 레이어 (Refactored)
 *
 * 역할: PDF 페이지 위의 주석 인터랙션 조율 (Orchestrator)
 *  - 생성 로직 → AnnotationFactory
 *  - 프리뷰 렌더링 → DrawPreview
 *  - 주석 렌더링 → AnnotationRendererMap
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import type { Annotation, ToolType, BBox } from '../../core/model/types';
import { DrawPreview } from './DrawPreview';
import { renderAnnotation, type AnnotationCallbacks } from './AnnotationRendererMap';
import {
  createAnnotationFromDraw,
  isImmediateCreateTool,
  DRAWING_TOOLS,
  type DrawPoints,
} from './annotations/AnnotationFactory';

// ── Props ────────────────────────────────────

interface AnnotationLayerProps {
  annotations: Annotation[];
  pageId: string;
  scale: number;
  activeTool: ToolType;
  selectedAnnotationIds: string[];
  onSelect: (annotationId: string | null, multi?: boolean) => void;
  onUpdate: (annotationId: string, updates: Partial<Annotation>) => void;
  onDelete: (annotationId: string) => void;
  onCreate: (annotation: Annotation) => void;
  onPan?: (deltaX: number, deltaY: number) => void;
  setActiveTool?: (tool: ToolType) => void;
}

// ── 커서 매핑 ────────────────────────────────

const TOOL_CURSORS: Partial<Record<ToolType, string>> = {
  select: 'default',
  pan: 'grab',
  text: 'text',
};

function getCursor(tool: ToolType): string {
  return TOOL_CURSORS[tool] ?? 'crosshair';
}

// ── 메인 컴포넌트 ────────────────────────────

export function AnnotationLayer({
  annotations,
  pageId,
  scale,
  activeTool,
  selectedAnnotationIds,
  onSelect,
  onUpdate,
  onDelete,
  onCreate,
  onPan,
  setActiveTool,
}: AnnotationLayerProps) {
  // ── 드로잉 상태 ──
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
  const [drawCurrent, setDrawCurrent] = useState<{ x: number; y: number } | null>(null);

  // ── 패닝 상태 ──
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number } | null>(null);

  // ── 드래그(이동) 상태 ──
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [dragAnnotation, setDragAnnotation] = useState<Annotation | null>(null);

  // ── 호버 상태 ──
  const [hoveredAnnotationId, setHoveredAnnotationId] = useState<string | null>(null);

  const layerRef = useRef<HTMLDivElement>(null);

  // ── 좌표 변환 ──
  const screenToPage = useCallback((clientX: number, clientY: number) => {
    if (!layerRef.current) return { x: 0, y: 0 };
    const rect = layerRef.current.getBoundingClientRect();
    return {
      x: (clientX - rect.left) / scale,
      y: (clientY - rect.top) / scale,
    };
  }, [scale]);

  // ── 글로벌 드래그 이벤트 ──
  useEffect(() => {
    if (!isDragging) return;

    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!dragAnnotation || !dragStart) return;
      const deltaX = (e.clientX - dragStart.x) / scale;
      const deltaY = (e.clientY - dragStart.y) / scale;

      onUpdate(dragAnnotation.id, {
        bbox: {
          ...dragAnnotation.bbox,
          x: dragAnnotation.bbox.x + deltaX,
          y: dragAnnotation.bbox.y + deltaY,
        },
      });

      setDragAnnotation({
        ...dragAnnotation,
        bbox: {
          ...dragAnnotation.bbox,
          x: dragAnnotation.bbox.x + deltaX,
          y: dragAnnotation.bbox.y + deltaY,
        },
      });
      setDragStart({ x: e.clientX, y: e.clientY });
    };

    const handleGlobalMouseUp = () => {
      setIsDragging(false);
      setDragStart(null);
      setDragAnnotation(null);
    };

    document.addEventListener('mousemove', handleGlobalMouseMove);
    document.addEventListener('mouseup', handleGlobalMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, dragStart, dragAnnotation, scale, onUpdate]);

  // ── 콜백 객체 (렌더러에 전달) ──
  const callbacks: AnnotationCallbacks = {
    onSelect,
    onUpdate,
    onDelete,
    onHover: setHoveredAnnotationId,
    onDragStart: useCallback((annotation: Annotation, startPos: { x: number; y: number }) => {
      setIsDragging(true);
      setDragStart(startPos);
      setDragAnnotation(annotation);
    }, []),
  };

  // ── mouseDown 핸들러 ──
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const isDirectLayerClick = e.target === layerRef.current;

    // Select 도구: 빈 영역 클릭 시 선택 해제
    if (activeTool === 'select') {
      if (isDirectLayerClick && e.target === e.currentTarget) {
        onSelect(null);
      }
      return;
    }

    // Pan 도구: 패닝 시작
    if (activeTool === 'pan') {
      e.preventDefault();
      setPanStart({ x: e.clientX, y: e.clientY });
      setIsPanning(true);
      return;
    }

    // Eraser 도구: 커서 아래 주석 삭제
    if (activeTool === 'eraser') {
      const point = screenToPage(e.clientX, e.clientY);
      const target = annotations.find(ann => {
        const { x, y, width, height } = ann.bbox;
        return point.x >= x && point.x <= x + width && point.y >= y && point.y <= y + height;
      });
      if (target) onDelete(target.id);
      return;
    }

    // 드로잉 도구
    if (DRAWING_TOOLS.includes(activeTool)) {
      e.preventDefault();
      const point = screenToPage(e.clientX, e.clientY);
      setDrawStart(point);
      setDrawCurrent(point);
      setIsDrawing(true);

      // 즉시 생성 도구 (text)
      if (isImmediateCreateTool(activeTool)) {
        const ann = createAnnotationFromDraw(activeTool, {
          pageId,
          bbox: { x: point.x, y: point.y, width: 200, height: 40 },
          points: { start: point, current: point },
        });
        if (ann) {
          onCreate(ann);
          setActiveTool?.('select');
        }
        setIsDrawing(false);
        setDrawStart(null);
        setDrawCurrent(null);
      }
    }
  }, [activeTool, annotations, onSelect, onDelete, onCreate, pageId, screenToPage, setActiveTool]);

  // ── mouseMove 핸들러 ──
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    // 드래그 중 (글로벌 핸들러에서 처리하므로 여기서는 skip)
    if (isDragging) return;

    // 패닝
    if (isPanning && panStart && onPan) {
      onPan(e.clientX - panStart.x, e.clientY - panStart.y);
      setPanStart({ x: e.clientX, y: e.clientY });
      return;
    }

    // 드로잉
    if (isDrawing && drawStart) {
      setDrawCurrent(screenToPage(e.clientX, e.clientY));
    }
  }, [isDragging, isPanning, panStart, onPan, isDrawing, drawStart, screenToPage]);

  // ── mouseUp 핸들러 ──
  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      setDragAnnotation(null);
      setDragStart(null);
      return;
    }

    if (isPanning) {
      setIsPanning(false);
      setPanStart(null);
      return;
    }

    if (!isDrawing || !drawStart || !drawCurrent) {
      setIsDrawing(false);
      return;
    }

    // text는 mouseDown에서 이미 생성됨
    if (activeTool === 'text') {
      setIsDrawing(false);
      return;
    }

    const bbox: BBox = {
      x: Math.min(drawStart.x, drawCurrent.x),
      y: Math.min(drawStart.y, drawCurrent.y),
      width: Math.abs(drawCurrent.x - drawStart.x),
      height: Math.abs(drawCurrent.y - drawStart.y),
    };

    const points: DrawPoints = { start: drawStart, current: drawCurrent };
    const annotation = createAnnotationFromDraw(activeTool, { pageId, bbox, points });

    if (annotation) {
      onCreate(annotation);
      setActiveTool?.('select');
    }

    setIsDrawing(false);
    setDrawStart(null);
    setDrawCurrent(null);
  }, [isPanning, isDragging, isDrawing, drawStart, drawCurrent, activeTool, pageId, onCreate, setActiveTool]);

  // ── mouseLeave 핸들러 ──
  const handleMouseLeave = useCallback(() => {
    if (isDrawing) setIsDrawing(false);
    if (isPanning) { setIsPanning(false); setPanStart(null); }
    if (isDragging) { setIsDragging(false); setDragAnnotation(null); setDragStart(null); }
  }, [isDrawing, isPanning, isDragging]);

  // ── Render ──
  return (
    <div
      ref={layerRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1,
        cursor: getCursor(activeTool),
        pointerEvents: 'auto',
        backgroundColor: 'transparent',
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
    >
      {/* Annotation 렌더링 */}
      {annotations.map((annotation) =>
        renderAnnotation({
          annotation,
          isSelected: selectedAnnotationIds.includes(annotation.id),
          isHovered: hoveredAnnotationId === annotation.id,
          isDragging: isDragging && dragAnnotation?.id === annotation.id,
          scale,
          callbacks,
        })
      )}

      {/* 드로잉 프리뷰 */}
      {isDrawing && drawStart && drawCurrent && (
        <DrawPreview
          activeTool={activeTool}
          drawStart={drawStart}
          drawCurrent={drawCurrent}
          scale={scale}
        />
      )}
    </div>
  );
}
