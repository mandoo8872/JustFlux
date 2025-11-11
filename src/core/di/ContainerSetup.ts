/**
 * Container Setup - 의존성 주입 컨테이너 초기화
 * 모든 서비스를 등록하고 설정
 */

import { container } from './Container';
import { SERVICE_TOKENS } from './ServiceTokens';
import { eventBus } from '../events/EventBus';
import { ExportManager } from '../services/ExportManager';

/**
 * DI Container 초기화
 * 모든 서비스를 등록하고 설정
 */
export function initializeContainer(): void {
  console.log('🔧 [DI] Initializing dependency injection container...');

  // ============================================
  // 핵심 서비스 등록
  // ============================================

  // EventBus (싱글톤)
  container.registerSingleton(SERVICE_TOKENS.EVENT_BUS, () => eventBus);

  // ============================================
  // 서비스 등록 (Lazy Loading)
  // ============================================

  // FileService
  container.register(SERVICE_TOKENS.FILE_MANAGER, () => {
    return import('../services/FileService').then(module => module.FileService);
  });

  // EventService
  container.register(SERVICE_TOKENS.EVENT_SERVICE, () => {
    return import('../services/EventService').then(module => module.EventService);
  });

  // ExportManager (싱글톤)
  container.registerSingleton(SERVICE_TOKENS.EXPORT_MANAGER, () => {
    return new ExportManager();
  });

  console.log('✅ [DI] Container initialized successfully');
}

/**
 * 서비스 해결 헬퍼
 * 타입 안전한 서비스 해결
 */
export function resolveService<T>(token: symbol): T {
  return container.resolve<T>(token);
}

/**
 * 서비스 등록 헬퍼
 * 새로운 서비스 등록
 */
export function registerService<T>(token: symbol, factory: () => T): void {
  container.register(token, factory);
}

/**
 * 싱글톤 서비스 등록 헬퍼
 * 새로운 싱글톤 서비스 등록
 */
export function registerSingleton<T>(token: symbol, factory: () => T): void {
  container.registerSingleton(token, factory);
}
