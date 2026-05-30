import React from 'react';
import { useCurrentFrame, spring, interpolate } from 'remotion';

export const KineticType: React.FC = () => {
  const frame = useCurrentFrame();

  // High-Velocity Brutalist Typography animations
  // Spring logic for sharp overshoot on scale
  const scale = spring({
    frame: frame - 15,
    fps: 30,
    config: { mass: 0.5, damping: 10, stiffness: 200 },
  });

  // Track Matte Reveal (Opacity wipe)
  const opacity = interpolate(frame, [10, 20], [0, 1], { extrapolateRight: 'clamp' });
  
  // Motion Smear (Directional Blur Approximation via CSS)
  const blur = interpolate(frame, [15, 25], [20, 0], { extrapolateRight: 'clamp' });

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        pointerEvents: 'none',
        opacity,
        transform: `scale(${scale})`,
        filter: `blur(${blur}px)`,
        color: '#ffffff',
        fontFamily: 'Helvetica, Arial, sans-serif',
        fontWeight: 900,
        textTransform: 'uppercase',
      }}
    >
      <h1 style={{ fontSize: 180, margin: 0, lineHeight: 0.9, letterSpacing: '-0.05em' }}>
        O(log n)
      </h1>
      <h2 style={{ fontSize: 80, margin: 0, color: '#FFEB3B' }}>
        EFFICIENCY
      </h2>
    </div>
  );
};
