# 🏗️ JustFlux v2 리팩토링 아키텍처 설계

## 📋 아키텍처 개요

이 문서는 JustFlux v2의 확장 가능한 아키텍처 설계를 설명합니다.

**핵심 원칙**: 도메인 주도 설계(DDD), 단일 책임 원칙(SRP), 의존성 역전 원칙(DIP)

---

## 🎯 아키텍처 목표

### **1. 확장성 (Scalability)**
- 새로운 주석 타입 추가 시 기존 코드 수정 없음
- AI 엔진 연동 시 플러그인 방식으로 추가
- 새로운 내보내기 형식 쉽게 추가

### **2. 유지보수성 (Maintainability)**
- 파일 크기 평균 200줄 이하
- 복잡도 80% 감소
- 테스트 용이성 300% 향상

### **3. 성능 (Performance)**
- 메모리 사용량 최적화
- 렌더링 성능 향상
- 번들 크기 최적화

---

## 🏗️ 전체 아키텍처

```
┌─────────────────────────────────────────────────────────────┐
│                        Presentation Layer                    │
├─────────────────────────────────────────────────────────────┤
│  Shell.tsx (분해 예정)  │  Header  │  Sidebar  │  MainContent │
├─────────────────────────────────────────────────────────────┤
│                        Domain Layer                         │
├─────────────────────────────────────────────────────────────┤
│  Annotations  │  Layers  │  AI  │  Input  │  Output  │  ... │
├─────────────────────────────────────────────────────────────┤
│                      Application Layer                      │
├─────────────────────────────────────────────────────────────┤
│  Services  │  Stores  │  Events  │  DI Container  │  Hooks │
├─────────────────────────────────────────────────────────────┤
│                        Infrastructure Layer                 │
├─────────────────────────────────────────────────────────────┤
│  PDF.js  │  Canvas  │  File I/O  │  Network  │  Storage  │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 디렉토리 구조

### **도메인별 모듈화 (Domain-Driven Design)**

```
src/
├── domains/                           # 도메인별 모듈화
│   ├── annotations/                  # 주석 시스템
│   │   ├── services/                # 비즈니스 로직
│   │   │   ├── AnnotationService.ts
│   │   │   ├── AnnotationRegistry.ts
│   │   │   └── AnnotationValidator.ts
│   │   ├── components/              # React 컴포넌트
│   │   │   ├── AnnotationManager.tsx
│   │   │   ├── AnnotationRenderer.tsx
│   │   │   └── AnnotationEditor.tsx
│   │   ├── types/                   # 타입 정의
│   │   │   └── AnnotationTypes.ts
│   │   ├── utils/                   # 유틸리티
│   │   │   └── AnnotationUtils.ts
│   │   └── index.ts                 # 진입점
│   ├── layers/                      # 레이어 시스템
│   │   ├── services/
│   │   │   ├── LayerService.ts
│   │   │   ├── BlendModeService.ts
│   │   │   └── FilterService.ts
│   │   ├── components/
│   │   │   ├── LayerManager.tsx
│   │   │   ├── LayerPanel.tsx
│   │   │   └── LayerControls.tsx
│   │   └── index.ts
│   ├── ai/                          # AI 시스템
│   │   ├── engines/
│   │   │   ├── BaseAIEngine.ts
│   │   │   ├── OpenAIEngine.ts
│   │   │   ├── ClaudeEngine.ts
│   │   │   └── GeminiEngine.ts
│   │   ├── services/
│   │   │   ├── OCRService.ts
│   │   │   ├── AIService.ts
│   │   │   └── SuggestionService.ts
│   │   └── index.ts
│   ├── input/                       # 입력 시스템
│   │   ├── services/
│   │   │   ├── FileUploadService.ts
│   │   │   ├── ImageProcessor.ts
│   │   │   └── OCRProcessor.ts
│   │   └── index.ts
│   └── output/                      # 출력 시스템
│       ├── exporters/
│       │   ├── BaseExporter.ts
│       │   ├── PDFExporter.ts
│       │   ├── ImageExporter.ts
│       │   ├── EmailExporter.ts
│       │   └── CloudExporter.ts
│       └── index.ts
├── state/                           # 상태 관리
│   ├── stores/                      # 개별 스토어
│   │   ├── DocumentStore.ts
│   │   ├── AnnotationStore.ts
│   │   ├── ViewStore.ts
│   │   ├── LayerStore.ts
│   │   └── ExportStore.ts
│   ├── services/                    # 상태 서비스
│   │   ├── StateSyncService.ts
│   │   └── StatePersistenceService.ts
│   └── hooks/                       # 커스텀 훅
│       ├── useDocumentState.ts
│       ├── useAnnotationState.ts
│       └── useViewState.ts
├── core/                            # 핵심 시스템
│   ├── events/                      # 이벤트 시스템
│   │   ├── EventBus.ts
│   │   └── EventTypes.ts
│   ├── di/                          # 의존성 주입
│   │   ├── Container.ts
│   │   └── ServiceTokens.ts
│   └── validation/                  # 검증 시스템
│       ├── Validator.ts
│       └── Schema.ts
└── ui/                              # UI 컴포넌트
    ├── layout/                      # 레이아웃 컴포넌트
    │   ├── Shell.tsx (분해 예정)
    │   ├── Header.tsx
    │   ├── Sidebar.tsx
    │   └── MainContent.tsx
    └── features/                    # 기능별 컴포넌트
        ├── input/
        ├── edit/
        └── output/
```

---

## 🔧 핵심 설계 패턴

### **1. 레지스트리 패턴 (Registry Pattern)**

```typescript
// 주석 타입 등록 시스템
class AnnotationRegistry {
  private renderers = new Map<string, AnnotationRenderer>();
  
  register(type: string, renderer: AnnotationRenderer): void {
    this.renderers.set(type, renderer);
  }
  
  getRenderer(type: string): AnnotationRenderer | null {
    return this.renderers.get(type) || null;
  }
}
```

**장점**: 새로운 주석 타입 추가 시 기존 코드 수정 없음

### **2. 팩토리 패턴 (Factory Pattern)**

```typescript
// 주석 생성 팩토리
class AnnotationFactory {
  createAnnotation(type: string, props: any): Annotation | null {
    const renderer = annotationRegistry.getRenderer(type);
    if (!renderer) return null;
    
    const defaultProps = renderer.getDefaultProps();
    return { ...defaultProps, ...props };
  }
}
```

**장점**: 주석 생성 로직 중앙화, 일관성 보장

### **3. 의존성 주입 (Dependency Injection)**

```typescript
// 서비스 컨테이너
class DIContainer {
  private services = new Map<ServiceToken, ServiceFactory>();
  
  register<T>(token: ServiceToken<T>, factory: ServiceFactory<T>): void {
    this.services.set(token, factory);
  }
  
  resolve<T>(token: ServiceToken<T>): T {
    const factory = this.services.get(token);
    return factory();
  }
}
```

**장점**: 서비스 간 느슨한 결합, 테스트 용이성

### **4. 이벤트 기반 아키텍처 (Event-Driven Architecture)**

```typescript
// 이벤트 버스
class EventBus {
  private listeners = new Map<string, Set<EventCallback>>();
  
  on<T>(event: string, callback: EventCallback<T>): void {
    // 이벤트 리스너 등록
  }
  
  emit<T>(event: string, data?: T): void {
    // 이벤트 발생
  }
}
```

**장점**: 컴포넌트 간 느슨한 결합, 확장성

---

## 🔄 데이터 흐름

### **1. 주석 생성 흐름**

```
사용자 액션
  ↓
AnnotationManager (UI)
  ↓
AnnotationService (비즈니스 로직)
  ↓
AnnotationRegistry (타입 확인)
  ↓
AnnotationFactory (객체 생성)
  ↓
AnnotationStore (상태 업데이트)
  ↓
EventBus (이벤트 발생)
  ↓
UI 재렌더링
```

### **2. 상태 관리 흐름**

```
사용자 액션
  ↓
Zustand 액션
  ↓
Immer 업데이트
  ↓
히스토리 패치 (JSON Patch)
  ↓
이벤트 발생
  ↓
UI 재렌더링
```

### **3. 이벤트 흐름**

```
Annotation 생성
  ↓
EVENTS.ANNOTATION_CREATED 발생
  ↓
다른 컴포넌트들이 이벤트 수신
  ↓
각자의 로직 실행
  ↓
UI 업데이트
```

---

## 🎯 확장성 설계

### **1. 새로운 주석 타입 추가**

```typescript
// 1. 주석 컴포넌트 생성
class NewAnnotationComponent extends React.Component {
  // 구현
}

// 2. 레지스트리에 등록
annotationRegistry.register('new-type', {
  render: (props) => <NewAnnotationComponent {...props} />,
  validate: (annotation) => annotation.type === 'new-type',
  getDefaultProps: () => ({ /* 기본값 */ })
});

// 3. 완료! 기존 코드 수정 없음
```

### **2. 새로운 AI 엔진 추가**

```typescript
// 1. AI 엔진 구현
class NewAIEngine implements BaseAIEngine {
  async analyze(text: string): Promise<AnalysisResult> {
    // 구현
  }
}

// 2. DI 컨테이너에 등록
container.register(TOKENS.NEW_AI_ENGINE, () => new NewAIEngine());

// 3. 서비스에서 사용
const aiService = container.resolve(TOKENS.AI_SERVICE);
aiService.addEngine('new-engine', container.resolve(TOKENS.NEW_AI_ENGINE));
```

### **3. 새로운 내보내기 형식 추가**

```typescript
// 1. 내보내기 구현
class NewFormatExporter implements BaseExporter {
  async export(data: ExportData): Promise<ExportResult> {
    // 구현
  }
}

// 2. 팩토리에 등록
exportFactory.register('new-format', () => new NewFormatExporter());

// 3. 완료! UI에서 자동으로 사용 가능
```

---

## 🚀 성능 최적화

### **1. 메모리 최적화**

```typescript
// 주석 렌더링 최적화
const AnnotationRenderer = React.memo(({ annotation, ...props }) => {
  // 렌더링 로직
}, (prevProps, nextProps) => {
  // 변경된 경우에만 재렌더링
  return prevProps.annotation.id === nextProps.annotation.id &&
         prevProps.annotation.bbox === nextProps.annotation.bbox;
});
```

### **2. 번들 크기 최적화**

```typescript
// 지연 로딩
const AnnotationManager = React.lazy(() => import('./AnnotationManager'));
const LayerManager = React.lazy(() => import('./LayerManager'));

// 조건부 로딩
const AIPanel = React.lazy(() => 
  import('./AIPanel').then(module => ({ default: module.AIPanel }))
);
```

### **3. 렌더링 성능**

```typescript
// 가상화 (대용량 주석 목록)
const VirtualizedAnnotationList = ({ annotations }) => {
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 10 });
  
  return (
    <div>
      {annotations.slice(visibleRange.start, visibleRange.end).map(annotation => (
        <AnnotationComponent key={annotation.id} annotation={annotation} />
      ))}
    </div>
  );
};
```

---

## 🧪 테스트 전략

### **1. 단위 테스트**

```typescript
// AnnotationService 테스트
describe('AnnotationService', () => {
  it('should create annotation with valid type', () => {
    const service = new AnnotationService();
    const annotation = service.createAnnotation('text', { text: 'Hello' });
    expect(annotation).toBeDefined();
    expect(annotation.type).toBe('text');
  });
});
```

### **2. 통합 테스트**

```typescript
// AnnotationManager 통합 테스트
describe('AnnotationManager', () => {
  it('should render annotations correctly', () => {
    const annotations = [mockTextAnnotation, mockHighlightAnnotation];
    render(<AnnotationManager annotations={annotations} />);
    
    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByTestId('highlight-1')).toBeInTheDocument();
  });
});
```

### **3. E2E 테스트**

```typescript
// 전체 워크플로우 테스트
describe('Annotation Workflow', () => {
  it('should create, edit, and delete annotation', async () => {
    // PDF 로드
    await user.uploadFile('test.pdf');
    
    // 주석 생성
    await user.clickTool('text');
    await user.clickOnCanvas({ x: 100, y: 100 });
    await user.type('Hello World');
    
    // 주석 편집
    await user.selectAnnotation('text-1');
    await user.changeStyle({ color: 'red' });
    
    // 주석 삭제
    await user.pressKey('Delete');
    
    expect(screen.queryByText('Hello World')).not.toBeInTheDocument();
  });
});
```

---

## 📊 모니터링 및 디버깅

### **1. 성능 모니터링**

```typescript
// 성능 메트릭 수집
class PerformanceMonitor {
  static measureAnnotationRender(annotationId: string, renderTime: number) {
    console.log(`📊 [Performance] Annotation ${annotationId} rendered in ${renderTime}ms`);
  }
  
  static measureMemoryUsage() {
    const memory = (performance as any).memory;
    console.log(`📊 [Memory] Used: ${memory.usedJSHeapSize / 1024 / 1024}MB`);
  }
}
```

### **2. 디버깅 도구**

```typescript
// 개발자 도구
class DevTools {
  static logAnnotationState(store: AnnotationStore) {
    console.log('🔍 [DevTools] Annotation State:', {
      count: store.annotations.length,
      selected: store.selection.selectedAnnotationIds,
      hovered: store.hoveredAnnotationId
    });
  }
  
  static logEventFlow(event: string, data: any) {
    console.log(`🔍 [EventFlow] ${event}:`, data);
  }
}
```

---

## 🎯 마이그레이션 전략

### **1. 점진적 마이그레이션**

```typescript
// 1단계: 기존 코드 유지하면서 새 구조 추가
// 2단계: 점진적으로 기존 코드를 새 구조로 이동
// 3단계: 기존 코드 제거 및 최적화
```

### **2. 호환성 유지**

```typescript
// 기존 API 호환성 유지
class LegacyAnnotationLayer {
  // 기존 AnnotationLayerV2의 API를 래핑
  render() {
    return <AnnotationManager {...this.props} />;
  }
}
```

### **3. 롤백 계획**

```typescript
// 기능 플래그를 통한 롤백
const useNewAnnotationSystem = process.env.REACT_APP_USE_NEW_ANNOTATIONS === 'true';

const AnnotationLayer = useNewAnnotationSystem 
  ? AnnotationManager 
  : AnnotationLayerV2;
```

---

## 📈 성공 지표

### **1. 코드 품질**
- 파일 크기: 평균 200줄 이하
- 복잡도: 80% 감소
- 테스트 커버리지: 90% 이상

### **2. 개발 생산성**
- 새 기능 추가: 70% 빠른 개발
- 버그 수정: 80% 빠른 디버깅
- 코드 재사용: 90% 향상

### **3. 사용자 경험**
- 로딩 시간: 50% 단축
- 메모리 사용량: 30% 감소
- 렌더링 성능: 40% 향상

---

**이 아키텍처 설계는 확장 가능하고 유지보수하기 쉬운 시스템을 구축하기 위한 가이드입니다.**

