import { useRef, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useTexture, useGLTF, useFBX } from '@react-three/drei';
import * as THREE from 'three';
import { useStore, ObjectType } from '../store';

function LoadedModel({ url, ...props }: { url: string } & JSX.IntrinsicElements['group']) {
  const fileExtension = url.split('.').pop()?.toLowerCase();
  
  if (fileExtension === 'glb' || fileExtension === 'gltf') {
    const { scene } = useGLTF(url);
    return <primitive object={scene.clone()} {...props} />;
  } else if (fileExtension === 'fbx') {
    const fbx = useFBX(url);
    return <primitive object={fbx.clone()} {...props} />;
  }
  
  return null;
}

function Object3DComponent({ object }: { object: { id: string; type: ObjectType; position: [number, number, number]; rotation: number; scale: number; url?: string } }) {
  const meshRef = useRef<THREE.Mesh | THREE.Group>(null);
  const selectedObjectId = useStore((state) => state.selectedObjectId);
  const selectObject = useStore((state) => state.selectObject);
  const [isLoaded, setIsLoaded] = useState(false);

  const isSelected = selectedObjectId === object.id;

  const handleClick = (e: THREE.Event) => {
    e.stopPropagation();
    selectObject(object.id);
  };

  useEffect(() => {
    if (meshRef.current) {
      meshRef.current.position.set(...object.position);
      meshRef.current.rotation.y = THREE.MathUtils.degToRad(object.rotation);
      meshRef.current.scale.setScalar(object.scale);
    }
  }, [object.position, object.rotation, object.scale]);

  if (object.type === 'glb' || object.type === 'fbx') {
    return (
      <group
        ref={meshRef}
        onClick={handleClick}
        onPointerMissed={() => selectObject(null)}
        position={object.position}
        rotation-y={THREE.MathUtils.degToRad(object.rotation)}
        scale={object.scale}
      >
        {object.url && <LoadedModel url={object.url} onLoad={() => setIsLoaded(true)} />}
        {isSelected && (
          <mesh scale={[1.05, 1.05, 1.05]} visible={isLoaded}>
            <boxGeometry args={[1, 1, 1]} />
            <meshBasicMaterial color={0x00ff00} wireframe transparent opacity={0.2} />
          </mesh>
        )}
      </group>
    );
  }

  const geometry = object.type === 'cube' 
    ? new THREE.BoxGeometry(1, 1, 1)
    : new THREE.SphereGeometry(0.5, 32, 32);

  const material = new THREE.MeshStandardMaterial({
    color: isSelected ? 0x00ff00 : 0x666666,
    metalness: 0.3,
    roughness: 0.7,
    emissive: isSelected ? 0x002200 : 0x000000
  });

  return (
    <mesh
      ref={meshRef}
      onClick={handleClick}
      onPointerMissed={() => selectObject(null)}
      geometry={geometry}
      material={material}
      position={object.position}
      rotation-y={THREE.MathUtils.degToRad(object.rotation)}
      scale={object.scale}
    />
  );
}

export function Scene() {
  const { camera } = useThree();
  const objects = useStore((state) => state.objects);
  const panoramaUrl = useStore((state) => state.panoramaUrl);
  const panoramaTexture = useTexture(panoramaUrl);
  const isDragging = useRef(false);
  const previousMousePosition = useRef({ x: 0, y: 0 });
  const cameraRotation = useRef({ x: 0, y: 0 });
  const objectsGroupRef = useRef<THREE.Group>(null);

  useEffect(() => {
    camera.fov = 75;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.position.set(0, 0, 0);
    camera.updateProjectionMatrix();
  }, [camera]);

  useEffect(() => {
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

    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  useFrame(() => {
    const rotationQuaternion = new THREE.Quaternion()
      .setFromEuler(new THREE.Euler(
        cameraRotation.current.x,
        cameraRotation.current.y,
        0,
        'YXZ'
      ));

    camera.quaternion.copy(rotationQuaternion);
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