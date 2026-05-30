import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";

interface CodeExampleProps {
  title: string;
  code: string;
  language: string;
}

export const CodeExample: React.FC<CodeExampleProps> = ({
  title,
  code,
  language,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const codeOpacity = interpolate(frame, [20, 40], [0, 1], {
    extrapolateRight: "clamp",
  });

  const codeSlide = spring({
    frame: frame - 20,
    fps,
    config: { damping: 12, stiffness: 100 },
  });

  // Simple syntax highlighting
  const highlightCode = (text: string) => {
    return text.split("\n").map((line, i) => {
      // Comments
      if (line.trim().startsWith("#")) {
        return (
          <div key={i} style={{ color: "#6a9955" }}>
            {line}
          </div>
        );
      }
      // Commands
      const parts = line.split(/(\s+)/);
      return (
        <div key={i}>
          {parts.map((part, j) => {
            if (
              [
                "nslookup",
                "curl",
                "traceroute",
                "tracert",
                "git",
                "npm",
                "python",
              ].includes(part)
            ) {
              return (
                <span key={j} style={{ color: "#dcdcaa" }}>
                  {part}
                </span>
              );
            }
            if (part.startsWith("-")) {
              return (
                <span key={j} style={{ color: "#9cdcfe" }}>
                  {part}
                </span>
              );
            }
            if (part.startsWith("http") || part.includes(".")) {
              return (
                <span key={j} style={{ color: "#ce9178" }}>
                  {part}
                </span>
              );
            }
            return (
              <span key={j} style={{ color: "#d4d4d4" }}>
                {part}
              </span>
            );
          })}
        </div>
      );
    });
  };

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
          marginBottom: 40,
        }}
      >
        {title}
      </h2>

      {/* Code block */}
      <div
        style={{
          opacity: codeOpacity,
          transform: `translateY(${interpolate(codeSlide, [0, 1], [30, 0])}px)`,
          background: "#1e1e1e",
          borderRadius: 16,
          padding: 40,
          fontFamily: "'Fira Code', 'Consolas', monospace",
          fontSize: 28,
          lineHeight: 1.6,
          border: "1px solid #333",
          maxWidth: 1000,
        }}
      >
        {/* Terminal header */}
        <div
          style={{
            display: "flex",
            gap: 8,
            marginBottom: 20,
            paddingBottom: 15,
            borderBottom: "1px solid #333",
          }}
        >
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              background: "#ff5f56",
            }}
          />
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              background: "#ffbd2e",
            }}
          />
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              background: "#27c93f",
            }}
          />
          <span style={{ color: "#666", marginLeft: 10 }}>Terminal</span>
        </div>

        {/* Code content */}
        <div style={{ color: "#d4d4d4" }}>{highlightCode(code)}</div>
      </div>

      {/* Tip */}
      <div
        style={{
          marginTop: 30,
          padding: "15px 25px",
          background: "rgba(78, 204, 163, 0.1)",
          borderLeft: "4px solid #4ecca3",
          borderRadius: 8,
          opacity: interpolate(frame, [50, 70], [0, 1], {
            extrapolateRight: "clamp",
          }),
        }}
      >
        <p style={{ color: "#4ecca3", margin: 0, fontSize: 24 }}>
          💡 Try these commands in your terminal to see them in action!
        </p>
      </div>
    </AbsoluteFill>
  );
};
