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

export const APILesson: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#1a1a2e" }}>
      <Sequence from={0} durationInFrames={90}>
        <TitleSlide
          title="Building REST APIs"
          subtitle="Phase 3: Backend Language Deep Dive"
          lessonNumber={7}
        />
      </Sequence>

      <Sequence from={90} durationInFrames={90}>
        <ContentSlide
          title="What is a REST API?"
          content={[
            "REST = Representational State Transfer",
            "Architecture style for web services",
            "Uses HTTP methods (GET, POST, PUT, DELETE)",
            "Returns JSON data",
            "The backbone of modern web apps",
          ]}
          visual="api"
        />
      </Sequence>

      <Sequence from={180} durationInFrames={90}>
        <CodeExample
          title="FastAPI - Your First API"
          code={`from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

# Define a data model
class User(BaseModel):
    name: str
    email: str
    age: int

# In-memory database (for learning)
users = []

# GET endpoint - retrieve all users
@app.get("/users")
def get_users():
    return users

# POST endpoint - create a user
@app.post("/users")
def create_user(user: User):
    users.append(user)
    return {"message": "User created", "user": user}

# GET endpoint - single user by ID
@app.get("/users/{user_id}")
def get_user(user_id: int):
    if user_id < len(users):
        return users[user_id]
    return {"error": "User not found"}`}
          language="python"
        />
      </Sequence>

      <Sequence from={270} durationInFrames={90}>
        <CodeExample
          title="Running Your API"
          code={`# Install FastAPI and uvicorn
pip install fastapi uvicorn

# Save the code above as main.py

# Run the server
uvicorn main:app --reload

# Open browser to:
# http://localhost:8000/docs

# You'll see the auto-generated API docs!
# Try creating and fetching users.`}
          language="bash"
        />
      </Sequence>

      <Sequence from={360} durationInFrames={90}>
        <CodeExample
          title="Testing Your API"
          code={`# Test with curl commands

# Create a user
curl -X POST http://localhost:8000/users \\
  -H "Content-Type: application/json" \\
  -d '{"name": "Alice", "email": "alice@example.com", "age": 25}'

# Get all users
curl http://localhost:8000/users

# Get specific user
curl http://localhost:8000/users/0`}
          language="bash"
        />
      </Sequence>
    </AbsoluteFill>
  );
};
