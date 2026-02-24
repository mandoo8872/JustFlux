/**
 * BottomControls Component - 하단 컨트롤
 * 페이지 네비게이터만 포함 (줌 컨트롤은 플로팅 툴바로 이동)
 */

import { PageNavigator } from '../viewer/PageNavigator';

interface BottomControlsProps {
  currentPageIndex: number;
  totalPages: number;
  onPageChange: (index: number) => void;
}

export function BottomControls({
  currentPageIndex,
  totalPages,
  onPageChange,
}: BottomControlsProps) {
  return (
    <div style={{
      position: 'sticky',
      bottom: 0,
      zIndex: 10,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '12px 16px',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(8px)',
      borderTop: '1px solid rgba(229, 231, 235, 0.5)',
      boxShadow: '0 -2px 8px rgba(0, 0, 0, 0.1)'
    }}>
      {/* Page Navigator */}
      <PageNavigator
        currentPage={currentPageIndex}
        totalPages={totalPages}
        onPageChange={onPageChange}
      />
    </div>
  );
}
