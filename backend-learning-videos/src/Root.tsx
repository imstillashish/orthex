import { Composition } from "remotion";
import { InternetLesson } from "./lessons/InternetLesson";
import { PythonLesson } from "./lessons/PythonLesson";
import { GitLesson } from "./lessons/GitLesson";
import { DatabaseLesson } from "./lessons/DatabaseLesson";
import { APILesson } from "./lessons/APILesson";
import { DockerLesson } from "./lessons/DockerLesson";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="lesson-1-internet"
        component={InternetLesson}
        durationInFrames={450}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="lesson-3-python"
        component={PythonLesson}
        durationInFrames={450}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="lesson-4-git"
        component={GitLesson}
        durationInFrames={450}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="lesson-5-database"
        component={DatabaseLesson}
        durationInFrames={450}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="lesson-7-api"
        component={APILesson}
        durationInFrames={450}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="lesson-11-docker"
        component={DockerLesson}
        durationInFrames={450}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
