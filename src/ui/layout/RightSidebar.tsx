/**
 * RightSidebar Component - 오른쪽 사이드바
 * Adobe Acrobat Reader 스타일: 도구, 확대/축소, 페이지 내비게이터를 모두 포함
 */

import { AnnotationToolbox } from '../toolbox/AnnotationToolbox';
import { ZoomControl } from '../viewer/ZoomControl';
import { PageNavigator } from '../viewer/PageNavigator';
import type { ToolType } from '../../core/model/types';

interface RightSidebarProps {
  activeTool: ToolType;
  onToolChange: (tool: ToolType) => void;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  onFitView: (mode: 'page' | 'width' | 'height' | 'actual') => void;
  currentPageIndex: number;
  totalPages: number;
  onPageChange: (index: number) => void;
  sidebarWidth: number;
  isCollapsed: boolean;
  onToggle: () => void;
}

export function RightSidebar({
  activeTool,
  onToolChange,
  zoom,
  onZoomChange,
  onFitView,
  currentPageIndex,
  totalPages,
  onPageChange,
  sidebarWidth,
  isCollapsed: _isCollapsed,
  onToggle: _onToggle,
}: RightSidebarProps) {
  // 접기 기능 제거 - 항상 표시
  return (
    <div style={{
      position: 'fixed',
      right: 0,
      top: '40px', // Header 높이
      width: `${sidebarWidth}px`,
      height: 'calc(100vh - 40px)',
      backgroundColor: '#F5F5F5',
      borderLeft: '1px solid #D0D0D0',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 30,
      padding: '12px 4px',
      gap: '16px',
      overflowY: 'auto'
    }}>
      {/* Annotation Tools Section - 세로 1열 */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '4px',
        padding: '8px 4px',
        backgroundColor: '#FFFFFF',
        borderRadius: '6px',
        border: '1px solid #E5E5E5',
        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
      }}>
        <AnnotationToolbox
          activeTool={activeTool}
          onToolChange={onToolChange}
        />
      </div>

      {/* Zoom Controls Section - 세로 배치 */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '2px',
        padding: '8px 4px',
        backgroundColor: '#FAFAFA',
        borderRadius: '6px',
        border: '1px solid #E5E5E5',
        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
      }}>
        <ZoomControl
          zoom={zoom}
          onZoomChange={onZoomChange}
          onFitMode={(mode) => onFitView(mode as any)}
        />
      </div>

      {/* Page Navigator Section - 위아래 화살표 */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '2px',
        padding: '8px 4px',
        backgroundColor: '#FFFFFF',
        borderRadius: '6px',
        border: '1px solid #E5E5E5',
        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
      }}>
        <PageNavigator
          currentPage={currentPageIndex}
          totalPages={totalPages}
          onPageChange={onPageChange}
        />
      </div>
    </div>
  );
}

