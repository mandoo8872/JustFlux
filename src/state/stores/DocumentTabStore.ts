/**
 * DocumentTabStore - 다중 문서 탭 관리 스토어
 * 최대 5개 문서 탭 지원, 활성 문서 전환
 */

import { create } from 'zustand';
import type { Document } from '../../core/model/types';

interface DocumentTab {
    id: string;
    name: string;
    document: Document;
}

interface DocumentTabState {
    tabs: DocumentTab[];
    activeTabId: string | null;
    maxTabs: number;
}

interface DocumentTabActions {
    openDocument: (document: Document) => boolean;
    closeTab: (tabId: string) => void;
    switchTab: (tabId: string) => void;
    updateTabName: (tabId: string, name: string) => void;
    getActiveDocument: () => Document | null;
}

export const useDocumentTabStore = create<DocumentTabState & DocumentTabActions>((set, get) => ({
    tabs: [],
    activeTabId: null,
    maxTabs: 5,

    openDocument: (document: Document) => {
        const { tabs, maxTabs } = get();

        // Check if document is already open
        const existingTab = tabs.find(tab => tab.document.id === document.id);
        if (existingTab) {
            set({ activeTabId: existingTab.id });
            return true;
        }

        // Check max tabs limit
        if (tabs.length >= maxTabs) {
            console.warn(`[DocumentTabStore] Maximum ${maxTabs} tabs reached`);
            return false;
        }

        // Create new tab
        const newTab: DocumentTab = {
            id: `tab-${Date.now()}`,
            name: document.name,
            document,
        };

        set({
            tabs: [...tabs, newTab],
            activeTabId: newTab.id,
        });

        return true;
    },

    closeTab: (tabId: string) => {
        const { tabs, activeTabId } = get();
        const tabIndex = tabs.findIndex(tab => tab.id === tabId);

        if (tabIndex === -1) return;

        const newTabs = tabs.filter(tab => tab.id !== tabId);

        // If closing active tab, switch to adjacent tab
        let newActiveId: string | null = null;
        if (activeTabId === tabId && newTabs.length > 0) {
            const newIndex = Math.min(tabIndex, newTabs.length - 1);
            newActiveId = newTabs[newIndex].id;
        } else if (activeTabId !== tabId) {
            newActiveId = activeTabId;
        }

        set({
            tabs: newTabs,
            activeTabId: newActiveId,
        });
    },

    switchTab: (tabId: string) => {
        const { tabs } = get();
        const tab = tabs.find(t => t.id === tabId);
        if (tab) {
            set({ activeTabId: tabId });
        }
    },

    updateTabName: (tabId: string, name: string) => {
        set(state => ({
            tabs: state.tabs.map(tab =>
                tab.id === tabId ? { ...tab, name } : tab
            ),
        }));
    },

    getActiveDocument: () => {
        const { tabs, activeTabId } = get();
        const activeTab = tabs.find(tab => tab.id === activeTabId);
        return activeTab?.document || null;
    },
}));
