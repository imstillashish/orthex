import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";

interface DiagramSlideProps {
  title: string;
  steps: string[];
}

export const DiagramSlide: React.FC<DiagramSlideProps> = ({
  title,
  steps,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill
      style={{
        padding: 80,
        background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
      }}
    >
      {/* Title */}
      <h2
        style={{
          color: "#e94560",
          fontSize: 48,
          fontWeight: "bold",
          margin: 0,
          marginBottom: 60,
          textAlign: "center",
        }}
      >
        {title}
      </h2>

      {/* Steps */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 20,
          maxWidth: 1200,
          margin: "0 auto",
        }}
      >
        {steps.map((step, index) => {
          const stepDelay = 15 + index * 10;
          const stepOpacity = interpolate(
            frame,
            [stepDelay, stepDelay + 10],
            [0, 1],
            { extrapolateRight: "clamp" }
          );
          const stepSlide = spring({
            frame: frame - stepDelay,
            fps,
            config: { damping: 12, stiffness: 100 },
          });

          return (
            <div
              key={index}
              style={{
                opacity: stepOpacity,
                transform: `translateX(${interpolate(stepSlide, [0, 1], [-50, 0])}px)`,
                display: "flex",
                alignItems: "center",
                gap: 24,
                background: "rgba(233, 69, 96, 0.1)",
                padding: "20px 30px",
                borderRadius: 12,
                borderLeft: "4px solid #e94560",
              }}
            >
              <div
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: "50%",
                  background: "#e94560",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  color: "white",
                  fontSize: 24,
                  fontWeight: "bold",
                  flexShrink: 0,
                }}
              >
                {index + 1}
              </div>
              <p
                style={{
                  color: "white",
                  fontSize: 28,
                  margin: 0,
                }}
              >
                {step.replace(/^\d+\.\s*/, "")}
              </p>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
