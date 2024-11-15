import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';

export default function Lighting() {
  const lightRef = useRef<THREE.DirectionalLight>(null);

  useFrame((state) => {
    if (lightRef.current) {
      const { camera } = state;
      lightRef.current.position.set(
        camera.position.x + 5,
        camera.position.y + 5,
        camera.position.z + 5
      );
      lightRef.current.target.position.set(
        camera.position.x,
        camera.position.y,
        camera.position.z
      );
      lightRef.current.target.updateMatrixWorld();
    }
  });

  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight
        ref={lightRef}
        intensity={1.2}
        position={[5, 5, 5]}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      >
        <orthographicCamera attach="shadow-camera" args={[-10, 10, -10, 10, 0.1, 50]} />
      </directionalLight>
      <hemisphereLight 
        intensity={0.4}
        groundColor="#1e1b4b"
        color="#3730a3"
      />
      <pointLight
        position={[0, 4, 0]}
        intensity={0.8}
        color="#4f46e5"
        distance={8}
        decay={2}
      />
    </>
  );
}