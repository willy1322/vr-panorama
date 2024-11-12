import { create } from 'zustand';

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
  addObject: (object: Object3D) => void;
  clearObjects: () => void;
  updateObject: (id: string, updates: Partial<Omit<Object3D, 'id' | 'type'>>) => void;
  selectObject: (id: string | null) => void;
  setPanoramaUrl: (url: string) => void;
}

const DEFAULT_PANORAMA = 'https://images.unsplash.com/photo-1536152470836-b943b246224c?auto=format&fit=crop&w=2048&q=80';

export const useStore = create<Store>((set) => ({
  objects: [],
  selectedObjectId: null,
  panoramaUrl: DEFAULT_PANORAMA,
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
  setPanoramaUrl: (url) => set({ panoramaUrl: url }),
}))