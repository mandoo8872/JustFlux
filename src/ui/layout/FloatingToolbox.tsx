/**
 * FloatingToolbox Component - 플로팅 도구박스
 * 주석 도구와 스타일 패널을 포함
 */

import { AnnotationToolbox } from '../toolbox/AnnotationToolbox';
import { AnnotationStylePanel } from '../toolbox/AnnotationStylePanel';
import { ZoomControl } from '../viewer/ZoomControl';
import type { SelectionState } from '../../core/model/types';

interface FloatingToolboxProps {
  selection: SelectionState;
  onSetActiveTool: (tool: string) => void;
  onUpdateAnnotationStyle: (style: any) => void;
  document: any;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  onFitView: (mode: 'page' | 'width' | 'height' | 'actual') => void;
}

export function FloatingToolbox({
  selection,
  onSetActiveTool,
  onUpdateAnnotationStyle,
  document,
  zoom,
  onZoomChange,
  onFitView,
}: FloatingToolboxProps) {
  return (
    <div style={{
      position: 'fixed',
      right: '16px',
      top: '80px', // 헤더 아래로 이동
      zIndex: 20,
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      maxHeight: 'calc(100vh - 120px)', // 화면 높이 제한
      overflowY: 'auto' // 스크롤 가능하도록
    }}>
      {/* Zoom Control */}
      <div style={{
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(24px)',
        borderRadius: '16px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        border: '1px solid rgba(59, 130, 246, 0.5)',
        padding: '12px',
        transition: 'box-shadow 0.2s ease-in-out'
      }}>
        <ZoomControl
          zoom={zoom}
          onZoomChange={onZoomChange}
          onFitMode={(mode) => onFitView(mode as 'page' | 'width' | 'height' | 'actual')}
        />
      </div>

      {/* Annotation Tools */}
      <AnnotationToolbox
        activeTool={selection.activeTool}
        onToolChange={onSetActiveTool}
      />

      {/* Style Panel */}
      {selection.selectedAnnotationIds.length > 0 && (
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(24px)',
          borderRadius: '16px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          border: '1px solid rgba(216, 180, 254, 0.5)',
          padding: '12px',
          transition: 'box-shadow 0.2s ease-in-out'
        }}>
          <AnnotationStylePanel
            selectedAnnotations={selection.selectedAnnotationIds.map(id =>
              document?.pages.flatMap((p: any) => p.layers.annotations).find((a: any) => a.id === id)
            ).filter(Boolean) || []}
            onStyleChange={onUpdateAnnotationStyle}
          />
        </div>
      )}
    </div>
  );
}
