import { useRef, useState, useEffect } from 'react';
import { Group, Vector3 } from 'three';
import { useFrame } from '@react-three/fiber';
import { useXR } from '@react-three/xr';
import { Text, RoundedBox } from '@react-three/drei';
import MenuItem from './MenuItem';

const MENU_DISTANCE = 2;
const MENU_HEIGHT = 1.6;

export default function VRMenu() {
  const groupRef = useRef<Group>(null);
  const { player, isPresenting } = useXR();
  const [menuVisible, setMenuVisible] = useState(true);
  const targetPosition = useRef(new Vector3());
  const currentPosition = useRef(new Vector3());
  const smoothFactor = 0.1;

  useEffect(() => {
    if (isPresenting) {
      setMenuVisible(true);
    }
  }, [isPresenting]);

  useFrame((state) => {
    if (groupRef.current && player) {
      targetPosition.current.set(
        player.position.x,
        MENU_HEIGHT,
        player.position.z - MENU_DISTANCE
      );
      currentPosition.current.lerp(targetPosition.current, smoothFactor);
      groupRef.current.position.copy(currentPosition.current);
      groupRef.current.lookAt(
        player.position.x,
        MENU_HEIGHT,
        player.position.z
      );
    }
  });

  const menuItems = [
    { icon: "⚡", label: "Quick Mission", status: "READY" },
    { icon: "⚔️", label: "Loadout", status: "30·90" },
    { icon: "🛡️", label: "Equipment" },
    { icon: "📡", label: "Squad Link", status: "ACTIVE" }
  ];

  return (
    <group ref={groupRef}>
      {menuVisible && (
        <group rotation={[0, 0, 0]}>
          {/* Menu Background with rounded corners */}
          <RoundedBox
            args={[1.2, 1.4, 0.02]}
            radius={0.1}
            smoothness={4}
            position={[0, 0, -0.02]}
          >
            <meshBasicMaterial
              color="#14151c"
              opacity={0.98}
              transparent
            />
          </RoundedBox>
          
          {/* Menu Border Glow */}
          <RoundedBox
            args={[1.22, 1.42, 0.01]}
            radius={0.1}
            smoothness={4}
            position={[0, 0, -0.03]}
          >
            <meshBasicMaterial
              color="#ff3e3e"
              opacity={0.1}
              transparent
            />
          </RoundedBox>

          {/* Ambient glow effect */}
          <pointLight
            color="#ff3e3e"
            intensity={0.2}
            distance={1}
            position={[0, 0, 0.1]}
          />

          {/* Title */}
          <group position={[0, 0.5, 0]}>
            <Text
              position={[0, 0, 0]}
              fontSize={0.08}
              color="#ffffff"
              anchorX="center"
              anchorY="middle"
            >
              COMBAT MENU
            </Text>

            <Text
              position={[0, -0.08, 0]}
              fontSize={0.04}
              color="#666666"
              anchorX="center"
              anchorY="middle"
            >
              TACTICAL INTERFACE
            </Text>
          </group>

          {/* Menu Items */}
          {menuItems.map((item, index) => (
            <MenuItem
              key={index}
              icon={item.icon}
              label={item.label}
              status={item.status}
              position={[0, 0.2 - index * 0.15, 0]}
              index={index}
            />
          ))}
        </group>
      )}
    </group>
  );
}