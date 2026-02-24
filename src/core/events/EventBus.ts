/**
 * Event Bus - 이벤트 기반 아키텍처
 * 컴포넌트 간 느슨한 결합을 위한 이벤트 시스템
 *
 * EVENTS 상수는 EventTypes.ts에서 정의 (중복 제거).
 */

export type EventCallback<T = unknown> = (data: T) => void;

export interface EventBus {
  on<T = unknown>(event: string, callback: EventCallback<T>): void;
  off<T = unknown>(event: string, callback: EventCallback<T>): void;
  emit<T = unknown>(event: string, data?: T): void;
  once<T = unknown>(event: string, callback: EventCallback<T>): void;
  clear(): void;
}

class EventBusImpl implements EventBus {
  private listeners = new Map<string, Set<EventCallback>>();

  on<T = unknown>(event: string, callback: EventCallback<T>): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback as EventCallback);
  }

  off<T = unknown>(event: string, callback: EventCallback<T>): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(callback as EventCallback);
      if (eventListeners.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  emit<T = unknown>(event: string, data?: T): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`❌ [EventBus] Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  once<T = unknown>(event: string, callback: EventCallback<T>): void {
    const onceCallback: EventCallback<T> = (data) => {
      callback(data);
      this.off(event, onceCallback);
    };
    this.on(event, onceCallback);
  }

  clear(): void {
    this.listeners.clear();
  }
}

// 싱글톤 인스턴스
export const eventBus = new EventBusImpl();

// EVENTS는 EventTypes.ts에서 re-export
export { EVENTS } from './EventTypes';
