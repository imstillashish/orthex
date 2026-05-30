import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";

interface TitleSlideProps {
  title: string;
  subtitle: string;
  lessonNumber: number;
}

export const TitleSlide: React.FC<TitleSlideProps> = ({
  title,
  subtitle,
  lessonNumber,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleScale = spring({
    frame,
    fps,
    config: { damping: 10, stiffness: 100 },
  });

  const subtitleOpacity = interpolate(frame, [30, 60], [0, 1], {
    extrapolateRight: "clamp",
  });

  const lessonBadge = spring({
    frame: frame - 20,
    fps,
    config: { damping: 15, stiffness: 80 },
  });

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
      }}
    >
      {/* Background decoration */}
      <div
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          opacity: 0.1,
          background:
            "radial-gradient(circle at 30% 50%, #0f3460 0%, transparent 50%)",
        }}
      />

      {/* Lesson badge */}
      <div
        style={{
          position: "absolute",
          top: 60,
          right: 60,
          transform: `scale(${lessonBadge})`,
          background: "#e94560",
          padding: "12px 24px",
          borderRadius: 30,
          color: "white",
          fontSize: 24,
          fontWeight: "bold",
        }}
      >
        Lesson {lessonNumber}
      </div>

      {/* Main title */}
      <div
        style={{
          transform: `scale(${titleScale})`,
          textAlign: "center",
        }}
      >
        <h1
          style={{
            color: "white",
            fontSize: 80,
            fontWeight: "bold",
            margin: 0,
            textShadow: "0 4px 20px rgba(0,0,0,0.3)",
          }}
        >
          {title}
        </h1>
      </div>

      {/* Subtitle */}
      <div
        style={{
          opacity: subtitleOpacity,
          marginTop: 30,
        }}
      >
        <p
          style={{
            color: "#a0a0a0",
            fontSize: 32,
            margin: 0,
          }}
        >
          {subtitle}
        </p>
      </div>

      {/* Decorative line */}
      <div
        style={{
          position: "absolute",
          bottom: 100,
          width: interpolate(frame, [0, 60], [0, 400], {
            extrapolateRight: "clamp",
          }),
          height: 4,
          background: "linear-gradient(90deg, #e94560, #0f3460)",
          borderRadius: 2,
        }}
      />
    </AbsoluteFill>
  );
};
