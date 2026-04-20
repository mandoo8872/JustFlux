# JustFlux v2

**로컬 전용 PDF 편집기**  
서버 없이, 클라우드 없이, 데이터 전송 없이 브라우저에서 모든 작업을 수행합니다.

## 🎯 주요 기능

### 📄 PDF 뷰어
- ✅ PDF 파일 로드 및 보기
- ✅ 줌: 25% - 400%
- ✅ 폭 맞춤 / 페이지 맞춤 / 높이 맞춤
- ✅ 페이지 네비게이션 (썸네일, 키보드)
- ✅ 고해상도 렌더링 (2x 스케일)

### 📂 멀티 포맷 지원
- ✅ **PDF**: 기본 PDF 문서 로딩 및 편집
- ✅ **Markdown (.md)**: 마크다운 뷰어 및 스타일링 지원
- ✅ **Text (.txt)**: 텍스트 파일 로딩
- ✅ **Image**: 이미지 파일을 페이지로 변환하여 로딩
- ✅ **빈 페이지**: 자유로운 드로잉을 위한 빈 페이지 추가 기능

### ✍️ 벡터 주석
- ✅ **텍스트**: 추가, 편집, 스타일링 (폰트, 크기, 색상)
- ✅ **하이라이트**: 4가지 색상 프리셋
- ✅ **도형**: 사각형, 원형 (선택 및 크기 조절 핸들 지원)
- ✅ **화살표**: 방향성 화살표 주석 추가
- ✅ **조작**: 드래그, 리사이즈, 회전 지원
- ✅ **레이어 관리**: Z-인덱스를 통한 레이어 순서 관리

### 🎨 래스터 도구
- ✅ **브러시**: 압력 감지를 지원하는 자유 드로잉
- ✅ **지우개**: 픽셀 단위 또는 전체 레이어 삭제
- ✅ **블러**: 가우시안 블러 효과 (선택적)
- ✅ **커스터마이징**: 크기, 경도, 투명도 조절 가능
- ✅ **레이어**: 페이지당 다중 래스터 레이어 지원

### 💾 내보내기 (Export)
- ✅ **PDF**: 스마트 내보내기 (편집된 페이지만 재렌더링) 또는 전체 캔버스 렌더링
- ✅ **PNG**: 고해상도 (최대 600 DPI)
- ✅ **JPEG**: 품질 조정 가능
- ✅ **검색 가능한 텍스트**: PDF 내보내기 시 보이지 않는 검색 가능한 텍스트 레이어 포함
- ✅ **일괄 내보내기**: 여러 페이지를 ZIP 아카이브로 내보내기

### ↩️ 실행 취소 / 다시 실행
- ✅ JSON Patch 기반 히스토리
- ✅ 50개 액션 버퍼 지원
- ✅ 모든 작업(그리기, 주석 등)에 적용

## ⌨️ 키보드 단축키

| 동작 | Mac | Windows/Linux |
|------|-----|---------------|
| 실행 취소 | Cmd+Z | Ctrl+Z |
| 다시 실행 | Cmd+Shift+Z | Ctrl+Shift+Z |
| 저장/내보내기 | Cmd+S | Ctrl+S |
| 확대 | Cmd+= | Ctrl+= |
| 축소 | Cmd+- | Ctrl+- |
| 100%로 재설정 | Cmd+0 | Ctrl+0 |
| 삭제 | Delete | Delete |
| 선택 해제 | Esc | Esc |
| 다음 페이지 | ↓ 또는 → | ↓ 또는 → |
| 이전 페이지 | ↑ 또는 ← | ↑ 또는 ← |
| 첫 페이지 | Home | Home |
| 마지막 페이지 | End | End |

## 🚀 시작하기

### 설치

```bash
npm install
npm run dev
```

### 사용 방법

#### 기본 작업 플로우
1. **PDF 열기**: "PDF 열기" 버튼 클릭 또는 파일 드래그 앤 드롭
2. **탐색**: 썸네일 또는 화살표 키 사용
3. **도구 선택**: 우측 사이드바(Toolbox)에서 도구 선택
4. **편집**: 주석을 추가하거나 브러시로 그리기
5. **내보내기**: "내보내기" 버튼 클릭 후 형식 선택

#### 텍스트 추가
1. "텍스트" 도구 클릭
2. 페이지에서 텍스트를 추가할 위치 클릭
3. 내용 입력
4. 외부 클릭 또는 ESC로 완료

#### 드로잉 (브러시/지우개)
1. "브러시" 도구 클릭
2. 크기, 색상, 투명도 조절
3. 페이지에 자유롭게 그리기
4. "지우개" 도구를 사용하여 잘못된 부분 수정

#### 내보내기 (Export)
1. "내보내기" 버튼 클릭
2. 형식 선택 (PDF, PNG, JPEG)
3. 페이지 범위 선택
4. 옵션 조정 (DPI, 품질 등)
5. "Export" 클릭하여 다운로드

## 🏗️ 아키텍처

### 기술 스택

- **React 19**: UI 프레임워크
- **TypeScript**: 타입 안전성
- **Zustand 5**: 상태 관리
- **Immer**: 불변 업데이트
- **PDF.js 5.x**: PDF 렌더링
- **pdf-lib**: PDF 편집/내보내기
- **TailwindCSS 4**: 스타일링
- **Phosphor Icons**: 아이콘
- **Vite 7**: 빌드 도구
- **Vitest**: 테스트

### 데이터 흐름

```text
사용자 액션
  → Zustand 액션
    → Immer 업데이트
      → 히스토리 패치 (JSON Patch)
        → 재렌더링 (React)
```

### 성능

- 100+ 페이지: < 5초 로드 시간
- 페이지 전환: < 200ms
- 주석 추가: < 50ms
- 내보내기: ~0.5초/페이지

## 🧪 테스트

```bash
# 테스트 실행
npm run test

# UI 모드로 테스트
npm run test:ui

# 커버리지 확인
npm run test -- --coverage
```

## 🛠️ 개발

### 프로젝트 구조

```text
src/
├── core/              # 핵심 로직 (PDF, 래스터, I/O)
│   ├── model/         # 데이터 타입 및 팩토리
│   ├── pdf/           # PDF.js 통합
│   ├── raster/        # 래스터 레이어 시스템
│   └── io/            # Import/Export
├── state/             # Zustand 스토어
│   └── documentStore.ts
├── ui/                # React 컴포넌트
│   ├── layout/        # Shell, 모달
│   ├── viewer/        # 페이지 뷰어, 주석 레이어, 래스터 레이어
│   ├── toolbox/       # 도구 패널 (브러시, 주석 등)
│   └── export/        # 내보내기 패널
├── utils/             # 유틸리티 함수
└── tests/             # Vitest 테스트
```

### 새 주석 타입 추가하기

1. `src/core/model/types.ts`에 타입 추가
2. `src/core/model/factories.ts`에 팩토리 함수 추가
3. `src/ui/viewer/annotations/`에 컴포넌트 생성
4. `AnnotationLayer.tsx`에 컴포넌트 추가
5. `Toolbox.tsx`에 도구 버튼 추가

## 🔐 개인정보 보호 및 보안

- ✅ **100% 로컬 처리**
- ✅ **서버로 데이터 전송 없음**
- ✅ **분석 또는 추적 없음**
- ✅ **외부 API 호출 없음**
- ✅ **오프라인 작동**

**귀하의 문서는 절대로 기기를 떠나지 않습니다.**

## 📝 라이선스

MIT License

## 🙏 크레딧

다음 오픈소스 프로젝트로 제작되었습니다:

- [PDF.js](https://mozilla.github.io/pdf.js/) by Mozilla
- [pdf-lib](https://pdf-lib.js.org/) by Andrew Dillon
- [Zustand](https://github.com/pmndrs/zustand) by Poimandres
- [React](https://react.dev/) by Meta
- [TailwindCSS](https://tailwindcss.com/)
- [Phosphor Icons](https://phosphoricons.com/)

---

**Made with ❤️ for privacy-conscious users**
