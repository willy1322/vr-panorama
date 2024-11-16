import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useXR, XRController } from '@react-three/xr';
import { Group, Vector3, Quaternion, Matrix4 } from 'three';
import { usePeerStore } from '../store/peerStore';
import { RemoteUser } from './RemoteUser';

export function VRScene() {
  const { player, controllers } = useXR();
  const lastUpdate = useRef(Date.now());
  const controllerRefs = useRef<{ [key: string]: XRController }>({});
  const { connections } = usePeerStore();

  useFrame(({ camera }) => {
    if (!player) return;

    const now = Date.now();
    if (now - lastUpdate.current < 50) return; // 20 updates per second
    lastUpdate.current = now;

    // Get camera world quaternion and position
    const headRotation = new Quaternion();
    const headPosition = new Vector3();
    camera.getWorldQuaternion(headRotation);
    camera.getWorldPosition(headPosition);

    // Prepare controller data with proper world transforms
    const controllersData: any = {};
    if (controllers) {
      controllers.forEach(controller => {
        const hand = controller.inputSource.handedness;
        controllerRefs.current[hand] = controller;

        // Get world matrices
        const controllerWorldMatrix = new Matrix4().copy(controller.controller.matrixWorld);
        const gripWorldMatrix = new Matrix4().copy(controller.grip.matrixWorld);
        
        // Extract position and rotation from world matrices
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

    // Send position updates to all peers
    const update = {
      type: 'position',
      data: {
        position: headPosition.toArray(),
        rotation: headRotation.toArray(),
        controllers: controllersData
      }
    };

    connections.forEach(conn => {
      if (conn.open) {
        conn.send(update);
      }
    });
  });

  return (
    <>
      {/* Remote Users */}
      {Array.from(connections).map((connection) => (
        <RemoteUser key={connection.peer} peerId={connection.peer} />
      ))}

      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.001, 0]} receiveShadow>
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial color="#303030" />
      </mesh>

      {/* Room boundaries */}
      {[-5, 5].map((x) =>
        [-5, 5].map((z) => (
          <mesh key={`${x}-${z}`} position={[x, 2, z]} castShadow>
            <boxGeometry args={[0.2, 4, 0.2]} />
            <meshStandardMaterial color="#404040" />
          </mesh>
        ))
      )}

      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight
        position={[5, 5, 5]}
        intensity={1}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
    </>
  );
}