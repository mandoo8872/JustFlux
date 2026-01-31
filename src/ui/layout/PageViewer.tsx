/**
 * PageViewer Component - 페이지 뷰어
 * 현재 페이지 중심으로 이전/다음 페이지도 렌더링하고, 가장 많이 보이는 페이지를 자동 감지
 */

import { useEffect, useRef, useCallback } from 'react';
import { PageView } from '../viewer/PageView';
import { BlankPageView } from '../viewer/BlankPageView';
import { TextPageView } from '../viewer/TextPageView';
import { ImagePageView } from '../viewer/ImagePageView';
import { AnnotationManager } from '../../domains/annotations';
import type { Document as JFDocument, Page, Annotation } from '../../core/model/types';
import type { PDFDocumentProxy } from 'pdfjs-dist';

interface PageViewerProps {
  document: JFDocument | null;
  pages: Page[]; // PageStore의 pages 추가
  currentPage: Page | null;
  pdfProxy: PDFDocumentProxy | null;
  scale: number;
  pan: { x: number; y: number };
  activeTool: string;
  onPanChange: (pan: { x: number; y: number }) => void;
  onAddAnnotation: (annotation: Omit<Annotation, 'id'>) => void;
  onUpdateAnnotation: (id: string, updates: Partial<Annotation>) => void;
  onDeleteAnnotation: (id: string) => void;
  onAddHistoryPatch: (description: string, forward: any[], backward: any[]) => void;
  onPageSelect: (pageId: string) => void;
  scrollContainerRef?: React.RefObject<HTMLDivElement>;
}

export function PageViewer({
  document,
  pages,
  currentPage,
  pdfProxy,
  scale,
  activeTool,
  onAddAnnotation,
  onUpdateAnnotation,
  onDeleteAnnotation,
  onAddHistoryPatch,
  onPageSelect,
  scrollContainerRef,
}: PageViewerProps) {
  const pageRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const observerRef = useRef<IntersectionObserver | null>(null);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isScrollingToPageRef = useRef(false); // 프로그래매틱 스크롤 중인지 추적

  // 가장 많이 보이는 페이지 감지
  const handleIntersection = useCallback((entries: IntersectionObserverEntry[]) => {
    if (!document) return;

    // 프로그래매틱 스크롤 중에는 페이지 선택 변경하지 않음
    if (isScrollingToPageRef.current) {
      return;
    }

    // 뷰포트 중앙에 가장 가까운 페이지 찾기 (가시성 비율 + 위치 고려)
    let bestPageId: string | null = null;
    let bestScore = -1;

    entries.forEach((entry) => {
      const pageId = entry.target.getAttribute('data-page-id');
      if (!pageId) return;

      const visibleRatio = entry.intersectionRatio;
      const boundingRect = entry.boundingClientRect;

      // 스크롤 컨테이너 기준으로 뷰포트 중앙 계산
      const scrollContainer = scrollContainerRef?.current;
      let viewportHeight = window.innerHeight;
      let viewportCenter = viewportHeight / 2;

      if (scrollContainer) {
        const containerRect = scrollContainer.getBoundingClientRect();
        viewportHeight = containerRect.height;
        viewportCenter = containerRect.top + viewportHeight / 2;
      }

      const elementCenter = boundingRect.top + boundingRect.height / 2;
      const distanceFromCenter = Math.abs(viewportCenter - elementCenter);

      // 점수 계산: 가시성 비율이 높고 중앙에 가까울수록 높은 점수
      // 가시성 비율 70%, 중앙 거리 30% 가중치
      const visibilityScore = visibleRatio * 0.7;
      const centerScore = Math.max(0, 1 - distanceFromCenter / viewportHeight) * 0.3;
      const totalScore = visibilityScore + centerScore;

      if (totalScore > bestScore && visibleRatio > 0.1) {
        bestScore = totalScore;
        bestPageId = pageId;
      }
    });

    // 현재 페이지와 다르면 업데이트 (프로그래매틱 스크롤 중이 아닐 때만)
    // 가시성 비율이 80% 이상일 때만 페이지 변경
    if (bestPageId && bestPageId !== currentPage?.id && bestScore > 0.8 && !isScrollingToPageRef.current) {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }

      // 디바운싱을 150ms로 늘려서 안정성 향상
      updateTimeoutRef.current = setTimeout(() => {
        // 다시 한 번 체크 (스크롤 중이 아닐 때만 변경)
        if (!isScrollingToPageRef.current) {
          onPageSelect(bestPageId!);
        }
      }, 150);
    }
  }, [document, currentPage?.id, onPageSelect, scrollContainerRef]);

  // Intersection Observer 설정
  useEffect(() => {
    if (!document) return;

    // 스크롤 컨테이너를 root로 설정
    const root = scrollContainerRef?.current || null;

    const options = {
      root: root, // 스크롤 컨테이너를 root로 설정 (없으면 뷰포트)
      rootMargin: '0px', // 여백 없이 전체 뷰포트 감지
      threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0] // 다양한 비율 감지
    };

    // 기존 observer 정리
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(handleIntersection, options);
    console.log(`🔍 [PageViewer] Created IntersectionObserver with root:`, root ? 'scroll container' : 'viewport');

    // 모든 페이지 요소 관찰 (약간의 지연을 두어 DOM이 완전히 렌더링된 후 관찰)
    const timeoutId = setTimeout(() => {
      console.log(`🔍 [PageViewer] Setting up observer for ${pageRefs.current.size} pages`);
      pageRefs.current.forEach((element, pageId) => {
        if (element && observerRef.current) {
          observerRef.current.observe(element);
          console.log(`✅ [PageViewer] Observing page: ${pageId}`);
        }
      });
    }, 200);

    return () => {
      clearTimeout(timeoutId);
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, [document, handleIntersection, currentPage?.id, scrollContainerRef]);

  // 스크롤 이벤트로도 페이지 감지 (개선된 버전)
  useEffect(() => {
    if (!document || !currentPage || !scrollContainerRef?.current) return;

    const handleScroll = () => {
      // 프로그래매틱 스크롤 중에는 페이지 선택 변경하지 않음
      if (isScrollingToPageRef.current) {
        return;
      }

      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }

      updateTimeoutRef.current = setTimeout(() => {
        // 프로그래매틱 스크롤 중이면 무시
        if (isScrollingToPageRef.current) {
          return;
        }

        const scrollContainer = scrollContainerRef?.current;
        if (!scrollContainer || pageRefs.current.size === 0) return;

        // 스크롤 컨테이너의 뷰포트 중앙 계산
        const scrollTop = scrollContainer.scrollTop;
        const viewportHeight = scrollContainer.clientHeight;
        const viewportCenter = scrollTop + viewportHeight / 2;

        let closestPageId: string | null = null;
        let minDistance = Infinity;
        let maxVisibleRatio = 0;

        // 각 페이지의 가시성과 중앙까지의 거리를 계산
        pageRefs.current.forEach((element, pageId) => {
          const elementTop = element.offsetTop;
          const elementHeight = element.offsetHeight;
          const elementBottom = elementTop + elementHeight;
          const elementCenter = elementTop + elementHeight / 2;

          // 페이지가 뷰포트에 얼마나 보이는지 계산
          const visibleTop = Math.max(scrollTop, elementTop);
          const visibleBottom = Math.min(scrollTop + viewportHeight, elementBottom);
          const visibleHeight = Math.max(0, visibleBottom - visibleTop);
          const visibleRatio = visibleHeight / elementHeight;

          // 중앙까지의 거리 계산
          const distance = Math.abs(viewportCenter - elementCenter);

          // 가시성이 높거나 중앙에 가까운 페이지 선택
          // 가시성 비율이 80% 이상이고, 중앙에 가까운 페이지를 우선 선택
          if (visibleRatio > 0.8) {
            if (visibleRatio > maxVisibleRatio || (visibleRatio === maxVisibleRatio && distance < minDistance)) {
              maxVisibleRatio = visibleRatio;
              minDistance = distance;
              closestPageId = pageId;
            }
          } else if (visibleRatio > 0 && distance < minDistance) {
            // 가시성이 낮더라도 중앙에 가장 가까운 페이지 선택
            minDistance = distance;
            closestPageId = pageId;
          }
        });

        // 현재 페이지와 다르고, 충분히 가시적인 페이지로 변경
        // 가시성 비율이 80% 이상일 때만 페이지 변경
        // 프로그래매틱 스크롤 중이 아닐 때만 변경
        if (closestPageId && closestPageId !== currentPage.id && maxVisibleRatio > 0.8 && !isScrollingToPageRef.current) {
          console.log(`📜 [PageViewer] Scroll detected: changing page from ${currentPage.id} to ${closestPageId} (visible: ${(maxVisibleRatio * 100).toFixed(0)}%, distance: ${minDistance.toFixed(0)}px)`);
          onPageSelect(closestPageId);
        }
      }, 150); // 스크롤 안정화를 위해 150ms 딜레이
    };

    const scrollContainer = scrollContainerRef.current;
    scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
    // 초기 체크도 한 번 실행
    setTimeout(() => handleScroll(), 100);

    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
      scrollContainer.removeEventListener('scroll', handleScroll);
    };
  }, [document, currentPage?.id, onPageSelect, scrollContainerRef]);

  // 페이지로 스크롤하는 헬퍼 함수
  const scrollToPage = useCallback((pageElement: HTMLDivElement, scrollContainer: HTMLDivElement) => {
    // 프로그래매틱 스크롤 시작 (즉시 설정하여 다른 감지 로직 차단)
    isScrollingToPageRef.current = true;

    // 기존 업데이트 타임아웃 취소 (다른 페이지 변경 시도 차단)
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
      updateTimeoutRef.current = null;
    }

    // offsetTop을 사용하여 정확한 위치 계산
    const elementTop = pageElement.offsetTop;
    const elementHeight = pageElement.offsetHeight;
    const viewportHeight = scrollContainer.clientHeight;

    // 페이지를 뷰포트 중앙에 위치시키기
    const targetScrollTop = elementTop + elementHeight / 2 - viewportHeight / 2;

    scrollContainer.scrollTo({
      top: Math.max(0, targetScrollTop),
      behavior: 'smooth'
    });

    // 스크롤 완료 후 플래그 해제 (스크롤 애니메이션 시간 고려)
    // smooth scroll은 보통 300-500ms 소요, 여유있게 800ms로 설정
    setTimeout(() => {
      isScrollingToPageRef.current = false;
    }, 800);
  }, []);

  // 현재 페이지로 스크롤 (썸네일 클릭 등으로 페이지 선택이 변경될 때)
  useEffect(() => {
    if (!currentPage || !scrollContainerRef?.current) return;

    // 즉시 프로그래매틱 스크롤 플래그 설정 (다른 감지 로직 차단)
    isScrollingToPageRef.current = true;

    // 기존 업데이트 타임아웃 취소
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
      updateTimeoutRef.current = null;
    }

    const pageElement = pageRefs.current.get(currentPage.id);
    if (!pageElement) {
      // 페이지 요소가 아직 렌더링되지 않았을 수 있으므로 잠시 후 다시 시도
      const retryTimeout = setTimeout(() => {
        const retryElement = pageRefs.current.get(currentPage.id);
        if (retryElement && scrollContainerRef?.current) {
          scrollToPage(retryElement, scrollContainerRef.current);
        } else {
          // 요소를 찾지 못하면 플래그 해제
          isScrollingToPageRef.current = false;
        }
      }, 100);
      return () => clearTimeout(retryTimeout);
    }

    scrollToPage(pageElement, scrollContainerRef.current);
  }, [currentPage?.id, scrollContainerRef, scrollToPage]);

  console.log(`🔍 [PageViewer] Render check: document=${!!document}, pages.length=${pages?.length || 0}, currentPage=${!!currentPage}`);

  if (!currentPage || !pages || pages.length === 0) {
    console.warn(`⚠️ [PageViewer] Missing data: currentPage=${!!currentPage}, pages.length=${pages?.length || 0}`);
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        backgroundColor: 'transparent'
      }}>
        <div style={{
          textAlign: 'center',
          padding: '48px',
          backgroundColor: 'white',
          borderRadius: '4px',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: 500, color: '#333333', marginBottom: '12px' }}>
            PDF 편집 시작하기
          </h2>
          <p style={{ color: '#666666', marginBottom: '32px', lineHeight: '1.625', fontSize: '13px' }}>
            PDF 파일을 업로드하여 편집을 시작하세요.
            <br />
            텍스트, 주석, 그리기 등 다양한 기능을 사용할 수 있습니다.
          </p>
        </div>
      </div>
    );
  }

  // 모든 페이지 렌더링 (스크롤로 넘어갈 수 있도록)
  const pagesToRender: Page[] = pages.filter(p => !p.deleted);
  console.log(`🔍 [PageViewer] pagesToRender.length=${pagesToRender.length}, total pages=${pages.length}`);

  if (pagesToRender.length === 0) {
    console.error(`❌ [PageViewer] No pages to render! pages.length=${pages.length}`);
  }

  return (
    <div
      ref={containerRef}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px', // 페이지 간 패딩
        padding: '4px 0' // 상하 패딩
      }}
    >
      {pagesToRender.map((page) => {
        const hasPdfRef = !!page.pdfRef;
        const hasPdfProxy = !!pdfProxy;
        console.log(`🔍 [PageViewer] Rendering page: ${page.id}, pdfRef=${hasPdfRef}, pdfProxy=${hasPdfProxy}, pdfRef.sourceIndex=${page.pdfRef?.sourceIndex}`);
        return (
          <div
            key={page.id}
            ref={(el) => {
              if (el) {
                pageRefs.current.set(page.id, el);
                // Observer가 이미 생성되어 있으면 즉시 관찰 시작
                if (observerRef.current) {
                  // 약간의 지연을 두어 레이아웃이 완료된 후 관찰
                  setTimeout(() => {
                    if (observerRef.current && pageRefs.current.has(page.id)) {
                      const element = pageRefs.current.get(page.id);
                      if (element) {
                        observerRef.current.observe(element);
                        console.log(`✅ [PageViewer] Observing new page: ${page.id}`);
                      }
                    }
                  }, 100);
                }
              } else {
                if (observerRef.current && pageRefs.current.has(page.id)) {
                  observerRef.current.unobserve(pageRefs.current.get(page.id)!);
                }
                pageRefs.current.delete(page.id);
              }
            }}
            data-page-id={page.id}
            style={{
              position: 'relative',
              display: 'inline-block',
              backgroundColor: 'transparent',
              borderRadius: '2px',
              boxShadow: page.id === currentPage.id ? '0 4px 8px rgba(0, 0, 0, 0.15)' : '0 2px 4px rgba(0, 0, 0, 0.1)',
              transition: 'box-shadow 0.2s ease-in-out',
              margin: '8px 0'
            }}
          >
            {/* Page View Container - AnnotationManager의 부모로 사용 */}
            <div style={{
              position: 'relative',
              display: 'block',
              width: 'fit-content',
              height: 'fit-content'
            }}>
              {/* Page View - contentType에 따라 렌더링 */}
              {(() => {
                // Text/Markdown 페이지
                if (page.contentType === 'text' || page.contentType === 'markdown') {
                  return (
                    <TextPageView
                      pageId={page.id}
                      textContent={page.textContent || ''}
                      contentType={page.contentType}
                      scale={scale}
                      width={page.width}
                      height={page.height}
                    />
                  );
                }
                // Image 페이지
                if (page.contentType === 'image' && page.imageUrl) {
                  return (
                    <ImagePageView
                      pageId={page.id}
                      imageUrl={page.imageUrl}
                      scale={scale}
                      width={page.width}
                      height={page.height}
                    />
                  );
                }
                // PDF 페이지
                if (page.pdfRef && pdfProxy) {
                  return (
                    <PageView
                      pageId={page.id}
                      pageIndex={page.pdfRef.sourceIndex - 1}
                      pdfProxy={pdfProxy}
                      scale={scale}
                      onRenderComplete={() => {
                        console.log(`✅ [PageViewer] Page ${page.id} render complete`);
                      }}
                    />
                  );
                }
                // Blank 페이지
                console.log(`📄 [PageViewer] Using BlankPageView for ${page.id}`);
                return (
                  <BlankPageView
                    page={page}
                    scale={scale}
                  />
                );
              })()}

              {/* Annotation Layer - 현재 페이지에만 활성화 */}
              {page.id === currentPage.id && (
                <AnnotationManager
                  pageId={page.id}
                  scale={scale}
                  activeTool={activeTool as any}
                  onCreate={(annotation: Omit<Annotation, 'id'>) => {
                    console.log('✅ [PageViewer] Creating annotation:', annotation);
                    if (!document) return;
                    const forward = [
                      { op: 'add' as const, path: `/document/pages/${document.pages.findIndex(p => p.id === annotation.pageId)}/layers/annotations/-`, value: annotation }
                    ];
                    const backward = [
                      { op: 'remove' as const, path: `/document/pages/${document.pages.findIndex(p => p.id === annotation.pageId)}/layers/annotations/${document.pages.find(p => p.id === annotation.pageId)?.layers.annotations.length || 0}` }
                    ];
                    onAddHistoryPatch('주석 추가', forward, backward);
                    onAddAnnotation(annotation);
                  }}
                  onUpdate={(id, updates) => {
                    if (!document) return;
                    const annotation = document.pages
                      .flatMap(p => p.layers.annotations)
                      .find(a => a.id === id);
                    if (annotation) {
                      const forward = [
                        { op: 'replace' as const, path: `/document/pages/${document.pages.findIndex(p => p.layers.annotations.some(a => a.id === id))}/layers/annotations/${document.pages.find(p => p.layers.annotations.some(a => a.id === id))?.layers.annotations.findIndex(a => a.id === id)}`, value: { ...annotation, ...updates } }
                      ];
                      const backward = [
                        { op: 'replace' as const, path: `/document/pages/${document.pages.findIndex(p => p.layers.annotations.some(a => a.id === id))}/layers/annotations/${document.pages.find(p => p.layers.annotations.some(a => a.id === id))?.layers.annotations.findIndex(a => a.id === id)}`, value: annotation }
                      ];
                      onAddHistoryPatch('주석 수정', forward, backward);
                    }
                    onUpdateAnnotation(id, updates);
                  }}
                  onDelete={(id) => {
                    if (!document) return;
                    const annotation = document.pages
                      .flatMap(p => p.layers.annotations)
                      .find(a => a.id === id);
                    if (annotation) {
                      const pageIndex = document.pages.findIndex(p => p.layers.annotations.some(a => a.id === id));
                      const annotationIndex = document.pages[pageIndex].layers.annotations.findIndex(a => a.id === id);
                      const forward = [
                        { op: 'remove' as const, path: `/document/pages/${pageIndex}/layers/annotations/${annotationIndex}` }
                      ];
                      const backward = [
                        { op: 'add' as const, path: `/document/pages/${pageIndex}/layers/annotations/${annotationIndex}`, value: annotation }
                      ];
                      onAddHistoryPatch('주석 삭제', forward, backward);
                    }
                    onDeleteAnnotation(id);
                  }}
                />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
