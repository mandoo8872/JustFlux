/**
 * Theme Store — 테마 상태 관리
 *
 * 3가지 모드:
 *  - 'system': OS 설정 따름 (prefers-color-scheme)
 *  - 'light':  강제 라이트
 *  - 'dark':   강제 다크
 *
 * <html> 태그에 data-theme 속성을 동기화하여
 * design-tokens.css의 다크 모드 변수를 활성화합니다.
 */

import { create } from 'zustand';

type ThemePreference = 'system' | 'light' | 'dark';

interface ThemeStore {
    /** 사용자 선택 테마 */
    preference: ThemePreference;

    /** 실제 적용된 테마 (system일 때 OS 결과 반영) */
    resolved: 'light' | 'dark';

    /** 테마 변경 */
    setPreference: (pref: ThemePreference) => void;

    /** 순환 토글: system → light → dark → system */
    cycleTheme: () => void;

    /** OS 미디어쿼리 변경 시 resolved 갱신 */
    _syncOS: () => void;
}

function resolveTheme(pref: ThemePreference): 'light' | 'dark' {
    if (pref === 'light') return 'light';
    if (pref === 'dark') return 'dark';
    // system
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
    }
    return 'light';
}

function applyToDOM(pref: ThemePreference, resolved: 'light' | 'dark') {
    const root = document.documentElement;
    if (pref === 'system') {
        // data-theme 제거 → CSS @media 가 자동 작동
        root.removeAttribute('data-theme');
    } else {
        root.setAttribute('data-theme', resolved);
    }
}

const CYCLE_ORDER: ThemePreference[] = ['system', 'light', 'dark'];

// localStorage로 사용자 선호 유지
const STORAGE_KEY = 'justflux-theme';
function loadPreference(): ThemePreference {
    if (typeof window === 'undefined') return 'system';
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'light' || saved === 'dark' || saved === 'system') return saved;
    return 'system';
}

const initialPref = loadPreference();
const initialResolved = resolveTheme(initialPref);

// 초기 DOM 적용
if (typeof document !== 'undefined') {
    applyToDOM(initialPref, initialResolved);
}

export const useThemeStore = create<ThemeStore>()((set, get) => ({
    preference: initialPref,
    resolved: initialResolved,

    setPreference: (pref) => {
        const resolved = resolveTheme(pref);
        applyToDOM(pref, resolved);
        localStorage.setItem(STORAGE_KEY, pref);
        set({ preference: pref, resolved });
    },

    cycleTheme: () => {
        const { preference } = get();
        const idx = CYCLE_ORDER.indexOf(preference);
        const next = CYCLE_ORDER[(idx + 1) % CYCLE_ORDER.length];
        get().setPreference(next);
    },

    _syncOS: () => {
        const { preference } = get();
        if (preference === 'system') {
            const resolved = resolveTheme('system');
            applyToDOM('system', resolved);
            set({ resolved });
        }
    },
}));

// OS 테마 변경 감지
if (typeof window !== 'undefined') {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', () => {
        useThemeStore.getState()._syncOS();
    });
}
