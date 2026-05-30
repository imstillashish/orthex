import {Composition} from 'remotion';
import {WalkthroughComposition} from './WalkthroughComposition';
import screensData from '../screens.json';

const FPS = 30;
const totalFrames = screensData.screens.reduce((acc, s) => acc + (s.duration * FPS), 0);

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="WalkthroughComposition"
        component={WalkthroughComposition}
        durationInFrames={totalFrames}
        fps={FPS}
        width={1280}
        height={720}
      />
    </>
  );
};
