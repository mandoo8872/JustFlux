/**
 * StatusBar Component - Adobe PDF Reader 스타일 하단 상태바
 */

import { PageNavigator } from '../viewer/PageNavigator';

interface StatusBarProps {
  currentPageIndex: number;
  totalPages: number;
  zoom: number;
  onPageChange: (index: number) => void;
}

export function StatusBar({
  currentPageIndex,
  totalPages,
  zoom,
  onPageChange,
}: StatusBarProps) {
  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      height: '24px',
      backgroundColor: '#F5F5F5',
      borderTop: '1px solid #D0D0D0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingLeft: '8px',
      paddingRight: '8px',
      fontSize: '11px',
      color: '#666666',
      zIndex: 100
    }}>
      {/* Left: Page Navigator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <PageNavigator
          currentPage={currentPageIndex}
          totalPages={totalPages}
          onPageChange={onPageChange}
        />
      </div>

      {/* Right: Zoom Level */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span>{Math.round(zoom * 100)}%</span>
      </div>
    </div>
  );
}

