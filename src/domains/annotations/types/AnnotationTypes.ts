/**
 * Annotation Types - 주석 타입 정의
 * 확장 가능한 주석 시스템을 위한 기본 타입들
 */

export interface BaseAnnotationComponent {
  annotation: any;
  isSelected: boolean;
  isHovered: boolean;
  isDragging?: boolean;
  scale: number;
  onSelect: () => void;
  onUpdate: (updates: any) => void;
  onDelete: () => void;
  onPointerDown?: (e: React.PointerEvent) => void;
  onHover?: () => void;
  onHoverEnd?: () => void;
  onDragStart?: (annotation: any, startPos: { x: number; y: number }) => void;
}

export interface AnnotationRenderer {
  render: (props: BaseAnnotationComponent) => React.ReactElement;
  validate: (annotation: any) => boolean;
  getDefaultProps: () => any;
}

export interface AnnotationRegistry {
  register: (type: string, renderer: AnnotationRenderer) => void;
  getRenderer: (type: string) => AnnotationRenderer | null;
  getSupportedTypes: () => string[];
  validate: (type: string, annotation: any) => boolean;
}

export type AnnotationComponentProps = BaseAnnotationComponent & {
  annotation: any;
};
