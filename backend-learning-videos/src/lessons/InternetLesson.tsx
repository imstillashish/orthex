import React from "react";
import {
  AbsoluteFill,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";
import { TitleSlide } from "../components/TitleSlide";
import { ContentSlide } from "../components/ContentSlide";
import { CodeExample } from "../components/CodeExample";
import { DiagramSlide } from "../components/DiagramSlide";
import { SummarySlide } from "../components/SummarySlide";

export const InternetLesson: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{ backgroundColor: "#1a1a2e" }}>
      {/* Title Section */}
      <Sequence from={0} durationInFrames={90}>
        <TitleSlide
          title="How the Internet Works"
          subtitle="Phase 1: Internet & Programming Foundations"
          lessonNumber={1}
        />
      </Sequence>

      {/* DNS Explanation */}
      <Sequence from={90} durationInFrames={90}>
        <ContentSlide
          title="DNS: The Internet's Phone Book"
          content={[
            "DNS (Domain Name System) translates domain names to IP addresses",
            "Like looking up 'Alice' in a phone book to find her number",
            "Example: google.com → 142.250.80.46",
            "Without DNS, you'd need to memorize numbers for every website",
          ]}
          visual="dns"
        />
      </Sequence>

      {/* HTTP/HTTPS */}
      <Sequence from={180} durationInFrames={90}>
        <ContentSlide
          title="HTTP & HTTPS"
          content={[
            "HTTP: HyperText Transfer Protocol - request/response system",
            "Client sends request → Server sends response",
            "HTTPS: Secure version with encryption (TLS/SSL)",
            "Port 80: HTTP, Port 443: HTTPS",
          ]}
          visual="http"
        />
      </Sequence>

      {/* Request Flow Diagram */}
      <Sequence from={270} durationInFrames={90}>
        <DiagramSlide
          title="What Happens When You Visit a Website"
          steps={[
            "1. Browser checks cache for IP address",
            "2. DNS resolver finds the IP",
            "3. TCP connection established",
            "4. TLS handshake (HTTPS)",
            "5. Browser sends GET request",
            "6. Server responds with HTML",
            "7. Browser renders the page",
          ]}
        />
      </Sequence>

      {/* Code Example */}
      <Sequence from={360} durationInFrames={90}>
        <CodeExample
          title="Try It Yourself"
          code={`# DNS lookup
nslookup example.com

# See connection details
curl -v https://example.com

# Find your IP
curl ifconfig.me

# Trace route to a server
traceroute google.com`}
          language="bash"
        />
      </Sequence>
    </AbsoluteFill>
  );
};
