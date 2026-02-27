/**
 * i18n System — 다국어 지원 모듈
 *
 * - LocaleStore: zustand 기반 언어 상태 관리 (ko/en)
 * - useTranslation: 컴포넌트에서 번역 텍스트 가져오기
 * - t(): dot-path 키로 번역 문자열 반환 + {var} 치환
 */

import { create } from 'zustand';
import ko from './ko.json';
import en from './en.json';

// ── 타입 ──

export type Locale = 'ko' | 'en';

type TranslationData = typeof ko;

const translations: Record<Locale, TranslationData> = { ko, en };

// ── LocaleStore ──

interface LocaleStore {
    locale: Locale;
    setLocale: (locale: Locale) => void;
    toggleLocale: () => void;
}

const STORAGE_KEY = 'justflux-locale';

function loadLocale(): Locale {
    if (typeof window === 'undefined') return 'ko';
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'ko' || saved === 'en') return saved;
    // 브라우저 언어 감지
    const nav = navigator.language.toLowerCase();
    return nav.startsWith('ko') ? 'ko' : 'en';
}

export const useLocaleStore = create<LocaleStore>()((set, get) => ({
    locale: loadLocale(),

    setLocale: (locale) => {
        localStorage.setItem(STORAGE_KEY, locale);
        document.documentElement.setAttribute('lang', locale);
        set({ locale });
    },

    toggleLocale: () => {
        const next = get().locale === 'ko' ? 'en' : 'ko';
        get().setLocale(next);
    },
}));

// 초기 lang 속성 설정
if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('lang', useLocaleStore.getState().locale);
}

// ── 번역 유틸 ──

/**
 * dot-path 키로 번역 문자열을 가져옵니다.
 *
 * @example t('tools.select')        => "선택" | "Select"
 * @example t('theme.toggle', { mode: '다크' }) => "테마: 다크 (클릭하여 변경)"
 */
export function t(key: string, vars?: Record<string, string | number>): string {
    const locale = useLocaleStore.getState().locale;
    const data = translations[locale];

    // dot-path 탐색
    const parts = key.split('.');
    let result: any = data;
    for (const part of parts) {
        if (result == null || typeof result !== 'object') return key;
        result = result[part];
    }

    if (typeof result !== 'string') return key;

    // {var} 치환
    if (vars) {
        return result.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`));
    }
    return result;
}

// ── React Hook ──

/**
 * React 컴포넌트에서 사용하는 번역 훅.
 * locale 변경 시 자동 리렌더링.
 */
export function useTranslation() {
    const locale = useLocaleStore((s) => s.locale);

    const translate = (key: string, vars?: Record<string, string | number>): string => {
        const data = translations[locale];
        const parts = key.split('.');
        let result: any = data;
        for (const part of parts) {
            if (result == null || typeof result !== 'object') return key;
            result = result[part];
        }
        if (typeof result !== 'string') return key;
        if (vars) {
            return result.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`));
        }
        return result;
    };

    return { t: translate, locale };
}
