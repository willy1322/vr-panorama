import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3 } from 'three';
import { useXR } from '@react-three/xr';

interface BulletProps {
  position: Vector3;
  direction: Vector3;
  onHit: () => void;
}

export function Bullet({ position, direction, onHit }: BulletProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const velocity = useRef(direction.normalize().multiplyScalar(15));
  const lifeTime = useRef(0);

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    // Update position
    meshRef.current.position.add(velocity.current.clone().multiplyScalar(delta));

    // Check for collisions
    const raycaster = state.raycaster;
    raycaster.ray.origin.copy(meshRef.current.position);
    raycaster.ray.direction.copy(velocity.current.clone().normalize());

    const intersects = raycaster.intersectObjects(
      state.scene.children,
      true
    );

    for (const intersect of intersects) {
      const hitObject = intersect.object;
      if (hitObject !== meshRef.current && hitObject.userData?.type === 'target') {
        hitObject.userData.onHit();
        onHit();
        return;
      }
    }

    // Remove bullet after 2 seconds
    lifeTime.current += delta;
    if (lifeTime.current > 2) {
      onHit();
    }
  });

  return (
    <mesh ref={meshRef} position={position}>
      <sphereGeometry args={[0.02, 8, 8]} />
      <meshStandardMaterial
        color="#ffff00"
        emissive="#ffff00"
        emissiveIntensity={2}
        toneMapped={false}
      />
      <pointLight color="#ffff00" intensity={0.2} distance={0.5} />
    </mesh>
  );
}