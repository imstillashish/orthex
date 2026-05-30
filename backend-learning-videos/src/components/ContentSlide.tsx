import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";

interface ContentSlideProps {
  title: string;
  content: string[];
  visual?: string;
}

export const ContentSlide: React.FC<ContentSlideProps> = ({
  title,
  content,
  visual,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleSlide = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 100 },
  });

  return (
    <AbsoluteFill
      style={{
        padding: 80,
        background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
      }}
    >
      {/* Title */}
      <div
        style={{
          transform: `translateX(${interpolate(titleSlide, [0, 1], [-100, 0])}px)`,
          opacity: titleSlide,
          marginBottom: 60,
        }}
      >
        <h2
          style={{
            color: "#e94560",
            fontSize: 56,
            fontWeight: "bold",
            margin: 0,
            borderLeft: "6px solid #e94560",
            paddingLeft: 24,
          }}
        >
          {title}
        </h2>
      </div>

      {/* Content items */}
      <div style={{ display: "flex", gap: 60 }}>
        {/* Text content */}
        <div style={{ flex: 1 }}>
          {content.map((item, index) => {
            const itemDelay = 20 + index * 15;
            const itemOpacity = interpolate(
              frame,
              [itemDelay, itemDelay + 15],
              [0, 1],
              { extrapolateRight: "clamp" }
            );
            const itemSlide = interpolate(
              frame,
              [itemDelay, itemDelay + 15],
              [30, 0],
              { extrapolateRight: "clamp" }
            );

            return (
              <div
                key={index}
                style={{
                  opacity: itemOpacity,
                  transform: `translateY(${itemSlide}px)`,
                  marginBottom: 24,
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 16,
                }}
              >
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: "#e94560",
                    marginTop: 12,
                    flexShrink: 0,
                  }}
                />
                <p
                  style={{
                    color: "white",
                    fontSize: 32,
                    margin: 0,
                    lineHeight: 1.5,
                  }}
                >
                  {item}
                </p>
              </div>
            );
          })}
        </div>

        {/* Visual area */}
        {visual && (
          <div
            style={{
              flex: 1,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <VisualElement type={visual} frame={frame} fps={fps} />
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};

const VisualElement: React.FC<{
  type: string;
  frame: number;
  fps: number;
}> = ({ type, frame, fps }) => {
  if (type === "dns") {
    return (
      <div
        style={{
          width: 400,
          height: 300,
          background: "rgba(233, 69, 96, 0.1)",
          borderRadius: 20,
          border: "2px solid #e94560",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          padding: 30,
        }}
      >
        <div style={{ color: "white", fontSize: 24, marginBottom: 20 }}>
          google.com
        </div>
        <div
          style={{
            color: "#e94560",
            fontSize: 40,
            transform: `scale(${spring({ frame: frame - 30, fps, config: { damping: 10 } })})`,
          }}
        >
          →
        </div>
        <div style={{ color: "#4ecca3", fontSize: 28, marginTop: 20 }}>
          142.250.80.46
        </div>
      </div>
    );
  }

  if (type === "http") {
    return (
      <div
        style={{
          width: 400,
          height: 300,
          background: "rgba(15, 52, 96, 0.3)",
          borderRadius: 20,
          border: "2px solid #0f3460",
          display: "flex",
          justifyContent: "space-around",
          alignItems: "center",
          padding: 30,
        }}
      >
        <div
          style={{
            textAlign: "center",
            transform: `translateX(${interpolate(frame, [20, 40], [-20, 0], { extrapolateRight: "clamp" })}px)`,
          }}
        >
          <div
            style={{
              width: 80,
              height: 80,
              background: "#4ecca3",
              borderRadius: 10,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              fontSize: 40,
            }}
          >
            💻
          </div>
          <div style={{ color: "white", marginTop: 10, fontSize: 20 }}>
            Client
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 10,
          }}
        >
          <div style={{ color: "#e94560", fontSize: 20 }}>Request →</div>
          <div style={{ color: "#4ecca3", fontSize: 20 }}>← Response</div>
        </div>

        <div
          style={{
            textAlign: "center",
            transform: `translateX(${interpolate(frame, [20, 40], [20, 0], { extrapolateRight: "clamp" })}px)`,
          }}
        >
          <div
            style={{
              width: 80,
              height: 80,
              background: "#e94560",
              borderRadius: 10,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              fontSize: 40,
            }}
          >
            🖥️
          </div>
          <div style={{ color: "white", marginTop: 10, fontSize: 20 }}>
            Server
          </div>
        </div>
      </div>
    );
  }

  return null;
};
