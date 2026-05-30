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
import { SummarySlide } from "../components/SummarySlide";

export const PythonLesson: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{ backgroundColor: "#1a1a2e" }}>
      {/* Title Section */}
      <Sequence from={0} durationInFrames={90}>
        <TitleSlide
          title="Python Fundamentals"
          subtitle="Phase 1: Internet & Programming Foundations"
          lessonNumber={3}
        />
      </Sequence>

      {/* Why Python */}
      <Sequence from={90} durationInFrames={90}>
        <ContentSlide
          title="Why Python for Backend?"
          content={[
            "Readable syntax - feels like English",
            "Huge ecosystem - libraries for everything",
            "Great for APIs (FastAPI, Flask)",
            "In-demand job market",
            "Perfect for beginners",
          ]}
          visual="python"
        />
      </Sequence>

      {/* Variables & Types */}
      <Sequence from={180} durationInFrames={90}>
        <CodeExample
          title="Variables & Data Types"
          code={`# Variables - no type declaration needed
name = "Alice"          # str
age = 25                # int
height = 5.7            # float
is_student = True       # bool

# Lists (arrays)
languages = ["Python", "JavaScript", "Go"]

# Dictionaries (objects)
user = {
    "name": "Alice",
    "age": 25,
    "skills": ["Python", "SQL"]
}

# Print them
print(f"Name: {name}")
print(f"User: {user}")`}
          language="python"
        />
      </Sequence>

      {/* Control Flow */}
      <Sequence from={270} durationInFrames={90}>
        <CodeExample
          title="Control Flow"
          code={`# If/elif/else
age = 25

if age >= 18:
    print("Adult")
elif age >= 13:
    print("Teenager")
else:
    print("Child")

# For loops
for i in range(5):
    print(f"Count: {i}")

# While loops
count = 0
while count < 5:
    print(f"Count: {count}")
    count += 1`}
          language="python"
        />
      </Sequence>

      {/* Functions */}
      <Sequence from={360} durationInFrames={90}>
        <CodeExample
          title="Functions"
          code={`# Basic function
def greet(name):
    return f"Hello, {name}!"

# Function with default value
def introduce(name, age=25):
    return f"I'm {name}, {age} years old"

# Lambda (anonymous function)
add = lambda x, y: x + y

# Using them
print(greet("Alice"))
print(introduce("Bob", 30))
print(add(5, 3))  # Output: 8`}
          language="python"
        />
      </Sequence>
    </AbsoluteFill>
  );
};
