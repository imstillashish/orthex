import React from "react";
import {
  AbsoluteFill,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { TitleSlide } from "../components/TitleSlide";
import { ContentSlide } from "../components/ContentSlide";
import { CodeExample } from "../components/CodeExample";

export const GitLesson: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#1a1a2e" }}>
      <Sequence from={0} durationInFrames={90}>
        <TitleSlide
          title="Git & GitHub"
          subtitle="Phase 1: Internet & Programming Foundations"
          lessonNumber={4}
        />
      </Sequence>

      <Sequence from={90} durationInFrames={90}>
        <ContentSlide
          title="Why Version Control?"
          content={[
            "Track every change to your code",
            "Collaborate with other developers",
            "Roll back mistakes easily",
            "Branch for experiments",
            "Essential for any developer job",
          ]}
        />
      </Sequence>

      <Sequence from={180} durationInFrames={90}>
        <CodeExample
          title="Essential Git Commands"
          code={`# Initialize a repository
git init

# Check status
git status

# Stage files
git add filename.py
git add .  # stage all

# Commit
git commit -m "Add user authentication"

# Push to GitHub
git push origin main

# Pull latest changes
git pull origin main`}
          language="bash"
        />
      </Sequence>

      <Sequence from={270} durationInFrames={90}>
        <CodeExample
          title="Branching & Merging"
          code={`# Create and switch to branch
git checkout -b feature/login

# Make changes, commit them
git add .
git commit -m "Implement login form"

# Switch back to main
git checkout main

# Merge feature branch
git merge feature/login

# Delete branch (optional)
git branch -d feature/login`}
          language="bash"
        />
      </Sequence>

      <Sequence from={360} durationInFrames={90}>
        <CodeExample
          title="GitHub Workflow"
          code={`# Clone a repository
git clone https://github.com/user/repo.git

# Fork a repo (on GitHub), then clone your fork
git clone https://github.com/youruser/repo.git

# Create a pull request (on GitHub)
# 1. Push your branch
git push origin feature/my-change
# 2. Go to GitHub, click "New Pull Request"
# 3. Describe your changes
# 4. Submit for review`}
          language="bash"
        />
      </Sequence>
    </AbsoluteFill>
  );
};
