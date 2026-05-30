import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useCurrentFrame } from 'remotion';
import * as THREE from 'three';

export const Plexus = () => {
  const pointsRef = useRef<THREE.Points>(null);
  const frame = useCurrentFrame();

  const [positions, colors] = useMemo(() => {
    const particleCount = 200;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 15;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 15;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 5 - 2;

      // Deep ocean blue to cyan variations
      colors[i * 3] = 0.1;
      colors[i * 3 + 1] = 0.5 + Math.random() * 0.5;
      colors[i * 3 + 2] = 0.8 + Math.random() * 0.2;
    }
    return [positions, colors];
  }, []);

  useFrame(() => {
    if (pointsRef.current) {
      // Procedural drift mapped to Remotion frames
      pointsRef.current.rotation.y = frame * 0.005;
      pointsRef.current.rotation.x = Math.sin(frame * 0.01) * 0.2;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={positions.length / 3} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={colors.length / 3} array={colors} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.05} vertexColors transparent opacity={0.6} blending={THREE.AdditiveBlending} />
    </points>
  );
};
