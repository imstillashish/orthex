import { AbsoluteFill, Sequence, Audio, staticFile } from "remotion";
import { Canvas } from "@react-three/fiber";
import { Plexus } from "./components/Plexus";
import { ExplodedView } from "./components/ExplodedView";
import { KineticType } from "./components/KineticType";
import { CTAScene } from "./components/CTAScene";
import { BeatCamera } from "./components/BeatCamera";

export const Scene: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#020813" }}>
      {/* Background Audio */}
      <Audio src={staticFile("background-music.mp3")} volume={0.8} />

      {/* 3D WebGL Background Layer (Persists throughout) */}
      <Canvas camera={{ position: [0, 0, 8], fov: 50 }}>
        <ambientLight intensity={0.4} color="#ffffff" />
        <spotLight position={[10, 15, 10]} angle={0.3} penumbra={1} intensity={2} color="#2196F3" />
        <spotLight position={[-10, -10, -10]} intensity={1} color="#FFEB3B" />
        
        {/* Kinetic Music Beat Camera */}
        <BeatCamera />

        {/* Procedural Data Simulation */}
        <Plexus />
        
        {/* Isometric 2.5D Workflow Mapping (Starts at Solution phase) */}
        <Sequence from={270}>
          <ExplodedView />
        </Sequence>
      </Canvas>

      {/* Phase 1: HOOK (0-4s | 0-120 frames) */}
      <Sequence from={0} durationInFrames={120}>
        <KineticType />
      </Sequence>

      {/* Phase 2: PROBLEM (4-9s | 120-270 frames) */}
      {/* Placeholder for Problem Scenes */}

      {/* Phase 3: SOLUTION (9-19s | 270-570 frames) */}
      {/* Placeholder for Solution Scenes */}

      {/* Phase 4: PROOF (19-27s | 570-810 frames) */}
      {/* Placeholder for Proof Scenes */}

      {/* Phase 5: CTA (27-30s | 810-900 frames) */}
      <Sequence from={810} durationInFrames={90}>
        <CTAScene />
      </Sequence>
    </AbsoluteFill>
  );
};

