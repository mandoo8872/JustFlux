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
  // PDF.js의 getViewport({ scale: 1.0 })은 이미 CSS 픽셀 단위의 크기를 반환하므로
  // 추가적인 DPI 변환 없이 scale만 적용 (PageView와 동일한 방식)
  const displayWidth = page.width * scale;
  const displayHeight = page.height * scale;

  return (
    <div
      className="relative flex items-center justify-center bg-white shadow-2xl rounded-lg"
      style={{
        width: `${displayWidth}px`,
        height: `${displayHeight}px`,
        minWidth: `${displayWidth}px`,
        minHeight: `${displayHeight}px`,
        backgroundColor: '#FFFFFF',
        border: '1px solid #e5e7eb',
        pointerEvents: 'none'
      }}
    />
  );
}

