import React from 'react';
import { useCurrentFrame, spring, interpolate } from 'remotion';

export const CTAScene: React.FC = () => {
  const frame = useCurrentFrame();

  // Whip Pan (Directional Blur Push) entrance
  const translateY = spring({
    frame,
    fps: 30,
    config: { mass: 1, damping: 12, stiffness: 150 },
    from: 1000,
    to: 0,
  });

  // Track Matte Reveal / Alpha Wipe using clipPath
  const wipeProgress = interpolate(frame, [15, 30], [0, 100], { extrapolateRight: 'clamp' });
  const clipPath = `circle(${wipeProgress}% at 50% 50%)`;

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
        backgroundColor: '#FFEB3B', // High contrast brutalist yellow
        clipPath,
        transform: `translateY(${translateY}px)`,
        color: '#000000',
        fontFamily: 'Helvetica, Arial, sans-serif',
        fontWeight: 900,
        textTransform: 'uppercase',
      }}
    >
      <h1 style={{ fontSize: 120, margin: 0, letterSpacing: '-0.02em' }}>
        No Servers.
      </h1>
      <h1 style={{ fontSize: 120, margin: 0, letterSpacing: '-0.02em' }}>
        No Cost.
      </h1>
      <div style={{ marginTop: 40, padding: '20px 60px', backgroundColor: '#000', color: '#fff', fontSize: 60, borderRadius: 100 }}>
        Install Orthex
      </div>
    </div>
  );
};
