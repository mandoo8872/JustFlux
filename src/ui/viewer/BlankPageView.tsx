/**
 * BlankPageView Component - 빈 페이지 프레임 렌더링
 * PDF가 없는 빈 페이지를 위한 프레임을 표시합니다.
 */

import type { Page } from '../../core/model/types';

interface BlankPageViewProps {
  page: Page;
  scale: number;
}

export function BlankPageView({ page, scale }: BlankPageViewProps) {
  // PDF 포인트를 픽셀로 변환
  // PDF 포인트는 1/72 인치이고, 일반적인 화면 DPI는 96이므로
  // 1pt = 96/72 = 4/3 px
  // scale을 적용하면: displaySize = pageSize * scale * (96/72)
  const ptToPx = 96 / 72; // 1.333...
  const displayWidth = page.width * scale * ptToPx;
  const displayHeight = page.height * scale * ptToPx;

  return (
    <div
      className="relative flex items-center justify-center bg-white shadow-2xl rounded-lg"
      style={{
        width: `${displayWidth}px`,
        height: `${displayHeight}px`,
        minWidth: `${displayWidth}px`,
        minHeight: `${displayHeight}px`,
        border: '1px solid #e5e7eb',
        pointerEvents: 'none'
      }}
    >
      {/* 빈 페이지 표시 */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: '#9ca3af',
          fontSize: '14px',
          fontFamily: 'sans-serif',
          opacity: 0.5
        }}
      >
        빈 페이지
      </div>
    </div>
  );
}

