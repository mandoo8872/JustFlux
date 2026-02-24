import { logger } from '../../utils/logger';
/**
 * Dependency Injection Container
 * 서비스 간 의존성을 관리하고 주입하는 컨테이너
 */

export type ServiceFactory<T = any> = () => T;
export type ServiceToken = string | symbol;

export interface DIContainer {
  register<T>(token: ServiceToken, factory: ServiceFactory<T>): void;
  registerSingleton<T>(token: ServiceToken, factory: ServiceFactory<T>): void;
  resolve<T>(token: ServiceToken): T;
  isRegistered(token: ServiceToken): boolean;
  clear(): void;
}

class DIContainerImpl implements DIContainer {
  private services = new Map<ServiceToken, ServiceFactory>();
  private singletons = new Map<ServiceToken, any>();

  register<T>(token: ServiceToken, factory: ServiceFactory<T>): void {
    this.services.set(token, factory);
  }

  registerSingleton<T>(token: ServiceToken, factory: ServiceFactory<T>): void {
    this.services.set(token, factory);
    // 싱글톤은 첫 번째 resolve 시에 생성됨
  }

  resolve<T>(token: ServiceToken): T {
    // 싱글톤 확인
    if (this.singletons.has(token)) {
      return this.singletons.get(token);
    }

    const factory = this.services.get(token);
    if (!factory) {
      throw new Error(`Service not registered: ${String(token)}`);
    }

    const instance = factory();
    
    // 싱글톤인지 확인 (factory가 등록된 방식으로 판단)
    if (this.services.has(token)) {
      this.singletons.set(token, instance);
    }

    return instance;
  }

  isRegistered(token: ServiceToken): boolean {
    return this.services.has(token);
  }

  clear(): void {
    this.services.clear();
    this.singletons.clear();
  }
}

// 싱글톤 인스턴스
export const container = new DIContainerImpl();

// 서비스 토큰 정의
export const TOKENS = {
  // 주석 관련 서비스
  ANNOTATION_SERVICE: Symbol('AnnotationService'),
  ANNOTATION_REGISTRY: Symbol('AnnotationRegistry'),
  
  // 뷰 관련 서비스
  VIEW_SERVICE: Symbol('ViewService'),
  
  // 내보내기 관련 서비스
  EXPORT_SERVICE: Symbol('ExportService'),
  EMAIL_SERVICE: Symbol('EmailService'),
  
  // AI 관련 서비스
  AI_SERVICE: Symbol('AIService'),
  OCR_SERVICE: Symbol('OCRService'),
  
  // 레이어 관련 서비스
  LAYER_SERVICE: Symbol('LayerService'),
  
  // 이벤트 관련 서비스
  EVENT_BUS: Symbol('EventBus'),
} as const;

// 서비스 등록 헬퍼 함수
export function registerServices(): void {
  logger.debug('🔧 [DI Container] Registering services...');
  
  // 이벤트 버스 등록
  container.registerSingleton(TOKENS.EVENT_BUS, () => {
    return import('../events/EventBus').then(module => module.eventBus);
  });
  
  // 주석 서비스 등록
  container.registerSingleton(TOKENS.ANNOTATION_SERVICE, () => {
    return import('../../domains/annotations/services/AnnotationService').then(module => module.annotationService);
  });
  
  container.registerSingleton(TOKENS.ANNOTATION_REGISTRY, () => {
    return import('../../domains/annotations/services/AnnotationRegistry').then(module => module.annotationRegistry);
  });
  
  logger.debug('✅ [DI Container] Services registered successfully');
}
