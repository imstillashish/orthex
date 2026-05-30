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

export const DatabaseLesson: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#1a1a2e" }}>
      <Sequence from={0} durationInFrames={90}>
        <TitleSlide
          title="Databases & SQL"
          subtitle="Phase 2: Databases"
          lessonNumber={5}
        />
      </Sequence>

      <Sequence from={90} durationInFrames={90}>
        <ContentSlide
          title="Why Databases?"
          content={[
            "Store data permanently (persistence)",
            "Query data efficiently",
            "Handle multiple users simultaneously",
            "Ensure data integrity",
            "Every app needs a database",
          ]}
          visual="database"
        />
      </Sequence>

      <Sequence from={180} durationInFrames={90}>
        <CodeExample
          title="SQL Basics - CRUD Operations"
          code={`-- CREATE (Insert data)
INSERT INTO users (name, email, age)
VALUES ('Alice', 'alice@example.com', 25);

-- READ (Query data)
SELECT * FROM users;
SELECT name, email FROM users WHERE age > 21;

-- UPDATE (Modify data)
UPDATE users SET age = 26 WHERE name = 'Alice';

-- DELETE (Remove data)
DELETE FROM users WHERE name = 'Alice';`}
          language="sql"
        />
      </Sequence>

      <Sequence from={270} durationInFrames={90}>
        <CodeExample
          title="Table Design"
          code={`-- Create a users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    age INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create a posts table
CREATE TABLE posts (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    content TEXT,
    user_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`}
          language="sql"
        />
      </Sequence>

      <Sequence from={360} durationInFrames={90}>
        <CodeExample
          title="Joins - Connecting Tables"
          code={`-- Get posts with user names
SELECT posts.title, users.name
FROM posts
JOIN users ON posts.user_id = users.id;

-- Get all users and their posts (even if no posts)
SELECT users.name, posts.title
FROM users
LEFT JOIN posts ON users.id = posts.user_id;

-- Count posts per user
SELECT users.name, COUNT(posts.id) as post_count
FROM users
LEFT JOIN posts ON users.id = posts.user_id
GROUP BY users.name;`}
          language="sql"
        />
      </Sequence>
    </AbsoluteFill>
  );
};
