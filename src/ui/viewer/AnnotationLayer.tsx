/**
 * AnnotationLayer Component - 벡터 주석 레이어
 * PDF 페이지 위에 주석을 렌더링하고 상호작용을 처리합니다.
 */

import { useState, useCallback, useRef } from 'react';
import type { Annotation, ToolType, BBox } from '../../core/model/types';
import { TextAnnotationComponent } from './annotations/TextAnnotation';
import { HighlightAnnotationComponent } from './annotations/HighlightAnnotation';
import { ShapeAnnotationComponent } from './annotations/ShapeAnnotation';
import { ArrowAnnotationComponent } from './annotations/ArrowAnnotation';
import { StarAnnotationComponent } from './annotations/StarAnnotation';
import { HeartAnnotationComponent } from './annotations/HeartAnnotation';
import { LightningAnnotationComponent } from './annotations/LightningAnnotation';

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
}

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
}: AnnotationLayerProps) {
  console.log('🎨 [AnnotationLayer] Rendering with tool:', activeTool, 'annotations:', annotations.length);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
  const [drawCurrent, setDrawCurrent] = useState<{ x: number; y: number } | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [dragAnnotation, setDragAnnotation] = useState<Annotation | null>(null);
  const layerRef = useRef<HTMLDivElement>(null);

  // Convert screen coordinates to page coordinates
  const screenToPage = useCallback((clientX: number, clientY: number) => {
    if (!layerRef.current) return { x: 0, y: 0 };
    
    const rect = layerRef.current.getBoundingClientRect();
    return {
      x: (clientX - rect.left) / scale,
      y: (clientY - rect.top) / scale,
    };
  }, [scale]);

  // Handle mouse down for creating annotations, selection, or panning
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    console.log('🖱️ [AnnotationLayer] Mouse down with tool:', activeTool);
    
    if (activeTool === 'select') {
      // Selection tool: handle annotation selection and dragging
      const point = screenToPage(e.clientX, e.clientY);
      
      // Check if clicking on an annotation
      const clickedAnnotation = annotations.find(ann => {
        const { x, y, width, height } = ann.bbox;
        return point.x >= x && point.x <= x + width && 
               point.y >= y && point.y <= y + height;
      });
      
      if (clickedAnnotation) {
        // Select the annotation and start dragging
        onSelect(clickedAnnotation.id);
        setDragAnnotation(clickedAnnotation);
        setDragStart(point);
        setIsDragging(true);
        e.preventDefault();
      } else {
        // Clear selection if clicking on empty area
        onSelect(null);
      }
      return;
    }
    
    if (activeTool === 'pan') {
      // Pan tool: start panning
      e.preventDefault();
      setPanStart({ x: e.clientX, y: e.clientY });
      setIsPanning(true);
      return;
    }
    
    if (activeTool === 'eraser') {
      // Eraser tool: delete annotation under cursor
      const point = screenToPage(e.clientX, e.clientY);
      const annotationToDelete = annotations.find(ann => {
        const { x, y, width, height } = ann.bbox;
        return point.x >= x && point.x <= x + width && 
               point.y >= y && point.y <= y + height;
      });
      
      if (annotationToDelete) {
        onDelete(annotationToDelete.id);
      }
      return;
    }
    
    // For drawing tools (text, highlight, rect, ellipse, arrow, line, star, heart, lightning)
    if (['text', 'highlight', 'rect', 'ellipse', 'arrow', 'line', 'star', 'heart', 'lightning', 'brush'].includes(activeTool)) {
      console.log('🎨 [AnnotationLayer] Starting to draw with tool:', activeTool);
      e.preventDefault();
      const point = screenToPage(e.clientX, e.clientY);
      console.log('📍 [AnnotationLayer] Draw start point:', point);
      setDrawStart(point);
      setDrawCurrent(point);
      setIsDrawing(true);
      
      // For text tool, create annotation immediately on click
      if (activeTool === 'text') {
        const now = Date.now();
        const annotation: Annotation = {
          id: `ann-${now}-${Math.random().toString(36).slice(2, 9)}`,
          type: 'text',
          pageId,
          bbox: { x: point.x, y: point.y, width: 200, height: 40 },
          content: '텍스트 입력',
          style: {
            fontFamily: 'sans-serif',
            fontSize: 16,
            stroke: '#000000',
            strokeWidth: 1,
          },
          createdAt: now,
          modifiedAt: now,
        } as any;
        console.log('📝 [AnnotationLayer] Creating text annotation immediately:', annotation);
        onCreate(annotation);
        setIsDrawing(false);
        setDrawStart(null);
        setDrawCurrent(null);
      }
    }
  }, [activeTool, screenToPage, onSelect, annotations, onDelete]);

  // Handle mouse move
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging && dragAnnotation && dragStart) {
      // Dragging annotation: update position
      const point = screenToPage(e.clientX, e.clientY);
      const deltaX = point.x - dragStart.x;
      const deltaY = point.y - dragStart.y;
      
      const newBbox = {
        ...dragAnnotation.bbox,
        x: dragAnnotation.bbox.x + deltaX,
        y: dragAnnotation.bbox.y + deltaY,
      };
      
      onUpdate(dragAnnotation.id, { bbox: newBbox });
      return;
    }
    
    if (isPanning && panStart && onPan) {
      // Pan tool: update view position
      const deltaX = e.clientX - panStart.x;
      const deltaY = e.clientY - panStart.y;
      onPan(deltaX, deltaY);
      setPanStart({ x: e.clientX, y: e.clientY });
      return;
    }
    
    if (!isDrawing || !drawStart) return;
    
    const point = screenToPage(e.clientX, e.clientY);
    setDrawCurrent(point);
  }, [isDragging, dragAnnotation, dragStart, onUpdate, isPanning, panStart, onPan, isDrawing, drawStart, screenToPage]);

  // Handle mouse up - create annotation or stop panning
  const handleMouseUp = useCallback(() => {
    console.log('🖱️ [AnnotationLayer] Mouse up - isPanning:', isPanning, 'isDrawing:', isDrawing, 'isDragging:', isDragging);
    
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
      console.log('❌ [AnnotationLayer] Not drawing or missing points');
      setIsDrawing(false);
      return;
    }

    const bbox: BBox = {
      x: Math.min(drawStart.x, drawCurrent.x),
      y: Math.min(drawStart.y, drawCurrent.y),
      width: Math.abs(drawCurrent.x - drawStart.x),
      height: Math.abs(drawCurrent.y - drawStart.y),
    };

    console.log('🎨 [AnnotationLayer] Creating annotation with tool:', activeTool, 'bbox:', bbox);
    
    // Create annotation based on active tool
        if (activeTool === 'text') {
          // Text annotation already created on mouse down, skip here
          return;
        } else if (activeTool === 'highlight') {
      if (bbox.width < 10 || bbox.height < 10) {
        setIsDrawing(false);
        return;
      }
      const now = Date.now();
      const annotation: Annotation = {
        id: `ann-${now}-${Math.random().toString(36).slice(2, 9)}`,
        type: 'highlight',
        pageId,
        bbox,
        opacity: 0.3,
        style: {
          fill: '#FFFF00',
        },
        createdAt: now,
        modifiedAt: now,
      } as any;
      onCreate(annotation);
    } else if (activeTool === 'rect' || activeTool === 'ellipse') {
      if (bbox.width < 10 || bbox.height < 10) {
        setIsDrawing(false);
        return;
      }
      const now = Date.now();
      const annotation: Annotation = {
        id: `ann-${now}-${Math.random().toString(36).slice(2, 9)}`,
        type: activeTool,
        pageId,
        bbox,
        style: {
          stroke: '#000000',
          strokeWidth: 2,
          fill: 'transparent',
        },
        createdAt: now,
        modifiedAt: now,
      } as any;
      onCreate(annotation);
        } else if (activeTool === 'arrow') {
          if (bbox.width < 10 || bbox.height < 10) {
            setIsDrawing(false);
            return;
          }
          const now = Date.now();
          const annotation: Annotation = {
            id: `ann-${now}-${Math.random().toString(36).slice(2, 9)}`,
            type: 'arrow',
            pageId,
            bbox,
            startPoint: { x: drawStart.x, y: drawStart.y },
            endPoint: { x: drawCurrent.x, y: drawCurrent.y },
            arrowHeadSize: 10,
            style: {
              stroke: '#000000',
              strokeWidth: 2,
            },
            createdAt: now,
            modifiedAt: now,
          } as any;
          onCreate(annotation);
        } else if (activeTool === 'line') {
          if (bbox.width < 10 || bbox.height < 10) {
            setIsDrawing(false);
            return;
          }
          const now = Date.now();
          const annotation: Annotation = {
            id: `ann-${now}-${Math.random().toString(36).slice(2, 9)}`,
            type: 'line',
            pageId,
            bbox,
            startPoint: { x: drawStart.x, y: drawStart.y },
            endPoint: { x: drawCurrent.x, y: drawCurrent.y },
            style: {
              stroke: '#000000',
              strokeWidth: 2,
            },
            createdAt: now,
            modifiedAt: now,
          } as any;
          onCreate(annotation);
        } else if (activeTool === 'star') {
          if (bbox.width < 10 || bbox.height < 10) {
            setIsDrawing(false);
            return;
          }
          const now = Date.now();
          const annotation: Annotation = {
            id: `ann-${now}-${Math.random().toString(36).slice(2, 9)}`,
            type: 'star',
            pageId,
            bbox,
            points: 5,
            innerRadius: 0.4,
            style: {
              stroke: '#000000',
              strokeWidth: 2,
              fill: 'transparent',
            },
            createdAt: now,
            modifiedAt: now,
          } as any;
          onCreate(annotation);
        } else if (activeTool === 'heart') {
          if (bbox.width < 10 || bbox.height < 10) {
            setIsDrawing(false);
            return;
          }
          const now = Date.now();
          const annotation: Annotation = {
            id: `ann-${now}-${Math.random().toString(36).slice(2, 9)}`,
            type: 'heart',
            pageId,
            bbox,
            style: {
              stroke: '#000000',
              strokeWidth: 2,
              fill: 'transparent',
            },
            createdAt: now,
            modifiedAt: now,
          } as any;
          onCreate(annotation);
        } else if (activeTool === 'lightning') {
          if (bbox.width < 10 || bbox.height < 10) {
            setIsDrawing(false);
            return;
          }
          const now = Date.now();
          const annotation: Annotation = {
            id: `ann-${now}-${Math.random().toString(36).slice(2, 9)}`,
            type: 'lightning',
            pageId,
            bbox,
            style: {
              stroke: '#000000',
              strokeWidth: 2,
              fill: 'transparent',
            },
            createdAt: now,
            modifiedAt: now,
          } as any;
          onCreate(annotation);
        }

    setIsDrawing(false);
    setDrawStart(null);
    setDrawCurrent(null);
  }, [isPanning, isDrawing, drawStart, drawCurrent, activeTool, pageId, onCreate]);

  // Render preview while drawing
  const renderDrawPreview = () => {
    if (!isDrawing || !drawStart || !drawCurrent) return null;

    const bbox: BBox = {
      x: Math.min(drawStart.x, drawCurrent.x) * scale,
      y: Math.min(drawStart.y, drawCurrent.y) * scale,
      width: Math.abs(drawCurrent.x - drawStart.x) * scale,
      height: Math.abs(drawCurrent.y - drawStart.y) * scale,
    };

    const commonStyle: React.CSSProperties = {
      position: 'absolute',
      left: bbox.x,
      top: bbox.y,
      width: bbox.width,
      height: bbox.height,
      pointerEvents: 'none',
    };

    if (activeTool === 'highlight') {
      return (
        <div
          style={{
            ...commonStyle,
            backgroundColor: '#FFFF00',
            opacity: 0.3,
            border: '2px dashed #FFA500',
          }}
        />
      );
    } else if (activeTool === 'rect') {
      return (
        <div
          style={{
            ...commonStyle,
            border: '2px dashed #3B82F6',
            backgroundColor: 'transparent',
          }}
        />
      );
    } else if (activeTool === 'ellipse') {
      return (
        <div
          style={{
            ...commonStyle,
            border: '2px dashed #3B82F6',
            backgroundColor: 'transparent',
            borderRadius: '50%',
          }}
        />
      );
    } else if (activeTool === 'arrow') {
      const startX = drawStart.x * scale;
      const startY = drawStart.y * scale;
      const endX = drawCurrent.x * scale;
      const endY = drawCurrent.y * scale;
      
      // Calculate arrow direction and length
      const angle = Math.atan2(endY - startY, endX - startX);
      const length = Math.sqrt((endX - startX) ** 2 + (endY - startY) ** 2);
      
      return (
        <svg
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
          }}
        >
          <line
            x1={startX}
            y1={startY}
            x2={endX}
            y2={endY}
            stroke="#3B82F6"
            strokeWidth="2"
            strokeDasharray="5,5"
          />
          {/* Arrow head */}
          <polygon
            points={`${endX},${endY} ${endX - 10 * Math.cos(angle - Math.PI / 6)},${endY - 10 * Math.sin(angle - Math.PI / 6)} ${endX - 10 * Math.cos(angle + Math.PI / 6)},${endY - 10 * Math.sin(angle + Math.PI / 6)}`}
            fill="#3B82F6"
          />
        </svg>
      );
    }

    return null;
  };

  return (
    <div
      ref={layerRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 50,
        cursor: activeTool === 'select' ? 'default' : 
                activeTool === 'pan' ? 'grab' : 
                activeTool === 'text' ? 'text' :
                activeTool === 'highlight' ? 'crosshair' :
                activeTool === 'rect' ? 'crosshair' :
                activeTool === 'ellipse' ? 'crosshair' :
                activeTool === 'arrow' ? 'crosshair' :
                activeTool === 'eraser' ? 'crosshair' : 'crosshair',
        pointerEvents: 'auto',
        backgroundColor: 'transparent',
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={() => {
        if (isDrawing) {
          setIsDrawing(false);
        }
        if (isPanning) {
          setIsPanning(false);
          setPanStart(null);
        }
        if (isDragging) {
          setIsDragging(false);
          setDragAnnotation(null);
          setDragStart(null);
        }
      }}
    >
      {/* Render existing annotations */}
      {annotations.map((annotation) => {
        const isSelected = selectedAnnotationIds.includes(annotation.id);

        if (annotation.type === 'text') {
          return (
            <div key={annotation.id} style={{ position: 'relative' }}>
              <TextAnnotationComponent
                annotation={annotation as any}
                isSelected={isSelected}
                scale={scale}
                onSelect={() => onSelect(annotation.id)}
                onUpdate={(updates) => onUpdate(annotation.id, updates)}
                onDelete={() => onDelete(annotation.id)}
              />
              {/* Selection border */}
              {isSelected && (
                <div
                  style={{
                    position: 'absolute',
                    left: annotation.bbox.x * scale,
                    top: annotation.bbox.y * scale,
                    width: annotation.bbox.width * scale,
                    height: annotation.bbox.height * scale,
                    border: '2px solid #3B82F6',
                    borderRadius: '4px',
                    pointerEvents: 'none',
                    zIndex: 10,
                  }}
                />
              )}
            </div>
          );
        } else if (annotation.type === 'highlight') {
          return (
            <div key={annotation.id} style={{ position: 'relative' }}>
              <HighlightAnnotationComponent
                annotation={annotation as any}
                isSelected={isSelected}
                scale={scale}
                onSelect={() => onSelect(annotation.id)}
                onUpdate={(updates) => onUpdate(annotation.id, updates)}
                onDelete={() => onDelete(annotation.id)}
              />
              {/* Selection border */}
              {isSelected && (
                <div
                  style={{
                    position: 'absolute',
                    left: annotation.bbox.x * scale,
                    top: annotation.bbox.y * scale,
                    width: annotation.bbox.width * scale,
                    height: annotation.bbox.height * scale,
                    border: '2px solid #3B82F6',
                    borderRadius: '4px',
                    pointerEvents: 'none',
                    zIndex: 10,
                  }}
                />
              )}
            </div>
          );
        } else if (annotation.type === 'rect' || annotation.type === 'ellipse') {
          return (
            <div key={annotation.id} style={{ position: 'relative' }}>
              <ShapeAnnotationComponent
                annotation={annotation as any}
                isSelected={isSelected}
                scale={scale}
                onSelect={() => onSelect(annotation.id)}
                onUpdate={(updates) => onUpdate(annotation.id, updates)}
                onDelete={() => onDelete(annotation.id)}
              />
              {/* Selection border */}
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
            } else if (annotation.type === 'arrow') {
              return (
                <div key={annotation.id} style={{ position: 'relative' }}>
                  <ArrowAnnotationComponent
                    annotation={annotation as any}
                    isSelected={isSelected}
                    scale={scale}
                    onSelect={() => onSelect(annotation.id)}
                    onUpdate={(updates) => onUpdate(annotation.id, updates)}
                    onDelete={() => onDelete(annotation.id)}
                  />
                  {/* Selection border for arrow */}
                  {isSelected && (
                    <div
                      style={{
                        position: 'absolute',
                        left: annotation.bbox.x * scale,
                        top: annotation.bbox.y * scale,
                        width: annotation.bbox.width * scale,
                        height: annotation.bbox.height * scale,
                        border: '2px solid #3B82F6',
                        borderRadius: '4px',
                        pointerEvents: 'none',
                        zIndex: 10,
                      }}
                    />
                  )}
                </div>
              );
            } else if (annotation.type === 'line') {
              return (
                <div key={annotation.id} style={{ position: 'relative' }}>
                  <ShapeAnnotationComponent
                    annotation={annotation as any}
                    isSelected={isSelected}
                    scale={scale}
                    onSelect={() => onSelect(annotation.id)}
                    onUpdate={(updates) => onUpdate(annotation.id, updates)}
                    onDelete={() => onDelete(annotation.id)}
                  />
                  {/* Selection border for line */}
                  {isSelected && (
                    <div
                      style={{
                        position: 'absolute',
                        left: annotation.bbox.x * scale,
                        top: annotation.bbox.y * scale,
                        width: annotation.bbox.width * scale,
                        height: annotation.bbox.height * scale,
                        border: '2px solid #3B82F6',
                        borderRadius: '4px',
                        pointerEvents: 'none',
                        zIndex: 10,
                      }}
                    />
                  )}
                </div>
              );
            } else if (annotation.type === 'star') {
              return (
                <div key={annotation.id} style={{ position: 'relative' }}>
                  <StarAnnotationComponent
                    annotation={annotation as any}
                    isSelected={isSelected}
                    scale={scale}
                    onSelect={() => onSelect(annotation.id)}
                    onUpdate={(updates) => onUpdate(annotation.id, updates)}
                    onDelete={() => onDelete(annotation.id)}
                  />
                  {/* Selection border for star */}
                  {isSelected && (
                    <div
                      style={{
                        position: 'absolute',
                        left: annotation.bbox.x * scale,
                        top: annotation.bbox.y * scale,
                        width: annotation.bbox.width * scale,
                        height: annotation.bbox.height * scale,
                        border: '2px solid #3B82F6',
                        borderRadius: '4px',
                        pointerEvents: 'none',
                        zIndex: 10,
                      }}
                    />
                  )}
                </div>
              );
            } else if (annotation.type === 'heart') {
              return (
                <div key={annotation.id} style={{ position: 'relative' }}>
                  <HeartAnnotationComponent
                    annotation={annotation as any}
                    isSelected={isSelected}
                    scale={scale}
                    onSelect={() => onSelect(annotation.id)}
                    onUpdate={(updates) => onUpdate(annotation.id, updates)}
                    onDelete={() => onDelete(annotation.id)}
                  />
                  {/* Selection border for heart */}
                  {isSelected && (
                    <div
                      style={{
                        position: 'absolute',
                        left: annotation.bbox.x * scale,
                        top: annotation.bbox.y * scale,
                        width: annotation.bbox.width * scale,
                        height: annotation.bbox.height * scale,
                        border: '2px solid #3B82F6',
                        borderRadius: '4px',
                        pointerEvents: 'none',
                        zIndex: 10,
                      }}
                    />
                  )}
                </div>
              );
            } else if (annotation.type === 'lightning') {
              return (
                <div key={annotation.id} style={{ position: 'relative' }}>
                  <LightningAnnotationComponent
                    annotation={annotation as any}
                    isSelected={isSelected}
                    scale={scale}
                    onSelect={() => onSelect(annotation.id)}
                    onUpdate={(updates) => onUpdate(annotation.id, updates)}
                    onDelete={() => onDelete(annotation.id)}
                  />
                  {/* Selection border for lightning */}
                  {isSelected && (
                    <div
                      style={{
                        position: 'absolute',
                        left: annotation.bbox.x * scale,
                        top: annotation.bbox.y * scale,
                        width: annotation.bbox.width * scale,
                        height: annotation.bbox.height * scale,
                        border: '2px solid #3B82F6',
                        borderRadius: '4px',
                        pointerEvents: 'none',
                        zIndex: 10,
                      }}
                    />
                  )}
                </div>
              );
            }

        return null;
      })}

      {/* Draw preview */}
      {renderDrawPreview()}
    </div>
  );
}

