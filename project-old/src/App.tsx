import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Scene } from './components/Scene';
import { LoadingScreen } from './components/LoadingScreen';
import { UI } from './components/UI';
import { ErrorBoundary } from './components/ErrorBoundary';

export default function App() {
  return (
    <div className="h-screen w-screen">
      <LoadingScreen />
      <UI />
      <ErrorBoundary>
        <Canvas>
          <Suspense fallback={null}>
            <Scene />
          </Suspense>
        </Canvas>
      </ErrorBoundary>
    </div>
  );
}