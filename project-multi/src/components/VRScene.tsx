import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useXR, useController } from '@react-three/xr';
import { Vector3, Quaternion, Matrix4 } from 'three';
import { usePeerStore } from '../store/peerStore';
import { RemoteUser } from './RemoteUser';
import { TVScreen } from './TVScreen';

const MOVEMENT_SPEED = 2;
const ROTATION_SNAP = Math.PI / 4; // 45 degrees

function useLocomotion() {
  const { player } = useXR();
  const leftController = useController('left');
  const rightController = useController('right');
  const moveDirection = useRef(new Vector3());
  const lastRotation = useRef(0);

  useFrame(({ camera }, delta) => {
    if (!player || !leftController?.inputSource.gamepad || !rightController?.inputSource.gamepad) return;

    // Get thumbstick values
    const leftStick = {
      x: leftController.inputSource.gamepad.axes[2] || 0,
      y: leftController.inputSource.gamepad.axes[3] || 0
    };
    const rightStick = {
      x: rightController.inputSource.gamepad.axes[2] || 0
    };

    // Movement (left thumbstick)
    if (Math.abs(leftStick.x) > 0.1 || Math.abs(leftStick.y) > 0.1) {
      // Get the headset's forward and right vectors
      const headsetQuaternion = new Quaternion().setFromEuler(camera.rotation);
      const forward = new Vector3(0, 0, -1).applyQuaternion(headsetQuaternion);
      const right = new Vector3(1, 0, 0).applyQuaternion(headsetQuaternion);

      // Zero out Y component to keep movement horizontal
      forward.y = 0;
      right.y = 0;
      forward.normalize();
      right.normalize();

      // Calculate movement direction
      moveDirection.current
        .set(0, 0, 0)
        .addScaledVector(forward, -leftStick.y)
        .addScaledVector(right, leftStick.x)
        .normalize()
        .multiplyScalar(MOVEMENT_SPEED * delta);

      // Apply movement
      player.position.add(moveDirection.current);
    }

    // Rotation (right thumbstick)
    if (Math.abs(rightStick.x) > 0.6) {
      const currentTime = Date.now();
      if (currentTime - lastRotation.current > 200) { // Delay between rotations
        const rotationAmount = rightStick.x > 0 ? -ROTATION_SNAP : ROTATION_SNAP;
        player.rotation.y += rotationAmount;
        lastRotation.current = currentTime;
      }
    }
  });
}

export function VRScene() {
  const { player, controllers } = useXR();
  const lastUpdate = useRef(Date.now());
  const { connections } = usePeerStore();

  // Initialize locomotion
  useLocomotion();

  useFrame(({ camera }) => {
    if (!player) return;

    const now = Date.now();
    if (now - lastUpdate.current < 50) return;
    lastUpdate.current = now;

    // Get camera world quaternion and position
    const headRotation = new Quaternion();
    const headPosition = new Vector3();
    camera.getWorldQuaternion(headRotation);
    camera.getWorldPosition(headPosition);

    // Prepare controller data
    const controllersData: any = {};
    if (controllers) {
      controllers.forEach(controller => {
        const hand = controller.inputSource.handedness;
        
        const controllerWorldMatrix = new Matrix4().copy(controller.controller.matrixWorld);
        const gripWorldMatrix = new Matrix4().copy(controller.grip.matrixWorld);
        
        const controllerPosition = new Vector3();
        const controllerRotation = new Quaternion();
        const gripPosition = new Vector3();
        const gripRotation = new Quaternion();
        const scale = new Vector3();
        
        controllerWorldMatrix.decompose(controllerPosition, controllerRotation, scale);
        gripWorldMatrix.decompose(gripPosition, gripRotation, scale);

        controllersData[hand] = {
          position: controllerPosition.toArray(),
          rotation: controllerRotation.toArray(),
          gripPosition: gripPosition.toArray(),
          gripRotation: gripRotation.toArray()
        };
      });
    }

    // Send updates
    const update = {
      type: 'position',
      data: {
        position: headPosition.toArray(),
        rotation: headRotation.toArray(),
        controllers: controllersData
      }
    };

    connections.forEach(conn => {
      if (conn.open) conn.send(update);
    });
  });

  return (
    <>
      {/* Remote Users */}
      <group position={[0, 0, 0]}>
        {Array.from(connections).map((connection) => (
          <RemoteUser key={connection.peer} peerId={connection.peer} />
        ))}
      </group>

      {/* Environment */}
      <group>
        {/* Floor */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
          <planeGeometry args={[30, 30]} />
          <meshStandardMaterial 
            color="#202020"
            metalness={0.2}
            roughness={0.8}
          />
        </mesh>

        {/* TV Area */}
        <group position={[0, 0, -5]}>
          <TVScreen />
        </group>

        {/* Accent Lighting */}
        <group position={[0, 0.01, -5]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.5, 2, 32]} />
            <meshBasicMaterial color="#7eb6ff" transparent opacity={0.2} />
          </mesh>
        </group>

        {/* Room Features */}
        {/* Pillars */}
        {[-4, 4].map((x) =>
          [-4, 4].map((z) => (
            <group key={`pillar-${x}-${z}`} position={[x, 0, z]}>
              <mesh position={[0, 2, 0]} castShadow>
                <cylinderGeometry args={[0.2, 0.2, 4]} />
                <meshStandardMaterial 
                  color="#303030"
                  metalness={0.6}
                  roughness={0.2}
                />
              </mesh>
              {/* Pillar Light */}
              <pointLight
                position={[0, 3, 0]}
                intensity={0.5}
                distance={3}
                color="#7eb6ff"
              />
            </group>
          ))
        )}

        {/* Ceiling */}
        <mesh position={[0, 4, 0]} receiveShadow>
          <boxGeometry args={[30, 0.1, 30]} />
          <meshStandardMaterial 
            color="#151515"
            metalness={0.5}
            roughness={0.5}
          />
        </mesh>
      </group>

      {/* Lighting */}
      <ambientLight intensity={0.3} />
      <directionalLight
        position={[5, 5, 5]}
        intensity={0.7}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      
      {/* Accent Lights */}
      <spotLight
        position={[0, 4, -5]}
        angle={Math.PI / 6}
        penumbra={0.5}
        intensity={1}
        color="#7eb6ff"
        castShadow
      />
    </>
  );
}