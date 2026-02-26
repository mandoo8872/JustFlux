/**
 * AnnotationFactory - 주석 생성 팩토리
 * AnnotationLayer의 if-else 체인을 Registry 패턴으로 대체
 *
 * 새로운 주석 타입 추가 시:
 *   1. types/annotation.ts에 타입 정의
 *   2. 이 파일의 ANNOTATION_CREATORS에 creator를 등록
 *   3. 끝! AnnotationLayer 수정 불필요
 */

import type { Annotation, BBox } from '../../../types/annotation';
import type { ToolType } from '../../../core/model/types';

// ── Creator 인터페이스 ────────────────────────

export interface DrawPoints {
  start: { x: number; y: number };
  current: { x: number; y: number };
}

export interface CreateAnnotationParams {
  pageId: string;
  bbox: BBox;
  points: DrawPoints;
}

/**
 * 각 도구 타입별 주석 생성자.
 * `null`을 반환하면 "유효하지 않은 드로잉"으로 간주하여 무시된다.
 */
type AnnotationCreator = (params: CreateAnnotationParams) => Annotation | null;

// ── 공통 유틸 ────────────────────────────────

function generateId(): string {
  const now = Date.now();
  return `ann-${now}-${Math.random().toString(36).slice(2, 9)}`;
}

function timestamps() {
  const now = Date.now();
  return { createdAt: now, modifiedAt: now };
}

/** bbox가 최소 크기(10px)를 초과하는지 검사 */
function isMinSize(bbox: BBox, min = 10): boolean {
  return bbox.width >= min && bbox.height >= min;
}

// ── 도구별 Creator 레지스트리 ─────────────────

const ANNOTATION_CREATORS: Record<string, AnnotationCreator> = {
  // ─── Text (즉시 생성, mouseDown 시) ───
  text: ({ pageId, points }) => ({
    id: generateId(),
    type: 'text',
    pageId,
    bbox: { x: points.start.x, y: points.start.y, width: 200, height: 40 },
    content: '',
    style: {
      fontFamily: 'sans-serif',
      fontSize: 16,
      stroke: '#000000',
      strokeWidth: 1,
    },
    ...timestamps(),
  } as Annotation),

  // ─── Highlight ───
  highlight: ({ pageId, bbox }) => {
    if (!isMinSize(bbox)) return null;
    return {
      id: generateId(),
      type: 'highlight',
      pageId,
      bbox,
      content: '',
      opacity: 0.3,
      style: { fill: '#FFFF00', opacity: 0.3 },
      ...timestamps(),
    } as Annotation;
  },

  // ─── Rectangle ───
  rectangle: ({ pageId, bbox }) => {
    if (!isMinSize(bbox)) return null;
    return {
      id: generateId(),
      type: 'rectangle',
      pageId,
      bbox,
      style: { stroke: '#000000', strokeWidth: 1, fill: 'transparent' },
      ...timestamps(),
    } as Annotation;
  },

  // ─── Rounded Rectangle ───
  roundedRect: ({ pageId, bbox }) => {
    if (!isMinSize(bbox)) return null;
    return {
      id: generateId(),
      type: 'roundedRect',
      pageId,
      bbox,
      cornerRadius: 20,
      style: { stroke: '#000000', strokeWidth: 1, fill: 'transparent' },
      ...timestamps(),
    } as Annotation;
  },

  // ─── Ellipse ───
  ellipse: ({ pageId, bbox }) => {
    if (!isMinSize(bbox)) return null;
    return {
      id: generateId(),
      type: 'ellipse',
      pageId,
      bbox,
      style: { stroke: '#000000', strokeWidth: 1, fill: 'transparent' },
      ...timestamps(),
    } as Annotation;
  },

  // ─── Arrow ───
  arrow: ({ pageId, bbox, points }) => {
    if (!isMinSize(bbox)) return null;
    return {
      id: generateId(),
      type: 'arrow',
      pageId,
      bbox,
      startPoint: { x: points.start.x, y: points.start.y },
      endPoint: { x: points.current.x, y: points.current.y },
      arrowHeadSize: 10,
      style: { stroke: '#000000', strokeWidth: 1 },
      ...timestamps(),
    } as Annotation;
  },

  // ─── Star ───
  star: ({ pageId, bbox }) => {
    if (!isMinSize(bbox)) return null;
    return {
      id: generateId(),
      type: 'star',
      pageId,
      bbox,
      numPoints: 5,
      innerRadius: 0.4,
      style: { stroke: '#000000', strokeWidth: 1, fill: '#FFD700' },
      ...timestamps(),
    } as Annotation;
  },

  // ─── Lightning ───
  lightning: ({ pageId, bbox }) => {
    if (!isMinSize(bbox)) return null;
    return {
      id: generateId(),
      type: 'lightning',
      pageId,
      bbox,
      style: { stroke: '#000000', strokeWidth: 1, fill: 'transparent' },
      ...timestamps(),
    } as Annotation;
  },
};

// ── 공개 API ─────────────────────────────────

/**
 * 도구 타입에 대한 creator가 등록되어 있는지 확인
 */
export function hasCreator(tool: ToolType): boolean {
  return tool in ANNOTATION_CREATORS;
}

/**
 * 드래그 완료 후 (mouseUp) 주석을 생성한다.
 * text 도구는 mouseDown에서 즉시 생성하므로, mouseUp에서는 호출하지 않는다.
 */
export function createAnnotationFromDraw(
  tool: ToolType,
  params: CreateAnnotationParams
): Annotation | null {
  const creator = ANNOTATION_CREATORS[tool];
  if (!creator) return null;
  return creator(params);
}

/**
 * 즉시 생성 도구인지 여부 (mouseDown 시 생성)
 */
export function isImmediateCreateTool(tool: ToolType): boolean {
  return tool === 'text';
}

/**
 * 드로잉이 가능한 도구 목록
 */
export const DRAWING_TOOLS: readonly string[] = [
  'text', 'highlight', 'highlighter', 'rectangle', 'roundedRect', 'ellipse',
  'arrow', 'star', 'lightning', 'brush',
] as const;

/**
 * 외부에서 커스텀 creator를 등록 (확장용)
 */
export function registerAnnotationCreator(
  toolType: string,
  creator: AnnotationCreator
): void {
  ANNOTATION_CREATORS[toolType] = creator;
}
