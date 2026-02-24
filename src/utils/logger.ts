/**
 * Conditional Logger — 프로덕션 빌드에서 debug 로그 자동 제거
 *
 * 사용법:
 *   import { logger } from '@/utils/logger';
 *   logger.debug('초기화 완료');   // DEV에서만 출력
 *   logger.warn('경고 메시지');     // 항상 출력
 *   logger.error('에러 메시지');    // 항상 출력
 */

const isDev = import.meta.env.DEV;

/* eslint-disable no-console */
export const logger = {
    /** 개발 환경에서만 출력. 프로덕션 빌드 시 tree-shake됨. */
    debug: isDev
        ? (...args: unknown[]) => console.log(...args)
        : () => { },

    /** 경고. 항상 출력. */
    warn: (...args: unknown[]) => console.warn(...args),

    /** 에러. 항상 출력. */
    error: (...args: unknown[]) => console.error(...args),
};
