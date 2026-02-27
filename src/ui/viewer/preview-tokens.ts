/**
 * Preview Tokens — 드로잉 프리뷰 시각 상수
 *
 * canvas-design 철학: 모든 시각적 결정은 중앙 관리되어야 하며,
 * 일관된 색상 체계가 장인 수준의 정밀함을 보장한다.
 */

// ── 프리뷰 스트로크 색상 ──
export const PREVIEW = {
    /** 도형 프리뷰 (사각형, 원, 둥근사각형) */
    SHAPE_STROKE: '#3B82F6',
    /** 화살표/직선 프리뷰 */
    LINE_STROKE: '#3B82F6',
    /** 별/특수 도형 프리뷰 */
    SPECIAL_STROKE: '#F59E0B',
    /** 형광펜 배경 */
    HIGHLIGHT_BG: '#FFFF00',
    /** 형광펜 테두리 */
    HIGHLIGHT_BORDER: '#FFA500',
    /** 화살촉 채우기 */
    ARROW_FILL: '#3B82F6',

    /** 프리뷰 스트로크 두께 */
    STROKE_WIDTH: 2,
    /** 점선 패턴 */
    DASH_ARRAY: '6,4',
    /** 프리뷰 투명도 (형광펜) */
    HIGHLIGHT_OPACITY: 0.3,
} as const;

// ── 줌 레벨별 엘리베이션 ──
export function getCanvasElevation(zoom: number): string {
    if (zoom < 0.5) return '0 4px 12px rgba(0,0,0,0.08)';
    if (zoom < 1.0) return '0 8px 24px rgba(0,0,0,0.10)';
    if (zoom < 2.0) return '0 12px 36px rgba(0,0,0,0.12)';
    return '0 16px 48px rgba(0,0,0,0.15)';
}
