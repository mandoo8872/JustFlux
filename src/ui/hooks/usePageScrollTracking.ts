/**
 * usePageScrollTracking — IntersectionObserver + 스크롤 기반 페이지 감지 + 프로그래매틱 스크롤
 *
 * PageViewer에서 추출. 현재 보이는 페이지를 자동 감지하고,
 * 페이지 선택이 변경되면 해당 페이지로 부드럽게 스크롤.
 */

import { useEffect, useRef, useCallback } from 'react';

interface UsePageScrollTrackingOptions {
    /** 현재 문서의 존재 여부 */
    hasDocument: boolean;
    /** 현재 선택된 페이지 ID */
    currentPageId: string | null;
    /** 페이지 선택 콜백 */
    onPageSelect: (pageId: string) => void;
    /** 외부 스크롤 컨테이너 ref */
    scrollContainerRef?: React.RefObject<HTMLDivElement>;
}

interface UsePageScrollTrackingReturn {
    /** 페이지 요소를 등록하는 ref 콜백 */
    registerPageRef: (pageId: string, el: HTMLDivElement | null) => void;
    /** 옵저버 ref (직접 접근 필요 시) */
    pageRefs: React.MutableRefObject<Map<string, HTMLDivElement>>;
}

export function usePageScrollTracking({
    hasDocument,
    currentPageId,
    onPageSelect,
    scrollContainerRef,
}: UsePageScrollTrackingOptions): UsePageScrollTrackingReturn {
    const pageRefs = useRef<Map<string, HTMLDivElement>>(new Map());
    const observerRef = useRef<IntersectionObserver | null>(null);
    const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const isScrollingToPageRef = useRef(false);

    // ── IntersectionObserver 콜백 ──
    const handleIntersection = useCallback((entries: IntersectionObserverEntry[]) => {
        if (!hasDocument || isScrollingToPageRef.current) return;

        let bestPageId: string | null = null;
        let bestScore = -1;

        entries.forEach((entry) => {
            const pageId = entry.target.getAttribute('data-page-id');
            if (!pageId) return;

            const visibleRatio = entry.intersectionRatio;
            const boundingRect = entry.boundingClientRect;

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

            const visibilityScore = visibleRatio * 0.7;
            const centerScore = Math.max(0, 1 - distanceFromCenter / viewportHeight) * 0.3;
            const totalScore = visibilityScore + centerScore;

            if (totalScore > bestScore && visibleRatio > 0.1) {
                bestScore = totalScore;
                bestPageId = pageId;
            }
        });

        if (bestPageId && bestPageId !== currentPageId && bestScore > 0.8 && !isScrollingToPageRef.current) {
            if (updateTimeoutRef.current) clearTimeout(updateTimeoutRef.current);
            updateTimeoutRef.current = setTimeout(() => {
                if (!isScrollingToPageRef.current) onPageSelect(bestPageId!);
            }, 150);
        }
    }, [hasDocument, currentPageId, onPageSelect, scrollContainerRef]);

    // ── Observer 설정 ──
    useEffect(() => {
        if (!hasDocument) return;

        const root = scrollContainerRef?.current || null;
        if (observerRef.current) observerRef.current.disconnect();

        observerRef.current = new IntersectionObserver(handleIntersection, {
            root,
            rootMargin: '0px',
            threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
        });

        const timeoutId = setTimeout(() => {
            pageRefs.current.forEach((element) => {
                if (element && observerRef.current) observerRef.current.observe(element);
            });
        }, 200);

        return () => {
            clearTimeout(timeoutId);
            observerRef.current?.disconnect();
            if (updateTimeoutRef.current) clearTimeout(updateTimeoutRef.current);
        };
    }, [hasDocument, handleIntersection, currentPageId, scrollContainerRef]);

    // ── 스크롤 기반 페이지 감지 ──
    useEffect(() => {
        if (!hasDocument || !currentPageId || !scrollContainerRef?.current) return;

        const handleScroll = () => {
            if (isScrollingToPageRef.current) return;
            if (updateTimeoutRef.current) clearTimeout(updateTimeoutRef.current);

            updateTimeoutRef.current = setTimeout(() => {
                if (isScrollingToPageRef.current) return;
                const scrollContainer = scrollContainerRef?.current;
                if (!scrollContainer || pageRefs.current.size === 0) return;

                const scrollTop = scrollContainer.scrollTop;
                const viewportHeight = scrollContainer.clientHeight;
                const viewportCenter = scrollTop + viewportHeight / 2;

                let closestPageId: string | null = null;
                let minDistance = Infinity;
                let maxVisibleRatio = 0;

                pageRefs.current.forEach((element, pageId) => {
                    const elementTop = element.offsetTop;
                    const elementHeight = element.offsetHeight;
                    const elementBottom = elementTop + elementHeight;
                    const elementCenter = elementTop + elementHeight / 2;

                    const visibleTop = Math.max(scrollTop, elementTop);
                    const visibleBottom = Math.min(scrollTop + viewportHeight, elementBottom);
                    const visibleHeight = Math.max(0, visibleBottom - visibleTop);
                    const visibleRatio = visibleHeight / elementHeight;

                    const distance = Math.abs(viewportCenter - elementCenter);

                    if (visibleRatio > 0.8) {
                        if (visibleRatio > maxVisibleRatio || (visibleRatio === maxVisibleRatio && distance < minDistance)) {
                            maxVisibleRatio = visibleRatio;
                            minDistance = distance;
                            closestPageId = pageId;
                        }
                    } else if (visibleRatio > 0 && distance < minDistance) {
                        minDistance = distance;
                        closestPageId = pageId;
                    }
                });

                if (closestPageId && closestPageId !== currentPageId && maxVisibleRatio > 0.8 && !isScrollingToPageRef.current) {
                    onPageSelect(closestPageId);
                }
            }, 150);
        };

        const scrollContainer = scrollContainerRef.current;
        scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
        setTimeout(() => handleScroll(), 100);

        return () => {
            if (updateTimeoutRef.current) clearTimeout(updateTimeoutRef.current);
            scrollContainer.removeEventListener('scroll', handleScroll);
        };
    }, [hasDocument, currentPageId, onPageSelect, scrollContainerRef]);

    // ── 프로그래매틱 스크롤 ──
    const scrollToPage = useCallback((pageElement: HTMLDivElement, scrollContainer: HTMLDivElement) => {
        isScrollingToPageRef.current = true;
        if (updateTimeoutRef.current) {
            clearTimeout(updateTimeoutRef.current);
            updateTimeoutRef.current = null;
        }

        const elementTop = pageElement.offsetTop;
        const elementHeight = pageElement.offsetHeight;
        const viewportHeight = scrollContainer.clientHeight;
        const targetScrollTop = elementTop + elementHeight / 2 - viewportHeight / 2;

        scrollContainer.scrollTo({ top: Math.max(0, targetScrollTop), behavior: 'smooth' });
        setTimeout(() => { isScrollingToPageRef.current = false; }, 800);
    }, []);

    useEffect(() => {
        if (!currentPageId || !scrollContainerRef?.current) return;

        isScrollingToPageRef.current = true;
        if (updateTimeoutRef.current) {
            clearTimeout(updateTimeoutRef.current);
            updateTimeoutRef.current = null;
        }

        const pageElement = pageRefs.current.get(currentPageId);
        if (!pageElement) {
            const retryTimeout = setTimeout(() => {
                const retryElement = pageRefs.current.get(currentPageId);
                if (retryElement && scrollContainerRef?.current) {
                    scrollToPage(retryElement, scrollContainerRef.current);
                } else {
                    isScrollingToPageRef.current = false;
                }
            }, 100);
            return () => clearTimeout(retryTimeout);
        }

        scrollToPage(pageElement, scrollContainerRef.current);
    }, [currentPageId, scrollContainerRef, scrollToPage]);

    // ── 페이지 ref 등록 ──
    const registerPageRef = useCallback((pageId: string, el: HTMLDivElement | null) => {
        if (el) {
            pageRefs.current.set(pageId, el);
            if (observerRef.current) {
                setTimeout(() => {
                    if (observerRef.current && pageRefs.current.has(pageId)) {
                        const element = pageRefs.current.get(pageId);
                        if (element) observerRef.current.observe(element);
                    }
                }, 100);
            }
        } else {
            if (observerRef.current && pageRefs.current.has(pageId)) {
                observerRef.current.unobserve(pageRefs.current.get(pageId)!);
            }
            pageRefs.current.delete(pageId);
        }
    }, []);

    return { registerPageRef, pageRefs };
}
