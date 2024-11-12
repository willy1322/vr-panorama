import { useRef, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useTexture, useGLTF, useFBX } from '@react-three/drei';
import { useXR, Interactive } from '@react-three/xr';
import * as THREE from 'three';
import { useStore } from '../store';

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
  const rotationInRadians = (rotation * Math.PI) / 180;
  const scaleFactor = scale * 0.5; // Increased scale factor for better visibility

  if (type === 'cube') {
    return (
      <mesh position={position} scale={scaleFactor} rotation={[0, rotationInRadians, 0]}>
        <boxGeometry />
        <meshPhongMaterial color="hotpink" shininess={60} />
      </mesh>
    );
  }

  if (type === 'sphere') {
    return (
      <mesh position={position} scale={scaleFactor} rotation={[0, rotationInRadians, 0]}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshPhongMaterial color="lightblue" shininess={60} />
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
        scale={scaleFactor}
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
        scale={scaleFactor}
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
  const gyroscopeQuaternion = useRef(new THREE.Quaternion());
  const initialOrientation = useRef<{ alpha: number; beta: number; gamma: number } | null>(null);
  const [gyroscopeEnabled, setGyroscopeEnabled] = useState(false);
  
  const [zoom, setZoom] = useState(75);
  const zoomSpeed = 1.5;
  const minZoom = 30;
  const maxZoom = 90;
  const touchSensitivity = 1.2;

  useEffect(() => {
    camera.fov = zoom;
    camera.near = 0.1;
    camera.far = 1000;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.position.set(0, 0, 0);
    camera.updateProjectionMatrix();
  }, [camera, zoom]);

  useEffect(() => {
    let gyroscopeHandler: ((event: DeviceOrientationEvent) => void) | null = null;

    if (gyroscopeEnabled) {
      gyroscopeHandler = (event: DeviceOrientationEvent) => {
        if (event.alpha === null || event.beta === null || event.gamma === null) return;

        if (!initialOrientation.current) {
          initialOrientation.current = {
            alpha: event.alpha,
            beta: 90,
            gamma: event.gamma
          };
        }

        const alpha = event.alpha * (Math.PI / 180);
        const beta = (event.beta - 90) * (Math.PI / 180);
        const gamma = event.gamma * (Math.PI / 180);

        const qX = new THREE.Quaternion();
        const qY = new THREE.Quaternion();
        const qZ = new THREE.Quaternion();

        qX.setFromAxisAngle(new THREE.Vector3(1, 0, 0), beta);
        qY.setFromAxisAngle(new THREE.Vector3(0, 1, 0), alpha);
        qZ.setFromAxisAngle(new THREE.Vector3(0, 0, 1), -gamma);

        const quaternion = new THREE.Quaternion();
        quaternion
          .multiply(qY)
          .multiply(qX)
          .multiply(qZ);

        gyroscopeQuaternion.current.slerp(quaternion, 0.1);
      };

      window.addEventListener('deviceorientation', gyroscopeHandler);
    } else {
      initialOrientation.current = null;
    }

    return () => {
      if (gyroscopeHandler) {
        window.removeEventListener('deviceorientation', gyroscopeHandler);
      }
    };
  }, [gyroscopeEnabled, isPresenting]);

  useEffect(() => {
    if (isPresenting) return;

    const vrButton = document.getElementById('VRButton');
    const vrContainer = document.getElementById('vr-button-container');

    const handleMouseDown = (e: MouseEvent) => {
      if (e.target instanceof HTMLElement && 
          !vrButton?.contains(e.target) && 
          !vrContainer?.contains(e.target) &&
          !e.target.closest('.ui-panel')) {
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
      if (e.target instanceof HTMLElement &&
          (vrButton?.contains(e.target) || 
          vrContainer?.contains(e.target) ||
          e.target.closest('.ui-panel'))) {
        return;
      }

      e.preventDefault();
      touchCount.current = e.touches.length;

      if (e.touches.length === 1) {
        isDragging.current = true;
        previousMousePosition.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      } else if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        initialTouchDistance.current = Math.sqrt(dx * dx + dy * dy);
        initialZoom.current = zoom;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.target instanceof HTMLElement &&
          (vrButton?.contains(e.target) || 
          vrContainer?.contains(e.target) ||
          e.target.closest('.ui-panel'))) {
        return;
      }

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
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const scale = distance / initialTouchDistance.current;
        const newZoom = initialZoom.current / scale;
        setZoom(Math.max(minZoom, Math.min(maxZoom, newZoom)));
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (e.target instanceof HTMLElement &&
          (vrButton?.contains(e.target) || 
          vrContainer?.contains(e.target) ||
          e.target.closest('.ui-panel'))) {
        return;
      }
      touchCount.current = e.touches.length;
      if (e.touches.length === 0) {
        isDragging.current = false;
      }
    };

    const handleWheel = (e: WheelEvent) => {
      if (e.target instanceof HTMLElement &&
          (vrButton?.contains(e.target) || 
          vrContainer?.contains(e.target) ||
          e.target.closest('.ui-panel'))) {
        return;
      }
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
      if (gyroscopeEnabled) {
        camera.quaternion.copy(gyroscopeQuaternion.current);
      } else {
        const rotationQuaternion = new THREE.Quaternion()
          .setFromEuler(new THREE.Euler(
            cameraRotation.current.x,
            cameraRotation.current.y,
            0,
            'YXZ'
          ));
        camera.quaternion.copy(rotationQuaternion);
      }
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
        <sphereGeometry args={[20, 60, 40]} />
        <meshBasicMaterial map={panoramaTexture} side={THREE.BackSide} />
      </mesh>

      <ambientLight intensity={0.8} />
      <directionalLight position={[5, 5, 5]} intensity={1} />
      <pointLight position={[0, 0, 0]} intensity={0.5} />

      <group ref={objectsGroupRef}>
        {objects.map((object) => (
          <Object3DComponent key={object.id} object={object} />
        ))}
      </group>
    </>
  );
}