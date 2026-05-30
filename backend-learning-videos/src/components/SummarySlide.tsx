import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";

interface SummarySlideProps {
  title: string;
  keyPoints: string[];
  nextTopic: string;
}

export const SummarySlide: React.FC<SummarySlideProps> = ({
  title,
  keyPoints,
  nextTopic,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const checkmark = (index: number) =>
    spring({
      frame: frame - 30 - index * 10,
      fps,
      config: { damping: 10, stiffness: 100 },
    });

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
          fontSize: 56,
          fontWeight: "bold",
          margin: 0,
          marginBottom: 60,
          textAlign: "center",
        }}
      >
        {title}
      </h2>

      {/* Key points */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 24,
          maxWidth: 1000,
          margin: "0 auto",
        }}
      >
        {keyPoints.map((point, index) => (
          <div
            key={index}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 20,
              opacity: interpolate(checkmark(index), [0, 1], [0, 1]),
              transform: `scale(${checkmark(index)})`,
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                background: "#4ecca3",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                color: "white",
                fontSize: 24,
              }}
            >
              ✓
            </div>
            <p
              style={{
                color: "white",
                fontSize: 32,
                margin: 0,
              }}
            >
              {point}
            </p>
          </div>
        ))}
      </div>

      {/* Next topic preview */}
      <div
        style={{
          position: "absolute",
          bottom: 100,
          left: 0,
          right: 0,
          textAlign: "center",
          opacity: interpolate(frame, [60, 80], [0, 1], {
            extrapolateRight: "clamp",
          }),
        }}
      >
        <p style={{ color: "#666", fontSize: 24, margin: 0 }}>
          Up Next:
        </p>
        <p style={{ color: "#e94560", fontSize: 36, fontWeight: "bold", margin: 0 }}>
          {nextTopic}
        </p>
      </div>
    </AbsoluteFill>
  );
};
