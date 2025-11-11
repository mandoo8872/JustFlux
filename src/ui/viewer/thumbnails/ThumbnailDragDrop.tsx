/**
 * ThumbnailDragDrop - 드래그 앤 드롭 시스템
 * 확장 가능한 드래그 앤 드롭 구현
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
  dragStartY: number;
  dragOffset: number;
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
    dragStartY: 0,
    dragOffset: 0
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const dragPreviewRef = useRef<HTMLDivElement>(null);

  // 드래그 시작
  const handleDragStart = useCallback((event: React.DragEvent, index: number) => {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', index.toString());
    
    setDragState(prev => ({
      ...prev,
      isDragging: true,
      draggedIndex: index,
      dragStartY: event.clientY
    }));

    // 드래그 프리뷰 설정
    if (dragPreviewRef.current) {
      event.dataTransfer.setDragImage(dragPreviewRef.current, 0, 0);
    }
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

  // 드롭
  const handleDrop = useCallback((event: React.DragEvent, dropIndex: number) => {
    event.preventDefault();
    
    const draggedIndex = dragState.draggedIndex;
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDragState(prev => ({
        ...prev,
        isDragging: false,
        draggedIndex: null,
        draggedOverIndex: null
      }));
      return;
    }

    // 페이지 순서 재정렬
    const newPageIds = [...pages];
    const [draggedPage] = newPageIds.splice(draggedIndex, 1);
    newPageIds.splice(dropIndex, 0, draggedPage);
    
    onReorder(newPageIds.map(page => page.id));

    setDragState(prev => ({
      ...prev,
      isDragging: false,
      draggedIndex: null,
      draggedOverIndex: null
    }));
  }, [dragState.draggedIndex, pages, onReorder]);

  // 드래그 종료
  const handleDragEnd = useCallback(() => {
    setDragState(prev => ({
      ...prev,
      isDragging: false,
      draggedIndex: null,
      draggedOverIndex: null
    }));
  }, []);

  // 드래그 프리뷰 렌더링
  const renderDragPreview = useCallback(() => {
    if (!dragState.isDragging || dragState.draggedIndex === null) {
      return null;
    }

    const draggedPage = pages[dragState.draggedIndex];
    if (!draggedPage) return null;

    return (
      <div
        ref={dragPreviewRef}
        style={{
          position: 'absolute',
          top: -1000,
          left: -1000,
          width: 200,
          height: 120,
          backgroundColor: '#fff',
          border: '2px solid #007bff',
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          pointerEvents: 'none'
        }}
      >
        페이지 {dragState.draggedIndex + 1}
      </div>
    );
  }, [dragState.isDragging, dragState.draggedIndex, pages]);

  // 드롭 인디케이터 렌더링
  const renderDropIndicator = useCallback(() => {
    if (!dragState.isDragging || dragState.draggedOverIndex === null) {
      return null;
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: dragState.draggedOverIndex * 130 + 10,
          left: 0,
          right: 0,
          height: 2,
          backgroundColor: '#007bff',
          zIndex: 100
        }}
      />
    );
  }, [dragState.isDragging, dragState.draggedOverIndex]);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%'
      }}
    >
      {React.Children.map(children, (child, index) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, {
            draggable: true,
            onDragStart: (event: React.DragEvent) => handleDragStart(event, index),
            onDragOver: (event: React.DragEvent) => handleDragOver(event, index),
            onDrop: (event: React.DragEvent) => handleDrop(event, index),
            onDragEnd: handleDragEnd,
            style: {
              ...(child.props as any).style,
              opacity: dragState.isDragging && dragState.draggedIndex === index ? 0.5 : 1,
              transform: dragState.isDragging && dragState.draggedIndex === index 
                ? 'scale(1.05)' 
                : 'scale(1)',
              transition: 'all 0.2s ease'
            }
          });
        }
        return child;
      })}
      
      {/* 드래그 프리뷰 */}
      {renderDragPreview()}
      
      {/* 드롭 인디케이터 */}
      {renderDropIndicator()}
    </div>
  );
}
