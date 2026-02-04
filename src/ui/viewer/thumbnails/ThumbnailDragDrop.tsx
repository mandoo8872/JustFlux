/**
 * ThumbnailDragDrop - 드래그 앤 드롭 시스템
 * 개선된 드롭 인디케이터 및 리오더링
 */

import React, { useState, useCallback, useRef } from 'react';
import type { Page } from '../../../core/model/types';

interface ThumbnailDragDropProps {
  children: React.ReactNode;
  pages: Page[];
  onReorder: (pageIds: string[]) => void;
}

interface DragState {
  isDragging: boolean;
  draggedIndex: number | null;
  draggedOverIndex: number | null;
}

export function ThumbnailDragDrop({
  children,
  pages,
  onReorder
}: ThumbnailDragDropProps) {
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    draggedIndex: null,
    draggedOverIndex: null,
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  // 드래그 시작
  const handleDragStart = useCallback((event: React.DragEvent, index: number) => {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', index.toString());

    // 드래그 이미지 설정 (커스텀)
    const draggedElement = itemRefs.current.get(index);
    if (draggedElement) {
      event.dataTransfer.setDragImage(draggedElement, 50, 50);
    }

    setDragState({
      isDragging: true,
      draggedIndex: index,
      draggedOverIndex: null,
    });
  }, []);

  // 드래그 중
  const handleDragOver = useCallback((event: React.DragEvent, index: number) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';

    setDragState(prev => ({
      ...prev,
      draggedOverIndex: index
    }));
  }, []);

  // 드래그 리브
  const handleDragLeave = useCallback((event: React.DragEvent) => {
    // 컨테이너 밖으로 나갔을 때만 인디케이터 제거
    const relatedTarget = event.relatedTarget as HTMLElement;
    if (!containerRef.current?.contains(relatedTarget)) {
      setDragState(prev => ({
        ...prev,
        draggedOverIndex: null
      }));
    }
  }, []);

  // 드롭
  const handleDrop = useCallback((event: React.DragEvent, dropIndex: number) => {
    event.preventDefault();

    const draggedIndex = dragState.draggedIndex;
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDragState({
        isDragging: false,
        draggedIndex: null,
        draggedOverIndex: null
      });
      return;
    }

    // 페이지 순서 재정렬
    const newPageIds = [...pages];
    const [draggedPage] = newPageIds.splice(draggedIndex, 1);

    // 드래그된 아이템이 위에서 아래로 이동할 때 인덱스 보정
    const adjustedDropIndex = draggedIndex < dropIndex ? dropIndex : dropIndex;
    newPageIds.splice(adjustedDropIndex, 0, draggedPage);

    onReorder(newPageIds.map(page => page.id));

    setDragState({
      isDragging: false,
      draggedIndex: null,
      draggedOverIndex: null
    });
  }, [dragState.draggedIndex, pages, onReorder]);

  // 드래그 종료
  const handleDragEnd = useCallback(() => {
    setDragState({
      isDragging: false,
      draggedIndex: null,
      draggedOverIndex: null
    });
  }, []);

  // 아이템 ref 설정
  const setItemRef = useCallback((index: number, el: HTMLDivElement | null) => {
    if (el) {
      itemRefs.current.set(index, el);
    } else {
      itemRefs.current.delete(index);
    }
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}
      onDragLeave={handleDragLeave}
    >
      {React.Children.map(children, (child, index) => {
        if (!React.isValidElement(child)) return child;

        const isDragged = dragState.isDragging && dragState.draggedIndex === index;
        const showIndicatorBefore = dragState.isDragging &&
          dragState.draggedOverIndex === index &&
          dragState.draggedIndex !== null &&
          dragState.draggedIndex > index;
        const showIndicatorAfter = dragState.isDragging &&
          dragState.draggedOverIndex === index &&
          dragState.draggedIndex !== null &&
          dragState.draggedIndex < index;

        return (
          <div key={index} style={{ position: 'relative' }}>
            {/* 드롭 인디케이터 - 위 */}
            {showIndicatorBefore && (
              <div
                style={{
                  position: 'absolute',
                  top: '-6px',
                  left: '10%',
                  right: '10%',
                  height: '4px',
                  backgroundColor: '#0078D4',
                  borderRadius: '2px',
                  zIndex: 100,
                  boxShadow: '0 0 8px rgba(0, 120, 212, 0.6)',
                }}
              />
            )}

            <div
              ref={(el) => setItemRef(index, el)}
              draggable
              onDragStart={(event) => handleDragStart(event, index)}
              onDragOver={(event) => handleDragOver(event, index)}
              onDrop={(event) => handleDrop(event, index)}
              onDragEnd={handleDragEnd}
              style={{
                opacity: isDragged ? 0.4 : 1,
                transform: isDragged ? 'scale(0.95)' : 'scale(1)',
                transition: 'all 0.15s ease',
                cursor: 'grab',
              }}
            >
              {child}
            </div>

            {/* 드롭 인디케이터 - 아래 */}
            {showIndicatorAfter && (
              <div
                style={{
                  position: 'absolute',
                  bottom: '-6px',
                  left: '10%',
                  right: '10%',
                  height: '4px',
                  backgroundColor: '#0078D4',
                  borderRadius: '2px',
                  zIndex: 100,
                  boxShadow: '0 0 8px rgba(0, 120, 212, 0.6)',
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
