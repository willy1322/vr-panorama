import { Canvas } from '@react-three/fiber';
import { VRButton, XR, Controllers, Hands } from '@react-three/xr';
import { Environment } from '@react-three/drei';
import { VRScene } from './components/VRScene';
import { UI } from './components/UI';

export function App() {
  return (
    <>
      <UI />
      <VRButton />
      <Canvas shadows camera={{ position: [0, 1.6, 2], fov: 50 }}>
        <XR>
          <Controllers />
          <Hands />
          <VRScene />
          <Environment preset="sunset" />
        </XR>
      </Canvas>
    </>
  );
}

export default App;