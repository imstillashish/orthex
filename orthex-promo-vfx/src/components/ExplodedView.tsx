import { useRef } from 'react';
import { useCurrentFrame, spring } from 'remotion';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export const ExplodedView = () => {
  const groupRef = useRef<THREE.Group>(null);
  const frame = useCurrentFrame();

  // Remotion spring physics for aggressive anticipation/overshoot
  const explodeProgress = spring({
    frame,
    fps: 30,
    config: { mass: 2, damping: 10, stiffness: 100 },
    durationInFrames: 60,
  });

  useFrame(() => {
    if (groupRef.current) {
      // Isometric kinetic rotation
      groupRef.current.rotation.x = THREE.MathUtils.degToRad(60);
      groupRef.current.rotation.z = THREE.MathUtils.degToRad(-45) + frame * 0.002;
    }
  });

  const layerSpacing = 1.5 * explodeProgress;

  return (
    <group ref={groupRef} position={[0, -2, 0]}>
      {/* Background UI Base Layer */}
      <mesh position={[0, 0, 0]}>
        <planeGeometry args={[8, 5]} />
        <meshStandardMaterial color="#0b1320" transparent opacity={0.8} />
      </mesh>
      
      {/* Orthex Panel Layer */}
      <mesh position={[1, -1, layerSpacing]}>
        <planeGeometry args={[3, 4]} />
        <meshStandardMaterial color="#1591dc" transparent opacity={0.9} />
      </mesh>
      
      {/* Code Block Floating Elements */}
      <mesh position={[-1.5, 0.5, layerSpacing * 1.5]}>
        <boxGeometry args={[4, 0.5, 0.1]} />
        <meshStandardMaterial color="#2196F3" />
      </mesh>
      
      {/* O(log n) Neon Accent Layer */}
      <mesh position={[0.5, 1.5, layerSpacing * 2.2]}>
        <boxGeometry args={[2, 0.5, 0.1]} />
        <meshStandardMaterial color="#FFEB3B" emissive="#FFEB3B" emissiveIntensity={2} />
      </mesh>
    </group>
  );
};
