import { useState } from 'react';
import { Text } from '@react-three/drei';
import { Interactive } from '@react-three/xr';
import { useSpring, animated } from '@react-spring/three';
import * as THREE from 'three';
import { RoundedBox } from '@react-three/drei';

interface MenuItemProps {
  icon: string;
  label: string;
  status?: string;
  position: [number, number, number];
  index: number;
}

export default function MenuItem({ icon, label, status, position }: MenuItemProps) {
  const [hovered, setHovered] = useState(false);

  const { scale, glowIntensity } = useSpring({
    scale: hovered ? 1.02 : 1,
    glowIntensity: hovered ? 0.3 : 0,
    config: { mass: 1, tension: 280, friction: 60 }
  });

  // Enhanced gradient material with better depth effect
  const gradientMaterial = new THREE.ShaderMaterial({
    uniforms: {
      color1: { value: new THREE.Color(hovered ? '#2a2b36' : '#1e1f2a') },
      color2: { value: new THREE.Color('#14151c') },
      glowColor: { value: new THREE.Color('#ff3e3e') },
      glowIntensity: { value: 0 },
      time: { value: 0 }
    },
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vPosition;
      void main() {
        vUv = uv;
        vPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 color1;
      uniform vec3 color2;
      uniform vec3 glowColor;
      uniform float glowIntensity;
      uniform float time;
      varying vec2 vUv;
      varying vec3 vPosition;
      
      void main() {
        // Enhanced gradient with subtle noise
        float noise = fract(sin(dot(vUv, vec2(12.9898, 78.233))) * 43758.5453);
        vec3 baseColor = mix(color2, color1, vUv.y + noise * 0.02);
        
        // Edge highlight
        float edge = smoothstep(0.9, 1.0, vUv.x) + smoothstep(0.9, 1.0, 1.0 - vUv.x);
        edge += smoothstep(0.9, 1.0, vUv.y) + smoothstep(0.9, 1.0, 1.0 - vUv.y);
        
        // Combine colors with glow
        vec3 finalColor = mix(baseColor, glowColor, edge * 0.1 + glowIntensity);
        
        // Add subtle depth
        float depth = (1.0 - vUv.y) * 0.1;
        finalColor = mix(finalColor, color2, depth);
        
        gl_FragColor = vec4(finalColor, 0.95);
      }
    `,
    transparent: true
  });

  return (
    <Interactive
      onHover={() => setHovered(true)}
      onBlur={() => setHovered(false)}
    >
      <animated.group scale={scale} position={position}>
        {/* Main button background with rounded corners */}
        <RoundedBox
          args={[0.9, 0.12, 0.01]}
          radius={0.06}
          smoothness={4}
        >
          <primitive object={gradientMaterial} attach="material" />
        </RoundedBox>

        {/* Red accent bar on hover with glow */}
        {hovered && (
          <group position={[-0.44, 0, 0.001]}>
            <RoundedBox
              args={[0.02, 0.12, 0.005]}
              radius={0.01}
              smoothness={4}
            >
              <meshBasicMaterial
                color="#ff3e3e"
                transparent
                opacity={0.8}
              />
            </RoundedBox>
            {/* Glow effect */}
            <pointLight
              color="#ff3e3e"
              intensity={0.5}
              distance={0.1}
              position={[0, 0, 0.02]}
            />
          </group>
        )}

        {/* Icon */}
        <Text
          position={[-0.35, 0, 0.01]}
          fontSize={0.045}
          color={hovered ? "#ff4646" : "#ff3e3e"}
          anchorX="left"
          anchorY="middle"
        >
          {icon}
        </Text>

        {/* Label */}
        <Text
          position={[-0.2, 0, 0.01]}
          fontSize={0.045}
          color={hovered ? "#ffffff" : "#dddddd"}
          anchorX="left"
          anchorY="middle"
        >
          {label}
        </Text>

        {/* Status */}
        {status && (
          <Text
            position={[0.35, 0, 0.01]}
            fontSize={0.035}
            color={status.includes('·') ? "#ff3e3e" : "#666666"}
            anchorX="right"
            anchorY="middle"
          >
            {status}
          </Text>
        )}
      </animated.group>
    </Interactive>
  );
}