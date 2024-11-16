import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useXR, useController } from '@react-three/xr';
import { Vector3, Quaternion } from 'three';
import { useGLTF } from '@react-three/drei';
import { usePeerStore } from '../store/peerStore';
import { RemoteUser } from './RemoteUser';
import { TVScreen } from './TVScreen';
import { Target } from './Target';
import { Bullet } from './Bullet';

const MOVEMENT_SPEED = 2;
const ROTATION_SNAP = Math.PI / 4;
const MAX_TARGETS = 2;

function Desk() {
  return (
    <mesh receiveShadow castShadow position={[3, 0.5, -3]} rotation={[0, -Math.PI / 4, 0]}>
      {/* Table top */}
      <mesh position={[0, 0.4, 0]} castShadow>
        <boxGeometry args={[1.6, 0.05, 0.8]} />
        <meshStandardMaterial color="#4a3728" roughness={0.8} metalness={0.1} />
      </mesh>
      
      {/* Legs */}
      {[[-0.7, -0.3], [0.7, -0.3], [-0.7, 0.3], [0.7, 0.3]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0, z]} castShadow>
          <boxGeometry args={[0.08, 0.8, 0.08]} />
          <meshStandardMaterial color="#3a2818" roughness={0.8} metalness={0.1} />
        </mesh>
      ))}
    </mesh>
  );
}

function PCModel({ peerId }: { peerId?: string }) {
  const { scene } = useGLTF('https://raw.githubusercontent.com/willy1322/vr-panorama/main/pc.glb');
  const { connections } = usePeerStore();
  const lastUpdate = useRef(Date.now());

  useFrame(() => {
    if (!peerId && connections.size > 0) {
      const now = Date.now();
      if (now - lastUpdate.current > 50) {
        lastUpdate.current = now;
        connections.forEach(conn => {
          if (conn.open) {
            conn.send({
              type: 'pc-state',
              position: [3, 0.95, -3],
              rotation: [0, -Math.PI / 4, 0]
            });
          }
        });
      }
    }
  });
  
  return (
    <primitive 
      object={scene.clone()} 
      position={[3, 0.95, -3]} 
      rotation={[0, -Math.PI / 4, 0]} 
      scale={[0.1, 0.1, 0.1]}
    />
  );
}

function Robot({ peerId }: { peerId?: string }) {
  const { scene } = useGLTF('https://raw.githubusercontent.com/willy1322/vr-panorama/main/robot.glb');
  const { connections } = usePeerStore();
  const lastUpdate = useRef(Date.now());

  useFrame(() => {
    if (!peerId && connections.size > 0) {
      const now = Date.now();
      if (now - lastUpdate.current > 50) {
        lastUpdate.current = now;
        connections.forEach(conn => {
          if (conn.open) {
            conn.send({
              type: 'robot-state',
              position: [4, 0.9, -3],
              rotation: [0, -Math.PI / 4, 0]
            });
          }
        });
      }
    }
  });

  return (
    <primitive 
      object={scene.clone()} 
      position={[4, 0.9, -3]} 
      rotation={[0, -Math.PI / 4, 0]} 
      scale={[0.75, 0.75, 0.75]}
    />
  );
}

function useLocomotion() {
  const { player } = useXR();
  const leftController = useController('left');
  const rightController = useController('right');
  const moveDirection = useRef(new Vector3());
  const lastRotation = useRef(0);
  const playerRotation = useRef(0);

  useFrame(({ camera }, delta) => {
    if (!player || !leftController?.inputSource.gamepad || !rightController?.inputSource.gamepad) return;

    const leftStick = {
      x: leftController.inputSource.gamepad.axes[2] || 0,
      y: leftController.inputSource.gamepad.axes[3] || 0
    };
    const rightStick = {
      x: rightController.inputSource.gamepad.axes[2] || 0
    };

    if (Math.abs(rightStick.x) > 0.6) {
      const currentTime = Date.now();
      if (currentTime - lastRotation.current > 200) {
        const rotationAmount = rightStick.x > 0 ? -ROTATION_SNAP : ROTATION_SNAP;
        player.rotation.y += rotationAmount;
        playerRotation.current += rotationAmount;
        lastRotation.current = currentTime;
      }
    }

    if (Math.abs(leftStick.x) > 0.1 || Math.abs(leftStick.y) > 0.1) {
      const forward = new Vector3(0, 0, -1);
      const right = new Vector3(1, 0, 0);
      const totalRotation = playerRotation.current + camera.rotation.y;
      const rotationQuat = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), totalRotation);
      
      forward.applyQuaternion(rotationQuat);
      right.applyQuaternion(rotationQuat);
      
      forward.y = 0;
      right.y = 0;
      forward.normalize();
      right.normalize();

      moveDirection.current
        .set(0, 0, 0)
        .addScaledVector(forward, -leftStick.y)
        .addScaledVector(right, leftStick.x)
        .normalize()
        .multiplyScalar(MOVEMENT_SPEED * delta);

      player.position.add(moveDirection.current);
    }
  });
}

export function VRScene() {
  const { player, controllers } = useXR();
  const lastUpdate = useRef(Date.now());
  const { connections } = usePeerStore();
  const [bullets, setBullets] = useState<Array<{ id: number; position: Vector3; direction: Vector3; owner: string }>>([]);
  const [targets, setTargets] = useState<Array<{ id: number; position: Vector3 }>>([]);
  const nextBulletId = useRef(0);
  const nextTargetId = useRef(0);
  const lastTriggerValues = useRef<{ [key: string]: number }>({});
  const peerId = usePeerStore(state => state.peer?.id);

  useLocomotion();

  useEffect(() => {
    const initialTargets = Array.from({ length: MAX_TARGETS }, () => ({
      id: nextTargetId.current++,
      position: new Vector3(
        (Math.random() - 0.5) * 16,
        1.6,
        (Math.random() - 0.5) * 16
      )
    }));
    setTargets(initialTargets);

    connections.forEach(conn => {
      conn.on('data', (data: any) => {
        if (data.type === 'shoot') {
          setBullets(prev => [...prev, {
            id: data.bulletId,
            position: new Vector3().fromArray(data.position),
            direction: new Vector3().fromArray(data.direction),
            owner: conn.peer
          }]);
        }
      });
    });
  }, [connections]);

  useFrame(({ camera }) => {
    if (!player) return;

    const now = Date.now();
    if (now - lastUpdate.current < 50) return;
    lastUpdate.current = now;

    controllers?.forEach(controller => {
      const hand = controller.inputSource.handedness;
      const gamepad = controller.inputSource.gamepad;
      if (!gamepad) return;

      const triggerValue = gamepad.buttons[0]?.value || 0;
      const lastValue = lastTriggerValues.current[hand] || 0;

      if (triggerValue > 0.9 && lastValue <= 0.9) {
        // Get the world position and rotation of the controller
        const position = new Vector3();
        const quaternion = new Quaternion();
        controller.controller.getWorldPosition(position);
        controller.controller.getWorldQuaternion(quaternion);

        // Calculate direction based on controller's world rotation
        const direction = new Vector3(0, 0, -1).applyQuaternion(quaternion);

        const bulletId = nextBulletId.current++;
        
        setBullets(prev => [...prev, {
          id: bulletId,
          position,
          direction,
          owner: peerId || 'local'
        }]);

        connections.forEach(conn => {
          if (conn.open) {
            conn.send({
              type: 'shoot',
              bulletId,
              position: position.toArray(),
              direction: direction.toArray()
            });
          }
        });
      }

      lastTriggerValues.current[hand] = triggerValue;
    });

    controllers?.forEach(controller => {
      const hand = controller.inputSource.handedness;
      const controllerWorldMatrix = controller.controller.matrixWorld;
      const gripWorldMatrix = controller.grip.matrixWorld;
      
      const controllerPosition = new Vector3();
      const controllerRotation = new Quaternion();
      const gripPosition = new Vector3();
      const gripRotation = new Quaternion();
      const scale = new Vector3();
      
      controllerWorldMatrix.decompose(controllerPosition, controllerRotation, scale);
      gripWorldMatrix.decompose(gripPosition, gripRotation, scale);

      const controllersData = {
        [hand]: {
          position: controllerPosition.toArray(),
          rotation: controllerRotation.toArray(),
          gripPosition: gripPosition.toArray(),
          gripRotation: gripRotation.toArray()
        }
      };

      connections.forEach(conn => {
        if (conn.open) conn.send({
          type: 'position',
          data: {
            position: player.position.toArray(),
            rotation: camera.quaternion.toArray(),
            controllers: controllersData
          }
        });
      });
    });
  });

  const handleBulletHit = (bulletId: number) => {
    setBullets(prev => prev.filter(b => b.id !== bulletId));
  };

  const handleTargetHit = (targetId: number) => {
    setTargets(prev => {
      const remaining = prev.filter(t => t.id !== targetId);
      if (remaining.length < MAX_TARGETS) {
        return [...remaining, {
          id: nextTargetId.current++,
          position: new Vector3(
            (Math.random() - 0.5) * 16,
            1.6,
            (Math.random() - 0.5) * 16
          )
        }];
      }
      return remaining;
    });
  };

  return (
    <>
      <group position={[0, 0, 0]}>
        {Array.from(connections).map((connection) => (
          <RemoteUser key={connection.peer} peerId={connection.peer} />
        ))}
      </group>

      {bullets.map(bullet => (
        <Bullet
          key={bullet.id}
          position={bullet.position}
          direction={bullet.direction}
          onHit={() => handleBulletHit(bullet.id)}
        />
      ))}

      {targets.map(target => (
        <Target
          key={target.id}
          initialPosition={target.position}
          onHit={() => handleTargetHit(target.id)}
        />
      ))}

      <group>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
          <planeGeometry args={[30, 30]} />
          <meshStandardMaterial 
            color="#202020"
            metalness={0.2}
            roughness={0.8}
          />
        </mesh>

        <Desk />
        <PCModel />
        <Robot />

        <group position={[0, 0, -5]}>
          <TVScreen />
        </group>

        <group position={[0, 0.01, -5]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.5, 2, 32]} />
            <meshBasicMaterial color="#7eb6ff" transparent opacity={0.2} />
          </mesh>
        </group>

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
              <pointLight
                position={[0, 3, 0]}
                intensity={0.5}
                distance={3}
                color="#7eb6ff"
              />
            </group>
          ))
        )}

        <mesh position={[0, 4, 0]} receiveShadow>
          <boxGeometry args={[30, 0.1, 30]} />
          <meshStandardMaterial 
            color="#151515"
            metalness={0.5}
            roughness={0.5}
          />
        </mesh>
      </group>

      <ambientLight intensity={0.3} />
      <directionalLight
        position={[5, 5, 5]}
        intensity={0.7}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      
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