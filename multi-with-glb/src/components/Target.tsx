import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3 } from 'three';
import { useXR } from '@react-three/xr';

interface TargetProps {
  initialPosition: Vector3;
  onHit: () => void;
}

export function Target({ initialPosition, onHit }: TargetProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [isExploding, setIsExploding] = useState(false);
  const explosionProgress = useRef(0);
  const velocity = useRef(new Vector3(Math.random() - 0.5, 0, Math.random() - 0.5).normalize().multiplyScalar(2));

  useFrame((_, delta) => {
    if (!meshRef.current) return;

    if (isExploding) {
      explosionProgress.current += delta * 2;
      meshRef.current.scale.setScalar(1 - explosionProgress.current);
      if (explosionProgress.current >= 1) {
        onHit();
      }
      return;
    }

    // Move target
    meshRef.current.position.add(velocity.current.clone().multiplyScalar(delta));

    // Bounce off boundaries
    const bounds = 10;
    ['x', 'z'].forEach(axis => {
      if (Math.abs(meshRef.current!.position[axis]) > bounds) {
        velocity.current[axis] *= -1;
        meshRef.current!.position[axis] = Math.sign(meshRef.current!.position[axis]) * bounds;
      }
    });
  });

  const handleCollision = () => {
    if (!isExploding) {
      setIsExploding(true);
    }
  };

  return (
    <mesh ref={meshRef} position={initialPosition} userData={{ type: 'target', onHit: handleCollision }}>
      <sphereGeometry args={[0.2, 16, 16]} />
      <meshStandardMaterial 
        color={isExploding ? "#ff4444" : "#44ff44"}
        emissive={isExploding ? "#ff0000" : "#00ff00"}
        emissiveIntensity={isExploding ? 2 : 0.5}
        toneMapped={false}
      />
      {/* Glow effect */}
      <pointLight
        color={isExploding ? "#ff4444" : "#44ff44"}
        intensity={0.5}
        distance={1}
      />
    </mesh>
  );
}