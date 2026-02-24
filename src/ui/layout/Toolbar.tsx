/**
 * Toolbar Component - Adobe PDF Reader 스타일 상단 툴바
 * 주석 도구들을 상단에 배치
 */

import { AnnotationToolbox } from '../toolbox/AnnotationToolbox';
import { ZoomControl } from '../viewer/ZoomControl';
import type { ToolType } from '../../core/model/types';

interface ToolbarProps {
  activeTool: ToolType;
  onToolChange: (tool: ToolType) => void;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  onFitView: (mode: 'page' | 'width' | 'height' | 'actual') => void;
}

export function Toolbar({
  activeTool,
  onToolChange,
  zoom,
  onZoomChange,
  onFitView,
}: ToolbarProps) {
  return (
    <div style={{
      backgroundColor: '#F5F5F5',
      borderBottom: '1px solid #D0D0D0',
      height: '44px',
      display: 'flex',
      alignItems: 'center',
      paddingLeft: '8px',
      paddingRight: '8px',
      gap: '8px',
      zIndex: 99
    }}>
      {/* Annotation Tools */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        padding: '4px',
        backgroundColor: '#FFFFFF',
        border: '1px solid #D0D0D0',
        borderRadius: '2px'
      }}>
        <AnnotationToolbox
          activeTool={activeTool}
          onToolChange={onToolChange}
        />
      </div>

      {/* Divider */}
      <div style={{ width: '1px', height: '28px', backgroundColor: '#D0D0D0' }} />

      {/* Zoom Controls */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        padding: '4px',
        backgroundColor: '#FFFFFF',
        border: '1px solid #D0D0D0',
        borderRadius: '2px'
      }}>
        <ZoomControl
          zoom={zoom}
          onZoomChange={onZoomChange}
          onFitMode={(mode) => onFitView(mode as 'page' | 'width' | 'height' | 'actual')}
        />
      </div>
    </div>
  );
}

