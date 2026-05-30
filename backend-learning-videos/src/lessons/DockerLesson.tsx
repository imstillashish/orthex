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

export const DockerLesson: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#1a1a2e" }}>
      <Sequence from={0} durationInFrames={90}>
        <TitleSlide
          title="Docker Basics"
          subtitle="Phase 5: DevOps & Deployment"
          lessonNumber={11}
        />
      </Sequence>

      <Sequence from={90} durationInFrames={90}>
        <ContentSlide
          title="Why Docker?"
          content={[
            "Package apps with all dependencies",
            "Works the same everywhere (dev, test, prod)",
            "Isolate applications from each other",
            "Easy scaling and deployment",
            "Industry standard for deployment",
          ]}
          visual="docker"
        />
      </Sequence>

      <Sequence from={180} durationInFrames={90}>
        <CodeExample
          title="Dockerfile - Recipe for Your App"
          code={`# Use Python base image
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Copy requirements first (for caching)
COPY requirements.txt .

# Install dependencies
RUN pip install -r requirements.txt

# Copy application code
COPY . .

# Expose port
EXPOSE 8000

# Run the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]`}
          language="dockerfile"
        />
      </Sequence>

      <Sequence from={270} durationInFrames={90}>
        <CodeExample
          title="Docker Commands"
          code={`# Build an image
docker build -t my-api .

# Run a container
docker run -p 8000:8000 my-api

# List running containers
docker ps

# Stop a container
docker stop <container_id>

# View logs
docker logs <container_id>

# Interactive shell into container
docker exec -it <container_id> bash`}
          language="bash"
        />
      </Sequence>

      <Sequence from={360} durationInFrames={90}>
        <CodeExample
          title="Docker Compose - Multi-Container Apps"
          code={`# docker-compose.yml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/mydb
    depends_on:
      - db

  db:
    image: postgres:15
    environment:
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
      - POSTGRES_DB=mydb
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:`}
          language="yaml"
        />
      </Sequence>
    </AbsoluteFill>
  );
};
