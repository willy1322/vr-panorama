import { memo, useMemo } from 'react';
import * as THREE from 'three';
import { extend } from '@react-three/fiber';

class GridMaterial extends THREE.ShaderMaterial {
  constructor() {
    super({
      uniforms: {
        uTime: { value: 0 },
        uColor1: { value: new THREE.Color('#1e1b4b') },  // Deep indigo
        uColor2: { value: new THREE.Color('#3730a3') },  // Rich purple
        uGridScale: { value: 1.0 },
        uSmoothing: { value: 0.5 }
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
        uniform vec3 uColor1;
        uniform vec3 uColor2;
        uniform float uGridScale;
        uniform float uSmoothing;
        
        varying vec2 vUv;
        varying vec3 vPosition;
        
        float getGrid(vec2 pos, float scale) {
          vec2 grid = abs(fract(pos * scale - 0.5) - 0.5) / fwidth(pos * scale);
          return min(grid.x, grid.y);
        }
        
        void main() {
          float grid = getGrid(vPosition.xz, uGridScale);
          float line = 1.0 - min(grid, 1.0);
          
          // Enhanced gradient with radial falloff
          float distanceFromCenter = length(vPosition.xz) * 0.15;
          float radialGradient = 1.0 - smoothstep(0.0, 8.0, distanceFromCenter);
          
          // Combine linear and radial gradients
          float gradientFactor = mix(
            smoothstep(-10.0, 10.0, vPosition.x) * 0.5 + 0.5,
            radialGradient,
            0.5
          );
          
          vec3 gradientColor = mix(uColor1, uColor2, gradientFactor);
          
          // Smoother grid lines with subtle glow
          float smoothedLine = smoothstep(1.0 - uSmoothing, 1.0, line);
          vec3 glowColor = mix(gradientColor * 1.5, gradientColor, smoothedLine);
          vec3 finalColor = mix(vec3(0.08), glowColor, smoothedLine * 0.9);
          
          gl_FragColor = vec4(finalColor, 1.0);
        }
      `
    });
  }
}

extend({ GridMaterial });

function Floor() {
  const gridConfig = useMemo(() => ({
    size: 40,
    divisions: 40,
    gridScale: 0.8,
    smoothing: 0.5
  }), []);

  return (
    <group>
      <mesh 
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[0, -0.001, 0]} 
        receiveShadow
      >
        <planeGeometry args={[gridConfig.size, gridConfig.size, 64, 64]} />
        {/* @ts-ignore */}
        <gridMaterial 
          key={GridMaterial.toString()}
          uGridScale={gridConfig.gridScale}
          uSmoothing={gridConfig.smoothing}
          transparent={true}
        />
      </mesh>
    </group>
  );
}

export default memo(Floor);