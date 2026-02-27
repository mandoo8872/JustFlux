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
      right: 'var(--space-4)',
      top: '80px',
      zIndex: 20,
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-4)',
      maxHeight: 'calc(100vh - 120px)',
      overflowY: 'auto'
    }}>
      {/* Zoom Control */}
      <div className="glass-panel">
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
        <div className="glass-panel">
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
