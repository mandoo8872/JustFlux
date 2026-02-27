/**
 * RightSidebar Component - 오른쪽 사이드바
 * 객체 선택 시 확장되어 ObjectPropertyPanel 표시
 */

import { AnnotationToolbox } from '../toolbox/AnnotationToolbox';
import { ZoomControl } from '../viewer/ZoomControl';
import { PageNavigator } from '../viewer/PageNavigator';
import { ObjectPropertyPanel } from '../toolbox/ObjectPropertyPanel';
import { MultiSelectPanel } from '../toolbox/MultiSelectPanel';
import { useAnnotationStore } from '../../state/stores/AnnotationStore';
import { usePageStore } from '../../state/stores/PageStore';
import type { ToolType } from '../../core/model/types';
import type { Annotation } from '../../types/annotation';

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
  // Get selected annotation from store
  const { selection, annotations, updateAnnotation, removeAnnotation, cloneAnnotation, bringForward, sendBackward, bringToFront, sendToBack } = useAnnotationStore();
  const { currentPageId: _currentPageId } = usePageStore();

  // Find the selected annotation(s)
  const selectedAnnotationIds = selection.selectedAnnotationIds;
  const isMultiSelect = selectedAnnotationIds.length > 1;

  const selectedAnnotation: Annotation | null = selectedAnnotationIds.length === 1
    ? (annotations.find((a: Annotation) => a.id === selectedAnnotationIds[0]) || null)
    : null;

  const selectedAnnotations: Annotation[] = isMultiSelect
    ? annotations.filter((a: Annotation) => selectedAnnotationIds.includes(a.id))
    : [];

  // Check if panel should be expanded
  const isExpanded = selectedAnnotationIds.length > 0;
  const expandedWidth = 320;

  const selectedAnnotationId = selectedAnnotationIds.length === 1 ? selectedAnnotationIds[0] : null;

  // Handlers for ObjectPropertyPanel
  const handleUpdate = (updates: Partial<Annotation>) => {
    if (selectedAnnotationId) {
      updateAnnotation(selectedAnnotationId, updates);
    }
  };

  const handleDelete = () => {
    if (selectedAnnotationId) {
      removeAnnotation(selectedAnnotationId);
    }
  };

  const handleCopy = () => {
    if (selectedAnnotationId) {
      cloneAnnotation(selectedAnnotationId);
    }
  };

  const handleMoveUp = () => { if (selectedAnnotationId) bringForward(selectedAnnotationId); };
  const handleMoveDown = () => { if (selectedAnnotationId) sendBackward(selectedAnnotationId); };
  const handleMoveToTop = () => { if (selectedAnnotationId) bringToFront(selectedAnnotationId); };
  const handleMoveToBottom = () => { if (selectedAnnotationId) sendToBack(selectedAnnotationId); };

  // Multi-select handlers
  const handleDeleteAll = () => {
    selectedAnnotationIds.forEach(id => removeAnnotation(id));
  };

  const handleCopyAll = () => {
    selectedAnnotationIds.forEach(id => cloneAnnotation(id));
  };

  return (
    <div className="sidebar-panel sidebar-panel--right" style={{
      width: isExpanded ? `${expandedWidth}px` : `${sidebarWidth}px`,
      flexDirection: 'row',
      transition: 'width var(--transition-normal)',
      overflow: 'hidden',
    }}>
      {/* Property Panel Section - 확장 시에만 표시 */}
      {isExpanded && (
        <div style={{
          width: `${expandedWidth - sidebarWidth}px`,
          height: '100%',
          padding: 'var(--space-3)',
          overflowY: 'auto',
          borderRight: '1px solid var(--color-border-light)',
          backgroundColor: 'var(--color-bg-elevated)',
        }}>
          {isMultiSelect ? (
            <MultiSelectPanel
              selectedAnnotations={selectedAnnotations}
              onDeleteAll={handleDeleteAll}
              onCopyAll={handleCopyAll}
            />
          ) : (
            <ObjectPropertyPanel
              selectedAnnotation={selectedAnnotation}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
              onCopy={handleCopy}
              onMoveUp={handleMoveUp}
              onMoveDown={handleMoveDown}
              onMoveToTop={handleMoveToTop}
              onMoveToBottom={handleMoveToBottom}
            />
          )}
        </div>
      )}

      {/* Tools Section - 항상 표시 */}
      <div style={{
        width: `${sidebarWidth}px`,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        padding: 'var(--space-3) var(--space-1)',
        gap: 'var(--space-4)',
        overflowY: 'auto',
      }}>
        {/* Annotation Tools */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'var(--space-1)',
          padding: 'var(--space-2) var(--space-1)',
          backgroundColor: 'var(--color-bg-card)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-border-light)',
          boxShadow: 'var(--shadow-xs)'
        }}>
          <AnnotationToolbox
            activeTool={activeTool}
            onToolChange={onToolChange}
          />
        </div>

        {/* Zoom Controls */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '2px',
          padding: 'var(--space-2) var(--space-1)',
          backgroundColor: 'var(--color-bg-elevated)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-border-light)',
          boxShadow: 'var(--shadow-xs)'
        }}>
          <ZoomControl
            zoom={zoom}
            onZoomChange={onZoomChange}
            onFitMode={(mode) => onFitView(mode as 'page' | 'width' | 'height' | 'actual')}
          />
        </div>

        {/* Page Navigator */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '2px',
          padding: 'var(--space-2) var(--space-1)',
          backgroundColor: 'var(--color-bg-card)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-border-light)',
          boxShadow: 'var(--shadow-xs)'
        }}>
          <PageNavigator
            currentPage={currentPageIndex}
            totalPages={totalPages}
            onPageChange={onPageChange}
          />
        </div>
      </div>
    </div>
  );
}
