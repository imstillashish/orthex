#!/bin/bash

# Render all backend learning videos
echo "Rendering Backend Learning Videos..."

# Create output directory
mkdir -p out

# List of lessons
lessons=(
  "lesson-1-internet"
  "lesson-3-python"
  "lesson-4-git"
  "lesson-5-database"
  "lesson-7-api"
  "lesson-11-docker"
)

# Render each lesson
for lesson in "${lessons[@]}"; do
  echo "Rendering $lesson..."
  npx remotion render "$lesson" "out/$lesson.mp4"
  if [ $? -eq 0 ]; then
    echo "✓ $lesson rendered successfully"
  else
    echo "✗ Failed to render $lesson"
  fi
done

# Optimize with ffmpeg for web
echo ""
echo "Optimizing videos for web..."
for lesson in "${lessons[@]}"; do
  if [ -f "out/$lesson.mp4" ]; then
    ffmpeg -i "out/$lesson.mp4" \
      -c:v libx264 -crf 23 -preset medium \
      -c:a aac -b:a 128k \
      -movflags +faststart \
      "out/$lesson-web.mp4" 2>/dev/null
    echo "✓ Optimized $lesson"
  fi
done

echo ""
echo "Done! Videos are in the out/ directory."
ls -lh out/*.mp4
