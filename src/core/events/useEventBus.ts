/**
 * useEventBus - 이벤트 시스템 React 훅
 * 컴포넌트에서 이벤트 시스템을 쉽게 사용할 수 있도록 함
 */

import { useEffect, useCallback, useRef } from 'react';
import { eventBus } from './EventBus';
import type { EventCallback, AppEvent } from './EventTypes';

/**
 * 이벤트 리스너 훅
 * 컴포넌트에서 이벤트를 쉽게 구독할 수 있도록 함
 */
export function useEventListener<T extends AppEvent>(
  event: string,
  callback: EventCallback<T>,
  deps: any[] = []
) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    const wrappedCallback = (data: T) => {
      callbackRef.current(data);
    };

    eventBus.on(event, wrappedCallback);

    return () => {
      eventBus.off(event, wrappedCallback);
    };
  }, [event, ...deps]);
}

/**
 * 이벤트 발생 훅
 * 컴포넌트에서 이벤트를 쉽게 발생시킬 수 있도록 함
 */
export function useEventEmitter() {
  const emit = useCallback(<T extends AppEvent>(event: string, data?: T) => {
    eventBus.emit(event, data);
  }, []);

  return { emit };
}

/**
 * 이벤트 구독 및 발생 통합 훅
 * 컴포넌트에서 이벤트 시스템을 완전히 활용할 수 있도록 함
 */
export function useEventBus() {
  const emit = useCallback(<T extends AppEvent>(event: string, data?: T) => {
    eventBus.emit(event, data);
  }, []);

  const on = useCallback(<T extends AppEvent>(event: string, callback: EventCallback<T>) => {
    eventBus.on(event, callback);
  }, []);

  const off = useCallback(<T extends AppEvent>(event: string, callback: EventCallback<T>) => {
    eventBus.off(event, callback);
  }, []);

  const once = useCallback(<T extends AppEvent>(event: string, callback: EventCallback<T>) => {
    eventBus.once(event, callback);
  }, []);

  return { emit, on, off, once };
}

/**
 * 특정 이벤트 타입에 대한 타입 안전한 훅
 */
export function useTypedEventListener<T extends AppEvent>(
  event: string,
  callback: (data: T) => void,
  deps: any[] = []
) {
  useEventListener(event, callback, deps);
}

/**
 * 이벤트 디버깅 훅
 * 개발 중 이벤트 흐름을 추적할 수 있도록 함
 */
export function useEventDebugger(enabled: boolean = false) {
  useEffect(() => {
    if (!enabled) return;

    const debugHandler = (event: string, data: any) => {
      console.log(`🔔 [EventBus] ${event}:`, data);
    };

    // 모든 이벤트를 디버깅
    const originalEmit = eventBus.emit;
    eventBus.emit = function(event: string, data?: any) {
      debugHandler(event, data);
      return originalEmit.call(this, event, data);
    };

    return () => {
      eventBus.emit = originalEmit;
    };
  }, [enabled]);
}

