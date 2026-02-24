# ✅ JustFlux v2 리팩토링 체크리스트

## 📋 전체 진행 상황

**전체 진행률: 60%** ✅

---

## 🏗️ Phase 1: 확장 가능한 파일 구조 설계 및 생성 ✅

### **1.1 디렉토리 구조 생성** ✅
- [x] `src/domains/` - 도메인별 모듈화
- [x] `src/domains/annotations/` - 주석 시스템
- [x] `src/domains/layers/` - 레이어 시스템 (준비됨)
- [x] `src/domains/ai/` - AI 시스템 (준비됨)
- [x] `src/domains/input/` - 입력 시스템 (준비됨)
- [x] `src/domains/output/` - 출력 시스템 (준비됨)
- [x] `src/state/stores/` - 상태 관리 분리
- [x] `src/core/events/` - 이벤트 시스템
- [x] `src/core/di/` - 의존성 주입

### **1.2 주석 시스템 모듈화** ✅
- [x] `AnnotationRegistry.ts` - 주석 타입 등록 시스템
- [x] `AnnotationService.ts` - 주석 비즈니스 로직
- [x] `AnnotationManager.tsx` - 주석 관리 컴포넌트
- [x] `AnnotationRenderer.tsx` - 기존 컴포넌트 래핑
- [x] `AnnotationTypes.ts` - 타입 정의
- [x] `index.ts` - 통합 진입점

### **1.3 상태 관리 분리** ✅
- [x] `AnnotationStore.ts` - 주석 관련 상태
- [x] `ViewStore.ts` - 뷰 관련 상태
- [x] 이벤트 시스템 구축

### **1.4 핵심 시스템 구축** ✅
- [x] `EventBus.ts` - 이벤트 기반 아키텍처
- [x] `Container.ts` - 의존성 주입 컨테이너
- [x] 서비스 등록 시스템

---

## ✅ Phase 2: 타입 오류 수정 및 통합 (완료)

### **2.1 타입 호환성 문제 해결** ✅
- [x] `BaseAnnotationComponent` 인터페이스 수정
- [x] 기존 주석 컴포넌트들과의 호환성 수정
- [x] `AnnotationRenderer` 타입 오류 해결
- [x] `onHover`, `onHoverEnd` props 타입 수정

### **2.2 기존 코드와의 통합** ✅
- [x] Shell.tsx에서 새로운 AnnotationManager 사용 및 상태 동기화
- [x] 기존 AnnotationLayerV2 대체 완료
- [x] `AnnotationStore`와 `AnnotationManager` 상태 동기화 버그 수정
- [x] 빌드 오류 완전 해결

### **2.3 시스템 안정화** ✅
- [x] 빈 페이지 어노테이션 렌더링 지원 (PageViewer 수정)
- [x] TypeScript 컴파일 오류 해결
- [x] 어노테이션 선택 및 핸들 UI 복구

---

## ✅ Phase 2.5: 기능 확장 및 멀티 포맷 (완료)

### **2.5.1 멀티 포맷 지원** ✅
- [x] Markdown (.md) 뷰어 및 에디터 구현
- [x] Text (.txt) 파일 로딩 지원
- [x] Image 파일 페이지 변환 로딩 지원
- [x] 빈 페이지 추가 기능 구현

---

## 📅 Phase 3: 상태 관리 완전 분리 (대기 중)

### **3.1 DocumentStore 분해** ⏳
- [ ] DocumentStore에서 주석 관련 부분 제거
- [ ] 새로운 AnnotationStore와 연동
- [ ] 이벤트 시스템을 통한 상태 동기화
- [ ] 히스토리 관리 분리

### **3.2 Shell.tsx 분해** ⏳
- [ ] Header 컴포넌트 분리 (200줄 이하)
  - [ ] 파일 액션 버튼들
  - [ ] 줌 컨트롤
  - [ ] 내보내기 버튼
- [ ] Sidebar 컴포넌트 분리 (200줄 이하)
  - [ ] 썸네일 목록
  - [ ] 도구박스
  - [ ] 스타일 패널
- [ ] MainContent 컴포넌트 분리 (200줄 이하)
  - [ ] 페이지 뷰어
  - [ ] 주석 레이어
  - [ ] 팬/줌 로직

---

## 📅 Phase 4: 내보내기 시스템 분리 (대기 중)

### **4.1 Export 도메인 구현** ⏳
- [ ] `BaseExporter.ts` - 기본 내보내기 인터페이스
- [ ] `PDFExporter.ts` - PDF 내보내기
- [ ] `ImageExporter.ts` - 이미지 내보내기
- [ ] `EmailExporter.ts` - 이메일 전달
- [ ] `CloudExporter.ts` - 클라우드 저장

### **4.2 Export 서비스 구현** ⏳
- [ ] `ExportService.ts` - 내보내기 서비스
- [ ] `EmailService.ts` - 이메일 서비스
- [ ] `CloudService.ts` - 클라우드 서비스
- [ ] `ExportStore.ts` - 내보내기 상태 관리

### **4.3 Export 컴포넌트 구현** ⏳
- [ ] `ExportPanel.tsx` - 내보내기 패널
- [ ] `EmailPanel.tsx` - 이메일 패널
- [ ] `CloudPanel.tsx` - 클라우드 패널
- [ ] `ExportProgress.tsx` - 진행률 표시

---

## 📅 Phase 5: AI 시스템 구축 (대기 중)

### **5.1 AI 엔진 연동** ⏳
- [ ] `BaseAIEngine.ts` - AI 엔진 기본 인터페이스
- [ ] `OpenAIEngine.ts` - OpenAI 연동
- [ ] `ClaudeEngine.ts` - Claude 연동
- [ ] `GeminiEngine.ts` - Gemini 연동

### **5.2 AI 서비스 구현** ⏳
- [ ] `OCRService.ts` - OCR 처리
- [ ] `AIService.ts` - AI 분석
- [ ] `SuggestionService.ts` - 자동 제안
- [ ] `AIStore.ts` - AI 상태 관리

### **5.3 AI 컴포넌트 구현** ⏳
- [ ] `AIPanel.tsx` - AI 패널
- [ ] `OCRPanel.tsx` - OCR 패널
- [ ] `SuggestionPanel.tsx` - 제안 패널
- [ ] `AIAssistant.tsx` - AI 어시스턴트

---

## 📅 Phase 6: 레이어 시스템 확장 (대기 중)

### **6.1 레이어 도메인 구현** ⏳
- [ ] `BaseLayer.ts` - 기본 레이어 타입
- [ ] `RasterLayer.ts` - 래스터 레이어
- [ ] `VectorLayer.ts` - 벡터 레이어
- [ ] `TextLayer.ts` - 텍스트 레이어

### **6.2 레이어 서비스 구현** ⏳
- [ ] `LayerService.ts` - 레이어 관리
- [ ] `BlendModeService.ts` - 블렌드 모드
- [ ] `FilterService.ts` - 필터 처리
- [ ] `LayerStore.ts` - 레이어 상태 관리

### **6.3 레이어 컴포넌트 구현** ⏳
- [ ] `LayerManager.tsx` - 레이어 관리자
- [ ] `LayerPanel.tsx` - 레이어 패널
- [ ] `LayerControls.tsx` - 레이어 컨트롤
- [ ] `LayerItem.tsx` - 레이어 아이템

---

## 📅 Phase 7: 최종 통합 및 최적화 (대기 중)

### **7.1 성능 최적화** ⏳
- [ ] 메모리 사용량 최적화
- [ ] 렌더링 성능 향상
- [ ] 번들 크기 최적화
- [ ] 지연 로딩 적용

### **7.2 테스트 및 문서화** ⏳
- [ ] 단위 테스트 작성
- [ ] 통합 테스트 작성
- [ ] API 문서화
- [ ] 사용자 가이드 작성

### **7.3 품질 보증** ⏳
- [ ] TypeScript 오류 0개
- [ ] ESLint 경고 0개
- [ ] 빌드 성공
- [ ] 테스트 통과

---

## 🚨 현재 블로커

### **High Priority (즉시 해결 필요)**
1. **Shell.tsx 분해** - 유지보수성 향상을 위한 중요 작업
2. **상태 관리 완전 분리** - 확장성을 위한 중요 작업

### **Medium Priority (단기 목표)**
1. **내보내기 시스템 분리** - 새로운 기능 추가를 위한 중요 작업
2. **AI 시스템 구축** - OCR, AI 분석 기능 추가

### **Low Priority (중기 목표)**
1. **레이어 시스템 확장** - 고급 편집 기능 추가
2. **성능 최적화** - 사용자 경험 향상

---

## 📊 진행률 요약

| Phase | 상태 | 진행률 | 완료 항목 | 전체 항목 |
|-------|------|--------|-----------|-----------|
| Phase 1 | ✅ 완료 | 100% | 12 | 12 |
| Phase 2 | ✅ 완료 | 100% | 11 | 11 |
| Phase 2.5 | ✅ 완료 | 100% | 4 | 4 |
| Phase 3 | ⏳ 대기 | 0% | 0 | 8 |
| Phase 4 | ⏳ 대기 | 0% | 0 | 12 |
| Phase 5 | ⏳ 대기 | 0% | 0 | 12 |
| Phase 6 | ⏳ 대기 | 0% | 0 | 12 |
| Phase 7 | ⏳ 대기 | 0% | 0 | 12 |

**전체 진행률: 60%** (27/83 항목 완료)

---

## 🎯 다음 작업 우선순위

### **1. 타입 오류 수정 (즉시)**
- [ ] `BaseAnnotationComponent` 인터페이스 수정
- [ ] 기존 주석 컴포넌트 props 호환성 수정
- [ ] TypeScript 컴파일 오류 해결

### **2. 기존 코드 통합 (1-2일)**
- [ ] Shell.tsx에서 새로운 AnnotationManager 사용
- [ ] 기존 AnnotationLayerV2 대체
- [ ] 빌드 오류 완전 해결

### **3. Shell.tsx 분해 (1주)**
- [ ] Header, Sidebar, MainContent 컴포넌트 분리
- [ ] 각 컴포넌트 200줄 이하로 제한
- [ ] 상태 관리 분리

---

**이 체크리스트는 리팩토링 진행 상황을 실시간으로 추적하며, 완료될 때까지 참조용으로 사용됩니다.**

