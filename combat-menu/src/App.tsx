import { Canvas } from '@react-three/fiber';
import { VRButton, XR } from '@react-three/xr';
import VRScene from './components/VRScene';
import ErrorBoundary from './components/ErrorBoundary';
import { Suspense } from 'react';

export default function App() {
  return (
    <ErrorBoundary>
      <VRButton />
      <Canvas
        camera={{
          fov: 75,
          near: 0.1,
          far: 1000,
          position: [0, 1.6, 0]
        }}
      >
        <Suspense fallback={null}>
          <XR>
            <VRScene />
          </XR>
        </Suspense>
      </Canvas>
    </ErrorBoundary>
  );
}