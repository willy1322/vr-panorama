import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ObjectType = 'cube' | 'sphere' | 'glb' | 'fbx' | 'panorama';

export interface Object3D {
  id: string;
  type: ObjectType;
  position: [number, number, number];
  rotation: number;
  scale: number;
  url?: string;
}

interface Store {
  objects: Object3D[];
  selectedObjectId: string | null;
  panoramaUrl: string;
  gyroscopeEnabled: boolean;
  addObject: (object: Object3D) => void;
  clearObjects: () => void;
  updateObject: (id: string, updates: Partial<Omit<Object3D, 'id' | 'type'>>) => void;
  selectObject: (id: string | null) => void;
  setPanoramaUrl: (url: string) => void;
}

const DEFAULT_PANORAMA = 'https://raw.githubusercontent.com/willy1322/vr-panorama/main/black.png';

const usePersistedStore = create(
  persist<Omit<Store, 'panoramaUrl' | 'setPanoramaUrl' | 'gyroscopeEnabled'>>(
    (set) => ({
      objects: [],
      selectedObjectId: null,
      addObject: (object) => set((state) => ({ 
        objects: [...state.objects, object],
        selectedObjectId: object.id
      })),
      clearObjects: () => set({ objects: [], selectedObjectId: null }),
      updateObject: (id, updates) => set((state) => ({
        objects: state.objects.map((obj) =>
          obj.id === id ? { ...obj, ...updates } : obj
        ),
      })),
      selectObject: (id) => set({ selectedObjectId: id }),
    }),
    {
      name: 'vr-panorama-state',
      partialize: (state) => ({
        objects: state.objects,
      }),
      version: 1,
    }
  )
);

export const useStore = create<Store>((set, get) => ({
  ...usePersistedStore.getState(),
  panoramaUrl: DEFAULT_PANORAMA,
  gyroscopeEnabled: false,
  setPanoramaUrl: (url) => set({ panoramaUrl: url }),
  addObject: (object) => {
    set((state) => ({
      objects: [...state.objects, object],
      selectedObjectId: object.id
    }));
  },
  clearObjects: () => {
    set({ objects: [], selectedObjectId: null });
  },
  updateObject: (id, updates) => {
    set((state) => ({
      objects: state.objects.map((obj) =>
        obj.id === id ? { ...obj, ...updates } : obj
      ),
    }));
  },
  selectObject: (id) => set({ selectedObjectId: id }),
}));