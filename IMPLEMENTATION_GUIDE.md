# JustFlux v2 - 구현 가이드

이 문서는 JustFlux v2의 남은 4개 핵심 기능을 구현하기 위한 상세 프롬프트를 담고 있습니다.

---

## 📋 목차

1. [PDF 렌더링 + PageView 컴포넌트](#1-pdf-렌더링--pageview-컴포넌트)
2. [벡터 주석 시스템 (Annotation Layer)](#2-벡터-주석-시스템-annotation-layer)
3. [래스터 레이어 시스템 (브러시/지우개)](#3-래스터-레이어-시스템-브러시지우개)
4. [Export 시스템 (PDF/PNG/JPEG)](#4-export-시스템-pdfpngjpeg)
5. [통합 및 마무리](#5-통합-및-마무리)

---

## 1. PDF 렌더링 + PageView 컴포넌트

### 목표
PDF 페이지를 실제로 렌더링하고 표시하는 PageView 컴포넌트를 구현

### 현재 상태
- **구현 완료**: `src/ui/viewer/PageViewer.tsx` 구현됨
- **기능 확장**: 빈 페이지 추가 지원 및 멀티 포맷(MD, TXT, IMG) 로딩 지원
- **최적화**: Canvas 메모리 관리 및 렌더링 성능 최적화 적용됨

### 구현 요구사항

#### 1.1 PageView 컴포넌트 (`src/ui/viewer/PageView.tsx`)
```typescript
// Props 구조
interface PageViewProps {
  pageId: string;
  pdfProxy: PDFDocumentProxy;
  scale: number;
  onPageChange?: (pageNum: number) => void;
}
```

**주요 기능:**
- Canvas 기반 PDF 페이지 렌더링
- `useRef`로 canvas 관리
- `useEffect`로 페이지 변경/스케일 변경 시 재렌더링
- RenderTask 취소 로직 (이전 렌더링 중단)
- 로딩 상태 표시 (스피너)

**구현 포인트:**
```typescript
// RenderTask 취소 패턴
const renderTaskRef = useRef<RenderTask | null>(null);

useEffect(() => {
  if (renderTaskRef.current) {
    renderTaskRef.current.cancel();
  }
  
  // 새 렌더링 시작
  renderTaskRef.current = await renderPage(...);
  
  return () => {
    renderTaskRef.current?.cancel();
  };
}, [pageId, scale]);
```

#### 1.2 Zoom 컨트롤 (`src/ui/viewer/ZoomControl.tsx`)

**버튼 구성:**
- Zoom In (+)
- Zoom Out (-)
- Fit Width
- Fit Page
- Reset (100%)
- 현재 줌 레벨 표시 (예: "125%")

**제약:**
- Min: 25%
- Max: 400%

**Keyboard Shortcuts:**
- `Cmd+Plus`: Zoom In
- `Cmd+Minus`: Zoom Out
- `Cmd+0`: Reset to 100%

#### 1.3 PageNavigator (`src/ui/viewer/PageNavigator.tsx`)

**UI 요소:**
- 현재 페이지 / 전체 페이지 표시 (예: "3 / 10")
- 이전/다음 페이지 버튼
- 페이지 번호 직접 입력 가능 (input field)

**Keyboard Shortcuts:**
- `Arrow Up/Down`: 이전/다음 페이지
- `Home`: 첫 페이지
- `End`: 마지막 페이지

#### 1.4 Shell.tsx 업데이트

**변경사항:**
1. 중앙 뷰어 영역에 `PageView` 컴포넌트 통합
2. `ZoomControl`, `PageNavigator` 배치
3. PDF proxy를 Shell에서 관리 (`useState`)
4. `loadDocument` 성공 시 pdfProxy 저장

```typescript
const [pdfProxy, setPdfProxy] = useState<PDFDocumentProxy | null>(null);

const handleFileSelect = async (file: File) => {
  const { document, pdfProxy } = await loadPdfFile(file);
  setPdfProxy(pdfProxy);
  // ... store 업데이트
};
```

#### 1.5 documentStore.ts 확장

**추가 상태:**
```typescript
interface DocumentStore {
  // ... 기존 상태
  pdfProxy: PDFDocumentProxy | null;
  
  // 액션
  setPdfProxy: (proxy: PDFDocumentProxy | null) => void;
}
```

**Selector 추가:**
```typescript
export const useCurrentPageForRender = () => {
  const document = useDocumentStore(state => state.document);
  const currentPageId = useDocumentStore(state => state.currentPageId);
  // ... 현재 페이지 반환
};
```

#### 1.6 스타일링

**Canvas Container:**
```css
.page-container {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  background: white;
  padding: 2rem;
  max-width: 100%;
}
```

**반응형:**
- 작은 화면: `fit-to-width` 자동 적용
- 큰 화면: 중앙 정렬, max-width 제한

#### 1.7 성능 최적화

**디바운스:**
```typescript
const debouncedScale = useMemo(() => 
  debounce((newScale: number) => {
    requestAnimationFrame(() => {
      renderPage(newScale);
    });
  }, 150),
  []
);
```

**메모리 관리:**
- 이전 renderTask가 있으면 `cancel()` 호출
- Canvas bitmap 메모리 누수 방지
- 페이지 이동 시 이전 canvas clear

### 테스트 체크리스트
- [ ] PDF 파일 로드 → 첫 페이지 자동 렌더링
- [ ] 줌 인/아웃 → 부드러운 렌더링
- [ ] 페이지 전환 → 즉시 반영
- [ ] 큰 PDF (100+ 페이지) 로드 → 성능 문제 없음
- [ ] Keyboard shortcuts 동작

### 참고 파일
- `src/core/pdf/pdfLoader.ts` - `renderPdfPage` 함수
- `src/core/pdf/coordMapper.ts` - 좌표 변환
- `src/state/documentStore.ts` - 상태 관리

---

## 2. 벡터 주석 시스템 (Annotation Layer)

### 목표
PDF 위에 벡터 주석(텍스트, 하이라이트, 도형)을 추가/편집할 수 있는 시스템 구현

### 현재 상태
- **구현 완료**: `AnnotationManager`, `AnnotationRegistry` 등 모듈화 완료
- **버그 수정**: 빈 페이지 렌더링 및 선택 핸들 표시 문제 해결 (2026-02-01)
- **통합**: `Shell.tsx` 및 `PageViewer.tsx`와 완전히 통합되어 작동 중

### 구현 요구사항

#### 2.1 AnnotationLayer 컴포넌트 (`src/ui/viewer/AnnotationLayer.tsx`)

**Props:**
```typescript
interface AnnotationLayerProps {
  annotations: Annotation[];
  pageId: string;
  scale: number;
  onSelect: (annotationId: string | null) => void;
  onUpdate: (annotationId: string, updates: Partial<Annotation>) => void;
  onDelete: (annotationId: string) => void;
}
```

**레이어 구조:**
- `PageView` 위에 오버레이되는 absolute positioned div
- 각 annotation을 절대 위치로 렌더링
- z-index로 레이어 순서 관리

**인터랙션:**
- Click: 선택
- Double-click: 편집 모드 진입
- Drag: 이동
- Drag handles: 리사이즈
- ESC: 선택 해제 / 편집 종료

#### 2.2 Annotation 렌더링 컴포넌트

**TextAnnotation (`src/ui/viewer/annotations/TextAnnotation.tsx`)**
```typescript
interface TextAnnotationProps {
  annotation: TextAnnotation;
  isSelected: boolean;
  isEditing: boolean;
  scale: number;
  onUpdate: (updates: Partial<TextAnnotation>) => void;
}
```

**일반 모드:**
- `div` + `contentEditable=false`
- 스타일 적용: fontSize, fontFamily, color, fontWeight
- 배경: 반투명 흰색 `rgba(255,255,255,0.9)`

**편집 모드:**
- `textarea` 자동 포커스
- Enter 키: 줄바꿈
- ESC: 편집 종료
- Blur: 자동 저장

**HighlightAnnotation (`src/ui/viewer/annotations/HighlightAnnotation.tsx`)**
- 반투명 사각형 (`opacity: 0.3`)
- 색상 옵션: yellow, green, pink, blue
- 클릭으로 색상 변경 (context menu 또는 inspector)

**ShapeAnnotation (`src/ui/viewer/annotations/ShapeAnnotation.tsx`)**
- Rect, Ellipse 렌더링
- SVG 사용
- `stroke`, `fill`, `strokeWidth` 지원
- 선택 시 핸들 표시

#### 2.3 선택/편집 UI

**선택 상태:**
```css
.annotation-selected {
  border: 2px solid #3B82F6;
  outline: 2px solid rgba(59, 130, 246, 0.2);
}
```

**리사이즈 핸들:**
- 8개: 4 corners + 4 edges
- 크기: 8x8px
- 색상: 파란색 (#3B82F6)
- 호버: 커서 변경 (nw-resize, ne-resize 등)

**회전 핸들** (선택 사항):
- 상단 중앙에 배치
- 드래그로 회전

**키보드 액션:**
- `Delete` / `Backspace`: 삭제
- `Arrow keys`: 1px 이동
- `Shift + Arrow keys`: 10px 이동
- `Cmd+D`: 복제

#### 2.4 Toolbox 통합 (`src/ui/toolbox/AnnotationToolbox.tsx`)

**도구 버튼:**
```typescript
const tools = [
  { id: 'select', icon: Cursor, label: '선택' },
  { id: 'text', icon: TextT, label: '텍스트' },
  { id: 'highlight', icon: HighlighterCircle, label: '하이라이트' },
  { id: 'rect', icon: Rectangle, label: '사각형' },
  { id: 'ellipse', icon: Circle, label: '원형' },
  { id: 'arrow', icon: ArrowRight, label: '화살표' },
];
```

**각 도구별 옵션:**
- **Text**: 폰트 선택, 크기 (8-72pt), 색상, 굵기
- **Highlight**: 색상 (4가지 프리셋)
- **Shape**: stroke 색상, fill 색상, 두께 (1-10px)

**현재 활성 도구 표시:**
- 배경색 변경 (`bg-primary-100`)
- 아이콘 색상 강조 (`text-primary-600`)

#### 2.5 Annotation 생성 플로우

**Text 도구:**
1. 캔버스 클릭
2. 기본 텍스트 박스 생성 (`"텍스트 입력"`)
3. 자동으로 편집 모드 진입
4. 사용자가 타이핑

**Highlight 도구:**
1. 마우스 다운 (시작점 기록)
2. 드래그 (bbox 실시간 프리뷰)
3. 마우스 업 (annotation 생성)

**Shape 도구:**
1. 드래그로 bbox 정의
2. 마우스 업 시 shape annotation 생성
3. 기본 스타일 적용

#### 2.6 ObjectInspector 업데이트 (`src/ui/toolbox/ObjectInspector.tsx`)

**표시 정보:**
```typescript
interface InspectorProps {
  annotation: Annotation | null;
  onUpdate: (updates: Partial<Annotation>) => void;
}
```

**입력 필드:**
- Position: X, Y (number input)
- Size: Width, Height (number input)
- Style:
  - 색상 (color picker)
  - 폰트 (select)
  - 크기 (slider)
  - 굵기 (checkbox)
- Opacity: 0-100% (slider)

#### 2.7 Keyboard Shortcuts

**글로벌:**
- `Cmd+Z`: Undo
- `Cmd+Shift+Z`: Redo
- `Delete` / `Backspace`: 삭제
- `Cmd+D`: 복제
- `ESC`: 선택 해제

**선택 시:**
- `Arrow keys`: 미세 이동 (1px)
- `Shift+Arrow`: 큰 이동 (10px)
- `Cmd+C`: 복사 (선택 사항)
- `Cmd+V`: 붙여넣기 (선택 사항)

#### 2.8 레이어 순서 관리

**기본 z-index:**
```typescript
const LAYER_ORDER = {
  highlight: 1,
  image: 2,
  text: 3,
  shape: 4,
  arrow: 5,
};
```

**컨텍스트 메뉴:**
- "맨 앞으로 가져오기" (Bring to Front)
- "맨 뒤로 보내기" (Send to Back)
- "한 단계 앞으로" (Bring Forward)
- "한 단계 뒤로" (Send Backward)

### 성능 최적화

**React.memo:**
```typescript
export const TextAnnotationComponent = React.memo(({ annotation, ... }) => {
  // ...
}, (prev, next) => {
  // Custom comparison
  return prev.annotation.id === next.annotation.id &&
         prev.annotation.modifiedAt === next.annotation.modifiedAt;
});
```

**useMemo for coordinates:**
```typescript
const scaledBBox = useMemo(() => ({
  x: annotation.bbox.x * scale,
  y: annotation.bbox.y * scale,
  width: annotation.bbox.width * scale,
  height: annotation.bbox.height * scale,
}), [annotation.bbox, scale]);
```

**requestAnimationFrame for drag:**
```typescript
const handleMouseMove = useCallback((e: MouseEvent) => {
  requestAnimationFrame(() => {
    const newX = startX + (e.clientX - dragStartX) / scale;
    const newY = startY + (e.clientY - dragStartY) / scale;
    onUpdate({ bbox: { ...bbox, x: newX, y: newY } });
  });
}, []);
```

### 테스트 체크리스트
- [ ] 텍스트 추가 → 편집 → 이동 → 리사이즈
- [ ] 하이라이트 드래그 → 색상 변경
- [ ] 도형 추가 → 스타일 변경
- [ ] Undo/Redo 동작 확인
- [ ] 100개 annotation 추가 → 성능 문제 없음
- [ ] Keyboard shortcuts 동작

---

## 3. 래스터 레이어 시스템 (브러시/지우개)

### 목표
Canvas 기반 래스터 레이어 시스템을 구축하고, 브러시와 지우개 도구 구현

### 현재 상태
- 데이터 모델: `RasterLayer`, `RasterOperation` 타입 정의됨
- 상태 관리: `addRasterLayer`, `updateRasterLayer` 구현됨

### 구현 요구사항

#### 3.1 RasterEngine (`src/core/raster/rasterEngine.ts`)

**핵심 함수:**
```typescript
export interface RasterEngineOptions {
  width: number;
  height: number;
  useOffscreenCanvas?: boolean;
}

export class RasterEngine {
  private canvas: HTMLCanvasElement | OffscreenCanvas;
  private ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
  
  constructor(options: RasterEngineOptions);
  
  applyOperation(operation: RasterOperation): void;
  
  clear(): void;
  
  toDataURL(): string;
  
  fromDataURL(dataUrl: string): Promise<void>;
}
```

**작업 종류:**
- `stroke`: 브러시 스트로크
- `erase`: 지우개
- `blur`: 블러 효과 (선택 사항)
- `fill`: 영역 채우기 (선택 사항)

**브러시 렌더링:**
```typescript
private drawBrushPoint(x: number, y: number, tool: BrushTool) {
  const { size, hardness, opacity, color } = tool;
  
  // Radial gradient for soft brush
  const gradient = this.ctx.createRadialGradient(x, y, 0, x, y, size / 2);
  gradient.addColorStop(0, color);
  gradient.addColorStop(hardness, color);
  gradient.addColorStop(1, 'rgba(0,0,0,0)');
  
  this.ctx.globalAlpha = opacity;
  this.ctx.fillStyle = gradient;
  this.ctx.fillRect(x - size/2, y - size/2, size, size);
}
```

**지우개:**
```typescript
private erasePoint(x: number, y: number, tool: EraseTool) {
  this.ctx.globalCompositeOperation = 'destination-out';
  // ... 브러시와 동일한 렌더링
  this.ctx.globalCompositeOperation = 'source-over';
}
```

#### 3.2 BrushEngine (`src/core/raster/brushEngine.ts`)

**부드러운 곡선 보간:**
```typescript
export function drawSmoothStroke(
  ctx: CanvasRenderingContext2D,
  points: Point[],
  tool: BrushTool
): void {
  if (points.length < 2) return;
  
  // Catmull-Rom spline interpolation
  const smoothPoints = interpolatePoints(points, 4); // 4 points per segment
  
  for (let i = 0; i < smoothPoints.length - 1; i++) {
    const p1 = smoothPoints[i];
    const p2 = smoothPoints[i + 1];
    
    drawBrushSegment(ctx, p1, p2, tool);
  }
}

function interpolatePoints(points: Point[], density: number): Point[] {
  // Catmull-Rom implementation
  // ...
}
```

**Pressure Sensitivity** (선택 사항):
```typescript
interface PressurePoint extends Point {
  pressure: number; // 0-1
}

// Pointer Events API
element.addEventListener('pointermove', (e: PointerEvent) => {
  const point: PressurePoint = {
    x: e.clientX,
    y: e.clientY,
    pressure: e.pressure || 0.5,
  };
  // ...
});
```

#### 3.3 RasterLayer 컴포넌트 (`src/ui/viewer/RasterLayer.tsx`)

**Props:**
```typescript
interface RasterLayerProps {
  rasterLayers: RasterLayer[];
  scale: number;
  activeTool: ToolType | null;
  onStrokeComplete: (operation: RasterOperation) => void;
}
```

**레이어 구조:**
- `PageView` 위에 overlay되는 투명 Canvas
- `pointer-events: auto` (마우스 이벤트 캡처)
- 각 RasterLayer를 순서대로 합성

**이벤트 핸들링:**
```typescript
const handlePointerDown = (e: React.PointerEvent) => {
  setIsDrawing(true);
  const point = screenToCanvas(e);
  setCurrentStroke([point]);
};

const handlePointerMove = (e: React.PointerEvent) => {
  if (!isDrawing) return;
  
  const point = screenToCanvas(e);
  setCurrentStroke(prev => [...prev, point]);
  
  // Real-time preview
  requestAnimationFrame(() => {
    drawPreviewStroke(point);
  });
};

const handlePointerUp = () => {
  setIsDrawing(false);
  
  // Create operation
  const operation: RasterOperation = {
    id: generateId(),
    kind: 'stroke',
    tool: currentTool,
    points: currentStroke,
    timestamp: Date.now(),
  };
  
  onStrokeComplete(operation);
  setCurrentStroke([]);
};
```

#### 3.4 Brush Tool Panel (`src/ui/toolbox/BrushToolPanel.tsx`)

**UI 구조:**
```typescript
interface BrushToolPanelProps {
  tool: BrushTool;
  onChange: (tool: BrushTool) => void;
}
```

**옵션:**
- **Size**: 1-100px (slider)
- **Hardness**: 0-100% (slider)
- **Opacity**: 0-100% (slider)
- **Color**: Color picker (hex input + presets)

**프리셋:**
```typescript
const BRUSH_PRESETS = [
  { name: 'Pencil', size: 2, hardness: 100, opacity: 100 },
  { name: 'Marker', size: 12, hardness: 70, opacity: 80 },
  { name: 'Brush', size: 30, hardness: 30, opacity: 60 },
  { name: 'Airbrush', size: 50, hardness: 0, opacity: 30 },
];
```

#### 3.5 Eraser Tool Panel (`src/ui/toolbox/EraserToolPanel.tsx`)

**옵션:**
- **Size**: 5-200px (slider)
- **Hardness**: 0-100% (slider)

**모드:**
- Pixel erase: 픽셀 단위 삭제
- Layer erase: 전체 레이어 삭제 (버튼)

#### 3.6 RasterLayer 관리

**Layer List UI:**
```typescript
interface LayerListItemProps {
  layer: RasterLayer;
  index: number;
  onToggleVisibility: (id: string) => void;
  onDelete: (id: string) => void;
  onMerge: (ids: string[]) => void;
}
```

**기능:**
- Layer 썸네일 (50x50px preview)
- Layer 이름 (편집 가능)
- 표시/숨김 토글 (눈 아이콘)
- 삭제 버튼
- Drag & drop으로 순서 변경
- "Flatten All Layers" 버튼

**자동 레이어 생성:**
```typescript
const handleFirstStroke = (operation: RasterOperation) => {
  if (currentRasterLayers.length === 0) {
    // Create first layer automatically
    const newLayer = createRasterLayer({
      pageId: currentPageId,
      kind: 'freedraw',
    });
    addRasterLayer(newLayer);
  }
  
  // Add operation to current layer
  updateRasterLayer(currentLayerId, {
    operations: [...layer.operations, operation],
  });
};
```

#### 3.7 성능 최적화

**requestAnimationFrame:**
```typescript
let rafId: number | null = null;

const handlePointerMove = (e: React.PointerEvent) => {
  if (rafId) return; // Skip if already scheduled
  
  rafId = requestAnimationFrame(() => {
    drawStroke(currentStroke);
    rafId = null;
  });
};
```

**Canvas 크기 제한:**
```typescript
const MAX_CANVAS_SIZE = 4096;

if (width > MAX_CANVAS_SIZE || height > MAX_CANVAS_SIZE) {
  const scale = Math.min(
    MAX_CANVAS_SIZE / width,
    MAX_CANVAS_SIZE / height
  );
  width *= scale;
  height *= scale;
}
```

**Offscreen Canvas** (지원 브라우저):
```typescript
const createCanvas = (width: number, height: number) => {
  if (typeof OffscreenCanvas !== 'undefined') {
    return new OffscreenCanvas(width, height);
  }
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
};
```

**Stroke 다운샘플링:**
```typescript
function downsamplePoints(points: Point[], minDistance: number = 5): Point[] {
  if (points.length < 2) return points;
  
  const result = [points[0]];
  let lastPoint = points[0];
  
  for (let i = 1; i < points.length; i++) {
    const distance = Math.hypot(
      points[i].x - lastPoint.x,
      points[i].y - lastPoint.y
    );
    
    if (distance >= minDistance) {
      result.push(points[i]);
      lastPoint = points[i];
    }
  }
  
  return result;
}
```

#### 3.8 메모리 관리

**Canvas → DataURL 저장:**
```typescript
const saveLayerToDataURL = async (layer: RasterLayer) => {
  const canvas = renderLayerToCanvas(layer);
  const dataUrl = canvas.toDataURL('image/png');
  
  updateRasterLayer(layer.id, {
    canvasData: dataUrl,
  });
  
  // Clear operations after saving
  // (keep operations for undo, but mark as "saved")
};
```

**Undo 시 Canvas 복원:**
```typescript
const undoLastStroke = (layer: RasterLayer) => {
  const operations = layer.operations.slice(0, -1);
  
  // Re-render from scratch
  const engine = new RasterEngine({ width, height });
  operations.forEach(op => engine.applyOperation(op));
  
  const dataUrl = engine.toDataURL();
  updateRasterLayer(layer.id, { canvasData: dataUrl, operations });
};
```

#### 3.9 Blur Tool (보너스)

**BlurEngine (`src/core/raster/blurEngine.ts`)**
```typescript
export function applyGaussianBlur(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  strength: number
): void {
  const imageData = ctx.getImageData(
    x - radius,
    y - radius,
    radius * 2,
    radius * 2
  );
  
  const blurred = gaussianBlur(imageData, strength);
  
  ctx.putImageData(blurred, x - radius, y - radius);
}

function gaussianBlur(
  imageData: ImageData,
  sigma: number
): ImageData {
  // Gaussian blur implementation
  // ...
}
```

### UI/UX

**브러시 커서:**
```css
.brush-cursor {
  position: fixed;
  pointer-events: none;
  border: 2px solid rgba(0, 0, 0, 0.5);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  z-index: 9999;
}
```

```typescript
const updateCursorSize = (size: number) => {
  cursorElement.style.width = `${size}px`;
  cursorElement.style.height = `${size}px`;
};
```

**프리뷰:**
- 드래그 중: 투명도 50%로 실시간 표시
- 마우스 업: 100% 불투명도로 확정

**Pressure 시각화:**
- 압력에 따라 브러시 크기 동적 변경
- `size = baseSize * (0.5 + pressure * 0.5)`

### 테스트 체크리스트
- [ ] 브러시로 자유롭게 그리기 → 부드러운 곡선
- [ ] 지우개로 일부 지우기 → 정확한 삭제
- [ ] 브러시 크기/색상 변경 → 즉시 반영
- [ ] Undo → 마지막 stroke 취소
- [ ] 100개 stroke → 성능 저하 없음
- [ ] Export → Canvas가 이미지로 포함됨

### 참고
- Canvas API: `globalCompositeOperation`, `lineCap`, `lineJoin`
- v1의 `AnnotationLayer.tsx`에서 드래그 로직 참고

---

## 4. Export 시스템 (PDF/PNG/JPEG)

### 목표
편집된 문서를 PDF, PNG, JPEG 형식으로 내보낼 수 있는 시스템 구현

### 현재 상태
- v1의 `canvasExport.ts`에 참고할 로직 있음 (`/Users/donghyun/Project/JustFlux/src/utils/canvasExport.ts`)
- `pdf-lib` 라이브러리 설치됨
- `Document.source.originalBytes`에 원본 PDF 바이트 저장됨

### 구현 요구사항

#### 4.1 ExportEngine (`src/core/io/exportEngine.ts`)

**메인 함수:**
```typescript
export async function exportDocument(
  document: Document,
  pdfProxy: PDFDocumentProxy,
  options: ExportOptions
): Promise<Uint8Array | Blob> {
  const { format, pages } = options;
  
  // Determine which pages to export
  const pageIndices = resolvePageSelection(pages, document.pages.length);
  
  switch (format) {
    case 'pdf':
      return await exportAsPdf(document, pdfProxy, pageIndices, options);
    case 'png':
      return await exportAsPng(document, pdfProxy, pageIndices, options);
    case 'jpeg':
      return await exportAsJpeg(document, pdfProxy, pageIndices, options);
    default:
      throw new Error(`Unsupported format: ${format}`);
  }
}
```

#### 4.2 PDF Export (`src/core/io/pdfExport.ts`)

**두 가지 모드:**

**A. Smart Export (기본)**
```typescript
export async function exportAsPdf(
  document: Document,
  pdfProxy: PDFDocumentProxy,
  pageIndices: number[],
  options: ExportOptions
): Promise<Uint8Array> {
  const originalPdf = await PDFDocument.load(document.source.originalBytes!);
  const newPdf = await PDFDocument.create();
  
  for (const pageIndex of pageIndices) {
    const page = document.pages[pageIndex];
    const hasEdits = page.layers.annotations.length > 0 || 
                     page.layers.rasters.length > 0;
    
    if (hasEdits) {
      // Re-render page with edits
      const canvas = await renderPageToCanvas(page, pdfProxy, options);
      const imageBytes = await canvasToImageBytes(canvas, 'png');
      const image = await newPdf.embedPng(imageBytes);
      
      const pdfPage = newPdf.addPage([canvas.width, canvas.height]);
      pdfPage.drawImage(image, {
        x: 0,
        y: 0,
        width: canvas.width,
        height: canvas.height,
      });
      
      // Add searchable text layer
      if (options.includeSearchableText) {
        addSearchableTextLayer(pdfPage, page.layers.annotations, canvas.height);
      }
    } else {
      // Copy original page
      const [copiedPage] = await newPdf.copyPages(originalPdf, [pageIndex]);
      newPdf.addPage(copiedPage);
    }
  }
  
  return await newPdf.save();
}
```

**B. Full Canvas Export**
```typescript
export async function exportAsPdfFullCanvas(
  document: Document,
  pdfProxy: PDFDocumentProxy,
  options: ExportOptions
): Promise<Uint8Array> {
  const newPdf = await PDFDocument.create();
  
  for (const page of document.pages) {
    const canvas = await renderPageToCanvas(page, pdfProxy, options);
    // ... 모든 페이지를 Canvas로 렌더링
  }
  
  return await newPdf.save();
}
```

**검색 가능한 텍스트 레이어:**
```typescript
function addSearchableTextLayer(
  pdfPage: PDFPage,
  annotations: Annotation[],
  pageHeight: number
) {
  const textAnnotations = annotations.filter(a => a.type === 'text') as TextAnnotation[];
  
  for (const text of textAnnotations) {
    pdfPage.drawText(text.content, {
      x: text.bbox.x,
      y: pageHeight - text.bbox.y - text.bbox.height, // Flip Y
      size: text.style?.fontSize || 16,
      color: rgb(0, 0, 0),
      opacity: 0, // Invisible but searchable
    });
  }
}
```

#### 4.3 PageRenderer (`src/core/io/pageRenderer.ts`)

**핵심 함수:**
```typescript
export async function renderPageToCanvas(
  page: Page,
  pdfProxy: PDFDocumentProxy,
  options: ExportOptions
): Promise<HTMLCanvasElement> {
  const scale = options.dpi ? options.dpi / 72 : 2.0;
  
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  
  // 1. Render original PDF
  await renderPdfPage(pdfProxy, page.index, canvas, scale);
  
  // 2. Composite raster layers
  for (const rasterLayer of page.layers.rasters) {
    if (!rasterLayer.visible) continue;
    
    await compositeRasterLayer(ctx, rasterLayer, scale);
  }
  
  // 3. Draw annotations
  for (const annotation of page.layers.annotations) {
    drawAnnotation(ctx, annotation, scale);
  }
  
  return canvas;
}
```

**레이어 합성:**
```typescript
async function compositeRasterLayer(
  ctx: CanvasRenderingContext2D,
  layer: RasterLayer,
  scale: number
) {
  if (!layer.canvasData) return;
  
  const image = new Image();
  image.src = layer.canvasData;
  await new Promise((resolve) => { image.onload = resolve; });
  
  ctx.save();
  ctx.globalAlpha = layer.opacity;
  ctx.globalCompositeOperation = layer.blendMode || 'source-over';
  ctx.drawImage(image, 0, 0);
  ctx.restore();
}
```

**Annotation 그리기:**
```typescript
function drawAnnotation(
  ctx: CanvasRenderingContext2D,
  annotation: Annotation,
  scale: number
) {
  const { x, y, width, height } = scaleBBox(annotation.bbox, scale);
  
  ctx.save();
  
  switch (annotation.type) {
    case 'text':
      const text = annotation as TextAnnotation;
      ctx.font = `${text.style.fontSize * scale}px ${text.style.fontFamily}`;
      ctx.fillStyle = text.style.stroke || '#000000';
      ctx.fillText(text.content, x, y + text.style.fontSize * scale);
      break;
    
    case 'highlight':
      ctx.fillStyle = annotation.style?.fill || '#FFFF00';
      ctx.globalAlpha = annotation.opacity || 0.3;
      ctx.fillRect(x, y, width, height);
      break;
    
    // ... other types
  }
  
  ctx.restore();
}
```

#### 4.4 Image Export (`src/core/io/imageExport.ts`)

**PNG Export:**
```typescript
export async function exportAsPng(
  document: Document,
  pdfProxy: PDFDocumentProxy,
  pageIndices: number[],
  options: ExportOptions
): Promise<Blob | Blob[]> {
  const images: Blob[] = [];
  
  for (const pageIndex of pageIndices) {
    const page = document.pages[pageIndex];
    const canvas = await renderPageToCanvas(page, pdfProxy, options);
    
    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((b) => resolve(b!), 'image/png');
    });
    
    images.push(blob);
  }
  
  if (images.length === 1) {
    return images[0];
  } else {
    // Create ZIP archive
    return await createZipArchive(images, 'pages');
  }
}
```

**JPEG Export:**
```typescript
export async function exportAsJpeg(
  document: Document,
  pdfProxy: PDFDocumentProxy,
  pageIndices: number[],
  options: ExportOptions
): Promise<Blob | Blob[]> {
  const quality = options.quality || 0.9;
  
  // Similar to PNG, but with quality parameter
  canvas.toBlob((b) => resolve(b!), 'image/jpeg', quality);
}
```

**ZIP 생성** (여러 페이지):
```typescript
async function createZipArchive(
  blobs: Blob[],
  prefix: string
): Promise<Blob> {
  // Use JSZip or similar library
  // Or implement manual ZIP format
  const zip = new JSZip();
  
  blobs.forEach((blob, index) => {
    zip.file(`${prefix}_${index + 1}.png`, blob);
  });
  
  return await zip.generateAsync({ type: 'blob' });
}
```

#### 4.5 ExportPanel UI (`src/ui/export/ExportPanel.tsx`)

**Props:**
```typescript
interface ExportPanelProps {
  document: Document;
  pdfProxy: PDFDocumentProxy;
  onClose: () => void;
}
```

**UI 구조:**
```tsx
<div className="export-panel">
  <h2>Export Document</h2>
  
  {/* Format selection */}
  <div className="format-selector">
    <button className={format === 'pdf' ? 'active' : ''} onClick={() => setFormat('pdf')}>
      PDF
    </button>
    <button className={format === 'png' ? 'active' : ''} onClick={() => setFormat('png')}>
      PNG
    </button>
    <button className={format === 'jpeg' ? 'active' : ''} onClick={() => setFormat('jpeg')}>
      JPEG
    </button>
  </div>
  
  {/* Page range */}
  <div className="page-range">
    <label>
      <input type="radio" value="all" checked={range === 'all'} />
      All pages
    </label>
    <label>
      <input type="radio" value="current" checked={range === 'current'} />
      Current page only
    </label>
    <label>
      <input type="radio" value="custom" checked={range === 'custom'} />
      Custom: <input type="text" placeholder="1,3,5-10" />
    </label>
  </div>
  
  {/* Format-specific options */}
  {format === 'pdf' && (
    <label>
      <input type="checkbox" checked={includeSearchableText} />
      Include searchable text
    </label>
  )}
  
  {format === 'png' && (
    <>
      <label>DPI:
        <select value={dpi}>
          <option value="72">72 (Screen)</option>
          <option value="150">150 (Email)</option>
          <option value="300">300 (Print)</option>
          <option value="600">600 (High Quality)</option>
        </select>
      </label>
      <label>
        <input type="checkbox" checked={transparentBackground} />
        Transparent background
      </label>
    </>
  )}
  
  {format === 'jpeg' && (
    <label>Quality: {quality}%
      <input type="range" min="1" max="100" value={quality} />
    </label>
  )}
  
  {/* Filename */}
  <input 
    type="text" 
    value={filename} 
    onChange={(e) => setFilename(e.target.value)}
    placeholder="Enter filename"
  />
  
  {/* Export button */}
  <button onClick={handleExport} disabled={isExporting}>
    {isExporting ? `Exporting... ${progress}%` : 'Export'}
  </button>
  
  {/* Progress bar */}
  {isExporting && (
    <div className="progress-bar">
      <div className="progress-fill" style={{ width: `${progress}%` }} />
    </div>
  )}
</div>
```

#### 4.6 Export Progress

**진행 상태:**
```typescript
const [exportStatus, setExportStatus] = useState<{
  phase: 'idle' | 'rendering' | 'compressing' | 'saving' | 'complete';
  currentPage: number;
  totalPages: number;
  progress: number; // 0-100
}>({
  phase: 'idle',
  currentPage: 0,
  totalPages: 0,
  progress: 0,
});
```

**진행률 계산:**
```typescript
const updateProgress = (phase: string, current: number, total: number) => {
  const phaseWeights = {
    rendering: 0.7,    // 70% of time
    compressing: 0.2,  // 20% of time
    saving: 0.1,       // 10% of time
  };
  
  const phaseProgress = (current / total) * 100;
  const totalProgress = phaseProgress * phaseWeights[phase];
  
  setExportStatus({
    phase,
    currentPage: current,
    totalPages: total,
    progress: totalProgress,
  });
};
```

**취소 버튼** (선택 사항):
```typescript
const abortControllerRef = useRef<AbortController | null>(null);

const handleCancel = () => {
  abortControllerRef.current?.abort();
  setIsExporting(false);
};
```

#### 4.7 File Download (`src/utils/fileDownload.ts`)

```typescript
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';
  
  document.body.appendChild(a);
  a.click();
  
  // Cleanup
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}

export function downloadUint8Array(bytes: Uint8Array, filename: string, mimeType: string) {
  const blob = new Blob([bytes], { type: mimeType });
  downloadBlob(blob, filename);
}
```

#### 4.8 Shell.tsx 통합

**Export 버튼:**
```tsx
const [exportModalOpen, setExportModalOpen] = useState(false);

// In header
<button onClick={() => setExportModalOpen(true)}>
  <FloppyDisk size={20} />
  Export
</button>

// Modal
{exportModalOpen && (
  <ExportPanel
    document={document!}
    pdfProxy={pdfProxy!}
    onClose={() => setExportModalOpen(false)}
  />
)}
```

**성공 토스트:**
```typescript
const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

const handleExportComplete = (filename: string) => {
  setToast({
    message: `Successfully exported ${filename}`,
    type: 'success',
  });
  
  setTimeout(() => setToast(null), 3000);
};
```

#### 4.9 v1 코드 재사용

**참고할 로직:**
- `renderExtractedView`: 흰색 배경 + 객체 그리기
- `renderOriginalView`: 원본 PDF + annotations
- 흰색 마스킹: 원본 텍스트 영역 덮기
- Canvas → PNG → PDF 파이프라인

**흰색 마스킹 예제:**
```typescript
// v1의 canvasExport.ts 참고
async function applyWhiteMasking(
  ctx: CanvasRenderingContext2D,
  textAnnotations: TextAnnotation[],
  scale: number
) {
  ctx.fillStyle = 'white';
  
  for (const text of textAnnotations) {
    const padding = 2 * scale;
    ctx.fillRect(
      text.bbox.x * scale - padding,
      text.bbox.y * scale - padding,
      text.bbox.width * scale + padding * 2,
      text.bbox.height * scale + padding * 2
    );
  }
}
```

#### 4.10 에러 처리

**Export 실패:**
```typescript
try {
  const result = await exportDocument(document, pdfProxy, options);
  downloadBlob(result, filename);
  showToast('Export successful!', 'success');
} catch (error) {
  console.error('Export failed:', error);
  showToast(`Export failed: ${error.message}`, 'error');
  
  // Fallback: try with lower quality
  if (error.message.includes('memory')) {
    const confirmed = confirm('Not enough memory. Try with lower quality?');
    if (confirmed) {
      await exportDocument(document, pdfProxy, { ...options, scale: 1.0 });
    }
  }
}
```

**대용량 PDF 경고:**
```typescript
if (document.pages.length > 100) {
  const confirmed = confirm(
    'This document has 100+ pages. Export may take several minutes. Continue?'
  );
  if (!confirmed) return;
}
```

**예상 시간 표시:**
```typescript
const estimateExportTime = (pageCount: number, hasRasterLayers: boolean) => {
  const baseTime = pageCount * 0.5; // 0.5s per page
  const rasterPenalty = hasRasterLayers ? 1.5 : 1.0;
  const totalSeconds = Math.ceil(baseTime * rasterPenalty);
  
  return totalSeconds > 60 
    ? `약 ${Math.ceil(totalSeconds / 60)}분 소요 예상`
    : `약 ${totalSeconds}초 소요 예상`;
};
```

### 성능

**Worker 사용** (선택 사항):
```typescript
// src/workers/exportWorker.ts
self.addEventListener('message', async (e) => {
  const { document, options } = e.data;
  
  try {
    const result = await exportDocument(document, options);
    self.postMessage({ success: true, result });
  } catch (error) {
    self.postMessage({ success: false, error: error.message });
  }
});
```

**Chunk 처리:**
```typescript
const CHUNK_SIZE = 10;

for (let i = 0; i < pages.length; i += CHUNK_SIZE) {
  const chunk = pages.slice(i, i + CHUNK_SIZE);
  await processChunk(chunk);
  updateProgress('rendering', i + chunk.length, pages.length);
  
  // Allow UI to update
  await new Promise(resolve => setTimeout(resolve, 0));
}
```

### 테스트 체크리스트
- [ ] 단일 페이지 PDF → PNG 변환 → 성공
- [ ] 100 페이지 PDF → PDF 변환 → 5초 이내
- [ ] Annotation + RasterLayer → 모두 포함됨
- [ ] 검색 가능한 텍스트 → Cmd+F로 확인
- [ ] 대용량 PDF (100MB+) → 경고 표시
- [ ] Export 취소 → 즉시 중단
- [ ] 메모리 부족 → Fallback 동작

### 참고 파일
- `/Users/donghyun/Project/JustFlux/src/utils/canvasExport.ts`
- `/Users/donghyun/Project/JustFlux/src/hooks/usePdfEditor.ts`

---

## 5. 통합 및 마무리

### 목표
위의 4개 기능을 모두 통합하고, 테스트 및 문서화 완료

### 통합 작업

#### 5.1 Shell.tsx 최종 통합

**레이아웃 구조:**
```tsx
<div className="shell">
  <Header />
  
  <div className="main-content">
    <ThumbnailSidebar />
    
    <div className="viewer-area">
      {/* Canvas stack */}
      <div className="canvas-stack">
        <PageView />           {/* z-index: 1 */}
        <RasterLayer />        {/* z-index: 2 */}
        <AnnotationLayer />    {/* z-index: 3 */}
      </div>
      
      <ZoomControl />
      <PageNavigator />
    </div>
    
    <Toolbox />
  </div>
  
  {exportModalOpen && <ExportPanel />}
</div>
```

**Keyboard Shortcuts 통합:**
```typescript
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const cmdKey = isMac ? e.metaKey : e.ctrlKey;
    
    // Global shortcuts
    if (cmdKey && e.key === 'z' && !e.shiftKey) {
      e.preventDefault();
      undo();
    } else if (cmdKey && e.key === 'z' && e.shiftKey) {
      e.preventDefault();
      redo();
    } else if (cmdKey && e.key === 's') {
      e.preventDefault();
      setExportModalOpen(true);
    } else if (cmdKey && e.key === '=') {
      e.preventDefault();
      zoomIn();
    } else if (cmdKey && e.key === '-') {
      e.preventDefault();
      zoomOut();
    } else if (cmdKey && e.key === '0') {
      e.preventDefault();
      resetZoom();
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      if (selectedAnnotationIds.length > 0) {
        e.preventDefault();
        deleteSelectedAnnotations();
      }
    } else if (e.key === 'Escape') {
      clearSelection();
      setActiveTool('select');
    }
    
    // Arrow keys for page navigation
    if (!e.target.matches('input, textarea')) {
      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault();
        previousPage();
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault();
        nextPage();
      } else if (e.key === 'Home') {
        e.preventDefault();
        goToPage(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        goToPage(document.pages.length - 1);
      }
    }
  };
  
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [/* dependencies */]);
```

#### 5.2 documentStore.ts 최적화

**Selector Hooks:**
```typescript
// Optimized selectors to prevent unnecessary re-renders
export const useCurrentPage = () => {
  return useDocumentStore(
    useCallback((state) => {
      if (!state.document || !state.currentPageId) return null;
      return state.document.pages.find(p => p.id === state.currentPageId);
    }, []),
    shallow // shallow comparison
  );
};

export const usePageAnnotations = (pageId: string | null) => {
  return useDocumentStore(
    useCallback((state) => {
      if (!state.document || !pageId) return [];
      const page = state.document.pages.find(p => p.id === pageId);
      return page?.layers.annotations || [];
    }, [pageId])
  );
};

export const usePageRasterLayers = (pageId: string | null) => {
  return useDocumentStore(
    useCallback((state) => {
      if (!state.document || !pageId) return [];
      const page = state.document.pages.find(p => p.id === pageId);
      return page?.layers.rasters || [];
    }, [pageId])
  );
};

export const useActiveTool = () => {
  return useDocumentStore(state => state.selection.activeTool);
};

export const useToolOptions = () => {
  return useDocumentStore(state => state.selection.toolOptions);
};
```

#### 5.3 테스트 작성

**Unit Tests (`src/tests/`)**

**coordMapper.test.ts:**
```typescript
import { describe, it, expect } from 'vitest';
import { pdfToViewport, scaleBBox, bboxContainsPoint } from '../core/pdf/coordMapper';

describe('coordMapper', () => {
  it('should convert PDF bbox to viewport bbox', () => {
    const bbox = { x: 0, y: 0, width: 100, height: 100 };
    const viewport = { /* mock viewport */ };
    
    const result = pdfToViewport(bbox, viewport);
    
    expect(result.width).toBeGreaterThan(0);
    expect(result.height).toBeGreaterThan(0);
  });
  
  it('should scale bbox correctly', () => {
    const bbox = { x: 10, y: 10, width: 50, height: 50 };
    const scaled = scaleBBox(bbox, 2, 2);
    
    expect(scaled.x).toBe(20);
    expect(scaled.width).toBe(100);
  });
  
  it('should check if point is inside bbox', () => {
    const bbox = { x: 0, y: 0, width: 100, height: 100 };
    
    expect(bboxContainsPoint(bbox, 50, 50)).toBe(true);
    expect(bboxContainsPoint(bbox, 150, 50)).toBe(false);
  });
});
```

**factories.test.ts:**
```typescript
import { describe, it, expect } from 'vitest';
import { createDocument, createPage, createTextAnnotation } from '../core/model/factories';

describe('factories', () => {
  it('should create document with correct structure', () => {
    const doc = createDocument({
      name: 'Test Document',
      source: { kind: 'pdf', fileName: 'test.pdf', fileSize: 1024 },
    });
    
    expect(doc.id).toBeDefined();
    expect(doc.name).toBe('Test Document');
    expect(doc.version).toBe(1);
  });
  
  it('should create page with layers', () => {
    const page = createPage({
      docId: 'doc-1',
      index: 0,
      width: 612,
      height: 792,
    });
    
    expect(page.layers.annotations).toEqual([]);
    expect(page.layers.rasters).toEqual([]);
  });
  
  it('should create text annotation with defaults', () => {
    const text = createTextAnnotation({
      pageId: 'page-1',
      bbox: { x: 10, y: 10, width: 100, height: 50 },
      content: 'Hello',
    });
    
    expect(text.type).toBe('text');
    expect(text.content).toBe('Hello');
    expect(text.style.fontSize).toBeDefined();
  });
});
```

**exportDocument.test.ts:**
```typescript
import { describe, it, expect, vi } from 'vitest';
import { exportDocument } from '../core/io/exportEngine';

describe('exportDocument', () => {
  it('should export PDF with annotations', async () => {
    const mockDocument = { /* ... */ };
    const mockPdfProxy = { /* ... */ };
    const options = { format: 'pdf', pages: 'all' };
    
    const result = await exportDocument(mockDocument, mockPdfProxy, options);
    
    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBeGreaterThan(0);
  });
  
  it('should export single page as PNG', async () => {
    const options = { format: 'png', pages: [0], dpi: 300 };
    
    const result = await exportDocument(mockDocument, mockPdfProxy, options);
    
    expect(result).toBeInstanceOf(Blob);
  });
});
```

#### 5.4 README 업데이트

**추가 섹션:**

```markdown
## 🎨 Features

### PDF Viewer
- ✅ Load and view PDF files
- ✅ Zoom: 25% - 400%
- ✅ Fit to Width / Fit to Page
- ✅ Page navigation (thumbnails, keyboard)
- ✅ High-resolution rendering (2x scale)

### Vector Annotations
- ✅ **Text**: Add, edit, style (font, size, color)
- ✅ **Highlight**: 4 color presets
- ✅ **Shapes**: Rectangle, Ellipse
- ✅ **Arrow**: Directional arrows
- ✅ Drag, resize, rotate
- ✅ Layer management (z-order)

### Raster Tools
- ✅ **Brush**: Freehand drawing with pressure support
- ✅ **Eraser**: Pixel-level or layer erase
- ✅ **Blur**: Gaussian blur effect (optional)
- ✅ Configurable size, hardness, opacity
- ✅ Multiple layers per page

### Export
- ✅ **PDF**: Smart export (edited pages only) or full canvas
- ✅ **PNG**: High-resolution (up to 600 DPI)
- ✅ **JPEG**: Adjustable quality
- ✅ Searchable text layer in PDF
- ✅ Batch export (ZIP for multiple pages)

### Undo/Redo
- ✅ JSON Patch-based history
- ✅ 50 actions buffer
- ✅ Works across all operations

## ⌨️ Keyboard Shortcuts

| Action | Mac | Windows/Linux |
|--------|-----|---------------|
| Undo | Cmd+Z | Ctrl+Z |
| Redo | Cmd+Shift+Z | Ctrl+Shift+Z |
| Save/Export | Cmd+S | Ctrl+S |
| Zoom In | Cmd+= | Ctrl+= |
| Zoom Out | Cmd+- | Ctrl+- |
| Reset Zoom | Cmd+0 | Ctrl+0 |
| Delete | Delete | Delete |
| Deselect | Esc | Esc |
| Next Page | ↓ or → | ↓ or → |
| Previous Page | ↑ or ← | ↑ or ← |
| First Page | Home | Home |
| Last Page | End | End |

## 📖 Usage Guide

### Basic Workflow
1. **Open PDF**: Click "Open PDF" or drag & drop
2. **Navigate**: Use thumbnails or arrow keys
3. **Select Tool**: Choose from toolbox (right sidebar)
4. **Edit**: Add annotations or draw with brush
5. **Export**: Click "Export" and choose format

### Adding Text
1. Click "Text" tool
2. Click on page where you want text
3. Type your content
4. Click outside or press ESC to finish

### Drawing
1. Click "Brush" tool
2. Adjust size, color, opacity
3. Draw on the page
4. Use "Eraser" to correct mistakes

### Exporting
1. Click "Export" button
2. Choose format (PDF, PNG, JPEG)
3. Select page range
4. Adjust options (DPI, quality, etc.)
5. Click "Export" to download

## 🏗️ Architecture

### Tech Stack
- **React 19**: UI framework
- **TypeScript**: Type safety
- **Zustand 5**: State management
- **Immer**: Immutable updates
- **PDF.js 5.x**: PDF rendering
- **pdf-lib**: PDF editing/export
- **TailwindCSS 4**: Styling
- **Vite 7**: Build tool
- **Vitest**: Testing

### Data Flow
```
User Action
  → Zustand Action
    → Immer Update
      → History Patch (JSON Patch)
        → Re-render (React)
```

### Performance
- 100+ pages: < 5s load time
- Page switch: < 200ms
- Annotation add: < 50ms
- Export: ~ 0.5s per page

## 🧪 Testing

```bash
# Run tests
npm run test

# Watch mode
npm run test:ui

# Coverage
npm run test -- --coverage
```

## 📝 Development

### Project Structure
```
src/
├── core/          # Core logic (PDF, raster, I/O)
├── state/         # Zustand stores
├── ui/            # React components
├── tests/         # Vitest tests
└── utils/         # Helper functions
```

### Adding a New Annotation Type
1. Add type to `src/core/model/types.ts`
2. Add factory to `src/core/model/factories.ts`
3. Create component in `src/ui/viewer/annotations/`
4. Add to `AnnotationLayer.tsx`
5. Add tool button to `Toolbox.tsx`

## 🔒 Privacy & Security

- ✅ **100% local processing**
- ✅ **No server uploads**
- ✅ **No analytics**
- ✅ **No external API calls**
- ✅ **Works offline**

Your documents never leave your device.

## 📄 License

MIT License - see LICENSE file for details
```

#### 5.5 성능 벤치마크

**목표:**
- 100 페이지 PDF 로딩: < 5초
- 페이지 전환: < 200ms
- Annotation 추가: < 50ms
- Export (100 페이지): < 10초

**측정 방법:**
```typescript
// src/utils/performance.ts
export class PerformanceMonitor {
  private marks: Map<string, number> = new Map();
  
  start(label: string) {
    this.marks.set(label, performance.now());
  }
  
  end(label: string) {
    const start = this.marks.get(label);
    if (!start) return 0;
    
    const duration = performance.now() - start;
    console.log(`[Perf] ${label}: ${duration.toFixed(2)}ms`);
    this.marks.delete(label);
    
    return duration;
  }
}

// Usage
const perf = new PerformanceMonitor();

perf.start('pdf-load');
await loadPdfFile(file);
perf.end('pdf-load');
```

#### 5.6 최종 체크리스트

**기능 체크:**
- [ ] PDF 로드 → 렌더링 → 페이지 전환
- [ ] 텍스트 추가 → 편집 → 이동 → 삭제
- [ ] 하이라이트 추가 → 색상 변경
- [ ] 도형 추가 → 스타일 변경
- [ ] 브러시로 그리기 → 지우개로 지우기
- [ ] 레이어 관리 (표시/숨김, 순서 변경)
- [ ] Undo/Redo 동작
- [ ] Export PDF (원본 + 편집)
- [ ] Export PNG (고해상도)
- [ ] Export JPEG (품질 조정)
- [ ] 100 페이지 PDF 처리
- [ ] Keyboard shortcuts 동작
- [ ] 반응형 UI (모바일 제외)

**품질 체크:**
- [ ] TypeScript 오류 0개
- [ ] ESLint 경고 0개
- [ ] 빌드 성공 (`npm run build`)
- [ ] 테스트 통과 (`npm run test`)
- [ ] 메모리 누수 없음 (DevTools Profiler)
- [ ] Console 에러 없음
- [ ] 접근성 기본 준수 (키보드 네비게이션)

**문서 체크:**
- [ ] README 업데이트 완료
- [ ] 주요 함수에 JSDoc 주석
- [ ] 복잡한 로직에 inline 주석
- [ ] CHANGELOG.md 작성 (선택 사항)

### 완성 조건

**필수:**
1. `npm run build` → 성공
2. `npm run dev` → 브라우저에서 모든 기능 동작
3. 실제 PDF 로드 → 편집 → Export → 결과 확인
4. 위의 체크리스트 80% 이상 완료

**선택 (보너스):**
1. E2E 테스트 (Playwright)
2. PWA 지원 (Service Worker)
3. 다국어 지원 (i18n)
4. 클라우드 동기화 (선택적, 로컬 우선)

---

## 📋 실행 순서 권장

### Phase 1: 기본 뷰어 (1-2일)
1. **프롬프트 1 실행** → PDF 렌더링 + PageView
2. 테스트: PDF 로드 → 페이지 전환 → 줌 인/아웃

### Phase 2: 편집 기능 (2-3일)
1. **프롬프트 2 실행** → 벡터 주석 시스템
2. 테스트: 텍스트/하이라이트/도형 추가 → 편집 → 삭제

### Phase 3: 결과 저장 (1-2일)
1. **프롬프트 4 실행** → Export 시스템
2. 테스트: PDF/PNG/JPEG 내보내기

### Phase 4: 고급 기능 (2-3일, 선택적)
1. **프롬프트 3 실행** → 래스터 레이어 시스템
2. 테스트: 브러시로 그리기 → 지우개

### Phase 5: 통합 및 마무리 (1일)
1. **통합 프롬프트 실행** → 최종 통합
2. 테스트 작성 및 문서화
3. 성능 최적화
4. 최종 QA

**예상 총 소요 시간: 7-11일**

---

## 🎯 성공 기준

이 프로젝트는 다음 조건을 만족할 때 완성으로 간주합니다:

1. ✅ **기능 완전성**: 위 4개 프롬프트의 모든 기능 구현
2. ✅ **성능**: 100 페이지 PDF를 10초 이내에 처리
3. ✅ **품질**: TypeScript 오류 0개, 빌드 성공
4. ✅ **사용성**: 직관적인 UI, 키보드 단축키 지원
5. ✅ **안정성**: 메모리 누수 없음, 크래시 없음
6. ✅ **문서화**: README 완전, 주요 코드에 주석

**최종 테스트:**
실제 100페이지 PDF를 로드하고, 다양한 편집을 수행한 후, PDF로 내보내서 결과를 확인합니다. 모든 편집 내용이 정확히 반영되고, 성능 문제가 없다면 성공입니다!  

---

**Happy Coding! 🚀**

