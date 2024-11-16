import { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3, Quaternion, Group } from 'three';
import { usePeerStore } from '../store/peerStore';

interface RemoteUserProps {
  peerId: string;
}

interface UserState {
  position: Vector3;
  headRotation: Quaternion;
  controllers: {
    [key: string]: {
      position: Vector3;
      rotation: Quaternion;
      grip: {
        position: Vector3;
        rotation: Quaternion;
      };
    };
  };
}

function Quest3Headset() {
  return (
    <group>
      {/* Main visor body */}
      <mesh castShadow>
        <boxGeometry args={[0.2, 0.12, 0.11]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.5} roughness={0.3} />
      </mesh>

      {/* Front face plate */}
      <mesh position={[0, 0, -0.056]}>
        <boxGeometry args={[0.19, 0.11, 0.002]} />
        <meshStandardMaterial color="#2a2a2a" metalness={0.7} roughness={0.2} />
      </mesh>

      {/* Camera areas */}
      {[[-0.06, 0.02], [0.06, 0.02]].map(([x, y], i) => (
        <mesh key={i} position={[x, y, -0.057]} rotation={[0, 0, 0]}>
          <circleGeometry args={[0.01, 32]} />
          <meshStandardMaterial color="#111111" metalness={0.8} roughness={0.2} />
        </mesh>
      ))}

      {/* Facial interface */}
      <mesh position={[0, 0, 0.057]}>
        <boxGeometry args={[0.19, 0.11, 0.02]} />
        <meshStandardMaterial color="#2a2a2a" metalness={0.3} roughness={0.8} />
      </mesh>

      {/* Head strap */}
      <mesh position={[0, 0, 0.02]}>
        <torusGeometry args={[0.1, 0.015, 16, 32, Math.PI]} />
        <meshStandardMaterial color="#2a2a2a" metalness={0.4} roughness={0.6} />
      </mesh>
    </group>
  );
}

function Quest3Controller({ hand }: { hand: 'left' | 'right' }) {
  return (
    <group>
      {/* Main handle */}
      <mesh position={[0, -0.03, 0.03]} rotation={[-0.3, 0, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.1, 32]} />
        <meshStandardMaterial color="#2b2b2b" metalness={0.7} roughness={0.2} />
      </mesh>

      {/* Controller head */}
      <mesh position={[0, 0, 0.06]} rotation={[-0.3, 0, 0]}>
        <boxGeometry args={[0.06, 0.02, 0.08]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Tracking ring */}
      <mesh position={[0, 0.01, 0.06]} rotation={[-0.3, 0, 0]}>
        <torusGeometry args={[0.035, 0.004, 32, 32, Math.PI * 1.2]} />
        <meshStandardMaterial color="#2b2b2b" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* Buttons area */}
      <group position={[0, 0.01, 0.08]} rotation={[-0.3, 0, 0]}>
        {hand === 'right' ? (
          <>
            <mesh position={[0.015, 0, 0]}>
              <cylinderGeometry args={[0.006, 0.006, 0.002, 16]} />
              <meshStandardMaterial color="#4a4a4a" />
            </mesh>
            <mesh position={[-0.015, 0, 0]}>
              <cylinderGeometry args={[0.006, 0.006, 0.002, 16]} />
              <meshStandardMaterial color="#4a4a4a" />
            </mesh>
          </>
        ) : (
          <mesh>
            <boxGeometry args={[0.03, 0.002, 0.03]} />
            <meshStandardMaterial color="#4a4a4a" />
          </mesh>
        )}
      </group>

      {/* Thumbstick */}
      <group position={[hand === 'left' ? 0.02 : -0.02, 0.01, 0.06]} rotation={[-0.3, 0, 0]}>
        <mesh>
          <cylinderGeometry args={[0.004, 0.004, 0.004, 16]} />
          <meshStandardMaterial color="#1a1a1a" />
        </mesh>
        <mesh position={[0, 0.004, 0]}>
          <sphereGeometry args={[0.005, 16, 16]} />
          <meshStandardMaterial color="#1a1a1a" />
        </mesh>
      </group>
    </group>
  );
}

export function RemoteUser({ peerId }: RemoteUserProps) {
  const groupRef = useRef<Group>(null);
  const headRef = useRef<Group>(null);
  const leftControllerRef = useRef<Group>(null);
  const rightControllerRef = useRef<Group>(null);
  
  const [userState, setUserState] = useState<UserState>({
    position: new Vector3(),
    headRotation: new Quaternion(),
    controllers: {}
  });

  const lastUpdateTime = useRef(Date.now());
  const positionLerp = useRef(new Vector3());
  const headQuatLerp = useRef(new Quaternion());
  const controllerLerps = useRef<{
    [key: string]: {
      position: Vector3;
      rotation: Quaternion;
    };
  }>({
    left: {
      position: new Vector3(),
      rotation: new Quaternion()
    },
    right: {
      position: new Vector3(),
      rotation: new Quaternion()
    }
  });

  useEffect(() => {
    const { connections } = usePeerStore.getState();
    const connection = Array.from(connections).find(conn => conn.peer === peerId);
    if (!connection) return;

    const handleData = (data: any) => {
      if (data.type === 'position') {
        lastUpdateTime.current = Date.now();
        
        setUserState({
          position: new Vector3().fromArray(data.data.position),
          headRotation: new Quaternion().fromArray(data.data.rotation),
          controllers: Object.entries(data.data.controllers || {}).reduce((acc: any, [hand, data]: [string, any]) => ({
            ...acc,
            [hand]: {
              position: new Vector3().fromArray(data.position),
              rotation: new Quaternion().fromArray(data.rotation),
              grip: {
                position: new Vector3().fromArray(data.gripPosition),
                rotation: new Quaternion().fromArray(data.gripRotation)
              }
            }
          }), {})
        });
      }
    };

    connection.on('data', handleData);
    return () => {
      connection.off('data', handleData);
    };
  }, [peerId]);

  useFrame((_, delta) => {
    if (!groupRef.current || !headRef.current) return;

    const timeSinceLastUpdate = Date.now() - lastUpdateTime.current;
    if (timeSinceLastUpdate > 5000) {
      groupRef.current.visible = false;
      return;
    }

    groupRef.current.visible = true;

    // Smooth position interpolation for the entire avatar
    positionLerp.current.lerp(userState.position, delta * 15);
    groupRef.current.position.copy(positionLerp.current);

    // Smooth head rotation interpolation
    headQuatLerp.current.slerp(userState.headRotation, delta * 15);
    headRef.current.quaternion.copy(headQuatLerp.current);

    // Update controllers
    Object.entries(userState.controllers).forEach(([hand, controller]) => {
      const controllerRef = hand === 'left' ? leftControllerRef.current : rightControllerRef.current;
      if (!controllerRef) return;

      const lerp = controllerLerps.current[hand];

      // Calculate controller position relative to the user's position
      const relativePosition = controller.position.clone().sub(userState.position);
      
      // Smooth controller position and rotation
      lerp.position.lerp(relativePosition, delta * 15);
      lerp.rotation.slerp(controller.rotation, delta * 15);

      // Apply transforms
      controllerRef.position.copy(lerp.position);
      controllerRef.quaternion.copy(lerp.rotation);
    });
  });

  return (
    <group ref={groupRef}>
      {/* Head */}
      <group ref={headRef} position={[0, 0, 0]}>
        <Quest3Headset />
      </group>

      {/* Controllers */}
      <group>
        <group ref={leftControllerRef}>
          <Quest3Controller hand="left" />
        </group>
        <group ref={rightControllerRef}>
          <Quest3Controller hand="right" />
        </group>
      </group>
    </group>
  );
}