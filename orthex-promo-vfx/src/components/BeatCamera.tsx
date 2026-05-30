import { useFrame } from '@react-three/fiber';
import { useCurrentFrame } from 'remotion';
import * as THREE from 'three';

export const BeatCamera = () => {
  const frame = useCurrentFrame();

  useFrame((state) => {
    // Simulate music beats: A sharp pulse every 15 frames (approx 120 BPM at 30fps)
    // 3 "milisec" requested by user likely means very rapid cuts (strobe effect)
    const beatPhase = (frame % 15) / 15; // 0 to 1 over 15 frames
    const isBeat = frame % 15 < 3; // Trigger for the first 3 frames of the beat

    // Apply chaotic MTV/Cyberpunk style camera shake & zoom on the beat
    const targetZ = isBeat ? 10 : 8; // Snap zoom out on beat
    const targetX = isBeat ? (Math.random() - 0.5) * 4 : 0; // Random X shift
    const targetY = isBeat ? (Math.random() - 0.5) * 2 : 0; // Random Y shift

    // Lerp the camera for smooth but aggressive snaps
    state.camera.position.z = THREE.MathUtils.lerp(state.camera.position.z, targetZ, 0.4);
    state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, targetX, 0.3);
    state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, targetY, 0.3);
    
    // Always look at the center
    state.camera.lookAt(0, 0, 0);
  });

  return null;
};
