import {TransitionSeries, linearTiming} from '@remotion/transitions';
import {fade} from '@remotion/transitions/fade';
import {ScreenSlide} from './ScreenSlide';
import screensData from '../screens.json';
import React from 'react';
import {AbsoluteFill} from 'remotion';

export const WalkthroughComposition: React.FC = () => {
  return (
    <AbsoluteFill style={{backgroundColor: '#0a0f1e'}}>
      <TransitionSeries>
        {screensData.screens.map((screen, index) => {
          const fps = 30;
          const durationFrames = screen.duration * fps;
          return (
            <React.Fragment key={screen.id}>
              <TransitionSeries.Sequence durationInFrames={durationFrames}>
                <ScreenSlide
                  title={screen.title}
                  description={screen.description}
                  imagePath={screen.imagePath}
                />
              </TransitionSeries.Sequence>
              {index < screensData.screens.length - 1 && (
                <TransitionSeries.Transition
                  presentation={fade()}
                  timing={linearTiming({durationInFrames: 20})}
                />
              )}
            </React.Fragment>
          );
        })}
      </TransitionSeries>
    </AbsoluteFill>
  );
};
