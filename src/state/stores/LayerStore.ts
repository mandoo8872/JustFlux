/**
 * Layer Store - 레이어 관리 전용
 * 래스터 레이어, 벡터 레이어, 텍스트 레이어 등 모든 레이어 타입 관리
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { RasterLayer } from '../../core/model/types';

// 임시 Layer 타입 정의
interface Layer {
  id: string;
  name: string;
  type: 'raster' | 'vector' | 'text';
  visible: boolean;
  locked: boolean;
  opacity: number;
  blendMode: string;
}

interface LayerStore {
  // 레이어 상태
  layers: Layer[];
  activeLayerId: string | null;
  
  // 로딩 상태
  isLayerLoading: boolean;
  layerError: string | null;
  
  // ============================================
  // Layer Actions
  // ============================================
  
  /** 래스터 레이어 추가 */
  addRasterLayer: (layer: RasterLayer) => void;
  
  /** 레이어 제거 */
  removeLayer: (layerId: string) => void;
  
  /** 레이어 업데이트 */
  updateLayer: (layerId: string, updates: Partial<Layer>) => void;
  
  /** 레이어 순서 변경 */
  reorderLayers: (fromIndex: number, toIndex: number) => void;
  
  /** 활성 레이어 설정 */
  setActiveLayer: (layerId: string | null) => void;
  
  /** 레이어 복제 */
  duplicateLayer: (layerId: string) => void;
  
  /** 레이어 병합 */
  mergeLayers: (layerIds: string[]) => void;
  
  // ============================================
  // Utility Actions
  // ============================================
  
  /** 레이어 검색 */
  findLayer: (layerId: string) => Layer | null;
  
  /** 레이어 필터링 */
  filterLayers: (predicate: (layer: Layer) => boolean) => Layer[];
  
  /** 활성 레이어 가져오기 */
  getActiveLayer: () => Layer | null;
  
  /** 레이어 개수 */
  getLayerCount: () => number;
}

export const useLayerStore = create<LayerStore>()(
  immer((set, get) => ({
    // 초기 상태
    layers: [],
    activeLayerId: null,
    isLayerLoading: false,
    layerError: null,
    
    // ============================================
    // Layer Actions
    // ============================================
    
    addRasterLayer: (layer: RasterLayer) => {
      set((state) => {
        const layerToAdd: Layer = {
          id: layer.id,
          name: `Layer ${layer.id}`,
          type: 'raster',
          locked: false,
          visible: true,
          opacity: 1.0,
          blendMode: 'normal'
        };
        state.layers.push(layerToAdd);
        state.activeLayerId = layer.id;
      });
    },
    
    removeLayer: (layerId: string) => {
      set((state) => {
        const index = state.layers.findIndex(layer => layer.id === layerId);
        if (index !== -1) {
          state.layers.splice(index, 1);
          if (state.activeLayerId === layerId) {
            state.activeLayerId = state.layers.length > 0 ? state.layers[0].id : null;
          }
        }
      });
    },
    
    updateLayer: (layerId: string, updates: Partial<Layer>) => {
      set((state) => {
        const layer = state.layers.find(l => l.id === layerId);
        if (layer) {
          Object.assign(layer, updates);
        }
      });
    },
    
    reorderLayers: (fromIndex: number, toIndex: number) => {
      set((state) => {
        const [movedLayer] = state.layers.splice(fromIndex, 1);
        state.layers.splice(toIndex, 0, movedLayer);
      });
    },
    
    setActiveLayer: (layerId: string | null) => {
      set((state) => {
        state.activeLayerId = layerId;
      });
    },
    
    duplicateLayer: (layerId: string) => {
      set((state) => {
        const originalLayer = state.layers.find(l => l.id === layerId);
        if (originalLayer) {
          const duplicatedLayer = {
            ...originalLayer,
            id: `layer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: `${originalLayer.name} (Copy)`
          };
          state.layers.push(duplicatedLayer);
        }
      });
    },
    
    mergeLayers: (layerIds: string[]) => {
      set((state) => {
        const layersToMerge = state.layers.filter(l => layerIds.includes(l.id));
        if (layersToMerge.length > 1) {
          // 첫 번째 레이어를 기준으로 병합
          const baseLayer = layersToMerge[0];
          // 병합 로직 구현 (레이어 타입에 따라 다름)
          
          // 나머지 레이어들 제거
          state.layers = state.layers.filter(l => !layerIds.includes(l.id) || l.id === baseLayer.id);
        }
      });
    },
    
    // ============================================
    // Utility Actions
    // ============================================
    
    findLayer: (layerId: string) => {
      const state = get();
      return state.layers.find(layer => layer.id === layerId) || null;
    },
    
    filterLayers: (predicate: (layer: Layer) => boolean) => {
      const state = get();
      return state.layers.filter(predicate);
    },
    
    getActiveLayer: () => {
      const state = get();
      return state.layers.find(layer => layer.id === state.activeLayerId) || null;
    },
    
    getLayerCount: () => {
      const state = get();
      return state.layers.length;
    },
  }))
);
