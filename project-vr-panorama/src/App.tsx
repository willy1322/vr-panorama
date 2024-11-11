import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Scene } from './components/Scene';
import { LoadingScreen } from './components/LoadingScreen';
import { UI } from './components/UI';
import { ErrorBoundary } from './components/ErrorBoundary';
import { VRButton, XR } from '@react-three/xr';

export default function App() {
  return (
    <div className="h-screen w-screen">
      <LoadingScreen />
      <UI />
      <VRButton />
      <ErrorBoundary>
        <Canvas>
          <XR>
            <Suspense fallback={null}>
              <Scene />
            </Suspense>
          </XR>
        </Canvas>
      </ErrorBoundary>
    </div>
  );
}