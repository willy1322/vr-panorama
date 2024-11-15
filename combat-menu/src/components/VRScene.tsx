import Floor from './Floor';
import Lighting from './Lighting';
import VRControls from './VRControls';
import VRMenu from './VRMenu';
import { Environment } from '@react-three/drei';

export default function VRScene() {
  return (
    <>
      <Environment preset="sunset" />
      <Lighting />
      <Floor />
      <VRControls />
      <VRMenu />
      <fog attach="fog" args={['#e5e7eb', 0, 30]} />
    </>
  );
}