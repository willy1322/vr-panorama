import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { Interactive } from '@react-three/xr';
import * as THREE from 'three';
import { usePeerStore } from '../store/peerStore';

const PAGES = [
  {
    url: 'stackblitz.com/home',
    title: 'StackBlitz - Home',
    content: [
      { type: 'heading', text: 'Welcome to StackBlitz' },
      { type: 'text', text: 'Instant Dev Environments' },
    ]
  },
  {
    url: 'stackblitz.com/features',
    title: 'StackBlitz - Features',
    content: [
      { type: 'heading', text: 'WebContainer™ Technology' },
      { type: 'text', text: 'Node.js in your browser' },
    ]
  },
  {
    url: 'stackblitz.com/docs',
    title: 'StackBlitz - Documentation',
    content: [
      { type: 'heading', text: 'Documentation' },
      { type: 'text', text: 'Learn how to use StackBlitz' },
    ]
  }
];

export function TVScreen() {
  const [showContent, setShowContent] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [hoveredButton, setHoveredButton] = useState('');
  const buttonRef = useRef<THREE.Mesh>(null);
  const { connections } = usePeerStore();

  // Sync content state with peers
  const toggleContent = () => {
    const newState = !showContent;
    setShowContent(newState);
    
    connections.forEach(conn => {
      if (conn.open) {
        conn.send({
          type: 'screen-state',
          data: { showContent: newState }
        });
      }
    });
  };

  const navigatePage = (direction: 'prev' | 'next') => {
    const newPage = direction === 'next' 
      ? (currentPage + 1) % PAGES.length
      : (currentPage - 1 + PAGES.length) % PAGES.length;
    
    setCurrentPage(newPage);
    
    connections.forEach(conn => {
      if (conn.open) {
        conn.send({
          type: 'page-change',
          data: { page: newPage }
        });
      }
    });
  };

  return (
    <group position={[0, 0, -5]}>
      {/* Browser Frame */}
      <mesh position={[0, 1.6, 0]} castShadow>
        <boxGeometry args={[2, 1.5, 0.1]} />
        <meshStandardMaterial color="#2a2a2a" metalness={0.5} roughness={0.5} />
      </mesh>

      {/* Browser Screen */}
      {showContent && (
        <group position={[0, 1.6, 0.06]}>
          {/* Background */}
          <mesh>
            <planeGeometry args={[1.9, 1.4]} />
            <meshBasicMaterial color="#f0f0f0" />
          </mesh>

          {/* Navigation Buttons */}
          <group position={[-0.85, 0.65, 0.001]}>
            <Interactive
              onSelect={() => navigatePage('prev')}
              onHover={() => setHoveredButton('prev')}
              onBlur={() => setHoveredButton('')}
            >
              <mesh>
                <boxGeometry args={[0.1, 0.08, 0.01]} />
                <meshStandardMaterial 
                  color={hoveredButton === 'prev' ? "#4a4a4a" : "#3a3a3a"}
                  metalness={0.5}
                  roughness={0.5}
                />
              </mesh>
              <Text position={[0, 0, 0.01]} fontSize={0.04} color="#ffffff">
                ←
              </Text>
            </Interactive>
          </group>

          <group position={[-0.7, 0.65, 0.001]}>
            <Interactive
              onSelect={() => navigatePage('next')}
              onHover={() => setHoveredButton('next')}
              onBlur={() => setHoveredButton('')}
            >
              <mesh>
                <boxGeometry args={[0.1, 0.08, 0.01]} />
                <meshStandardMaterial 
                  color={hoveredButton === 'next' ? "#4a4a4a" : "#3a3a3a"}
                  metalness={0.5}
                  roughness={0.5}
                />
              </mesh>
              <Text position={[0, 0, 0.01]} fontSize={0.04} color="#ffffff">
                →
              </Text>
            </Interactive>
          </group>

          {/* URL Bar */}
          <group position={[0.1, 0.65, 0.001]}>
            <mesh>
              <planeGeometry args={[1.5, 0.08]} />
              <meshBasicMaterial color="#ffffff" />
            </mesh>
            <Text 
              position={[-0.7, 0, 0.001]} 
              fontSize={0.04}
              color="#000000"
              anchorX="left"
            >
              https://{PAGES[currentPage].url}
            </Text>
          </group>

          {/* Content Area */}
          <group position={[0, -0.05, 0.001]}>
            <mesh>
              <planeGeometry args={[1.8, 1.2]} />
              <meshBasicMaterial color="#ffffff" />
            </mesh>
            <Text 
              position={[0, 0.4, 0.001]} 
              fontSize={0.08}
              color="#333333"
              anchorX="center"
              maxWidth={1.6}
              textAlign="center"
            >
              {PAGES[currentPage].content[0].text}
            </Text>
            <Text 
              position={[0, 0.2, 0.001]} 
              fontSize={0.05}
              color="#666666"
              anchorX="center"
              maxWidth={1.6}
              textAlign="center"
            >
              {PAGES[currentPage].content[1].text}
            </Text>
          </group>
        </group>
      )}

      {/* Interactive Power Button */}
      <Interactive
        onSelect={toggleContent}
        onHover={() => setIsHovered(true)}
        onBlur={() => setIsHovered(false)}
      >
        <group position={[1.2, 1.6, 0.1]}>
          <mesh ref={buttonRef}>
            <boxGeometry args={[0.15, 0.15, 0.05]} />
            <meshStandardMaterial 
              color={isHovered ? "#555555" : (showContent ? "#4CAF50" : "#f44336")}
              emissive={isHovered ? "#ffffff" : "#000000"}
              emissiveIntensity={isHovered ? 0.2 : 0}
              metalness={0.8}
              roughness={0.2}
            />
          </mesh>
          
          <Text
            position={[0, 0.12, 0]}
            fontSize={0.05}
            color={showContent ? "#4CAF50" : "#f44336"}
            anchorX="center"
            anchorY="bottom"
          >
            {showContent ? "ON" : "OFF"}
          </Text>
        </group>
      </Interactive>

      {/* Stand */}
      <mesh position={[0, 0.75, 0]} castShadow>
        <cylinderGeometry args={[0.1, 0.1, 1.5, 16]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Base */}
      <mesh position={[0, 0, 0]} castShadow>
        <cylinderGeometry args={[0.4, 0.4, 0.05, 32]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.7} roughness={0.3} />
      </mesh>
    </group>
  );
}