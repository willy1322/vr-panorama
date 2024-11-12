import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

export function TVScreen() {
  const screenRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const time = useRef(0);

  useFrame((_, delta) => {
    time.current += delta;
    
    if (glowRef.current) {
      glowRef.current.material.opacity = 0.3 + Math.sin(time.current * 2) * 0.1;
    }
  });

  return (
    <group>
      {/* TV Frame */}
      <mesh castShadow position={[0, 2, 0]}>
        <boxGeometry args={[4.2, 2.7, 0.2]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.7} roughness={0.2} />
      </mesh>

      {/* Screen */}
      <mesh ref={screenRef} position={[0, 2, 0.01]}>
        <planeGeometry args={[4, 2.5]} />
        <meshBasicMaterial color="#000000" />
      </mesh>

      {/* Screen Content */}
      <Text
        position={[0, 2, 0.02]}
        fontSize={0.2}
        color="#7eb6ff"
        anchorX="center"
        anchorY="middle"
      >
        WELCOME TO VR
      </Text>

      {/* Screen Glow */}
      <mesh ref={glowRef} position={[0, 2, 0.015]}>
        <planeGeometry args={[4.1, 2.6]} />
        <meshBasicMaterial 
          color="#7eb6ff"
          transparent
          opacity={0.2}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Stand */}
      <mesh castShadow position={[0, 0.8, 0.3]}>
        <boxGeometry args={[0.2, 1.6, 0.2]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.7} roughness={0.2} />
      </mesh>

      {/* Base */}
      <mesh castShadow position={[0, 0, 0.3]}>
        <boxGeometry args={[1, 0.1, 0.6]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.7} roughness={0.2} />
      </mesh>
    </group>
  );
}