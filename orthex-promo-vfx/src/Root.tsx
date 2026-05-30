import { Composition } from "remotion";
import { Scene } from "./Scene";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="PromoLandscape"
        component={Scene}
        durationInFrames={900}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
