import { useRef, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useTexture, useGLTF, useFBX } from '@react-three/drei';
import { useXR, Interactive } from '@react-three/xr';
import * as THREE from 'three';
import { useStore } from '../store';

// Object3D Component definition
interface Object3DProps {
  object: {
    id: string;
    type: 'cube' | 'sphere' | 'glb' | 'fbx';
    position: [number, number, number];
    scale: number;
    rotation: number;
    url?: string;
  };
}

function Object3DComponent({ object }: Object3DProps) {
  const { type, position, scale, rotation, url } = object;
  const rotationInRadians = (rotation * Math.PI) / 720;

  if (type === 'cube') {
    return (
      <mesh position={position} scale={scale} rotation={[0, rotationInRadians, 0]}>
        <boxGeometry />
        <meshStandardMaterial color="hotpink" />
      </mesh>
    );
  }

  if (type === 'sphere') {
    return (
      <mesh position={position} scale={scale} rotation={[0, rotationInRadians, 0]}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial color="lightblue" />
      </mesh>
    );
  }

  if (type === 'glb' && url) {
    const { scene } = useGLTF(url);
    const clone = scene.clone();
    
    return (
      <primitive 
        object={clone} 
        position={position}
        scale={scale}
        rotation={[0, rotationInRadians, 0]}
      />
    );
  }

  if (type === 'fbx' && url) {
    const fbx = useFBX(url);
    const clone = fbx.clone();
    
    return (
      <primitive 
        object={clone} 
        position={position}
        scale={scale}
        rotation={[0, rotationInRadians, 0]}
      />
    );
  }

  return null;
}

export function Scene() {
  const { camera } = useThree();
  const { isPresenting } = useXR();
  const objects = useStore((state) => state.objects);
  const panoramaUrl = useStore((state) => state.panoramaUrl);
  const panoramaTexture = useTexture(panoramaUrl);
  const isDragging = useRef(false);
  const previousMousePosition = useRef({ x: 0, y: 0 });
  const cameraRotation = useRef({ x: 0, y: 0 });
  const objectsGroupRef = useRef<THREE.Group>(null);
  const touchCount = useRef(0);
  const initialTouchDistance = useRef(0);
  const initialZoom = useRef(75);
  
  const [zoom, setZoom] = useState(75);
  const zoomSpeed = 1.5;
  const minZoom = 30;
  const maxZoom = 90;
  const touchSensitivity = 2; // Increased touch sensitivity

  useEffect(() => {
    camera.fov = zoom;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.position.set(0, 0, 0);
    camera.updateProjectionMatrix();
  }, [camera, zoom]);

  useEffect(() => {
    if (isPresenting) return;

    const handleMouseDown = (e: MouseEvent) => {
      if (e.target instanceof HTMLCanvasElement) {
        isDragging.current = true;
        previousMousePosition.current = { x: e.clientX, y: e.clientY };
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;

      const deltaX = e.clientX - previousMousePosition.current.x;
      const deltaY = e.clientY - previousMousePosition.current.y;

      cameraRotation.current.y += deltaX * 0.005;
      cameraRotation.current.x = Math.max(
        -Math.PI / 2,
        Math.min(Math.PI / 2, cameraRotation.current.x + deltaY * 0.005)
      );

      previousMousePosition.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => {
      isDragging.current = false;
    };

    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      touchCount.current = e.touches.length;

      if (e.touches.length === 1) {
        isDragging.current = true;
        previousMousePosition.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      } else if (e.touches.length === 2) {
        // Initialize pinch zoom
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        initialTouchDistance.current = Math.sqrt(dx * dx + dy * dy);
        initialZoom.current = zoom;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();

      if (e.touches.length === 1 && isDragging.current) {
        const deltaX = (e.touches[0].clientX - previousMousePosition.current.x) * touchSensitivity;
        const deltaY = (e.touches[0].clientY - previousMousePosition.current.y) * touchSensitivity;

        cameraRotation.current.y += deltaX * 0.005;
        cameraRotation.current.x = Math.max(
          -Math.PI / 2,
          Math.min(Math.PI / 2, cameraRotation.current.x + deltaY * 0.005)
        );

        previousMousePosition.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      } else if (e.touches.length === 2) {
        // Handle pinch zoom
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const scale = distance / initialTouchDistance.current;
        const newZoom = initialZoom.current / scale;
        setZoom(Math.max(minZoom, Math.min(maxZoom, newZoom)));
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      touchCount.current = e.touches.length;
      if (e.touches.length === 0) {
        isDragging.current = false;
      }
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const newZoom = zoom + (e.deltaY * 0.01 * zoomSpeed);
      setZoom(Math.max(minZoom, Math.min(maxZoom, newZoom)));
    };

    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchstart', handleTouchStart, { passive: false });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);
    window.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('wheel', handleWheel);
    };
  }, [isPresenting, zoom]);

  useFrame(() => {
    if (!isPresenting) {
      const rotationQuaternion = new THREE.Quaternion()
        .setFromEuler(new THREE.Euler(
          cameraRotation.current.x,
          cameraRotation.current.y,
          0,
          'YXZ'
        ));

      camera.quaternion.copy(rotationQuaternion);
    }
  });

  useEffect(() => {
    panoramaTexture.wrapS = THREE.RepeatWrapping;
    panoramaTexture.repeat.x = -1;
    panoramaTexture.needsUpdate = true;
  }, [panoramaTexture]);

  return (
    <>
      <mesh scale={[-1, 1, 1]}>
        <sphereGeometry args={[500, 60, 40]} />
        <meshBasicMaterial map={panoramaTexture} side={THREE.BackSide} />
      </mesh>

      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />

      <group ref={objectsGroupRef}>
        {objects.map((object) => (
          <Object3DComponent key={object.id} object={object} />
        ))}
      </group>
    </>
  );
}