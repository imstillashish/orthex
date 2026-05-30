import {
  AbsoluteFill,
  Img,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  staticFile,
} from 'remotion';
import React from 'react';

export const ScreenSlide: React.FC<{
  title: string;
  description: string;
  imagePath: string;
}> = ({title, description, imagePath}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  // Slow zoom effect
  const zoom = interpolate(frame, [0, fps * 5], [1, 1.05], {
    extrapolateRight: 'clamp',
  });

  // Fade in text
  const textOpacity = interpolate(frame, [10, 30], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  
  const textTranslateY = interpolate(frame, [10, 30], [20, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{backgroundColor: '#0a0f1e', justifyContent: 'center', alignItems: 'center'}}>
      <AbsoluteFill style={{transform: `scale(${zoom})`, justifyContent: 'center', alignItems: 'center'}}>
        <Img 
          src={staticFile(imagePath)} 
          style={{
            maxHeight: '75%', 
            objectFit: 'contain', 
            borderRadius: '16px', 
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
          }} 
        />
      </AbsoluteFill>
      
      <div style={{
        position: 'absolute',
        bottom: 60,
        left: 0,
        right: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        opacity: textOpacity,
        transform: `translateY(${textTranslateY}px)`,
        color: 'white',
        fontFamily: 'Inter, sans-serif',
        textAlign: 'center'
      }}>
        <h1 style={{fontSize: '48px', margin: '0 0 16px 0', fontWeight: 'bold'}}>{title}</h1>
        <p style={{fontSize: '28px', margin: 0, opacity: 0.8, maxWidth: '800px'}}>{description}</p>
      </div>
    </AbsoluteFill>
  );
};
